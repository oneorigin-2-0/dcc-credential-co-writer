# Logos Guide

The system includes institutional logos for badge generation. Logos are located in `assets/logos/`.

## Available Logos

| Logo | Filename | Format | Description |
|------|----------|--------|-------------|
| DCC | `dcc_logo.png` | PNG | Default logo |
| MIT | `mit_logo.webp` | WebP | MIT logo |
| WGU | `wgu_logo.png` | PNG | Western Governors University |

## Usage

### In Layer Configuration

```json
{
  "type": "LogoLayer",
  "path": "assets/logos/mit_logo.webp",
  "size": {"dynamic": true},
  "position": {"x": "center", "y": "dynamic"},
  "z": 20
}
```

### Default Logo

When no custom logo is provided, the system uses `dcc_logo.png` as the default.

## Dynamic Sizing

Enable dynamic sizing to automatically fit logos within shapes:

```json
{
  "type": "LogoLayer",
  "path": "assets/logos/mit_logo.webp",
  "size": {"dynamic": true},
  "position": {"x": "center", "y": "dynamic"},
  "z": 20
}
```

Dynamic sizing calculates appropriate dimensions based on:
- Shape type and size
- Available space
- Aspect ratio preservation

### Fixed Sizing

For explicit control over dimensions:

```json
{
  "type": "LogoLayer",
  "path": "assets/logos/mit_logo.webp",
  "size": {
    "width": 150,
    "height": 100
  },
  "position": {"x": "center", "y": 100},
  "z": 20
}
```

## Dynamic Positioning

Dynamic positioning places logos at optimal locations within shapes:

| Position | Calculation |
|----------|-------------|
| `y: "dynamic"` | Logo center at 25% from shape top |
| `x: "center"` | Horizontally centered |

```json
{
  "position": {"x": "center", "y": "dynamic"}
}
```

## Custom Logos

### Via Base64 in Request

Send custom logos as base64 in the request:

```json
{
  "image_type": "text_overlay",
  "short_title": "My Badge",
  "image_configuration": {
    "logo": "data:image/png;base64,iVBORw0KGgo..."
  }
}
```

### Via File Upload

Use the `/badge/generate-with-logo` endpoint:

```bash
curl -X POST http://localhost:3001/api/v1/badge/generate-with-logo \
  -F "logo=@/path/to/custom_logo.png" \
  -F 'config={"layers": [...]}'
```

## Logo Recommendations

### Image Format

| Format | Best For |
|--------|----------|
| PNG | Logos with transparency |
| JPEG | Photographic logos without transparency |

Uploaded logos must be PNG or JPEG; the upload endpoint verifies the file's
magic bytes and rejects other formats (including SVG, which Pillow cannot
rasterize). Bundled assets may also be WebP (see `mit_logo.webp`).

### Dimensions

| Recommendation | Value |
|----------------|-------|
| Minimum size | 200x200 pixels |
| Recommended | 400x400 pixels |
| Maximum | 1000x1000 pixels |

### Transparency

- Use transparent backgrounds for best results
- PNG format preserves transparency
- Avoid white backgrounds unless intentional

## Z-Index Guidelines

| Layer Type | Typical Z-Index |
|------------|-----------------|
| Background | 0-9 |
| Shape | 10-19 |
| Logo | 20-24 |
| Ribbon | 25-29 |
| Text | 30-39 |

## Adding New Logos

1. Add logo file to `assets/logos/`
2. Use PNG format with transparency
3. Recommended size: 400x400 pixels or larger
4. Square or near-square aspect ratio works best

### File Naming

Use descriptive, lowercase names:
- `university_name_logo.png`
- `company_logo.png`

## Example Configurations

### Dynamic Logo

```json
{
  "type": "LogoLayer",
  "path": "assets/logos/mit_logo.webp",
  "size": {"dynamic": true},
  "position": {"x": "center", "y": "dynamic"},
  "z": 20
}
```

### Fixed Position Logo

```json
{
  "type": "LogoLayer",
  "path": "assets/logos/wgu_logo.png",
  "size": {"width": 120, "height": 80},
  "position": {"x": "center", "y": 150},
  "z": 20
}
```

### Logo with Icon Layer

For icon-based badges, use `ImageLayer` instead of `LogoLayer`:

```json
{
  "type": "ImageLayer",
  "path": "assets/icons/trophy.png",
  "size": {"dynamic": true},
  "position": {"x": "center", "y": "center"},
  "z": 25
}
```

## Troubleshooting

### Logo Not Visible

1. Check z-index is higher than shape layer
2. Verify file path is correct
3. Ensure logo isn't positioned outside canvas

### Logo Distorted

1. Use dynamic sizing
2. Check original aspect ratio
3. Maintain proportional width/height

### Logo Too Small/Large

1. Use fixed size for explicit control
2. Adjust dynamic sizing parameters
3. Consider shape size when sizing logos

### Path Not Found

1. Verify file exists: `ls assets/logos/`
2. Check filename case sensitivity
3. Use relative path from project root
