"""
YouTube comment service - comment fetching and analysis.
"""

from typing import List, Dict, Any
import logging

from googleapiclient.errors import HttpError

from .base import YouTubeBaseService, youtube_api_retry

logger = logging.getLogger(__name__)


class YouTubeCommentService(YouTubeBaseService):
    """Service for YouTube comment operations."""

    @youtube_api_retry
    def get_video_comments(self, video_id: str, max_results: int = 100) -> Dict[str, Any]:
        """
        Get comments for a specific video.

        Args:
            video_id: The YouTube video ID
            max_results: Maximum number of comments to fetch (default 100, max 100 per page)

        Returns:
            Dictionary with video info and list of comments with metadata
        """
        try:
            # First get video info
            video_response = self.youtube.videos().list(
                part="snippet,statistics",
                id=video_id
            ).execute()

            if not video_response.get("items"):
                raise ValueError(f"Video not found: {video_id}")

            video = video_response["items"][0]
            video_title = video["snippet"]["title"]
            comment_count = int(video.get("statistics", {}).get("commentCount", 0))

            # Fetch comment threads
            response = self.youtube.commentThreads().list(
                part="snippet,replies",
                videoId=video_id,
                maxResults=min(max_results, 100),
                order="relevance",  # Get most relevant comments first
                textFormat="plainText"
            ).execute()

            comments = []
            for item in response.get("items", []):
                snippet = item["snippet"]["topLevelComment"]["snippet"]

                # Get channel info for the commenter
                author_channel_url = snippet.get("authorChannelUrl", "")
                author_channel_id = snippet.get("authorChannelId", {}).get("value", "")

                comment_data = {
                    "comment_id": item["id"],
                    "text": snippet["textDisplay"],
                    "author": snippet["authorDisplayName"],
                    "author_channel_id": author_channel_id,
                    "author_channel_url": author_channel_url,
                    "author_profile_image": snippet.get("authorProfileImageUrl", ""),
                    "like_count": snippet.get("likeCount", 0),
                    "published_at": snippet["publishedAt"],
                    "updated_at": snippet.get("updatedAt", snippet["publishedAt"]),
                    "reply_count": item["snippet"].get("totalReplyCount", 0),
                }

                # Include replies if present
                if item.get("replies"):
                    comment_data["replies"] = [
                        {
                            "comment_id": reply["id"],
                            "text": reply["snippet"]["textDisplay"],
                            "author": reply["snippet"]["authorDisplayName"],
                            "like_count": reply["snippet"].get("likeCount", 0),
                            "published_at": reply["snippet"]["publishedAt"],
                        }
                        for reply in item["replies"].get("comments", [])[:5]  # Limit replies
                    ]

                comments.append(comment_data)

            return {
                "video_id": video_id,
                "video_title": video_title,
                "total_comment_count": comment_count,
                "fetched_count": len(comments),
                "comments": comments,
            }

        except HttpError as e:
            if e.resp.status == 403:
                return {
                    "video_id": video_id,
                    "error": "comments_disabled",
                    "message": "Comments are disabled for this video"
                }
            raise
        except Exception as e:
            logger.error(f"Error fetching comments for {video_id}: {e}")
            return {"video_id": video_id, "error": str(e)}

    @youtube_api_retry
    def get_channel_comments(self, limit: int = 100, videos_to_check: int = 10) -> Dict[str, Any]:
        """
        Get recent comments across the channel's recent videos.

        Args:
            limit: Maximum total comments to return
            videos_to_check: Number of recent videos to check for comments

        Returns:
            Dictionary with comments from multiple videos
        """
        try:
            # Get recent videos
            channel_response = self.youtube.channels().list(
                part="contentDetails",
                mine=True
            ).execute()

            if not channel_response.get("items"):
                return {"error": "No channel found"}

            uploads_playlist_id = channel_response["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]

            playlist_response = self.youtube.playlistItems().list(
                part="snippet,contentDetails",
                playlistId=uploads_playlist_id,
                maxResults=videos_to_check
            ).execute()

            recent_videos = [
                {
                    "video_id": item["contentDetails"]["videoId"],
                    "title": item["snippet"]["title"],
                }
                for item in playlist_response.get("items", [])
            ]

            all_comments = []
            video_comment_counts = {}

            comments_per_video = max(10, limit // videos_to_check)

            for video in recent_videos:
                video_id = video["video_id"]
                result = self.get_video_comments(video_id, max_results=comments_per_video)

                if "error" not in result:
                    video_comment_counts[video_id] = {
                        "title": video["title"],
                        "count": len(result.get("comments", []))
                    }

                    for comment in result.get("comments", []):
                        comment["video_id"] = video_id
                        comment["video_title"] = video["title"]
                        all_comments.append(comment)

                if len(all_comments) >= limit:
                    break

            # Sort by like count (most engaging comments first)
            all_comments.sort(key=lambda x: x.get("like_count", 0), reverse=True)

            return {
                "total_fetched": len(all_comments),
                "videos_checked": len(video_comment_counts),
                "video_breakdown": video_comment_counts,
                "comments": all_comments[:limit],
            }

        except Exception as e:
            logger.error(f"Error fetching channel comments: {e}")
            return {"error": str(e)}

    @youtube_api_retry
    def get_commenter_channel_info(self, channel_id: str) -> Dict[str, Any]:
        """
        Get info about a commenter's channel to identify notable commenters.

        Args:
            channel_id: The YouTube channel ID of the commenter

        Returns:
            Channel info including subscriber count if available
        """
        try:
            response = self.youtube.channels().list(
                part="snippet,statistics",
                id=channel_id
            ).execute()

            if not response.get("items"):
                return {"channel_id": channel_id, "found": False}

            channel = response["items"][0]
            snippet = channel["snippet"]
            stats = channel.get("statistics", {})

            # Check if subscriber count is hidden
            subscriber_count = int(stats.get("subscriberCount", 0)) if not stats.get("hiddenSubscriberCount", False) else None

            return {
                "channel_id": channel_id,
                "found": True,
                "title": snippet["title"],
                "description": snippet.get("description", "")[:200],
                "thumbnail_url": snippet.get("thumbnails", {}).get("default", {}).get("url", ""),
                "subscriber_count": subscriber_count,
                "video_count": int(stats.get("videoCount", 0)),
                "view_count": int(stats.get("viewCount", 0)),
                "is_creator": subscriber_count and subscriber_count > 1000,  # Consider 1K+ subs as a creator
            }

        except Exception as e:
            logger.error(f"Error fetching channel info for {channel_id}: {e}")
            return {"channel_id": channel_id, "found": False, "error": str(e)}
