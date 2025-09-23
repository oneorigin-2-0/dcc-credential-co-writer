"""
API Router for Version 1
"""

from fastapi import APIRouter

from app.api.v1.endpoints import badges, health

api_router = APIRouter()

# Include endpoints
api_router.include_router(health.router, tags=["health"])
api_router.include_router(badges.router, tags=["badges"])