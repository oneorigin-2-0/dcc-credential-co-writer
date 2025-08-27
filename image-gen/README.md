# MIT Badge Image Generation

This project provides a service for generating custom digital badges based on a flexible JSON configuration. It uses Python with the Pillow library for image manipulation and Gradio to provide an interactive web interface for live editing and previewing badges.

## Project Structure

```
services/image-generation/src/
├── main.py                    # Entry point for the application
├── config.py                  # Default configurations and constants
├── composer.py                # Main rendering engine (Composer class)
├── layers/                    # Layer implementations
│   ├── __init__.py           # Layer registry
│   ├── base.py               # Base Layer class
│   ├── background.py         # BackgroundLayer implementation
│   ├── shape.py              # ShapeLayer implementation
│   ├── image.py              # ImageLayer and LogoLayer implementations
│   └── text.py               # TextLayer implementation
├── utils/                     # Utility functions
│   ├── __init__.py
│   ├── geometry.py           # Shape calculations and bounds detection
│   ├── image_processing.py  # Image utilities (gradients, masks, etc.)
│   └── text.py               # Font loading and text alignment utilities
└── interfaces/                # User interfaces
    ├── __init__.py
    └── json_editor.py       # Gradio web interface
```

## Features

- **Modular Architecture**: Clean separation of concerns with organized modules for layers, utilities, and interfaces.
- **Layer-based Image Composition**: Badges are constructed from multiple layers, allowing for complex designs.
- **Multiple Layer Types**:
  - `BackgroundLayer`: Solid color or gradient backgrounds.
  - `ShapeLayer`: Customizable shapes like hexagons, circles, shields, and rounded rectangles.
  - `LogoLayer`: For adding school or organization logos with dynamic sizing.
  - `ImageLayer`: For adding generic images with controls for size, position, and opacity.
  - `TextLayer`: For adding titles, subtitles, and other information with dynamic font sizing support.
- **Dynamic Layouts**: Supports dynamic positioning of elements and automatic text wrapping to fit within shapes.
- **Shape-aware Text Wrapping**: Text automatically adjusts to fit within the boundaries of shapes.
- **Highly Customizable**: Control colors, fonts, gradients, borders, and opacity.
- **Interactive Editor**: A Gradio-based web UI allows for real-time editing of the badge's JSON configuration and provides an instant preview.

## Getting Started

### Prerequisites

- Python 3.x
- The following Python libraries: `Pillow`, `gradio`.

You can install the dependencies using pip:
```bash
pip install Pillow gradio
```

### Running the Service

To start the interactive badge generator, navigate to the source directory and run:

```bash
cd services/image-generation/src
python3 main.py
```

This will launch a local web server, and you can access the interface by navigating to the URL provided in the console (usually `http://127.0.0.1:7870`).

## JSON Configuration

The badges are defined by a JSON object with two main keys: `canvas` and `layers`.

- `canvas`: Defines the properties of the image canvas, such as width, height, and background color.
- `layers`: An array of objects, where each object represents a layer in the badge. The `z` property determines the stacking order (higher values are on top).

### Example Configuration

Here is an example of a JSON configuration for a badge:

```json
{
  "canvas": {"width": 600, "height": 600, "bg": "white", "scale_factor": 1},
  "layers": [
    {"type": "BackgroundLayer", "mode": "solid", "color": "#FFFFFF", "z": 0},
    {
      "type": "ShapeLayer",
      "shape": "hexagon",
      "fill": {
        "mode": "gradient",
        "start_color": "#FFD700",
        "end_color": "#FF4500",
        "vertical": true
      },
      "border": {"color": "#800000", "width": 6},
      "params": {"radius": 250},
      "z": 10
    },
    {
      "type": "LogoLayer",
      "path": "../assets/logos/wgu_logo.png",
      "size": {"dynamic": true},
      "position": {"x": "center", "y": "dynamic"},
      "z": 20
    },
    {
      "type": "ImageLayer",
      "path": "../assets/ribbon2.png",
      "size": {"width": 610, "height": 120},
      "position": {"x": "center", "y": 230},
      "z": 25,
      "opacity": 1.0
    },
    {
      "type": "TextLayer",
      "text": "Spark Challenge",
      "font": {"path": "/System/Library/Fonts/Supplemental/Arial Bold.ttf", "size": 45},
      "color": "#000000",
      "align": {"x": "center", "y": "dynamic"},
      "wrap": {"dynamic": true, "line_gap": 6},
      "z": 30
    }
  ]
}
