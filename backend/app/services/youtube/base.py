"""
YouTube base service with common utilities and authentication.
"""

from typing import Optional, Callable, TypeVar
from functools import wraps
import logging

from googleapiclient.discovery import Resource
from googleapiclient.errors import HttpError
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception,
    before_sleep_log,
)

logger = logging.getLogger(__name__)

# Type variable for generic return types
T = TypeVar('T')


def is_retryable_error(exception: BaseException) -> bool:
    """
    Determine if an exception should trigger a retry.

    Retries on:
    - HTTP 429 (Too Many Requests / Rate Limited)
    - HTTP 5xx (Server Errors)
    - Connection errors
    """
    if isinstance(exception, HttpError):
        status_code = exception.resp.status
        # Retry on rate limiting (429) and server errors (5xx)
        if status_code == 429:
            logger.warning(f"Rate limited by YouTube API (429). Will retry...")
            return True
        if 500 <= status_code < 600:
            logger.warning(f"YouTube API server error ({status_code}). Will retry...")
            return True
    # Also retry on connection-related errors
    if isinstance(exception, (ConnectionError, TimeoutError)):
        logger.warning(f"Connection error: {exception}. Will retry...")
        return True
    return False


def youtube_api_retry(func: Callable[..., T]) -> Callable[..., T]:
    """
    Decorator that adds retry logic to YouTube API calls.

    Uses exponential backoff with:
    - Max 5 attempts
    - Wait 1s, 2s, 4s, 8s, 16s between retries (capped at 60s)
    - Only retries on rate limits (429) and server errors (5xx)
    """
    @retry(
        retry=retry_if_exception(is_retryable_error),
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=1, min=1, max=60),
        before_sleep=before_sleep_log(logger, logging.WARNING),
        reraise=True,
    )
    @wraps(func)
    def wrapper(*args, **kwargs) -> T:
        return func(*args, **kwargs)
    return wrapper


class YouTubeBaseService:
    """
    Base class for YouTube API services.

    Provides common functionality:
    - API client management
    - Channel ID caching
    - Retry decorator
    """

    def __init__(
        self,
        youtube_service: Resource,
        analytics_service: Optional[Resource] = None
    ):
        """
        Initialize the YouTube service.

        Args:
            youtube_service: Authenticated YouTube Data API v3 Resource
            analytics_service: Optional YouTube Analytics API Resource
        """
        self.youtube = youtube_service
        self.analytics = analytics_service
        self._channel_id: Optional[str] = None

    @property
    def channel_id(self) -> str:
        """Get the authenticated user's channel ID (cached)."""
        if not self._channel_id:
            self._channel_id = self._fetch_channel_id()
        return self._channel_id

    @youtube_api_retry
    def _fetch_channel_id(self) -> str:
        """Fetch channel ID with retry logic."""
        response = self.youtube.channels().list(
            part="id",
            mine=True
        ).execute()

        if not response.get("items"):
            raise ValueError("No channel found for authenticated user")

        return response["items"][0]["id"]

    def has_analytics(self) -> bool:
        """Check if analytics service is available."""
        return self.analytics is not None
