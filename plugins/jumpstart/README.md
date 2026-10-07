# Jumpstart

Build your product with the right open-source foundations.

Tell Claude what you're building, or say you'd like to start from solid open-source foundations. Jumpstart reads your context, looks for open-source projects that already solve the hard parts, reads their actual code at pinned commits, and comes back with a short menu: two or three routes, what each repository contributes, what you keep, cut and still have to write, and the licenses involved. Nothing is installed until you choose. Pick a route and Claude integrates it, tests the connections, and records credits and provenance.

## Use it

- `/jumpstart I'm building a local-first app for audio interviews. What already exists?`
- "Before we write anything, let's start from solid open-source foundations." Claude can pick Jumpstart up on its own from its description.
- "Integrate option A. Keep our UI, test the whole flow, credit the authors."

## What it runs, sends and fetches

- **GitHub search and source reads.** The bundled Python helper `skills/jumpstart/scripts/github_research.py` runs the GitHub CLI (`gh`) to search public repositories and read public files at pinned commits. Search queries and repository names go to GitHub's API under your own `gh` login. Queries use public technical terms, never your private code.
- **Fallback.** Where `gh` or its network isn't available, Claude may use its own web search instead, and the menu says so.
- **Local files only.** Research evidence and decision records are saved in your project. The provenance helper `skills/jumpstart/scripts/provenance.py` only reads and writes local files.
- **Nothing else.** No other servers, no analytics and no model API calls. Downloaded repository content is read as text and never executed.

The helpers need Python 3.9+ and an authenticated `gh`. Without them, Claude can still research through web search, with less depth.

## Source and license

MIT. Source, demo videos and an optional MCP server: [github.com/boldtonic/jumpstart](https://github.com/boldtonic/jumpstart).

Icon: “arrow-up-right-dots” from [Font Awesome Free](https://fontawesome.com) by Fonticons, Inc., licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), recolored on a dark square.
