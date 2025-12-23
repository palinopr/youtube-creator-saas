"""
Clips Router - API endpoints for AI viral short clip generation.
Implements the Franken-bite method for creating engaging YouTube Shorts.

REFACTORED: Now uses SQLite for persistent job storage instead of in-memory dict.
Video rendering is handled by background workers to avoid blocking the API.
"""

import os
import uuid
import asyncio
import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Request, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address

from ..auth import get_authenticated_service
from ..auth.youtube_auth import load_credentials, DEFAULT_TOKEN_KEY
from ..auth.dependencies import get_current_user, check_usage, require_feature, get_channel_profile
from ..db.models import User
from ..tools.clips_generator import FrankenBiteDetector, ClipRenderer
from ..tools.transcript_analyzer import TranscriptAnalyzer
from ..db.models import JobStatus, JobType
from ..db.repository import JobRepository
from ..workers.manager import get_worker_manager
from ..config import get_settings


router = APIRouter(prefix="/api/clips", tags=["clips"])
limiter = Limiter(key_func=get_remote_address)
settings = get_settings()


@router.get("/test")
async def test_endpoint(user: User = Depends(get_current_user)):
    """Quick test endpoint."""
    return {"status": "ok", "message": "Clips API is working!"}


from pydantic import Field, field_validator


class GenerateClipsRequest(BaseModel):
    """Request to generate clip suggestions from a video."""
    video_id: str = Field(..., min_length=11, max_length=11, pattern=r'^[a-zA-Z0-9_-]+$')
    transcript: Optional[str] = Field(default=None, max_length=500000, description="Cached transcript")
    max_clips: int = Field(default=5, ge=1, le=20, description="Max clips to generate")


class RenderClipRequest(BaseModel):
    """Request to render a specific clip."""
    video_id: str = Field(..., min_length=11, max_length=11, pattern=r'^[a-zA-Z0-9_-]+$')
    clip_id: str = Field(..., min_length=1, max_length=100)
    segments: List[Dict[str, float]] = Field(..., min_length=1, max_length=20, description="Time segments")
    title: Optional[str] = Field(default=None, max_length=100)
    prefer_oauth: bool = Field(default=True, description="Try OAuth download first")
    local_video_path: Optional[str] = Field(default=None, max_length=500)
    aspect_ratio: str = Field(default="9:16", pattern=r'^(9:16|1:1)$', description="Output aspect ratio")

    @field_validator('segments')
    @classmethod
    def validate_segments(cls, v):
        if v:
            total_duration = 0
            for seg in v:
                start = seg.get('start', 0)
                end = seg.get('end', 0)
                if start < 0 or end < 0:
                    raise ValueError('Segment times cannot be negative')
                if end <= start:
                    raise ValueError('Segment end must be greater than start')
                total_duration += (end - start)
            if total_duration > 180:
                raise ValueError('Total clip duration exceeds 3 minutes (180 seconds)')
        return v


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


