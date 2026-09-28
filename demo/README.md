# Terminal demo

A 40-second terminal-chat animation, a looping README GIF and three stills. A developer is building an offline notes app, types `/jumpstart`, gets a recommendation, then asks the agent to integrate it. The camera moves toward the command; the rest happens inside the conversation.

This is an **authored reconstruction of the repository's evaluated example**, not a live recording or a verbatim Claude Code transcript. The terminal layout, fictional project name “Noted”, dialogue and timing are editorial. Recommendations are abridged and translated from the captured evaluation; the implementation, dependency versions, licenses and test results are real. The animation does not demonstrate the complete notes application or claim real-time execution speed.

| Time | Conversation | Evidence |
|---|---|---|
| 0–7 s | Project context; typing and zoom on `/jumpstart` | Fictional notes-app context around the evaluated Markdown preview feature; Claude Code invocation syntax |
| 7–12 s | Context read, GitHub search and source inspection | `evals/evidence/markdown-search.json` and `evals/MENU_EXAMPLE.es.md` |
| 12–25 s | Recommended combination, alternative, what to keep and write | Abridged from `evals/MENU_EXAMPLE.es.md`; alternative remains unintegrated |
| 25–31 s | User selects A; adapter, dependencies and credits | `examples/markdown_preview/` |
| 31–40 s | Seven passing tests and what now works | Fresh execution in `evidence.json` and preserved upstream notices |

`storyboard.json` contains all dialogue and line timings. `render.cjs` constructs a single scrolling conversation, cursor, typing and camera motion. Dependency versions and the test summary come directly from `evidence.json`; rendering rejects failed test evidence. Research activity is condensed from the saved evaluation, not a new search performed by the renderer. Keep the small “EDITED DEMO · TESTED EXAMPLE” label when sharing these assets.

## Reproduce

Create a Python environment using the example's pinned requirements, then from the repository root:

```sh
python demo/capture.py
```

For media rendering, install Node.js, FFmpeg, and the development dependency:

```sh
cd demo
npm install
npm run render
```

`npm run stills` generates only the still images. `FFMPEG` can override the executable path. The renderer authors SVG frames, rasterizes them with Sharp and encodes them with FFmpeg. Rendering needs no hosted service, model call, music, downloaded footage or external image asset. Scripts write only demo evidence and the named output files under `assets/`.

Outputs:

- `assets/jumpstart.gif`: 960 × 600, looping README demo.
- `assets/jumpstart.mp4`: 1440 × 900, 24 fps, for sharing.
- `assets/jumpstart-{poster,menu,result}.png`: command close-up, recommendation and tested integration.
- `assets/jumpstart-poster.svg`: vector version of the command close-up.

The demo-first README follows the author's [Prati](https://github.com/boldtonic/prati), [Fogata](https://github.com/boldtonic/Fogata) and [Zumoclip](https://github.com/boldtonic/zumoclip) presentation pattern. Their images and footage are not reused.
