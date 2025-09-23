# Badge Generator API Documentation

## Base URL
```
http://localhost:3001
```

## Endpoints

### Generate Badge
Generate a custom badge image from JSON configuration.

**Endpoint:** `POST /api/badge/generate`

**Content-Type:** `application/json`

**Response Format:** `application/json`

---

## Request Structure

### Request Body
```json
{
  "layers": [
    // Array of layer objects
  ]
}
```

### Canvas Configuration

**Note:** Canvas dimensions are fixed at 600×600 pixels and cannot be changed.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `bg` | string | No | "white" | Background color (hex or color name) |
| `scale_factor` | float | No | 1 | Scale factor for final image |

### Layer Types

Each layer in the `layers` array must have a `type` field and `z` index for layering order.

#### 1. BackgroundLayer
Creates a solid background color.

```json
{
  "type": "BackgroundLayer",
  "mode": "solid",
  "color": "#FFFFFF",
  "z": 0
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `type` | string | Yes | - | Must be "BackgroundLayer" |
| `mode` | string | Yes | - | Must be "solid" |
| `color` | string | Yes | - | Background color (hex or name) |
| `z` | integer | Yes | - | Layer z-index (0=bottom) |

#### 2. ShapeLayer
Renders geometric shapes with solid or gradient fills and optional borders.

```json
{
  "type": "ShapeLayer",
  "shape": "hexagon",
  "fill": {
    "mode": "gradient",
    "start_color": "#FFD700",
    "end_color": "#FF4500",
    "vertical": true
  },
  "border": {
    "color": "#800000",
    "width": 6
  },
  "params": {
    "radius": 250
  },
  "z": 10
}
```

**Supported Shapes:**
- `hexagon` - Six-sided polygon (radius: 250)
- `circle` - Perfect circle (radius: 250)
- `rounded_rect` - Rectangle with rounded corners (width: 450, height: 450)

**Shape-Specific Examples:**

**Hexagon:**
```json
{
  "type": "ShapeLayer",
  "shape": "hexagon",
  "fill": { "mode": "solid", "color": "#FFD700" },
  "params": { "radius": 250 },
  "z": 10
}
```

**Circle:**
```json
{
  "type": "ShapeLayer",
  "shape": "circle",
  "fill": { "mode": "solid", "color": "#FFD700" },
  "params": { "radius": 250 },
  "z": 10
}
```

**Rounded Rectangle:**
```json
{
  "type": "ShapeLayer",
  "shape": "rounded_rect",
  "fill": { "mode": "solid", "color": "#FFD700" },
  "params": {
    "width": 450,
    "height": 450,
    "radius": 50
  },
  "z": 10
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `type` | string | Yes | - | Must be "ShapeLayer" |
| `shape` | string | Yes | - | "hexagon", "circle", or "rounded_rect" |
| `fill` | object | Yes | - | Fill configuration |
| `fill.mode` | string | Yes | - | "solid" or "gradient" |
| `fill.color` | string | If mode="solid" | - | Fill color |
| `fill.start_color` | string | If mode="gradient" | - | Gradient start color |
| `fill.end_color` | string | If mode="gradient" | - | Gradient end color |
| `fill.vertical` | boolean | If mode="gradient" | true | Gradient direction |
| `border` | object | No | - | Border configuration |
| `border.color` | string | No | - | Border color (hex) |
| `border.width` | integer | No | - | Border width (0-20 pixels) |
| `params` | object | Yes | - | Shape-specific parameters |
| `z` | integer | Yes | - | Layer z-index (10-19) |

**Shape Parameters:**

**Hexagon Parameters:**
| Parameter | Type | Required | Value | Description |
|-----------|------|----------|-------|-------------|
| `radius` | integer | Yes | 250 | Fixed radius for 600×600 canvas |

**Circle Parameters:**
| Parameter | Type | Required | Value | Description |
|-----------|------|----------|-------|-------------|
| `radius` | integer | Yes | 250 | Fixed radius for 600×600 canvas |

**Rounded Rectangle Parameters:**
| Parameter | Type | Required | Value | Description |
|-----------|------|----------|-------|-------------|
| `width` | integer | Yes | 450 | Fixed width for 600×600 canvas |
| `height` | integer | Yes | 450 | Fixed height for 600×600 canvas |
| `radius` | integer | Yes | 0-100 | Corner radius (0 = sharp corners, 100 = very rounded) |

#### 3. TextLayer
Renders text with customizable font, size, positioning, and automatic text wrapping.

```json
{
  "type": "TextLayer",
  "text": "Sample Badge",
  "font": {
    "path": "/System/Library/Fonts/Arial.ttf",
    "size": 45
  },
  "color": "#000000",
  "align": {
    "x": "center",
    "y": "center"
  },
  "wrap": {
    "dynamic": true,
    "max_width": 400,
    "line_gap": 6
  },
  "z": 30
}
```

**Text Wrapping Options:**

1. **Dynamic wrapping** (default - automatically fits within shapes):
```json
"wrap": {
  "dynamic": true,
  "line_gap": 6
}
```

2. **Fixed width wrapping**:
```json
"wrap": {
  "max_width": 400,
  "line_gap": 8
}
```

3. **No wrapping**:
```json
"wrap": {
  "dynamic": false,
  "max_width": null
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `type` | string | Yes | - | Must be "TextLayer" |
| `text` | string | Yes | - | Text content |
| `font` | object | Yes | - | Font configuration |
| `font.path` | string | Yes | - | Absolute path to font file |
| `font.size` | integer | Yes | - | Font size in points |
| `color` | string | No | "#000000" | Text color |
| `align` | object | No | {"x":"center","y":"center"} | Text alignment |
| `align.x` | string | No | "center" | "left", "center", "right" |
| `align.y` | string | No | "center" | "top", "center", "bottom" |
| `wrap` | object | No | {"dynamic":true,"line_gap":6} | Text wrapping configuration |
| `wrap.dynamic` | boolean | No | true | Enable dynamic wrapping within shapes |
| `wrap.max_width` | integer/null | No | null | Fixed maximum width for wrapping |
| `wrap.line_gap` | integer | No | 6 | Space between lines in pixels |
| `z` | integer | Yes | - | Layer z-index |

**Dynamic Wrapping Behavior:**
- When `dynamic: true`, text automatically wraps to fit within shape boundaries
- Calculates optimal line breaks based on the shape at the text's Y position
- Adds padding (40px) from shape edges for readability
- Falls back to fixed `max_width` if no shape is present

#### 4. ImageLayer
Overlays an image with sizing and positioning options.

```json
{
  "type": "ImageLayer",
  "path": "icons/star.png",
  "size": 150,
  "position": {
    "x": "center",
    "y": "center"
  },
  "opacity": 1.0,
  "z": 20
}
```

**Size Options:**

1. **Simple numeric size** (proportional scaling):
```json
"size": 150
```

2. **Exact dimensions**:
```json
"size": {
  "width": 200,
  "height": 100
}
```

3. **Dynamic sizing** (aspect ratio preserved):
```json
"size": {
  "dynamic": true,
  "max_width": 300,
  "max_height": 150,
  "max_upscale": 2.0
}
```

**Position Options:**

1. **Using position object**:
```json
"position": {
  "x": "center",
  "y": "center"
}
```

2. **Direct y positioning** (x is always centered):
```json
"y": 150
```

3. **Position values**:
- **x**: `"left"`, `"center"`, `"right"`, or numeric pixel value
- **y**: `"top"`, `"center"`, `"bottom"`, or numeric pixel value

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `type` | string | Yes | - | Must be "ImageLayer" |
| `path` | string | Yes | - | Relative path to image |
| `size` | number/object | No | - | Image sizing |
| `position` | object | No | {"x":"center","y":"center"} | Position configuration |
| `position.x` | string/number | No | "center" | Horizontal position |
| `position.y` | string/number | No | "center" | Vertical position |
| `y` | string/number | No | - | Direct y positioning (overrides position.y) |
| `opacity` | float | No | 1.0 | Opacity (0.0-1.0) |
| `z` | integer | Yes | - | Layer z-index |

**Special Defaults for Icons:**
- Images in `icons/` folder default to width=190px when no size specified
- With `dynamic: true`, icons default to 190×190px max bounds

---

## Response Structure

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Badge generated successfully",
  "data": {
    "base64": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "filename": "badge.png",
    "mimeType": "image/png"
  },
  "config": {
    // Original config echoed back
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Operation success status |
| `message` | string | Status message |
| `data` | object | Generated image data |
| `data.base64` | string | Base64 encoded image with data URI |
| `data.filename` | string | Suggested filename |
| `data.mimeType` | string | Image MIME type (always "image/png") |
| `config` | object | Original request configuration |

### Error Response (500 Internal Server Error)
```json
{
  "detail": "Failed to generate badge: [error message]"
}
```

---

## Complete Example

### Request
```bash
curl -X POST http://localhost:3001/api/badge/generate \
  -H "Content-Type: application/json" \
  -d '{
    "canvas": {
      "bg": "white",
      "scale_factor": 1
    },
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
        "params": {
          "radius": 250
        },
        "z": 10
      },
      {
        "type": "ImageLayer",
        "path": "icons/star.png",
        "size": {
          "dynamic": true,
          "max_width": 100,
          "max_height": 100
        },
        "position": {
          "x": "center",
          "y": 100
        },
        "opacity": 0.9,
        "z": 20
      },
      {
        "type": "TextLayer",
        "text": "Achievement",
        "font": {
          "path": "/System/Library/Fonts/Arial.ttf",
          "size": 48
        },
        "color": "#FFFFFF",
        "align": {
          "x": "center",
          "y": "center"
        },
        "z": 30
      },
      {
        "type": "TextLayer",
        "text": "Badge Earned",
        "font": {
          "path": "/System/Library/Fonts/Arial.ttf",
          "size": 24
        },
        "color": "#FFFFFF",
        "align": {
          "x": "center",
          "y": 400
        },
        "z": 31
      }
    ]
  }'
