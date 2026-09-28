import importlib.util
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

from mcp import Client, StdioServerParameters

SERVER_PATH = Path(__file__).with_name("server.py")
spec = importlib.util.spec_from_file_location("jumpstart_mcp_test", SERVER_PATH)
server = importlib.util.module_from_spec(spec)
spec.loader.exec_module(server)


def snapshot(content="one\ntwo\nthree"):
    return {"kind": "snapshot", "status": "ok", "revision": "a" * 40,
            "repository": "org/repo", "tree": [{"path": "src/demo.py"}],
            "files": [{"path": "src/demo.py", "status": "ok", "content": content,
                       "url": "https://github.com/org/repo/blob/" + "a" * 40 + "/src/demo.py"}]}


class BridgeTests(unittest.TestCase):
    def setUp(self):
        server.evidence.clear()

    def test_guides_are_shared_source_not_divergent_copies(self):
        self.assertIn((server.SKILL / "SKILL.md").read_text(), server.jumpstart_guide())
        with self.assertRaises(server.ToolError):
            server.jumpstart_guide("../../etc/passwd")

    def test_missing_brief_keeps_target_resolution_instructions(self):
        result = server.jumpstart()
        self.assertIn("no product can be identified", result)
        self.assertIn('"project": ""', result)

    def test_source_reads_only_cached_exact_paths(self):
        identifier = server.remember(snapshot())
        self.assertEqual(server.jumpstart_evidence(identifier, "src/demo.py", 2, 1)["content"], "two")
        self.assertEqual(server.jumpstart_evidence(identifier, "/etc/passwd")["status"], "not_fetched")
        self.assertEqual(server.jumpstart_evidence("missing")["status"], "unavailable")

    def test_cache_is_bounded_and_eviction_explicit(self):
        first = server.remember(snapshot())
        for _ in range(server.MAX_RECORDS):
            server.remember(snapshot())
        self.assertEqual(len(server.evidence), server.MAX_RECORDS)
        self.assertEqual(server.jumpstart_evidence(first)["status"], "unavailable")

    def test_long_source_line_is_clipped_and_disclosed(self):
        identifier = server.remember(snapshot("x" * 20000))
        result = server.jumpstart_evidence(identifier, "src/demo.py")
        self.assertEqual(len(result["content"]), 16000)
        self.assertTrue(result["text_truncated"])
        tail = server.jumpstart_evidence(identifier, "src/demo.py", character_offset=result["next_character_offset"])
        self.assertEqual(result["content"] + tail["content"], "x" * 20000)
        self.assertFalse(tail["text_truncated"])
        self.assertIsNone(tail["next_character_offset"])
        self.assertEqual(tail["window_line_count"], 1)

    def test_every_search_candidate_can_be_retrieved(self):
        data = {"kind": "search", "status": "ok", "candidates": [
            {"fullName": f"org/repo{i}"} for i in range(120)]}
        identifier = server.remember(data)
        first = server.jumpstart_evidence(identifier)
        second = server.jumpstart_evidence(identifier, index_offset=first["next_index_offset"])
        names = [c["fullName"] for c in first["candidates"] + second["candidates"]]
        self.assertEqual(names, [f"org/repo{i}" for i in range(120)])
        self.assertEqual(first["index_total"], 120)
        self.assertIsNone(second["next_index_offset"])

    def test_filtered_tree_pagination_does_not_skip_paths(self):
        data = snapshot()
        data["tree"] = [{"path": f"src/code{i}.py"} for i in range(70)] + [{"path": "README.md"}]
        identifier = server.remember(data)
        first = server.jumpstart_evidence(identifier, path_contains="src/")
        second = server.jumpstart_evidence(identifier, path_contains="src/", index_offset=first["next_index_offset"])
        self.assertEqual(first["index_total"], 70)
        self.assertEqual(len(first["matching_paths"]) + len(second["matching_paths"]), 70)
        self.assertIsNone(second["next_index_offset"])

    def test_invalid_inputs_do_not_start_network_requests(self):
        with patch.object(server.research, "search") as mocked:
            for queries, limit in [([], 10), (["a"] * 7, 10), ([""], 10), (["a"], 99)]:
                with self.assertRaises(server.ToolError):
                    server.jumpstart_search(queries, limit)
            mocked.assert_not_called()

    def test_backend_failure_stays_failure(self):
        with patch.object(server.research, "inspect", side_effect=server.research.ResearchError("network_unavailable")):
            self.assertEqual(server.jumpstart_inspect("org/repo"), {"status": "failed", "error": "network_unavailable"})

    def test_search_results_are_summarized_and_retrievable(self):
        data = {"kind": "search", "status": "ok", "queries": [], "candidates": [{"fullName": "org/repo"}], "unique_count": 1}
        with patch.object(server.research, "search", return_value=data):
            result = server.jumpstart_search(["topic"])
        self.assertEqual(result["unique_count"], 1)
        self.assertEqual(server.jumpstart_evidence(result["evidence_id"])["candidates"][0]["fullName"], "org/repo")


class ProtocolTests(unittest.IsolatedAsyncioTestCase):
    async def test_discovery_prompt_resource_and_tool(self):
        async with Client(server.mcp) as client:
            tools = await client.list_tools()
            self.assertEqual({t.name for t in tools.tools}, {"jumpstart_guide", "jumpstart_search", "jumpstart_inspect", "jumpstart_evidence"})
            prompts = await client.list_prompts()
            self.assertIn("jumpstart", {p.name for p in prompts.prompts})
            prompt = await client.get_prompt("jumpstart", {"project": "Local reader"})
            self.assertIn("Local reader", prompt.messages[0].content.text)
            resource = await client.read_resource("jumpstart://guide/menu")
            self.assertIn("Present the decision", resource.contents[0].text)
            result = await client.call_tool("jumpstart_guide", {"section": "integration"})
            self.assertFalse(result.is_error)
            self.assertIn("Integrate, simplify", result.content[0].text)

    async def test_tool_errors_are_protocol_errors(self):
        async with Client(server.mcp) as client:
            result = await client.call_tool("jumpstart_guide", {"section": "../../etc/passwd"})
            self.assertTrue(result.is_error)
            self.assertIn("Unknown guide", result.content[0].text)

    async def test_stdio_starts_from_any_working_directory(self):
        with tempfile.TemporaryDirectory(prefix="jumpstart-stdio-") as cwd:
            params = StdioServerParameters(command=sys.executable, args=[str(SERVER_PATH.resolve())], cwd=cwd)
            async with Client(params) as client:
                result = await client.call_tool("jumpstart_guide", {"section": "start"})
                self.assertFalse(result.is_error)
                self.assertIn("technical partner", result.content[0].text)
                self.assertIn("jumpstart", {p.name for p in (await client.list_prompts()).prompts})


if __name__ == "__main__":
    unittest.main()
