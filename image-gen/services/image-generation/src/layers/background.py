from PIL import Image, ImageDraw
from layers.base import Layer
from utils.image_processing import make_linear_gradient


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