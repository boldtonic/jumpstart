from html.parser import HTMLParser
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from preview import render_fragment, MAX_BYTES


class Elements(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.tags, self.attributes = [], []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        self.tags.append(tag)
        self.attributes.extend(attrs)


class PreviewTests(unittest.TestCase):
    def test_markdown_and_basic_html_preserved(self):
        result = render_fragment("# Heading\n\n**bold** and <em>embedded</em>\n\n- one\n- two")
        self.assertIn("<h1>Heading</h1>", result)
        self.assertIn("<strong>bold</strong>", result)
        self.assertIn("<em>embedded</em>", result)
        self.assertEqual(Elements(result).tags.count("li"), 2)

    def test_active_tags_and_event_handlers_removed(self):
        result = render_fragment('<script>alert(1)</script><p onclick="bad()">Hi</p><img src="x" onerror="bad()"><iframe src="https://example.com"></iframe>')
        elements = Elements(result)
        self.assertFalse({"script", "img", "iframe"} & set(elements.tags))
        self.assertFalse(any(k.startswith("on") for k, _ in elements.attributes))
        self.assertNotIn("alert(1)", result)

    def test_unsafe_and_local_links_are_not_active(self):
        for url in ("javascript:alert(1)", "JaVaScRiPt:alert(1)", "jav&#x61;script:alert(1)", "data:text/html,hello", "file:///tmp/private", "../private", "//example.com"):
            with self.subTest(url=url):
                parsed = Elements(render_fragment('<a href="{}">link</a>'.format(url)))
                self.assertFalse(any(k == "href" for k, _ in parsed.attributes))

    def test_web_link_and_code_sample_preserved(self):
        result = render_fragment('[Visit](https://example.com)\n\n```html\n<script>sample</script>\n```')
        self.assertIn(("href", "https://example.com"), Elements(result).attributes)
        self.assertIn("&lt;script&gt;sample&lt;/script&gt;", result)
        self.assertNotIn("script", Elements(result).tags)

    def test_style_id_and_comments_removed(self):
        result = render_fragment('<p id="location" style="color:red">Text</p><!-- hidden -->')
        self.assertFalse(Elements(result).attributes)
        self.assertNotIn("hidden", result)

    def test_large_input_rejected(self):
        with self.assertRaises(ValueError):
            render_fragment("x" * (MAX_BYTES + 1))

    def test_cli_writes_fragment_and_preserves_existing_output(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source, destination = root / "input.md", root / "output.html"
            source.write_text("# Hello", encoding="utf-8")
            command = [sys.executable, str(Path(__file__).with_name("preview.py")), str(source), "--out", str(destination)]
            first = subprocess.run(command, capture_output=True)
            self.assertEqual(first.returncode, 0, first.stderr)
            self.assertIn("<h1>Hello</h1>", destination.read_text())
            second = subprocess.run(command, capture_output=True)
            self.assertEqual(second.returncode, 1)
            self.assertIn("<h1>Hello</h1>", destination.read_text())


if __name__ == "__main__":
    unittest.main()
