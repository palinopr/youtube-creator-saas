# Backward compatibility: Re-export clips services from new location
# The original clips_generator.py is now split into:
#   - app/services/clips/types.py (VideoSource, ZoomLevel, dataclasses)
#   - app/services/clips/detector.py (FrankenBiteDetector)
#   - app/services/clips/renderer.py (ClipRenderer)
#
# For new code, import directly from app.services.clips

from ..services.clips import (
    # Types and enums
    VideoSource,
    ZoomLevel,
    ClipSegment,
    ClipSuggestion,
    WordTimestamp,
    OPENCV_AVAILABLE,
    # Main classes
    FrankenBiteDetector,
    ClipRenderer,
)

__all__ = [
    "VideoSource",
    "ZoomLevel",
    "ClipSegment",
    "ClipSuggestion",
    "WordTimestamp",
    "OPENCV_AVAILABLE",
    "FrankenBiteDetector",
    "ClipRenderer",
]
