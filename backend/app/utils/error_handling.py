"""
Centralized error handling decorators for FastAPI endpoints.

Replaces repetitive try/except blocks across all routers with consistent
error handling, logging, and HTTP response formatting.

Usage:
    from app.utils import handle_errors

    @router.get("/example")
    @handle_errors
    async def example_endpoint():
        # Your code here - no try/except needed
        return {"data": "value"}
"""

from functools import wraps
from typing import Callable, TypeVar, ParamSpec
import logging

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
import httpx

logger = logging.getLogger(__name__)

P = ParamSpec("P")
T = TypeVar("T")


class ServiceUnavailableError(Exception):
    """Raised when an external service is unavailable."""
    pass


class RateLimitError(Exception):
    """Raised when rate limits are exceeded."""
    pass


class ValidationError(Exception):
    """Raised for business logic validation failures."""
    pass


def handle_errors(func: Callable[P, T]) -> Callable[P, T]:
    """
    Decorator for async FastAPI endpoints that provides consistent error handling.

    Catches and handles:
    - HTTPException: Re-raised as-is (preserves status code)
    - ValueError: 400 Bad Request
    - ValidationError: 422 Unprocessable Entity
    - IntegrityError: 409 Conflict (duplicate key, constraint violation)
    - SQLAlchemyError: 500 Internal Server Error
    - httpx.HTTPStatusError: Maps external API errors
    - ServiceUnavailableError: 503 Service Unavailable
    - RateLimitError: 429 Too Many Requests
    - Exception: 500 Internal Server Error (with logging)

    Example:
        @router.post("/users")
        @handle_errors
        async def create_user(user: UserCreate):
            # No try/except needed
            return await user_service.create(user)
    """

    @wraps(func)
    async def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
        try:
            return await func(*args, **kwargs)

        except HTTPException:
            # Re-raise FastAPI HTTP exceptions as-is
            raise

        except ValueError as e:
            # Client provided invalid input
            logger.warning(f"Validation error in {func.__name__}: {e}")
            raise HTTPException(status_code=400, detail=str(e))

        except ValidationError as e:
            # Business logic validation failure
            logger.warning(f"Business validation error in {func.__name__}: {e}")
            raise HTTPException(status_code=422, detail=str(e))

        except IntegrityError as e:
            # Database constraint violation (duplicate key, FK violation, etc.)
            logger.warning(f"Database integrity error in {func.__name__}: {e}")
            raise HTTPException(
                status_code=409,
                detail="Resource conflict: duplicate or constraint violation"
            )

        except SQLAlchemyError as e:
            # Other database errors
            logger.exception(f"Database error in {func.__name__}: {e}")
            raise HTTPException(
                status_code=500,
                detail="Database error occurred"
            )

        except httpx.HTTPStatusError as e:
            # External API returned an error status
            status = e.response.status_code
            logger.error(
                f"External API error in {func.__name__}: "
                f"{status} - {e.response.text[:200]}"
            )

            if status == 401 or status == 403:
                raise HTTPException(
                    status_code=502,
                    detail="Authentication failed with external service"
                )
            elif status == 404:
                raise HTTPException(
                    status_code=404,
                    detail="Resource not found in external service"
                )
            elif status == 429:
                raise HTTPException(
                    status_code=429,
                    detail="External service rate limit exceeded"
                )
            else:
                raise HTTPException(
                    status_code=502,
                    detail=f"External service error: {status}"
                )

        except httpx.RequestError as e:
            # Network error (timeout, connection refused, etc.)
            logger.error(f"Network error in {func.__name__}: {e}")
            raise HTTPException(
                status_code=503,
                detail="External service unavailable"
            )

        except ServiceUnavailableError as e:
            logger.warning(f"Service unavailable in {func.__name__}: {e}")
            raise HTTPException(status_code=503, detail=str(e))

        except RateLimitError as e:
            logger.warning(f"Rate limit in {func.__name__}: {e}")
            raise HTTPException(status_code=429, detail=str(e))

        except Exception as e:
            # Catch-all for unexpected errors
            logger.exception(f"Unexpected error in {func.__name__}: {e}")
            raise HTTPException(
                status_code=500,
                detail="An unexpected error occurred"
            )

    return wrapper


def handle_errors_sync(func: Callable[P, T]) -> Callable[P, T]:
    """
    Decorator for synchronous functions that provides consistent error handling.

    Same behavior as handle_errors but for non-async functions.
    """

    @wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
        try:
            return func(*args, **kwargs)

        except HTTPException:
            raise

        except ValueError as e:
            logger.warning(f"Validation error in {func.__name__}: {e}")
            raise HTTPException(status_code=400, detail=str(e))

        except ValidationError as e:
            logger.warning(f"Business validation error in {func.__name__}: {e}")
            raise HTTPException(status_code=422, detail=str(e))

        except IntegrityError as e:
            logger.warning(f"Database integrity error in {func.__name__}: {e}")
            raise HTTPException(
                status_code=409,
                detail="Resource conflict: duplicate or constraint violation"
            )

        except SQLAlchemyError as e:
            logger.exception(f"Database error in {func.__name__}: {e}")
            raise HTTPException(status_code=500, detail="Database error occurred")

        except Exception as e:
            logger.exception(f"Unexpected error in {func.__name__}: {e}")
            raise HTTPException(status_code=500, detail="An unexpected error occurred")

    return wrapper
