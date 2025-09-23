#!/usr/bin/env python3
"""Test script to generate a badge without running the Gradio interface"""

import json
from config import default_badge_config
from composer import render_from_spec

# Generate badge with default config
image = render_from_spec(default_badge_config)

# Save the image
image.save("test_badge.png")
print("Badge generated successfully and saved as test_badge.png")

# Test with modified config
test_config = default_badge_config.copy()
test_config["layers"][3]["text"] = "Custom Title"
test_config["layers"][4]["text"] = "Custom Subtitle"
test_config["layers"][6]["text"] = "Python"

image2 = render_from_spec(test_config)
image2.save("test_badge_custom.png")
print("Custom badge generated successfully and saved as test_badge_custom.png")