@router.get("/generate/stream/{video_id}")
async def generate_clips_stream(
    video_id: str,
    max_clips: int = 5,
    user: User = Depends(check_usage("clips_per_month")),
    channel_profile: dict = Depends(get_channel_profile)
):
    """
    Stream clip generation progress using Server-Sent Events (SSE).
    """
    from fastapi.responses import StreamingResponse
    import json
    import asyncio

    # Capture channel_profile in closure for the generator
    _channel_profile = channel_profile

    async def event_generator():
        import sys
        print(f"[STREAM] ========== STREAM STARTED for {video_id} ==========", flush=True)
        try:
            # Step 1: Get YouTube service
            yield f"data: {json.dumps({'step': 1, 'total': 5, 'message': 'Connecting to YouTube...'})}\n\n"
            await asyncio.sleep(0.5)
            youtube = get_authenticated_service("youtube", "v3")
            
            # Step 2: Get video info
            yield f"data: {json.dumps({'step': 2, 'total': 5, 'message': 'Fetching video info...'})}\n\n"
            await asyncio.sleep(0.5)
            video_response = youtube.videos().list(part="snippet", id=video_id).execute()
            
            if not video_response.get("items"):
                yield f"data: {json.dumps({'error': 'Video not found'})}\n\n"
                return
            
            video_title = video_response["items"][0]["snippet"]["title"]
            
            # Step 3: Get transcript
            yield f"data: {json.dumps({'step': 3, 'total': 5, 'message': 'Fetching transcript...'})}\n\n"
            await asyncio.sleep(0.5)
            transcript_analyzer = TranscriptAnalyzer(youtube)
            transcript_data = await transcript_analyzer.get_transcript_with_fallback(video_id, use_whisper_fallback=True)
            
            if not transcript_data or transcript_data.get("status") != "success":
                yield f"data: {json.dumps({'error': 'Could not get transcript'})}\n\n"
                return
            
            transcript_text = transcript_data.get("full_text") or transcript_data.get("text")
            
            # Step 4: Get timestamps
            yield f"data: {json.dumps({'step': 4, 'total': 5, 'message': 'Analyzing timestamps...'})}\n\n"
            await asyncio.sleep(0.5)
            word_timestamps = []
            if transcript_data.get("segments"):
                # Convert sentence segments to word-level timestamps
                # Split each sentence into words and distribute time evenly
                print(f"[STREAM] Converting {len(transcript_data['segments'])} sentence segments to word timestamps", flush=True)
                for seg in transcript_data["segments"]:
                    sentence_text = seg["text"]
                    words = sentence_text.split()
                    if not words:
                        continue

                    seg_start = seg["start"]
                    seg_end = seg["end"]
                    seg_duration = seg_end - seg_start
                    word_duration = seg_duration / len(words)

                    for i, word in enumerate(words):
                        word_start = seg_start + (i * word_duration)
                        word_end = word_start + word_duration
                        word_timestamps.append({
                            "word": word,
                            "start": word_start,
                            "end": word_end
                        })
                print(f"[STREAM] Created {len(word_timestamps)} word-level timestamps", flush=True)
            else:
                # Fallback: Download video and get word timestamps via Whisper
                yield f"data: {json.dumps({'step': 4, 'total': 5, 'message': 'Running Whisper for timestamps (30s)...'})}\n\n"
                from ..tools.clips_generator import ClipRenderer
                renderer = ClipRenderer()
                
                source_video, source_type = await renderer.get_video_source(video_id=video_id, prefer_oauth=True)
                
                if source_video:
                    word_timestamps = await renderer.get_word_timestamps(source_video, start_time=0, duration=600)
            
            # Step 5: AI analysis
            yield f"data: {json.dumps({'step': 5, 'total': 5, 'message': 'Starting AI Agent Team...'})}\n\n"
            await asyncio.sleep(0.5)
            
            # Use new Agent Workflow
            from ..agents.clips_agent import ViralClipsAgent
            agent = ViralClipsAgent(channel_profile=_channel_profile)
            
            # Get original transcript segments for better sentence boundary detection
            transcript_segments = transcript_data.get("segments", [])

            initial_state = {
                "video_title": video_title,
                "transcript": transcript_text,
                "word_timestamps": word_timestamps,
                "transcript_segments": transcript_segments,  # Original segments for sentence boundaries
                "max_clips": max_clips,
                "language": "en",
                "themes": [],
                "candidates": [],
                "critiques": [],
                "final_clips": [],
                "retry_count": 0,
                "all_rejected": []
            }
            
            # Stream agent progress
            print(f"[STREAM] Starting agent workflow with {len(word_timestamps)} timestamps", flush=True)
            suggestions = []
            async for output in agent.workflow.astream(initial_state):
                print(f"[STREAM] Agent output: {list(output.keys())}", flush=True)
                for key, value in output.items():
                    if key == "analyst":
                        yield f"data: {json.dumps({'step': 5, 'total': 5, 'message': f'Analyst identified {len(value.get("themes", []))} viral themes...'})}\n\n"
                    elif key == "creator":
                        count = len(value.get("candidates", []))
                        attempt = value.get("retry_count", 1)
                        yield f"data: {json.dumps({'step': 5, 'total': 5, 'message': f'Creator drafted {count} clips (Attempt {attempt})...'})}\n\n"
                    elif key == "supervisor":
                        critiques = value.get("critiques", [])
                        rejects = sum(1 for c in critiques if c.get("status") == "reject")
                        if rejects > 0:
                            yield f"data: {json.dumps({'step': 5, 'total': 5, 'message': f'Supervisor rejected {rejects} clips. Requesting fixes...'})}\n\n"
                        else:
                            yield f"data: {json.dumps({'step': 5, 'total': 5, 'message': 'Supervisor approved clips!'})}\n\n"
                    elif key == "refiner":
                        suggestions = value.get("final_clips", [])
                        yield f"data: {json.dumps({'step': 5, 'total': 5, 'message': f'Refiner finalized {len(suggestions)} clips...'})}\n\n"
            
            # Build response
            clips_response = []
            for suggestion in (suggestions or []):
                clips_response.append({
                    "clip_id": suggestion.clip_id,
                    "title": suggestion.title,
                    "hook": {
                        "start_time": suggestion.hook.start_time,
                        "end_time": suggestion.hook.end_time,
                        "text": suggestion.hook.text,
                        "segment_type": suggestion.hook.segment_type,
                    },
                    "body_segments": [
                        {
                            "start_time": seg.start_time,
                            "end_time": seg.end_time,
                            "text": seg.text,
                            "segment_type": seg.segment_type,
                        }
                        for seg in suggestion.body_segments
                    ],
                    "loop_ending": {
                        "start_time": suggestion.loop_ending.start_time,
                        "end_time": suggestion.loop_ending.end_time,
                        "text": suggestion.loop_ending.text,
                        "segment_type": suggestion.loop_ending.segment_type,
                    } if suggestion.loop_ending else None,
                    "total_duration": suggestion.total_duration,
                    "viral_score": suggestion.viral_score,
                    "why_viral": suggestion.why_viral,
                })
            
            # Final result
            print(f"[STREAM] ========== STREAM COMPLETE ==========", flush=True)
            print(f"[STREAM] Final clips count: {len(clips_response)}", flush=True)
            yield f"data: {json.dumps({'done': True, 'clips': clips_response, 'video_title': video_title})}\n\n"
            
        except Exception as e:
            import traceback
            print(f"[STREAM] ❌ ERROR: {type(e).__name__}: {e}", flush=True)
            traceback.print_exc()
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@router.post("/generate")
@limiter.limit("5/minute")
async def generate_clips(
    request: Request,
    clips_request: GenerateClipsRequest,
    user: User = Depends(check_usage("clips_per_month")),
    channel_profile: dict = Depends(get_channel_profile)
):
    """
    Generate viral clip suggestions from a video using the Franken-bite method.
    """
    print(f"[CLIPS] Generate request received for video: {clips_request.video_id}")
    
    try:
        print("[CLIPS] Getting authenticated service...")
        youtube = get_authenticated_service("youtube", "v3")
        print("[CLIPS] Got YouTube service")
        
        # Get video title
        video_response = youtube.videos().list(
            part="snippet",
            id=clips_request.video_id
        ).execute()
        
        if not video_response.get("items"):
            raise HTTPException(status_code=404, detail="Video not found")
        
        video_title = video_response["items"][0]["snippet"]["title"]
        print(f"[CLIPS] Got video title: {video_title}")
        
        # Get transcript (use cached or fetch)
        transcript_text = clips_request.transcript

        if not transcript_text:
            print("[CLIPS] No cached transcript, fetching...")
            transcript_analyzer = TranscriptAnalyzer(youtube)
            transcript_data = await transcript_analyzer.get_transcript_with_fallback(
                clips_request.video_id,
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
        
        # Get word timestamps for precise cutting
        print("[CLIPS] Getting timestamps...")
        word_timestamps = []
        
        # Method 1: Use transcript segments if available (BEST - covers whole video)
        # NOTE: Transcript segments are SENTENCE-level, we need to convert to WORD-level
        if transcript_data and transcript_data.get("segments"):
            print(f"[CLIPS] Converting {len(transcript_data['segments'])} sentence segments to word timestamps")
            for seg in transcript_data["segments"]:
                seg_text = seg["text"].strip()
                seg_start = seg["start"]
                seg_end = seg["end"]
                seg_duration = seg_end - seg_start

                # Split sentence into words
                words = seg_text.split()
                if not words:
                    continue

                # Distribute time evenly across words
                word_duration = seg_duration / len(words)
                for i, word in enumerate(words):
                    word_start = seg_start + (i * word_duration)
                    word_end = word_start + word_duration
                    word_timestamps.append({
                        "word": word,
                        "start": word_start,
                        "end": word_end
                    })
            print(f"[CLIPS] Created {len(word_timestamps)} word-level timestamps")
        else:
            # Method 2: Fallback to downloading video and running Whisper (limited to 10 mins)
            print("[CLIPS] No transcript segments, falling back to Whisper (first 10 mins)...")
            from ..tools.clips_generator import ClipRenderer
            renderer = ClipRenderer()
            
            # Download video first
            source_video, source_type = await renderer.get_video_source(
                video_id=clips_request.video_id,
                prefer_oauth=True  # Use OAuth for SaaS
            )
            
            if source_video:
                print(f"[CLIPS] Got video from {source_type.value}, extracting word timestamps...")
                # Get word timestamps from first 10 minutes (enough for most clips)
                word_timestamps = await renderer.get_word_timestamps(
                    source_video, 
                    start_time=0, 
                    duration=600  # 10 minutes
                )
                print(f"[CLIPS] Got {len(word_timestamps)} word timestamps")
            else:
                print("[CLIPS] Warning: Could not download video, timestamps will be estimated")
        
        # Get original transcript segments for better sentence boundary detection
        transcript_segments = transcript_data.get("segments", []) if transcript_data else []

        # Detect Franken-bite opportunities
        print(f"[CLIPS] ========== STARTING CLIP GENERATION ==========")
        print(f"[CLIPS] Transcript length: {len(transcript_text)} chars")
        print(f"[CLIPS] Word timestamps count: {len(word_timestamps)}")
        print(f"[CLIPS] Transcript segments: {len(transcript_segments)}")
        print(f"[CLIPS] First 3 word timestamps: {word_timestamps[:3] if word_timestamps else 'NONE'}")
        print(f"[CLIPS] Video title: {video_title}")
        print(f"[CLIPS] Max clips requested: {clips_request.max_clips}")
        print("[CLIPS] Creating ViralClipsAgent...")

        from ..agents.clips_agent import ViralClipsAgent
        agent = ViralClipsAgent(channel_profile=channel_profile)
        print("[CLIPS] Agent created, calling generate_clips()...")

        try:
            suggestions = await agent.generate_clips(
                transcript=transcript_text,
                video_title=video_title,
                word_timestamps=word_timestamps,
                max_clips=clips_request.max_clips,
                transcript_segments=transcript_segments  # For better sentence boundaries
            )
            print(f"[CLIPS] ✅ Got {len(suggestions) if suggestions else 0} suggestions")
        except Exception as e:
            print(f"[CLIPS] ❌ ERROR in generate_clips: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            raise
        
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
            "video_id": clips_request.video_id,
            "video_title": video_title,
            "clips": clips_response,
            "transcript_cached": clips_request.transcript is not None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/render")
@limiter.limit("3/minute")
async def render_clip(
    request: Request,
    render_request: RenderClipRequest,
    user: User = Depends(check_usage("clips_per_month"))
):
    """
    Start rendering a clip to MP4 with burned-in captions.

    This is an async operation - returns a job ID to poll for status.
    The actual rendering happens in a background worker to avoid blocking the API.

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
        if not render_request.segments:
            raise HTTPException(status_code=400, detail="No segments provided")

        # Validate segment format
        segments = []
        for seg in render_request.segments:
            start = seg.get("start", 0)
            end = seg.get("end", 0)
            if end <= start:
                raise HTTPException(status_code=400, detail="Invalid segment: end must be greater than start")
            segments.append((start, end))

        # Calculate total duration
        total_duration = sum(end - start for start, end in segments)
        if total_duration > 180:  # 3 minute limit
            raise HTTPException(status_code=400, detail="Total clip duration exceeds 3 minutes")

        # Submit job to worker queue (non-blocking)
        worker_manager = get_worker_manager()
        token_key_for_creds = DEFAULT_TOKEN_KEY if settings.single_user_mode else user.id
        credentials_data = load_credentials(token_key=token_key_for_creds)
        if credentials_data:
            credentials_data = {**credentials_data, "client_secret": settings.google_client_secret}
        job_data = worker_manager.submit_job(
            job_type=JobType.RENDER_CLIP,
            video_id=render_request.video_id,
            clip_id=render_request.clip_id,
            input_data={
                "segments": segments,
                "title": render_request.title,
                "prefer_oauth": render_request.prefer_oauth,
                "local_video_path": render_request.local_video_path,
                "aspect_ratio": render_request.aspect_ratio,
                "credentials": credentials_data,
            }
        )
        
        return {
            "success": True,
            "job_id": job_data["job_id"],
            "message": "Render job queued - check status for progress"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{job_id}/status")
async def get_render_status(job_id: str, user: User = Depends(get_current_user)):
    """
    Check the status of a render job.

    Args:
        job_id: The job ID returned from /render

    Returns:
        Current status, progress percentage, and message
    """
    job = JobRepository.get_job(job_id)

    if not job:
        raise HTTPException(status_code=404, detail="Render job not found")

    return {
        "job_id": job_id,
        "status": job["status"],
        "progress": job["progress"],
        "message": job["message"],
        "video_id": job["video_id"],
        "clip_id": job["clip_id"],
        "ready_for_download": job["status"] == "completed" and job.get("output_path"),
        "error": job.get("error_message")
    }


@router.websocket("/ws/render/{job_id}")
async def render_progress_websocket(websocket: WebSocket, job_id: str):
    """
    WebSocket endpoint for real-time render progress updates.

    Pushes progress updates every 500ms until job completes or fails.
    Frontend can connect with: ws://host:port/api/clips/ws/render/{job_id}
    """
    await websocket.accept()
    print(f"[WS] Client connected for job: {job_id}")

    last_progress = -1
    last_status = ""

    try:
        while True:
            # Get current job status
            job = JobRepository.get_job(job_id)

            if not job:
                await websocket.send_json({
                    "status": "error",
                    "message": "Job not found",
                    "progress": 0,
                    "ready_for_download": False
                })
                break

            current_status = job["status"]
            current_progress = job["progress"]

            # Only send update if something changed
            if current_status != last_status or current_progress != last_progress:
                update = {
                    "status": current_status,
                    "progress": current_progress,
                    "message": job.get("message", ""),
                    "ready_for_download": current_status == "completed" and job.get("output_path") is not None
                }

                await websocket.send_json(update)
                print(f"[WS] Sent update for {job_id}: {current_status} {current_progress}%")

                last_status = current_status
                last_progress = current_progress

            # Exit loop if job is done
            if current_status in ("completed", "failed", "cancelled"):
                print(f"[WS] Job {job_id} finished with status: {current_status}")
                break

            # Wait before next check
            await asyncio.sleep(0.5)

    except WebSocketDisconnect:
        print(f"[WS] Client disconnected for job: {job_id}")
    except Exception as e:
        print(f"[WS] Error for job {job_id}: {e}")
        try:
            await websocket.send_json({
                "status": "error",
                "message": str(e),
                "progress": 0,
                "ready_for_download": False
            })
        except:
            pass
    finally:
        try:
            await websocket.close()
        except:
            pass


@router.get("/{job_id}/preview")
async def preview_clip(job_id: str, user: User = Depends(get_current_user)):
    """
    Preview a rendered clip in the browser (streaming).
    
    Args:
        job_id: The job ID of a completed render
    
    Returns:
        Video stream for browser playback
    """
    job = JobRepository.get_job(job_id)
    
    if not job:
        raise HTTPException(status_code=404, detail="Render job not found")
    
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
async def download_clip(job_id: str, user: User = Depends(get_current_user)):
    """
    Download a rendered clip.
    
    Args:
        job_id: The job ID of a completed render
    
    Returns:
        MP4 file download
    """
    job = JobRepository.get_job(job_id)
    
    if not job:
        raise HTTPException(status_code=404, detail="Render job not found")
    
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
async def list_render_jobs(limit: int = 50, user: User = Depends(get_current_user)):
    """
    List all render jobs (for debugging/admin).
    
    Returns:
        List of all render jobs and their statuses
    """
    jobs = JobRepository.list_jobs(job_type=JobType.RENDER_CLIP, limit=limit)
    
    return {
        "jobs": [
            {
                "job_id": job["job_id"],
                "video_id": job["video_id"],
                "clip_id": job["clip_id"],
                "status": job["status"],
                "progress": job["progress"],
                "created_at": job["created_at"],
            }
            for job in jobs
        ],
        "total": len(jobs)
    }


@router.delete("/jobs/{job_id}")
async def delete_render_job(job_id: str, user: User = Depends(get_current_user)):
    """
    Delete a render job and its output file.
    
    Args:
        job_id: The job ID to delete
    """
    job = JobRepository.get_job(job_id)
    
    if not job:
        raise HTTPException(status_code=404, detail="Render job not found")
    
    # Delete output file if exists
    output_path = job.get("output_path")
    if output_path and os.path.exists(output_path):
        try:
            os.remove(output_path)
        except:
            pass
    
    # Remove from database
    JobRepository.delete_job(job_id)
    
    return {"success": True, "message": "Job deleted"}


@router.post("/cleanup")
async def cleanup_old_jobs(max_age_hours: int = 24, user: User = Depends(get_current_user)):
    """
    Clean up old render jobs and files.
    
    Args:
        max_age_hours: Delete jobs older than this (default 24)
    """
    # Clean up old jobs from database
    jobs_deleted = JobRepository.cleanup_old_jobs(max_age_hours=max_age_hours)
    
    # Clean up old render files
    renderer = ClipRenderer()
    renderer.cleanup_old_renders(max_age_hours)
    
    return {
        "success": True,
        "jobs_cleaned": jobs_deleted
    }
