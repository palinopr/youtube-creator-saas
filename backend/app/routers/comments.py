"""
Comment Intelligence API Router

Provides endpoints for AI-powered comment analysis including:
- Sentiment analysis (positive/neutral/negative breakdown)
- Question extraction (comments that need responses)
- Content idea mining (topics your audience wants)
- Notable commenter detection (potential collaborations)
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
import logging

from ..auth import get_authenticated_service
from ..auth.dependencies import get_current_user, get_channel_profile
from ..db.models import User
from ..agents.comment_agent import CommentAgent

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/comments", tags=["comments"])


@router.get("/analyze")
async def analyze_channel_comments(
    limit: int = Query(default=50, ge=10, le=100, description="Number of comments to analyze"),
    include_notable: bool = Query(default=True, description="Check for notable commenters (uses more API quota)"),
    user: User = Depends(get_current_user),
    channel_profile: dict = Depends(get_channel_profile)
):
    """
    Analyze comments across the channel's recent videos.

    Uses GPT-4o to provide:
    - Sentiment breakdown (positive/neutral/negative percentages)
    - Questions that need answers (prioritized by likes)
    - Content ideas extracted from audience requests
    - Notable commenters (creators with 1K+ subscribers)

    Note: This endpoint uses AI and may take 10-20 seconds.
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        youtube_analytics = get_authenticated_service("youtubeAnalytics", "v2")

        agent = CommentAgent(youtube, youtube_analytics, user_id=user.id, channel_profile=channel_profile)
        result = await agent.analyze_comments(
            video_id=None,  # Analyze across channel
            limit=limit,
            include_notable_check=include_notable
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing channel comments: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analyze/{video_id}")
async def analyze_video_comments(
    video_id: str,
    limit: int = Query(default=50, ge=10, le=100, description="Number of comments to analyze"),
    include_notable: bool = Query(default=True, description="Check for notable commenters"),
    user: User = Depends(get_current_user),
    channel_profile: dict = Depends(get_channel_profile)
):
    """
    Analyze comments for a specific video.

    Same AI analysis as channel-wide but focused on a single video:
    - Sentiment breakdown
    - Questions to answer
    - Content ideas from this video's audience
    - Notable commenters on this video

    Note: This endpoint uses AI and may take 10-20 seconds.
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        youtube_analytics = get_authenticated_service("youtubeAnalytics", "v2")

        agent = CommentAgent(youtube, youtube_analytics, user_id=user.id, channel_profile=channel_profile)
        result = await agent.analyze_comments(
            video_id=video_id,
            limit=limit,
            include_notable_check=include_notable
        )

        return {
            "video_id": video_id,
            **result
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing comments for video {video_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sentiment-trend")
async def get_sentiment_trend(
    video_ids: str = Query(..., description="Comma-separated video IDs (max 10)"),
    comments_per_video: int = Query(default=20, ge=5, le=50, description="Comments to analyze per video"),
    user: User = Depends(get_current_user),
    channel_profile: dict = Depends(get_channel_profile)
):
    """
    Analyze sentiment trends across multiple videos.

    Useful for seeing how audience sentiment changes over time.
    Pass video IDs in chronological order for best visualization.

    Returns sentiment breakdown for each video with:
    - positive/neutral/negative percentages
    - overall mood (great/good/mixed/concerning/poor)

    Note: Analyzes multiple videos with AI, may take 30-60 seconds.
    """
    try:
        # Parse video IDs
        ids = [vid.strip() for vid in video_ids.split(",") if vid.strip()]

        if len(ids) > 10:
            raise HTTPException(
                status_code=400,
                detail="Maximum 10 videos allowed for sentiment trend analysis"
            )

        if len(ids) < 2:
            raise HTTPException(
                status_code=400,
                detail="At least 2 video IDs required for trend analysis"
            )

        youtube = get_authenticated_service("youtube", "v3")
        youtube_analytics = get_authenticated_service("youtubeAnalytics", "v2")

        agent = CommentAgent(youtube, youtube_analytics, user_id=user.id, channel_profile=channel_profile)
        results = await agent.get_sentiment_over_time(
            video_ids=ids,
            comments_per_video=comments_per_video
        )

        return {
            "videos_analyzed": len(results),
            "trend_data": results
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing sentiment trend: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/questions")
async def get_unanswered_questions(
    video_id: Optional[str] = Query(default=None, description="Optional video ID filter"),
    limit: int = Query(default=50, ge=10, le=100, description="Number of comments to scan"),
    user: User = Depends(get_current_user),
    channel_profile: dict = Depends(get_channel_profile)
):
    """
    Get questions from comments that need responses.

    Extracts questions from comments using AI analysis.
    Questions are prioritized by:
    - Number of likes (engagement indicator)
    - Importance (AI-assessed relevance)

    Great for engagement - answering popular questions shows you listen to your audience.
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        youtube_analytics = get_authenticated_service("youtubeAnalytics", "v2")

        agent = CommentAgent(youtube, youtube_analytics, user_id=user.id, channel_profile=channel_profile)
        result = await agent.analyze_comments(
            video_id=video_id,
            limit=limit,
            include_notable_check=False  # Skip notable check for faster response
        )

        # Return just the questions portion
        return {
            "questions": result.get("questions_to_answer", []),
            "total_comments_analyzed": result.get("analyzed_count", 0),
            "generated_at": result.get("generated_at"),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error extracting questions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/content-ideas")
async def get_content_ideas_from_comments(
    video_id: Optional[str] = Query(default=None, description="Optional video ID filter"),
    limit: int = Query(default=50, ge=10, le=100, description="Number of comments to scan"),
    user: User = Depends(get_current_user),
    channel_profile: dict = Depends(get_channel_profile)
):
    """
    Extract content ideas from comments.

    AI analyzes comments to find topics and requests your audience is asking for.
    Each idea includes:
    - topic: The content idea
    - evidence: What comments mentioned it
    - mentions: Approximate frequency
    - potential: high/medium/low rating

    Great for content planning - make what your audience actually wants!
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        youtube_analytics = get_authenticated_service("youtubeAnalytics", "v2")

        agent = CommentAgent(youtube, youtube_analytics, user_id=user.id, channel_profile=channel_profile)
        result = await agent.analyze_comments(
            video_id=video_id,
            limit=limit,
            include_notable_check=False  # Skip notable check for faster response
        )

        # Return just the content ideas portion
        return {
            "content_ideas": result.get("content_ideas", []),
            "total_comments_analyzed": result.get("analyzed_count", 0),
            "generated_at": result.get("generated_at"),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error extracting content ideas: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/notable-commenters")
async def get_notable_commenters(
    video_id: Optional[str] = Query(default=None, description="Optional video ID filter"),
    min_subscribers: int = Query(default=1000, ge=100, description="Minimum subscriber count"),
    user: User = Depends(get_current_user),
    channel_profile: dict = Depends(get_channel_profile)
):
    """
    Find notable creators who commented on your videos.

    Identifies commenters who have their own YouTube channels with 1K+ subscribers.
    These are potential collaboration opportunities!

    Returns:
    - channel_name and URL
    - subscriber_count and video_count
    - What they commented and on which video
    - Comment like count

    Note: Uses additional API calls to check each commenter's channel.
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        youtube_analytics = get_authenticated_service("youtubeAnalytics", "v2")

        agent = CommentAgent(youtube, youtube_analytics, user_id=user.id, channel_profile=channel_profile)
        result = await agent.analyze_comments(
            video_id=video_id,
            limit=50,  # Check top 50 comments
            include_notable_check=True
        )

        # Filter by minimum subscribers
        notable = result.get("notable_commenters", [])
        filtered = [c for c in notable if c.get("subscriber_count", 0) >= min_subscribers]

        return {
            "notable_commenters": filtered,
            "total_found": len(filtered),
            "min_subscriber_filter": min_subscribers,
            "generated_at": result.get("generated_at"),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error finding notable commenters: {e}")
        raise HTTPException(status_code=500, detail=str(e))
