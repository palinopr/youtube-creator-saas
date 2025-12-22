"""
Causal analytics endpoints.

Deep causal analysis to understand WHY videos succeed.
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
from ...tools.causal_analytics import CausalAnalytics
from ...tools.advanced_causal import AdvancedCausalAnalytics
from ...tools.youtube_channel import resolve_mine_channel_id
from ...workers.manager import get_worker_manager

settings = get_settings()
router = APIRouter(tags=["analysis-causal"])
limiter = Limiter(key_func=get_remote_address)


# =============================================================================
# Causal Analysis
# =============================================================================

@router.get("/causal")
@limiter.limit("3/minute")
async def run_causal_analysis(
    request: Request,
    max_videos: int = 50000,
    user: User = Depends(check_usage("ai_queries_per_month"))
):
    """
    Deep causal analysis to understand WHY videos succeed.

    Analyzes:
    - Celebrity/person impact on views
    - Title SEO vs content effect
    - Description pattern impact
    - Success factor breakdown
    - Content type deep dive

    Returns comprehensive insights on what actually drives video success.
    """
    max_videos = min(max_videos, 500)
    try:
        youtube = get_authenticated_service("youtube", "v3")
        causal = CausalAnalytics(youtube)

        analysis = causal.run_full_causal_analysis(max_videos=max_videos, real_time=True)

        if "error" in analysis:
            raise HTTPException(status_code=400, detail=analysis["error"])

        return analysis

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/causal/cached")
async def get_cached_causal_analysis(user: User = Depends(get_current_user)):
    """Return the latest cached causal analysis for the user, if available."""
    try:
        youtube = get_authenticated_service("youtube", "v3")
        channel_id = resolve_mine_channel_id(youtube)
        cache = AnalyticsCacheRepository.get_cache(channel_id, "causal_analysis")
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


@router.post("/causal/start")
@limiter.limit("3/minute")
async def start_causal_analysis(
    request: Request,
    max_videos: int = 500,
    user: User = Depends(check_usage("ai_queries_per_month"))
):
    """
    Start an async causal analysis job.

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

    token_key_for_creds = DEFAULT_TOKEN_KEY if settings.single_user_mode else user.id
    credentials_data = load_credentials(token_key=token_key_for_creds)
    if not credentials_data:
        raise HTTPException(status_code=401, detail="Not authenticated. Please login first.")
    credentials_data = {**credentials_data, "client_secret": settings.google_client_secret}

    worker_manager = get_worker_manager()
    job_data = worker_manager.submit_job(
        job_type=JobType.CAUSAL_ANALYSIS,
        channel_id=channel_id,
        input_data={"credentials": credentials_data},
        max_videos=max_videos,
    )

    return {
        "success": True,
        "job_id": job_data["job_id"],
        "message": "Causal analysis started. Poll /api/analysis/causal/status/{job_id} for updates.",
    }


@router.get("/causal/status/{job_id}")
async def get_causal_analysis_status(job_id: str, user: User = Depends(get_current_user)):
    """Get polling status for a causal analysis job."""
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


