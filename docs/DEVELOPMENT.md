# Development

The shared workflow lives in `skills/jumpstart`; the MCP server reads those files directly. Update installed copies after changing the source skill. No demo dependencies are needed to run the skill helpers.

## Checks

```sh
python3 -m unittest discover -s tests -v
python3 skills/jumpstart/scripts/provenance.py validate examples/markdown_preview/provenance.json --root examples/markdown_preview --strict
```

Follow the [MCP setup](../mcp_server/README.md) and [example setup](../examples/markdown_preview/README.md) for their respective tests. GitHub Actions runs all 40 tests and the provenance check.

## Research helpers

```sh
python3 skills/jumpstart/scripts/github_research.py search \
  --query 'epub parser in:name,description' --limit 10 --out /tmp/epub-search.json
```

Requires authenticated `gh` with network access. Research artifacts are never silently overwritten. Exit codes: `0` complete, `2` partial/failed queries with evidence saved, `1` fatal error. Downloaded source is read as text, never executed by the helper or MCP server.

Jumpstart separates documented claims, inspected implementations, and tested integrations. Potential time or token savings must not be presented as measurements. The provenance validator checks recorded structure and files; it does not certify licensing conclusions.

The [demo renderer](../demo/README.md) is optional presentation tooling. The skill ZIP contains only `skills/jumpstart`; the MCP ZIP contains the source distribution. Neither bundles virtual environments, credentials, or development dependencies.
