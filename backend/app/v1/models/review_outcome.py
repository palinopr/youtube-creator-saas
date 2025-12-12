from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, String, Index
from sqlalchemy.orm import relationship

from app.db.models import Base
from app.v1.contracts.change_log import OutcomeStatus


class ReviewOutcome(Base):
    """
    Async follow-up record captured later (simple V1).

    Mirrors `app.v1.contracts.change_log.ReviewOutcome`.
    """

    __tablename__ = "review_outcomes"

    review_id = Column(String(36), ForeignKey("change_reviews.id", ondelete="CASCADE"), primary_key=True)

    status = Column(Enum(OutcomeStatus, native_enum=False), nullable=False)
    evaluated_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    review = relationship("ChangeReview", back_populates="outcome", lazy="joined")

    __table_args__ = (Index("ix_review_outcomes_status_evaluated", "status", "evaluated_at"),)
