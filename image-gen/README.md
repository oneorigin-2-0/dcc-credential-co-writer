# Badge Image Generation System

A microservice for generating custom badge images with layered composition. This service provides REST APIs for creating badges with shapes, text, logos, and icons. It's designed to be called by the main `mit-slm` service for educational badge generation.

## Architecture Overview

This service is part of a microservices architecture:
- **mit-slm**: Main badge generation service (handles metadata, text optimization, icon suggestions)
- **mit-badge-image-generation**: Image rendering service (handles visual badge generation)

The separation ensures:
- **Scalability**: Image generation can be scaled independently
- **Separation of Concerns**: Business logic (mit-slm) separated from rendering (this service)
- **Maintainability**: Image generation logic centralized in one service

## Project Structure

```
mit-badge-image-generation/
├── app/                          # FastAPI Service
│   ├── main.py                   # FastAPI entry point
│   ├── settings.py               # Configuration settings
│   ├── controllers/              # API controllers
│   │   ├── badge_image.py        # Badge generation endpoints
│   │   └── health.py             # Health check endpoint
│   ├── core/                     # Core infrastructure
│   │   ├── logging_config.py     # Production logging setup
│   │   ├── middleware.py         # Request logging middleware
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
│   ├── models/                   # Pydantic models
│   │   ├── requests.py           # API request models (BadgeRequest, TextOverlayBadgeRequest, IconBasedBadgeRequest)
│   │   └── responses.py          # API response models (BadgeResponse, BadgeData)
│   └── services/                 # Business logic
│       ├── badge_service.py      # Badge rendering service
│       └── config_generator.py   # Intelligent badge configuration generation
├── scripts/                      # Build and deployment scripts
│   ├── start.sh                  # Linux/macOS startup script
│   └── start.bat                 # Windows startup script
├── gradio_main.py                # Gradio service entry point (development/testing)
├── assets/                       # Static assets
│   ├── icons/                    # Educational icons (100+)
│   │   ├── trophy.png            # Achievement icons
│   │   ├── graduation-cap.png    # Academic icons
│   │   ├── atom.png              # STEM icons
│   │   ├── code.png              # Technology icons
│   │   └── ...                   # Additional categories
│   ├── logos/                    # University logos
│   │   ├── mit_logo.webp
│   │   ├── wgu_logo.png
│   │   ├── asu_logo.png
│   │   └── sjsu_logo.png
│   └── fonts/                    # Font files
│       ├── Arial.ttf
│       └── ArialBold.ttf
├── logs/                         # Application logs (auto-created)
│   ├── badge_api.log            # All application logs
│   └── error.log                # Error logs only
├── docker-compose.yml            # Docker service definition
├── Dockerfile                    # Docker image definition
├── requirements.txt              # Python dependencies
├── pyproject.toml               # Python project configuration
├── .env.example                 # Environment configuration template
└── icon_catalog.json            # Icon metadata catalog
```

## Features

### Production-Ready Architecture
- **FastAPI REST API**: Production-ready API with comprehensive logging and monitoring
- **Docker Containerization**: Full Docker support with automated deployment scripts
- **Cross-Platform Support**: Startup scripts for Linux/macOS and Windows
- **Comprehensive Logging**: Request/response logging with automatic log rotation
- **Gradio Interactive Interface**: Real-time JSON editor with live preview (optional)

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

### API Endpoints Overview

The service provides three main endpoints:

1. **`/api/v1/badge/generate`** - Low-level API accepting raw layer configuration
2. **`/api/v1/badge/generate-with-text`** - High-level API for text overlay badges
3. **`/api/v1/badge/generate-with-icon`** - High-level API for icon-based badges

### 1. Generate Badge with Text Overlay

**Endpoint:** `POST /api/v1/badge/generate-with-text`

Generates a badge with text overlay, institution name, and achievement phrase. The service automatically generates a configuration with shapes, colors, and text layers.

**Request:**
```json
{
  "short_title": "Python Expert",
  "institute": "MIT",
  "achievement_phrase": "Code with Confidence",
  "colors": {
    "primary": "#A31F34",
    "secondary": "#8A8B8C",
    "tertiary": "#C2C0BF"
  },
  "seed": 12345
}
```

**Parameters:**
- `short_title` (required): Badge title text
- `institute` (optional): Institution/organization name
- `achievement_phrase` (optional): Achievement phrase or motto
- `colors` (optional): Brand colors (primary, secondary, tertiary)
- `seed` (optional): Random seed for reproducibility

**Example:**
```bash
curl -X POST http://localhost:3001/api/v1/badge/generate-with-text \
  -H "Content-Type: application/json" \
  -d '{
    "short_title": "Python Expert",
    "institute": "MIT",
    "achievement_phrase": "Code with Confidence",
    "colors": {
      "primary": "#A31F34",
      "secondary": "#8A8B8C",
      "tertiary": "#C2C0BF"
    }
  }'
```

### 2. Generate Badge with Icon

**Endpoint:** `POST /api/v1/badge/generate-with-icon`

Generates a badge with an icon/image centered on a decorative shape background.

**Request:**
```json
{
  "icon_name": "trophy.png",
  "colors": {
    "primary": "#A31F34",
    "secondary": "#8A8B8C",
    "tertiary": "#C2C0BF"
  },
  "seed": 12345
}
```

