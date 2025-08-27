import math
from PIL import Image, ImageDraw
from layers.base import Layer
from utils.image_processing import (
    make_linear_gradient, circle_mask, 
    polygon_mask, rounded_rect_mask, shield_points
)


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