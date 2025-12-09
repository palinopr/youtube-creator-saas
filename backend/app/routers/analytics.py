from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta

from ..auth import get_authenticated_service
from ..tools.youtube_tools import YouTubeTools
from ..agents.analytics_agent import AnalyticsAgent

router = APIRouter(prefix="/api", tags=["analytics"])


class AgentQuery(BaseModel):
    """Request model for agent queries."""
    question: str


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
async def list_accessible_channels():
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
async def get_channel_stats():
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
async def get_recent_videos(limit: int = 10):
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
async def get_video_details(video_id: str):
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
async def get_analytics_overview(days: int = 30):
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
async def query_agent(query: AgentQuery):
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
async def get_quick_insights():
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

