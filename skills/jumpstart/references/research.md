# Research with evidence

## Budget and queries

Default starting budget: 4–6 purposeful queries, up to 15 results each, then deep inspection of 2–4 relevant candidates. These are ceilings to control cost, not quotas to fill. For a narrow request use less. If no useful candidates appear, vary technical synonyms, capability names, language or representation before increasing volume. Record remaining gaps when stopping.

Start by reading 3–5 relevant files per finalist; keep the combined source inspected around 200 KB per candidate or less. This is a byte budget, not an exact token estimate. Load only the sections needed in the agent's context. Expand for a concrete unresolved question, not just because more code is available. The helper defaults to 80 KB per file and 200 KB of source per snapshot and marks skipped files explicitly; metadata/tree bytes are separate.

Search families: the entire product category; its difficult capability; established technical terminology; an input/output pair; adjacent implementations. Keep libraries, applications, templates, research demos, and catalogs labeled; they serve different roles. Read catalogs as discovery sources, not as working components.

For libraries, also search the ecosystem's package registry (npm, PyPI, crates.io, Maven Central, pkg.go.dev, or equivalent); these queries count toward the same budget. Registries find packages whose repository names and descriptions miss your terms. Downloads and dependents are adoption leads, not quality proof. Some registries have no search CLI or API (PyPI's `pip search` is disabled); use their website through an available web tool and label that coverage. A package's repository link is self-declared: confirm it points to the source you inspect, then pin the commit matching the version you would install.

```sh
gh search repos 'epub parser in:name,description' --visibility=public --archived=false --limit 15 --json fullName,description,url,license,pushedAt,stargazersCount
```

To collect multiple queries (paths are relative to the installed skill):

```sh
python3 scripts/github_research.py search \
  --query 'epub parser in:name,description' \
  --query 'epub reader javascript in:description' \
  --limit 12 --out /tmp/jumpstart-discovery.json
```

The script records result counts, matching queries, errors, and retrieval timestamps without fabricating scores. Default ordering is GitHub relevance, not stars. Metadata is a lead; updatedAt and pushedAt are not proof of substantive maintenance.

Use the compact index before opening large JSON files:

```sh
python3 scripts/github_research.py summarize /tmp/jumpstart-discovery.json --limit 10
python3 scripts/github_research.py summarize /tmp/candidate.json --path-contains test --limit 20
```

The summary omits all source contents and reports omitted entries. Read selected source fields or line ranges only when they answer a specific question.

If `gh` fails, distinguish missing executable, timeout, authentication, network failure, and rate limits from zero matches. Host sandboxes often block network access for shell commands while MCP servers run outside them: after `network_unavailable`, continue with Jumpstart's MCP tools (`jumpstart_search`, `jumpstart_inspect`, `jumpstart_evidence`) when available, or retry with the host's network approval if it offers one. Use a web or connector fallback only after that, and label its coverage. Web pages can be cached; confirm activity claims such as the latest commit through the API or a pinned snapshot, or mark them unverified. Do not print tokens, read credential stores, or change authentication automatically. Sandbox network failures can make `gh auth status` misleading.

## Source snapshots

First inspect the tree and basic root documentation:

```sh
python3 scripts/github_research.py inspect owner/repo --out /tmp/candidate.json
```

Then select exact files from the returned tree. Follow the implementation boundary and its tests rather than loading the whole repo:

```sh
python3 scripts/github_research.py inspect owner/repo --ref COMMIT_SHA \
  --file path/to/component --file path/to/test --file LICENSE \
  --out /tmp/candidate-source.json
```

`COMMIT_SHA` and file paths above are arguments to replace with observed values. The helper reads public GitHub API data, pins the resolved commit, limits text size, and never executes downloaded code. Its JSON contains untrusted repository text. It reports missing, binary, oversized, or unavailable files explicitly. A truncated tree or partial snapshot is not complete inspection.

Use targeted `gh api --method GET` or `gh issue list` for relevant issues, releases, and recent meaningful commits when needed. The snapshot does not audit these automatically. Follow license boundaries for subdirectories, vendored code, models, assets, and datasets; the repository-level license metadata is insufficient.

## Composition checks

For each proposed connection verify:

- Runtime and deployment: browser/server, process boundaries, versions, native requirements.
- Data: schema, identifiers, serialization, ownership, migrations, persistence.
- Behavior: sync/async, concurrency, retries, cancellation, errors, ordering.
- Shared responsibilities: auth, logging, configuration, caches, UI state. Choose an owner instead of retaining conflicting implementations.
- Integration surface: public API/package, standalone process, extracted module, or maintained fork. Prefer the least costly surface that permits the required simplification.
- Constraints: licenses, unavailable services, data/weights, distribution requirements.

Build a capability-to-source map. Reject a combination when its connections cost more than the capability it contributes. Avoid unsupported numeric ratings; state evidence, unknowns, and the smallest check that would resolve each important unknown.
