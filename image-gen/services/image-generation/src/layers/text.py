from PIL import ImageDraw
from typing import Optional, Any
from layers.base import Layer
from utils.text import load_font, resolve_align
from utils.geometry import get_shape_width_at_y


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