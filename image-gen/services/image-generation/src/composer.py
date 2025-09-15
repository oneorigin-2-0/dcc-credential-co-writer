import json
from PIL import Image
from layers import LAYER_REGISTRY
from layers.shape import ShapeLayer
from layers.image import LogoLayer
from layers.text import TextLayer
from utils.geometry import get_shape_bounds


class Composer:
    def __init__(self, width, height, bg=(0,0,0,0)):
        self.W, self.H = int(width), int(height)
        self.bg = bg
        self.layers = []
        self.shape_bounds = None
        self.shape_spec = None
    
    def add(self, layer):
        self.layers.append(layer)
        return self
    
    def _calculate_shape_bounds(self):
        """Find the first shape layer and calculate its bounds"""
        for layer in self.layers:
            if isinstance(layer, ShapeLayer):
                # Get the original layer spec to calculate bounds
                self.shape_spec = {
                    "shape": layer.shape,
                    "params": layer.params
                }
                self.shape_bounds = get_shape_bounds(self.shape_spec, self.W, self.H)
                break
    
    def _update_dynamic_positions(self):
        """Update positions of layers that use dynamic positioning"""
        if not self.shape_bounds:
            return
        
        bounds = self.shape_bounds
        
        # Calculate dynamic positions based on hexagon bounds
        hexagon_height = bounds["bottom"] - bounds["top"]
        hexagon_center_y = bounds["top"] + hexagon_height * 0.5  # Center of hexagon
        
        # Get dynamic logo height for positioning calculations
        logo_height = 85  # Default fallback
        for layer in self.layers:
            if isinstance(layer, LogoLayer):
                if layer.size.get("dynamic", False):
                    _, logo_height = layer.get_dynamic_size()
                else:
                    logo_height = layer.size.get("height", 85)
                break
        
        # Position elements based on calculated percentages:
        # Logo CENTER should be at 25% from top (more consistent across different logo sizes)
        logo_center_y = bounds["top"] + hexagon_height * 0.25  # Logo center: 25% from top
        logo_y = logo_center_y - (logo_height / 2)             # Adjust to top edge for rendering
        text1_y = bounds["top"] + hexagon_height * 0.43      # Title: 45% from top 
        text2_y = bounds["top"] + hexagon_height * 0.55       # Subtitle: 55% from top 
        skill_rect_y = hexagon_center_y + hexagon_height * 0.25  # Skill badge: 25% below center

        # Calculate skill text position to be centered within the rectangle
        # Rectangle height is 40, so text should be at rectangle center
        skill_text_y = skill_rect_y  # This will be the center of the rectangle
        
        # First pass: Position rectangle and calculate its center for text
        skill_rectangle_center_y = None
        
        # No dynamic rectangle positioning needed - rectangles handle their own centering
        
        # Track which dynamic text layers we've encountered
        text_layer_count = 0
        
        # Second pass: Update all other layer positions
        for layer in self.layers:
            if isinstance(layer, LogoLayer):
                if layer.pos.get("y") == "dynamic":
                    # Position logo at the top of content area (logo_y is already the top position)
                    layer.pos["y"] = int(logo_y)
            
            elif isinstance(layer, TextLayer):
                if layer.align.get("y") == "dynamic":
                    # Determine position based on which text layer this is
                    if text_layer_count == 0:  # First text layer (title)
                        layer.align["y"] = int(text1_y)
                    elif text_layer_count == 1:  # Second text layer (subtitle)
                        layer.align["y"] = int(text2_y)
                    elif text_layer_count == 2:  # Third text layer (skill)
                        # Position text so it's visually centered within the rectangle
                        if skill_rectangle_center_y is not None:
                            # Get font size to estimate text height
                            font_size = layer.font.get('size', 36)
                            # Estimate text height (roughly 70% of font size for most fonts)
                            estimated_text_height = font_size * 0.7
                            
                            # Calculate Y position so text is centered in rectangle
                            # Since text uses anchor="lt" (left-top), we need to position the top of the text
                            # at: rectangle_center - (text_height / 2)
                            centered_text_y = skill_rectangle_center_y - (estimated_text_height / 2)
                            layer.align["y"] = int(centered_text_y)
                        else:
                            layer.align["y"] = int(skill_text_y)  # Fallback
                    text_layer_count += 1
    
    def render(self):
        # Calculate shape bounds and update dynamic positions first
        self._calculate_shape_bounds()
        self._update_dynamic_positions()
        
        # Pass composer reference to TextLayers that need dynamic wrapping
        for layer in self.layers:
            if isinstance(layer, TextLayer) and layer.wrap.get("dynamic", False):
                layer.composer = self
        
        canvas = Image.new("RGBA", (self.W, self.H), self.bg)
        
        for layer in sorted(self.layers, key=lambda L: L.z):
            layer.render(canvas)
        
        # Clean up composer references
        for layer in self.layers:
            if isinstance(layer, TextLayer):
                layer.composer = None
        
        return canvas


def render_from_spec(spec):
    """spec: dict or JSON string with keys:
       - canvas: {width, height, bg}
       - layers: [ {type: "...", ...}, ... ]
    """
    if isinstance(spec, str):
        spec = json.loads(spec)
    canvas = spec.get("canvas", {})
    W = canvas.get("width", 600)
    H = canvas.get("height", 600)
    bg = canvas.get("bg", "white")
    comp = Composer(W, H, bg=(255,255,255,0) if bg=="transparent" else bg)

    for layer_spec in spec.get("layers", []):
        t = layer_spec.get("type")
        cls = LAYER_REGISTRY.get(t)
        if not cls:
            raise ValueError(f"Unknown layer type: {t}")
        comp.add(cls(layer_spec))
    return comp.render()