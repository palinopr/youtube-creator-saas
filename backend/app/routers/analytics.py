from fastapi import APIRouter, HTTPException, Depends, Query, Request
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timedelta
from slowapi import Limiter
from slowapi.util import get_remote_address

from ..auth import get_authenticated_service
from ..auth.dependencies import get_current_user, check_usage
from ..db.models import User
from ..tools.youtube_tools import YouTubeTools
from ..agents.analytics_agent import AnalyticsAgent

router = APIRouter(prefix="/api", tags=["analytics"])
limiter = Limiter(key_func=get_remote_address)


class AgentQuery(BaseModel):
    """Request model for agent queries."""
    question: str = Field(..., min_length=1, max_length=1000, description="Question to ask the AI agent")


class VideoStats(BaseModel):
    """Video statistics model."""
    video_id: str
    title: str
    published_at: str
    view_count: int
    like_count: int
    comment_count: int
    thumbnail_url: str


class ChannelStats(BaseModel):
    """Channel statistics model."""
    channel_id: str
    title: str
    description: str
    subscriber_count: int
    view_count: int
    video_count: int
    thumbnail_url: str


@router.get("/channels/list")
async def list_accessible_channels(user: User = Depends(get_current_user)):
    """List all channels the authenticated user has access to (including Brand Accounts)."""
    try:
        youtube = get_authenticated_service("youtube", "v3")
        
        # Get channels where user is owner or manager
        response = youtube.channels().list(
            part="snippet,statistics,brandingSettings",
            mine=True
        ).execute()
        
        channels = []
        for item in response.get("items", []):
            channels.append({
                "channel_id": item["id"],
                "title": item["snippet"]["title"],
                "description": item["snippet"].get("description", ""),
                "thumbnail_url": item["snippet"]["thumbnails"]["default"]["url"],
                "subscriber_count": int(item["statistics"].get("subscriberCount", 0)),
                "view_count": int(item["statistics"].get("viewCount", 0)),
                "video_count": int(item["statistics"].get("videoCount", 0)),
            })
        
        return {
            "channels": channels,
            "total": len(channels),
            "note": "To see other channels you manage, sign out and sign in again, selecting the Brand Account during Google's 'Choose an account' step."
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/channel/stats", response_model=ChannelStats)
async def get_channel_stats(user: User = Depends(get_current_user)):
    """Get current channel statistics."""
    try:
        youtube = get_authenticated_service("youtube", "v3")
        tools = YouTubeTools(youtube)
        stats = tools.get_channel_stats()
        return stats
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/videos/recent", response_model=List[VideoStats])
async def get_recent_videos(
    limit: int = Query(default=10, ge=1, le=100, description="Number of videos"),
    user: User = Depends(get_current_user)
):
    """Get recent videos with their statistics."""
    try:
        youtube = get_authenticated_service("youtube", "v3")
        tools = YouTubeTools(youtube)
        videos = tools.get_recent_videos(limit=limit)
        return videos
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/videos/{video_id}")
async def get_video_details(video_id: str, user: User = Depends(get_current_user)):
    """Get detailed statistics for a specific video."""
    try:
        youtube = get_authenticated_service("youtube", "v3")
        tools = YouTubeTools(youtube)
        video = tools.get_video_details(video_id)
        return video
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/overview")
async def get_analytics_overview(
    days: int = Query(default=30, ge=1, le=365, description="Days of history"),
    user: User = Depends(get_current_user)
):
    """Get analytics overview for the past N days."""
    try:
        youtube = get_authenticated_service("youtube", "v3")
        youtube_analytics = get_authenticated_service("youtubeAnalytics", "v2")
        tools = YouTubeTools(youtube, youtube_analytics)
        overview = tools.get_analytics_overview(days=days)
        return overview
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/agent/query")
@limiter.limit("10/minute")
async def query_agent(
    request: Request,
    query: AgentQuery,
    user: User = Depends(check_usage("ai_queries_per_month"))
):
    """Ask the AI agent a question about your channel."""
    try:
        youtube = get_authenticated_service("youtube", "v3")
        youtube_analytics = get_authenticated_service("youtubeAnalytics", "v2")
        
        agent = AnalyticsAgent(youtube, youtube_analytics)
        response = await agent.query(query.question)
        
        return {
            "question": query.question,
            "answer": response,
            "timestamp": datetime.now().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights/quick")
@limiter.limit("5/minute")
async def get_quick_insights(
    request: Request,
    user: User = Depends(check_usage("ai_queries_per_month"))
):
    """Get quick AI-generated insights about the channel."""
    try:
        youtube = get_authenticated_service("youtube", "v3")
        youtube_analytics = get_authenticated_service("youtubeAnalytics", "v2")
        
        agent = AnalyticsAgent(youtube, youtube_analytics)
        insights = agent.get_quick_insights()
        
        return insights
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

