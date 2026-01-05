# Response Schemas

This document describes all response models returned by the API.

## BadgeResponse

**Used by**: All badge generation endpoints

The standard response for badge generation.

```json
{
  "success": true,
  "message": "Badge generated successfully",
  "data": {
    "base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABLAAAASwCAYAAAD..."
  },
  "config": {
    "scale_factor": 2.0,
    "layers": [
      {
        "type": "ShapeLayer",
        "shape": "hexagon",
        "fill": {
          "mode": "gradient",
          "start_color": "#FF6F61",
          "end_color": "#FFB703",
          "vertical": true
        },
        "border": {"color": null, "width": 0},
        "params": {"radius": 250},
        "z": 15
      }
    ]
  }
}
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `success` | boolean | Operation success status |
| `message` | string | Human-readable status message |
| `data` | object | Badge data container |
| `config` | object | Configuration used to generate the badge |

### BadgeData

Nested object containing the generated image.

| Property | Type | Description |
|----------|------|-------------|
| `base64` | string | Base64 encoded PNG with data URI prefix |

### Data URI Format

The `base64` field contains a complete data URI:

```
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABLAAAASwCAYAAAD...
```

This can be used directly in:
- HTML `<img src="...">` tags
- CSS `background-image: url(...)`
- JavaScript image loading

---

## ImageConfigResponse

Alternative response format for unified endpoints.

```json
{
  "image_type": "text_overlay",
  "border_color": "#000000",
  "border_width": 6,
  "primary_color": "#A31F34",
  "secondary_color": "#8A8B8C",
  "shape": "hexagon",
  "logo": "",
  "icon_used": null
}
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `image_type` | string | Badge type used |
| `border_color` | string | Border color applied |
| `border_width` | integer | Border width applied |
| `primary_color` | string | Primary color used |
| `secondary_color` | string | Secondary color used |
| `shape` | string | Shape used |
| `logo` | string | Logo used (base64 or empty) |
| `icon_used` | string | Icon filename (for icon_based) |

---

## BadgeImageResponse

Alternative response format with separate image and config.

```json
{
  "image_base64": "data:image/png;base64,iVBORw0KGgo...",
  "image_config": {
    "image_type": "text_overlay",
    "border_color": "#000000",
    "border_width": 6,
    "primary_color": "#A31F34",
    "secondary_color": "#8A8B8C",
    "shape": "hexagon",
    "logo": "",
    "icon_used": null
  }
}
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `image_base64` | string | Base64 encoded PNG with data URI |
| `image_config` | object | Image configuration metadata |

---

## Error Responses

### Validation Error (422)

Returned when request validation fails.

```json
{
  "detail": [
    {
      "loc": ["body", "image_type"],
      "msg": "image_type must be 'text_overlay' or 'icon_based'",
      "type": "value_error"
    }
  ]
}
```

### Bad Request (400)

Returned for business logic errors.

```json
{
  "detail": "short_title is required for text_overlay type"
}
```

### Internal Server Error (500)

Returned for unexpected errors.

```json
{
  "detail": "Failed to generate badge: Font file not found"
}
```

---

## Response Examples by Endpoint

### POST /api/v1/badge/generate

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

### POST /api/v1/badge/generate-with-text

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
        "shape": "hexagon",
        "fill": {
          "mode": "gradient",
          "start_color": "#FF6F61",
          "end_color": "#FFB703",
          "vertical": true
        },
        "border": {"color": "#000000", "width": 6},
        "params": {"radius": 250},
        "z": 15
      },
      {
        "type": "LogoLayer",
        "path": "assets/logos/dcc_logo.png",
        "size": {"dynamic": true},
        "position": {"x": "center", "y": "dynamic"},
        "z": 22
      },
      {
        "type": "TextLayer",
        "text": "Python Expert",
        "font": {"path": "assets/fonts/ArialBold.ttf", "size": 43},
        "color": "#000000",
        "align": {"x": "center", "y": "dynamic"},
        "wrap": {"dynamic": true, "line_gap": 5},
        "z": 30
      }
    ]
  }
}
```

### POST /api/v1/badge/generate-with-icon

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
        "fill": {
          "mode": "gradient",
          "start_color": "#118AB2",
          "end_color": "#06D6A0",
          "vertical": true
        },
        "border": {"color": null, "width": 0},
        "params": {"radius": 250},
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

### GET /badge-image/health

```json
{
  "status": "healthy"
}
```

---

## Using the Response

### JavaScript Example

```javascript
const response = await fetch('http://localhost:3001/api/v1/badge/generate-with-text', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    image_type: 'text_overlay',
    short_title: 'Achievement',
    image_configuration: { shape: 'hexagon' }
  })
});

const data = await response.json();

if (data.success) {
  // Use the base64 image directly
  const img = document.createElement('img');
  img.src = data.data.base64;
  document.body.appendChild(img);
}
```

### Python Example

```python
import requests
import base64

response = requests.post(
    'http://localhost:3001/api/v1/badge/generate-with-text',
    json={
        'image_type': 'text_overlay',
        'short_title': 'Achievement',
        'image_configuration': {'shape': 'hexagon'}
    }
)

data = response.json()

if data['success']:
    # Extract base64 and save to file
    base64_data = data['data']['base64'].split(',')[1]
    image_bytes = base64.b64decode(base64_data)

    with open('badge.png', 'wb') as f:
        f.write(image_bytes)
```

---

## Output Dimensions

The output image dimensions depend on `scale_factor`:

| Scale Factor | Dimensions | Use Case |
|--------------|------------|----------|
| 1.0 | 600x600 | Preview |
| 2.0 (default) | 1200x1200 | Standard |
| 3.0 | 1800x1800 | High resolution |
