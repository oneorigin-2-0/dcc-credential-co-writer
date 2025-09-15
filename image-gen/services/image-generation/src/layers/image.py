import os
from PIL import Image
from PIL.Image import Resampling
from layers.base import Layer
from utils.text import resolve_align


class ImageLayer(Layer):
    def __init__(self, spec):
        super().__init__(spec)
        
        # Resolve path relative to the script file
        script_dir = os.path.dirname(os.path.abspath(__file__))
        # Go up one level from layers/ to src/ then resolve the path
        src_dir = os.path.dirname(script_dir)
        self.path = os.path.join(src_dir, spec.get("path"))
        
        # Support both simple numeric size and object format
        if isinstance(spec.get("size"), (int, float)):
            # If size is a number, use it as width for proportional scaling
            self.size = {"width": spec.get("size")}
        elif "width" in spec or "height" in spec:
            self.size = {
                "width": spec.get("width"),
                "height": spec.get("height")
            }
        else:
            self.size = spec.get("size", {})
        
        # Support direct y positioning
        if "y" in spec:
            self.pos = {
                "x": "center",  # Always center horizontally
                "y": spec.get("y", "center")
            }
        else:
            self.pos = spec.get("position", {"x":"center","y":"center"})
        
        self.opacity = float(spec.get("opacity", 1.0))
    
    def render(self, canvas):
        if not (self.path and os.path.exists(self.path)): return
        img = Image.open(self.path).convert("RGBA")
        
        # Handle dynamic sizing with aspect ratio preservation
        if self.size.get("dynamic", False) or self.size.get("max_width"):
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
        
        # Calculate scaling factors
        width_ratio = max_width / original_width
        height_ratio = max_height / original_height
        
        # Use the smaller ratio to maintain aspect ratio
        ratio = min(width_ratio, height_ratio)
        
        # Ensure we don't upscale too much
        if ratio > 1.0:
            max_upscale = self.size.get("max_upscale", 2.0)
            ratio = min(ratio, max_upscale)
        
        # Calculate new dimensions
        new_width = int(original_width * ratio)
        new_height = int(original_height * ratio)
        
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
                
                width_ratio = max_width / original_width
                height_ratio = max_height / original_height
                ratio = min(width_ratio, height_ratio)
                
                if ratio > 1.0:
                    max_upscale = self.size.get("max_upscale", 2.0)
                    ratio = min(ratio, max_upscale)
                
                return int(original_width * ratio), int(original_height * ratio)
        except:
            return self.size.get("max_width", 280), self.size.get("max_height", 120)


class LogoLayer(ImageLayer):
    pass  # semantic alias