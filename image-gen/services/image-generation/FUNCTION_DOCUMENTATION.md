# Badge Generation System - Function Documentation

This document provides detailed explanations with visual examples for all functions in the badge generation system.

## Table of Contents

1. [Utility Functions](#utility-functions)
   - [Text Utilities](#text-utilities)
   - [Geometry Utilities](#geometry-utilities)
   - [Image Processing Utilities](#image-processing-utilities)
2. [Layer Classes](#layer-classes)
3. [Composer System](#composer-system)
4. [Interface Functions](#interface-functions)

---

## Utility Functions

### Text Utilities (`utils/text.py`)

#### `load_font(path, size, fallback=None)`

**Purpose**: Safely loads a font file with fallback handling.

**Parameters**:
- `path`: Font file path (e.g., "/System/Library/Fonts/Arial.ttf")
- `size`: Font size in pixels
- `fallback`: Optional fallback font (defaults to system default)

**Example**:
```python
# Try to load Arial Bold, fallback to default if not found
font = load_font("/System/Library/Fonts/Arial Bold.ttf", 24)

# With custom fallback
custom_fallback = ImageFont.load_default()
font = load_font("missing_font.ttf", 18, custom_fallback)
```

**What happens internally**:
1. Attempts to load the specified font
2. If it fails (file not found, invalid format), returns fallback
3. If no fallback provided, uses system default font

---

#### `resolve_align(pos, box_w, box_h, img_w, img_h)`

**Purpose**: Converts alignment strings ("center", "left", etc.) to pixel coordinates.

**Parameters**:
- `pos`: Position dict like `{"x": "center", "y": "top"}`
- `box_w, box_h`: Dimensions of element to position
- `img_w, img_h`: Canvas dimensions

**Visual Examples**:

```python
# Example 1: Center alignment
pos = {"x": "center", "y": "center"}
x, y = resolve_align(pos, 200, 100, 600, 400)
# Result: (200, 150)
```

```
Canvas (600x400)
┌─────────────────────────────────────┐
│                                     │
│          ┌──────────────┐           │
│          │    Element   │           │ ← (200, 150)
│          │   (200x100)  │           │
│          └──────────────┘           │
│                                     │
└─────────────────────────────────────┘
```

```python
# Example 2: Top-right alignment
pos = {"x": "right", "y": "top"}
x, y = resolve_align(pos, 150, 50, 600, 400)
# Result: (450, 0)
```

```
Canvas (600x400)
┌─────────────────────────┬─────────┐
│                         │Element  │ ← (450, 0)
│                         │(150x50) │
├─────────────────────────┴─────────┤
│                                   │
│                                   │
│                                   │
└───────────────────────────────────┘
```

**Alignment Options**:
- **X-axis**: "left" (0), "center" (middle), "right" (edge), or pixel value
- **Y-axis**: "top" (0), "center" (middle), "bottom" (edge), or pixel value

---

### Geometry Utilities (`utils/geometry.py`)

#### `get_shape_width_at_y(shape_spec, y_position, canvas_width, canvas_height)`

**Purpose**: Calculates the horizontal width available inside a shape at a specific Y coordinate. Used for smart text wrapping.

**Parameters**:
- `shape_spec`: Shape configuration dict
- `y_position`: Y coordinate to measure width at
- `canvas_width, canvas_height`: Canvas dimensions

**Visual Example - Hexagon**:

```python
shape_spec = {
    "shape": "hexagon",
    "params": {"radius": 200}
}

# Get width at different Y positions
top_width = get_shape_width_at_y(shape_spec, 150, 600, 600)     # Near top
middle_width = get_shape_width_at_y(shape_spec, 300, 600, 600)  # Center
bottom_width = get_shape_width_at_y(shape_spec, 450, 600, 600)  # Near bottom
```

```
Hexagon (radius=200) on 600x600 canvas:

Y=150  ┌─────┐ ← Narrow width (hexagon tapers)
Y=200  ├──────┤
Y=250  ├───────┤
Y=300  ├────────┤ ← Maximum width (center)
Y=350  ├───────┤
Y=400  ├──────┤
Y=450  └─────┘ ← Narrow width (hexagon tapers)
```

**Shape Support**:
- **Hexagon**: Calculates intersection with hexagon edges
- **Circle**: Uses Pythagorean theorem for width at Y
- **Shield**: Returns full width (straight sides)
- **Rounded Rectangle**: Returns width if Y is within bounds

---

#### `get_shape_bounds(shape_spec, canvas_width, canvas_height)`

**Purpose**: Calculates the bounding box (top, bottom, center) of a shape.

**Parameters**:
- `shape_spec`: Shape configuration
- `canvas_width, canvas_height`: Canvas dimensions

**Return Value**: Dict with `top`, `bottom`, `center_x`, `center_y`, `radius`

**Example**:
```python
hexagon_spec = {
    "shape": "hexagon",
    "params": {"radius": 250}
}

bounds = get_shape_bounds(hexagon_spec, 600, 600)
# Returns: {
#     "top": 83,      # Y coordinate of hexagon top
#     "bottom": 517,  # Y coordinate of hexagon bottom  
#     "center_x": 300,
#     "center_y": 300,
#     "radius": 250
# }
```

**Visual Representation**:
```
Canvas (600x600)
┌─────────────────────────────────┐
│                                 │ Y=0
│            ┌─────┐              │ Y=83 (top)
│          ╱         ╲            │
│        ╱             ╲          │
│      ╱                 ╲        │ Y=300 (center_y)
│        ╲             ╱          │
│          ╲         ╱            │
│            └─────┘              │ Y=517 (bottom)
│                                 │
└─────────────────────────────────┘ Y=600
```

---

### Image Processing Utilities (`utils/image_processing.py`)

#### `make_linear_gradient(size, start_hex, end_hex, vertical=True)`

**Purpose**: Creates a gradient image from two colors.

**Parameters**:
- `size`: Tuple (width, height)
- `start_hex`: Starting color (hex string like "#FF0000")
- `end_hex`: Ending color  
- `vertical`: Direction (True = top-to-bottom, False = left-to-right)

**Example**:
```python
# Create a vertical gold-to-orange gradient
gradient = make_linear_gradient((300, 200), "#FFD700", "#FF4500", vertical=True)

# Create a horizontal blue-to-green gradient
gradient = make_linear_gradient((300, 200), "#0000FF", "#00FF00", vertical=False)
```

**Visual Result**:
```
Vertical Gradient (300x200):           Horizontal Gradient (300x200):
┌─────────────────────┐ #FFD700       ┌─────────────────────┐
│ Gold                │               │#0000FF        #00FF00│
│  ↓                  │               │Blue    →    Green   │
│ Transition          │               │                     │
│  ↓                  │               │                     │
│ Orange              │               │                     │
└─────────────────────┘

## Layer Classes

All layer classes inherit from the base `Layer` class and implement a `render(canvas)` method.

### Base Layer (`layers/base.py`)

#### `Layer.__init__(spec)`
**Purpose**: Base class for all layer types. Extracts common properties.
**Properties**: `z` - Layer stacking order (higher = on top)

### BackgroundLayer (`layers/background.py`)
**Purpose**: Creates solid color or gradient backgrounds that fill the entire canvas.

### ShapeLayer (`layers/shape.py`)
**Purpose**: Renders geometric shapes with fills, gradients, and borders.

### ImageLayer & LogoLayer (`layers/image.py`)
**Purpose**: Loads and positions images with size/opacity control.

### TextLayer (`layers/text.py`)
**Purpose**: Renders text with automatic wrapping, alignment, and dynamic positioning.

## Composer System (`composer.py`)

### `Composer` Class

#### `__init__(width, height, bg=(0,0,0,0), scale_factor=1)`
**Purpose**: Main orchestrator for badge rendering.
**Parameters**:
- `width, height`: Canvas dimensions
- `bg`: Background color or transparency
- `scale_factor`: Render at higher resolution then downscale

#### `_calculate_shape_bounds()`
**Purpose**: Finds the main shape layer and calculates its boundaries for dynamic positioning.

#### `_update_dynamic_positions()`  
**Purpose**: Calculates positions for layers with "dynamic" positioning.

**Dynamic Positioning Logic**:
```python
# Based on shape height, position elements at specific percentages
logo_center_y = shape_top + shape_height * 0.2   # 20% from top
title_y = shape_top + shape_height * 0.361        # 36.1% from top  
subtitle_y = shape_top + shape_height * 0.477     # 47.7% from top
skill_badge_y = shape_center + shape_height * 0.15 # 15% below center
```

**Visual Layout**:
```
Shape bounds:
┌─────────────────────┐ ← shape_top
│        LOGO         │ ← 20% from top
│                     │
│    Title Text       │ ← 36.1% from top
│   Subtitle Text     │ ← 47.7% from top
│                     │ ← shape_center
│   [Skill Badge]     │ ← 15% below center
│                     │
└─────────────────────┘ ← shape_bottom
```

#### `render()`
**Purpose**: Main rendering pipeline.

**Process**:
1. Calculate shape bounds
2. Update dynamic positions
3. Pass composer reference to text layers needing dynamic wrapping
4. Create PIL canvas
5. Render layers sorted by z-order (background to foreground)
6. Apply scale factor and resize if needed
7. Clean up references

### `render_from_spec(spec)`
**Purpose**: JSON-to-image entry point.

**Process**:
1. Parse JSON configuration
2. Extract canvas settings
3. Create Composer instance
4. Instantiate layers from LAYER_REGISTRY
5. Add layers to composer
6. Call `composer.render()` to generate final image

**Example Usage**:
```python
config = {
    "canvas": {"width": 600, "height": 600, "scale_factor": 2},
    "layers": [
        {"type": "BackgroundLayer", "color": "#FFFFFF", "z": 0},
        {"type": "ShapeLayer", "shape": "hexagon", "z": 10},
        {"type": "TextLayer", "text": "Hello World", "z": 20}
    ]
}

image = render_from_spec(config)  # Returns PIL Image
image.save("badge.png")
```

## Interface Functions (`interfaces/`)

### JSON Editor (`interfaces/json_editor.py`)

#### `generate_from_json(json_text)`
**Purpose**: Bridge between Gradio UI and rendering engine.
**Process**:
1. Parse JSON text
2. Call `render_from_spec()`
3. Return PIL image and error messages to UI

#### `create_json_interface()`
**Purpose**: Creates Gradio web interface.
**Features**:
- JSON code editor with syntax highlighting
- Real-time badge preview
- Generate/Reset buttons
- Error message display

### Legacy Interface (`interfaces/legacy.py`)

#### `generate_badge(title_text, subtitle_text, skill_text, shape, size)`
**Purpose**: Simple function-based interface (deprecated).
**Process**:
1. Take default configuration
2. Update text content
3. Modify shape parameters
4. Generate badge

## Complete Rendering Flow

```
JSON Configuration
    ↓
render_from_spec()
    ↓
Create Composer(width, height, scale)
    ↓
For each layer in config:
    Create layer instance from LAYER_REGISTRY
    Add to composer
    ↓
composer.render():
    1. _calculate_shape_bounds()
    2. _update_dynamic_positions()  
    3. Pass composer to TextLayers
    4. Create PIL canvas
    5. Sort layers by z-order
    6. Call layer.render(canvas) for each
    7. Apply scaling
    8. Clean up references
    ↓
Return PIL Image
```

This documentation covers all major functions with visual examples to help understand how each component works together to create the final badge image. #FF4500       └─────────────────────┘

## Layer Classes

All layer classes inherit from the base `Layer` class and implement a `render(canvas)` method.

### Base Layer (`layers/base.py`)

#### `Layer.__init__(spec)`
**Purpose**: Base class for all layer types. Extracts common properties.
**Properties**: `z` - Layer stacking order (higher = on top)

### BackgroundLayer (`layers/background.py`)
**Purpose**: Creates solid color or gradient backgrounds that fill the entire canvas.

### ShapeLayer (`layers/shape.py`)
**Purpose**: Renders geometric shapes with fills, gradients, and borders.

### ImageLayer & LogoLayer (`layers/image.py`)
**Purpose**: Loads and positions images with size/opacity control.

### TextLayer (`layers/text.py`)
**Purpose**: Renders text with automatic wrapping, alignment, and dynamic positioning.

## Composer System (`composer.py`)

### `Composer` Class

#### `__init__(width, height, bg=(0,0,0,0), scale_factor=1)`
**Purpose**: Main orchestrator for badge rendering.
**Parameters**:
- `width, height`: Canvas dimensions
- `bg`: Background color or transparency
- `scale_factor`: Render at higher resolution then downscale

#### `_calculate_shape_bounds()`
**Purpose**: Finds the main shape layer and calculates its boundaries for dynamic positioning.

#### `_update_dynamic_positions()`  
**Purpose**: Calculates positions for layers with "dynamic" positioning.

**Dynamic Positioning Logic**:
```python
# Based on shape height, position elements at specific percentages
logo_center_y = shape_top + shape_height * 0.2   # 20% from top
title_y = shape_top + shape_height * 0.361        # 36.1% from top  
subtitle_y = shape_top + shape_height * 0.477     # 47.7% from top
skill_badge_y = shape_center + shape_height * 0.15 # 15% below center
```

**Visual Layout**:
```
Shape bounds:
┌─────────────────────┐ ← shape_top
│        LOGO         │ ← 20% from top
│                     │
│    Title Text       │ ← 36.1% from top
│   Subtitle Text     │ ← 47.7% from top
│                     │ ← shape_center
│   [Skill Badge]     │ ← 15% below center
│                     │
└─────────────────────┘ ← shape_bottom
```

#### `render()`
**Purpose**: Main rendering pipeline.

**Process**:
1. Calculate shape bounds
2. Update dynamic positions
3. Pass composer reference to text layers needing dynamic wrapping
4. Create PIL canvas
5. Render layers sorted by z-order (background to foreground)
6. Apply scale factor and resize if needed
7. Clean up references

### `render_from_spec(spec)`
**Purpose**: JSON-to-image entry point.

**Process**:
1. Parse JSON configuration
2. Extract canvas settings
3. Create Composer instance
4. Instantiate layers from LAYER_REGISTRY
5. Add layers to composer
6. Call `composer.render()` to generate final image

**Example Usage**:
```python
config = {
    "canvas": {"width": 600, "height": 600, "scale_factor": 2},
    "layers": [
        {"type": "BackgroundLayer", "color": "#FFFFFF", "z": 0},
        {"type": "ShapeLayer", "shape": "hexagon", "z": 10},
        {"type": "TextLayer", "text": "Hello World", "z": 20}
    ]
}

image = render_from_spec(config)  # Returns PIL Image
image.save("badge.png")
```

## Interface Functions (`interfaces/`)

### JSON Editor (`interfaces/json_editor.py`)

#### `generate_from_json(json_text)`
**Purpose**: Bridge between Gradio UI and rendering engine.
**Process**:
1. Parse JSON text
2. Call `render_from_spec()`
3. Return PIL image and error messages to UI

#### `create_json_interface()`
**Purpose**: Creates Gradio web interface.
**Features**:
- JSON code editor with syntax highlighting
- Real-time badge preview
- Generate/Reset buttons
- Error message display

### Legacy Interface (`interfaces/legacy.py`)

#### `generate_badge(title_text, subtitle_text, skill_text, shape, size)`
**Purpose**: Simple function-based interface (deprecated).
**Process**:
1. Take default configuration
2. Update text content
3. Modify shape parameters
4. Generate badge

## Complete Rendering Flow

```
JSON Configuration
    ↓
render_from_spec()
    ↓
Create Composer(width, height, scale)
    ↓
For each layer in config:
    Create layer instance from LAYER_REGISTRY
    Add to composer
    ↓
composer.render():
    1. _calculate_shape_bounds()
    2. _update_dynamic_positions()  
    3. Pass composer to TextLayers
    4. Create PIL canvas
    5. Sort layers by z-order
    6. Call layer.render(canvas) for each
    7. Apply scaling
    8. Clean up references
    ↓
Return PIL Image
```

This documentation covers all major functions with visual examples to help understand how each component works together to create the final badge image.
```

---

#### `circle_mask(size, margin)`

**Purpose**: Creates a circular transparency mask.

**Parameters**:
- `size`: Tuple (width, height) 
- `margin`: Distance from edges to circle boundary

**Example**:
```python
mask = circle_mask((200, 200), margin=20)
# Creates a 200x200 mask with circle that has 20px margin from edges
```

**Visual Result**:
```
200x200 mask with margin=20:
┌──────────────────────┐
│        margin        │
│   ┌──────────────┐   │
│   │              │   │ ← Circle area (white = 255)
│   │   CIRCLE     │   │   Outside circle (black = 0)
│   │              │   │
│   └──────────────┘   │
│        margin        │
└──────────────────────┘
```

---

#### `polygon_mask(size, points)` & `rounded_rect_mask(size, rect, radius)`

**Purpose**: Create masks for polygon shapes and rounded rectangles.

**Examples**:
```python
# Triangle mask
triangle_points = [(100, 50), (50, 150), (150, 150)]
mask = polygon_mask((200, 200), triangle_points)

# Rounded rectangle mask
rect_mask = rounded_rect_mask((300, 200), [20, 20, 280, 180], radius=15)
```

---

#### `shield_points(W, H, margin, r, tip_h)`

**Purpose**: Calculates the geometry for a shield shape.

**Parameters**:
- `W, H`: Canvas dimensions
- `margin`: Distance from edges
- `r`: Corner radius for rounded top
- `tip_h`: Height of pointed bottom tip

**Returns**: `(rect_coords, tip_triangle_points)`

**Visual Result**:
```python
W, H = 400, 500
margin = 50
r = 30
tip_h = 80

rect, tip = shield_points(W, H, margin, r, tip_h)
```

```
Shield Shape (400x500):
┌─────────────────────┐
│  margin=50          │
│  ┌───────────────┐  │ ← Rounded rectangle (r=30)
│  │               │  │
│  │   SHIELD      │  │
│  │   BODY        │  │
│  │               │  │
│  └───────┬───────┘  │
│          │          │ 
│          ▼          │ ← Pointed tip (tip_h=80)
│                     │
└─────────────────────┘

## Layer Classes

All layer classes inherit from the base `Layer` class and implement a `render(canvas)` method.

### Base Layer (`layers/base.py`)

#### `Layer.__init__(spec)`
**Purpose**: Base class for all layer types. Extracts common properties.
**Properties**: `z` - Layer stacking order (higher = on top)

### BackgroundLayer (`layers/background.py`)
**Purpose**: Creates solid color or gradient backgrounds that fill the entire canvas.

### ShapeLayer (`layers/shape.py`)
**Purpose**: Renders geometric shapes with fills, gradients, and borders.

### ImageLayer & LogoLayer (`layers/image.py`)
**Purpose**: Loads and positions images with size/opacity control.

### TextLayer (`layers/text.py`)
**Purpose**: Renders text with automatic wrapping, alignment, and dynamic positioning.

## Composer System (`composer.py`)

### `Composer` Class

#### `__init__(width, height, bg=(0,0,0,0), scale_factor=1)`
**Purpose**: Main orchestrator for badge rendering.
**Parameters**:
- `width, height`: Canvas dimensions
- `bg`: Background color or transparency
- `scale_factor`: Render at higher resolution then downscale

#### `_calculate_shape_bounds()`
**Purpose**: Finds the main shape layer and calculates its boundaries for dynamic positioning.

#### `_update_dynamic_positions()`  
**Purpose**: Calculates positions for layers with "dynamic" positioning.

**Dynamic Positioning Logic**:
```python
# Based on shape height, position elements at specific percentages
logo_center_y = shape_top + shape_height * 0.2   # 20% from top
title_y = shape_top + shape_height * 0.361        # 36.1% from top  
subtitle_y = shape_top + shape_height * 0.477     # 47.7% from top
skill_badge_y = shape_center + shape_height * 0.15 # 15% below center
```

**Visual Layout**:
```
Shape bounds:
┌─────────────────────┐ ← shape_top
│        LOGO         │ ← 20% from top
│                     │
│    Title Text       │ ← 36.1% from top
│   Subtitle Text     │ ← 47.7% from top
│                     │ ← shape_center
│   [Skill Badge]     │ ← 15% below center
│                     │
└─────────────────────┘ ← shape_bottom
```

#### `render()`
**Purpose**: Main rendering pipeline.

**Process**:
1. Calculate shape bounds
2. Update dynamic positions
3. Pass composer reference to text layers needing dynamic wrapping
4. Create PIL canvas
5. Render layers sorted by z-order (background to foreground)
6. Apply scale factor and resize if needed
7. Clean up references

### `render_from_spec(spec)`
**Purpose**: JSON-to-image entry point.

**Process**:
1. Parse JSON configuration
2. Extract canvas settings
3. Create Composer instance
4. Instantiate layers from LAYER_REGISTRY
5. Add layers to composer
6. Call `composer.render()` to generate final image

**Example Usage**:
```python
config = {
    "canvas": {"width": 600, "height": 600, "scale_factor": 2},
    "layers": [
        {"type": "BackgroundLayer", "color": "#FFFFFF", "z": 0},
        {"type": "ShapeLayer", "shape": "hexagon", "z": 10},
        {"type": "TextLayer", "text": "Hello World", "z": 20}
    ]
}

image = render_from_spec(config)  # Returns PIL Image
image.save("badge.png")
```

## Interface Functions (`interfaces/`)

### JSON Editor (`interfaces/json_editor.py`)

#### `generate_from_json(json_text)`
**Purpose**: Bridge between Gradio UI and rendering engine.
**Process**:
1. Parse JSON text
2. Call `render_from_spec()`
3. Return PIL image and error messages to UI

#### `create_json_interface()`
**Purpose**: Creates Gradio web interface.
**Features**:
- JSON code editor with syntax highlighting
- Real-time badge preview
- Generate/Reset buttons
- Error message display

### Legacy Interface (`interfaces/legacy.py`)

#### `generate_badge(title_text, subtitle_text, skill_text, shape, size)`
**Purpose**: Simple function-based interface (deprecated).
**Process**:
1. Take default configuration
2. Update text content
3. Modify shape parameters
4. Generate badge

## Complete Rendering Flow

```
JSON Configuration
    ↓
render_from_spec()
    ↓
Create Composer(width, height, scale)
    ↓
For each layer in config:
    Create layer instance from LAYER_REGISTRY
    Add to composer
    ↓
composer.render():
    1. _calculate_shape_bounds()
    2. _update_dynamic_positions()  
    3. Pass composer to TextLayers
    4. Create PIL canvas
    5. Sort layers by z-order
    6. Call layer.render(canvas) for each
    7. Apply scaling
    8. Clean up references
    ↓
Return PIL Image
```

This documentation covers all major functions with visual examples to help understand how each component works together to create the final badge image.
```

---

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Create comprehensive function documentation with examples", "status": "completed", "activeForm": "Creating comprehensive function documentation"}, {"content": "Document utility functions with visual examples", "status": "completed", "activeForm": "Documenting utility functions"}, {"content": "Document layer classes and their methods", "status": "in_progress", "activeForm": "Documenting layer classes"}, {"content": "Document composer and rendering pipeline", "status": "pending", "activeForm": "Documenting composer and pipeline"}, {"content": "Create examples for each major function", "status": "pending", "activeForm": "Creating function examples"}]