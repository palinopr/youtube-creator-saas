"""
Clips Router - API endpoints for AI viral short clip generation.
Implements the Franken-bite method for creating engaging YouTube Shorts.
"""

import os
import uuid
import asyncio
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel

from ..auth import get_authenticated_service
from ..tools.clips_generator import FrankenBiteDetector, ClipRenderer, ClipSuggestion
from ..tools.transcript_analyzer import TranscriptAnalyzer


router = APIRouter(prefix="/api/clips", tags=["clips"])


@router.get("/test")
async def test_endpoint():
    """Quick test endpoint."""
    return {"status": "ok", "message": "Clips API is working!"}

# In-memory storage for render jobs (in production, use Redis/DB)
render_jobs: Dict[str, Dict[str, Any]] = {}


class GenerateClipsRequest(BaseModel):
    """Request to generate clip suggestions from a video."""
    video_id: str
    transcript: Optional[str] = None  # Can pass cached transcript
    max_clips: int = 5


class RenderClipRequest(BaseModel):
    """Request to render a specific clip."""
    video_id: str
    clip_id: str
    segments: List[Dict[str, float]]  # List of {"start": float, "end": float}
    title: Optional[str] = None


class ClipSegmentResponse(BaseModel):
    """Response model for a clip segment."""
    start_time: float
    end_time: float
    text: str
    segment_type: str


class ClipSuggestionResponse(BaseModel):
    """Response model for a clip suggestion."""
    clip_id: str
    title: str
    hook: ClipSegmentResponse
    body_segments: List[ClipSegmentResponse]
    loop_ending: Optional[ClipSegmentResponse]
    total_duration: float
    viral_score: int
    why_viral: str


