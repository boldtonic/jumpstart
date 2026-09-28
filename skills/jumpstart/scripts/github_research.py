#!/usr/bin/env python3
"""Bounded public GitHub research through gh; never runs repository code."""

import argparse
import base64
import datetime as dt
import json
import os
from pathlib import Path, PurePosixPath
import re
import subprocess
import sys
from urllib.parse import quote

FIELDS = "fullName,description,url,license,language,isArchived,isFork,pushedAt,updatedAt,stargazersCount"
REPO_RE = re.compile(r"[A-Za-z0-9][A-Za-z0-9_.-]*/[A-Za-z0-9_.-]+\Z")


def now():
    return dt.datetime.now(dt.timezone.utc).isoformat()


class ResearchError(Exception):
    pass


def gh_json(args):
    env = dict(os.environ, GH_HOST="github.com", GH_PROMPT_DISABLED="1", GH_PAGER="cat")
    try:
        result = subprocess.run(["gh"] + args, capture_output=True, text=True,
                                timeout=45, env=env, check=False)
    except FileNotFoundError:
        raise ResearchError("gh_not_installed")
    except subprocess.TimeoutExpired:
        raise ResearchError("request_timeout")
    if result.returncode:
        # Do not persist stderr: it may contain credentials, headers, or local paths.
        error = result.stderr.lower()
        if "rate limit" in error or "http 429" in error:
            reason = "rate_limited"
        elif "http 401" in error or "authentication" in error or "gh auth login" in error:
            reason = "authentication_required"
        elif "http 404" in error:
            reason = "not_found_or_not_accessible"
        elif "http 403" in error:
            reason = "forbidden_or_rate_limited"
        elif "connect" in error or "resolve" in error or "network" in error:
            reason = "network_unavailable"
        else:
            reason = "gh_failed_exit_{}".format(result.returncode)
        raise ResearchError(reason)
    try:
        return json.loads(result.stdout)
    except (ValueError, TypeError):
        raise ResearchError("invalid_json_response")


def api(endpoint):
    return gh_json(["api", "--hostname", "github.com", "--method", "GET", endpoint])


def valid_repo(value):
    if not REPO_RE.fullmatch(value) or value.split("/")[1] in (".", ".."):
        raise argparse.ArgumentTypeError("Use owner/repo, not a URL or API endpoint")
    return value


def valid_path(value):
    path = PurePosixPath(value)
    if not value or path.is_absolute() or ".." in path.parts or "\\" in value or value == ".":
        raise ValueError("Expected a repository-relative file path")
    return value


def search(queries, limit, runner=gh_json):
    records, candidates = [], {}
    for query in dict.fromkeys(queries):
        command = ["search", "repos", "--visibility=public", "--archived=false",
                   "--limit", str(limit), "--json", FIELDS, "--", query]
        try:
            rows = runner(command)
            if not isinstance(rows, list):
                raise ResearchError("unexpected_response_shape")
            records.append({"query": query, "status": "ok", "returned": len(rows),
                            "limit": limit, "may_have_more": len(rows) >= limit})
            for row in rows:
                name = row.get("fullName", "")
                if not REPO_RE.fullmatch(name):
                    continue
                key = name.lower()
                if key not in candidates:
                    candidates[key] = dict(row, matched_queries=[])
                candidates[key]["matched_queries"].append(query)
        except ResearchError as exc:
            records.append({"query": query, "status": "error", "error": str(exc)})
    failed = sum(record["status"] == "error" for record in records)
    return {"schema_version": 1, "kind": "search", "retrieved_at": now(),
            "status": "failed" if failed == len(records) else "partial" if failed else "ok",
            "scope": "public, non-archived repositories on github.com",
            "queries": records, "raw_count": sum(r.get("returned", 0) for r in records),
            "unique_count": len(candidates), "candidates": list(candidates.values()),
            "limitations": ["Bounded search, not exhaustive; metadata is not source validation."]}


