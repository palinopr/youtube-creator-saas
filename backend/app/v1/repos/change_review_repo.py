from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from app.db.models import get_db_session
from app.v1.contracts.review import Confidence, ReviewVerdict, RiskLevel
from app.v1.models.change_review import ChangeReview


class ChangeReviewRepository:
    @staticmethod
    def create(
        *,
        id: str,
        channel_id: str,
        video_id: str,
        current_title: str,
        current_description: str,
        proposed_title: str,
        proposed_description: str,
        verdict: ReviewVerdict,
        risk_level: RiskLevel,
        confidence: Confidence,
        reasons: list[str],
        conservative_title_suggestion: Optional[str] = None,
        conservative_description_suggestion: Optional[str] = None,
        metadata: Optional[dict[str, Any]] = None,
        created_at: Optional[datetime] = None,
    ) -> dict[str, Any]:
        with get_db_session() as session:
            record = ChangeReview(
                id=id,
                channel_id=channel_id,
                video_id=video_id,
                current_title=current_title,
                current_description=current_description,
                proposed_title=proposed_title,
                proposed_description=proposed_description,
                verdict=verdict,
                risk_level=risk_level,
                confidence=confidence,
                reasons=reasons,
                conservative_title_suggestion=conservative_title_suggestion,
                conservative_description_suggestion=conservative_description_suggestion,
                review_metadata=metadata,
                created_at=created_at or datetime.utcnow(),
            )
            session.add(record)
            session.flush()
            return ChangeReviewRepository._to_dict(record)

    @staticmethod
    def get(*, id: str) -> Optional[dict[str, Any]]:
        with get_db_session() as session:
            record = session.query(ChangeReview).filter(ChangeReview.id == id).first()
            return ChangeReviewRepository._to_dict(record) if record else None

    @staticmethod
    def list_by_channel(*, channel_id: str, limit: int = 50) -> list[dict[str, Any]]:
        with get_db_session() as session:
            records = (
                session.query(ChangeReview)
                .filter(ChangeReview.channel_id == channel_id)
                .order_by(ChangeReview.created_at.desc())
                .limit(limit)
                .all()
            )
            return [ChangeReviewRepository._to_dict(r) for r in records]

    @staticmethod
    def _to_dict(record: ChangeReview) -> dict[str, Any]:
        outcome = None
        if record.outcome:
            outcome = {
                "review_id": record.outcome.review_id,
                "status": record.outcome.status.value if record.outcome.status else None,
                "evaluated_at": record.outcome.evaluated_at,
                "created_at": record.outcome.created_at,
                "updated_at": record.outcome.updated_at,
            }

        return {
            "id": record.id,
            "channel_id": record.channel_id,
            "video_id": record.video_id,
            "current_title": record.current_title,
            "current_description": record.current_description,
            "proposed_title": record.proposed_title,
            "proposed_description": record.proposed_description,
            "verdict": record.verdict.value if record.verdict else None,
            "risk_level": record.risk_level.value if record.risk_level else None,
            "confidence": record.confidence.value if record.confidence else None,
            "reasons": record.reasons,
            "conservative_title_suggestion": record.conservative_title_suggestion,
            "conservative_description_suggestion": record.conservative_description_suggestion,
            "metadata": record.review_metadata,
            "created_at": record.created_at,
            "outcome": outcome,
        }
