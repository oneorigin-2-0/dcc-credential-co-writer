"""
Request models for API endpoints
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class BadgeRequest(BaseModel):
    """Badge generation request model (canvas dimensions are fixed at 600x600)"""
    layers: List[Dict[str, Any]] = Field(description="Array of layer configurations")

    class Config:
        json_schema_extra = {
            "example": {
                "layers": [
                    {
                        "type": "ShapeLayer",
                        "shape": "hexagon",
                        "fill": {
                            "mode": "gradient",
                            "start_color": "#FFD700",
                            "end_color": "#FF4500",
                            "vertical": True
                        },
                        "border": {
                            "color": "#800000",
                            "width": 6
                        },
                        "params": {
                            "radius": 250
                        },
                        "z": 10
                    },
                    {
                        "type": "TextLayer",
                        "text": "Achievement",
                        "font": {
                            "path": "assets/fonts/Arial.ttf",
                            "size": 45
                        },
                        "color": "#000000",
                        "align": {
                            "x": "center",
                            "y": "center"
                        },
                        "z": 30
                    }
                ]
            }
        }

class TextOverlayBadgeRequest(BaseModel):
    """Request model for generating badge with text overlay"""
    short_title: str = Field(description="Short badge title text")
    institute: Optional[str] = Field(default="", description="Institution/organization name (optional)")
    achievement_phrase: str = Field(description="Achievement phrase or motto")
    colors: Optional[Dict[str, str]] = Field(default=None, description="Brand colors (primary, secondary, tertiary)")
    seed: Optional[int] = Field(default=None, description="Random seed for reproducibility")

    class Config:
        json_schema_extra = {
            "example": {
                "short_title": "Python Expert",
                "institute": "MIT",
                "achievement_phrase": "Code with Confidence",
                "colors": {
                    "primary": "#A31F34",
                    "secondary": "#8A8B8C",
                    "tertiary": "#C2C0BF"
                }
            }
        }

class IconBasedBadgeRequest(BaseModel):
    """Request model for generating badge with icon"""
    icon_name: str = Field(description="Icon filename (e.g., 'atom.png', 'trophy.png')")
    colors: Optional[Dict[str, str]] = Field(default=None, description="Brand colors (primary, secondary, tertiary)")
    seed: Optional[int] = Field(default=None, description="Random seed for reproducibility")

    class Config:
        json_schema_extra = {
            "example": {
                "icon_name": "atom.png",
                "colors": {
                    "primary": "#A31F34",
                    "secondary": "#8A8B8C",
                    "tertiary": "#C2C0BF"
                },
                "seed": 12345
            }
        }