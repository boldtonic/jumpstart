# Jumpstart over MCP

This companion exposes the same Jumpstart workflow to MCP clients. Your client supplies the AI model, available conversation context, and any project editing tools. This server provides instructions and public GitHub research through `gh`. It does not call a model API, read your project automatically, or execute downloaded repository code.

Use the native Agent Skill when your coding agent supports it. MCP is an additional way to access Jumpstart, not a requirement for the skill.

## Setup

Requirements: Python 3.10+, GitHub CLI installed and authenticated, network access for GitHub research. Instructions can be read without GitHub access. The SDK dependency is pinned to `mcp==2.2.0`.

From the root of a clone or source download of the Jumpstart repository:

```sh
python3.11 -m venv .venv-mcp
.venv-mcp/bin/python -m pip install -r mcp_server/requirements.txt
gh auth status
```

Use an installed Python 3.10+ executable in place of `python3.11` when appropriate. Keep the `plugins/jumpstart` directory next to `mcp_server`; the server resolves its shared files relative to its own location, independent of the client's working directory.

## Connect a local client

From that same repository root, for Claude Code:

```sh
claude mcp add --scope user jumpstart -- "$PWD/.venv-mcp/bin/python" "$PWD/mcp_server/server.py"
```

For Codex:

```sh
codex mcp add jumpstart -- "$PWD/.venv-mcp/bin/python" "$PWD/mcp_server/server.py"
```

For another client with stdio support, configure the absolute Python executable path as `command`, and the absolute `mcp_server/server.py` path as its single argument. The client launches the server. These are actual local paths, not the name of a published npm/Python package.

The research process uses the server machine's `gh` executable and GitHub authentication. A desktop client may need its subprocess `PATH` configured to include the directory containing `gh`. Keep credentials in the client's supported secret mechanism or `gh` authentication store.

Restart or reconnect the client after changing its MCP configuration. Claude Code can check the saved connection with `claude mcp get jumpstart`; Codex can show it with `codex mcp get jumpstart`.

For Claude Desktop, add the same stdio entry to its `mcpServers` configuration: the absolute Python path as `command` and a one-item `args` list containing the server path. Preserve other entries and restart Claude Desktop. Include the directory containing `gh` in the entry’s `env.PATH` if the desktop environment does not provide it.

Then ask the client:

```text
Use Jumpstart to investigate open-source foundations for this project. Load jumpstart_guide, use the available context, and recommend a combination and integration plan.
```

Clients with prompt selection can use the `jumpstart` prompt, with optional `project` and `context` arguments. Clients decide how prompts appear; there is no universal `/jumpstart` command for MCP. Clients exposing only tools can start with `jumpstart_guide`.

## Tools and shared guides

| Interface | Purpose |
|---|---|
| `jumpstart_guide(section)` | Shared instructions: `start`, `research`, `menu`, `integration` |
| `jumpstart_search(queries, limit)` | 1–6 public GitHub queries, up to 20 results each; deduplicated leads with license, fork status, and last push |
| `jumpstart_inspect(repository, ref, files)` | Commit-pinned metadata/tree/docs and up to 8 requested source files |
| `jumpstart_evidence` | Cached index or bounded source excerpts; exact upstream paths only |
| Prompt `jumpstart` | Shared workflow plus optional project brief |
| Resource `jumpstart://guide/{section}` | Same shared guide files |

Research tools return compact summaries and evidence IDs. Inspect a tree first, then fetch selected files. Continue candidate/tree pages by passing `next_index_offset` back as `index_offset`, keeping the same `path_contains` filter. For source, set `path`, `start_line`, and `lines` (at most 200). Excerpts are capped at 16,000 characters; continue a clipped excerpt by keeping the same line window and passing `next_character_offset` as `character_offset`. `window_line_count` describes the selected window, not the clipped page. A null next offset means that page sequence is complete.

The last 16 evidence records remain in process memory; restart or eviction expires their IDs. Save relevant findings and provenance in the target project when integrating. Partial requests and unavailable evidence are reported explicitly.

All tools are read-only with respect to user projects. Repository content is untrusted evidence. Only the host agent can decide and perform integration using its own authorized project tools. The server's GitHub requests use the server machine's credentials, so a local configuration must not be exposed as an unauthenticated remote service.

## Local HTTP

For a client that supports Streamable HTTP:

```sh
.venv-mcp/bin/python mcp_server/server.py --transport streamable-http --port 8765
```

Connect to `http://127.0.0.1:8765/mcp`. Binding is restricted to loopback. The server must remain running. This is a local transport, not a hosted integration for web-only clients. A remote deployment with HTTPS, authentication, and per-user credential isolation is outside this package.

## Validation

```sh
.venv-mcp/bin/python -m unittest discover -s mcp_server -p 'test_*.py' -v
```

Tests use the official [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk) client for discovery, prompts, resources, tool errors, and real stdio startup from another working directory. Separate live smoke checks cover local HTTP and the GitHub research path; see [portability results](../evals/PORTABILITY.es.md) in the full repository. This does not claim end-to-end testing in every MCP application.
