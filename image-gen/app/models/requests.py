"""
Request models for API endpoints
"""

from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field, field_validator

class BadgeRequest(BaseModel):
    """Badge generation request model (canvas dimensions are fixed at 600x600)"""
    layers: List[Dict[str, Any]] = Field(description="Array of layer configurations")
    scale_factor: float = Field(default=2.0, description="Scale factor for rendering (1.0-3.0, default 2.0)")

    @field_validator('scale_factor')
    @classmethod
    def validate_scale_factor(cls, v):
        if not (1.0 <= v <= 3.0):
            raise ValueError('scale_factor must be between 1.0 and 3.0')
        return v

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
                            "path": "assets/fonts/Arimo-Regular.ttf",
                            "size": 45
                        },
                        "color": "#000000",
                        "align": {
                            "x": "center",
                            "y": "center"
                        },
                        "z": 30
                    }
                ],
                "scale_factor": 2.0
            }
        }

class TextOverlayBadgeRequest(BaseModel):
    """Request model for generating badge with text overlay and optional custom logo"""
    short_title: str = Field(description="Short badge title text")
    institute: Optional[str] = Field(default="", description="Institution/organization name (optional)")
    achievement_phrase: str = Field(default="", description="Achievement phrase or motto")
    colors: Optional[Dict[str, str]] = Field(default=None, description="Brand colors (primary, secondary, tertiary)")
    border_color: Optional[str] = Field(default=None, description="Border color hex code (e.g., '#000000')")
    border_width: Optional[int] = Field(default=None, description="Border width in pixels (e.g., 6)")
    shape: Optional[str] = Field(default=None, description="Badge shape: 'hexagon', 'circle', or 'rounded_rect'")
    seed: Optional[int] = Field(default=None, description="Random seed for reproducibility")
    scale_factor: float = Field(default=2.0, description="Scale factor for rendering (1.0-3.0, default 2.0)")
    logo_bytes: Optional[bytes] = Field(default=None, exclude=True, description="Logo image bytes (set after reading UploadFile)")

    @field_validator('scale_factor')
    @classmethod
    def validate_scale_factor(cls, v):
        if not (1.0 <= v <= 3.0):
            raise ValueError('scale_factor must be between 1.0 and 3.0')
        return v

    @classmethod
    def from_form_data(
        cls,
        short_title: str,
        achievement_phrase: Optional[str] = "",
        institute: Optional[str] = "",
        colors_json: Optional[str] = None,
        border_color: Optional[str] = None,
        border_width: Optional[int] = None,
        shape: Optional[str] = None,
        seed: Optional[int] = None,
        scale_factor: Optional[float] = 2.0,
        logo_bytes: Optional[bytes] = None
    ) -> "TextOverlayBadgeRequest":
        """Create instance from multipart form data"""
        import json
        parsed_colors = None
        if colors_json:
            try:
                parsed_colors = json.loads(colors_json)
            except json.JSONDecodeError:
                pass

        return cls(
            short_title=short_title,
            achievement_phrase=achievement_phrase or "",
            institute=institute or "",
            colors=parsed_colors,
            border_color=border_color,
            border_width=border_width,
            shape=shape,
            seed=seed,
            scale_factor=scale_factor or 2.0,
            logo_bytes=logo_bytes
        )

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
    scale_factor: float = Field(default=2.0, description="Scale factor for rendering (1.0-3.0, default 2.0)")

    @field_validator('scale_factor')
    @classmethod
    def validate_scale_factor(cls, v):
        if not (1.0 <= v <= 3.0):
            raise ValueError('scale_factor must be between 1.0 and 3.0')
        return v

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


class ImageConfiguration(BaseModel):
    """Image configuration model for unified badge generation"""
    primary_color: Optional[str] = Field(default=None, description="Primary brand color hex code")
    secondary_color: Optional[str] = Field(default=None, description="Secondary brand color hex code")
    border_color: Optional[str] = Field(default=None, description="Border color hex code (e.g., '#000000')")
    border_width: int = Field(default=0, description="Border width in pixels (e.g., 6)")
    shape: Optional[Literal["hexagon", "circle", "rounded_rect"]] = Field(
        default=None, description="Badge shape: 'hexagon', 'circle', or 'rounded_rect'"
    )
    logo: Optional[str] = Field(default="", description="Base64 encoded logo (optional)")
    ribbon_type: Optional[str] = Field(default=None, description="Ribbon type: 'ribbon', 'ribbon_folded', 'none', or None for random 50% chance")


class BadgeGenerationRequest(BaseModel):
    """Unified request model for badge generation (text_overlay or icon_based)"""
    image_type: str = Field(description="Badge type: 'text_overlay' or 'icon_based'")
    badge_name: Optional[str] = Field(default=None, description="Badge name (for icon_based type)")
    badge_description: Optional[str] = Field(default=None, description="Badge description (for icon_based type)")
    institution: Optional[str] = Field(default=None, description="Institution/organization name")
    institute_url: Optional[str] = Field(default=None, description="Institution URL for color scraping")
    
    # For text_overlay type
    short_title: Optional[str] = Field(default=None, description="Short badge title text (for text_overlay)")
    achievement_phrase: Optional[str] = Field(default="", description="Achievement phrase or motto (for text_overlay)")
    
    # Image configuration
    image_configuration: ImageConfiguration = Field(description="Image configuration settings")
    
    # Optional parameters
    scale_factor: float = Field(default=2.0, description="Scale factor for rendering (1.0-3.0, default 2.0)")

    @field_validator('image_type')
    @classmethod
    def validate_image_type(cls, v):
        if v not in ['text_overlay', 'icon_based']:
            raise ValueError("image_type must be 'text_overlay' or 'icon_based'")
        return v

    @field_validator('scale_factor')
    @classmethod
    def validate_scale_factor(cls, v):
        if not (1.0 <= v <= 3.0):
            raise ValueError('scale_factor must be between 1.0 and 3.0')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "image_type": "text_overlay",
                "badge_name": "Python Expert",
                "badge_description": "Mastered Python programming fundamentals...",
                "institution": "MIT",
                "institute_url": "https://mit.edu",
                "short_title": "Python Expert",
                "achievement_phrase": "Code Master",
                "image_configuration": {
                    "primary_color": "#A31F34",
                    "secondary_color": "#8A8B8C",
                    "border_color": "#000000",
                    "border_width": 6,
                    "shape": "hexagon",
                    "logo": ""
                },
                "scale_factor": 2.0
            }
        }