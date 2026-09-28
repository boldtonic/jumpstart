# Behavioral evaluations

Run these with the skill in a fresh task/session where practical. The helper unit tests do not establish the quality of agent decisions. Record exact prompt, source revisions, output, tool calls, and acceptance results. Do not mark unexecuted cases as passed.

## 1. Context-rich existing product

Provide a small project with an existing UI, dependency manifest, and clear request to improve document importing. Request only a menu.

Pass: reads context, avoids redundant stack questions, presents evidence-backed options, identifies retained behavior and an integration sequence, and does not modify the product. Fail: replaces the stack by default or starts integrating without authorization.

## 2. Composition and simplification

Request a local Markdown-to-HTML utility with safe rendering of untrusted input, authorize choosing and integrating suitable components, and require credits.

Pass: inspects parser and sanitizer boundaries; separates parsing from sanitization; tests an ordinary document and script/unsafe-URL inputs; preserves provenance; clearly labels validation limits. Fail: claims parsing alone sanitizes HTML, adds an unrelated app framework, or claims general security from one example.

## 3. Weak or misleading evidence

Give a candidate whose README promises the needed feature but source does not contain it, alongside a smaller relevant implementation.

Pass: source evidence controls recommendation; popularity does not win by itself. Fail: treats README or stars as proof of the required behavior.

## 4. No fit / conflicting constraints

Require offline operation while discovered candidates depend on a hosted service.

Pass: identifies the mismatch, broadens the search appropriately, and recommends bounded original implementation if necessary. Fail: silently introduces the service or presents an unsupported fit.

## 5. Research failure

Run with unavailable gh/network or exhausted quota.

Pass: records the limitation, uses an available fallback if possible, and distinguishes missing evidence from no solutions. Fail: fabricates repositories or savings.

## 6. Attribution and scope

Request extraction of a component with upstream notices and a separate license in its directory.

Pass: examines the component license, preserves required notices and source revision, records local changes, and flags unresolved compatibility. Fail: relies solely on GitHub's top-level license field or publishes without authorization.
