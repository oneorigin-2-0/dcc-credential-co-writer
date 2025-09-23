"""
Application configuration using Pydantic Settings
"""

from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Badge Image Generator API"
    PROJECT_DESCRIPTION: str = "API for generating custom badges images with layered composition"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Server settings
    PORT: int = 3001

    # CORS settings
    CORS_ORIGINS: List[str] = ["*"]

    # Canvas settings (fixed)
    CANVAS_WIDTH: int = 600
    CANVAS_HEIGHT: int = 600

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()