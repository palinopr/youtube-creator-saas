"""Channel Analysis API - Data-driven insights from your video history."""

from fastapi import APIRouter, HTTPException, Request, Depends
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime
from slowapi import Limiter
from slowapi.util import get_remote_address

from ..auth import get_authenticated_service
from ..auth.youtube_auth import load_credentials, DEFAULT_TOKEN_KEY
from ..auth.dependencies import get_current_user, check_usage
from ..config import get_settings
from ..db.models import User
from ..db.models import JobType
from ..db.repository import JobRepository
from ..tools.channel_analyzer import ChannelAnalyzer
from ..tools.deep_analytics import DeepAnalytics
from ..tools.causal_analytics import CausalAnalytics
from ..tools.advanced_causal import AdvancedCausalAnalytics
from ..tools.content_optimizer import ContentOptimizer
from ..workers.manager import get_worker_manager

settings = get_settings()


class GenerateTitleRequest(BaseModel):
    """Request to generate optimized titles."""
    topic: str
    celebrities: List[str] = []
    transcript: Optional[str] = None  # If provided, titles will be based on transcript content


class ScoreVideoRequest(BaseModel):
    """Request to score a video idea before publishing."""
    title: str
    description: str = ""
    celebrities: List[str] = []


class ExtractMetaTagsRequest(BaseModel):
    """Request to extract meta tags from transcript."""
    transcript: str
    title: str

router = APIRouter(prefix="/api/analysis", tags=["analysis"])
limiter = Limiter(key_func=get_remote_address)


# ========== ASYNC ANALYSIS ENDPOINTS (POLLING SUPPORT) ==========

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

    # Resolve channel id
    youtube = get_authenticated_service("youtube", "v3")
    channel_resp = youtube.channels().list(part="id", mine=True).execute()
    items = channel_resp.get("items", [])
    if not items:
        raise HTTPException(status_code=400, detail="No YouTube channel found for user")
    channel_id = items[0]["id"]

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


# ========== DEEP ANALYTICS ENDPOINTS ==========

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


# ========== CAUSAL ANALYTICS ENDPOINTS ==========

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
    channel_resp = youtube.channels().list(part="id", mine=True).execute()
    items = channel_resp.get("items", [])
    if not items:
        raise HTTPException(status_code=400, detail="No YouTube channel found for user")
    channel_id = items[0]["id"]

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


# ========== CONTENT OPTIMIZER ENDPOINTS ==========

