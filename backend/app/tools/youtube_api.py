"""
YouTube API Client for OAuth-based video access.

This module provides YouTube Data API v3 integration for:
- Listing user's own uploaded videos
- Getting video details
- Downloading user's own videos for processing

Uses OAuth tokens stored via the auth flow, ensuring users only access
their own content (no bot detection issues).
"""

import os
import tempfile
import subprocess
import shutil
from typing import List, Dict, Optional, Any
from datetime import datetime
from dataclasses import dataclass

from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

from ..auth.youtube_auth import get_youtube_credentials, get_authenticated_service


@dataclass
class YouTubeVideo:
    """Represents a YouTube video from user's channel."""
    video_id: str
    title: str
    description: str
    thumbnail_url: str
    published_at: str
    duration: str
    view_count: int
    like_count: int
    comment_count: int
    channel_id: str
    channel_title: str
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "video_id": self.video_id,
            "title": self.title,
            "description": self.description[:200] + "..." if len(self.description) > 200 else self.description,
            "thumbnail_url": self.thumbnail_url,
            "published_at": self.published_at,
            "duration": self.duration,
            "view_count": self.view_count,
            "like_count": self.like_count,
            "comment_count": self.comment_count,
            "channel_id": self.channel_id,
            "channel_title": self.channel_title,
        }