@router.delete("/causal/job/{job_id}")
async def cancel_causal_analysis(job_id: str, user: User = Depends(get_current_user)):
    """Delete a causal analysis job record."""
    deleted = JobRepository.delete_job(job_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Analysis job not found")

    return {"success": True, "message": "Job record removed"}


# =============================================================================
# Individual Causal Analysis Endpoints
# =============================================================================

@router.get("/celebrity-impact")
async def analyze_celebrity_impact(max_videos: int = 5000, user: User = Depends(get_current_user)):
    """
    Analyze which celebrities/people drive the most views.

    Returns:
    - Celebrity rankings by avg views
    - Videos with vs without celebrities
    - Celebrity lift percentage
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        causal = CausalAnalytics(youtube)

        videos = causal.get_videos_with_full_data(max_videos=max_videos, real_time=True)
        celebrity_analysis = causal.analyze_celebrity_impact(videos)

        return {
            "total_videos": len(videos),
            "celebrity_impact": celebrity_analysis,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/success-factors")
async def analyze_success_factors(max_videos: int = 5000, user: User = Depends(get_current_user)):
    """
    Break down what factors contribute to video success.

    Compares top 10% vs bottom 10% of videos to find patterns.
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        causal = CausalAnalytics(youtube)

        videos = causal.get_videos_with_full_data(max_videos=max_videos, real_time=True)
        success_analysis = causal.analyze_success_factors(videos)

        return {
            "total_videos": len(videos),
            "success_factors": success_analysis,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/description-impact")
async def analyze_description_impact(max_videos: int = 5000, user: User = Depends(get_current_user)):
    """
    Deep dive into description patterns and their impact.

    Returns:
    - Timestamps impact
    - Social links impact
    - Call to action impact
    - Description length impact
    - Hashtags impact
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        causal = CausalAnalytics(youtube)

        videos = causal.get_videos_with_full_data(max_videos=max_videos, real_time=True)
        description_analysis = causal.analyze_description_impact(videos)

        return {
            "total_videos": len(videos),
            "description_impact": description_analysis,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/title-vs-content")
async def analyze_title_vs_content(max_videos: int = 5000, user: User = Depends(get_current_user)):
    """
    Separate title SEO effect from content/person effect.

    Helps understand: Is success from the title or who's in the video?
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        causal = CausalAnalytics(youtube)

        videos = causal.get_videos_with_full_data(max_videos=max_videos, real_time=True)
        analysis = causal.analyze_title_vs_content(videos)

        return {
            "total_videos": len(videos),
            "title_vs_content": analysis,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# Advanced Causal Analysis
# =============================================================================

@router.get("/advanced")
@limiter.limit("3/minute")
async def run_advanced_analysis(
    request: Request,
    max_videos: int = 5000,
    user: User = Depends(check_usage("ai_queries_per_month"))
):
    """
    Run advanced causal analysis with deeper insights:
    - Factor combinations (celebrity + emoji + long title)
    - Celebrity trends over time (who's rising/falling)
    - Multi-celebrity effect (do 2+ celebrities multiply views?)
    - Engagement quality analysis
    - Controversy + celebrity interaction
    - Content type + celebrity matrix
    - Celebrity title pattern analysis
    """
    max_videos = min(max_videos, 500)
    try:
        youtube = get_authenticated_service("youtube", "v3")
        advanced = AdvancedCausalAnalytics(youtube)

        return advanced.run_advanced_analysis(max_videos=max_videos)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/combo-effects")
async def analyze_combo_effects(max_videos: int = 5000, user: User = Depends(get_current_user)):
    """
    Analyze what happens when you combine multiple success factors.
    E.g., celebrity + emoji + long title = ?
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        advanced = AdvancedCausalAnalytics(youtube)

        videos = advanced.get_videos_with_full_data(max_videos=max_videos, real_time=True)
        return advanced.analyze_factor_combinations(videos)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/celebrity-trends")
async def analyze_celebrity_trends(max_videos: int = 5000, user: User = Depends(get_current_user)):
    """
    Analyze which celebrities are rising or falling in performance.
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        advanced = AdvancedCausalAnalytics(youtube)

        videos = advanced.get_videos_with_full_data(max_videos=max_videos, real_time=True)
        return advanced.analyze_celebrity_trends(videos)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/multi-celebrity")
async def analyze_multi_celebrity(max_videos: int = 5000, user: User = Depends(get_current_user)):
    """
    Analyze if mentioning multiple celebrities multiplies views.
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        advanced = AdvancedCausalAnalytics(youtube)

        videos = advanced.get_videos_with_full_data(max_videos=max_videos, real_time=True)
        return advanced.analyze_multi_celebrity_effect(videos)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/engagement-quality")
async def analyze_engagement_quality(max_videos: int = 5000, user: User = Depends(get_current_user)):
    """
    Analyze engagement quality (likes/comments ratio), not just views.
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        advanced = AdvancedCausalAnalytics(youtube)

        videos = advanced.get_videos_with_full_data(max_videos=max_videos, real_time=True)
        return advanced.analyze_engagement_quality(videos)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/controversy-celebrity")
async def analyze_controversy_celebrity(max_videos: int = 5000, user: User = Depends(get_current_user)):
    """
    Analyze if controversial celebrity videos perform differently.
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        advanced = AdvancedCausalAnalytics(youtube)

        videos = advanced.get_videos_with_full_data(max_videos=max_videos, real_time=True)
        return advanced.analyze_controversy_celebrity(videos)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/celebrity-title-patterns")
async def analyze_celebrity_title_patterns(max_videos: int = 5000, user: User = Depends(get_current_user)):
    """
    Analyze which title patterns work best with celebrity videos.
    E.g., "Entrevista a X" vs "X revela" vs "X vs Y"
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        advanced = AdvancedCausalAnalytics(youtube)

        videos = advanced.get_videos_with_full_data(max_videos=max_videos, real_time=True)
        return advanced.analyze_celebrity_title_patterns(videos)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
