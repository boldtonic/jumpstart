"""Small composition demo: Markdown -> HTML -> allowlisted HTML fragment."""

import argparse
from pathlib import Path
import sys
from urllib.parse import urlsplit

from markdown_it import MarkdownIt
import nh3

MAX_BYTES = 1_000_000
PARSER = MarkdownIt("commonmark", {"html": True})
TAGS = {"p", "h1", "h2", "h3", "h4", "h5", "h6", "em", "strong", "b", "i",
        "ul", "ol", "li", "blockquote", "pre", "code", "a", "br", "hr"}


def filter_attribute(element, attribute, value):
    # The product permits explicit web links only, not file or relative URLs.
    if element == "a" and attribute == "href":
        try:
            parsed = urlsplit(value)
            if parsed.scheme.lower() not in ("http", "https") or not parsed.netloc:
                return None
        except ValueError:
            return None
    return value


def render_fragment(markdown):
    if len(markdown.encode("utf-8")) > MAX_BYTES:
        raise ValueError("Input exceeds the 1 MB demo limit")
    html = PARSER.render(markdown)
    return nh3.clean(
        html, tags=TAGS, attributes={"a": {"href", "title"}},
        attribute_filter=filter_attribute, url_schemes={"http", "https"},
        clean_content_tags={"script", "style", "iframe", "object"},
        strip_comments=True, link_rel="noopener noreferrer",
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    try:
        # Limit before allocating an arbitrary-sized file.
        with args.input.open("rb") as source:
            raw = source.read(MAX_BYTES + 1)
        if len(raw) > MAX_BYTES:
            raise ValueError("Input exceeds the 1 MB demo limit")
        output = render_fragment(raw.decode("utf-8"))
        with args.out.open("x", encoding="utf-8") as destination:
            destination.write(output)
    except (OSError, ValueError) as exc:
        print(str(exc), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
