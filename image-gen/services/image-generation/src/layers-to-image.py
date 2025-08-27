from PIL import Image, ImageDraw, ImageFont
from PIL.Image import Resampling
import math, os, json
from typing import Optional, Any

default_bagde_config = {
  "canvas": {"width": 600, "height": 600, "bg": "white", "scale_factor": 1},
  "layers": [
    {"type": "BackgroundLayer", "mode": "solid",
     "color": "#FFFFFF", "z": 0},

    {
    "type": "ShapeLayer",
    "shape": "hexagon",
    "fill": {
        "mode": "gradient", #mode: "solid"
        "start_color": "#FFD700", #color: "any solid color"
        "end_color": "#FF4500",
        "vertical": True
    },
    "border": {"color": "#800000", "width": 6},
    "params": {"radius": 250},
    "z": 10
    },

    {"type": "LogoLayer", "path": "../assets/logos/wgu_logo.png",
     "size": {"dynamic": True}, "position": {"x": "center", "y": "dynamic"}, "z": 20},
    
    # {"type": "ImageLayer", "path": "../assets/ribbon2.png",
    # "size": {"width": 610, "height": 120}, "position": {"x": "center", "y": 230}, "z": 25, "opacity": 1.0},
    

    {"type": "TextLayer", "text": "Spark Challenge",
     "font": {"path": "/System/Library/Fonts/Supplemental/Arial Bold.ttf", "size": 45},
     "color": "#000000", "align": {"x": "center", "y": "dynamic"},
     "wrap": {"dynamic": True, "line_gap": 6}, "z": 30},

    {"type": "TextLayer", "text": "Soft Skill Credential",
     "font": {"path": "/System/Library/Fonts/Supplemental/Arial.ttf", "size": 37},
     "color": "#000000", "align": {"x": "center", "y": "dynamic"},
     "wrap": {"dynamic": True, "line_gap": 6}, "z": 30},

    {"type": "ShapeLayer", "shape": "rounded_rect",
     "fill": {"mode": "solid", "color": "#a86b01"},
     "border": {"color": None, "width": 0},
     "params": {"rect": "dynamic", "radius": 12}, "z": 35},

    {"type": "TextLayer", "text": "Teamwork",
     "font": {"path": "/System/Library/Fonts/Supplemental/Arial Bold.ttf", "size": 36},
     "color": "#FFFFFF", "align": {"x": "center", "y": "dynamic"},
     "wrap": {"dynamic": True,"line_gap": 0}, "z": 36}
  ]
}


# ---------- utilities ----------
def load_font(path, size, fallback=None):
    try:
        return ImageFont.truetype(path, int(size))
    except Exception:
        return fallback or ImageFont.load_default()

