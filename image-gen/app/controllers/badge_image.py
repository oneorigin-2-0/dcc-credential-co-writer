"""
Badge image generation controller
"""

from fastapi import APIRouter, HTTPException
from app.models.requests import BadgeRequest, TextOverlayBadgeRequest, IconBasedBadgeRequest
from app.models.responses import BadgeResponse
from app.services.badge_service import BadgeService
from app.services.config_generator import generate_text_overlay_config, generate_icon_based_config
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


@router.post("/badge/generate-with-text", response_model=BadgeResponse)
async def generate_badge_with_text(request: TextOverlayBadgeRequest):
    """
    Generate a badge with text overlay - generates config and renders in one call

    Args:
        request: Text overlay badge request with title, institute, and achievement phrase

    Returns:
        BadgeResponse with base64 encoded image
    """
    try:
        logger.info(f"Generating text overlay badge: {request.short_title}")

        # Step 1: Generate image config
        config = generate_text_overlay_config(
            short_title=request.short_title,
            institute=request.institute or "",
            achievement_phrase=request.achievement_phrase,
            institution_colors=request.institution_colors,
            seed=request.seed
        )

        # Step 2: Render badge image
        badge_request = {
            "canvas": {"bg": "white"},
            "layers": config["layers"]
        }

        result = await badge_service.generate_badge(badge_request)

        logger.info(f"Text overlay badge generated successfully: {request.short_title}")
        return result

    except ValueError as e:
        logger.error(f"Invalid configuration: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating text overlay badge: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate badge: {str(e)}")


@router.post("/badge/generate-with-icon", response_model=BadgeResponse)
async def generate_badge_with_icon(request: IconBasedBadgeRequest):
    """
    Generate a badge with icon - generates config and renders in one call

    Args:
        request: Icon-based badge request with icon suggestions

    Returns:
        BadgeResponse with base64 encoded image
    """
    try:
        logger.info(f"Generating icon-based badge for: {request.badge_name}")

        # Step 1: Generate image config
        config = generate_icon_based_config(
            badge_name=request.badge_name,
            badge_description=request.badge_description,
            icon_suggestions=request.icon_suggestions,
            institution=request.institution or "",
            institution_colors=request.institution_colors
        )

        # Step 2: Render badge image
        badge_request = {
            "canvas": {"bg": "white"},
            "layers": config["layers"]
        }

        result = await badge_service.generate_badge(badge_request)

        logger.info(f"Icon-based badge generated successfully: {request.badge_name}")
        return result

    except ValueError as e:
        logger.error(f"Invalid configuration: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating icon-based badge: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate badge: {str(e)}")