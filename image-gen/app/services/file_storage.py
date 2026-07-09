"""
File storage service for uploaded logos
"""

import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException
from app.core.logging_config import get_logger

logger = get_logger("file_storage")

# Allowed raster logo formats. SVG is intentionally excluded: it is an XML format
# (XXE / script / SSRF surface) that Pillow cannot rasterize anyway.
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

# Leading "magic" bytes for the formats we accept, used to confirm the declared
# extension matches the actual content (an attacker cannot rename a .svg to .png).
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
JPEG_SIGNATURE = b"\xff\xd8"


def _has_allowed_magic(header: bytes) -> bool:
    """Return True when ``header`` begins with a supported image signature."""
    return header.startswith(PNG_SIGNATURE) or header.startswith(JPEG_SIGNATURE)

def get_upload_dir() -> Path:
    """Get the upload directory path and create it if it doesn't exist"""
    script_dir = Path(__file__).parent.parent.parent
    upload_dir = script_dir / "uploads" / "logos"
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir

def validate_logo_file(file: UploadFile) -> None:
    """
    Validate uploaded logo file

    Args:
        file: Uploaded file

    Raises:
        HTTPException: If file is invalid
    """
    # Check if filename exists
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No filename provided"
        )

    # Check file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Check file size if available
    if hasattr(file.file, 'seek') and hasattr(file.file, 'tell'):
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Reset to beginning

        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {MAX_FILE_SIZE / 1024 / 1024}MB"
            )

async def save_uploaded_logo(file: UploadFile) -> str:
    """
    Save uploaded logo to temporary storage

    Args:
        file: Uploaded logo file

    Returns:
        Relative path to saved file (e.g., "uploads/logos/abc123.png")

    Raises:
        HTTPException: If file is invalid or save fails
    """
    try:
        # Validate file
        validate_logo_file(file)

        # Generate unique filename (filename is guaranteed to exist after validation)
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")

        file_ext = Path(file.filename).suffix.lower()
        unique_filename = f"{uuid.uuid4()}{file_ext}"

        # Get upload directory
        upload_dir = get_upload_dir()
        file_path = upload_dir / unique_filename

        # Read and verify the content actually matches an allowed image format
        # (defends against a disallowed payload renamed to a permitted extension).
        contents = await file.read()
        if not _has_allowed_magic(contents[:8]):
            raise HTTPException(
                status_code=400,
                detail="Invalid image content. Only PNG and JPEG logos are accepted.",
            )

        with open(file_path, "wb") as f:
            f.write(contents)

        # Return relative path from project root
        relative_path = f"uploads/logos/{unique_filename}"
        logger.info(f"Saved uploaded logo to: {relative_path}")

        return relative_path

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to save uploaded logo: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save uploaded logo: {str(e)}"
        )

def cleanup_temp_logo(file_path: str) -> None:
    """
    Delete temporary logo file

    Args:
        file_path: Relative path to the file (e.g., "uploads/logos/abc123.png")
    """
    try:
        if not file_path or not file_path.startswith("uploads/logos/"):
            return

        script_dir = Path(__file__).parent.parent.parent
        full_path = script_dir / file_path

        if full_path.exists():
            full_path.unlink()
            logger.info(f"Cleaned up temp logo: {file_path}")
    except Exception as e:
        logger.warning(f"Failed to cleanup temp logo {file_path}: {str(e)}")
