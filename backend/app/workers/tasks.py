"""
Task handlers for background jobs.
These functions run in the ThreadPoolExecutor, NOT in the FastAPI event loop.
"""

import os
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional

from ..db.models import JobStatus
from ..db.repository import JobRepository, AnalyticsCacheRepository


def process_render_job(job_data: dict) -> dict:
    """
    Process a video rendering job.
    Runs ffmpeg operations in background thread.
    """
    job_id = job_data["job_id"]
    video_id = job_data.get("video_id")
    clip_id = job_data.get("clip_id")
    input_data = job_data.get("input_data", {})
    segments = input_data.get("segments", [])
    
    print(f"[RENDER WORKER] Processing job {job_id} for video {video_id}")
    
    # Update progress
    JobRepository.update_job(
        job_id=job_id,
        status=JobStatus.RENDERING,
        progress=10,
        message="Downloading video..."
    )
    
    try:
        # Import here to avoid circular imports
        from ..tools.clips_generator import ClipRenderer
        
        renderer = ClipRenderer()
        
        # Update progress
        JobRepository.update_job(
            job_id=job_id,
            progress=30,
            message="Rendering clip..."
        )
        
        # Run async function in new event loop (we're in a thread)
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            output_path = loop.run_until_complete(
                renderer.render_clip(
                    video_id=video_id,
                    clip_id=clip_id,
                    segments=segments
                )
            )
        finally:
            loop.close()
        
        if output_path and os.path.exists(output_path):
            JobRepository.update_job(
                job_id=job_id,
                output_path=output_path,
                progress=100,
                message="Render complete!"
            )
            
            return {
                "output_path": output_path,
                "video_id": video_id,
                "clip_id": clip_id,
            }
        else:
            raise Exception("Render failed - no output file generated")
    
    except Exception as e:
        print(f"[RENDER WORKER] Job {job_id} failed: {e}")
        raise


def process_analytics_job(job_data: dict) -> dict:
    """
    Process an analytics/ETL job.
    Fetches data from YouTube API and caches it in the database.
    """
    from ..db.models import JobType
    
    job_id = job_data["job_id"]
    job_type = JobType(job_data["job_type"])
    channel_id = job_data.get("channel_id")
    max_videos = job_data.get("max_videos", 5000)
    input_data = job_data.get("input_data", {})
    
    print(f"[ANALYTICS WORKER] Processing {job_type.value} job {job_id}")
    
    # Get credentials from input_data (passed from the API)
    credentials_data = input_data.get("credentials")
    
    if not credentials_data:
        raise Exception("No credentials provided for analytics job")
    
    # Update progress
    JobRepository.update_job(
        job_id=job_id,
        progress=10,
        message="Building authenticated service..."
    )
    
    try:
        # Reconstruct YouTube service from credentials
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build
        
        credentials = Credentials(
            token=credentials_data.get("token"),
            refresh_token=credentials_data.get("refresh_token"),
            token_uri=credentials_data.get("token_uri", "https://oauth2.googleapis.com/token"),
            client_id=credentials_data.get("client_id"),
            client_secret=credentials_data.get("client_secret"),
        )
        
        youtube = build("youtube", "v3", credentials=credentials)
        
        # Mark cache as syncing
        cache_key = _get_cache_key(job_type)
        AnalyticsCacheRepository.set_syncing(channel_id, cache_key, True)
        
        # Update progress
        JobRepository.update_job(
            job_id=job_id,
            progress=20,
            message=f"Fetching video data (up to {max_videos} videos)..."
        )
        
        # Run the appropriate analysis
        if job_type == JobType.DEEP_ANALYSIS:
            result = _run_deep_analysis(youtube, channel_id, max_videos, job_id)
        elif job_type == JobType.CAUSAL_ANALYSIS:
            result = _run_causal_analysis(youtube, channel_id, max_videos, job_id)
        elif job_type == JobType.VIDEO_SYNC:
            result = _run_video_sync(youtube, channel_id, max_videos, job_id)
        else:
            raise Exception(f"Unknown job type: {job_type}")
        
        # Cache the results
        AnalyticsCacheRepository.set_cache(
            channel_id=channel_id,
            cache_key=cache_key,
            data=result,
            video_count=result.get("summary", {}).get("total_videos", 0),
            ttl_hours=6  # Cache for 6 hours
        )
        
        JobRepository.update_job(
            job_id=job_id,
            progress=100,
            message="Analysis complete!",
            output_data={"video_count": result.get("summary", {}).get("total_videos", 0)}
        )
        
        return result
    
    except Exception as e:
        # Mark cache sync as failed
        if channel_id:
            cache_key = _get_cache_key(job_type)
            AnalyticsCacheRepository.set_sync_error(channel_id, cache_key, str(e))
        raise


def _get_cache_key(job_type) -> str:
    """Get cache key for a job type."""
    from ..db.models import JobType
    
    return {
        JobType.DEEP_ANALYSIS: "deep_analysis",
        JobType.CAUSAL_ANALYSIS: "causal_analysis",
        JobType.VIDEO_SYNC: "videos",
    }.get(job_type, "unknown")


def _run_deep_analysis(youtube, channel_id: str, max_videos: int, job_id: str) -> dict:
    """Run deep analytics and cache results."""
    from ..tools.deep_analytics import DeepAnalytics
    
    deep = DeepAnalytics(youtube)
    
    # Update progress during fetch
    JobRepository.update_job(
        job_id=job_id,
        progress=40,
        message="Running deep analysis..."
    )
    
    result = deep.run_full_analysis(max_videos=max_videos)
    
    JobRepository.update_job(
        job_id=job_id,
        progress=90,
        message="Caching results..."
    )
    
    return result


def _run_causal_analysis(youtube, channel_id: str, max_videos: int, job_id: str) -> dict:
    """Run causal analytics and cache results."""
    from ..tools.causal_analytics import CausalAnalytics
    
    causal = CausalAnalytics(youtube)
    
    JobRepository.update_job(
        job_id=job_id,
        progress=40,
        message="Running causal analysis..."
    )
    
    result = causal.run_full_causal_analysis(max_videos=max_videos)
    
    JobRepository.update_job(
        job_id=job_id,
        progress=90,
        message="Caching results..."
    )
    
    return result


def _run_video_sync(youtube, channel_id: str, max_videos: int, job_id: str) -> dict:
    """Sync videos to local cache (ETL)."""
    from ..tools.deep_analytics import DeepAnalytics
    from ..db.repository import VideoCacheRepository
    
    deep = DeepAnalytics(youtube)
    
    JobRepository.update_job(
        job_id=job_id,
        progress=30,
        message="Fetching videos from YouTube..."
    )
    
    # Fetch videos
    videos = deep.get_all_videos_extended(max_videos=max_videos)
    
    JobRepository.update_job(
        job_id=job_id,
        progress=70,
        message=f"Caching {len(videos)} videos..."
    )
    
    # Cache in database
    new_count = VideoCacheRepository.upsert_videos(channel_id, videos)
    
    return {
        "summary": {
            "total_videos": len(videos),
            "new_videos": new_count,
        },
        "sync_time": datetime.utcnow().isoformat(),
    }