@router.post("/generate")
async def generate_clips(request: GenerateClipsRequest):
    """
    Generate viral clip suggestions from a video using the Franken-bite method.
    """
    print(f"[CLIPS] Generate request received for video: {request.video_id}")
    
    try:
        print("[CLIPS] Getting authenticated service...")
        youtube = get_authenticated_service("youtube", "v3")
        print("[CLIPS] Got YouTube service")
        
        # Get video title
        video_response = youtube.videos().list(
            part="snippet",
            id=request.video_id
        ).execute()
        
        if not video_response.get("items"):
            raise HTTPException(status_code=404, detail="Video not found")
        
        video_title = video_response["items"][0]["snippet"]["title"]
        print(f"[CLIPS] Got video title: {video_title}")
        
        # Get transcript (use cached or fetch)
        transcript_text = request.transcript
        
        if not transcript_text:
            print("[CLIPS] No cached transcript, fetching...")
            transcript_analyzer = TranscriptAnalyzer(youtube)
            transcript_data = await transcript_analyzer.get_transcript_with_fallback(
                request.video_id,
                use_whisper_fallback=True
            )
            print(f"[CLIPS] Transcript fetch result: {transcript_data.get('status') if transcript_data else 'None'}")
            
            if transcript_data and transcript_data.get("status") == "success":
                transcript_text = transcript_data.get("full_text") or transcript_data.get("text")
        
        if not transcript_text:
            raise HTTPException(
                status_code=400, 
                detail="Could not get transcript for this video. Try providing a cached transcript."
            )
        
        # Detect Franken-bite opportunities
        print(f"[CLIPS] Transcript length: {len(transcript_text)} chars")
        print("[CLIPS] Calling FrankenBiteDetector...")
        detector = FrankenBiteDetector()
        suggestions = await detector.detect_clips(
            transcript_text=transcript_text,
            video_title=video_title,
            max_clips=request.max_clips
        )
        print(f"[CLIPS] Got {len(suggestions) if suggestions else 0} suggestions")
        
        if not suggestions:
            return {
                "success": True,
                "clips": [],
                "message": "No viral clip opportunities found in this video."
            }
        
        # Convert to response format
        clips_response = []
        for suggestion in suggestions:
            clip_data = {
                "clip_id": suggestion.clip_id,
                "title": suggestion.title,
                "hook": {
                    "start_time": suggestion.hook.start_time,
                    "end_time": suggestion.hook.end_time,
                    "text": suggestion.hook.text,
                    "segment_type": suggestion.hook.segment_type
                },
                "body_segments": [
                    {
                        "start_time": seg.start_time,
                        "end_time": seg.end_time,
                        "text": seg.text,
                        "segment_type": seg.segment_type
                    }
                    for seg in suggestion.body_segments
                ],
                "loop_ending": None,
                "total_duration": suggestion.total_duration,
                "viral_score": suggestion.viral_score,
                "why_viral": suggestion.why_viral
            }
            
            if suggestion.loop_ending:
                clip_data["loop_ending"] = {
                    "start_time": suggestion.loop_ending.start_time,
                    "end_time": suggestion.loop_ending.end_time,
                    "text": suggestion.loop_ending.text,
                    "segment_type": suggestion.loop_ending.segment_type
                }
            
            clips_response.append(clip_data)
        
        return {
            "success": True,
            "video_id": request.video_id,
            "video_title": video_title,
            "clips": clips_response,
            "transcript_cached": request.transcript is not None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def _render_clip_task(
    job_id: str,
    video_id: str,
    clip_id: str,
    segments: List[tuple]
):
    """Background task to render a clip."""
    try:
        print(f"[RENDER] Starting render task for job {job_id}")
        render_jobs[job_id]["status"] = "rendering"
        render_jobs[job_id]["progress"] = 10
        
        renderer = ClipRenderer()
        
        # Update progress
        render_jobs[job_id]["progress"] = 30
        render_jobs[job_id]["message"] = "Downloading video..."
        print(f"[RENDER] Downloading video {video_id}...")
        
        # Render the clip
        output_path = await renderer.render_clip(
            video_id=video_id,
            clip_id=clip_id,
            segments=segments
        )
        
        print(f"[RENDER] Render returned: {output_path}")
        
        if output_path and os.path.exists(output_path):
            render_jobs[job_id]["status"] = "completed"
            render_jobs[job_id]["progress"] = 100
            render_jobs[job_id]["output_path"] = output_path
            render_jobs[job_id]["message"] = "Render complete!"
            print(f"[RENDER] ✓ Job {job_id} completed successfully")
        else:
            render_jobs[job_id]["status"] = "failed"
            render_jobs[job_id]["message"] = "Render failed - check FFmpeg installation"
            print(f"[RENDER] ✗ Job {job_id} failed - no output")
            
    except Exception as e:
        print(f"[RENDER] ✗ Job {job_id} error: {e}")
        render_jobs[job_id]["status"] = "failed"
        render_jobs[job_id]["message"] = str(e)


@router.post("/render")
async def render_clip(request: RenderClipRequest, background_tasks: BackgroundTasks):
    """
    Start rendering a clip to MP4 with burned-in captions.
    
    This is an async operation - returns a job ID to poll for status.
    
    Args:
        video_id: YouTube video ID
        clip_id: Unique identifier for this clip
        segments: List of {"start": float, "end": float} time segments
        title: Optional title for the clip (used in filename)
    
    Returns:
        Job ID to poll for render status
    """
    try:
        # Validate segments
        if not request.segments:
            raise HTTPException(status_code=400, detail="No segments provided")
        
        # Validate segment format
        segments = []
        for seg in request.segments:
            start = seg.get("start", 0)
            end = seg.get("end", 0)
            if end <= start:
                raise HTTPException(status_code=400, detail="Invalid segment: end must be greater than start")
            segments.append((start, end))
        
        # Calculate total duration
        total_duration = sum(end - start for start, end in segments)
        if total_duration > 180:  # 3 minute limit
            raise HTTPException(status_code=400, detail="Total clip duration exceeds 3 minutes")
        
        # Create job
        job_id = str(uuid.uuid4())[:12]
        render_jobs[job_id] = {
            "job_id": job_id,
            "video_id": request.video_id,
            "clip_id": request.clip_id,
            "status": "queued",
            "progress": 0,
            "message": "Queued for rendering...",
            "output_path": None,
            "created_at": asyncio.get_event_loop().time()
        }
        
        # Start background render
        background_tasks.add_task(
            _render_clip_task,
            job_id,
            request.video_id,
            request.clip_id,
            segments
        )
        
        return {
            "success": True,
            "job_id": job_id,
            "message": "Render job started"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{job_id}/status")
async def get_render_status(job_id: str):
    """
    Check the status of a render job.
    
    Args:
        job_id: The job ID returned from /render
    
    Returns:
        Current status, progress percentage, and message
    """
    if job_id not in render_jobs:
        raise HTTPException(status_code=404, detail="Render job not found")
    
    job = render_jobs[job_id]
    
    return {
        "job_id": job_id,
        "status": job["status"],
        "progress": job["progress"],
        "message": job["message"],
        "video_id": job["video_id"],
        "clip_id": job["clip_id"],
        "ready_for_download": job["status"] == "completed" and job.get("output_path")
    }


@router.get("/{job_id}/preview")
async def preview_clip(job_id: str):
    """
    Preview a rendered clip in the browser (streaming).
    
    Args:
        job_id: The job ID of a completed render
    
    Returns:
        Video stream for browser playback
    """
    if job_id not in render_jobs:
        raise HTTPException(status_code=404, detail="Render job not found")
    
    job = render_jobs[job_id]
    
    if job["status"] != "completed":
        raise HTTPException(status_code=400, detail=f"Render not complete. Status: {job['status']}")
    
    output_path = job.get("output_path")
    if not output_path or not os.path.exists(output_path):
        raise HTTPException(status_code=404, detail="Rendered file not found")
    
    # Return for streaming (no Content-Disposition = inline playback)
    return FileResponse(
        path=output_path,
        media_type="video/mp4"
    )


@router.get("/{job_id}/download")
async def download_clip(job_id: str):
    """
    Download a rendered clip.
    
    Args:
        job_id: The job ID of a completed render
    
    Returns:
        MP4 file download
    """
    if job_id not in render_jobs:
        raise HTTPException(status_code=404, detail="Render job not found")
    
    job = render_jobs[job_id]
    
    if job["status"] != "completed":
        raise HTTPException(status_code=400, detail=f"Render not complete. Status: {job['status']}")
    
    output_path = job.get("output_path")
    if not output_path or not os.path.exists(output_path):
        raise HTTPException(status_code=404, detail="Rendered file not found")
    
    # Generate nice filename
    filename = f"clip_{job['clip_id']}.mp4"
    
    return FileResponse(
        path=output_path,
        media_type="video/mp4",
        filename=filename
    )


@router.get("/jobs")
async def list_render_jobs():
    """
    List all render jobs (for debugging/admin).
    
    Returns:
        List of all render jobs and their statuses
    """
    return {
        "jobs": [
            {
                "job_id": job_id,
                "video_id": job["video_id"],
                "clip_id": job["clip_id"],
                "status": job["status"],
                "progress": job["progress"]
            }
            for job_id, job in render_jobs.items()
        ],
        "total": len(render_jobs)
    }


@router.delete("/jobs/{job_id}")
async def delete_render_job(job_id: str):
    """
    Delete a render job and its output file.
    
    Args:
        job_id: The job ID to delete
    """
    if job_id not in render_jobs:
        raise HTTPException(status_code=404, detail="Render job not found")
    
    job = render_jobs[job_id]
    
    # Delete output file if exists
    output_path = job.get("output_path")
    if output_path and os.path.exists(output_path):
        try:
            os.remove(output_path)
        except:
            pass
    
    # Remove from jobs dict
    del render_jobs[job_id]
    
    return {"success": True, "message": "Job deleted"}


@router.post("/cleanup")
async def cleanup_old_jobs(max_age_hours: int = 24):
    """
    Clean up old render jobs and files.
    
    Args:
        max_age_hours: Delete jobs older than this (default 24)
    """
    renderer = ClipRenderer()
    renderer.cleanup_old_renders(max_age_hours)
    
    # Clean up old jobs from memory
    current_time = asyncio.get_event_loop().time()
    max_age_seconds = max_age_hours * 3600
    
    jobs_to_delete = [
        job_id for job_id, job in render_jobs.items()
        if current_time - job.get("created_at", 0) > max_age_seconds
    ]
    
    for job_id in jobs_to_delete:
        output_path = render_jobs[job_id].get("output_path")
        if output_path and os.path.exists(output_path):
            try:
                os.remove(output_path)
            except:
                pass
        del render_jobs[job_id]
    
    return {
        "success": True,
        "jobs_cleaned": len(jobs_to_delete)
    }

