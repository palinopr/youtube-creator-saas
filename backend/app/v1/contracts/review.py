from __future__ import annotations

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class ReviewVerdict(str, Enum):
    approve = "approve"
    warn = "warn"
    block = "block"


class RiskLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class Confidence(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class ReviewChangeInput(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True, strict=True)

    channel_id: str = Field(..., min_length=1)
    video_id: str = Field(..., min_length=1)

    current_title: str = Field(..., min_length=1, max_length=500)
    current_description: str = Field("", max_length=20_000)

    proposed_title: str = Field(..., min_length=1, max_length=500)
    proposed_description: str = Field("", max_length=20_000)


class ConservativeSuggestion(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True, strict=True)

    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = Field(None, min_length=1, max_length=20_000)

    @model_validator(mode="after")
    def _must_contain_at_least_one_field(self) -> "ConservativeSuggestion":
        if self.title is None and self.description is None:
            raise ValueError("conservative_suggestion must include title and/or description")
        return self


class ReviewMetadata(BaseModel):
    """
    Optional, small metadata payload.

    This is intentionally constrained: it may include a couple baseline comparison notes,
    but must not become a dumping ground for arbitrary data.
    """

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True, strict=True)

    compared_against: Optional[str] = Field(
        None,
        max_length=120,
        description="Short label like 'channel baseline' or 'format: Tutorials'.",
    )
    notes: List[str] = Field(
        default_factory=list,
        max_length=3,
        description="Optional, short baseline comparison notes (max 3).",
    )

    @field_validator("notes")
    @classmethod
    def _notes_small_and_single_line(cls, value: List[str]) -> List[str]:
        trimmed = [n.strip() for n in value if n and n.strip()]
        if len(trimmed) > 3:
            raise ValueError("metadata.notes must contain at most 3 items")
        for note in trimmed:
            if "\n" in note:
                raise ValueError("metadata.notes must be single-line strings")
            if len(note) > 200:
                raise ValueError("metadata.notes items must be concise (<= 200 chars)")
        return trimmed


class ReviewChangeOutput(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True, strict=True)

    verdict: ReviewVerdict
    risk_level: RiskLevel
    reasons: List[str] = Field(..., min_length=1, max_length=3)
    confidence: Confidence
    conservative_suggestion: Optional[ConservativeSuggestion] = None
    metadata: Optional[ReviewMetadata] = None

    @field_validator("reasons")
    @classmethod
    def _reasons_plain_english_and_bounded(cls, value: List[str]) -> List[str]:
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
