# Triggering evaluation — 2026-10-13

Does an agent pick Jumpstart up on its own when someone asks to compare or choose open-source foundations without naming the skill?

**Method.** Claude Code 2.1.295 with `claude-sonnet-5`, run headless with `--setting-sources project,local` so no personal plugins, hooks or installed skills interfere. Each query runs with the description under test exposed as a skill; a run counts as a trigger when the agent's first tool call invokes it. The harness is skill-creator's `run_eval.py`, patched locally so that parallel workers count any copy of the same description (unpatched, five identical copies compete and most hits are miscounted). One run per query, so single results are noisy.

| Description | [eval_set.json](eval_set.json): should trigger | should not | [holdout_set.json](holdout_set.json) + 2 ML queries: should trigger | should not |
|---|---|---|---|---|
| 1.0.0 | 4/10 | 0/10 triggered | — | — |
| 1.0.1 | 8/10 | 0/10 triggered | 7/8 | 0/4 triggered |

The holdout queries were written after the 1.0.1 description, in domains it does not name. A longer variant that added ML stacks and a reason to avoid answering from memory scored the same and was not adopted.

**Limits.** Small sample, one model, one run per query, an empty project. Codex and other clients were not measured.
