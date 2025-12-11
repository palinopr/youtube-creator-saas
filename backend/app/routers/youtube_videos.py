"""
YouTube Videos API Router.

Endpoints for listing and accessing user's own YouTube videos
through OAuth authentication.
"""

from fastapi import APIRouter, HTTPException, Query, Request, Depends
from typing import Optional
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address

from ..tools.youtube_api import get_youtube_client
from ..auth.dependencies import get_current_user
from ..db.models import User


router = APIRouter(prefix="/api/youtube", tags=["youtube-videos"])
limiter = Limiter(key_func=get_remote_address)


class ChannelResponse(BaseModel):
    """Channel information response."""
    channel_id: str
    title: str
    description: str
    thumbnail_url: str
    subscriber_count: int
    video_count: int
    view_count: int


class VideoListResponse(BaseModel):
    """Video list response."""
    videos: list
    next_page_token: Optional[str] = None
    total_results: int = 0
    error: Optional[str] = None


class VideoOwnershipResponse(BaseModel):
    """Video ownership verification response."""
    video_id: str
    is_owner: bool
    channel_id: Optional[str] = None


@router.get("/channel", response_model=ChannelResponse)
async def get_user_channel(user: User = Depends(get_current_user)):
    """
    Get the authenticated user's YouTube channel information.

    Requires OAuth authentication via /auth/login first.
    """
    client = get_youtube_client()
    channel_info = client.get_channel_info()
    
    if not channel_info:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated or unable to fetch channel. Please login at /auth/login"
        )
    
    return channel_info


@router.get("/videos", response_model=VideoListResponse)
async def list_user_videos(
    max_results: int = Query(default=25, ge=1, le=50, description="Number of videos to return"),
    page_token: Optional[str] = Query(default=None, description="Pagination token"),
    user: User = Depends(get_current_user)
):
    """
    List videos from the authenticated user's YouTube channel.
    
    Returns a paginated list of the user's uploaded videos with:
    - Video ID, title, description
    - Thumbnail URL
    - View, like, comment counts
    - Duration
    - Published date
    
    Use the `next_page_token` for pagination.
    
    Requires OAuth authentication via /auth/login first.
    """
    client = get_youtube_client()
    result = client.list_user_videos(max_results=max_results, page_token=page_token)
    
    if result.get("error") and "Could not get channel" in result.get("error", ""):
        raise HTTPException(
            status_code=401,
            detail="Not authenticated. Please login at /auth/login"
        )
    
    return result


@router.get("/videos/search", response_model=VideoListResponse)
async def search_user_videos(
    q: str = Query(..., min_length=1, description="Search query"),
    max_results: int = Query(default=25, ge=1, le=50, description="Number of videos to return"),
    user: User = Depends(get_current_user)
):
    """
    Search videos from the authenticated user's YouTube channel.

    Searches through ALL videos on the channel, not just the loaded ones.
    This is more efficient than loading all videos and filtering client-side.

    Args:
        q: Search query string
        max_results: Maximum number of results (1-50)

    Requires OAuth authentication via /auth/login first.
    """
    client = get_youtube_client()
    result = client.search_user_videos(query=q, max_results=max_results)

    if result.get("error") and "Could not get channel" in result.get("error", ""):
        raise HTTPException(
            status_code=401,
            detail="Not authenticated. Please login at /auth/login"
        )

    return result


@router.get("/videos/{video_id}")
async def get_video_details(video_id: str, user: User = Depends(get_current_user)):
    """
    Get detailed information about a specific video.

    Args:
        video_id: YouTube video ID

    Returns video details including title, description, stats, and duration.

    Requires OAuth authentication via /auth/login first.
    """
    client = get_youtube_client()
    
    video = client.get_video_details(video_id)
    
    if not video:
        raise HTTPException(
            status_code=404,
            detail=f"Video {video_id} not found or not accessible"
        )
    
    return video


@router.get("/videos/{video_id}/verify-ownership", response_model=VideoOwnershipResponse)
async def verify_video_ownership(video_id: str, user: User = Depends(get_current_user)):
    """
    Verify that the authenticated user owns a specific video.

    This is useful before downloading/processing a video to ensure
    the user has rights to the content.

    Args:
        video_id: YouTube video ID to verify

    Returns ownership status.
    """
    client = get_youtube_client()
    
    # Get channel info for response
    channel_info = client.get_channel_info()
    channel_id = channel_info.get("channel_id") if channel_info else None
    
    is_owner = client.verify_video_ownership(video_id)
    
    return {
        "video_id": video_id,
        "is_owner": is_owner,
        "channel_id": channel_id
    }


@router.post("/videos/{video_id}/prepare-download")
@limiter.limit("5/minute")
async def prepare_video_download(
    request: Request,
    video_id: str,
    user: User = Depends(get_current_user)
):
    """
    Prepare a user's own video for download/processing.

    This endpoint:
    1. Verifies the user owns the video
    2. Initiates the download
    3. Returns the local path when ready

    This is used by the clips generator to process user's own videos.

    Args:
        video_id: YouTube video ID

    Returns download status and path.
    """
    client = get_youtube_client()
    
    # First verify ownership
    is_owner = client.verify_video_ownership(video_id)
    
    if not is_owner:
        # Check if user is at least authenticated
        channel_info = client.get_channel_info()
        if not channel_info:
            raise HTTPException(
                status_code=401,
                detail="Not authenticated. Please login at /auth/login"
            )
        
        # User is authenticated but doesn't own this video
        raise HTTPException(
            status_code=403,
            detail=f"Video {video_id} does not belong to your channel. You can only process your own videos."
        )
    
    # Download the video
    download_path = client.download_user_video(video_id)
    
    if not download_path:
        raise HTTPException(
            status_code=500,
            detail="Failed to download video. Please try again later."
        )
    
    import os
    return {
        "video_id": video_id,
        "status": "ready",
        "path": download_path,
        "size_bytes": os.path.getsize(download_path)
    }

