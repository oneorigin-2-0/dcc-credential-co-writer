"""
Badge image generation controller
"""

import json
import base64
import binascii
import re
import tempfile
import os
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Request
from typing import Optional
from app.models.requests import (
    BadgeRequest, 
    BadgeGenerationRequest
)
from app.models.responses import BadgeResponse
from app.services.badge_service import BadgeService
from app.services.config_generator import generate_text_overlay_config, generate_icon_based_config
from app.services.file_storage import save_uploaded_logo, cleanup_temp_logo
from app.services.web_color_scraper import scrape_institution_colors_async
from app.utils.icon_matcher import get_icon_suggestions_for_badge
from app.core.logging_config import get_logger

router = APIRouter()
logger = get_logger("badge_image_controller")
badge_service = BadgeService()


def normalize_color(color: Optional[str]) -> Optional[str]:
    """
    Normalize color string to ensure it starts with '#'
    
    Args:
        color: Color string (may or may not start with '#')
        
    Returns:
        Normalized color string starting with '#', or None if color is None/empty
    """
    if not color:
        return None
    
    color = color.strip()
    if not color:
        return None
    
    # Add '#' prefix if not present
    if not color.startswith('#'):
        return f"#{color}"
    
    return color


def decode_base64_logo(base64_string: str) -> bytes:
    """
    Safely decode base64 logo string with proper padding and validation
    Supports both standard base64 and URL-safe base64 encoding
    
    Args:
        base64_string: Base64 encoded string (may include data URI prefix)
        
    Returns:
        Decoded bytes
        
    Raises:
        ValueError: If base64 string is invalid
    """
    if not base64_string:
        raise ValueError("Empty base64 string")
    
    original_length = len(base64_string)
    
    # Remove data URI prefix if present (e.g., "data:image/png;base64,")
    if ',' in base64_string:
        base64_string = base64_string.split(',', 1)[1]
    
    # Remove all whitespace (including newlines, tabs, spaces, etc.)
    base64_string = ''.join(base64_string.split())
    
    if not base64_string:
        raise ValueError("Base64 string is empty after removing prefix and whitespace")
    
    # Check if it's URL-safe base64 (contains - or _)
    is_url_safe = '-' in base64_string or '_' in base64_string
    
    # Remove any existing padding to recalculate correctly
    base64_string = base64_string.rstrip('=')
    
    # Add proper padding (base64 strings must be multiple of 4)
    missing_padding = len(base64_string) % 4
    if missing_padding:
        padding_needed = 4 - missing_padding
        base64_string += '=' * padding_needed
        logger.debug(f"Added {padding_needed} padding character(s) to base64 string")
    
    # Try to decode - be more lenient, let the decoder handle validation
    # First try URL-safe if it contains URL-safe characters
    if is_url_safe:
        try:
            decoded = base64.urlsafe_b64decode(base64_string)
            if decoded:
                logger.debug(f"Successfully decoded URL-safe base64 logo: {len(decoded)} bytes")
                return decoded
        except Exception as e:
            logger.debug(f"URL-safe decode failed: {e}, trying standard base64")
    
    # Try standard base64 decode
    try:
        decoded = base64.b64decode(base64_string)
        if not decoded:
            raise ValueError("Decoded base64 resulted in empty bytes")
        logger.debug(f"Successfully decoded standard base64 logo: {len(decoded)} bytes")
        return decoded
    except binascii.Error as e:
        # Log the problematic characters for debugging
        invalid_chars = set(base64_string) - set('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=-_')
        if invalid_chars:
            logger.error(f"Invalid characters found in base64 string: {invalid_chars}")
        raise ValueError(f"Invalid base64-encoded string: {str(e)}. Length: {len(base64_string)}, Original length: {original_length}")
    except Exception as e:
        raise ValueError(f"Failed to decode base64: {str(e)}")


