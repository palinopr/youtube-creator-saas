"""
Pattern detection endpoints.

Analyzes channel video patterns, top performers, and comparisons.
"""

from fastapi import APIRouter, HTTPException, Request, Depends
from slowapi import Limiter
from slowapi.util import get_remote_address

from ...auth import get_authenticated_service
from ...auth.dependencies import get_current_user, check_usage
from ...db.models import User
from ...tools.channel_analyzer import ChannelAnalyzer

router = APIRouter(tags=["analysis-patterns"])
limiter = Limiter(key_func=get_remote_address)


@router.get("/patterns")
@limiter.limit("5/minute")
async def analyze_channel_patterns(
    request: Request,
    max_videos: int = 5000,
    user: User = Depends(check_usage("ai_queries_per_month"))
):
    """
    Analyze your channel's video history to find performance patterns.

    This analyzes your videos to find:
    - What title lengths work best for YOUR channel
    - Optimal number of tags
    - Whether links/hashtags correlate with views
    - Top performing tags
    - Duration patterns

    Args:
        max_videos: Maximum videos to analyze (default 500, max 1000)

    Returns:
        Data-driven insights specific to your channel
    """
    max_videos = min(max_videos, 1000)  # Cap at 1000

    try:
        youtube = get_authenticated_service("youtube", "v3")
        analyzer = ChannelAnalyzer(youtube)

        # Get all videos
        videos = analyzer.get_all_videos(max_videos=max_videos)

        if len(videos) < 10:
            raise HTTPException(
                status_code=400,
                detail=f"Need at least 10 videos for analysis, found {len(videos)}"
            )

        # Analyze patterns
        analysis = analyzer.analyze_performance_patterns(videos)

        # Build custom scoring model
        custom_model = analyzer.build_custom_score_model(analysis)

        return {
            "analysis": analysis,
            "custom_scoring_model": custom_model,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/top-videos")
async def get_top_performing_videos(limit: int = 20, user: User = Depends(get_current_user)):
    """
    Get top performing videos with their SEO characteristics.

    Useful for understanding what makes your best videos successful.
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        analyzer = ChannelAnalyzer(youtube)

        # Get videos
        videos = analyzer.get_all_videos(max_videos=200)

        # Sort by views and get top N
        sorted_videos = sorted(videos, key=lambda x: x["view_count"], reverse=True)[:limit]

        return {
            "top_videos": sorted_videos,
            "total_analyzed": len(videos),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/compare/{video_id}")
async def compare_to_top_performers(video_id: str, user: User = Depends(get_current_user)):
    """
    Compare a specific video's SEO to your top performers.

    Returns how this video stacks up against your best videos.
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        analyzer = ChannelAnalyzer(youtube)

        # Get the specific video
        video_response = youtube.videos().list(
            part="snippet,statistics",
            id=video_id
        ).execute()

        if not video_response.get("items"):
            raise HTTPException(status_code=404, detail="Video not found")

        video = video_response["items"][0]
        snippet = video["snippet"]
        stats = video.get("statistics", {})

        target_video = {
            "title": snippet.get("title", ""),
            "title_length": len(snippet.get("title", "")),
            "description_length": len(snippet.get("description", "")),
            "tags_count": len(snippet.get("tags", [])),
            "has_links": "http" in snippet.get("description", "").lower(),
            "has_hashtags": "#" in snippet.get("description", ""),
            "view_count": int(stats.get("viewCount", 0)),
        }

        # Get top performers for comparison
        videos = analyzer.get_all_videos(max_videos=200)
        sorted_videos = sorted(videos, key=lambda x: x["view_count"], reverse=True)
        top_20 = sorted_videos[:len(sorted_videos) // 5]

        # Calculate averages from top performers
        top_avg = {
            "title_length": sum(v["title_length"] for v in top_20) / len(top_20),
            "description_length": sum(v["description_length"] for v in top_20) / len(top_20),
            "tags_count": sum(v["tags_count"] for v in top_20) / len(top_20),
            "has_links_percent": sum(1 for v in top_20 if v["has_links"]) / len(top_20) * 100,
            "has_hashtags_percent": sum(1 for v in top_20 if v["has_hashtags"]) / len(top_20) * 100,
        }

        # Generate comparison
        comparison = {
            "title_length": {
                "your_video": target_video["title_length"],
                "top_performers_avg": round(top_avg["title_length"]),
                "status": "✅" if abs(target_video["title_length"] - top_avg["title_length"]) < 20 else "⚠️",
            },
            "description_length": {
                "your_video": target_video["description_length"],
                "top_performers_avg": round(top_avg["description_length"]),
                "status": "✅" if target_video["description_length"] >= top_avg["description_length"] * 0.7 else "⚠️",
            },
            "tags_count": {
                "your_video": target_video["tags_count"],
                "top_performers_avg": round(top_avg["tags_count"]),
                "status": "✅" if target_video["tags_count"] >= top_avg["tags_count"] * 0.7 else "⚠️",
            },
            "has_links": {
                "your_video": target_video["has_links"],
                "top_performers_percent": round(top_avg["has_links_percent"]),
            },
            "has_hashtags": {
                "your_video": target_video["has_hashtags"],
                "top_performers_percent": round(top_avg["has_hashtags_percent"]),
            },
        }

        return {
            "video": target_video,
            "comparison_to_top_performers": comparison,
            "top_performers_count": len(top_20),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
