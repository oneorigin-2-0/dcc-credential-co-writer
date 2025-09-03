# Badge Generator API

A FastAPI backend that generates custom badges using Python PIL.

## Quick Start

### 1. Install Dependencies

Using **uv** (recommended):
```bash
cd services/image-generation
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv pip install -e .
```

Using **pip**:
```bash
cd services/image-generation
pip install -r requirements.txt
```

### 2. Run the API Server

```bash
cd services/image-generation/src
python api_server.py
```

The API will start on **http://localhost:3001**

### 3. Test the API

Visit http://localhost:3001 to see the API status, or http://localhost:3001/docs for interactive documentation.

## API Endpoints

### Main Endpoint
- **POST** `/api/badge/generate` - Generate badge from JSON config

### Example Request:
```bash
curl -X POST "http://localhost:3001/api/badge/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "canvas": {"width": 600, "height": 600, "bg": "white", "scale_factor": 1},
    "layers": [
      {"type": "BackgroundLayer", "mode": "solid", "color": "#FFFFFF", "z": 0},
      {"type": "ShapeLayer", "shape": "hexagon", "fill": {"mode": "gradient", "start_color": "#FFD700", "end_color": "#FF4500", "vertical": true}, "params": {"radius": 250}, "z": 10},
      {"type": "TextLayer", "text": "Sample Badge", "font": {"path": "/System/Library/Fonts/Arial.ttf", "size": 45}, "color": "#000000", "align": {"x": "center", "y": "center"}, "z": 30}
    ]
  }'
```

### Response:
```json
{
  "success": true,
  "message": "Badge generated successfully",
  "data": {
    "base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "filename": "badge.png",
    "mimeType": "image/png"
  },
  "config": { /* original config */ }
}
```

## Frontend Integration

Update your frontend API URL to:
```javascript
// In services/client-next/lib/api.js
const API_BASE_URL = 'http://localhost:3001';
```

## Project Structure

```
services/image-generation/
├── README.md
├── requirements.txt      # Python dependencies
├── pyproject.toml       # uv/pip configuration
└── src/
    ├── api_server.py    # 🚀 Main FastAPI application (run this)
    ├── composer.py      # Core image rendering engine
    ├── layers/          # Layer implementations
    │   ├── background.py
    │   ├── shape.py
    │   ├── text.py
    │   └── image.py
    └── utils/           # Utility functions
        ├── geometry.py
        ├── image_processing.py
        └── text.py
```

## Configuration

The API accepts badge configurations with:

- **canvas**: Canvas settings (width, height, background, scale)
- **layers**: Array of layer objects, each with:
  - `type`: Layer type (BackgroundLayer, ShapeLayer, TextLayer, etc.)
  - `z`: Z-index (rendering order, 0=bottom)
  - Layer-specific properties

## Layer Types

### BackgroundLayer
```json
{"type": "BackgroundLayer", "mode": "solid", "color": "#FFFFFF", "z": 0}
```

### ShapeLayer
```json
{
  "type": "ShapeLayer", 
  "shape": "hexagon", 
  "fill": {"mode": "gradient", "start_color": "#FFD700", "end_color": "#FF4500", "vertical": true},
  "params": {"radius": 250},
  "z": 10
}
```

### TextLayer
```json
{
  "type": "TextLayer", 
  "text": "Sample Text", 
  "font": {"path": "/path/to/font.ttf", "size": 45},
  "color": "#000000",
  "align": {"x": "center", "y": "center"},
  "z": 30
}
```
