# Privacy

Last updated: 2026-10-13

Jumpstart is a skill that runs inside your own coding agent. It has no server, no account and no analytics, and its author receives nothing from it.

## What it handles

- **Your request and project context** stay in your agent (Claude, Codex or another client), under that agent's own privacy terms. Jumpstart does not send them anywhere.
- **GitHub.** The bundled research helper runs your GitHub CLI (`gh`) to search public repositories and read public files at pinned commits. GitHub receives the search queries, which use public technical terms rather than your private code, and the names and paths of the public repositories requested. These requests run under your own `gh` login and GitHub's privacy statement.
- **Web search.** Where `gh` or its network isn't available, your agent may use its own web search instead, under that agent's terms.
- **Credentials.** `gh` uses its own stored login. Jumpstart never reads, prints, stores or sends your tokens anywhere else.
- **Local files.** Research evidence, decision records and credits are saved in your project. Nothing is retained elsewhere.

Jumpstart is not directed at people under 18.

## Contact

Questions or concerns: [open an issue](https://github.com/boldtonic/jumpstart/issues).
