#!/usr/bin/env python3
"""
Local dev-only Gradio JSON editor for the badge image generator.

This is a developer convenience UI, not part of the deployed service. Gradio is
not a runtime dependency; install it from requirements-dev.txt to use this tool:

    pip install -r requirements-dev.txt
    python tools/gradio_main.py

It serves an interactive JSON-config editor at http://localhost:7870 backed by
the same rendering pipeline as the API.
"""

import os
import sys

# Make `app.*` imports resolve no matter where this script is launched from, and
# allow importing the sibling json_editor module in this tools/ directory.
_TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.dirname(_TOOLS_DIR)
for _path in (_PROJECT_ROOT, _TOOLS_DIR):
    if _path not in sys.path:
        sys.path.insert(0, _path)

from json_editor import create_json_interface


if __name__ == "__main__":
    # Create and launch the JSON editor interface
    demo = create_json_interface()
    demo.launch(show_api=True, server_port=7870)