async def generate_badge_with_logo_helper(
    config_dict: dict,
    logo_bytes: bytes,
    scale_factor: float = 2.0,
    logo_base64: Optional[str] = None
) -> BadgeResponse:
    """
    Helper function to generate badge with custom logo (from bytes)
    
    This is the core logic extracted from generate_badge_with_logo endpoint.
    Can be used when logo is provided as base64 string in BadgeGenerationRequest.
    Uses logo_base64 by default (no temp files needed), falls back to temp file if base64 not provided.
    
    Args:
        config_dict: Badge configuration dictionary with layers
        logo_bytes: Logo image bytes (from base64 decode)
        scale_factor: Scale factor for rendering
        logo_base64: Optional base64 string (if provided, will be used directly instead of creating temp file)
        
    Returns:
        BadgeResponse with base64 encoded image and configuration
    """
    temp_logo_path = None
    
    try:
        # Validate config has layers
        if "layers" not in config_dict:
            raise HTTPException(status_code=400, detail="Config must contain 'layers' field")
        
        # Encode logo bytes to base64 if not provided
        if not logo_base64:
            logo_base64 = base64.b64encode(logo_bytes).decode('utf-8')
            logger.debug(f"Encoded logo bytes to base64 ({len(logo_base64)} chars)")
        
        # Replace LogoLayer with logo_base64 (preferred) or path (fallback)
        layers = config_dict.get("layers", [])
        logo_replaced = False
        
        for layer in layers:
            if layer.get("type") in ["LogoLayer"]:
                # Use logo_base64 by default (no temp file needed)
                layer["logo_base64"] = logo_base64
                # Remove path to ensure base64 is used
                if "path" in layer:
                    original_path = layer.pop("path")
                    logger.debug(f"Replaced path '{original_path}' with logo_base64 in {layer.get('type')}")
                else:
                    logger.info(f"Set logo_base64 in {layer.get('type')}")
                logo_replaced = True
        
        if not logo_replaced:
            logger.warning("No LogoLayer found in config to replace")
        
        # Generate badge with scale_factor
        badge_request = {
            "canvas": {"scale_factor": scale_factor},
            "layers": layers
        }
        
        result = await badge_service.generate_badge(badge_request)
        
        # Add only scale_factor and layers to response
        result.config = {
            "scale_factor": scale_factor,
            "layers": layers
        }
        
        logger.info("Badge with custom logo generated successfully (using logo_base64)")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating badge with logo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate badge: {str(e)}")
    
    finally:
        # Cleanup temporary logo file if it was created (shouldn't be needed with base64 approach)
        if temp_logo_path and os.path.exists(temp_logo_path):
            try:
                os.unlink(temp_logo_path)
            except Exception as e:
                logger.warning(f"Failed to cleanup temp logo: {e}")


