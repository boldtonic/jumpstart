# Markdown preview: a real composition test

This small CLI exercises Jumpstart's integration workflow with two independent repositories:

- `markdown-it-py` parses Markdown and embedded HTML.
- `nh3` sanitizes the resulting HTML fragment using the product's explicit allowlist.
- Original code connects the two, applies a 1 MB input limit, restricts links to explicit HTTP(S) URLs, and provides file input/output.

There is no web framework, database, plugin suite, image loading, or JavaScript. We keep the relevant public APIs rather than vendoring entire repositories. This demonstrates selective configuration and composition; it does not yet demonstrate extraction of tightly coupled upstream modules.

## Run

Use Python 3.10+ in a fresh virtual environment:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install --only-binary=:all: -r requirements.txt
.venv/bin/python -m unittest -v test_preview.py
.venv/bin/python preview.py input.md --out output.html
```

The CLI emits an HTML **fragment**, not a standalone web application, and refuses to overwrite an existing output. The binary-only installation avoids implicitly compiling nh3's Rust implementation; use a platform with a compatible wheel.

## Acceptance and limits

Seven tests exercise ordinary Markdown, embedded formatting, script/event removal, unsafe and local links, code samples, style/ID/comment removal, input limits, and the file CLI. They verify these cases against the pinned versions, not universal HTML security or every upstream behavior. This is a local bounded demo, not a network service or a browser audit.

The two direct repositories were inspected at release revisions recorded in [provenance.json](provenance.json). Upstream tests were read, not executed as full suites. The test runtime was Python 3.11.15. The example installs `mdurl` transitively and pins it for repeatability; nh3's wheel includes its Rust implementation and dependencies. We do not vendor those distributions here.

See [OPEN_SOURCE_CREDITS.md](OPEN_SOURCE_CREDITS.md) and `third_party/` for preserved source notices. The evidence establishes the source tag-to-commit relationship and installed version strings; it is not a reproducible-build verification of wheel provenance.
