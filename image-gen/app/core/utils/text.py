from PIL import ImageFont

from app.core.utils.paths import resolve_allowed_asset_path


def load_font(path, size, fallback=None):
    # Contain the user-supplied font path to the allowed asset directories so a
    # request cannot point ImageFont.truetype at an arbitrary file. A rejected
    # or unresolvable path falls back to the default font rather than reading it.
    safe_path = resolve_allowed_asset_path(path)
    if safe_path is None:
        return fallback or ImageFont.load_default()
    try:
        return ImageFont.truetype(safe_path, int(size))
    except Exception:
        return fallback or ImageFont.load_default()


def resolve_align(pos, box_w, box_h, img_w, img_h):
    def axis(a, box, img, axis):
        if isinstance(a, (int, float)): return int(a)
        if a == "center": return (img - box) // 2
        if axis == "x": return 0 if a == "left" else (img - box) if a == "right" else (img - box) // 2
        return 0 if a == "top" else (img - box) if a == "bottom" else (img - box) // 2
    x = axis((pos or {}).get("x", "center"), box_w, img_w, "x")
    y = axis((pos or {}).get("y", "center"), box_h, img_h, "y")
    return x, y