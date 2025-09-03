"""
FastAPI server for badge generation without Gradio
Direct integration with the existing badge generation functions
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import base64
from io import BytesIO
import logging

# Import your existing functions
from composer import render_from_spec

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Badge Generator API",
    description="Direct API for generating custom badges",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BadgeConfig(BaseModel):
    canvas: dict
    layers: list

@app.get("/")
async def root():
    return {
        "message": "Badge Generator API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "badge-generator-api"
    }

@app.post("/api/badge/generate")
async def generate_badge(config: BadgeConfig):
    """
    Generate badge using the render_from_spec function directly
    """
    try:
        logger.info("Received badge generation request")
        
        # Convert config to dict format expected by render_from_spec
        config_dict = config.dict()
        logger.info(f"Config: {config_dict}")
        
        # Call render_from_spec directly with the config dict
        result = render_from_spec(config_dict)
        
        # result should be a PIL Image
        if result is None:
            raise HTTPException(status_code=500, detail="Failed to generate badge")
        
        # Convert PIL Image to base64
        buffer = BytesIO()
        
        # Save as PNG for better quality
        result.save(buffer, format='PNG')
        buffer.seek(0)
        
        # Encode to base64
        img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        logger.info("Badge generated successfully")
        
        return {
            "success": True,
            "message": "Badge generated successfully",
            "data": {
                "base64": f"data:image/png;base64,{img_base64}",
                "filename": "badge.png",
                "mimeType": "image/png"
            },
            "config": config.dict()
        }
        
    except Exception as e:
        logger.error(f"Error generating badge: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate badge: {str(e)}")


    """
    Legacy endpoint that matches the Gradio interface
    Accepts raw JSON string
    """
    try:
        logger.info("Received legacy generate_from_json request")
        
        # Call render_from_spec with JSON string (it can handle both dict and string)
        result = render_from_spec(json_text)
        
        if result is None:
            raise HTTPException(status_code=500, detail="Failed to generate badge")
        
        # Convert PIL Image to base64
        buffer = BytesIO()
        result.save(buffer, format='PNG')
        buffer.seek(0)
        img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        # Return in format similar to Gradio
        return [{
            "path": f"/tmp/badge_{hash(json_text)}.png",
            "url": f"data:image/png;base64,{img_base64}",
            "orig_name": "badge.png",
            "mime_type": "image/png",
            "is_stream": False,
            "meta": {"_type": "gradio.FileData"}
        }, ""]
        
    except Exception as e:
        logger.error(f"Error in legacy endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate badge: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001, log_level="info")