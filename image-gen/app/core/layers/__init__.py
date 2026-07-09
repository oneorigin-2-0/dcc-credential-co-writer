from app.core.layers.background import BackgroundLayer
from app.core.layers.shape import ShapeLayer
from app.core.layers.image import ImageLayer, LogoLayer
from app.core.layers.text import TextLayer

LAYER_REGISTRY = {
    "BackgroundLayer": BackgroundLayer,
    "ShapeLayer": ShapeLayer,
    "ImageLayer": ImageLayer,
    "LogoLayer": LogoLayer,
    "TextLayer": TextLayer,
}