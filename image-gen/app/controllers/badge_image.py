"""
Badge image generation controller
"""

from fastapi import APIRouter, HTTPException
from app.models.requests import BadgeRequest
from app.models.responses import BadgeResponse
from app.services.badge_service import BadgeService
from app.core.logging_config import get_logger

router = APIRouter()
logger = get_logger("badge_image_controller")
badge_service = BadgeService()

@router.post("/badge/generate", response_model=BadgeResponse)
async def generate_badge(request: BadgeRequest):
    """
    Generate a custom badge image from configuration

    Args:
        request: Badge configuration request

    Returns:
        BadgeResponse with base64 encoded image
    """
    try:
        logger.info("Received badge generation request")

        result = await badge_service.generate_badge(request.model_dump())

        logger.info("Badge generated successfully")
        return result

    except ValueError as e:
        logger.error(f"Invalid configuration: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating badge: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate badge: {str(e)}")