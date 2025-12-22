"""
Deep analysis endpoints.

Includes async job-based deep analysis and individual deep analytics endpoints.
"""

from fastapi import APIRouter, HTTPException, Request, Depends
from slowapi import Limiter
from slowapi.util import get_remote_address

from ...auth import get_authenticated_service
from ...auth.youtube_auth import load_credentials, DEFAULT_TOKEN_KEY
from ...auth.dependencies import get_current_user, check_usage
from ...config import get_settings
from ...db.models import User, JobType
from ...db.repository import JobRepository, AnalyticsCacheRepository
from ...tools.deep_analytics import DeepAnalytics
from ...tools.youtube_channel import resolve_mine_channel_id
from ...workers.manager import get_worker_manager

settings = get_settings()
router = APIRouter(tags=["analysis-deep"])
limiter = Limiter(key_func=get_remote_address)


# =============================================================================
# Async Deep Analysis (Job-based)
# =============================================================================

@router.post("/deep/start")
@limiter.limit("3/minute")
async def start_deep_analysis(
    request: Request,
    max_videos: int = 500,
    user: User = Depends(check_usage("ai_queries_per_month"))
):
    """
    Start an async deep analysis job.

    Returns a job_id that can be used to poll for status.
    This endpoint returns immediately while analysis runs in background.

    Args:
        max_videos: Maximum videos to analyze (default 500, capped for performance)

    Returns:
        job_id for polling status
    """
    max_videos = min(max_videos, 5000)

    youtube = get_authenticated_service("youtube", "v3")
    channel_id = resolve_mine_channel_id(youtube)

    # Load OAuth credentials to pass into background job
    token_key_for_creds = DEFAULT_TOKEN_KEY if settings.single_user_mode else user.id
    credentials_data = load_credentials(token_key=token_key_for_creds)
    if not credentials_data:
        raise HTTPException(status_code=401, detail="Not authenticated. Please login first.")
    credentials_data = {**credentials_data, "client_secret": settings.google_client_secret}

    worker_manager = get_worker_manager()
    job_data = worker_manager.submit_job(
        job_type=JobType.DEEP_ANALYSIS,
        channel_id=channel_id,
        input_data={"credentials": credentials_data},
        max_videos=max_videos,
    )

    return {
        "success": True,
        "job_id": job_data["job_id"],
        "message": "Deep analysis started. Poll /api/analysis/deep/status/{job_id} for updates.",
    }


@router.get("/deep/cached")
async def get_cached_deep_analysis(user: User = Depends(get_current_user)):
    """Return the latest cached deep analysis for the user, if available."""
    try:
        youtube = get_authenticated_service("youtube", "v3")
        channel_id = resolve_mine_channel_id(youtube)
        cache = AnalyticsCacheRepository.get_cache(channel_id, "deep_analysis")
        if not cache:
            return {"cached": False}
        return {
            "cached": True,
            "data": cache.get("data"),
            "video_count": cache.get("video_count"),
            "last_sync_at": cache.get("last_sync_at"),
            "is_syncing": cache.get("is_syncing"),
            "sync_error": cache.get("sync_error"),
            "expires_at": cache.get("expires_at"),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/deep/status/{job_id}")
async def get_deep_analysis_status(job_id: str, user: User = Depends(get_current_user)):
    """
    Get the status of an async deep analysis job.

    Poll this endpoint every 5 seconds until status is "completed" or "failed".

    Returns:
        Current job status, progress, and result (if completed)
    """
    job = JobRepository.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Analysis job not found")

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


@router.delete("/deep/job/{job_id}")
async def cancel_deep_analysis(job_id: str, user: User = Depends(get_current_user)):
    """
    Cancel or clean up an analysis job.

    Note: Cannot cancel in-progress analysis, but removes the job record.
    """
    deleted = JobRepository.delete_job(job_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Analysis job not found")

    return {"success": True, "message": "Job record removed"}


# =============================================================================
# Synchronous Deep Analytics
# =============================================================================

@router.get("/deep")
@limiter.limit("3/minute")
async def deep_channel_analysis(
    request: Request,
    max_videos: int = 5000,
    user: User = Depends(check_usage("ai_queries_per_month"))
):
    """
    Run comprehensive deep analysis on your channel.

    Analyzes:
    - Best posting times (day, hour, month)
    - Title patterns and power words
    - Engagement patterns
    - Content type performance
    - Growth trends

    Args:
        max_videos: Maximum videos to analyze (default 1000)

    Returns:
        Complete deep analysis of your channel
    """
    max_videos = min(max_videos, 500)
    try:
        youtube = get_authenticated_service("youtube", "v3")
        deep = DeepAnalytics(youtube)

        analysis = deep.run_full_analysis(max_videos=max_videos, real_time=True)

        if "error" in analysis:
            raise HTTPException(status_code=400, detail=analysis["error"])

        return analysis

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/posting-times")
async def analyze_posting_times(max_videos: int = 5000, user: User = Depends(get_current_user)):
    """
    Analyze best posting times for your channel.

    Returns:
    - Best days of week to post
    - Best hours to post
    - Best months
    - Yearly trends
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        deep = DeepAnalytics(youtube)

        videos = deep.get_all_videos_extended(max_videos=max_videos, real_time=True)
        time_analysis = deep.analyze_posting_times(videos)

        return {
            "total_videos": len(videos),
            "posting_times": time_analysis,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/title-patterns")
async def analyze_title_patterns(max_videos: int = 5000, user: User = Depends(get_current_user)):
    """
    Analyze title patterns to find power words and phrases.

    Returns:
    - Words that correlate with high views
    - Words to avoid
    - Phrase patterns
    - Title characteristics (emoji, numbers, questions)
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        deep = DeepAnalytics(youtube)

        videos = deep.get_all_videos_extended(max_videos=max_videos, real_time=True)
        title_analysis = deep.analyze_title_patterns(videos)

        return {
            "total_videos": len(videos),
            "title_patterns": title_analysis,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/engagement")
async def analyze_engagement(max_videos: int = 5000, user: User = Depends(get_current_user)):
    """
    Analyze engagement patterns (likes, comments, ratios).

    Returns:
    - Most engaging videos
    - Engagement by duration
    - Like/comment ratios
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        deep = DeepAnalytics(youtube)

        videos = deep.get_all_videos_extended(max_videos=max_videos, real_time=True)
        engagement_analysis = deep.analyze_engagement(videos)

        return {
            "total_videos": len(videos),
            "engagement": engagement_analysis,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/content-types")
async def analyze_content_types(max_videos: int = 5000, user: User = Depends(get_current_user)):
    """
    Analyze performance by content type.

    Returns:
    - Performance by content type (interviews, shows, shorts, etc.)
    - Best performing content type
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        deep = DeepAnalytics(youtube)

        videos = deep.get_all_videos_extended(max_videos=max_videos, real_time=True)
        content_analysis = deep.analyze_content_types(videos)

        return {
            "total_videos": len(videos),
            "content_types": content_analysis,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/growth")
async def analyze_growth_trends(max_videos: int = 5000, user: User = Depends(get_current_user)):
    """
    Analyze channel growth trends over time.

    Returns:
    - Monthly performance stats
    - Growth rate
    - Breakout videos
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        deep = DeepAnalytics(youtube)

        videos = deep.get_all_videos_extended(max_videos=max_videos, real_time=True)
        growth_analysis = deep.analyze_growth_trends(videos)

        return {
            "total_videos": len(videos),
            "growth": growth_analysis,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
