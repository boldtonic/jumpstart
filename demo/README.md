# Launch demo

A 24-second, four-shot motion graphic, plus a looping GIF and PNG stills. It is an edited explanation of the repository's actual Markdown preview example, not a live recording of Claude, Codex, or another client. Text is in English for the public repository.

| Time | Shot | Evidence |
|---|---|---|
| 0–6 s | Product brief: local Markdown previewer | The evaluated example request |
| 6–12 s | Recommended combination and alternative | Abridged from `evals/MENU_EXAMPLE.es.md`; alternative marked unintegrated |
| 12–18 s | Parser → sanitizer → product adapter | `examples/markdown_preview/preview.py` |
| 18–24 s | Output, seven passing tests, and credits | Fresh execution captured in `evidence.json`; upstream provenance |

The output text in the last shot is read from the actual adapter output saved in `evidence.json`. It is styled for the presentation. Test results are checked before rendering. The observed test duration is not presented as a speed claim.

## Reproduce

Create a Python environment using the example's pinned requirements, then from the repository root:

```sh
python demo/capture.py
```

For media rendering, install Node.js, FFmpeg, and the small development dependency:

```sh
cd demo
npm install
npm run render
```

`npm run stills` generates only the still images. `FFMPEG` can override the executable path. The renderer authors SVG frames in code, rasterizes them with Sharp, and encodes them with FFmpeg. No hosted service, model call, music, downloaded footage, or external image asset is used. The scripts write only the demo evidence and the named output files under `assets/`.

Outputs: `assets/jumpstart.gif` for the README, `assets/jumpstart.mp4` for sharing, and `assets/jumpstart-{poster,menu,result}.png` as static alternatives. `jumpstart-poster.svg` is also retained as vector artwork.

The presentation structure was inspired by the author's existing [Prati](https://github.com/boldtonic/prati), [Fogata](https://github.com/boldtonic/Fogata), and [Zumoclip](https://github.com/boldtonic/zumoclip) READMEs. Their images and footage are not reused.
