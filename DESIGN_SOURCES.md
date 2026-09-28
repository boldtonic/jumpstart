# Design sources and attribution

Jumpstart was developed from a product discussion about composing open-source foundations into original products. Its instructions and helper implementations were written for this project; no source code or instruction passages from the following projects were copied into the implementation.

Prior work researched during design:

- [GitHub Open-Source Scout](https://github.com/LiShiyirain/github-open-source-scout), revision `a2587239059e007a196879ddb5ce0a617ee422d1`: informed the distinction between discovery, implementation inspection, and execution evidence, and the assessment of component fit. Its own [third-party notices](https://github.com/LiShiyirain/github-open-source-scout/blob/a2587239059e007a196879ddb5ce0a617ee422d1/THIRD_PARTY_NOTICES.md) credit Yunshu's repository-search workflow.
- [reporpoise](https://github.com/botiejedi/reporpoise): README reviewed as an example of GitHub CLI discovery followed by architecture-fit review. Its skill implementation has not been reused.
- [GitHub CLI](https://github.com/cli/cli): external tool invoked by the research helper. The helper does not bundle GitHub CLI code.
- [FSFE REUSE](https://github.com/fsfe/reuse-tool): documentation reviewed as related attribution tooling. It is not bundled or required.

Portability uses the [Agent Skills specification](https://agentskills.io/specification). Installation instructions use the external [Skills CLI](https://github.com/vercel-labs/skills). The companion server uses the official [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk), pinned to version `2.2.0`; the server adapter was written for Jumpstart and reuses the existing research helper.

Future copied or adapted material must retain its applicable upstream licensing and notices. This design-influence record is not a replacement for them.
