#!/usr/bin/env python3
"""
Badge Image Generation System - Main Entry Point
"""

from app.json_editor import create_json_interface


if __name__ == "__main__":
    # Create and launch the JSON editor interface
    demo = create_json_interface()
    demo.launch(show_api=True, server_port=7870)