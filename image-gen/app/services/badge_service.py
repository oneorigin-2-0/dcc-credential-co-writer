"""
Badge generation service
"""

import base64
from io import BytesIO
from typing import Dict, Any
import logging

from app.core.composer import render_from_spec
from app.models.responses import BadgeResponse, BadgeData

logger = logging.getLogger(__name__)

class BadgeService:
    """Service for generating badge images"""

    async def generate_badge(self, config: Dict[str, Any]) -> BadgeResponse:
        """
        Generate a badge image from configuration

        Args:
            config: Badge configuration dictionary

        Returns:
            BadgeResponse with base64 encoded image
        """
        try:
            # Add fixed canvas dimensions
            if "canvas" not in config:
                config["canvas"] = {}
            config["canvas"]["width"] = 600
            config["canvas"]["height"] = 600

            # Generate badge using composer
            image = render_from_spec(config)

            if image is None:
                raise ValueError("Failed to generate badge image")

            # Convert PIL Image to base64
            buffer = BytesIO()
            image.save(buffer, format='PNG')
            buffer.seek(0)

            # Encode to base64
            img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

            # Create response
            return BadgeResponse(
                success=True,
                message="Badge generated successfully",
                data=BadgeData(
                    base64=f"data:image/png;base64,{img_base64}"
                    #filename="badge.png",
                    #mimeType="image/png"
                )
                #config=config
            )

        except Exception as e:
            logger.error(f"Error generating badge: {str(e)}")
            raise