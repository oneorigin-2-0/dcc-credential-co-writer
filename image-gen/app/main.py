"""
FastAPI main application entry point
"""

import copy
import time
import json
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.settings import settings
from app.config import ENABLE_LOG_BASE64_DATA
from app.controllers.badge_image import router as badges_router
from app.controllers.health import router as health_router
from app.core.logging_config import get_logger, log_request_info

# Initialize logger
logger = get_logger("main")


def _sanitize_body_for_logging(body: dict) -> dict:
    """
    Remove base64 encoded data from request body for cleaner logs.
    Controlled by ENABLE_LOG_BASE64_DATA flag.
    Uses deep copy to avoid mutating original objects.
    """
    if ENABLE_LOG_BASE64_DATA:
        return body

    sanitized = copy.deepcopy(body)

    # Recursively remove logo fields and base64 strings
    def _remove_logo_and_base64(obj):
        if isinstance(obj, dict):
            result = {}
            for key, value in obj.items():
                if key.lower() == "logo" and isinstance(value, str) and value:
                    result[key] = "<base64_data_excluded_from_log>"
                elif isinstance(value, str) and ("base64" in key.lower() or value.startswith("data:image")):
                    result[key] = "<base64_data_excluded_from_log>"
                elif isinstance(value, (dict, list)):
                    result[key] = _remove_logo_and_base64(value)
                else:
                    result[key] = value
            return result
        elif isinstance(obj, list):
            return [_remove_logo_and_base64(item) for item in obj]
        else:
            return obj

    return _remove_logo_and_base64(sanitized)


