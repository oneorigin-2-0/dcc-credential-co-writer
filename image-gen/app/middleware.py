"""
Middleware for the Badge Generator API
"""

import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.logging_config import log_request_info, get_logger

logger = get_logger("middleware")


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

        # Log incoming request
        logger.info(f"Incoming {request.method} request to {request.url.path}")

        try:
            # Process request
            response = await call_next(request)

            # Calculate response time
            process_time = time.time() - start_time

            # Log request completion
            log_request_info(request, process_time)

            # Add response time header
            response.headers["X-Process-Time"] = str(process_time)

            logger.info(
                f"Request completed: {request.method} {request.url.path} "
                f"- Status: {response.status_code} - Time: {process_time:.3f}s"
            )

            return response

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