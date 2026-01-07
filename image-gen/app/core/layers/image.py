import os
import base64
from io import BytesIO
from PIL import Image
from PIL.Image import Resampling
from app.core.layers.base import Layer
from app.core.utils.text import resolve_align
from app.core.logging_config import get_logger

logger = get_logger("image_layer")


class ImageLayer(Layer):
    def __init__(self, spec):
        super().__init__(spec)

        # Store the original spec to access logo_base64 later
        self.spec = spec

        # Get project root (go up from app/core/layers to project root)
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(script_dir)))
        
        # Handle path - support both absolute and relative paths
        path_from_spec = spec.get("path")
        if path_from_spec:
            # Normalize path to handle double backslashes from JSON
            path_from_spec = os.path.normpath(str(path_from_spec))
            # If path is already absolute, use it directly (e.g., temp file paths)
            if os.path.isabs(path_from_spec):
                self.path = path_from_spec
            else:
                # Relative path - join with project root
                self.path = os.path.join(project_root, path_from_spec)
        else:
            self.path = None
        
        # Store logo_base64 if present (for fallback when path is not available)
        self.logo_base64 = spec.get("logo_base64")

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
        self.scale_factor = float(spec.get("scale_factor", 1.0))
    
    def render(self, canvas):
        img = None
        image_source = None
        
        # Prioritize logo_base64 over path (base64 is more portable and doesn't require temp files)
        if self.logo_base64:
            try:
                logo_bytes = self._decode_base64_logo(self.logo_base64)
                img = Image.open(BytesIO(logo_bytes)).convert("RGBA")
                image_source = "logo_base64"
            except Exception as e:
                logger.error(f"ImageLayer.render: Failed to decode logo_base64: {e}")
                # Fall through to try path as fallback
        
        # If logo_base64 failed or not available, try path as fallback
        if img is None and self.path:
            if os.path.exists(self.path):
                try:
                    img = Image.open(self.path).convert("RGBA")
                    image_source = "path"
                except Exception as e:
                    logger.warning(f"ImageLayer.render: Failed to open image from path {self.path}: {e}")
        
        # If both logo_base64 and path failed, skip rendering
        if img is None:
            logger.warning(f"ImageLayer.render: Cannot render - no valid image source. Has logo_base64: {bool(self.logo_base64)}, Path: {self.path}")
            return

        # Handle dynamic sizing with aspect ratio preservation
        if self.size.get("dynamic", False) or self.size.get("max_width"):
            img = self._resize_dynamic(img, canvas)
        else:
            # Original static sizing logic with scale factor
            w, h = self.size.get("width"), self.size.get("height")
            if w or h:
                ow, oh = img.size
                # Scale dimensions
                w = int(w * self.scale_factor) if w else None
                h = int(h * self.scale_factor) if h else None
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

        # Check if this is an icon path (check path if available, otherwise assume not icon)
        is_icon = self.path and "icons" in self.path.lower() if self.path else False

        # Get maximum dimensions from config and scale them
        # For icons with dynamic: true, default to 190x190 instead of 280x120
        if is_icon and self.size.get("dynamic") and "max_width" not in self.size:
            max_width = int(self.size.get("max_width", 190) * self.scale_factor)
            max_height = int(self.size.get("max_height", 190) * self.scale_factor)
        else:
            max_width = int(self.size.get("max_width", 280) * self.scale_factor)
            max_height = int(self.size.get("max_height", 120) * self.scale_factor)

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
    
    def _decode_base64_logo(self, base64_string: str) -> bytes:
        """
        Decode base64 logo string (simplified version of controller's decode_base64_logo)
        """
        if not base64_string:
            raise ValueError("Empty base64 string")
        
        original_length = len(base64_string)
        
        # Remove data URI prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',', 1)[1]
        
        # Remove all whitespace
        base64_string = ''.join(base64_string.split())
        
        if not base64_string:
            raise ValueError("Base64 string is empty after removing prefix and whitespace")
        
        # Check if it's URL-safe base64
        is_url_safe = '-' in base64_string or '_' in base64_string
        
        # Remove existing padding and recalculate
        base64_string = base64_string.rstrip('=')
        missing_padding = len(base64_string) % 4
        if missing_padding:
            base64_string += '=' * (4 - missing_padding)
        
        # Try to decode
        if is_url_safe:
            try:
                return base64.urlsafe_b64decode(base64_string)
            except Exception:
                pass  # Fall through to standard base64
        
        # Try standard base64 decode
        try:
            decoded = base64.b64decode(base64_string)
            if not decoded:
                raise ValueError("Decoded base64 resulted in empty bytes")
            return decoded
        except Exception as e:
            logger.error(f"ImageLayer._decode_base64_logo: Base64 decode failed - {e}")
            raise
    
    def get_dynamic_size(self):
        """Get the calculated size for dynamic sizing (for positioning calculations)"""
        if not self.size.get("dynamic", False):
            return self.size.get("width", 0), self.size.get("height", 0)

        # Prioritize logo_base64 over path (consistent with render method)
        img = None
        try:
            if self.logo_base64:
                logo_bytes = self._decode_base64_logo(self.logo_base64)
                img = Image.open(BytesIO(logo_bytes))
            elif self.path and os.path.exists(self.path):
                img = Image.open(self.path)
        except Exception as e:
            logger.warning(f"ImageLayer.get_dynamic_size: Failed to load image for size calculation: {e}")
            return int(self.size.get("max_width", 280) * self.scale_factor), int(self.size.get("max_height", 120) * self.scale_factor)
        
        if img is None:
            return self.size.get("width", 0), self.size.get("height", 0)

        try:
            with img:
                original_width, original_height = img.size

                # Check if this is an icon path
                is_icon = "icons" in self.path.lower()

                # Get maximum dimensions with icon-specific defaults and scale them
                if is_icon and self.size.get("dynamic") and "max_width" not in self.size:
                    max_width = int(self.size.get("max_width", 190) * self.scale_factor)
                    max_height = int(self.size.get("max_height", 190) * self.scale_factor)
                else:
                    max_width = int(self.size.get("max_width", 280) * self.scale_factor)
                    max_height = int(self.size.get("max_height", 120) * self.scale_factor)

                width_ratio = max_width / original_width
                height_ratio = max_height / original_height
                ratio = min(width_ratio, height_ratio)

                if ratio > 1.0:
                    max_upscale = self.size.get("max_upscale", 2.0)
                    ratio = min(ratio, max_upscale)

                return int(original_width * ratio), int(original_height * ratio)
        except:
            return int(self.size.get("max_width", 280) * self.scale_factor), int(self.size.get("max_height", 120) * self.scale_factor)


class LogoLayer(ImageLayer):
    pass  # semantic alias