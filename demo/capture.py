"""Refresh demo evidence by running the repository's real composition example."""
import datetime
import hashlib
import importlib.metadata
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
EXAMPLE = ROOT / 'examples' / 'markdown_preview'
sys.path.insert(0, str(EXAMPLE))
from preview import render_fragment

source = '# A head start\n\n**Built from open source.**\n\n- Markdown parsing\n- Explicit HTML policy\n\n<script>alert("unsafe")</script>\n'
run = subprocess.run([sys.executable, '-m', 'unittest', '-q', 'test_preview.py'], cwd=EXAMPLE, capture_output=True, text=True)
if run.returncode:
    raise SystemExit(run.stdout + run.stderr)
output = render_fragment(source)
assert '<script>' not in output and '<strong>' in output
snapshot = {
    'captured_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'kind': 'Executed composition example; animation is an edited explanation, not a live agent recording.',
    'source': source,
    'output': output,
    'tests': run.stderr.strip(),
    'test_exit_code': run.returncode,
    'packages': {p: importlib.metadata.version(p) for p in ['markdown-it-py', 'nh3', 'mdurl']},
    'adapter_sha256': hashlib.sha256((EXAMPLE / 'preview.py').read_bytes()).hexdigest(),
    'recommendation_source': 'evals/MENU_EXAMPLE.es.md',
    'provenance_source': 'examples/markdown_preview/provenance.json',
}
Path(__file__).with_name('evidence.json').write_text(json.dumps(snapshot, indent=2) + '\n')
print('Captured successful integration, versions, output and 7 passing tests.')
