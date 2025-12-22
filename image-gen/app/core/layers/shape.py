import math
from PIL import Image, ImageDraw
from app.core.layers.base import Layer
from app.core.utils.image_processing import (
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
        self.scale_factor = float(spec.get("scale_factor", 1.0))

    def _darken_color(self, hex_color, factor):
        """Darken a hex color by a factor (0.0 = black, 1.0 = original)"""
        hex_color = hex_color.lstrip('#')
        r = int(hex_color[0:2], 16)
        g = int(hex_color[2:4], 16)
        b = int(hex_color[4:6], 16)
        r = int(r * factor)
        g = int(g * factor)
        b = int(b * factor)
        return f"#{r:02x}{g:02x}{b:02x}"

    def _render_ribbon_folded(self, canvas, W, H):
        """Custom rendering for folded ribbon with 3D depth effect.

        3-Part approach:
        - Part 1 (0-15%): Left section, moved UP by height/2, darker, V-cut on LEFT (outer edge)
        - Part 2 (15-85%): Middle section, stays in place (main ribbon) - rendered ON TOP
        - Part 3 (85-100%): Right section, moved UP by height/2, darker, V-cut on RIGHT (outer edge)
        """
        # Get parameters
        width = int(self.params.get("width", 480) * self.scale_factor)
        height = int(self.params.get("height", 80) * self.scale_factor)
        fold_percent = 0.15  # Fixed at 15% on each side
        y_offset = int(self.params.get("y_offset", 180) * self.scale_factor)
        fold_darken = self.params.get("fold_darken", 0.8)

        cx, cy = W // 2, H // 2
        ribbon_cy = cy + y_offset

        # Full ribbon bounds
        left = cx - width // 2
        right = cx + width // 2
        top = ribbon_cy - height // 2
        bottom = ribbon_cy + height // 2

        # Calculate fold dimensions
        fold_section_width = int(width * fold_percent)  # 15% of width
        fold_offset = height // 4  # Move folds UP by quarter height (less than before)
        tail_depth = int(height * 0.3)  # V-cut depth (30% of height)
        mid_y = ribbon_cy - fold_offset  # Middle Y for V-point (adjusted for fold offset)

        # Offset to move folds outward (50% of fold width)
        fold_outward_offset = fold_section_width // 2

        # Part 1: Left fold (V-notch on LEFT edge) - moved LEFT by 50% of fold width
        left_fold_left = left - fold_outward_offset
        left_fold_right = left + fold_section_width - fold_outward_offset
        left_fold = [
            (left_fold_left, top - fold_offset),                    # top-left (V point facing out)
            (left_fold_right, top - fold_offset),                   # top-right
            (left_fold_right, bottom - fold_offset),                # bottom-right
            (left_fold_left, bottom - fold_offset),                 # bottom-left (V point facing out)
            (left_fold_left + tail_depth, mid_y),                   # V center (indented inward)
        ]

        # Part 2: Main ribbon rectangle (full width - rendered ON TOP to cover overlaps)
        main_rect = [left, top, right, bottom]

        # Part 3: Right fold (V-notch on RIGHT edge) - moved RIGHT by 50% of fold width
        right_fold_left = right - fold_section_width + fold_outward_offset
        right_fold_right = right + fold_outward_offset
        right_fold = [
            (right_fold_left, top - fold_offset),                   # top-left
            (right_fold_right, top - fold_offset),                  # top-right (V point facing out)
            (right_fold_right - tail_depth, mid_y),                 # V center (indented inward)
            (right_fold_right, bottom - fold_offset),               # bottom-right (V point facing out)
            (right_fold_left, bottom - fold_offset),                # bottom-left
        ]

        # Get colors (solid mode only)
        main_color = self.fill.get("color", "#C41E3A")
        fold_color = self._darken_color(main_color, fold_darken)

        # RENDER ORDER: Folds first (behind), then main ribbon (on top)

        # 1. Draw left and right folds (darker, behind) - polygons with V-cuts
        fold_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        fold_draw = ImageDraw.Draw(fold_layer)
        fold_draw.polygon(left_fold, fill=fold_color)
        fold_draw.polygon(right_fold, fill=fold_color)
        canvas.alpha_composite(fold_layer)

        # 2. Draw main ribbon (on top)
        ribbon_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ribbon_draw = ImageDraw.Draw(ribbon_layer)
        ribbon_draw.rectangle(main_rect, fill=main_color)

        canvas.alpha_composite(ribbon_layer)

    def _mask(self, size):
        W, H = size
        s = self.shape
        if s == "hexagon":
            r = int(self.params.get("radius", min(W,H)//2 - 20) * self.scale_factor)
            cx, cy = W//2, H//2
            ang = math.pi/3
            pts = [(cx + r*math.cos(i*ang), cy + r*math.sin(i*ang)) for i in range(6)]
            return polygon_mask(size, pts)
        if s == "circle":
            #return circle_mask(size, int(self.params.get("margin", 50)))
            radius = int(self.params.get("radius", min(W,H)//2 - 50) * self.scale_factor)
            margin = max(0, (min(W,H)//2) - radius)
            return circle_mask(size, margin)
        if s == "shield":
            margin = int(self.params.get("margin", 56) * self.scale_factor)
            r      = int(self.params.get("corner_radius", 56) * self.scale_factor)
            tip_h  = int(self.params.get("tip_height", 110) * self.scale_factor)
            rect, tip = shield_points(W,H,margin,r,tip_h)
            m = Image.new("L", size, 0); d = ImageDraw.Draw(m)
            d.rounded_rectangle(rect, radius=r, fill=255)
            d.polygon(tip, fill=255)
            return m
        if s == "rounded_rect":
            # Use width, height, radius instead of rect coordinates
            width = int(self.params.get("width", 450) * self.scale_factor)
            height = int(self.params.get("height", 450) * self.scale_factor)
            radius = int(self.params.get("radius", 50) * self.scale_factor)

            # Center the rectangle on canvas
            cx, cy = W//2, H//2
            x1 = cx - width//2
            y1 = cy - height//2
            x2 = cx + width//2
            y2 = cy + height//2

            rect = [x1, y1, x2, y2]
            return rounded_rect_mask(size, rect, radius)
        if s == "ribbon":
            # Classic ribbon/banner with V-notch tails on both ends
            width = int(self.params.get("width", 480) * self.scale_factor)
            height = int(self.params.get("height", 80) * self.scale_factor)
            tail_depth = int(self.params.get("tail_depth", 25) * self.scale_factor)
            y_offset = int(self.params.get("y_offset", 180) * self.scale_factor)

            cx, cy = W // 2, H // 2

            # Position ribbon (y_offset positive = lower on canvas)
            ribbon_cy = cy + y_offset

            left = cx - width // 2
            right = cx + width // 2
            top = ribbon_cy - height // 2
            bottom = ribbon_cy + height // 2
            mid_y = ribbon_cy

            # 6 points for ribbon with V-notch tails
            pts = [
                (left, top),                      # top-left
                (right, top),                     # top-right
                (right - tail_depth, mid_y),      # right V-point (inward)
                (right, bottom),                  # bottom-right
                (left, bottom),                   # bottom-left
                (left + tail_depth, mid_y),       # left V-point (inward)
            ]

            return polygon_mask(size, pts)
        if s == "ribbon_folded":
            # Folded ribbon with 3D depth effect - V-cuts on outer edges like classic ribbon
            width = int(self.params.get("width", 480) * self.scale_factor)
            height = int(self.params.get("height", 80) * self.scale_factor)
            fold_percent = 0.15  # Fixed at 15% on each side
            y_offset = int(self.params.get("y_offset", 180) * self.scale_factor)

            cx, cy = W // 2, H // 2
            ribbon_cy = cy + y_offset

            left = cx - width // 2
            right = cx + width // 2
            top = ribbon_cy - height // 2
            bottom = ribbon_cy + height // 2

            # Calculate fold dimensions
            fold_section_width = int(width * fold_percent)
            fold_offset = height // 4  # Move folds UP by quarter height (less than before)
            tail_depth = int(height * 0.3)  # V-cut depth
            mid_y = ribbon_cy - fold_offset  # Middle Y for V-point

            # Create mask combining all 3 parts
            m = Image.new("L", size, 0)
            d = ImageDraw.Draw(m)

            # Offset to move folds outward (50% of fold width)
            fold_outward_offset = fold_section_width // 2

            # Part 1: Left fold (V-notch on LEFT edge) - moved LEFT by 50%
            left_fold_left = left - fold_outward_offset
            left_fold_right = left + fold_section_width - fold_outward_offset
            left_fold = [
                (left_fold_left, top - fold_offset),
                (left_fold_right, top - fold_offset),
                (left_fold_right, bottom - fold_offset),
                (left_fold_left, bottom - fold_offset),
                (left_fold_left + tail_depth, mid_y),
            ]
            d.polygon(left_fold, fill=255)

            # Part 2: Main ribbon (full width - covers overlaps)
            d.rectangle([left, top, right, bottom], fill=255)

            # Part 3: Right fold (V-notch on RIGHT edge) - moved RIGHT by 50%
            right_fold_left = right - fold_section_width + fold_outward_offset
            right_fold_right = right + fold_outward_offset
            right_fold = [
                (right_fold_left, top - fold_offset),
                (right_fold_right, top - fold_offset),
                (right_fold_right - tail_depth, mid_y),
                (right_fold_right, bottom - fold_offset),
                (right_fold_left, bottom - fold_offset),
            ]
            d.polygon(right_fold, fill=255)

            return m
        raise ValueError(f"Unknown shape: {s}")
    
    def render(self, canvas):
        W, H = canvas.width, canvas.height

        # Special handling for ribbon_folded - custom multi-part rendering
        if self.shape == "ribbon_folded":
            self._render_ribbon_folded(canvas, W, H)
            return

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
        col = self.border.get("color"); bw = int(self.border.get("width", 0) * self.scale_factor)
        if col and bw > 0:
            bd = Image.new("RGBA", (W,H), (0,0,0,0))
            d  = ImageDraw.Draw(bd)
            s = self.shape
            if s == "hexagon":
                r = int(self.params.get("radius", min(W,H)//2 - 20) * self.scale_factor)
                cx, cy = W//2, H//2; ang = math.pi/3
                pts = [(cx + r*math.cos(i*ang), cy + r*math.sin(i*ang)) for i in range(6)]
                d.polygon(pts, outline=col, width=bw)
            elif s == "circle":
                #margin = int(self.params.get("margin", 50))
                radius = int(self.params.get("radius", min(W,H)//2 - 50) * self.scale_factor)
                margin = max(0, (min(W,H)//2) - radius)
                d.ellipse([margin, margin, W-margin, H-margin], outline=col, width=bw)
            elif s == "shield":
                margin = int(self.params.get("margin", 56) * self.scale_factor)
                r      = int(self.params.get("corner_radius", 56) * self.scale_factor)
                tip_h  = int(self.params.get("tip_height", 110) * self.scale_factor)
                rect, tip = shield_points(W,H,margin,r,tip_h)
                d.rounded_rectangle(rect, radius=r, outline=col, width=bw)
                d.line(tip + [tip[0]], fill=col, width=bw, joint="curve")
            elif s == "rounded_rect":
                # Use width, height, radius instead of rect coordinates
                width = int(self.params.get("width", 450) * self.scale_factor)
                height = int(self.params.get("height", 450) * self.scale_factor)
                radius = int(self.params.get("radius", 50) * self.scale_factor)

                # Center the rectangle on canvas
                cx, cy = W//2, H//2
                x1 = cx - width//2
                y1 = cy - height//2
                x2 = cx + width//2
                y2 = cy + height//2

                rect = [x1, y1, x2, y2]
                d.rounded_rectangle(rect, radius=radius, outline=col, width=bw)
            # Note: ribbon and ribbon_folded shapes do not support borders
            canvas.alpha_composite(bd)