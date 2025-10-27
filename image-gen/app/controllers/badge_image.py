"""
Badge image generation controller
"""

import json
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from app.models.requests import BadgeRequest, TextOverlayBadgeRequest, IconBasedBadgeRequest
from app.models.responses import BadgeResponse
from app.services.badge_service import BadgeService
from app.services.config_generator import generate_text_overlay_config, generate_icon_based_config
from app.services.file_storage import save_uploaded_logo, cleanup_temp_logo
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
        BadgeResponse with base64 encoded image and configuration
    """
    try:
        logger.info("Received badge generation request")

        request_dict = request.model_dump()
        result = await badge_service.generate_badge(request_dict)

        # Add the input layers to the response config
        result.config = {
            "layers": request_dict.get("layers", [])
        }

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
        BadgeResponse with base64 encoded image and configuration
    """
    try:
        logger.info(f"Generating text overlay badge with Title: {request.short_title}, Achievement Phrase: {request.achievement_phrase}")

        # Step 1: Generate image config
        config = generate_text_overlay_config(
            short_title=request.short_title,
            institute=request.institute or "",
            achievement_phrase=request.achievement_phrase,
            colors=request.colors,
            seed=request.seed
        )

        # Step 2: Render badge image
        badge_request = {
            "layers": config["layers"]
        }

        result = await badge_service.generate_badge(badge_request)

        # Step 3: Add config to response
        result.config = config

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
        request: Icon-based badge request with icon name

    Returns:
        BadgeResponse with base64 encoded image and configuration
    """
    try:
        logger.info(f"Generating icon-based badge with icon: {request.icon_name}")

        # Step 1: Generate image config
        config = generate_icon_based_config(
            icon_name=request.icon_name,
            colors=request.colors,
            seed=request.seed
        )

        # Step 2: Render badge image
        badge_request = {
            "layers": config["layers"]
        }

        result = await badge_service.generate_badge(badge_request)

        # Step 3: Add config to response
        result.config = config

        logger.info(f"Icon-based badge generated successfully with icon: {request.icon_name}")
        return result

    except ValueError as e:
        logger.error(f"Invalid configuration: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating icon-based badge: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate badge: {str(e)}")


@router.post("/badge/generate-with-logo", response_model=BadgeResponse)
async def generate_badge_with_logo(
    logo: UploadFile = File(..., description="Custom logo file (PNG or SVG only)"),
    config: str = Form(..., description="Badge configuration JSON string")
):
    """
    Generate a badge with custom uploaded logo

    This endpoint accepts a logo file and badge configuration.
    It replaces any LogoLayer in the config with the uploaded logo,
    generates the badge, and immediately deletes the temporary logo file.

    Args:
        logo: Uploaded logo file
        config: Badge configuration as JSON string

    Returns:
        BadgeResponse with base64 encoded image and updated configuration
    """
    temp_logo_path = None

    try:
        logger.info(f"Received badge generation request with custom logo: {logo.filename}")

        # Step 1: Parse configuration
        try:
            config_dict = json.loads(config)
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON in config: {str(e)}")

        # Validate config has layers
        if "layers" not in config_dict:
            raise HTTPException(status_code=400, detail="Config must contain 'layers' field")

        # Step 2: Save uploaded logo temporarily
        temp_logo_path = await save_uploaded_logo(logo)

        # Step 3: Replace LogoLayer paths in configuration
        layers = config_dict.get("layers", [])
        logo_replaced = False

        for layer in layers:
            if layer.get("type") in ["LogoLayer"]:
                # Replace the path with our uploaded logo
                layer["path"] = temp_logo_path
                logo_replaced = True
                logger.info(f"Replaced logo path in {layer.get('type')}")

        if not logo_replaced:
            logger.warning("No LogoLayer or ImageLayer found in config to replace")

        # Step 4: Generate badge
        badge_request = {
            "layers": layers
        }

        result = await badge_service.generate_badge(badge_request)

        # Step 5: Add updated config to response
        result.config = config_dict

        logger.info("Badge with custom logo generated successfully")
        return result

    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Invalid configuration: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating badge with logo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate badge: {str(e)}")

    finally:
        # Step 6: Always cleanup temporary logo file
        if temp_logo_path:
            cleanup_temp_logo(temp_logo_path)