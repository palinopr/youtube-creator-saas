from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class Platform(str, Enum):
    youtube = "youtube"


class FormatCluster(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    name: str = Field(..., min_length=1, max_length=120)
    criteria_summary: str = Field(
        ...,
        min_length=1,
        max_length=600,
        description="Short explanation of what qualifies a video for this format.",
    )


class NumberRange(BaseModel):
    model_config = ConfigDict(extra="forbid")

    low: float
    high: float

    @model_validator(mode="after")
    def _low_le_high(self) -> "NumberRange":
        if self.low > self.high:
            raise ValueError("range must satisfy low <= high")
        return self


class FormatBaseline(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    format_name: str = Field(..., min_length=1, max_length=120)
    ctr_range: NumberRange = Field(
        ...,
        description="Click-through rate range (ratio 0..1).",
    )
    avd_range: NumberRange = Field(
        ...,
        description="Average view duration range (seconds).",
    )
    retention_notes: str = Field(
        ...,
        min_length=1,
        max_length=1200,
        description="Short, human-readable retention/shape notes for this format.",
    )


class TitlePatternGroup(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    winners: List[str] = Field(default_factory=list, max_length=25)
    losers: List[str] = Field(default_factory=list, max_length=25)

    @field_validator("winners", "losers")
    @classmethod
    def _patterns_single_line(cls, value: List[str]) -> List[str]:
        trimmed = [p.strip() for p in value if p and p.strip()]
        for pattern in trimmed:
            if "\n" in pattern:
                raise ValueError("title patterns must be single-line strings")
            if len(pattern) > 160:
                raise ValueError("title patterns must be concise (<= 160 chars)")
        return trimmed


class ChannelMemory(BaseModel):
    """
    Channel Memory is the V1 “institutional memory” artifact used for conservative reviews.
    It is built asynchronously and refreshed only on events.
    """

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    channel_id: str = Field(..., min_length=1)
    platform: Platform = Platform.youtube

    video_count_analyzed: int = Field(..., ge=0)

    format_clusters: List[FormatCluster] = Field(default_factory=list, max_length=30)
    baselines: List[FormatBaseline] = Field(default_factory=list, max_length=50)

    common_title_patterns: TitlePatternGroup
    common_description_structure_issues: List[str] = Field(default_factory=list, max_length=25)

    last_updated: datetime

    @field_validator("common_description_structure_issues")
    @classmethod
    def _issues_small_and_single_line(cls, value: List[str]) -> List[str]:
        trimmed = [i.strip() for i in value if i and i.strip()]
        for issue in trimmed:
            if "\n" in issue:
                raise ValueError("description structure issues must be single-line strings")
            if len(issue) > 200:
                raise ValueError("description structure issues must be concise (<= 200 chars)")
        return trimmed
