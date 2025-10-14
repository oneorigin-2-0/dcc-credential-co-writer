"""
Request models for API endpoints
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class CanvasConfig(BaseModel):
    """Canvas configuration (dimensions are fixed at 600x600)"""
    bg: str = Field(default="white", description="Background color")
    scale_factor: float = Field(default=1.0, description="Scale factor for final image")

class BadgeRequest(BaseModel):
    """Badge generation request model"""
    canvas: CanvasConfig = Field(default_factory=CanvasConfig)
    layers: List[Dict[str, Any]] = Field(description="Array of layer configurations")

class TextOverlayBadgeRequest(BaseModel):
    """Request model for generating badge with text overlay"""
    badge_name: str = Field(description="Name of the badge")
    badge_description: str = Field(description="Description of the badge")
    optimized_text: Dict[str, Any] = Field(description="Optimized text from mit-slm optimize_badge_text")
    institution: Optional[str] = Field(default="", description="Institution name")
    institution_colors: Optional[Dict[str, str]] = Field(default=None, description="Institution brand colors")
    seed: Optional[int] = Field(default=None, description="Random seed for reproducibility")

    class Config:
        json_schema_extra = {
            "example": {
                "badge_name": "Python Programming Expert",
                "badge_description": "Demonstrates advanced proficiency in Python",
                "optimized_text": {
                    "short_title": "Python Expert",
                    "brief_description": "Advanced Python Skills",
                    "institution_display": "MIT",
                    "achievement_phrase": "Code with Confidence"
                },
                "institution": "Massachusetts Institute of Technology"
            }
        }

class IconBasedBadgeRequest(BaseModel):
    """Request model for generating badge with icon"""
    badge_name: str = Field(description="Name of the badge")
    badge_description: str = Field(description="Description of the badge")
    icon_suggestions: Dict[str, Any] = Field(description="Icon suggestions from mit-slm")
    institution: Optional[str] = Field(default="", description="Institution name")
    institution_colors: Optional[Dict[str, str]] = Field(default=None, description="Institution brand colors")
    seed: Optional[int] = Field(default=None, description="Random seed for reproducibility")

    class Config:
        json_schema_extra = {
            "example": {
                "badge_name": "Data Science Achievement",
                "badge_description": "Mastery in data analysis and visualization",
                "icon_suggestions": {
                    "suggested_icon": {
                        "name": "chart.png",
                        "display_name": "Chart"
                    }
                },
                "institution": "Massachusetts Institute of Technology"
            }
        }

    class Config:
        json_schema_extra = {
            "example": {
                "canvas": {
                    "bg": "white",
                    "scale_factor": 1
                },
                "layers": [
                    {
                        "type": "BackgroundLayer",
                        "mode": "solid",
                        "color": "#FFFFFF",
                        "z": 0
                    },
                    {
                        "type": "ShapeLayer",
                        "shape": "hexagon",
                        "fill": {
                            "mode": "solid",
                            "color": "#FFD700"
                        },
                        "params": {
                            "radius": 250
                        },
                        "z": 10
                    },
                    {
                        "type": "TextLayer",
                        "text": "Sample Badge",
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