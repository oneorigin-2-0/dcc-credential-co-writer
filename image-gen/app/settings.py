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
    CORS_ORIGINS_STR: str = "*"

    # Canvas settings (fixed)
    CANVAS_WIDTH: int = 600
    CANVAS_HEIGHT: int = 600

    @property
    def CORS_ORIGINS(self) -> List[str]:
        """Parse CORS_ORIGINS from string"""
        if self.CORS_ORIGINS_STR.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS_STR.split(",") if origin.strip()]

    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "env_parse_none_str": "None",
        "env_parse_enums": False
    }

settings = Settings()