#!/usr/bin/env python3
"""
Startup script for the FastAPI badge generation server
"""

import uvicorn
import sys
import os

# Add the src directory to the Python path
src_path = os.path.join(os.path.dirname(__file__), 'src')
sys.path.insert(0, src_path)

# Change working directory to src
os.chdir(src_path)

if __name__ == "__main__":
    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=3001,
        reload=True,
        log_level="info"
    )