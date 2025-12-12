from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .review import Confidence, RiskLevel, ReviewVerdict


class ObjectType(str, Enum):
    video = "video"


class OutcomeStatus(str, Enum):
    unknown = "unknown"
    positive = "positive"
    neutral = "neutral"
    negative = "negative"


class VideoFields(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    title: str = Field(..., min_length=1, max_length=500)
    description: str = Field("", max_length=20_000)


class ChangeLogEntry(BaseModel):
    """
    Change Log entry: the durable record of "what was reviewed" and "what happened later".
    """

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    review_id: str = Field(..., min_length=1)

    object_type: ObjectType = ObjectType.video
    object_id: str = Field(..., min_length=1, description="For videos, this is the YouTube video id.")

    before: VideoFields
    after: VideoFields

    verdict: ReviewVerdict
    risk_level: RiskLevel
    confidence: Confidence
    reasons: List[str] = Field(..., min_length=1, max_length=3)

    created_at: datetime

    outcome_status: OutcomeStatus = OutcomeStatus.unknown
    evaluated_at: Optional[datetime] = None

    @field_validator("reasons")
    @classmethod
    def _reasons_small_and_single_line(cls, value: List[str]) -> List[str]:
        trimmed = [r.strip() for r in value if r and r.strip()]
        if not trimmed:
            raise ValueError("reasons must contain at least one non-empty item")
        if len(trimmed) > 3:
            raise ValueError("reasons must contain at most 3 items")
        for reason in trimmed:
            if "\n" in reason:
                raise ValueError("each reason must be a single line")
            if len(reason) > 240:
                raise ValueError("each reason must be concise (<= 240 chars)")
        return trimmed
