# Open-source credits

Project: Jumpstart Markdown preview composition demo

This provenance report supplements the original license and notice files. It does not certify license compatibility.

## markdown-it-py

- Source: [https://github.com/executablebooks/markdown-it-py](https://github.com/executablebooks/markdown-it-py)
- Revision: [36c5f547144df2d01970a5792d68c71a3380b227](https://github.com/executablebooks/markdown-it-py/tree/36c5f547144df2d01970a5792d68c71a3380b227)
- Use: dependency
- Role: Convert Markdown plus embedded HTML into an HTML fragment.
- Package: markdown-it-py (4.2.0)
- Upstream paths:
  - [markdown_it/main.py](https://github.com/executablebooks/markdown-it-py/blob/36c5f547144df2d01970a5792d68c71a3380b227/markdown_it/main.py)
  - [tests/test_api/test_main.py](https://github.com/executablebooks/markdown-it-py/blob/36c5f547144df2d01970a5792d68c71a3380b227/tests/test_api/test_main.py)
- Local targets: requirements.txt, preview.py
- Modifications: No upstream code modified; configured public APIs in original adapter code.
- Updates: Update the pinned package deliberately, resolve the matching release revision, and rerun all composition tests.
- License: MIT (verified)
- Preserved notices: third_party/markdown-it-py/LICENSE, third_party/markdown-it-py/LICENSE.markdown-it
- License evidence: [source](https://github.com/executablebooks/markdown-it-py/blob/36c5f547144df2d01970a5792d68c71a3380b227/LICENSE), [source](https://github.com/executablebooks/markdown-it-py/blob/36c5f547144df2d01970a5792d68c71a3380b227/LICENSE.markdown-it)
- License notes: Includes the upstream markdown-it notice; mdurl is an installed transitive dependency.

## nh3

- Source: [https://github.com/messense/nh3](https://github.com/messense/nh3)
- Revision: [74f36b850c5cb36435b7d9774fe20d1ba3dd663e](https://github.com/messense/nh3/tree/74f36b850c5cb36435b7d9774fe20d1ba3dd663e)
- Use: dependency
- Role: Apply the product allowlist to the parsed HTML fragment.
- Package: nh3 (0.3.7)
- Upstream paths:
  - [src/lib.rs](https://github.com/messense/nh3/blob/74f36b850c5cb36435b7d9774fe20d1ba3dd663e/src/lib.rs)
  - [tests/test_nh3.py](https://github.com/messense/nh3/blob/74f36b850c5cb36435b7d9774fe20d1ba3dd663e/tests/test_nh3.py)
- Local targets: requirements.txt, preview.py
- Modifications: No upstream code modified; configured public APIs in original adapter code.
- Updates: Update the pinned package deliberately, resolve the matching release revision, and rerun all composition tests.
- License: MIT (verified)
- Preserved notices: third_party/nh3/LICENSE
- License evidence: [source](https://github.com/messense/nh3/blob/74f36b850c5cb36435b7d9774fe20d1ba3dd663e/LICENSE)
- License notes: Python bindings to Ammonia; installed wheel dependencies are not vendored into this example.
