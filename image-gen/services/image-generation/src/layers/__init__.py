from layers.background import BackgroundLayer
from layers.shape import ShapeLayer
from layers.image import ImageLayer, LogoLayer
from layers.text import TextLayer

LAYER_REGISTRY = {
    "BackgroundLayer": BackgroundLayer,
    "ShapeLayer": ShapeLayer,
    "ImageLayer": ImageLayer,
    "LogoLayer": LogoLayer,
    "TextLayer": TextLayer,
}