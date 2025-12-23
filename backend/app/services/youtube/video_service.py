"""
YouTube video service - video listing, details, and metadata operations.
"""

from typing import Optional, List, Dict, Any
import logging

from .base import YouTubeBaseService, youtube_api_retry

logger = logging.getLogger(__name__)


def _safe_int(value: Any, default: Optional[int] = None) -> Optional[int]:
    """Safely convert to int, returning None if value is missing or invalid."""
    if value is None:
        return default
    try:
        return int(value)
    except (ValueError, TypeError):
        return default


class YouTubeVideoService(YouTubeBaseService):
    """Service for YouTube video operations."""

    @youtube_api_retry
    def get_channel_stats(self) -> Dict[str, Any]:
        """Get channel statistics including subscribers, views, and video count."""
        response = self.youtube.channels().list(
            part="snippet,statistics,brandingSettings",
            mine=True
        ).execute()

        if not response.get("items"):
            raise ValueError("No channel found for authenticated user")

        channel = response["items"][0]
        snippet = channel["snippet"]
        stats = channel["statistics"]

        return {
            "channel_id": channel["id"],
            "title": snippet["title"],
            "description": snippet.get("description", ""),
            "subscriber_count": int(stats.get("subscriberCount", 0)),
            "view_count": int(stats.get("viewCount", 0)),
            "video_count": int(stats.get("videoCount", 0)),
            "thumbnail_url": snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
        }

    @youtube_api_retry
    def get_recent_videos(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent videos from the channel with their statistics."""
        # First, get the uploads playlist ID
        channel_response = self.youtube.channels().list(
            part="contentDetails",
            mine=True
        ).execute()

        if not channel_response.get("items"):
            return []

        uploads_playlist_id = channel_response["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]

        # Get videos from uploads playlist
        playlist_response = self.youtube.playlistItems().list(
            part="snippet,contentDetails",
            playlistId=uploads_playlist_id,
            maxResults=limit
        ).execute()

        video_ids = [item["contentDetails"]["videoId"] for item in playlist_response.get("items", [])]

        if not video_ids:
            return []

        # Get video statistics
        videos_response = self.youtube.videos().list(
            part="snippet,statistics",
            id=",".join(video_ids)
        ).execute()

        videos = []
        for video in videos_response.get("items", []):
            snippet = video["snippet"]
            stats = video.get("statistics", {})
            has_stats = bool(stats)

            videos.append({
                "video_id": video["id"],
                "title": snippet["title"],
                "published_at": snippet["publishedAt"],
                "view_count": _safe_int(stats.get("viewCount"), 0 if has_stats else None),
                "like_count": _safe_int(stats.get("likeCount"), 0 if has_stats else None),
                "comment_count": _safe_int(stats.get("commentCount"), 0 if has_stats else None),
                "thumbnail_url": snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
                "stats_available": has_stats,
            })

        return videos

    @youtube_api_retry
    def get_video_details(self, video_id: str) -> Dict[str, Any]:
        """Get detailed information about a specific video."""
        response = self.youtube.videos().list(
            part="snippet,statistics,contentDetails",
            id=video_id
        ).execute()

        if not response.get("items"):
            raise ValueError(f"Video not found: {video_id}")

        video = response["items"][0]
        snippet = video["snippet"]
        stats = video.get("statistics", {})
        content = video.get("contentDetails", {})
        has_stats = bool(stats)

        return {
            "video_id": video["id"],
            "title": snippet["title"],
            "description": snippet.get("description", ""),
            "published_at": snippet["publishedAt"],
            "channel_title": snippet["channelTitle"],
            "tags": snippet.get("tags", []),
            "category_id": snippet.get("categoryId", ""),
            "duration": content.get("duration", ""),
            "view_count": _safe_int(stats.get("viewCount"), 0 if has_stats else None),
            "like_count": _safe_int(stats.get("likeCount"), 0 if has_stats else None),
            "comment_count": _safe_int(stats.get("commentCount"), 0 if has_stats else None),
            "thumbnail_url": snippet.get("thumbnails", {}).get("maxres",
                           snippet.get("thumbnails", {}).get("high", {})).get("url", ""),
            "stats_available": has_stats,
        }

    @youtube_api_retry
    def search_videos(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search for videos on the channel."""
        response = self.youtube.search().list(
            part="snippet",
            channelId=self.channel_id,
            q=query,
            type="video",
            maxResults=limit
        ).execute()

        results = []
        for item in response.get("items", []):
            snippet = item["snippet"]
            results.append({
                "video_id": item["id"]["videoId"],
                "title": snippet["title"],
                "description": snippet.get("description", ""),
                "published_at": snippet["publishedAt"],
                "thumbnail_url": snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
            })

        return results

    @youtube_api_retry
    def get_video_for_editing(self, video_id: str) -> Dict[str, Any]:
        """Get video data in a format suitable for editing."""
        response = self.youtube.videos().list(
            part="snippet,status,statistics",
            id=video_id
        ).execute()

        if not response.get("items"):
            raise ValueError(f"Video not found: {video_id}")

        video = response["items"][0]
        snippet = video["snippet"]
        stats = video.get("statistics", {})
        has_stats = bool(stats)

        return {
            "video_id": video_id,
            "title": snippet.get("title", ""),
            "description": snippet.get("description", ""),
            "tags": snippet.get("tags", []),
            "category_id": snippet.get("categoryId", "22"),
            "thumbnail_url": snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
            "view_count": _safe_int(stats.get("viewCount"), 0 if has_stats else None),
            "like_count": _safe_int(stats.get("likeCount"), 0 if has_stats else None),
            "published_at": snippet.get("publishedAt", ""),
            "stats_available": has_stats,
        }

    @youtube_api_retry
    def update_video_metadata(
        self,
        video_id: str,
        title: Optional[str] = None,
        description: Optional[str] = None,
        tags: Optional[List[str]] = None,
        category_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Update video metadata (title, description, tags).

        Only updates the fields that are provided (not None).
        Returns the updated video data.
        """
        # First, get the current video data to preserve fields we're not updating
        current_response = self.youtube.videos().list(
            part="snippet,status",
            id=video_id
        ).execute()

        if not current_response.get("items"):
            raise ValueError(f"Video not found: {video_id}")

        current_video = current_response["items"][0]
        current_snippet = current_video["snippet"]

        # Build the update request body
        update_body = {
            "id": video_id,
            "snippet": {
                "title": title if title is not None else current_snippet["title"],
                "description": description if description is not None else current_snippet.get("description", ""),
                "tags": tags if tags is not None else current_snippet.get("tags", []),
                "categoryId": category_id if category_id is not None else current_snippet.get("categoryId", "22"),
            }
        }

        # Execute the update
        response = self.youtube.videos().update(
            part="snippet",
            body=update_body
        ).execute()

        updated_snippet = response["snippet"]

        return {
            "success": True,
            "video_id": video_id,
            "updated": {
                "title": updated_snippet["title"],
                "description": updated_snippet.get("description", "")[:200] + "..." if len(updated_snippet.get("description", "")) > 200 else updated_snippet.get("description", ""),
                "tags_count": len(updated_snippet.get("tags", [])),
                "category_id": updated_snippet.get("categoryId", ""),
            },
            "message": "Video metadata updated successfully!"
        }