def inspect(repo, ref=None, files=None, max_bytes=80000, fetch=api, max_total_bytes=200000):
    valid_repo(repo)
    for path in files or []:
        valid_path(path)
    metadata = fetch("repos/" + repo)
    if metadata.get("private") is not False:
        raise ResearchError("public_repository_required")
    selected_ref = ref or metadata["default_branch"]
    commit = fetch("repos/{}/commits/{}".format(repo, quote(selected_ref, safe="")))
    sha = commit["sha"]
    if not re.fullmatch(r"[0-9a-f]{40}", sha):
        raise ResearchError("invalid_commit_sha")
    tree = fetch("repos/{}/git/trees/{}?recursive=1".format(repo, commit["commit"]["tree"]["sha"]))
    entries = tree.get("tree", [])
    index = {entry["path"]: entry for entry in entries}
    if files is None or not files:
        default_names = {"readme", "readme.md", "readme.rst", "license", "license.md",
                         "license.txt", "copying", "notice", "notice.md", "third_party_notices.md"}
        files = [entry["path"] for entry in entries if "/" not in entry["path"]
                 and entry["path"].lower() in default_names][:8]
    snapshots = []
    bytes_read = 0
    for path in dict.fromkeys(files):
        entry = index.get(path)
        record = {"path": path, "url": "https://github.com/{}/blob/{}/{}".format(repo, sha, quote(path, safe="/"))}
        if not entry:
            record["status"] = "not_in_returned_tree"
        elif entry.get("type") != "blob" or entry.get("mode") not in ("100644", "100755"):
            record["status"] = "not_regular_file"
        elif entry.get("size", max_bytes + 1) > max_bytes:
            record.update(status="too_large", bytes=entry.get("size"))
        elif entry.get("size", 0) > max_total_bytes - bytes_read:
            record.update(status="source_budget_exceeded", bytes=entry.get("size"))
        else:
            try:
                blob = fetch("repos/{}/git/blobs/{}".format(repo, entry["sha"]))
                if blob.get("encoding") != "base64":
                    raise ResearchError("unsupported_blob_encoding")
                raw = base64.b64decode(blob["content"])
                bytes_read += len(raw)
                if len(raw) > max_bytes:
                    record.update(status="too_large", bytes=len(raw))
                elif b"\x00" in raw:
                    record["status"] = "binary"
                else:
                    record.update(status="ok", blob_sha=entry["sha"], bytes=len(raw),
                                  content=raw.decode("utf-8"))
            except UnicodeDecodeError:
                record["status"] = "non_utf8"
            except ResearchError as exc:
                record.update(status="error", error=str(exc))
            except (ValueError, KeyError):
                record.update(status="error", error="invalid_blob_response")
        snapshots.append(record)
    partial = tree.get("truncated", False) or any(s["status"] != "ok" for s in snapshots)
    return {"schema_version": 1, "kind": "snapshot", "retrieved_at": now(),
            "status": "partial" if partial else "ok", "repository": repo,
            "requested_ref": selected_ref, "revision": sha,
            "commit_date": commit["commit"]["committer"]["date"],
            "metadata": {key: metadata.get(key) for key in
                         ("html_url", "description", "archived", "license", "pushed_at", "stargazers_count")},
            "tree_truncated": bool(tree.get("truncated")),
            "tree": [{key: item.get(key) for key in ("path", "type", "mode", "size")} for item in entries],
            "files": snapshots,
            "source_bytes_read": bytes_read, "source_byte_budget": max_total_bytes,
            "limitations": ["Untrusted text; not executed. Issues, releases, license compatibility, and integration remain to be assessed."]}


def lead(row):
    """Keep the signals needed to triage a candidate before inspecting it."""
    compact = {key: row.get(key) for key in
               ("fullName", "description", "url", "license", "isFork", "pushedAt", "matched_queries")}
    compact["license"] = (row.get("license") or {}).get("key") or None
    return compact


