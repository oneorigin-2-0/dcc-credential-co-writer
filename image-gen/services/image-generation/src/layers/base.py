from PIL import Image


class Layer:
    def __init__(self, spec):
        self.z = int(spec.get("z", 0))
    
    def render(self, canvas: Image.Image):
        raise NotImplementedError