# Badge Image Generation - Documentation

A comprehensive educational badge generation system featuring a FastAPI REST API with layer-based image composition.

## Quick Links

| Section | Description |
|---------|-------------|
| [API Reference](./api/README.md) | Endpoints, request/response schemas, examples |
| [Architecture](./architecture/README.md) | System design, layer system, rendering pipeline |
| [Developer Guide](./developer/README.md) | Setup, workflow, testing, deployment |
| [Assets](./assets/icons-catalog.md) | Icons, fonts, and logos catalog |

## Overview

This service generates custom badge images using a **layer-based composition system**. Badges are built by stacking layers (background, shapes, logos, text) with configurable properties.

### Key Features

- **Layer Composition**: Build badges from stackable layers (Background, Shape, Logo, Text)
- **Multiple Shapes**: Hexagon, circle, rounded rectangle, shield, ribbon
- **Dynamic Positioning**: Automatic text wrapping and logo placement within shapes
- **Gradient Support**: Vertical/horizontal gradients for shape fills
- **AI Icon Matching**: Automatically suggest icons based on badge description
- **Color Scraping**: Extract institution colors from URLs

### Quick Start

```bash
# Start the API server
python -m app.main

# Health check
curl http://localhost:3001/badge-image/health

# Generate a badge
curl -X POST http://localhost:3001/api/v1/badge/generate-with-text \
  -H "Content-Type: application/json" \
  -d '{
    "image_type": "text_overlay",
    "short_title": "Python Expert",
    "image_configuration": {
      "primary_color": "#4B8BBE",
      "shape": "hexagon"
    }
  }'
```

### Services

| Service | Port | Purpose |
|---------|------|---------|
| FastAPI | 3001 | Production REST API |
| Gradio | 7870 | Interactive testing UI |

## Version

- **API Version**: 1.0.0
- **Canvas Size**: 600x600 (fixed, scaled by `scale_factor`)
- **Output Format**: PNG (base64 encoded)

## Support

- [API Documentation (Swagger)](http://localhost:3001/badge-image/docs)
- [Gradio Interface](http://localhost:7870)
