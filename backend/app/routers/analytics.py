from fastapi import APIRouter, HTTPException, Depends, Query, Request
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timedelta
from slowapi import Limiter
from slowapi.util import get_remote_address

from ..auth import get_authenticated_service
from ..auth.dependencies import get_current_user, check_usage, get_channel_profile
from ..auth.youtube_auth import load_credentials, DEFAULT_TOKEN_KEY
from ..config import get_settings
from ..db.models import User
from ..db.models import JobType
from ..db.repository import AnalyticsCacheRepository, VideoCacheRepository, JobRepository
from ..services.youtube import YouTubeTools
from ..tools.youtube_channel import resolve_mine_channel_id
from ..agents.analytics_agent import AnalyticsAgent
from ..workers.manager import get_worker_manager

router = APIRouter(prefix="/api", tags=["analytics"])
limiter = Limiter(key_func=get_remote_address)
settings = get_settings()


def _maybe_queue_video_sync(channel_id: str, user: User) -> Optional[str]:
    """Queue a background VIDEO_SYNC job if cache is missing/stale."""
    try:
        cache = AnalyticsCacheRepository.get_cache(channel_id, "videos")
        if cache and cache.get("is_syncing"):
            return None

        if cache and not AnalyticsCacheRepository.is_cache_stale(channel_id, "videos", max_age_hours=6):
            return None

        token_key_for_creds = DEFAULT_TOKEN_KEY if settings.single_user_mode else user.id
        credentials_data = load_credentials(token_key=token_key_for_creds)
        if not credentials_data:
            return None
        credentials_data = {**credentials_data, "client_secret": settings.google_client_secret}

        worker_manager = get_worker_manager()
        job_data = worker_manager.submit_job(
            job_type=JobType.VIDEO_SYNC,
            channel_id=channel_id,
            input_data={"credentials": credentials_data},
            max_videos=5000,
        )

        # Create/mark placeholder so we don't spam jobs.
        AnalyticsCacheRepository.set_syncing(channel_id, "videos", True)
        return job_data.get("job_id")
    except Exception:
        return None


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
        channel_id = resolve_mine_channel_id(youtube)

        # Serve from cache if fresh.
        cache = AnalyticsCacheRepository.get_cache(channel_id, "videos")
        if cache and not cache.get("is_syncing"):
            cached_videos = VideoCacheRepository.get_videos(channel_id=channel_id, limit=limit)
            if cached_videos:
                return [
                    {
                        "video_id": v["video_id"],
                        "title": v["title"],
                        "published_at": v.get("published_at") or "",
                        "view_count": v.get("view_count", 0),
                        "like_count": v.get("like_count", 0),
                        "comment_count": v.get("comment_count", 0),
                        "thumbnail_url": (v.get("metadata") or {}).get("thumbnail_url", ""),
                    }
                    for v in cached_videos
                ]

        # Cache missing or stale: queue a background sync and fall back to real-time.
        _maybe_queue_video_sync(channel_id, user)

        tools = YouTubeTools(youtube)
        return tools.get_recent_videos(limit=limit)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/videos/sync/start")
@limiter.limit("2/minute")
async def start_video_sync(
    request: Request,
    max_videos: int = 5000,
    user: User = Depends(get_current_user),
):
    """Start a background sync of all videos into the ETL cache."""
    max_videos = min(max_videos, 5000)
    youtube = get_authenticated_service("youtube", "v3")
    channel_id = resolve_mine_channel_id(youtube)

    token_key_for_creds = DEFAULT_TOKEN_KEY if settings.single_user_mode else user.id
    credentials_data = load_credentials(token_key=token_key_for_creds)
    if not credentials_data:
        raise HTTPException(status_code=401, detail="Not authenticated. Please login first.")
    credentials_data = {**credentials_data, "client_secret": settings.google_client_secret}

    worker_manager = get_worker_manager()
    job_data = worker_manager.submit_job(
        job_type=JobType.VIDEO_SYNC,
        channel_id=channel_id,
        input_data={"credentials": credentials_data},
        max_videos=max_videos,
    )
    AnalyticsCacheRepository.set_syncing(channel_id, "videos", True)

    return {
        "success": True,
        "job_id": job_data["job_id"],
        "message": "Video sync started. Poll /api/videos/sync/status/{job_id} for updates.",
    }


@router.get("/videos/sync/status/{job_id}")
async def get_video_sync_status(job_id: str, user: User = Depends(get_current_user)):
    """Get polling status for a video sync job."""
    job = JobRepository.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Sync job not found")

    youtube = get_authenticated_service("youtube", "v3")
    channel_id = resolve_mine_channel_id(youtube)
    if job.get("channel_id") and job.get("channel_id") != channel_id:
        raise HTTPException(status_code=404, detail="Sync job not found")

    response = {
        "job_id": job_id,
        "status": job.get("status"),
        "progress": job.get("progress", 0),
        "message": job.get("message", ""),
    }

    if job.get("status") == "completed" and job.get("output_data"):
        response["result"] = job["output_data"]
    if job.get("status") == "failed" and job.get("error_message"):
        response["error"] = job["error_message"]

    return response


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
    user: User = Depends(check_usage("ai_queries_per_month")),
    channel_profile: dict = Depends(get_channel_profile)
):
    """Ask the AI agent a question about your channel."""
    try:
        youtube = get_authenticated_service("youtube", "v3")
        youtube_analytics = get_authenticated_service("youtubeAnalytics", "v2")

        agent = AnalyticsAgent(youtube, youtube_analytics, user_id=user.id, channel_profile=channel_profile)
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
    user: User = Depends(check_usage("ai_queries_per_month")),
    channel_profile: dict = Depends(get_channel_profile)
):
    """Get quick AI-generated insights about the channel."""
    try:
        youtube = get_authenticated_service("youtube", "v3")
        youtube_analytics = get_authenticated_service("youtubeAnalytics", "v2")

        agent = AnalyticsAgent(youtube, youtube_analytics, user_id=user.id, channel_profile=channel_profile)
        insights = agent.get_quick_insights()
        
        return insights
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
