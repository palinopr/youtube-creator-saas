"""
YouTube SEO service - SEO analysis, keyword research, and competitor analysis.
"""

from typing import List, Dict, Any
import re
import logging

from .base import YouTubeBaseService, youtube_api_retry

logger = logging.getLogger(__name__)


class YouTubeSEOService(YouTubeBaseService):
    """Service for YouTube SEO analysis operations."""

    @youtube_api_retry
    def get_video_seo_data(self, video_id: str) -> Dict[str, Any]:
        """Get comprehensive SEO data for a video."""
        response = self.youtube.videos().list(
            part="snippet,statistics,contentDetails,topicDetails,status",
            id=video_id
        ).execute()

        if not response.get("items"):
            raise ValueError(f"Video not found: {video_id}")

        video = response["items"][0]
        snippet = video["snippet"]
        stats = video.get("statistics", {})
        content = video.get("contentDetails", {})
        topics = video.get("topicDetails", {})
        status = video.get("status", {})

        # Analyze title
        title = snippet.get("title", "")
        title_analysis = {
            "text": title,
            "length": len(title),
            "word_count": len(title.split()),
            "has_numbers": any(c.isdigit() for c in title),
            "has_brackets": "[" in title or "]" in title or "(" in title or ")" in title,
            "has_emoji": any(ord(c) > 127 for c in title),
            "is_all_caps": title.isupper(),
        }

        # Analyze description
        description = snippet.get("description", "")
        description_analysis = {
            "text": description[:500] + "..." if len(description) > 500 else description,
            "full_length": len(description),
            "word_count": len(description.split()),
            "has_links": "http" in description.lower(),
            "has_timestamps": any(c.isdigit() and ":" in description for c in description),
            "has_hashtags": "#" in description,
            "line_count": description.count("\n") + 1,
        }

        # Analyze tags
        tags = snippet.get("tags", [])
        tags_analysis = {
            "tags": tags,
            "count": len(tags),
            "total_characters": sum(len(tag) for tag in tags),
            "avg_tag_length": sum(len(tag) for tag in tags) / len(tags) if tags else 0,
        }

        return {
            "video_id": video_id,
            "title_analysis": title_analysis,
            "description_analysis": description_analysis,
            "tags_analysis": tags_analysis,
            "category_id": snippet.get("categoryId", ""),
            "default_language": snippet.get("defaultLanguage", ""),
            "default_audio_language": snippet.get("defaultAudioLanguage", ""),
            "duration": content.get("duration", ""),
            "definition": content.get("definition", ""),
            "caption": content.get("caption", "false"),
            "privacy_status": status.get("privacyStatus", ""),
            "made_for_kids": status.get("madeForKids", False),
            "topic_categories": topics.get("topicCategories", []),
            "statistics": {
                "views": int(stats.get("viewCount", 0)),
                "likes": int(stats.get("likeCount", 0)),
                "comments": int(stats.get("commentCount", 0)),
            },
            "thumbnail_url": snippet.get("thumbnails", {}).get("maxres",
                           snippet.get("thumbnails", {}).get("high", {})).get("url", ""),
        }

    @youtube_api_retry
    def get_channel_keywords(self) -> List[str]:
        """Get channel-level keywords from branding settings."""
        response = self.youtube.channels().list(
            part="brandingSettings",
            mine=True
        ).execute()

        if not response.get("items"):
            return []

        branding = response["items"][0].get("brandingSettings", {})
        channel_settings = branding.get("channel", {})
        keywords = channel_settings.get("keywords", "")

        # Parse keywords (they're space-separated, quotes for multi-word)
        if not keywords:
            return []

        # Match quoted strings or single words
        matches = re.findall(r'"([^"]+)"|(\S+)', keywords)
        # Flatten and filter out empty strings
        return [m[0] or m[1] for m in matches if m[0] or m[1]]

    @youtube_api_retry
    def search_competitor_videos(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search for competitor videos on YouTube (not limited to own channel)."""
        response = self.youtube.search().list(
            part="snippet",
            q=query,
            type="video",
            maxResults=limit,
            order="viewCount"
        ).execute()

        video_ids = [item["id"]["videoId"] for item in response.get("items", [])]

        if not video_ids:
            return []

        # Get video statistics
        videos_response = self.youtube.videos().list(
            part="snippet,statistics",
            id=",".join(video_ids)
        ).execute()

        results = []
        for video in videos_response.get("items", []):
            snippet = video["snippet"]
            stats = video.get("statistics", {})
            results.append({
                "video_id": video["id"],
                "title": snippet["title"],
                "description": snippet.get("description", "")[:200],
                "channel_title": snippet["channelTitle"],
                "published_at": snippet["publishedAt"],
                "tags": snippet.get("tags", [])[:10],  # First 10 tags
                "view_count": int(stats.get("viewCount", 0)),
                "like_count": int(stats.get("likeCount", 0)),
                "comment_count": int(stats.get("commentCount", 0)),
                "thumbnail_url": snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
            })

        return results

    @youtube_api_retry
    def get_videos_for_seo_audit(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get recent videos with SEO-relevant data for audit."""
        # Get recent videos (using base class's youtube service)
        channel_response = self.youtube.channels().list(
            part="contentDetails",
            mine=True
        ).execute()

        if not channel_response.get("items"):
            return []

        uploads_playlist_id = channel_response["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]

        playlist_response = self.youtube.playlistItems().list(
            part="snippet,contentDetails",
            playlistId=uploads_playlist_id,
            maxResults=limit
        ).execute()

        video_ids = [item["contentDetails"]["videoId"] for item in playlist_response.get("items", [])]

        if not video_ids:
            return []

        # Get full video details including tags
        videos_response = self.youtube.videos().list(
            part="snippet,statistics",
            id=",".join(video_ids)
        ).execute()

        results = []
        for video in videos_response.get("items", []):
            snippet = video["snippet"]
            stats = video.get("statistics", {})

            title = snippet.get("title", "")
            description = snippet.get("description", "")
            tags = snippet.get("tags", [])

            # Calculate SEO score (simple heuristic)
            seo_score = 0
            seo_issues = []

            # Title checks
            if 30 <= len(title) <= 60:
                seo_score += 20
            else:
                seo_issues.append("Title length not optimal (aim for 30-60 chars)")

            # Description checks
            if len(description) >= 200:
                seo_score += 20
            else:
                seo_issues.append("Description too short (aim for 200+ chars)")

            if "http" in description.lower():
                seo_score += 10
            else:
                seo_issues.append("No links in description")

            # Tags checks
            if len(tags) >= 5:
                seo_score += 20
            else:
                seo_issues.append(f"Only {len(tags)} tags (aim for 5+)")

            if len(tags) >= 10:
                seo_score += 10

            # Hashtags check
            if "#" in description:
                seo_score += 10
            else:
                seo_issues.append("No hashtags in description")

            # Engagement rate
            views = int(stats.get("viewCount", 0))
            likes = int(stats.get("likeCount", 0))
            if views > 0:
                engagement_rate = (likes / views) * 100
                if engagement_rate > 4:
                    seo_score += 10

            results.append({
                "video_id": video["id"],
                "title": title,
                "title_length": len(title),
                "description_length": len(description),
                "tags_count": len(tags),
                "tags": tags[:5],  # First 5 tags
                "seo_score": min(seo_score, 100),
                "seo_issues": seo_issues,
                "view_count": views,
                "like_count": likes,
                "comment_count": int(stats.get("commentCount", 0)),
                "thumbnail_url": snippet.get("thumbnails", {}).get("medium", {}).get("url", ""),
            })

        # Sort by SEO score (lowest first - most improvement needed)
        results.sort(key=lambda x: x["seo_score"])

        return results
