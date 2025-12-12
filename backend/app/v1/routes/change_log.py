from typing import Any, Optional

from fastapi import APIRouter, Depends, Query

from ...auth.dependencies import get_current_user, verify_channel_ownership
from ...db.models import User
from ..contracts.change_log import ChangeLogEntry, ObjectType, OutcomeStatus, VideoFields
from ..contracts.review import Confidence, ReviewVerdict, RiskLevel
from ..repos.change_review_repo import ChangeReviewRepository

router = APIRouter()


def _to_change_log_entry(record: dict[str, Any]) -> ChangeLogEntry:
    outcome = record.get("outcome") or {}
    outcome_status = OutcomeStatus.unknown
    evaluated_at: Optional[Any] = None

    if isinstance(outcome, dict):
        status = outcome.get("status")
        if status:
            outcome_status = OutcomeStatus(status)
        evaluated_at = outcome.get("evaluated_at")

    return ChangeLogEntry(
        review_id=record["id"],
        object_type=ObjectType.video,
        object_id=record["video_id"],
        before=VideoFields(
            title=record["current_title"],
            description=record.get("current_description") or "",
        ),
        after=VideoFields(
            title=record["proposed_title"],
            description=record.get("proposed_description") or "",
        ),
        verdict=ReviewVerdict(record["verdict"]),
        risk_level=RiskLevel(record["risk_level"]),
        confidence=Confidence(record["confidence"]),
        reasons=record["reasons"],
        created_at=record["created_at"],
        outcome_status=outcome_status,
        evaluated_at=evaluated_at,
    )


@router.get("/change-log", response_model=list[ChangeLogEntry])
async def list_change_log(
    channel_id: str = Query(..., min_length=1),
    limit: int = Query(default=50, ge=1, le=200),
    user: User = Depends(get_current_user),
) -> list[ChangeLogEntry]:
    verify_channel_ownership(user, channel_id)
    records = ChangeReviewRepository.list_by_channel(channel_id=channel_id, limit=limit)
    return [_to_change_log_entry(r) for r in records]

