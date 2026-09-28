# Present the decision

Lead with your recommendation and the product outcome it enables. Explain the project as understood in two or three sentences and list only assumptions that affect the choice.

Keep the first menu easy to choose from: typically 300–500 words unless the user requests more depth. Use short option summaries; avoid cramming long paragraphs into table cells. Put extended evidence, alternative analysis, and provenance in a linked decision record, while keeping the decisive facts and unknowns in the chat. Do not shorten away a material tradeoff merely to meet a word target.

## Menu

Usually provide 2–3 coherent routes, with fewer when only one deserves consideration. Each route may use one or more repositories. Include the sources, role of each, what we keep/remove/change, and the original glue or product logic needed.

Useful comparison dimensions:

| Route | Sources and responsibilities | Improvement / work avoided | Integration and ongoing effort | Evidence / unresolved check |
|---|---|---|---|---|

Populate from research, not generic claims. Link exact files or APIs at inspected revisions when they support the recommendation. Separate proposed combinations from combinations already tested together. If discovery failed or used a fallback, say so in one line of the menu itself, not only in the decision record.

For the recommended route, explain:

1. The product flow and component boundaries, including where data and state live.
2. Why these sources fit each other and the user's constraints.
3. What is being simplified, replaced, or deliberately kept custom.
4. The riskiest assumption and a small acceptance test to resolve it.
5. The ordered integration plan, preserving current working behavior.
6. Attribution and update ownership.

## Debt and effort

Make engineering value concrete: “The inspected parser already handles this format's edge cases; keeping it behind this interface avoids owning a second parser.” Do not translate that into guaranteed debt elimination, claimed production maturity, or invented days saved.

Effort labels should describe work: calling a public API; adapting a bounded module; reconciling schemas; extracting tightly coupled internals; maintaining a fork. If giving an estimate, name assumptions and confidence. Separate avoided implementation work from inherited maintenance work.

Credibility comes from honest evidence. “We inspected X; we have not yet exercised Y” is useful. Generic warning lists and flattering repository descriptions are not.

## Choice

When implementation has not been authorized, ask the user to choose a concrete route, for example: “Recomiendo A. ¿Integro A, exploramos B o ajustamos los requisitos?” If they already asked you to choose and implement, record your choice and continue without another approval loop.

Save a short decision record containing date, brief, selected route, rejected alternatives and reasons, pinned evidence, unknowns, and acceptance criteria. Keep full query output separate from the user-facing menu.
