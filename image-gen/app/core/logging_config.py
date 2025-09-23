"""
Production logging configuration for Badge Generator API
"""
import logging
import logging.handlers
import os
import sys
from pathlib import Path
from typing import Optional


def setup_logging(
    log_level: str = "INFO",
    log_file: Optional[str] = None,
    max_bytes: int = 10 * 1024 * 1024,  # 10MB
    backup_count: int = 5
) -> logging.Logger:
    """
    Setup production logging configuration

    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Path to log file (defaults to logs/badge_api.log)
        max_bytes: Maximum size of log file before rotation
        backup_count: Number of backup files to keep

    Returns:
        Configured logger instance
    """
    # Create logs directory if it doesn't exist
    logs_dir = Path("logs")
    logs_dir.mkdir(parents=True, exist_ok=True)

    # Default log file path
    if log_file is None:
        log_file = str(logs_dir / "badge_api.log")

    # Create formatters
    detailed_formatter = logging.Formatter(
        fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    simple_formatter = logging.Formatter(
        fmt="%(levelname)s - %(message)s"
    )

    # Setup main API logger
    api_logger = logging.getLogger("badge_api")
    api_logger.setLevel(getattr(logging, log_level.upper()))
    api_logger.handlers.clear()

    # Console handler (for development)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(simple_formatter)
    api_logger.addHandler(console_handler)

    # Create log file if it doesn't exist
    Path(log_file).touch(exist_ok=True)

    # API File handler with rotation
    api_file_handler = logging.handlers.RotatingFileHandler(
        filename=log_file,
        maxBytes=max_bytes,
        backupCount=backup_count,
        encoding="utf-8"
    )
    api_file_handler.setLevel(getattr(logging, log_level.upper()))
    api_file_handler.setFormatter(detailed_formatter)
    api_logger.addHandler(api_file_handler)

    # Create error log file if it doesn't exist
    error_log_path = logs_dir / "error.log"
    error_log_path.touch(exist_ok=True)

    # Error file handler (separate file for all errors)
    error_handler = logging.handlers.RotatingFileHandler(
        filename=error_log_path,
        maxBytes=max_bytes,
        backupCount=backup_count,
        encoding="utf-8"
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(detailed_formatter)
    api_logger.addHandler(error_handler)

    # Prevent duplicate logs
    api_logger.propagate = False

    return api_logger


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance for a specific module

    Args:
        name: Module name (usually __name__)

    Returns:
        Logger instance
    """
    return logging.getLogger(f"badge_api.{name}")


def configure_third_party_loggers():
    """Configure logging for third-party libraries"""
    # Reduce noise from httpx
    logging.getLogger("httpx").setLevel(logging.WARNING)

    # Reduce noise from uvicorn
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

    # Reduce noise from watchfiles
    logging.getLogger("watchfiles").setLevel(logging.WARNING)

    # Reduce noise from PIL
    logging.getLogger("PIL").setLevel(logging.WARNING)

    # Reduce noise from gradio (when used)
    logging.getLogger("gradio").setLevel(logging.WARNING)


def log_request_info(request, response_time: Optional[float] = None):
    """
    Log request information

    Args:
        request: FastAPI request object
        response_time: Response time in seconds
    """
    logger = get_logger("requests")

    log_data = {
        "method": request.method,
        "url": str(request.url),
        "client": request.client.host if request.client else "unknown"
    }

    if response_time:
        log_data["response_time"] = f"{response_time:.3f}s"

    logger.info(f"Request: {log_data}")


from typing import Optional

def log_badge_generation(config: dict, success: bool, error: Optional[str] = None, generation_time: Optional[float] = None):
    """
    Log badge generation events (now uses main API logger)

    Args:
        config: Badge configuration
        success: Whether generation was successful
        error: Error message if failed
        generation_time: Time taken to generate badge
    """
    # Use main API logger instead of separate logger
    logger = get_logger("badge_service")

    canvas_info = config.get("canvas", {})
    layers_count = len(config.get("layers", []))

    log_data = {
        "canvas_size": f"{canvas_info.get('width', 600)}x{canvas_info.get('height', 600)}",
        "layers_count": layers_count,
        "success": success
    }

    if generation_time:
        log_data["generation_time"] = f"{generation_time:.3f}s"

    if success:
        logger.info(f"Badge generated successfully: {log_data}")
    else:
        log_data["error"] = error
        logger.error(f"Badge generation failed: {log_data}")


# Initialize logging on import
if not logging.getLogger("badge_api").handlers:
    setup_logging()
    configure_third_party_loggers()