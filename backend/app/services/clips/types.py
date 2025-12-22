"""
Clips types - dataclasses and enums for clip generation.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional


# Try to import OpenCV for face detection (optional dependency)
try:
    import cv2
    import numpy as np
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False
    print("[CLIPS] Warning: OpenCV not installed. Face detection disabled. Run: pip install opencv-python")


class VideoSource(Enum):
    """Source of the video to process."""
    YOUTUBE_OAUTH = "youtube_oauth"  # Download via user's OAuth (SaaS mode)
    YOUTUBE_PUBLIC = "youtube_public"  # Download via yt-dlp (testing/fallback)
    LOCAL_FILE = "local_file"  # Pre-downloaded local file


class ZoomLevel(Enum):
    """Zoom levels for dynamic jump cut technique."""
    STANDARD = 1.0      # 100% - Hook and odd segments
    ZOOMED = 1.15       # 115% - Body segments (hides jump cuts)
    CLOSE = 1.25        # 125% - For dramatic emphasis (optional)


@dataclass
class ClipSegment:
    """Represents a segment of video to include in a clip."""
    start_time: float  # seconds
    end_time: float    # seconds
    text: str
    segment_type: str  # 'hook', 'body', 'loop_ending'
    zoom_level: float = field(default=1.0)  # Dynamic zoom for jump cut hiding


@dataclass
class ClipSuggestion:
    """A complete clip suggestion with all segments."""
    clip_id: str
    title: str
    hook: ClipSegment
    body_segments: List[ClipSegment]
    loop_ending: Optional[ClipSegment]
    total_duration: float
    viral_score: int  # 0-100
    why_viral: str


@dataclass
class WordTimestamp:
    """Word with its timing information."""
    word: str
    start: float
    end: float
