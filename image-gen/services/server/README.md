# Badge Generation API Server

A Node.js Express server that provides a REST API wrapper for the Gradio-based badge generation service.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the Gradio service first (in another terminal):
```bash
cd ../image-generation/src
python3 main.py
```

3. Start the API server:
```bash
npm start
# or for development with auto-reload
npm run dev
```

## API Endpoints

### `POST /api/generate-badge`
Generate a badge with custom configuration

**Request body:**
```json
{
  "canvas": { "width": 600, "height": 600, "bg": "white", "scale_factor": 1 },
  "layers": [
    {
      "type": "BackgroundLayer",
      "mode": "solid",
      "color": "#FFFFFF",
      "z": 0
    },
    {
      "type": "ShapeLayer",
      "shape": "hexagon",
      "fill": {
        "mode": "gradient",
        "start_color": "#FFD700",
        "end_color": "#FF4500",
        "vertical": true
      },
      "params": { "radius": 250 },
      "z": 10
    },
    {
      "type": "TextLayer",
      "text": "Your Text Here",
      "font": { "path": "/System/Library/Fonts/Arial.ttf", "size": 45 },
      "color": "#000000",
      "align": { "x": "center", "y": "center" },
      "z": 30
    }
  ]
}
```

