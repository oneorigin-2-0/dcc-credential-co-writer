# Rendering Pipeline

This document describes the step-by-step rendering process from JSON configuration to final PNG image.

## Pipeline Overview

```mermaid
flowchart LR
    A[JSON Config] --> B[render_from_spec]
    B --> C[Create Composer]
    C --> D[Create Layers]
    D --> E[Calculate Shape Bounds]
    E --> F[Update Dynamic Positions]
    F --> G[Sort by Z-Index]
    G --> H[Render Each Layer]
    H --> I[PIL Image]
    I --> J[Base64 PNG]
```

## Entry Point

The rendering process starts in `app/core/composer.py`:

```python
def render_from_spec(spec):
    """
    spec: dict or JSON string with keys:
       - canvas: {bg, scale_factor}
       - layers: [ {type: "...", ...}, ... ]
    """
```

### Step 1: Parse Configuration

```python
if isinstance(spec, str):
    spec = json.loads(spec)

canvas = spec.get("canvas", {})
scale_factor = float(canvas.get("scale_factor", 1.0))

# Base dimensions are fixed at 600x600, scaled by scale_factor
W = int(600 * scale_factor)
H = int(600 * scale_factor)
```

### Step 2: Create Composer

```python
comp = Composer(W, H, bg=(255,255,255,0), scale_factor=scale_factor)
```

The `Composer` class manages:
- Canvas dimensions
- Background color
- Layer collection
- Shape bounds for dynamic positioning

### Step 3: Create Layers

```python
for layer_spec in spec.get("layers", []):
    t = layer_spec.get("type")
    cls = LAYER_REGISTRY.get(t)
    if not cls:
        raise ValueError(f"Unknown layer type: {t}")

    # Add scale_factor to layer_spec
    layer_spec_with_scale = {**layer_spec, "scale_factor": scale_factor}
    comp.add(cls(layer_spec_with_scale))
```

The `LAYER_REGISTRY` maps type names to classes:

```python
LAYER_REGISTRY = {
    "BackgroundLayer": BackgroundLayer,
    "ShapeLayer": ShapeLayer,
    "ImageLayer": ImageLayer,
    "LogoLayer": LogoLayer,
    "TextLayer": TextLayer,
}
```

### Step 4: Calculate Shape Bounds

```python
def _calculate_shape_bounds(self):
    """Find the first shape layer and calculate its bounds"""
    for layer in self.layers:
        if isinstance(layer, ShapeLayer):
            self.shape_spec = {
                "shape": layer.shape,
                "params": layer.params
            }
            self.shape_bounds = get_shape_bounds(
                self.shape_spec, self.W, self.H, self.scale_factor
            )
            break
```

Shape bounds include:
- `top`: Y coordinate of shape top
- `bottom`: Y coordinate of shape bottom
- `center`: Y coordinate of shape center

### Step 5: Update Dynamic Positions

```python
def _update_dynamic_positions(self):
    """Update positions of layers that use dynamic positioning"""
    if not self.shape_bounds:
        return

    bounds = self.shape_bounds
    hexagon_height = bounds["bottom"] - bounds["top"]

    # Position calculations
    logo_center_y = bounds["top"] + hexagon_height * 0.25   # 25% from top
    text1_y = bounds["top"] + hexagon_height * 0.46         # 46% from top
    text2_y = bounds["top"] + hexagon_height * 0.66         # 66% from top
```

Dynamic positioning allows elements to automatically position themselves relative to the shape.

### Step 6: Render Layers

```python
def render(self):
    self._calculate_shape_bounds()
    self._update_dynamic_positions()

    # Pass composer reference to TextLayers for dynamic wrapping
    for layer in self.layers:
        if isinstance(layer, TextLayer) and layer.wrap.get("dynamic"):
            layer.composer = self

    # Create canvas
    canvas = Image.new("RGBA", (self.W, self.H), self.bg)

    # Render layers in z-index order
    for layer in sorted(self.layers, key=lambda L: L.z):
        layer.render(canvas)

    return canvas
```

Each layer type implements its own `render(canvas)` method.

## Layer Rendering Details

### BackgroundLayer

Simply fills the entire canvas with a color:

```python
def render(self, canvas):
    if self.mode == "transparent":
        return
    fill = Image.new("RGBA", canvas.size, self.color)
    canvas.alpha_composite(fill)
```

### ShapeLayer

Creates a mask and applies fill/border:

```python
def render(self, canvas):
    W, H = canvas.width, canvas.height

    # Get shape mask
    mask = self._mask((W, H))

    # Apply fill
    if self.fill.get("mode") == "gradient":
        fill_img = make_linear_gradient(...)
    else:
        fill_img = Image.new("RGBA", (W,H), color)

    # Apply mask
    tmp = Image.new("RGBA", (W,H), (0,0,0,0))
    tmp.paste(fill_img, (0,0), mask)
    canvas.alpha_composite(tmp)

    # Draw border
    if self.border.get("width", 0) > 0:
        # Draw shape outline
```

### LogoLayer / ImageLayer

Loads and positions images:

```python
def render(self, canvas):
    # Load and resize image
    img = Image.open(self.path).convert("RGBA")

    # Calculate position
    x = resolve_x(self.position.get("x", "center"))
    y = resolve_y(self.position.get("y", "center"))

    # Composite onto canvas
    canvas.alpha_composite(img, (x, y))
```

### TextLayer

Renders text with optional wrapping:

```python
def render(self, canvas):
    # Load font
    font = load_font(self.font)

    # Calculate text position
    x = resolve_align_x(self.align.get("x", "center"))
    y = resolve_align_y(self.align.get("y", "center"))

    # Wrap text if dynamic
    if self.wrap.get("dynamic") and self.composer:
        lines = wrap_text_dynamic(self.text, font, self.composer)
    else:
        lines = [self.text]

    # Draw each line
    draw = ImageDraw.Draw(canvas)
    for line in lines:
        draw.text((x, y), line, font=font, fill=self.color)
        y += font_size + line_gap
```

## Dynamic Text Wrapping

Text wrapping calculates available width at each Y position:

```python
def get_shape_width_at_y(shape_spec, y, canvas_width, canvas_height, scale_factor):
    """
    Returns the width of the shape interior at a given Y coordinate.
    Used for dynamic text wrapping within shapes.
    """
```

This allows text to wrap appropriately within non-rectangular shapes like hexagons.

## Output Generation

After rendering, the image is converted to base64:

```python
# In BadgeService.generate_badge()
image = render_from_spec(config)

# Convert to base64
buffer = BytesIO()
image.save(buffer, format='PNG', optimize=False)
buffer.seek(0)

img_bytes = buffer.getvalue()
img_base64 = base64.b64encode(img_bytes).decode('utf-8')
data_uri = f"data:image/png;base64,{img_base64}"
```

## Performance Considerations

1. **Scale Factor**: Higher scale factors increase processing time and memory
2. **Number of Layers**: Each layer adds rendering overhead
3. **Dynamic Text**: Text wrapping calculations add processing time
4. **Image Loading**: Large logo/icon files take longer to process

## Error Handling

The pipeline handles errors at multiple levels:

| Location | Error Type | Handling |
|----------|------------|----------|
| `render_from_spec` | Unknown layer type | `ValueError` |
| Layer creation | Missing required properties | `ValueError` |
| Image loading | File not found | `FileNotFoundError` |
| Font loading | Invalid font path | Falls back to default |
