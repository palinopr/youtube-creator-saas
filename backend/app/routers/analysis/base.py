"""
Analysis base - shared Pydantic models and helper functions.
"""

from pydantic import BaseModel
from typing import Optional, List


# =============================================================================
# Pydantic Models
# =============================================================================

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