**Parameters:**
- `icon_name` (required): Icon filename from `assets/icons/` (e.g., "trophy.png", "graduation-cap.png", "atom.png")
- `colors` (optional): Brand colors (primary, secondary, tertiary)
- `seed` (optional): Random seed for reproducibility

**Example:**
```bash
curl -X POST http://localhost:3001/api/v1/badge/generate-with-icon \
  -H "Content-Type: application/json" \
  -d '{
    "icon_name": "trophy.png",
    "colors": {
      "primary": "#FFD700",
      "secondary": "#FF8C42"
    }
  }'
```

### 3. Generate Badge (Low-Level API)

**Endpoint:** `POST /api/v1/badge/generate`

Accepts raw layer configuration for full control over badge rendering. This is the low-level API used internally by the other endpoints.

**Request:**
```json
{
  "canvas": {"bg": "white"},
  "layers": [
    {
      "type": "ShapeLayer",
      "shape": "hexagon",
      "fill": {
        "mode": "gradient",
        "start_color": "#FFD700",
        "end_color": "#FF4500",
        "vertical": true
      },
      "params": {"radius": 250},
      "z": 10
    },
    {
      "type": "TextLayer",
      "text": "Achievement",
      "font": {"path": "assets/fonts/Arial.ttf", "size": 45},
      "color": "#000000",
      "align": {"x": "center", "y": "center"},
      "z": 30
    }
  ]
}
```

### Response Format

All endpoints return the same response structure:

```json
{
  "success": true,
  "message": "Badge generated successfully",
  "data": {
    "base64": "data:image/png;base64,iVBORw0KGgoAAAANS..."
  },
  "config": {
    "canvas": {"width": 600, "height": 600},
    "layers": [
      {
        "type": "ShapeLayer",
        "shape": "hexagon",
        "fill": {...},
        "border": {...},
        "params": {...},
        "z": 10
      },
      {
        "type": "TextLayer",
        "text": "Achievement",
        "font": {...},
        "color": "#000000",
        "align": {...},
        "z": 30
      }
    ]
  }
}
```

**Response Fields:**
- `success`: Operation status
- `message`: Status message
- `data.base64`: Base64-encoded PNG image with data URI prefix
- `config`: Complete configuration used to generate the badge (useful for debugging and reproduction)

## Configuration Generator

The service includes intelligent configuration generation (`app/services/config_generator.py`) that creates complete badge designs from simple parameters.

### Automatic Configuration Features

**Text Overlay Badges:**
- Randomly selects shape type (hexagon, circle, rounded rectangle)
- Generates gradient or solid fill with color palettes
- Adds institution logo with dynamic positioning
- Creates text layers with smart wrapping and sizing
- Applies institution brand colors if provided, otherwise uses default palettes

**Icon-Based Badges:**
- Selects decorative shape background
- Centers icon/image in the badge
- Applies brand colors to shapes and borders
- Pure visual design with no text layers

### Color Palette System

**Institution Colors (optional):**
```json
{
  "primary": "#A31F34",    // Used for warm palette
  "secondary": "#8A8B8C",  // Used for cool palette
  "tertiary": "#C2C0BF"    // Additional warm color
}
```

**Default Color Palettes (when colors not provided):**
- **Warm**: `["#FF6F61", "#FF8C42", "#FFB703", "#FB8500", "#E76F51", "#D9544D"]`
- **Cool**: `["#118AB2", "#06D6A0", "#26547C", "#2A9D8F", "#457B9D", "#00B4D8"]`
- **Neutrals**: `["#000000", "#222222", "#333333", "#555555", "#777777", "#999999"]`

### Randomization & Reproducibility

Both high-level endpoints support an optional `seed` parameter for reproducible badge generation. The same seed will always produce the same badge design.

## Integration with Other Services

This microservice is designed to be called by other services via HTTP. It provides both high-level convenience endpoints and low-level configuration control.

### Typical Request Flow

```
External Service
    ↓
[Prepare badge parameters]
    ↓
HTTP POST to /api/v1/badge/generate-with-text or generate-with-icon
    ↓
Badge Image Generation Service
    ↓
[Generate config → Render image → Return both]
    ↓
Response: { data: { base64 }, config: {...} }
```

### Response Components

- **`data.base64`**: Ready-to-use base64-encoded PNG with data URI
- **`config`**: Complete configuration for reproduction or customization

## Badge Configuration Details

### Canvas Properties
- `width`, `height`: Canvas dimensions (fixed at 600x600 pixels)
- `bg`: Background color ("white", "#FFFFFF", "#FFFFFF00" for transparent)

### Layer Types
- **BackgroundLayer**: Solid colors or gradients
- **ShapeLayer**: Geometric shapes (hexagon, circle, rounded_rect) with fill and border
- **LogoLayer**: University/organization logos with dynamic sizing
- **ImageLayer**: Educational icons with smart scaling
- **TextLayer**: Multi-line text with dynamic wrapping and alignment

### Layer Z-Index Ranges
- Background: 0-9
- Shapes: 10-19
- Logos/Images: 20-29
- Text: 30-39

### Asset Paths
- **Icons**: `"assets/icons/trophy.png"`, `"assets/icons/graduation-cap.png"`, etc.
- **Logos**: `"assets/logos/wgu_logo.png"`, `"assets/logos/mit_logo.webp"`, etc.
- **Fonts**: `"assets/fonts/Arial.ttf"`, `"assets/fonts/ArialBold.ttf"`
