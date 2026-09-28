# Jumpstart

**Jump-start your project with open source. Find the foundations, keep what matters, make it yours, and credit the creators.**

Jumpstart helps your AI coding agent act as a technical partner: understand the product, investigate existing implementations, recommend combinations, and selectively simplify, integrate, test, and attribute the chosen pieces. A solution can reuse a foundation, selected modules, or complementary parts of several repositories alongside original code.

It ships as a portable **Agent Skill**, plus a companion **MCP server** for clients that use MCP. Both load the same workflow. You use it inside the conversation where you are building your product.

[Cómo instalarla y usarla, en español](USO.es.md)

## Install the skill

From this repository, using the [Skills CLI](https://github.com/vercel-labs/skills) (Node.js 22.20+):

```sh
npx skills@1.7.0 add . --skill jumpstart --agent codex claude-code cursor --global
```

Choose the agents you actually use. `--global` makes the skill available across your projects. Omit it to install into the current working project. `--copy` installs copies instead of links. The CLI handles each agent's discovery directory; it is an external installer, not a Jumpstart dependency.

Alternatively, copy the complete `skills/jumpstart` directory into your client's skills directory. For a personal Claude Code installation, that is `~/.claude/skills/jumpstart`. For other clients, follow their discovery rules. `dist/jumpstart-skill.zip` contains that same standalone directory; the optional `agents/openai.yaml` metadata does not change the shared workflow.

This repository is currently local. A public GitHub install URL will be added after publication; there is no published Jumpstart npm or Python package.

## Invoke it in your product

| Client | How you start | What is provided |
|---|---|---|
| Claude Code | `/jumpstart` followed by your request | Native skill; personal or project installation |
| Codex | `$jumpstart` followed by your request | Native skill; personal or project installation |
| Other Agent Skills clients | Their native skill command or discovery mechanism | The same `SKILL.md`, references, and optional helpers |
| MCP clients | Connect the server, then ask the agent to use Jumpstart | A `jumpstart` prompt, guide resources, and research tools |

For example, in Claude Code:

```text
/jumpstart Read this project's context and code. Recommend open-source pieces we could combine, what to retain or simplify, and how to integrate them.
```

In Codex, use `$jumpstart` with the same request. These are messages to your agent, not shell commands. The wording after the skill name is up to you. If the product is already clear from the conversation, a short invocation is enough; otherwise Jumpstart asks what you are building.

The skill description also supports automatic discovery by hosts that implement it. Discovery and invocation belong to the client: installing in one application does not automatically install in every other AI application.

You receive a short menu: a recommended route, alternatives or combinations, the role of each repository, what to keep or remove, the engineering work avoided, and an integration plan. Then you can say:

```text
Integrate option A. Keep our current UI, combine the selected components, simplify unnecessary layers, and verify the complete user flow. Preserve upstream credits.
```

You can delegate the choice and implementation in your initial request too. Jumpstart uses the context and project tools available in that conversation; it does not automatically read unrelated chats.

After installation, open a fresh session in your agent if it has not refreshed its skill list. In Claude Code, `/jumpstart` should be available as a native skill command.

## MCP access

The [companion server](mcp_server/README.md) exposes the shared workflow to MCP clients, including clients without native skills. It supports local stdio and loopback Streamable HTTP. The client supplies the model, conversation context, and any project editing tools. The server supplies instructions and bounded GitHub research through the official `gh` CLI; it makes no model API calls.

A client that has no code editing or execution tools can still receive research and a plan. A web-only client that requires a remote HTTPS server needs a separately hosted deployment; this repository does not provide a hosted service. A MCP prompt is not guaranteed to appear as `/jumpstart` in every client.

## Evidence and integration

Jumpstart distinguishes documented claims, inspected implementations, and tested integrations. Avoided technical debt is described through concrete engineering work avoided; hours, token savings, and percentages are not invented.

Selected source revisions and source-to-target mappings are recorded, with preserved licenses and notices. The [provenance helper](skills/jumpstart/references/integration.md) validates recorded structure and files; it does not certify licensing conclusions.

The [Markdown preview example](examples/markdown_preview/README.md) combines a Markdown parser and an HTML sanitizer behind an original adapter. It has pinned dependencies, seven integration tests, upstream notices, and a provenance report. These packages are demo dependencies, not skill dependencies.

## Development

The skill's optional helpers require Python 3.9+. GitHub research requires an installed, authenticated `gh` CLI with network access. The MCP server additionally requires Python 3.10+ and the official MCP Python SDK; see its setup guide.

```sh
python3 -m unittest discover -s tests -v
```

Research helpers can also be used independently:

```sh
python3 skills/jumpstart/scripts/github_research.py search \
  --query 'epub parser in:name,description' --limit 10 --out /tmp/epub-search.json
```

Research artifacts are never silently overwritten. Search and snapshot exit codes: `0` complete, `2` partial/failed queries with an evidence artifact, `1` fatal error. Downloaded source is inspected as text, never executed by the research helper or MCP server.

Edit the core in `skills/jumpstart`; the MCP server reads those files directly. If you installed copies, refresh them after changes. The skill ZIP contains only the skill; the MCP ZIP includes the server and its shared skill files.

Automated checks are configured in `.github/workflows/test.yml` for pushes and pull requests.

See [validation results](evals/RESULTS.md), [portability checks](evals/PORTABILITY.es.md), [behavioral cases](evals/CASES.md), and an [example CTO menu](evals/MENU_EXAMPLE.es.md). Installation discovery and protocol checks do not imply that every host/model has passed an end-to-end product integration.

Original code is [MIT-licensed](LICENSE). See [design influences](DESIGN_SOURCES.md) and [third-party notices](THIRD_PARTY_NOTICES.md).
