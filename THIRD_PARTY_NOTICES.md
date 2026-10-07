# Third-party notices

Jumpstart's original implementation is MIT-licensed. Third-party material remains subject to its upstream license and notices.

The research snapshots under `evals/evidence/` contain source, tests, metadata, and license material retrieved from public repositories. They are test evidence, not executable dependencies of the skill:

- [markdown-it-py](https://github.com/executablebooks/markdown-it-py), MIT, Copyright (c) 2020 ExecutableBookProject. Its upstream markdown-it notice is retained too. Full texts: [LICENSE](examples/markdown_preview/third_party/markdown-it-py/LICENSE) and [LICENSE.markdown-it](examples/markdown_preview/third_party/markdown-it-py/LICENSE.markdown-it).
- [nh3](https://github.com/messense/nh3), MIT, Copyright (c) 2021-present Messense Lv. Full text: [LICENSE](examples/markdown_preview/third_party/nh3/LICENSE).

Each snapshot records the exact source revision. The demo installs published packages; it does not bundle their wheels or transitive implementation code. Package distributions carry their own notices. See its [provenance report](examples/markdown_preview/OPEN_SOURCE_CREDITS.md) for direct dependency versions and roles. The demo's source code and tests were written for this project.

See [DESIGN_SOURCES.md](DESIGN_SOURCES.md) for conceptual influences on the skill.

The optional MCP server installs the official [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk), `mcp==2.2.0` (MIT), and its dependencies. Their code is not bundled in this repository; installed distributions retain their own licensing and notices. The Agent Skill works independently of that SDK. The external Skills CLI is an optional installer and is not bundled.

The plugin icon (`plugins/jumpstart/.claude-plugin/icon.png`, source `assets/jumpstart-icon.svg`) uses “arrow-up-right-dots” from [Font Awesome Free](https://fontawesome.com) 6.7.2, Copyright 2024 Fonticons, Inc., licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). It is recolored and placed on a dark square.