def get_shape_width_at_y(shape_spec, y_position, canvas_width, canvas_height):
    """Calculate the horizontal width of a shape at a given Y position"""
    shape = shape_spec.get("shape", "hexagon")
    params = shape_spec.get("params", {})
    cx = canvas_width // 2
    cy = canvas_height // 2
    
    if shape == "hexagon":
        radius = int(params.get("radius", min(canvas_width, canvas_height)//2 - 20))
        # Hexagon with flat sides has vertices at 60-degree intervals
        # Calculate the X bounds at the given Y position
        ang = math.pi/3  # 60 degrees
        points = [(cx + radius*math.cos(i*ang), cy + radius*math.sin(i*ang)) for i in range(6)]
        
        # Find the hexagon edges that intersect with the horizontal line at y_position
        # The hexagon has 6 edges, we need to find which ones cross our Y line
        left_x = canvas_width
        right_x = 0
        
        for i in range(6):
            p1 = points[i]
            p2 = points[(i + 1) % 6]
            
            # Check if this edge crosses the Y position
            if (p1[1] <= y_position <= p2[1]) or (p2[1] <= y_position <= p1[1]):
                # Calculate X at this Y using linear interpolation
                if p2[1] != p1[1]:  # Avoid division by zero
                    t = (y_position - p1[1]) / (p2[1] - p1[1])
                    x = p1[0] + t * (p2[0] - p1[0])
                    left_x = min(left_x, x)
                    right_x = max(right_x, x)
        
        if left_x < canvas_width and right_x > 0:
            return left_x, right_x
        return cx - radius, cx + radius  # Fallback to full width
    
    elif shape == "circle":
        margin = int(params.get("margin", 50))
        radius = min(canvas_width, canvas_height)//2 - margin
        
        # Calculate circle intersection at Y
        dy = abs(y_position - cy)
        if dy <= radius:
            # Use Pythagorean theorem to find X extent at this Y
            dx = math.sqrt(radius**2 - dy**2)
            return cx - dx, cx + dx
        return cx, cx  # Outside circle, no width
    
    elif shape == "shield":
        margin = int(params.get("margin", 56))
        left = margin
        right = canvas_width - margin
        return left, right  # Shield has straight sides in our implementation
    
    elif shape == "rounded_rect":
        rect = params.get("rect", [20, 20, canvas_width-20, canvas_height-20])
        if rect[1] <= y_position <= rect[3]:
            return rect[0], rect[2]
        return cx, cx  # Outside rectangle
    
    # Default: use full width minus margin
    margin = 50
    return margin, canvas_width - margin

def get_shape_bounds(shape_spec, canvas_width, canvas_height):
    """Calculate the bounding box of a shape layer"""
    shape = shape_spec.get("shape", "hexagon")
    params = shape_spec.get("params", {})
    
    if shape == "hexagon":
        radius = int(params.get("radius", min(canvas_width, canvas_height)//2 - 20))
        cx, cy = canvas_width//2, canvas_height//2
        import math
        # Calculate actual hexagon points to get real Y bounds
        # Hexagon with flat top/bottom has points at angles 0°, 60°, 120°, 180°, 240°, 300°
        ang = math.pi/3  # 60 degrees
        points = [(cx + radius*math.cos(i*ang), cy + radius*math.sin(i*ang)) for i in range(6)]
        
        # Get actual Y coordinates from the points
        y_coords = [p[1] for p in points]
        top = min(y_coords)     # Actual top Y of hexagon
        bottom = max(y_coords)  # Actual bottom Y of hexagon
        
        return {"top": top, "bottom": bottom, "center_x": cx, "center_y": cy, "radius": radius}
    
    elif shape == "circle":
        margin = int(params.get("margin", 50))
        radius = min(canvas_width, canvas_height)//2 - margin
        cx, cy = canvas_width//2, canvas_height//2
        # Calculate actual circle bounds (just like we do for hexagon)
        top = cy - radius      # Actual top Y of circle
        bottom = cy + radius   # Actual bottom Y of circle
        return {"top": top, "bottom": bottom, "center_x": cx, "center_y": cy, "radius": radius}
    
    elif shape == "shield":
        margin = int(params.get("margin", 56))
        tip_height = int(params.get("tip_height", 110))
        top = margin
        bottom = canvas_height - margin
        cx = canvas_width//2
        return {"top": top, "bottom": bottom, "center_x": cx, "center_y": (top + bottom)//2, "radius": min(canvas_width, canvas_height)//2 - margin}
    
    elif shape == "rounded_rect":
        rect = params.get("rect", [20, 20, canvas_width-20, canvas_height-20])
        top, bottom = rect[1], rect[3]
        cx = (rect[0] + rect[2])//2
        return {"top": top, "bottom": bottom, "center_x": cx, "center_y": (top + bottom)//2, "radius": min(rect[2]-rect[0], rect[3]-rect[1])//2}
    
    # Default fallback
    return {"top": 50, "bottom": canvas_height-50, "center_x": canvas_width//2, "center_y": canvas_height//2, "radius": min(canvas_width, canvas_height)//2 - 50}

def resolve_align(pos, box_w, box_h, img_w, img_h):
    def axis(a, box, img, axis):
        if isinstance(a, (int, float)): return int(a)
        if a == "center": return (img - box) // 2
        if axis == "x": return 0 if a == "left" else (img - box) if a == "right" else (img - box) // 2
        return 0 if a == "top" else (img - box) if a == "bottom" else (img - box) // 2
    x = axis((pos or {}).get("x", "center"), box_w, img_w, "x")
    y = axis((pos or {}).get("y", "center"), box_h, img_h, "y")
    return x, y

def make_linear_gradient(size, start_hex, end_hex, vertical=True):
    w, h = size
    base = Image.new("RGB", size, start_hex)
    top  = Image.new("RGB", size, end_hex)
    mask = Image.linear_gradient("L")
    if not vertical: mask = mask.rotate(90, expand=True)
    mask = mask.resize(size, Resampling.LANCZOS)
    return Image.composite(top, base, mask).convert("RGBA")

def circle_mask(size, margin):
    w, h = size
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).ellipse([margin, margin, w - margin, h - margin], fill=255)
    return m

def polygon_mask(size, points):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).polygon(points, fill=255)
    return m

def rounded_rect_mask(size, rect, radius):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).rounded_rectangle(rect, radius=radius, fill=255)
    return m

def shield_points(W, H, margin, r, tip_h):
    left, right = margin, W - margin
    top = margin
    bottom_body = H - margin - tip_h
    cx = W // 2
    rect = (left, top, right, bottom_body)
    tip  = [(left + 36, bottom_body - 1), (cx, H - margin), (right - 36, bottom_body - 1)]
    return rect, tip

# ---------- base layer ----------
class Layer:
    def __init__(self, spec):
        self.z = int(spec.get("z", 0))
    def render(self, canvas: Image.Image):
        raise NotImplementedError

# ---------- BackgroundLayer ----------
class BackgroundLayer(Layer):
    def __init__(self, spec):
        super().__init__(spec)
        self.mode = spec.get("mode", "solid")  # solid | gradient
        self.color = spec.get("color", "#FFFFFF")
        self.gradient = spec.get("gradient", {"start_color": "#FFFFFF", "end_color": "#FFFFFF", "vertical": True})
    def render(self, canvas):
        if self.mode == "solid":
            ImageDraw.Draw(canvas).rectangle([0,0,canvas.width,canvas.height], fill=self.color)
        else:
            grad = make_linear_gradient((canvas.width, canvas.height),
                                        self.gradient.get("start_color","#FFFFFF"),
                                        self.gradient.get("end_color",  "#FFFFFF"),
                                        self.gradient.get("vertical", True))
            canvas.alpha_composite(grad)

# ---------- ShapeLayer ----------
class ShapeLayer(Layer):
    def __init__(self, spec):
        super().__init__(spec)
        self.shape = spec.get("shape", "hexagon")  # hexagon|circle|shield|rounded_rect
        self.fill = spec.get("fill", {"mode":"solid","color":"#FFFFFF"})  # "transparent" allowed
        self.border = spec.get("border", {"color": None, "width": 0})
        self.params = spec.get("params", {})
    def _mask(self, size):
        W, H = size
        s = self.shape
        if s == "hexagon":
            r = int(self.params.get("radius", min(W,H)//2 - 20))
            cx, cy = W//2, H//2
            ang = math.pi/3
            pts = [(cx + r*math.cos(i*ang), cy + r*math.sin(i*ang)) for i in range(6)]
            return polygon_mask(size, pts)
        if s == "circle":
            return circle_mask(size, int(self.params.get("margin", 50)))
        if s == "shield":
            margin = int(self.params.get("margin", 56))
            r      = int(self.params.get("corner_radius", 56))
            tip_h  = int(self.params.get("tip_height", 110))
            rect, tip = shield_points(W,H,margin,r,tip_h)
            m = Image.new("L", size, 0); d = ImageDraw.Draw(m)
            d.rounded_rectangle(rect, radius=r, fill=255)
            d.polygon(tip, fill=255)
            return m
        if s == "rounded_rect":
            rect = self.params.get("rect", [20,20,W-20,H-20])
            rad  = int(self.params.get("radius", 20))
            return rounded_rect_mask(size, rect, rad)
        raise ValueError(f"Unknown shape: {s}")
    def render(self, canvas):
        W, H = canvas.width, canvas.height
        m = self._mask((W,H))
        # Fill
        mode = self.fill.get("mode","solid")
        if mode == "transparent":
            pass
        else:
            if mode == "solid":
                fill_img = Image.new("RGBA", (W,H), self.fill.get("color","#FFFFFF"))
            else:
                fill_img = make_linear_gradient((W,H),
                    self.fill.get("start_color","#FFFFFF"),
                    self.fill.get("end_color","#FFFFFF"),
                    self.fill.get("vertical",True))
            tmp = Image.new("RGBA", (W,H), (0,0,0,0))
            tmp.paste(fill_img, (0,0), m)
            canvas.alpha_composite(tmp)
        # Border
        col = self.border.get("color"); bw = int(self.border.get("width", 0))
        if col and bw > 0:
            bd = Image.new("RGBA", (W,H), (0,0,0,0))
            d  = ImageDraw.Draw(bd)
            s = self.shape
            if s == "hexagon":
                r = int(self.params.get("radius", min(W,H)//2 - 20))
                cx, cy = W//2, H//2; ang = math.pi/3
                pts = [(cx + r*math.cos(i*ang), cy + r*math.sin(i*ang)) for i in range(6)]
                d.polygon(pts, outline=col, width=bw)
            elif s == "circle":
                margin = int(self.params.get("margin", 50))
                d.ellipse([margin, margin, W-margin, H-margin], outline=col, width=bw)
            elif s == "shield":
                margin = int(self.params.get("margin", 56))
                r      = int(self.params.get("corner_radius", 56))
                tip_h  = int(self.params.get("tip_height", 110))
                rect, tip = shield_points(W,H,margin,r,tip_h)
                d.rounded_rectangle(rect, radius=r, outline=col, width=bw)
                d.line(tip + [tip[0]], fill=col, width=bw, joint="curve")
            elif s == "rounded_rect":
                rect = self.params.get("rect", [20,20,W-20,H-20])
                rad  = int(self.params.get("radius", 20))
                d.rounded_rectangle(rect, radius=rad, outline=col, width=bw)
            canvas.alpha_composite(bd)

# ---------- ImageLayer / LogoLayer ----------
class ImageLayer(Layer):
    def __init__(self, spec):
        super().__init__(spec)
        
        # Resolve path relative to the script file
        script_dir = os.path.dirname(os.path.abspath(__file__))
        self.path = os.path.join(script_dir, spec.get("path"))
        
        self.size = spec.get("size", {})
        self.pos  = spec.get("position", {"x":"center","y":"center"})
        self.opacity = float(spec.get("opacity", 1.0))
    def render(self, canvas):
        if not (self.path and os.path.exists(self.path)): return
        img = Image.open(self.path).convert("RGBA")
        
        # Handle dynamic sizing with aspect ratio preservation
        if self.size.get("dynamic", False):
            img = self._resize_dynamic(img, canvas)
        else:
            # Original static sizing logic
            w, h = self.size.get("width"), self.size.get("height")
            if w or h:
                ow, oh = img.size
                if w and h: img = img.resize((int(w), int(h)), Resampling.LANCZOS)
                elif w:     img = img.resize((int(w), int(oh*(w/ow))), Resampling.LANCZOS)
                else:       img = img.resize((int(ow*(h/oh)), int(h)), Resampling.LANCZOS)
        
        if self.opacity < 1.0:
            a = img.split()[-1].point(lambda p: int(p*self.opacity))
            img.putalpha(a)
        x,y = resolve_align(self.pos, img.width, img.height, canvas.width, canvas.height)
        canvas.alpha_composite(img, dest=(x,y))
    
    def _resize_dynamic(self, img, canvas):
        """Dynamically resize image while maintaining aspect ratio"""
        original_width, original_height = img.size
        
        # Get maximum dimensions from config
        max_width = self.size.get("max_width", 280)
        max_height = self.size.get("max_height", 120)
        
        # Optional: Scale based on canvas size for better responsiveness
        canvas_scale = self.size.get("canvas_scale", 1.0)
        max_width = int(max_width * canvas_scale)
        max_height = int(max_height * canvas_scale)
        
        # Calculate scaling factors
        width_scale = max_width / original_width
        height_scale = max_height / original_height
        
        # Use the smaller scale to maintain aspect ratio
        scale = min(width_scale, height_scale)
        
        # Ensure we don't upscale too much
        if scale > 1.0:
            max_upscale = self.size.get("max_upscale", 2.0)
            scale = min(scale, max_upscale)
        
        # Calculate new dimensions
        new_width = int(original_width * scale)
        new_height = int(original_height * scale)
        
        # Resize the image
        return img.resize((new_width, new_height), Resampling.LANCZOS)
    
    def get_dynamic_size(self):
        """Get the calculated size for dynamic sizing (for positioning calculations)"""
        if not self.size.get("dynamic", False) or not (self.path and os.path.exists(self.path)):
            return self.size.get("width", 0), self.size.get("height", 0)
        
        try:
            with Image.open(self.path) as img:
                original_width, original_height = img.size
                
                max_width = self.size.get("max_width", 280)
                max_height = self.size.get("max_height", 120)
                
                canvas_scale = self.size.get("canvas_scale", 1.0)
                max_width = int(max_width * canvas_scale)
                max_height = int(max_height * canvas_scale)
                
                width_scale = max_width / original_width
                height_scale = max_height / original_height
                scale = min(width_scale, height_scale)
                
                if scale > 1.0:
                    max_upscale = self.size.get("max_upscale", 2.0)
                    scale = min(scale, max_upscale)
                
                return int(original_width * scale), int(original_height * scale)
        except:
            return self.size.get("max_width", 280), self.size.get("max_height", 120)

class LogoLayer(ImageLayer):
    pass  # semantic alias

# ---------- TextLayer ----------
class TextLayer(Layer):
    
    def __init__(self, spec):
        super().__init__(spec)
        self.text = spec.get("text", "")
        self.font = spec.get("font", {"path": None, "size": 24})
        self.color = spec.get("color", "#000000")
        self.align = spec.get("align", {"x":"center","y":"center"})
        self.wrap  = spec.get("wrap", {"max_width": None, "line_gap": 6})
        self.composer: Optional[Any] = None  # Will be set during rendering if dynamic wrap is needed
        # optional: "anchor" if you want to change; we'll draw left-top for wrapped blocks
    def _wrap_lines(self, draw, font, max_w):
        if not max_w: return self.text.split("\n")
        lines = []
        for para in self.text.split("\n"):
            words, cur = para.split(), ""
            for w in words:
                test = (cur + " " + w).strip()
                if draw.textlength(test, font=font) <= max_w or not cur:
                    cur = test
                else:
                    lines.append(cur); cur = w
            lines.append(cur)
        return lines
    def render(self, canvas):
        d = ImageDraw.Draw(canvas)
        f = load_font(self.font.get("path"), self.font.get("size"))
        
        # Calculate dynamic max_width if enabled
        max_w = self.wrap.get("max_width")
        if max_w is None and self.wrap.get("dynamic", False) and self.composer:
            # Calculate text Y position first (without wrapping)
            temp_lines = self._wrap_lines(d, f, None)  # No wrapping for initial calculation
            temp_w = max(int(d.textlength(ln, font=f)) for ln in temp_lines) if temp_lines else 0
            temp_h = 0; gap = int(self.wrap.get("line_gap", 6))
            for ln in temp_lines:
                bbox = f.getbbox(ln); temp_h += (bbox[3] - bbox[1]) + gap
            if temp_h > 0: temp_h -= gap
            
            # Get text Y position
            _, text_y = resolve_align(self.align, temp_w, temp_h, canvas.width, canvas.height)
            
            # Calculate shape width at text Y position
            if self.composer.shape_spec:
                left_x, right_x = get_shape_width_at_y(self.composer.shape_spec, text_y, canvas.width, canvas.height)
                
                # Set max_width with some padding (20px from each side)
                padding = 40
                max_w = max(100, right_x - left_x - padding)  # Minimum 100px width
        
        lines = self._wrap_lines(d, f, max_w)
        w = max(int(d.textlength(ln, font=f)) for ln in lines) if lines else 0
        h = 0; gap = int(self.wrap.get("line_gap", 6))
        for ln in lines:
            bbox = f.getbbox(ln); h += (bbox[3] - bbox[1]) + gap
        if h>0: h -= gap
        x,y = resolve_align(self.align, w, h, canvas.width, canvas.height)
        cy = y
        for ln in lines:
            # Center each line individually if x alignment is center
            if self.align.get("x") == "center":
                line_width = int(d.textlength(ln, font=f))
                line_x = (canvas.width - line_width) // 2
                d.text((line_x, cy), ln, font=f, fill=self.color, anchor="lt")
            else:
                d.text((x, cy), ln, font=f, fill=self.color, anchor="lt")
            bbox = f.getbbox(ln); cy += (bbox[3] - bbox[1]) + gap

# ---------- registry & composer ----------
LAYER_REGISTRY = {
    "BackgroundLayer": BackgroundLayer,
    "ShapeLayer":      ShapeLayer,
    "ImageLayer":      ImageLayer,
    "LogoLayer":       LogoLayer,
    "TextLayer":       TextLayer,
}

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
            
            elif isinstance(layer, ImageLayer) and not isinstance(layer, LogoLayer):
                if layer.pos.get("y") == "dynamic":
                    # No image layers other than logo in current config, but keeping for completeness
                    pass
            
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

# ---------- JSON-driven entrypoint ----------
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
    scale = canvas.get("scale_factor", 2)
    comp = Composer(W, H, bg=(255,255,255,0) if bg=="transparent" else bg, scale_factor=scale)

    for layer_spec in spec.get("layers", []):
        t = layer_spec.get("type")
        cls = LAYER_REGISTRY.get(t)
        if not cls:
            raise ValueError(f"Unknown layer type: {t}")
        comp.add(cls(layer_spec))
    return comp.render()

# ---------- JSON Editor Interface ----------
import gradio as gr

def generate_from_json(json_text):
    """Generate badge from JSON configuration"""
    try:
        # Parse the JSON
        config = json.loads(json_text)
        
        # Generate the image
        image = render_from_spec(config)
        
        # Return image and clear error
        return image, ""
    except json.JSONDecodeError as e:
        # Return None for image and show error
        return None, f"JSON Parse Error: {str(e)}"
    except Exception as e:
        # Return None for image and show error
        return None, f"Error: {str(e)}"

def reset_to_default():
    """Reset to default configuration"""
    return json.dumps(default_bagde_config, indent=2)

# def generate_badge(title_text, subtitle_text, skill_text, shape, size):
#     """Generate a badge with custom text inputs, shape, and size (legacy function)"""
#     config = default_bagde_config.copy()
    
#     # Update the text content
#     for layer in config["layers"]:
#         if "Spark Challenge" in layer.get("text", ""):
#             layer["text"] = title_text
#         elif "Soft Skill Credential" in layer.get("text", ""):
#             layer["text"] = subtitle_text
#         elif "Teamwork" in layer.get("text", ""):
#             layer["text"] = skill_text
    
#     # Update the shape and size for the first shape layer
#     for layer in config["layers"]:
#         if layer.get("type") == "ShapeLayer":
#             layer["shape"] = shape
#             # Set appropriate parameters based on shape and size
#             if shape == "hexagon":
#                 layer["params"] = {"radius": int(size)}
#             elif shape == "circle":
#                 # For circle, size controls the radius (600-size)/2 gives margin
#                 margin = max(10, (600 - size * 2) // 2)
#                 layer["params"] = {"margin": margin}
#             elif shape == "shield":
#                 # For shield, size controls margin (smaller margin = larger shield)
#                 margin = max(20, 300 - size)
#                 layer["params"] = {"margin": margin, "corner_radius": margin, "tip_height": 110}
#             elif shape == "rounded_rect":
#                 # For rounded_rect, size controls the dimensions
#                 padding = max(25, (600 - size * 2) // 2)
#                 layer["params"] = {"rect": [padding, padding, 600-padding, 600-padding], "radius": 20}
#             break  # Only modify the first shape layer
    
#     # Generate the image
#     image = render_from_spec(config)
#     return image

def create_json_interface():
    """Create JSON editor interface"""
    with gr.Blocks(title="Badge Generator - JSON Editor") as interface:
        gr.Markdown("# Badge Generator - JSON Configuration")
        gr.Markdown("Edit the JSON configuration below to customize your badge. The preview will update automatically.")
        
        with gr.Row():
            with gr.Column(scale=1):
                gr.Markdown("### Configuration Editor")
                json_input = gr.Code(
                    value=json.dumps(default_bagde_config, indent=2),
                    language="json",
                    label="JSON Configuration",
                    lines=30,
                    interactive=True
                )
                
                with gr.Row():
                    generate_btn = gr.Button("Generate Badge", variant="primary")
                    reset_btn = gr.Button("Reset to Default", variant="secondary")
                
                error_output = gr.Textbox(
                    label="Error Messages",
                    visible=True,
                    interactive=False,
                    max_lines=3
                )
                
            with gr.Column(scale=1):
                gr.Markdown("### Generated Badge")
                output_image = gr.Image(
                    label="Preview",
                    type="pil",
                    height=600
                )
        
        gr.Markdown("""
        ### Configuration Guide:
        - **canvas**: Set width, height, background color, and scale factor
        - **layers**: Array of layer objects with different types:
          - **BackgroundLayer**: Solid or gradient background
          - **ShapeLayer**: Main shape (hexagon, circle, shield, rounded_rect)
          - **LogoLayer**: Logo image with dynamic sizing
          - **TextLayer**: Text with dynamic wrapping
        - Each layer has a **z** value for layering order (higher = on top)
        """)
        
        # Auto-generate on JSON change
        json_input.change(
            fn=generate_from_json,
            inputs=[json_input],
            outputs=[output_image, error_output]
        )
        
        # Manual generate button
        generate_btn.click(
            fn=generate_from_json,
            inputs=[json_input],
            outputs=[output_image, error_output]
        )
        
        # Reset button
        reset_btn.click(
            fn=reset_to_default,
            outputs=[json_input]
        )
        
        # Generate default badge on load
        interface.load(
            fn=generate_from_json,
            inputs=[json_input],
            outputs=[output_image, error_output]
        )
    
    return interface

if __name__ == "__main__":
    # Create and launch the JSON editor interface - named 'demo' for auto-reload compatibility
    demo = create_json_interface()
    demo.launch(show_api=True, server_port=7870)
