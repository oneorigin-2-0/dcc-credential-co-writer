"""Configuration file for badge image generation system"""

default_badge_config = {
  "canvas": {"width": 600, "height": 600, "bg": "white"},
  "layers": [
    {"type": "BackgroundLayer", "mode": "solid",
     "color": "#FFFFFF", "z": 0},

    {
    "type": "ShapeLayer",
    "shape": "hexagon",
    "fill": {
        "mode": "gradient", #mode: "solid"
        "start_color": "#FFD700", #color: "any solid color"
        "end_color": "#FF4500",
        "vertical": True
    },
    "border": {"color": "#800000", "width": 6},
    "params": {"radius": 250},
    "z": 10
    },

    {"type": "LogoLayer", "path": "assets/logos/wgu_logo.png",
     "size": {"dynamic": True}, "position": {"x": "center", "y": "dynamic"}, "z": 20},
    
    # {"type": "ImageLayer", "path": "../assets/ribbon2.png",
    # "size": {"width": 610, "height": 120}, "position": {"x": "center", "y": 230}, "z": 25, "opacity": 1.0},
    

    {"type": "TextLayer", "text": "Spark Challenge",
     "font": {"path": "assets/fonts/Arial.ttf", "size": 45},
     "color": "#000000", "align": {"x": "center", "y": "dynamic"},
     "wrap": {"dynamic": True, "line_gap": 6}, "z": 30},

    {"type": "TextLayer", "text": "Soft Skill Credential",
     "font": {"path": "assets/fonts/Arial.ttf", "size": 37},
     "color": "#000000", "align": {"x": "center", "y": "dynamic"},
     "wrap": {"dynamic": True, "line_gap": 6}, "z": 30},

    # {"type": "ShapeLayer", "shape": "rounded_rect",
    #  "fill": {"mode": "solid", "color": "#a86b01"},
    #  "border": {"color": None, "width": 0},
    #  "params": {"rect": "dynamic", "radius": 12}, "z": 35},

    {"type": "TextLayer", "text": "Teamwork",
     "font": {"path": "assets/fonts/Arial.ttf", "size": 36},
     "color": "#FFFFFF", "align": {"x": "center", "y": "dynamic"},
     "wrap": {"dynamic": True,"line_gap": 0}, "z": 36}
  ]
}

# Constants
DEFAULT_CANVAS_WIDTH = 600
DEFAULT_CANVAS_HEIGHT = 600