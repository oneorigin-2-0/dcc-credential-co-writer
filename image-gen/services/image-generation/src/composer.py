import json
from PIL import Image
from PIL.Image import Resampling
from layers import LAYER_REGISTRY
from layers.shape import ShapeLayer
from layers.image import LogoLayer
from layers.text import TextLayer
from utils.geometry import get_shape_bounds, get_shape_width_at_y


class Composer:
    def __init__(self, width, height, bg=(0,0,0,0), scale_factor=1):
        self.W, self.H = int(width), int(height)
        self.bg = bg
        self.layers = []
        self.scale = max(1, int(scale_factor))
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
        shape_height = bounds["bottom"] - bounds["top"]
        
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
        # Logo CENTER should be at 20% from top (more consistent across different logo sizes)
        logo_center_y = bounds["top"] + hexagon_height * 0.2  # Logo center: 20% from top
        logo_y = logo_center_y - (logo_height / 2)             # Adjust to top edge for rendering
        text1_y = bounds["top"] + hexagon_height * 0.361       # Title: 36.1% from top (~240)
        text2_y = bounds["top"] + hexagon_height * 0.477       # Subtitle: 47.7% from top (~290)
        skill_rect_y = hexagon_center_y + hexagon_height * 0.15  # Skill badge: 15% below center
        
        # Calculate skill text position to be centered within the rectangle
        # Rectangle height is 40, so text should be at rectangle center
        skill_text_y = skill_rect_y  # This will be the center of the rectangle
        
        # First pass: Position rectangle and calculate its center for text
        skill_rectangle_center_y = None
        
        # Update rectangle position first
        for layer in self.layers:
            if isinstance(layer, ShapeLayer) and layer.shape == "rounded_rect":
                if layer.params.get("rect") == "dynamic":
                    # Update the skill badge rectangle position
                    rect_width = 200
                    rect_height = 40
                    cx = 300  # Canvas center X
                    rect_x_left = cx - rect_width//2
                    rect_x_right = cx + rect_width//2
                    rect_y_top = int(skill_rect_y - rect_height//2)
                    rect_y_bottom = int(skill_rect_y + rect_height//2)
                    layer.params["rect"] = [rect_x_left, rect_y_top, rect_x_right, rect_y_bottom]
                    
                    # Calculate the actual center Y of the rectangle for text positioning
                    skill_rectangle_center_y = (rect_y_top + rect_y_bottom) // 2
        
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
        
        W, H = self.W*self.scale, self.H*self.scale
        canvas = Image.new("RGBA", (W,H), self.bg)
        
        # Temporarily scale dimensions for rendering if needed
        if self.scale > 1:
            original_W, original_H = self.W, self.H
            self.W, self.H = W, H
        
        for layer in sorted(self.layers, key=lambda L: L.z):
            layer.render(canvas)
        
        if self.scale > 1:
            canvas = canvas.resize((original_W, original_H), Resampling.LANCZOS)
            self.W, self.H = original_W, original_H
        
        # Clean up composer references
        for layer in self.layers:
            if isinstance(layer, TextLayer):
                layer.composer = None
        
        return canvas


def render_from_spec(spec):
    """spec: dict or JSON string with keys:
       - canvas: {width, height, bg, scale_factor}
       - layers: [ {type: "...", ...}, ... ]
    """
    if isinstance(spec, str):
        spec = json.loads(spec)
    canvas = spec.get("canvas", {})
    W = canvas.get("width", 600)
    H = canvas.get("height", 600)
    bg = canvas.get("bg", "white")
    scale = canvas.get("scale_factor", 1)
    comp = Composer(W, H, bg=(255,255,255,0) if bg=="transparent" else bg, scale_factor=scale)

    for layer_spec in spec.get("layers", []):
        t = layer_spec.get("type")
        cls = LAYER_REGISTRY.get(t)
        if not cls:
            raise ValueError(f"Unknown layer type: {t}")
        comp.add(cls(layer_spec))
    return comp.render()