from PIL import Image, ImageDraw
from PIL.Image import Resampling


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