def _sanitize_response_for_logging(data):
    """
    Remove base64 strings and logo fields from responses when logging is disabled.
    Preserves structure but replaces base64 strings with a placeholder.
    """
    if ENABLE_LOG_BASE64_DATA:
        return data

    if isinstance(data, dict):
        result = {}
        for key, value in data.items():
            # Remove logo fields and base64 strings
            if key.lower() == "logo" and isinstance(value, str) and value:
                result[key] = "<base64_data_excluded_from_log>"
            elif isinstance(value, str) and ("base64" in key.lower() or value.startswith("data:image")):
                result[key] = "<base64_data_excluded_from_log>"
            elif isinstance(value, (dict, list)):
                result[key] = _sanitize_response_for_logging(value)
            else:
                result[key] = value
        return result
    if isinstance(data, list):
        return [_sanitize_response_for_logging(item) for item in data]
    return data


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all HTTP requests and responses"""

    async def dispatch(self, request: Request, call_next):
        """
        Process request and log details

        Args:
            request: The incoming request
            call_next: The next middleware/endpoint

        Returns:
            Response object
        """
        start_time = time.time()

        # Read request body for logging (need to do this before call_next)
        # Store body and make it available again for downstream processing
        body = await request.body()
        
        # Recreate request with body for downstream processing
        async def receive():
            return {"type": "http.request", "body": body}
        
        request._receive = receive

        # Parse body for logging
        cloned_request_body = {}
        if body:
            try:
                request_json = json.loads(body.decode('utf-8'))
                cloned_request_body = _sanitize_body_for_logging(request_json)
            except (json.JSONDecodeError, UnicodeDecodeError):
                # If not JSON, return as string representation (full string)
                body_str = body.decode('utf-8', errors='ignore')
                if not ENABLE_LOG_BASE64_DATA and ("data:image" in body_str or "base64" in body_str.lower()):
                    cloned_request_body = {"_raw_body": "<base64_data_excluded_from_log>"}
                else:
                    cloned_request_body = {"_raw_body": body_str}

        # Prepare headers (exclude sensitive info)
        headers_dict = dict(request.headers)
        # Remove sensitive headers for logging
        sensitive_headers = ['authorization', 'cookie', 'x-api-key']
        sanitized_headers = {
            k: v if k.lower() not in sensitive_headers else "***REDACTED***"
            for k, v in headers_dict.items()
        }

        # Get query parameters
        query_params = dict(request.query_params)

        # Log incoming request in the requested format
        logger.info('=' * 62)
        logger.info(
            f"Network incoming logs >>>\n"
            f"      >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n"
            f"      req.method          {request.method}\n"
            f"      req.path            {request.url.path}\n"
            f"      req.headers         {json.dumps(sanitized_headers, indent=2)}\n"
            f"      req.query           {json.dumps(query_params, indent=2)}\n"
            f"      req.body            {json.dumps(cloned_request_body, indent=2)}\n"
            f"      <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<"
        )

        try:
            # Process request
            response = await call_next(request)

            # Calculate response time
            process_time = time.time() - start_time

            # Read response body for logging
            response_body = b""
            try:
                # Read response body from iterator
                async for chunk in response.body_iterator:
                    response_body += chunk
            except Exception:
                # Some responses don't have a body (like streaming responses)
                pass

            # Parse response body for logging (optionally sanitize base64)
            cloned_response_body = {}
            if response_body:
                try:
                    response_json = json.loads(response_body.decode('utf-8'))
                    cloned_response_body = _sanitize_response_for_logging(response_json)
                except (json.JSONDecodeError, UnicodeDecodeError):
                    # If not JSON, return as string representation
                    body_str = response_body.decode('utf-8', errors='ignore')
                    if not ENABLE_LOG_BASE64_DATA and ("data:image" in body_str or "base64" in body_str.lower()):
                        cloned_response_body = {"_raw_body": "<base64_data_excluded_from_log>"}
                    else:
                        cloned_response_body = {"_raw_body": body_str}

            # Prepare response headers (exclude sensitive info)
            response_headers_dict = dict(response.headers)
            sensitive_headers = ['authorization', 'cookie', 'x-api-key', 'set-cookie']
            sanitized_response_headers = {
                k: v if k.lower() not in sensitive_headers else "***REDACTED***"
                for k, v in response_headers_dict.items()
            }

            # Log response in the requested format
            logger.info('=' * 62)
            logger.info(
                f"Network outgoing logs >>>\n"
                f"      >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n"
                f"      res.status_code     {response.status_code}\n"
                f"      res.headers         {json.dumps(sanitized_response_headers, indent=2)}\n"
                f"      res.body            {json.dumps(cloned_response_body, indent=2)}\n"
                f"      process_time        {process_time:.3f}s\n"
                f"      <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<"
            )

            # Log request completion
            log_request_info(request, process_time)

            # Recreate response with body (since we consumed the iterator)
            from starlette.responses import Response as StarletteResponse
            from starlette.responses import JSONResponse
            
            # Preserve original media type or default to application/json
            media_type = response.media_type or "application/json"
            
            # If it's a JSON response, use JSONResponse to ensure proper encoding
            if media_type == "application/json" or "json" in media_type.lower():
                try:
                    # Parse JSON to ensure it's valid, then recreate as JSONResponse
                    # IMPORTANT: Use original response_body (NOT truncated cloned_response_body)
                    # This ensures the full base64 string is returned to the client
                    response_data = json.loads(response_body.decode('utf-8'))
                    return JSONResponse(
                        content=response_data,
                        status_code=response.status_code,
                        headers={**dict(response.headers), "X-Process-Time": str(process_time)}
                    )
                except (json.JSONDecodeError, UnicodeDecodeError):
                    # Fallback to raw response if JSON parsing fails
                    return StarletteResponse(
                        content=response_body,
                        status_code=response.status_code,
                        headers={**dict(response.headers), "X-Process-Time": str(process_time)},
                        media_type=media_type
                    )
            else:
                # For non-JSON responses, use StarletteResponse
                return StarletteResponse(
                    content=response_body,
                    status_code=response.status_code,
                    headers={**dict(response.headers), "X-Process-Time": str(process_time)},
                    media_type=media_type
                )

        except Exception as e:
            # Calculate response time even for errors
            process_time = time.time() - start_time

            # Log error
            logger.error(
                f"Request failed: {request.method} {request.url.path} "
                f"- Error: {str(e)} - Time: {process_time:.3f}s"
            )

            # Re-raise the exception
            raise

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    openapi_url="/badge-image/openapi.json",
    docs_url="/badge-image/docs",
    redoc_url="/badge-image/redoc"
)

# Add custom middleware
app.add_middleware(LoggingMiddleware)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors and log them"""
    error_details = exc.errors()
    logger.error(f"Validation error on {request.method} {request.url.path}: {error_details}")

    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": "Validation error",
            "errors": error_details
        }
    )

# Include routers
app.include_router(badges_router, prefix=settings.API_V1_STR)
app.include_router(health_router, prefix="/badge-image")

# Root endpoint
@app.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {
        "message": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/badge-image/docs",
        "health": "/badge-image/health"
    }

@app.on_event("startup")
async def startup_event():
    """Initialize logging on startup"""
    logger.info(f"Starting {settings.PROJECT_NAME} on port {settings.PORT}")
    logger.info(f"API documentation available at http://localhost:{settings.PORT}/badge-image/docs")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, log_level="info", reload=True)