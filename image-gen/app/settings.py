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

    # CORS settings. Default to an explicit local-dev origin rather than "*";
    # override via the CORS_ORIGINS_STR env var (comma-separated) in deployment.
    CORS_ORIGINS_STR: str = "http://localhost:3000"

    # Canvas settings (fixed)
    CANVAS_WIDTH: int = 600
    CANVAS_HEIGHT: int = 600

    # Asset paths
    ASSETS_PATH: str = "assets/"
    ICONS_PATH: str = "assets/icons/"
    LOGOS_PATH: str = "assets/logos/"
    FONTS_PATH: str = "assets/fonts/"

    # Image generation defaults
    DEFAULT_IMAGE_WIDTH: int = 400
    DEFAULT_IMAGE_HEIGHT: int = 400
    DEFAULT_BORDER_WIDTH: int = 6
    DEFAULT_SHAPE: str = "hexagon"

    # Icon matching settings
    ICON_MATCHER_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    ICON_MATCHER_TOP_K: int = 3

    @property
    def CORS_ORIGINS(self) -> List[str]:
        """Parse CORS_ORIGINS from string"""
        if self.CORS_ORIGINS_STR.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS_STR.split(",") if origin.strip()]

    @property
    def CORS_ALLOW_CREDENTIALS(self) -> bool:
        """
        Credentialed CORS is only safe with an explicit origin allowlist. The
        wildcard "*" combined with credentials is rejected by browsers and is a
        security anti-pattern, so credentials are disabled whenever origins is "*".
        """
        return self.CORS_ORIGINS != ["*"]

    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "env_parse_none_str": "None",
        "env_parse_enums": False
    }

settings = Settings()