from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from app.db.models import get_db_session
from app.v1.contracts.change_log import OutcomeStatus
from app.v1.models.review_outcome import ReviewOutcome


class ReviewOutcomeRepository:
    @staticmethod
    def upsert(
        *,
        review_id: str,
        status: OutcomeStatus,
        evaluated_at: Optional[datetime] = None,
    ) -> dict[str, Any]:
        with get_db_session() as session:
            existing = session.query(ReviewOutcome).filter(ReviewOutcome.review_id == review_id).first()
            if existing:
                existing.status = status
                existing.evaluated_at = evaluated_at
                existing.updated_at = datetime.utcnow()
                session.flush()
                return ReviewOutcomeRepository._to_dict(existing)

            record = ReviewOutcome(
                review_id=review_id,
                status=status,
                evaluated_at=evaluated_at,
            )
            session.add(record)
            session.flush()
            return ReviewOutcomeRepository._to_dict(record)

    @staticmethod
    def get(*, review_id: str) -> Optional[dict[str, Any]]:
        with get_db_session() as session:
            record = session.query(ReviewOutcome).filter(ReviewOutcome.review_id == review_id).first()
            return ReviewOutcomeRepository._to_dict(record) if record else None

    @staticmethod
    def _to_dict(record: ReviewOutcome) -> dict[str, Any]:
        return {
            "review_id": record.review_id,
            "status": record.status.value if record.status else None,
            "evaluated_at": record.evaluated_at,
            "created_at": record.created_at,
            "updated_at": record.updated_at,
        }
