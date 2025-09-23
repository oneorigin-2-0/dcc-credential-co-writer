"""
Badge generation service
"""

import base64
import time
from io import BytesIO
from typing import Dict, Any

from app.core.composer import render_from_spec
from app.models.responses import BadgeResponse, BadgeData
from app.logging_config import get_logger, log_badge_generation

# Use main API logger
logger = get_logger("badge_service")

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
        start_time = time.time()

        try:
            logger.info("Starting badge generation")

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

            generation_time = time.time() - start_time

            # Log successful generation
            log_badge_generation(config, success=True, generation_time=generation_time)
            logger.info(f"Badge generated successfully in {generation_time:.3f}s")

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
            generation_time = time.time() - start_time
            error_msg = str(e)

            # Log failed generation
            log_badge_generation(config, success=False, error=error_msg, generation_time=generation_time)
            logger.error(f"Badge generation failed after {generation_time:.3f}s: {error_msg}")
            raise