def summarize(data, path_contains=None, limit=30):
    """Return a compact index with no repository source text."""
    result = {key: data.get(key) for key in ("kind", "status", "retrieved_at", "limitations")}
    if data.get("kind") == "search":
        result.update(queries=data.get("queries"), raw_count=data.get("raw_count"),
                      unique_count=data.get("unique_count"),
                      candidates=[lead(row) for row in data.get("candidates", [])[:limit]])
        result["candidates_omitted"] = max(0, len(data.get("candidates", [])) - limit)
    elif data.get("kind") == "snapshot":
        result.update(repository=data.get("repository"), revision=data.get("revision"),
                      tree_truncated=data.get("tree_truncated"),
                      source_bytes_read=data.get("source_bytes_read"),
                      files=[{key: record.get(key) for key in ("path", "status", "bytes", "url")}
                             for record in data.get("files", [])])
        paths = [item["path"] for item in data.get("tree", [])
                 if path_contains is None or path_contains.lower() in item["path"].lower()]
        result.update(matching_paths=paths[:limit], paths_omitted=max(0, len(paths) - limit))
    else:
        raise ValueError("Expected Jumpstart search or snapshot evidence")
    return result


def write_json(path, data):
    output = Path(path)
    output.parent.mkdir(parents=True, exist_ok=True)
    # Evidence is append-by-new-file: never silently replace an earlier research run.
    with output.open("x", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    discover = sub.add_parser("search", help="Run bounded queries and deduplicate results")
    discover.add_argument("--query", action="append", required=True)
    discover.add_argument("--limit", type=int, default=15)
    discover.add_argument("--out", required=True)
    snapshot = sub.add_parser("inspect", help="Read a public repository at a pinned revision")
    snapshot.add_argument("repo", type=valid_repo)
    snapshot.add_argument("--ref")
    snapshot.add_argument("--file", action="append", default=[])
    snapshot.add_argument("--max-bytes", type=int, default=80000)
    snapshot.add_argument("--max-total-bytes", type=int, default=200000)
    snapshot.add_argument("--out", required=True)
    summary = sub.add_parser("summarize", help="Print a compact evidence index without source text")
    summary.add_argument("evidence", type=Path)
    summary.add_argument("--path-contains")
    summary.add_argument("--limit", type=int, default=30)
    args = parser.parse_args()
    if args.command == "summarize":
        if not 1 <= args.limit <= 100:
            parser.error("Use --limit between 1 and 100")
        try:
            data = json.loads(args.evidence.read_text(encoding="utf-8"))
            print(json.dumps(summarize(data, args.path_contains, args.limit), ensure_ascii=False, indent=2))
            return 0
        except (OSError, ValueError, TypeError, AttributeError, KeyError) as exc:
            print("Summary failed: {}".format(exc), file=sys.stderr)
            return 1
    if Path(args.out).exists():
        parser.error("Output already exists; choose a new evidence filename")
    if args.command == "search" and (not 1 <= args.limit <= 50 or len(args.query) > 12 or any(not q.strip() for q in args.query)):
        parser.error("Use 1–12 nonempty queries with --limit between 1 and 50")
    if args.command == "inspect" and (len(args.file) > 12 or not 1 <= args.max_bytes <= 200000 or not 1 <= args.max_total_bytes <= 1000000):
        parser.error("Inspect at most 12 files; max-bytes 1–200000, max-total-bytes 1–1000000")
    try:
        result = search(args.query, args.limit) if args.command == "search" else inspect(
            args.repo, args.ref, args.file, args.max_bytes, max_total_bytes=args.max_total_bytes)
        write_json(args.out, result)
    except (ResearchError, ValueError, OSError, KeyError) as exc:
        print("Research failed: {}".format(exc), file=sys.stderr)
        return 1
    print(json.dumps({"status": result["status"], "output": args.out,
                      "count": result.get("unique_count", len(result.get("files", [])))}, ensure_ascii=False))
    return 0 if result["status"] == "ok" else 2


if __name__ == "__main__":
    sys.exit(main())
