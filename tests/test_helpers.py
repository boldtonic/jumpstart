import base64
import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

SCRIPTS = Path(__file__).resolve().parents[1] / "plugins" / "jumpstart" / "skills" / "jumpstart" / "scripts"


def load(name):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / (name + ".py"))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


research = load("github_research")
provenance = load("provenance")


class ResearchTests(unittest.TestCase):
    def test_deduplicates_case_insensitively_and_keeps_query_evidence(self):
        rows = iter([[{"fullName": "Org/Repo"}], [{"fullName": "org/repo"}]])
        result = research.search(["first", "second", "first"], 3, lambda _: next(rows))
        self.assertEqual(result["raw_count"], 2)
        self.assertEqual(result["unique_count"], 1)
        self.assertEqual(result["candidates"][0]["matched_queries"], ["first", "second"])

    def test_failure_is_not_empty_success(self):
        def fail(_):
            raise research.ResearchError("rate_limited")
        result = research.search(["one"], 3, fail)
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["queries"][0]["error"], "rate_limited")
        self.assertEqual(research.search(["one"], 3, lambda _: [])["status"], "ok")

    def test_partial_search_preserves_successful_results(self):
        def runner(command):
            if command[-1] == "fail":
                raise research.ResearchError("network_unavailable")
            return [{"fullName": "org/repo"}]
        result = research.search(["ok", "fail"], 3, runner)
        self.assertEqual(result["status"], "partial")
        self.assertEqual(result["unique_count"], 1)

    def test_query_is_one_argument_after_separator(self):
        commands = []
        query = '-topic:demo $(echo secret); "test"'
        research.search([query], 3, lambda command: commands.append(command) or [])
        self.assertEqual(commands[0][-2:], ["--", query])
        self.assertIn("--visibility=public", commands[0])

    def test_error_output_does_not_leak_stderr(self):
        result = subprocess.CompletedProcess([], 1, "", "HTTP 401 secret-token-value")
        with patch.object(research.subprocess, "run", return_value=result):
            with self.assertRaisesRegex(research.ResearchError, "^authentication_required$"):
                research.gh_json(["api", "test"])

    def test_snapshot_pins_revision_skips_large_and_symlink_files(self):
        sha = "a" * 40
        called = []
        def fetch(endpoint):
            called.append(endpoint)
            if endpoint == "repos/org/repo":
                return {"private": False, "default_branch": "main"}
            if "/commits/" in endpoint:
                return {"sha": sha, "commit": {"tree": {"sha": "b" * 40}, "committer": {"date": "2026-01-01"}}}
            if "/git/trees/" in endpoint:
                return {"truncated": False, "tree": [
                    {"path": "src.py", "type": "blob", "mode": "100644", "size": 4, "sha": "c" * 40},
                    {"path": "huge", "type": "blob", "mode": "100644", "size": 1000000, "sha": "d" * 40},
                    {"path": "link", "type": "blob", "mode": "120000", "size": 4, "sha": "e" * 40}]}
            return {"encoding": "base64", "content": base64.b64encode(b"pass").decode()}
        result = research.inspect("org/repo", files=["src.py", "huge", "link", "absent"], fetch=fetch)
        self.assertEqual(result["revision"], sha)
        self.assertIn("/blob/" + sha + "/", result["files"][0]["url"])
        self.assertEqual([f["status"] for f in result["files"]], ["ok", "too_large", "not_regular_file", "not_in_returned_tree"])
        self.assertEqual(len([c for c in called if "/git/blobs/" in c]), 1)
        self.assertEqual(result["status"], "partial")

    def test_private_repo_rejected_before_reading_source(self):
        with self.assertRaisesRegex(research.ResearchError, "public_repository_required"):
            research.inspect("org/repo", fetch=lambda _: {"private": True})

    def test_summary_omits_source_text_and_bounds_paths(self):
        data = {"kind": "snapshot", "tree": [{"path": "test_a"}, {"path": "test_b"}, {"path": "source"}],
                "files": [{"path": "source", "status": "ok", "content": "PRIVATE_SENTINEL"}]}
        result = research.summarize(data, "test", 1)
        self.assertNotIn("PRIVATE_SENTINEL", json.dumps(result))
        self.assertEqual(result["matching_paths"], ["test_a"])
        self.assertEqual(result["paths_omitted"], 1)

    def test_search_summary_keeps_license_fork_and_activity(self):
        data = {"kind": "search", "candidates": [
            {"fullName": "org/licensed", "license": {"key": "mit", "name": "MIT License", "url": ""},
             "isFork": False, "pushedAt": "2026-08-21T04:48:29Z"},
            {"fullName": "org/unlicensed", "license": {"key": "", "name": "", "url": ""},
             "isFork": True, "pushedAt": "2020-01-01T00:00:00Z"},
            {"fullName": "org/sparse"}]}
        rows = research.summarize(data)["candidates"]
        self.assertEqual([(r["license"], r["isFork"], r["pushedAt"]) for r in rows],
                         [("mit", False, "2026-08-21T04:48:29Z"), (None, True, "2020-01-01T00:00:00Z"),
                          (None, None, None)])

    def test_total_source_budget_stops_additional_blob_reads(self):
        calls = []
        def fetch(endpoint):
            if endpoint == "repos/org/repo":
                return {"private": False, "default_branch": "main"}
            if "/commits/" in endpoint:
                return {"sha": "a" * 40, "commit": {"tree": {"sha": "b" * 40}, "committer": {"date": "2026-01-01"}}}
            if "/git/trees/" in endpoint:
                return {"tree": [{"path": p, "type": "blob", "mode": "100644", "size": 4, "sha": "c" * 40} for p in ("one", "two")]}
            calls.append(endpoint)
            return {"encoding": "base64", "content": base64.b64encode(b"pass").decode()}
        result = research.inspect("org/repo", files=["one", "two"], fetch=fetch, max_total_bytes=5)
        self.assertEqual(len(calls), 1)
        self.assertEqual(result["files"][1]["status"], "source_budget_exceeded")
        self.assertEqual(result["status"], "partial")

    def test_invalid_paths_rejected_before_network(self):
        with self.assertRaises(ValueError):
            research.inspect("org/repo", files=["../secret"], fetch=lambda _: self.fail("No network expected"))

    def test_evidence_is_not_overwritten(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "run.json"
            research.write_json(path, {"original": True})
            with self.assertRaises(FileExistsError):
                research.write_json(path, {"original": False})
            self.assertTrue(json.loads(path.read_text())["original"])


class ProvenanceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / "module.py").write_text("pass\n")
        (self.root / "LICENSE.upstream").write_text("preserved license text\n")
        self.data = {"schema_version": 1, "project": "Test", "components": [{
            "name": "Parser", "repository": "https://github.com/org/repo", "revision": "a" * 40,
            "mode": "adapted", "role": "Parse documents", "source_paths": ["src/parser.py"],
            "target_paths": ["module.py"], "modifications": ["Removed unused UI"],
            "update_strategy": "Review upstream changes before manual updates",
            "license": {"status": "verified", "expression": "MIT", "evidence_urls": ["https://github.com/org/repo/blob/" + "a" * 40 + "/LICENSE"],
                        "preserved_files": ["LICENSE.upstream"], "notes": "Test fixture only"}}]}

    def test_complete_record_renders_pinned_sources_and_modifications(self):
        self.assertEqual(provenance.validate(self.data, self.root, True), ([], []))
        output = provenance.render(self.data)
        self.assertIn("Removed unused UI", output)
        self.assertIn("/blob/" + "a" * 40 + "/src/parser.py", output)
        self.assertIn("LICENSE.upstream", output)

    def test_missing_target_fails(self):
        (self.root / "module.py").unlink()
        errors, _ = provenance.validate(self.data, self.root)
        self.assertTrue(any("missing local target" in e for e in errors))

    def test_strict_requires_preserved_notices_and_resolved_license(self):
        license_info = self.data["components"][0]["license"]
        license_info.update(status="unresolved", expression="unknown", preserved_files=[])
        errors, warnings = provenance.validate(self.data, self.root)
        self.assertFalse(errors)
        self.assertEqual(len(warnings), 2)
        strict_errors, _ = provenance.validate(self.data, self.root, True)
        self.assertEqual(len(strict_errors), 2)

    def test_escape_and_symlink_escape_rejected(self):
        for path in ("../outside", "/tmp/outside"):
            with self.assertRaises(ValueError):
                provenance.local_path(self.root, path)
        (self.root / "outside").symlink_to(self.root.parent, target_is_directory=True)
        with self.assertRaises(ValueError):
            provenance.local_path(self.root, "outside/file")

    def test_dependency_requires_version_and_package(self):
        self.data["components"][0]["mode"] = "dependency"
        errors, _ = provenance.validate(self.data, self.root)
        self.assertTrue(any("require version" in e for e in errors))
        self.assertTrue(any("require package" in e for e in errors))

    def test_mutable_ref_not_accepted_as_revision(self):
        self.data["components"][0]["revision"] = "main"
        errors, _ = provenance.validate(self.data, self.root)
        self.assertTrue(any("full commit SHA" in e for e in errors))

    def test_upstream_paths_are_independent_of_local_symlinks(self):
        (self.root / "src").symlink_to(self.root.parent, target_is_directory=True)
        self.assertEqual(provenance.validate(self.data, self.root, True), ([], []))

    def test_verified_license_cannot_be_unknown_with_whitespace(self):
        self.data["components"][0]["license"]["expression"] = " unknown "
        errors, _ = provenance.validate(self.data, self.root, True)
        self.assertTrue(any("observed expression" in e for e in errors))

    def test_invalid_types_report_errors_without_crashing(self):
        for value in (None, 23, {}, []):
            data = copy.deepcopy(self.data)
            data["components"][0]["license"]["expression"] = value
            errors, _ = provenance.validate(data, self.root)
            self.assertTrue(errors)


if __name__ == "__main__":
    unittest.main()