@router.post("/badge/generate", response_model=BadgeResponse)
async def generate_badge(request: BadgeRequest):
    """
    Generate a custom badge image from configuration
    
    This endpoint accepts a full layer configuration for maximum flexibility.
    For simpler badge generation, use /badge/generate-with-text or /badge/generate-with-icon instead.

    Args:
        request: Badge configuration request with layers

    Returns:
        BadgeResponse with base64 encoded image and configuration
    """
    try:
        logger.info("Received badge generation request")

        request_dict = request.model_dump()

        # Extract scale_factor from either root level or canvas
        if "canvas" in request_dict and "scale_factor" in request_dict["canvas"]:
            scale_factor = request_dict["canvas"]["scale_factor"]
        else:
            scale_factor = request_dict.get("scale_factor", 2.0)

        # Build config with scale_factor in canvas
        config = {
            "canvas": {"scale_factor": scale_factor},
            "layers": request_dict.get("layers", [])
        }

        result = await badge_service.generate_badge(config)

        # Add only scale_factor and layers to response (no canvas dimensions)
        result.config = {
            "scale_factor": scale_factor,
            "layers": config["layers"]
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
async def generate_badge_with_text(request: BadgeGenerationRequest):
    """
    Generate a badge with text overlay - generates config and renders in one call
    
    This endpoint:
    - Accepts BadgeGenerationRequest with image_type="text_overlay"
    - Scrapes institution colors if not provided and institute_url is given
    - Handles logo from base64 string
    - Returns BadgeResponse with base64 encoded image and configuration

    Args:
        request: BadgeGenerationRequest with image_type="text_overlay"

    Returns:
        BadgeResponse with base64 encoded image and configuration
    """
    temp_logo_path = None

    try:
        # Validate image_type
        if request.image_type != "text_overlay":
            raise HTTPException(
                status_code=400,
                detail=f"Invalid image_type: '{request.image_type}'. This endpoint requires 'text_overlay'"
            )
        
        if not request.short_title:
            raise HTTPException(status_code=400, detail="short_title is required for text_overlay type")
        
        logger.info(f"Generating text overlay badge with Title: {request.short_title}")
        
        # Step 1: Get colors (custom or scraped)
        colors = {}
        if request.image_configuration.primary_color:
            colors["primary"] = normalize_color(request.image_configuration.primary_color)
        if request.image_configuration.secondary_color:
            colors["secondary"] = normalize_color(request.image_configuration.secondary_color)
        
        # Scrape colors if not provided and URL is given
        if not colors and request.institute_url:
            logger.info(f"Scraping colors from: {request.institute_url}")
            scraped = await scrape_institution_colors_async(request.institute_url)
            if scraped.get("primary"):
                colors["primary"] = normalize_color(scraped["primary"])
            if scraped.get("secondary"):
                colors["secondary"] = normalize_color(scraped["secondary"])
            if scraped.get("tertiary"):
                colors["tertiary"] = normalize_color(scraped["tertiary"])
            logger.info(f"Scraped colors: {colors}")
        
        # Use scraped or provided colors, or None if still empty
        final_colors = colors if colors else None

        # Step 2: Generate image config
        config = generate_text_overlay_config(
            short_title=request.short_title,
            institute=request.institution or "",
            achievement_phrase=request.achievement_phrase or "",
            colors=final_colors,
            border_color=request.image_configuration.border_color,
            border_width=request.image_configuration.border_width if request.image_configuration.border_width > 0 else None,
            shape=request.image_configuration.shape,
            seed=None
        )

        # Step 3: Check if logo is provided - if yes, use generate_badge_with_logo_helper
        if request.image_configuration.logo:
            try:
                # Decode base64 logo with proper validation and padding
                logo_bytes = decode_base64_logo(request.image_configuration.logo)
                logger.info("Logo provided in image_configuration, routing to logo helper function")
                
                # Prepare config dict with scale_factor
                config_dict = {
                    "canvas": {"scale_factor": request.scale_factor},
                    "layers": config["layers"]
                }
                
                # Call helper function to generate badge with logo
                # Pass the original base64 string to avoid re-encoding
                return await generate_badge_with_logo_helper(
                    config_dict=config_dict,
                    logo_bytes=logo_bytes,
                    scale_factor=request.scale_factor,
                    logo_base64=request.image_configuration.logo  # Use original base64 string
                )
            except ValueError as e:
                logger.error(f"Failed to decode logo (invalid base64): {e}, falling back to default logo")
                # Fall through to default behavior
            except Exception as e:
                logger.error(f"Failed to process logo: {e}, falling back to default logo")
                # Fall through to default behavior

        # Step 4: Render badge image with scale_factor (no custom logo)
        badge_render_request = {
            "canvas": {"scale_factor": request.scale_factor},
            "layers": config["layers"]
        }

        result = await badge_service.generate_badge(badge_render_request)

        # Step 5: Add only scale_factor and layers to response
        result.config = {
            "scale_factor": request.scale_factor,
            "layers": config["layers"]
        }

        logger.info(f"Text overlay badge generated successfully: {request.short_title}")
        return result

    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Invalid configuration: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating text overlay badge: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate badge: {str(e)}")

    finally:
        # Cleanup temp logo file
        if temp_logo_path and os.path.exists(temp_logo_path):
            try:
                os.unlink(temp_logo_path)
            except Exception as e:
                logger.warning(f"Failed to cleanup temp logo: {e}")


@router.post("/badge/generate-with-icon", response_model=BadgeResponse)
async def generate_badge_with_icon(request: BadgeGenerationRequest):
    """
    Generate a badge with icon - generates config and renders in one call
    
    This endpoint:
    - Accepts BadgeGenerationRequest with image_type="icon_based"
    - Matches icon using badge_name and badge_description
    - Scrapes institution colors if not provided and institute_url is given
    - Supports border and shape configuration
    - Returns BadgeResponse with base64 encoded image and configuration

    Args:
        request: BadgeGenerationRequest with image_type="icon_based"

    Returns:
        BadgeResponse with base64 encoded image and configuration
    """
    try:
        # Validate image_type
        if request.image_type != "icon_based":
            raise HTTPException(
                status_code=400,
                detail=f"Invalid image_type: '{request.image_type}'. This endpoint requires 'icon_based'"
            )
        
        if not request.badge_name or not request.badge_description:
            raise HTTPException(
                status_code=400, 
                detail="badge_name and badge_description are required for icon_based type"
            )
        
        logger.info(f"Generating icon-based badge for: {request.badge_name}")
        
        # Step 1: Get colors (custom or scraped)
        colors = {}
        if request.image_configuration.primary_color:
            colors["primary"] = normalize_color(request.image_configuration.primary_color)
        if request.image_configuration.secondary_color:
            colors["secondary"] = normalize_color(request.image_configuration.secondary_color)
        
        # Scrape colors if not provided and URL is given
        if not colors and request.institute_url:
            logger.info(f"Scraping colors from: {request.institute_url}")
            scraped = await scrape_institution_colors_async(request.institute_url)
            if scraped.get("primary"):
                colors["primary"] = normalize_color(scraped["primary"])
            if scraped.get("secondary"):
                colors["secondary"] = normalize_color(scraped["secondary"])
            if scraped.get("tertiary"):
                colors["tertiary"] = normalize_color(scraped["tertiary"])
            logger.info(f"Scraped colors: {colors}")
        
        # Use scraped or provided colors, or None if still empty
        final_colors = colors if colors else None
        
        # Step 2: Match icon using icon_matcher
        logger.info(f"Matching icon for badge: {request.badge_name}")
        icon_result = await get_icon_suggestions_for_badge(
            badge_name=request.badge_name,
            badge_description=request.badge_description,
            top_k=3
        )
        
        icon_name = icon_result.get('suggested_icon', {}).get('name', 'trophy.png')
        logger.info(f"Matched icon: {icon_name}")

        # Step 3: Generate image config
        config = generate_icon_based_config(
            icon_name=icon_name,
            colors=final_colors,
            seed=None
        )
        
        # Step 4: Apply border and shape if provided
        if request.image_configuration.border_color or request.image_configuration.border_width > 0:
            for layer in config.get("layers", []):
                if layer.get("type") == "ShapeLayer":
                    layer["border"] = {
                        "color": request.image_configuration.border_color or "#000000",
                        "width": request.image_configuration.border_width or 6
                    }
                    if request.image_configuration.shape:
                        layer["shape"] = request.image_configuration.shape
                    break

        # Step 5: Check if logo is provided - if yes, use generate_badge_with_logo_helper
        if request.image_configuration.logo:
            try:
                # Decode base64 logo with proper validation and padding
                logo_bytes = decode_base64_logo(request.image_configuration.logo)
                logger.info("Logo provided in image_configuration, routing to logo helper function")
                
                # Prepare config dict with scale_factor
                config_dict = {
                    "canvas": {"scale_factor": request.scale_factor},
                    "layers": config["layers"]
                }
                
                # Call helper function to generate badge with logo
                # Pass the original base64 string to avoid re-encoding
                return await generate_badge_with_logo_helper(
                    config_dict=config_dict,
                    logo_bytes=logo_bytes,
                    scale_factor=request.scale_factor,
                    logo_base64=request.image_configuration.logo  # Use original base64 string
                )
            except ValueError as e:
                logger.error(f"Failed to decode logo (invalid base64): {e}, falling back to default behavior")
                # Fall through to default behavior (icon-based badges don't typically have logos)
            except Exception as e:
                logger.error(f"Failed to process logo: {e}, falling back to default behavior")
                # Fall through to default behavior (icon-based badges don't typically have logos)

        # Step 6: Render badge image with scale_factor (no custom logo)
        badge_request = {
            "canvas": {"scale_factor": request.scale_factor},
            "layers": config["layers"]
        }

        result = await badge_service.generate_badge(badge_request)

        # Step 7: Add only scale_factor and layers to response
        result.config = {
            "scale_factor": request.scale_factor,
            "layers": config["layers"]
        }

        logger.info(f"Icon-based badge generated successfully with icon: {icon_name}")
        return result

    except HTTPException:
        raise
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

        # Step 2: Read logo bytes from UploadFile
        logo_bytes = await logo.read()

        # Step 3: Extract scale_factor from config
        if "canvas" in config_dict and "scale_factor" in config_dict["canvas"]:
            scale_factor = config_dict["canvas"]["scale_factor"]
        else:
            scale_factor = config_dict.get("scale_factor", 2.0)

        # Step 4: Use helper function to generate badge with logo
        # Note: UploadFile doesn't have original base64, so it will be encoded in the helper
        return await generate_badge_with_logo_helper(
            config_dict=config_dict,
            logo_bytes=logo_bytes,
            scale_factor=scale_factor,
            logo_base64=None  # Will be encoded from logo_bytes in helper
        )

    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Invalid configuration: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating badge with logo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate badge: {str(e)}")