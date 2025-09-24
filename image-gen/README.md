# Badge Image Generation System

A comprehensive badge generation system featuring both FastAPI REST API and Gradio interactive interface. The system uses a layered architecture for compositing custom badges with support for shapes, text, logos, and icons.

## Project Structure

```
mit-badge-image-generation/
├── app/                          # FastAPI Service
│   ├── main.py                   # FastAPI entry point
│   ├── settings.py               # Configuration settings
│   ├── config.py                 # Badge default configurations
│   ├── json_editor.py            # Gradio interface module
│   ├── api/v1/                   # API endpoints
│   │   └── endpoints/
│   │       ├── badges.py         # Badge generation endpoint
│   │       └── health.py         # Health check endpoint
│   ├── core/                     # Core badge generation logic
│   │   ├── composer.py           # Main rendering engine
│   │   ├── layers/               # Layer rendering system
│   │   │   ├── __init__.py       # Layer registry
│   │   │   ├── base.py           # Abstract Layer class
│   │   │   ├── background.py     # Background rendering
│   │   │   ├── shape.py          # Shape rendering (hexagon/circle/etc)
│   │   │   ├── text.py           # Text rendering with alignment
│   │   │   └── image.py          # Image/logo overlay
│   │   └── utils/                # Utility functions
│   │       ├── geometry.py       # Shape calculations
│   │       ├── text.py           # Text wrapping/alignment
│   │       └── image_processing.py # Image transformations
│   └── models/                   # Pydantic models
├── gradio_main.py                # Gradio service entry point
├── assets/                       # Static assets
│   ├── icons/                    # icons
│   │   ├── trophy.png            # Achievement icons
│   │   ├── graduation-cap.png    # Academic icons
│   │   ├── atom.png              # STEM icons
│   │   └── ...                   # Additional categories
│   └── logos/                    # University logos
│       ├── mit_logo.png
│       ├── wgu_logo.png
│       ├── asu_logo.png
│       └── sjsu_logo.png
└── requirements.txt              # Python dependencies
```

## Features

### Dual Service Architecture
- **FastAPI REST API**: Production-ready API for programmatic badge generation
- **Gradio Interactive Interface**: Real-time JSON editor with live preview
- **Flexible Import System**: Supports both services with consistent codebase

### Badge Generation System
- **Layer-based Composition**: Badges constructed from multiple layers for complex designs
- **Multiple Layer Types**:
  - `BackgroundLayer`: Solid color or gradient backgrounds
  - `ShapeLayer`: Hexagons, circles, rectangles with gradient support
  - `LogoLayer`: University logos with dynamic sizing and positioning
  - `ImageLayer`: Icons with smart scaling
  - `TextLayer`: Multi-line text with dynamic wrapping and alignment
- **Dynamic Positioning**: Intelligent positioning based on shape bounds
- **Shape-aware Text Wrapping**: Text automatically adjusts to fit within boundaries

## Getting Started

### Prerequisites

**For Local Development:**
- Python 3.8+
- Required Python libraries (install via requirements.txt)

```bash
pip install -r requirements.txt
```

**For Docker Deployment:**
- Docker and Docker Compose
- Git (for cloning the repository)
- **Linux/macOS**: Bash shell
- **Windows**: Command Prompt or PowerShell

### Running the Services

#### Docker Deployment (Recommended for Production)

The easiest way to run the Badge Generator API is using Docker:

```bash
# Clone the repository
git clone <repository-url>
cd mit-badge-image-generation

# Start the service using the provided script
# For Linux/macOS:
./scripts/start.sh

# For Windows:
scripts\start.bat
```

The start script will:
- Validate Docker installation
- Create environment files if needed
- Build the Docker image
- Start the containerized service
- Perform health checks
- Display service information

**Manual Docker Commands:**
```bash
# Build and start with docker-compose
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Access the containerized API at:
- API Documentation: `http://localhost:3001/docs`
- Health Check: `http://localhost:3001/api/v1/health`
- API Endpoint: `http://localhost:3001/api/v1/badge/generate`

#### Local Development (FastAPI Service)
```bash
# From project root
python -m app.main

# Or with uvicorn directly
uvicorn app.main:app --host 0.0.0.0 --port 3001 --reload
```

Access at: `http://localhost:3001`
- API Documentation: `http://localhost:3001/docs`
- Health Check: `http://localhost:3001/api/v1/health`

#### Gradio Service (Interactive Interface)
```bash
# From project root
python3 gradio_main.py
```

Access at: `http://127.0.0.1:7870`
- Real-time JSON editor with live preview
- Sample configurations and testing tools

## API Usage

### FastAPI Endpoints

#### Generate Badge
```bash
POST /api/v1/badge/generate
Content-Type: application/json

{
  "canvas": {"width": 600, "height": 600, "bg": "white"},
  "layers": [...]
}
```

#### Example Request
```bash
curl -X POST http://localhost:3001/api/v1/badge/generate \
  -H "Content-Type: application/json" \
  -d '{
    "canvas": {"width": 600, "height": 600, "bg": "white"},
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
        "border": {"color": "#800000", "width": 6},
        "params": {"radius": 250},
        "z": 10
      },
      {
        "type": "LogoLayer",
        "path": "assets/logos/wgu_logo.png",
        "size": {"dynamic": true},
        "position": {"x": "center", "y": "dynamic"},
        "z": 20
      },
      {
        "type": "TextLayer",
        "text": "Achievement Badge",
        "font": {
          "path": "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
          "size": 45
        },
        "color": "#000000",
        "align": {"x": "center", "y": "dynamic"},
        "wrap": {"dynamic": true, "line_gap": 6},
        "z": 30
      }
    ]
  }'
```

### Response Format
```json
{
  "success": true,
  "data": {
    "base64": "data:image/webp;base64,UklGRiQEAABXRUJQ...",
    "filename": "badge.webp",
    "mimeType": "image/webp"
  }
}
```

## Badge Configuration

### Canvas Properties
- `width`, `height`: Canvas dimensions in pixels
- `bg`: Background color ("white", "#FFFFFF", #FFFFFF00 (transparent))

### Layer Types
- `BackgroundLayer`: Solid colors or gradients
- `ShapeLayer`: Geometric shapes (hexagon, circle, rectangle)
- `LogoLayer`: University/organization logos
- `ImageLayer`: Educational icons and images
- `TextLayer`: Text with custom fonts and alignment

### Asset Paths
- **Icons**: `"assets/icons/trophy.png"`
- **Logos**: `"assets/logos/wgu_logo.png"`
- **Fonts**: System font paths or custom font files
