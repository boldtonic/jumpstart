# Jumpstart ↗

**Open-source foundations. Your product.**

Give your coding agent a workflow to find, inspect, combine, integrate, and credit open-source code worth building on.

![Terminal demo: type /jumpstart, compare open-source foundations, then integrate and test the selected pieces](assets/jumpstart.gif)

[Install](#install) · [See the example](#a-real-combination) · [MCP setup](mcp_server/README.md) · [Español](USO.es.md) · [MIT](LICENSE)

You describe what you are building. Jumpstart reads the available context and code, investigates existing implementations, and returns a small menu of foundations and combinations. Choose a route—or delegate the choice—and your agent helps turn the selected pieces into your product.

Use a whole foundation, selected modules, or complementary parts of several repos. Keep what fits, simplify what does not, write the connections, and credit the people whose work you build on.

## What you get

- **A recommendation with reasons.** What each repo contributes, what to keep or remove, and how the pieces fit.
- **Implementation evidence.** Relevant code and boundaries inspected, with documented, inspected, and tested results distinguished.
- **An integration plan.** Concrete engineering work you can avoid, the code still needed, and the order to build it.
- **A working integration when you ask for it.** Selected pieces, meaningful tests, pinned sources, and preserved credits.

Jumpstart works inside your existing agent. It ships as a portable **Agent Skill** and a companion **MCP server**, sharing the same workflow.

## Install

From a downloaded or cloned copy of this repository:

```sh
npx skills@1.7.0 add . --skill jumpstart --global
```

The installer lets you choose your agents. It requires Node.js 22.20+. You can also install manually using [the skill ZIP](dist/jumpstart-skill.zip): place the complete `jumpstart` folder in your client's skills directory. For personal Claude Code skills, that is `~/.claude/skills/jumpstart`.

The public repository install command will be added when the repository is published. The source and ZIP are currently prepared locally.

| Your environment | Start here |
|---|---|
| Claude Code | `/jumpstart` followed by your request |
| Codex | `$jumpstart` followed by your request |
| Other Agent Skills clients | Install the same skill using the client's discovery mechanism |
| MCP clients | [Connect Jumpstart](mcp_server/README.md), then ask the agent to use it |

Open a new session if your agent has not refreshed its skill list. The [compatibility record](evals/PORTABILITY.es.md) states what has actually been tested.

## Try it in your project

In Claude Code:

```text
/jumpstart Read this project's context and code. Find open-source pieces
we could combine. Recommend what to keep, simplify, and integrate.
```

In Codex, use `$jumpstart` with the same request. If you are starting from an idea, describe the product instead. Jumpstart uses the context it can access and asks only for missing information that changes the recommendation.

Then, for example:

```text
Integrate option A. Keep our current UI, use the selected components,
verify the complete flow, and preserve upstream credits.
```

## A real combination

The [included Markdown previewer](examples/markdown_preview/README.md) combines two independent projects:

| Source | What we reuse | What our product owns |
|---|---|---|
| [markdown-it-py](https://github.com/executablebooks/markdown-it-py) | Markdown parsing and rendering | Supported content and parser configuration |
| [nh3](https://github.com/messense/nh3) | HTML sanitization | Allowed elements, attributes, and URL policy |
| Original adapter | The connection between them | File input/output, limits, and integration tests |

![An abridged recommendation: markdown-it-py plus nh3, with Mistune plus nh3 as an inspected alternative](assets/jumpstart-menu.png)

![The terminal demo concludes with the real adapter, seven passing integration tests and preserved upstream credits](assets/jumpstart-result.png)

**Seven integration tests pass.** The [provenance report](examples/markdown_preview/OPEN_SOURCE_CREDITS.md) records the selected versions and preserved notices. This example demonstrates composition through public APIs; it does not claim extraction of tightly coupled internals from large applications.

The [40-second terminal demo](assets/jumpstart.mp4) shows the flow: project context → `/jumpstart` → recommendation → integration. It reconstructs the conversation around this tested example; layout, dialogue and timing are edited. The [demo source and captured evidence](demo/README.md) are included.

## What runs where?

Your agent supplies the model, project context, and coding tools. The skill's optional research helper uses **GitHub CLI (`gh`) and Python 3.9+**. The MCP server additionally needs Python 3.10+ and its pinned SDK dependency. Neither helper nor MCP server requires another model API key.

MCP supports local stdio and loopback HTTP. Clients that only connect to remote servers need a hosted deployment; this project does not currently provide one. Research-only clients can produce a menu and plan, while integration requires the host's code editing and execution tools.

## Development and credits

[Development guide](docs/DEVELOPMENT.md) · [Validation results](evals/RESULTS.md) · [Behavioral cases](evals/CASES.md) · [Design sources](DESIGN_SOURCES.md)

Original code is [MIT-licensed](LICENSE). Reused material keeps its [upstream notices](THIRD_PARTY_NOTICES.md). Jumpstart records attribution as part of integration, not as an afterthought.

Built by [@boldtonic](https://github.com/boldtonic). If Jumpstart helps you build something, share your example—and consider leaving a star.
