"""
YouTube services package.

Provides modular services for YouTube API operations.

Usage:
    from app.services.youtube import YouTubeTools  # Backward-compatible unified class
    # OR
    from app.services.youtube import (
        YouTubeVideoService,
        YouTubeAnalyticsService,
        YouTubeSEOService,
        YouTubeCommentService,
    )

The unified YouTubeTools class provides all methods from the individual services
for backward compatibility with existing code.
"""

from typing import Optional, List, Dict, Any

from googleapiclient.discovery import Resource

from .base import (
    YouTubeBaseService,
    youtube_api_retry,
    is_retryable_error,
)
from .video_service import YouTubeVideoService
from .analytics_service import YouTubeAnalyticsService
from .seo_service import YouTubeSEOService
from .comment_service import YouTubeCommentService


class YouTubeTools:
    """
    Unified YouTube API wrapper for backward compatibility.

    This class combines all YouTube services into a single interface,
    maintaining the same API as the original monolithic YouTubeTools class.

    For new code, consider using the individual services directly:
    - YouTubeVideoService: Video listing, details, metadata
    - YouTubeAnalyticsService: Demographics, traffic, audience metrics
    - YouTubeSEOService: SEO analysis, competitor research
    - YouTubeCommentService: Comment fetching and analysis
    """

    def __init__(
        self,
        youtube_service: Resource,
        analytics_service: Optional[Resource] = None
    ):
        """
        Initialize all YouTube services.

        Args:
            youtube_service: Authenticated YouTube Data API v3 Resource
            analytics_service: Optional YouTube Analytics API Resource
        """
        self.youtube = youtube_service
        self.analytics = analytics_service

        # Initialize individual services
        self._video_service = YouTubeVideoService(youtube_service, analytics_service)
        self._analytics_service = YouTubeAnalyticsService(youtube_service, analytics_service)
        self._seo_service = YouTubeSEOService(youtube_service, analytics_service)
        self._comment_service = YouTubeCommentService(youtube_service, analytics_service)

        # Cache channel ID
        self._channel_id: Optional[str] = None

    @property
    def channel_id(self) -> str:
        """Get the authenticated user's channel ID."""
        if not self._channel_id:
            self._channel_id = self._video_service.channel_id
        return self._channel_id

    # ==========================================================================
    # Video Service Methods
    # ==========================================================================

    def get_channel_stats(self) -> Dict[str, Any]:
        """Get channel statistics."""
        return self._video_service.get_channel_stats()

    def get_recent_videos(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent videos from the channel."""
        return self._video_service.get_recent_videos(limit)

    def get_video_details(self, video_id: str) -> Dict[str, Any]:
        """Get detailed information about a video."""
        return self._video_service.get_video_details(video_id)

    def search_videos(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search for videos on the channel."""
        return self._video_service.search_videos(query, limit)

    def get_video_for_editing(self, video_id: str) -> Dict[str, Any]:
        """Get video data for editing."""
        return self._video_service.get_video_for_editing(video_id)

    def update_video_metadata(
        self,
        video_id: str,
        title: Optional[str] = None,
        description: Optional[str] = None,
        tags: Optional[List[str]] = None,
        category_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Update video metadata."""
        return self._video_service.update_video_metadata(
            video_id, title, description, tags, category_id
        )

    # ==========================================================================
    # Analytics Service Methods
    # ==========================================================================

    def get_analytics_overview(self, days: int = 30) -> Dict[str, Any]:
        """Get analytics overview for the past N days."""
        return self._analytics_service.get_analytics_overview(days)

    def get_demographics(self, days: int = 30) -> Dict[str, Any]:
        """Get audience demographics."""
        return self._analytics_service.get_demographics(days)

    def get_traffic_sources(self, days: int = 30) -> Dict[str, Any]:
        """Get traffic source breakdown."""
        return self._analytics_service.get_traffic_sources(days)

    def get_geography(self, days: int = 30, limit: int = 20) -> Dict[str, Any]:
        """Get geographic distribution of views."""
        return self._analytics_service.get_geography(days, limit)

    def get_device_types(self, days: int = 30) -> Dict[str, Any]:
        """Get device type breakdown."""
        return self._analytics_service.get_device_types(days)

    def get_revenue_data(self, days: int = 30) -> Dict[str, Any]:
        """Get revenue and monetization data."""
        return self._analytics_service.get_revenue_data(days)

    def get_subscriber_sources(self, days: int = 30) -> Dict[str, Any]:
        """Get subscriber gain/loss data."""
        return self._analytics_service.get_subscriber_sources(days)

    def get_playback_locations(self, days: int = 30) -> Dict[str, Any]:
        """Get playback location data."""
        return self._analytics_service.get_playback_locations(days)

    def get_top_videos(self, days: int = 30, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top performing videos."""
        return self._analytics_service.get_top_videos(days, limit)

    # ==========================================================================
    # SEO Service Methods
    # ==========================================================================

    def get_video_seo_data(self, video_id: str) -> Dict[str, Any]:
        """Get comprehensive SEO data for a video."""
        return self._seo_service.get_video_seo_data(video_id)

    def get_channel_keywords(self) -> List[str]:
        """Get channel-level keywords."""
        return self._seo_service.get_channel_keywords()

    def search_competitor_videos(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search for competitor videos."""
        return self._seo_service.search_competitor_videos(query, limit)

    def get_videos_for_seo_audit(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get videos for SEO audit."""
        return self._seo_service.get_videos_for_seo_audit(limit)

    # ==========================================================================
    # Comment Service Methods
    # ==========================================================================

    def get_video_comments(self, video_id: str, max_results: int = 100) -> Dict[str, Any]:
        """Get comments for a video."""
        return self._comment_service.get_video_comments(video_id, max_results)

    def get_channel_comments(self, limit: int = 100, videos_to_check: int = 10) -> Dict[str, Any]:
        """Get comments across recent videos."""
        return self._comment_service.get_channel_comments(limit, videos_to_check)

    def get_commenter_channel_info(self, channel_id: str) -> Dict[str, Any]:
        """Get info about a commenter's channel."""
        return self._comment_service.get_commenter_channel_info(channel_id)


# Export all public classes and functions
__all__ = [
    # Backward-compatible unified class
    "YouTubeTools",
    # Individual services
    "YouTubeVideoService",
    "YouTubeAnalyticsService",
    "YouTubeSEOService",
    "YouTubeCommentService",
    # Base class and utilities
    "YouTubeBaseService",
    "youtube_api_retry",
    "is_retryable_error",
]
