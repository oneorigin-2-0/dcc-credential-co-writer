# API Endpoints

This document provides detailed documentation for all API endpoints.

## POST /api/v1/badge/generate

Generate a badge from raw layer configuration. This is the low-level API for maximum control.

### Request

**Content-Type**: `application/json`

**Body**: [BadgeRequest](./request-schemas.md#badgerequest)

```json
{
  "layers": [
    {
      "type": "ShapeLayer",
      "shape": "hexagon",
      "fill": {
        "mode": "gradient",
        "start_color": "#4B8BBE",
        "end_color": "#306998",
        "vertical": true
      },
      "border": {"color": "#FFD43B", "width": 6},
      "params": {"radius": 250},
      "z": 10
    },
    {
      "type": "TextLayer",
      "text": "Python Expert",
      "font": {"path": "assets/fonts/ArialBold.ttf", "size": 45},
      "color": "#FFFFFF",
      "align": {"x": "center", "y": "center"},
      "z": 30
    }
  ],
  "scale_factor": 2.0
}
```

### Response

**Status**: `200 OK`

```json
{
  "success": true,
  "message": "Badge generated successfully",
  "data": {
    "base64": "data:image/png;base64,..."
  },
  "config": {
    "scale_factor": 2.0,
    "layers": [...]
  }
}
```

### cURL Example

```bash
curl -X POST http://localhost:3001/api/v1/badge/generate \
  -H "Content-Type: application/json" \
  -d '{
    "layers": [
      {
        "type": "ShapeLayer",
        "shape": "hexagon",
        "fill": {"mode": "solid", "color": "#4B8BBE"},
        "params": {"radius": 250},
        "z": 10
      },
      {
        "type": "TextLayer",
        "text": "Hello",
        "font": {"path": "assets/fonts/Arial.ttf", "size": 45},
        "color": "#FFFFFF",
        "align": {"x": "center", "y": "center"},
        "z": 30
      }
    ],
    "scale_factor": 2.0
  }'
```

---

## POST /api/v1/badge/generate-with-text

Generate a text overlay badge. This high-level API automatically creates the layer configuration.

### Request

**Content-Type**: `application/json`

**Body**: [BadgeGenerationRequest](./request-schemas.md#badgegenerationrequest) with `image_type: "text_overlay"`

```json
{
  "image_type": "text_overlay",
  "short_title": "Python Expert",
  "institution": "MIT",
  "achievement_phrase": "Master Coder",
  "institute_url": "https://mit.edu",
  "image_configuration": {
    "primary_color": "#A31F34",
    "secondary_color": "#8A8B8C",
    "border_color": "#000000",
    "border_width": 6,
    "shape": "hexagon",
    "logo": "",
    "ribbon_type": "ribbon_folded"
  },
  "scale_factor": 2.0
}
```

### Required Fields

| Field | Description |
|-------|-------------|
| `image_type` | Must be `"text_overlay"` |
| `short_title` | Badge title text |
| `image_configuration` | Image styling configuration |

### Optional Features

| Feature | Description |
|---------|-------------|
| `institute_url` | If provided, colors are scraped from the URL |
| `logo` | Base64 encoded custom logo replaces default |
| `ribbon_type` | Control ribbon appearance |

### Response

**Status**: `200 OK`

```json
{
  "success": true,
  "message": "Badge generated successfully",
  "data": {
    "base64": "data:image/png;base64,..."
  },
  "config": {
    "scale_factor": 2.0,
    "layers": [...]
  }
}
```

### cURL Example

```bash
curl -X POST http://localhost:3001/api/v1/badge/generate-with-text \
  -H "Content-Type: application/json" \
  -d '{
    "image_type": "text_overlay",
    "short_title": "Data Science Expert",
    "institution": "Stanford",
    "achievement_phrase": "Analytics Master",
    "image_configuration": {
      "primary_color": "#8C1515",
      "shape": "hexagon",
      "border_color": "#B1040E",
      "border_width": 4
    }
  }'
```

### cURL with Color Scraping

```bash
curl -X POST http://localhost:3001/api/v1/badge/generate-with-text \
  -H "Content-Type: application/json" \
  -d '{
    "image_type": "text_overlay",
    "short_title": "AI Researcher",
    "institute_url": "https://stanford.edu",
    "image_configuration": {
      "shape": "circle"
    }
  }'
```

---

## POST /api/v1/badge/generate-with-icon

Generate an icon-based badge. The icon is automatically matched based on badge name and description.

### Request

**Content-Type**: `application/json`

**Body**: [BadgeGenerationRequest](./request-schemas.md#badgegenerationrequest) with `image_type: "icon_based"`

```json
{
  "image_type": "icon_based",
  "badge_name": "Science Achievement",
  "badge_description": "Completed all chemistry experiments with excellence",
  "institution": "Harvard",
  "image_configuration": {
    "primary_color": "#A51C30",
    "secondary_color": "#1E1E1E",
    "shape": "circle"
  },
  "scale_factor": 2.0
}
```

### Required Fields

| Field | Description |
|-------|-------------|
| `image_type` | Must be `"icon_based"` |
| `badge_name` | Name of the badge (used for icon matching) |
| `badge_description` | Description (used for icon matching) |
| `image_configuration` | Image styling configuration |

### Icon Matching

The system uses AI (sentence-transformers) to match the badge name and description to the most appropriate icon from the catalog.

### Response

**Status**: `200 OK`

```json
{
  "success": true,
  "message": "Badge generated successfully",
  "data": {
    "base64": "data:image/png;base64,..."
  },
  "config": {
    "scale_factor": 2.0,
    "layers": [
      {
        "type": "ShapeLayer",
        "shape": "circle",
        "fill": {...},
        "z": 12
      },
      {
        "type": "ImageLayer",
        "path": "assets/icons/atom.png",
        "size": {"dynamic": true},
        "position": {"x": "center", "y": "center"},
        "z": 25
      }
    ]
  }
}
```

### cURL Example

```bash
curl -X POST http://localhost:3001/api/v1/badge/generate-with-icon \
  -H "Content-Type: application/json" \
  -d '{
    "image_type": "icon_based",
    "badge_name": "Programming Excellence",
    "badge_description": "Mastered advanced programming concepts and algorithms",
    "image_configuration": {
      "primary_color": "#4B8BBE",
      "shape": "hexagon"
    }
  }'
```

---

## POST /api/v1/badge/generate-with-logo

Generate a badge with an uploaded custom logo. Uses multipart form data.

### Request

**Content-Type**: `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `logo` | file | Logo image file (PNG or SVG) |
| `config` | string | Badge configuration as JSON string |

### Config Format

```json
{
  "layers": [
    {
      "type": "ShapeLayer",
      "shape": "hexagon",
      "fill": {"mode": "solid", "color": "#4B8BBE"},
      "params": {"radius": 250},
      "z": 10
    },
    {
      "type": "LogoLayer",
      "path": "placeholder",
      "size": {"dynamic": true},
      "position": {"x": "center", "y": "dynamic"},
      "z": 20
    },
    {
      "type": "TextLayer",
      "text": "Custom Badge",
      "font": {"path": "assets/fonts/Arial.ttf", "size": 40},
      "color": "#FFFFFF",
      "align": {"x": "center", "y": "dynamic"},
      "z": 30
    }
  ],
  "scale_factor": 2.0
}
```

The `LogoLayer.path` will be replaced with the uploaded file.

### Response

**Status**: `200 OK`

```json
{
  "success": true,
  "message": "Badge generated successfully",
  "data": {
    "base64": "data:image/png;base64,..."
  },
  "config": {
    "scale_factor": 2.0,
    "layers": [...]
  }
}
```

### cURL Example

```bash
curl -X POST http://localhost:3001/api/v1/badge/generate-with-logo \
  -F "logo=@/path/to/logo.png" \
  -F 'config={
    "layers": [
      {
        "type": "ShapeLayer",
        "shape": "hexagon",
        "fill": {"mode": "solid", "color": "#4B8BBE"},
        "params": {"radius": 250},
        "z": 10
      },
      {
        "type": "LogoLayer",
        "path": "placeholder",
        "size": {"dynamic": true},
        "position": {"x": "center", "y": "dynamic"},
        "z": 20
      }
    ],
    "scale_factor": 2.0
  }'
```

---

## GET /badge-image/health

Health check endpoint.

### Request

No body required.

### Response

**Status**: `200 OK`

```json
{
  "status": "healthy"
}
```

### cURL Example

```bash
curl http://localhost:3001/badge-image/health
```

---

## Common Parameters

### scale_factor

Controls output image dimensions.

| Value | Output Size |
|-------|-------------|
| 1.0 | 600x600 |
| 2.0 (default) | 1200x1200 |
| 3.0 | 1800x1800 |

### shape

Available shape options:

| Value | Description |
|-------|-------------|
| `hexagon` | Regular hexagon |
| `circle` | Circle |
| `rounded_rect` | Rounded rectangle |

### ribbon_type

Available ribbon options (for text overlay badges):

| Value | Description |
|-------|-------------|
| `ribbon` | Classic banner with V-notch tails |
| `ribbon_folded` | 3D folded effect |
| `none` | No ribbon |
| `null` | Random (50% chance of ribbon) |

---

## Error Responses

All endpoints may return error responses. See [Error Handling](./error-handling.md) for details.

| Status | Description |
|--------|-------------|
| 400 | Bad request (invalid parameters) |
| 422 | Validation error |
| 500 | Internal server error |
