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
    #config: Dict[str, Any] = Field(description="Original configuration")

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
                #"config": {
                #    "canvas": {"bg": "white", "scale_factor": 1},
                #    "layers": []
                #}
            }
        }