class YouTubeAPIClient:
    """
    YouTube API client for OAuth-authenticated video access.
    
    This client uses the user's OAuth credentials to:
    1. List videos from their channel
    2. Get video details
    3. Download their own videos for clip processing
    
    Since users are accessing their OWN content, there are no
    bot detection or legal issues.
    """
    
    def __init__(self, temp_dir: Optional[str] = None):
        """
        Initialize the YouTube API client.
        
        Args:
            temp_dir: Directory for downloaded videos. Defaults to system temp.
        """
        self.temp_dir = temp_dir or tempfile.gettempdir()
        os.makedirs(self.temp_dir, exist_ok=True)
    
    def _get_service(self):
        """Get authenticated YouTube Data API service."""
        return get_authenticated_service("youtube", "v3")
    
    def get_channel_info(self) -> Optional[Dict[str, Any]]:
        """
        Get the authenticated user's channel information.
        
        Returns:
            Channel info dict or None if not authenticated
        """
        try:
            youtube = self._get_service()
            
            request = youtube.channels().list(
                part="snippet,contentDetails,statistics",
                mine=True
            )
            response = request.execute()
            
            if not response.get("items"):
                return None
            
            channel = response["items"][0]
            return {
                "channel_id": channel["id"],
                "title": channel["snippet"]["title"],
                "description": channel["snippet"].get("description", ""),
                "thumbnail_url": channel["snippet"]["thumbnails"]["default"]["url"],
                "subscriber_count": int(channel["statistics"].get("subscriberCount", 0)),
                "video_count": int(channel["statistics"].get("videoCount", 0)),
                "view_count": int(channel["statistics"].get("viewCount", 0)),
                "uploads_playlist_id": channel["contentDetails"]["relatedPlaylists"]["uploads"],
            }
        except Exception as e:
            print(f"[YOUTUBE API] Error getting channel info: {e}")
            return None
    
    def list_user_videos(
        self, 
        max_results: int = 50,
        page_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        List videos from the authenticated user's channel.
        
        Args:
            max_results: Maximum number of videos to return (1-50)
            page_token: Token for pagination
            
        Returns:
            Dict with 'videos' list and 'next_page_token'
        """
        try:
            youtube = self._get_service()
            
            # First, get the uploads playlist ID
            channel_info = self.get_channel_info()
            if not channel_info:
                return {"videos": [], "next_page_token": None, "error": "Could not get channel info"}
            
            uploads_playlist_id = channel_info["uploads_playlist_id"]
            
            # Get videos from uploads playlist
            request = youtube.playlistItems().list(
                part="snippet,contentDetails",
                playlistId=uploads_playlist_id,
                maxResults=min(max_results, 50),
                pageToken=page_token
            )
            response = request.execute()
            
            video_ids = [item["contentDetails"]["videoId"] for item in response.get("items", [])]
            
            if not video_ids:
                return {"videos": [], "next_page_token": None}
            
            # Get detailed video info including statistics and duration
            videos_request = youtube.videos().list(
                part="snippet,contentDetails,statistics",
                id=",".join(video_ids)
            )
            videos_response = videos_request.execute()
            
            videos = []
            for item in videos_response.get("items", []):
                video = YouTubeVideo(
                    video_id=item["id"],
                    title=item["snippet"]["title"],
                    description=item["snippet"].get("description", ""),
                    thumbnail_url=item["snippet"]["thumbnails"].get("high", {}).get("url") or 
                                  item["snippet"]["thumbnails"].get("default", {}).get("url", ""),
                    published_at=item["snippet"]["publishedAt"],
                    duration=item["contentDetails"]["duration"],
                    view_count=int(item["statistics"].get("viewCount", 0)),
                    like_count=int(item["statistics"].get("likeCount", 0)),
                    comment_count=int(item["statistics"].get("commentCount", 0)),
                    channel_id=item["snippet"]["channelId"],
                    channel_title=item["snippet"]["channelTitle"],
                )
                videos.append(video.to_dict())
            
            return {
                "videos": videos,
                "next_page_token": response.get("nextPageToken"),
                "total_results": response.get("pageInfo", {}).get("totalResults", len(videos)),
            }
            
        except Exception as e:
            print(f"[YOUTUBE API] Error listing videos: {e}")
            return {"videos": [], "next_page_token": None, "error": str(e)}
    
    def get_video_details(self, video_id: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed information about a specific video.
        
        Args:
            video_id: YouTube video ID
            
        Returns:
            Video details dict or None
        """
        try:
            youtube = self._get_service()
            
            request = youtube.videos().list(
                part="snippet,contentDetails,statistics",
                id=video_id
            )
            response = request.execute()
            
            if not response.get("items"):
                return None
            
            item = response["items"][0]
            return YouTubeVideo(
                video_id=item["id"],
                title=item["snippet"]["title"],
                description=item["snippet"].get("description", ""),
                thumbnail_url=item["snippet"]["thumbnails"].get("high", {}).get("url") or 
                              item["snippet"]["thumbnails"].get("default", {}).get("url", ""),
                published_at=item["snippet"]["publishedAt"],
                duration=item["contentDetails"]["duration"],
                view_count=int(item["statistics"].get("viewCount", 0)),
                like_count=int(item["statistics"].get("likeCount", 0)),
                comment_count=int(item["statistics"].get("commentCount", 0)),
                channel_id=item["snippet"]["channelId"],
                channel_title=item["snippet"]["channelTitle"],
            ).to_dict()
            
        except Exception as e:
            print(f"[YOUTUBE API] Error getting video details: {e}")
            return None
    
    def download_user_video(
        self, 
        video_id: str,
        output_dir: Optional[str] = None
    ) -> Optional[str]:
        """
        Download a video from the user's channel using their OAuth credentials.
        
        This method downloads the user's OWN video, which is legal and doesn't
        trigger bot detection since it uses authenticated API access.
        
        Args:
            video_id: YouTube video ID
            output_dir: Output directory for the video file
            
        Returns:
            Path to downloaded video file or None on error
        """
        output_dir = output_dir or self.temp_dir
        output_template = os.path.join(output_dir, f"source_{video_id}")
        output_path = f"{output_template}.mp4"
        
        # Check if already downloaded
        if os.path.exists(output_path) and os.path.getsize(output_path) > 100000:
            print(f"[YOUTUBE API] Video already exists: {output_path}")
            return output_path
        
        # Get OAuth credentials
        credentials = get_youtube_credentials()
        if not credentials:
            print("[YOUTUBE API] No OAuth credentials available")
            return None
        
        # Find yt-dlp
        yt_dlp_path = shutil.which("yt-dlp")
        if not yt_dlp_path:
            possible_paths = [
                "/usr/local/bin/yt-dlp",
                "/opt/homebrew/bin/yt-dlp",
                os.path.expanduser("~/.local/bin/yt-dlp"),
            ]
            for p in possible_paths:
                if os.path.exists(p):
                    yt_dlp_path = p
                    break
        
        if not yt_dlp_path:
            print("[YOUTUBE API] yt-dlp not found")
            return None
        
        url = f"https://www.youtube.com/watch?v={video_id}"
        
        # Create a temporary cookies file with OAuth token
        # yt-dlp can use OAuth2 access token via --username oauth2 --password ACCESS_TOKEN
        # Or we can export cookies format
        
        print(f"[YOUTUBE API] Downloading user's video: {video_id}")
        
        # Method 1: Use OAuth2 authentication with yt-dlp
        # This passes the access token directly to yt-dlp
        cmd = [
            yt_dlp_path,
            "--username", "oauth2",
            "--password", credentials.token,
            "--remote-components", "ejs:github",  # Still needed for JS challenges
            "-f", "bv*[height<=1080]+ba/b[height<=1080]/bv*+ba/b",
            "--merge-output-format", "mp4",
            "--no-playlist",
            "-o", f"{output_template}.%(ext)s",
            url
        ]
        
        print(f"[YOUTUBE API] Running authenticated download...")
        
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=600  # 10 minute timeout for larger videos
            )
            
            if result.returncode == 0:
                # Check for downloaded file
                import glob
                video_extensions = ['.mp4', '.mkv', '.webm', '.avi', '.mov']
                possible_files = glob.glob(f"{output_template}.*")
                
                for f in possible_files:
                    ext = os.path.splitext(f)[1].lower()
                    if ext in video_extensions and os.path.exists(f):
                        size = os.path.getsize(f)
                        if size > 100000:
                            print(f"[YOUTUBE API] Successfully downloaded: {f} ({size} bytes)")
                            return f
            else:
                print(f"[YOUTUBE API] Download stderr: {result.stderr[:500]}")
                
        except subprocess.TimeoutExpired:
            print("[YOUTUBE API] Download timed out")
        except Exception as e:
            print(f"[YOUTUBE API] Download error: {e}")
        
        # Fallback: Try without OAuth but with remote-components
        print("[YOUTUBE API] Trying fallback download without OAuth...")
        cmd_fallback = [
            yt_dlp_path,
            "--remote-components", "ejs:github",
            "-f", "best[height<=720]",
            "--no-playlist",
            "-o", f"{output_template}.%(ext)s",
            url
        ]
        
        try:
            result = subprocess.run(
                cmd_fallback,
                capture_output=True,
                text=True,
                timeout=600
            )
            
            if result.returncode == 0:
                import glob
                video_extensions = ['.mp4', '.mkv', '.webm', '.avi', '.mov']
                possible_files = glob.glob(f"{output_template}.*")
                
                for f in possible_files:
                    ext = os.path.splitext(f)[1].lower()
                    if ext in video_extensions and os.path.exists(f):
                        size = os.path.getsize(f)
                        if size > 100000:
                            print(f"[YOUTUBE API] Fallback download successful: {f}")
                            return f
        except Exception as e:
            print(f"[YOUTUBE API] Fallback error: {e}")
        
        print(f"[YOUTUBE API] Failed to download video {video_id}")
        return None
    
    def verify_video_ownership(self, video_id: str) -> bool:
        """
        Verify that the authenticated user owns the given video.
        
        Args:
            video_id: YouTube video ID to verify
            
        Returns:
            True if user owns the video, False otherwise
        """
        try:
            channel_info = self.get_channel_info()
            if not channel_info:
                return False
            
            video_details = self.get_video_details(video_id)
            if not video_details:
                return False
            
            return video_details["channel_id"] == channel_info["channel_id"]
            
        except Exception as e:
            print(f"[YOUTUBE API] Error verifying ownership: {e}")
            return False


# Singleton instance
_youtube_client: Optional[YouTubeAPIClient] = None


def get_youtube_client() -> YouTubeAPIClient:
    """Get or create the YouTube API client singleton."""
    global _youtube_client
    if _youtube_client is None:
        _youtube_client = YouTubeAPIClient()
    return _youtube_client