```

### Response
```json
{
  "success": true,
  "message": "Badge generated successfully",
  "data": {
    "base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAlgAAAJY...",
    "filename": "badge.png",
    "mimeType": "image/png"
  },
  "config": {
    "canvas": { "bg": "white", "scale_factor": 1 },
    "layers": [...]
  }
}
```

---

## Integration Examples

### JavaScript/TypeScript
```javascript
const generateBadge = async (config) => {
  const response = await fetch('http://localhost:3001/api/badge/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config)
  });

  const result = await response.json();

  if (result.success) {
    // Display the image
    const img = document.createElement('img');
    img.src = result.data.base64;
    document.body.appendChild(img);
  }
};
```

### Python
```python
import requests
import base64
from PIL import Image
from io import BytesIO

config = {
    "canvas": {"bg": "white"},
    "layers": [...]
}

response = requests.post(
    'http://localhost:3001/api/badge/generate',
    json=config
)

if response.status_code == 200:
    result = response.json()
    # Decode base64 image
    base64_str = result['data']['base64'].split(',')[1]
    img_data = base64.b64decode(base64_str)
    img = Image.open(BytesIO(img_data))
    img.show()
```

---

## Notes

1. **Canvas Size**: Fixed at 600×600 pixels, cannot be changed
2. **Font Paths**: Must be absolute paths to .ttf or .otf files on the server
3. **Image Paths**: Relative to `/services/image-generation/src/`
4. **Layer Order**: Lower `z` values render first (background), higher values on top
5. **Colors**: Support hex codes (#RRGGBB) or CSS color names

---

## Rate Limits & CORS

- **CORS**: Currently allows all origins (`*`). Configure for production.
- **Rate Limiting**: Not implemented. Consider adding for production.
- **Max Request Size**: Default FastAPI limits apply.

---

## Health Check

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "service": "badge-generator-api"
}
```

---

## Interactive Documentation

FastAPI provides auto-generated interactive API documentation:

- **Swagger UI**: http://localhost:3001/docs
- **ReDoc**: http://localhost:3001/redoc

These interfaces allow you to test the API directly in your browser.