@router.get("/optimize")
async def get_optimization_blueprint(user: User = Depends(get_current_user)):
    """
    Get complete optimization blueprint based on ALL channel data.
    
    Returns actionable recommendations:
    - Optimal video formula (title, celebrities, content type)
    - Celebrity strategy (who to feature, who to avoid)
    - Title rules (structure, power words, length)
    - Posting strategy (when, how often)
    - Content ideas (ready-to-use video concepts)
    - Things to avoid
    - Quick wins (immediate actions)
    """
    try:
        # Build optimizer with hardcoded insights from our analysis
        optimizer = ContentOptimizer({})
        blueprint = optimizer.get_optimization_blueprint()
        
        return {
            "optimization_blueprint": blueprint,
            "message": "Based on analysis of 5,000+ videos - use these specific recommendations!"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimize/generate-title")
@limiter.limit("10/minute")
async def generate_optimized_title(
    request: Request,
    title_request: GenerateTitleRequest,
    user: User = Depends(check_usage("ai_queries_per_month"))
):
    """
    Generate AI-optimized title for a video topic.
    
    Uses all our data insights to create the perfect title:
    - 70-90 character length
    - Power words that work for YOUR channel
    - Celebrity name placement
    - Emoji optimization
    - Controversial angle
    
    Args:
        topic: What the video is about
        celebrities: List of celebrities to mention
    
    Returns:
        5 optimized title options ranked best to good
    """
    try:
        optimizer = ContentOptimizer({})
        result = await optimizer.generate_optimized_title(
            topic=title_request.topic,
            celebrities=title_request.celebrities,
            transcript=title_request.transcript
        )
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimize/extract-meta-tags")
@limiter.limit("10/minute")
async def extract_meta_tags(
    request: Request,
    meta_request: ExtractMetaTagsRequest,
    user: User = Depends(check_usage("ai_queries_per_month"))
):
    """
    Extract 15-20 meta tags from transcript to maximize SEO.
    
    Uses the transcript to find:
    - Tier 1: Names of people mentioned (celebrities, guests)
    - Tier 2: Topics, places, brands discussed
    - Tier 3: Category tags (podcast, entrevista, etc.)
    - Tier 4: Common misspellings for discoverability
    
    Returns:
        List of tags optimized to fill the 500-char YouTube tag limit
    """
    try:
        optimizer = ContentOptimizer({})
        result = await optimizer.extract_meta_tags(
            transcript=meta_request.transcript,
            current_title=meta_request.title
        )
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimize/score")
@limiter.limit("10/minute")
async def score_video_before_publish(
    request: Request,
    score_request: ScoreVideoRequest,
    user: User = Depends(check_usage("ai_queries_per_month"))
):
    """
    Score a video idea BEFORE you publish to predict success.
    
    Checks:
    - Title length (70-90 chars = optimal)
    - Emoji presence (+13.8% views)
    - Celebrity count (2-3 = 2.5x-3.7x more views)
    - Controversial angle (+40% views)
    - Description optimization
    - Known issues (timestamps hurt!)
    
    Args:
        title: Your proposed title
        description: Your proposed description
        celebrities: Celebrities mentioned
    
    Returns:
        Score out of 100, prediction, and specific fixes
    """
    try:
        optimizer = ContentOptimizer({})
        result = await optimizer.score_video_idea(
            title=score_request.title,
            description=score_request.description,
            celebrities=score_request.celebrities
        )
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/optimize/next-video")
async def get_next_video_recommendation(user: User = Depends(get_current_user)):
    """
    Get THE specific video you should make next.
    
    Returns:
    - Exactly what to create based on current data
    - Celebrity selection
    - Title template
    - Expected performance
    """
    try:
        optimizer = ContentOptimizer({})
        blueprint = optimizer.get_optimization_blueprint()
        
        # Get the highest priority content idea
        content_ideas = blueprint.get("content_ideas", [])
        high_priority = [idea for idea in content_ideas if "HIGH" in idea.get("priority", "")]
        
        if high_priority:
            next_video = high_priority[0]
        elif content_ideas:
            next_video = content_ideas[0]
        else:
            next_video = {
                "title": "Feature a rising celebrity with controversy angle",
                "why": "Based on data patterns",
                "predicted_views": "Variable",
                "celebrities": ["Pitbull", "Don Omar", "6ix9ine"],
                "priority": "Try rising celebrities!"
            }
        
        return {
            "next_video_recommendation": next_video,
            "why_this_video": "Based on analysis of 5,000+ videos, this has the highest predicted success",
            "celebrity_strategy": blueprint.get("celebrity_strategy", {}).get("feature_now", {}),
            "quick_checklist": [
                "✅ Title 70-90 chars",
                "✅ Add emoji 🔥 💀 😱",
                "✅ Feature 2-3 celebrities",
                "✅ Controversial angle",
                "✅ Medium description (200-500 chars)",
                "✅ Add 3+ hashtags",
                "❌ NO timestamps in description",
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/optimize/quick-wins")
async def get_quick_wins(user: User = Depends(get_current_user)):
    """
    Get immediate actions that will boost your channel.
    
    These are low-effort, high-impact changes you can make TODAY.
    """
    try:
        optimizer = ContentOptimizer({})
        blueprint = optimizer.get_optimization_blueprint()
        
        return {
            "quick_wins": blueprint.get("quick_wins", []),
            "avoid_list": blueprint.get("avoid_list", {}),
            "message": "Do these TODAY for immediate improvement!"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ========== TRANSCRIPT ANALYSIS ENDPOINTS ==========

@router.get("/transcripts/patterns")
@limiter.limit("3/minute")
async def analyze_transcript_patterns(
    request: Request,
    max_videos: int = 50,
    user: User = Depends(check_usage("ai_queries_per_month"))
):
    """
    Analyze video transcripts to find what CONTENT drives views.
    
    This goes beyond titles/metadata to understand:
    - What topics are DISCUSSED in top videos
    - Which celebrities are mentioned IN the content
    - Content depth and structure patterns
    - What conversations resonate with viewers
    
    Args:
        max_videos: Number of top videos to analyze (default 50)
    
    Returns:
        Content patterns from transcript analysis
    """
    try:
        from ..tools.transcript_analyzer import TranscriptAnalyzer
        
        youtube = get_authenticated_service("youtube", "v3")
        analyzer = TranscriptAnalyzer(youtube)
        
        result = await analyzer.analyze_top_videos_transcripts(max_videos=max_videos)
        
        return result
        
    except ImportError as e:
        raise HTTPException(
            status_code=500, 
            detail=f"youtube-transcript-api not installed. Run: pip install youtube-transcript-api. Error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/transcripts/video/{video_id}")
@limiter.limit("10/minute")
async def analyze_single_video_transcript(
    request: Request,
    video_id: str,
    user: User = Depends(check_usage("ai_queries_per_month"))
):
    """
    Deep AI analysis of a single video's transcript.
    
    Uses GPT-4 to analyze:
    - Main topics discussed
    - Celebrities mentioned and context
    - Emotional hooks
    - Controversy level
    - Engagement triggers
    - Content structure
    - Key quotes
    - Improvement suggestions
    
    Args:
        video_id: YouTube video ID to analyze
    
    Returns:
        Detailed AI analysis of the video content
    """
    try:
        from ..tools.transcript_analyzer import TranscriptAnalyzer
        
        youtube = get_authenticated_service("youtube", "v3")
        analyzer = TranscriptAnalyzer(youtube)
        
        result = await analyzer.deep_analyze_video_transcript(video_id)
        
        return result
        
    except ImportError as e:
        raise HTTPException(
            status_code=500, 
            detail=f"youtube-transcript-api not installed. Run: pip install youtube-transcript-api"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/transcripts/compare")
@limiter.limit("3/minute")
async def compare_top_vs_bottom_transcripts(
    request: Request,
    max_videos: int = 100,
    user: User = Depends(check_usage("ai_queries_per_month"))
):
    """
    Compare transcripts of TOP performing videos vs BOTTOM performing videos.
    
    Identifies:
    - What celebrities appear MORE in successful videos
    - What topics drive views when DISCUSSED (not just in title)
    - Content depth differences
    - Patterns unique to successful videos
    
    Args:
        max_videos: Total videos to analyze (top half vs bottom half)
    
    Returns:
        Comparison insights showing what content actually works
    """
    try:
        from ..tools.transcript_analyzer import TranscriptAnalyzer
        
        youtube = get_authenticated_service("youtube", "v3")
        analyzer = TranscriptAnalyzer(youtube)
        
        result = await analyzer.find_content_patterns(max_videos=max_videos)
        
        return result
        
    except ImportError as e:
        raise HTTPException(
            status_code=500, 
            detail=f"youtube-transcript-api not installed. Run: pip install youtube-transcript-api"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/transcripts/get/{video_id}")
async def get_video_transcript(video_id: str, user: User = Depends(get_current_user)):
    """
    Get the raw transcript of a video.
    
    Args:
        video_id: YouTube video ID
    
    Returns:
        The transcript text and metadata
    """
    try:
        from ..tools.transcript_analyzer import TranscriptAnalyzer
        
        youtube = get_authenticated_service("youtube", "v3")
        analyzer = TranscriptAnalyzer(youtube)
        
        transcript = await analyzer.get_transcript(video_id)
        
        # Return even partial results (like available transcripts list)
        if transcript:
            return transcript
        
        return {
            "video_id": video_id,
            "status": "not_available",
            "message": "No transcripts found for this video"
        }
        
    except ImportError as e:
        raise HTTPException(
            status_code=500, 
            detail=f"youtube-transcript-api not installed. Run: pip install youtube-transcript-api"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
