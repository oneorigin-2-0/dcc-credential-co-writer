# Fonts Guide

The system includes 4 bundled fonts for text rendering. Fonts are located in `assets/fonts/`.

## Available Fonts

| Font | Filename | Style | Size |
|------|----------|-------|------|
| Arimo | `Arimo-Regular.ttf` | Regular | 467KB |
| Arimo Bold | `Arimo-Bold.ttf` | Bold | 475KB |
| Open Sans | `OpenSans.ttf` | Regular | 217KB |
| Roboto | `Roboto.ttf` | Regular | 468KB |

> Arimo is an open-licensed (SIL Open Font License v1.1), metric-compatible
> substitute for Arial, so existing configurations that previously referenced
> Arial render identically. See `assets/fonts/LICENSE-Arimo.txt` for the font
> license.

## Usage

### In Layer Configuration

```json
{
  "type": "TextLayer",
  "text": "Badge Title",
  "font": {
    "path": "assets/fonts/Arimo-Bold.ttf",
    "size": 45
  },
  "color": "#FFFFFF",
  "align": {"x": "center", "y": "center"},
  "z": 30
}
```

### Font Selection Guidelines

| Use Case | Recommended Font |
|----------|-----------------|
| Titles | `Arimo-Bold.ttf` |
| Subtitles | `Arimo-Regular.ttf` |
| Body text | `OpenSans.ttf` |
| Modern look | `Roboto.ttf` |

## Font Size Guidelines

Font sizes are specified in pixels and scaled by `scale_factor`:

| Content Type | Size Range | Default |
|--------------|------------|---------|
| Main title | 40-45 | 43 |
| Subtitle | 36-40 | 40 |
| Small text | 24-32 | 28 |

### Automatic Font Sizing

The config generator adjusts font size based on text length:

| Text Length | Size Adjustment |
|-------------|----------------|
| < 20 chars | Base size |
| 20-30 chars | Base - 4 |
| > 30 chars | Base - 7 (min 36) |

## Scale Factor Impact

Font sizes are multiplied by `scale_factor`:

| Font Size | scale_factor 1.0 | scale_factor 2.0 | scale_factor 3.0 |
|-----------|------------------|------------------|------------------|
| 45 | 45px | 90px | 135px |
| 40 | 40px | 80px | 120px |
| 32 | 32px | 64px | 96px |

## Text Alignment

### Horizontal Alignment

| Value | Behavior |
|-------|----------|
| `"left"` | Align to left edge |
| `"center"` | Center horizontally |
| `"right"` | Align to right edge |
| Number | Pixel offset from left |

### Vertical Alignment

| Value | Behavior |
|-------|----------|
| `"top"` | Align to top edge |
| `"center"` | Center vertically |
| `"bottom"` | Align to bottom edge |
| `"dynamic"` | Position based on shape bounds |
| Number | Pixel offset from top |

## Dynamic Text Wrapping

Enable dynamic text wrapping to fit text within shapes:

```json
{
  "type": "TextLayer",
  "text": "This is a long text that will wrap within the shape",
  "font": {"path": "assets/fonts/Arimo-Regular.ttf", "size": 40},
  "wrap": {
    "dynamic": true,
    "line_gap": 6
  },
  "align": {"x": "center", "y": "dynamic"}
}
```

### Line Gap

Space between lines in wrapped text:

| Value | Spacing |
|-------|---------|
| 4 | Tight |
| 6 | Normal |
| 8 | Loose |

## System Font Fallback

If bundled fonts aren't suitable, you can use system fonts:

### macOS

```json
{
  "font": {
    "path": "/System/Library/Fonts/Helvetica.ttc",
    "size": 45
  }
}
```

### Linux

```json
{
  "font": {
    "path": "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "size": 45
  }
}
```

### Windows

```json
{
  "font": {
    "path": "C:/Windows/Fonts/arial.ttf",
    "size": 45
  }
}
```

## Text Color

Text color is specified as a hex color code:

```json
{
  "type": "TextLayer",
  "text": "Title",
  "color": "#FFFFFF"
}
```

### Color Recommendations

| Background | Text Color |
|------------|------------|
| Dark | `#FFFFFF` (white) |
| Light | `#000000` (black) |
| Medium | High contrast color |

The config generator automatically selects text colors based on background luminance.

## Example Configurations

### Title Layer

```json
{
  "type": "TextLayer",
  "text": "Python Expert",
  "font": {
    "path": "assets/fonts/Arimo-Bold.ttf",
    "size": 43
  },
  "color": "#FFFFFF",
  "align": {"x": "center", "y": "dynamic"},
  "wrap": {"dynamic": true, "line_gap": 5},
  "z": 30
}
```

### Subtitle Layer

```json
{
  "type": "TextLayer",
  "text": "Mastering the Fundamentals",
  "font": {
    "path": "assets/fonts/Arimo-Regular.ttf",
    "size": 28
  },
  "color": "#FFD43B",
  "align": {"x": "center", "y": "dynamic"},
  "wrap": {"dynamic": true, "line_gap": 4},
  "z": 31
}
```

## Troubleshooting

### Font Not Found

If you see font errors:

1. Check the font path exists: `ls assets/fonts/`
2. Verify the filename matches exactly (case-sensitive)
3. Use absolute paths if relative paths fail

### Text Not Visible

1. Check the `color` contrasts with background
2. Verify the `z` index is higher than shape layer
3. Ensure text is within canvas bounds

### Text Clipped

1. Reduce font size
2. Enable dynamic wrapping
3. Increase shape size
