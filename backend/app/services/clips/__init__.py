"""
Clips services package.

Provides modular services for AI-powered viral short clip generation.

Usage:
    from app.services.clips import FrankenBiteDetector, ClipRenderer

    # Detect clips in a transcript
    detector = FrankenBiteDetector()
    suggestions = await detector.detect_clips(transcript, title, word_timestamps)

    # Render a clip
    renderer = ClipRenderer(credentials_data=user_credentials)
    output_path = await renderer.render_clip(video_id, clip_id, segments)
"""

from .types import (
    VideoSource,
    ZoomLevel,
    ClipSegment,
    ClipSuggestion,
    WordTimestamp,
    OPENCV_AVAILABLE,
)
from .detector import FrankenBiteDetector
from .renderer import ClipRenderer

__all__ = [
    # Types and enums
    "VideoSource",
    "ZoomLevel",
    "ClipSegment",
    "ClipSuggestion",
    "WordTimestamp",
    "OPENCV_AVAILABLE",
    # Main classes
    "FrankenBiteDetector",
    "ClipRenderer",
]
