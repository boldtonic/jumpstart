# Validation results — 2026-09-25

## Executed

| Check | Observed result |
|---|---|
| Skill structure validator | Passed; required metadata and naming accepted |
| Local resource links | No broken links in the skill |
| Helper unit tests | 20 passed on Python 3.9.6 |
| Live repository search | 2 public gh queries, 12 results, 12 unique candidates; evidence saved |
| Live commit-pinned inspection | Both candidate overviews and five selected files per release snapshot fetched successfully |
| Independent code/instruction review | Two provenance defects reproduced, fixed, and covered by regression tests |
| Independent menu forward-test | Read context, researched implementation, compared two combinations, recommended one, and stopped before integration as requested |
| Real two-repository integration | markdown-it-py 4.2.0 + nh3 0.3.7, with mdurl 0.1.2, installed in an isolated temporary Python 3.11.15 environment |
| Integration acceptance tests | 7 passed, including the file CLI, ordinary formatting, embedded HTML, unsafe URLs, active tags, and input limits |
| Example provenance | Strict structural validation passed; credits generated; source license files preserved |
| Evidence summary and read budget | Compact view exercised; unit tests prove source omission and stopping further blob reads at the budget |

The independent menu is preserved in [MENU_EXAMPLE.es.md](MENU_EXAMPLE.es.md). It is a captured menu-only run, so its statements about not installing/testing refer to that run. The parent integration test was performed separately with pinned releases; the menu inspected branch revisions and did not certify those releases.

The review corrected upstream paths being validated against unrelated local symlinks and whitespace allowing `unknown` to be marked as a verified license. The forward-test prompted the addition of a source byte budget and compact evidence summary.

## Reproduce

From the repository root:

```sh
python3 -m unittest discover -s tests -v
python3 plugins/jumpstart/skills/jumpstart/scripts/github_research.py summarize evals/evidence/markdown-search.json --limit 5
python3 plugins/jumpstart/skills/jumpstart/scripts/provenance.py validate examples/markdown_preview/provenance.json --root examples/markdown_preview --strict
```

Follow the [example setup](../examples/markdown_preview/README.md) to run the seven integration tests in a separate environment. The skill helpers themselves need no demo dependencies.

## Limits of this evidence

One domain and one two-component integration have been exercised; this is not a benchmark of all project types. The demo uses public APIs and deliberate configuration, not extraction of tightly coupled internals. No token/time savings or debt-reduction percentage has been measured. Full upstream test suites, browser behavior, and distribution-level transitive-license auditing were not performed. The other behavioral cases in CASES.md remain available for future evaluations, not recorded as passed.

The helper records public source and version metadata; it does not prove that a distributed wheel was reproducibly built from its tag. Credits and structural validation do not certify license compatibility. The menu's branch-level maintenance observations must not be silently applied to older release snapshots.

See the [completed September 28 review](PORTABILITY.es.md) for current portability, MCP validation, and installation status.
