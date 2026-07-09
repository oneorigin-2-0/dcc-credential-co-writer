"""
Badge generation service
"""

import base64
import time
from io import BytesIO
from typing import Dict, Any

from app.core.composer import render_from_spec
from app.models.responses import BadgeResponse, BadgeData
from app.core.logging_config import get_logger, log_badge_generation

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

            # Preserve scale_factor if already set, otherwise it will be extracted from canvas config in render_from_spec

            # Add default background layer only if one doesn't exist
            has_background = any(layer.get("type") == "BackgroundLayer" for layer in config.get("layers", []))
            if not has_background:
                config["layers"].insert(0, {
                    "type": "BackgroundLayer",
                    "mode": "solid",
                    "color": "#FFFFFF00",
                    "z": 0
                })

            # Generate badge using composer
            image = render_from_spec(config)

            if image is None:
                raise ValueError("Failed to generate badge image")

            # Convert PIL Image to base64
            buffer = BytesIO()
            image.save(buffer, format='PNG', optimize=False)
            buffer.seek(0)

            # Get image bytes
            img_bytes = buffer.getvalue()
            
            if not img_bytes:
                raise ValueError("Failed to convert image to bytes")
            
            # Encode to base64 (ensure no newlines for JSON compatibility)
            img_base64 = base64.b64encode(img_bytes).decode('utf-8')
            
            # Validate base64 encoding
            if not img_base64:
                raise ValueError("Failed to encode image to base64")
            
            # Verify the base64 can be decoded back (sanity check)
            try:
                decoded_check = base64.b64decode(img_base64)
                if len(decoded_check) != len(img_bytes):
                    raise ValueError("Base64 encoding verification failed: size mismatch")
            except Exception as e:
                logger.warning(f"Base64 verification warning: {e}")
            
            # Create data URI with proper format (no newlines, proper format)
            data_uri = f"data:image/png;base64,{img_base64}"
            
            # Log base64 info for debugging
            logger.debug(f"Generated base64 image: {len(img_base64)} chars, data URI length: {len(data_uri)}")
            
            generation_time = time.time() - start_time

            # Log successful generation
            log_badge_generation(config, success=True, generation_time=generation_time)
            logger.info(f"Badge generated successfully in {generation_time:.3f}s (base64 length: {len(img_base64)})")

            # Create response
            return BadgeResponse(
                success=True,
                message="Badge generated successfully",
                data=BadgeData(
                    base64=data_uri
                    #filename="badge.png",
                    #mimeType="image/png"
                ),
                config=config
            )

        except Exception as e:
            generation_time = time.time() - start_time
            error_msg = str(e)

            # Log failed generation
            log_badge_generation(config, success=False, error=error_msg, generation_time=generation_time)
            logger.error(f"Badge generation failed after {generation_time:.3f}s: {error_msg}")
            raise