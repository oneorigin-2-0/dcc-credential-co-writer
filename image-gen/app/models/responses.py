"""
Response models for API endpoints
"""

from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

class BadgeData(BaseModel):
    """Badge data in response"""
    base64: str = Field(description="Base64 encoded image with data URI")
    #filename: str = Field(description="Suggested filename")
    #mimeType: str = Field(description="MIME type of the image")

class BadgeResponse(BaseModel):
    """Badge generation response model"""
    success: bool = Field(description="Operation success status")
    message: str = Field(description="Status message")
    data: BadgeData = Field(description="Generated badge data")
    config: Dict[str, Any] = Field(description="Configuration used to generate the badge")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Badge generated successfully",
                "data": {
                    "base64": "data:image/png;base64,iVBORw0KGgoAAAANS...",
                    #"filename": "badge.png",
                    #"mimeType": "image/png"
                },
                "config": {
                    "layers": []
                }
            }
        }


class ImageConfigResponse(BaseModel):
    """Image configuration in response for unified endpoint"""
    image_type: str = Field(description="Badge type: 'text_overlay' or 'icon_based'")
    border_color: Optional[str] = Field(default=None, description="Border color used")
    border_width: int = Field(default=0, description="Border width used")
    primary_color: Optional[str] = Field(default=None, description="Primary color used")
    secondary_color: Optional[str] = Field(default=None, description="Secondary color used")
    shape: Optional[str] = Field(default=None, description="Shape used")
    logo: str = Field(default="", description="Logo used (base64 or empty)")
    icon_used: Optional[str] = Field(default=None, description="Icon filename used (for icon_based type)")


class BadgeImageResponse(BaseModel):
    """Unified badge generation response model"""
    image_base64: str = Field(description="Base64 encoded image with data URI prefix (same format as BadgeResponse)")
    image_config: ImageConfigResponse = Field(description="Image configuration metadata")

    class Config:
        json_schema_extra = {
            "example": {
                "image_base64": "data:image/png;base64,iVBORw0KGgo...",
                "image_config": {
                    "image_type": "text_overlay",
                    "border_color": "#000000",
                    "border_width": 6,
                    "primary_color": "#A31F34",
                    "secondary_color": "#8A8B8C",
                    "shape": "hexagon",
                    "logo": "",
                    "icon_used": None
                }
            }
        }