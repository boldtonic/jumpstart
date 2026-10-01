# Demos

## Launch videos

Three short chat animations built from one real research run: [interview-research/](interview-research/) holds the two GitHub search rounds and the [decision record](interview-research/decision.md) that recommends Scriberr. Research lines and the menu are abridged from that record; the chat apps, the model name "Mosaic 3 Pro", the earlier conversation, typing and timing are invented. Keep the "EDITED DEMO · REAL RESEARCH" label when sharing them.

| Video | Story | Storyboard | Renderer |
|---|---|---|---|
| `assets/jumpstart-desktop-command.mp4` | Mid-conversation, the user types `/jumpstart`; the skill card shows its description | `desktop-command.json` | `desktop.cjs` |
| `assets/jumpstart-desktop-auto.mp4` | The user asks for solid open-source foundations; the agent chooses Jumpstart itself | `desktop-auto.json` | `desktop.cjs` |
| `assets/jumpstart-launch.mp4` | A plain monochrome chat with a single `/jumpstart` message | `launch.json` | `launch.cjs` |

```sh
cd demo
npm install
node desktop.cjs desktop-command.json
node desktop.cjs desktop-auto.json
node launch.cjs
```

Each run writes a 1920 × 1080 MP4, a 960-pixel README GIF and a poster PNG under `assets/`. Text widths are measured from the rendered glyphs, so wrapping and the cursor follow the installed fonts.

## Terminal demo

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
