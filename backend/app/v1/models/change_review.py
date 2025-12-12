import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, JSON, String, Text, Index
from sqlalchemy.orm import relationship

from app.db.models import Base
from app.v1.contracts.review import Confidence, ReviewVerdict, RiskLevel


class ChangeReview(Base):
    """
    Persisted record of a review.

    Mirrors `app.v1.contracts.change_log.ReviewLogEntry`.
    """

    __tablename__ = "change_reviews"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    channel_id = Column(String(50), nullable=False, index=True)
    video_id = Column(String(50), nullable=False, index=True)

    current_title = Column(String(500), nullable=False)
    current_description = Column(Text, nullable=False, default="")
    proposed_title = Column(String(500), nullable=False)
    proposed_description = Column(Text, nullable=False, default="")

    verdict = Column(Enum(ReviewVerdict, native_enum=False), nullable=False)
    risk_level = Column(Enum(RiskLevel, native_enum=False), nullable=False)
    confidence = Column(Enum(Confidence, native_enum=False), nullable=False)
    reasons = Column(JSON, nullable=False, default=list)

    conservative_title_suggestion = Column(String(500), nullable=True)
    conservative_description_suggestion = Column(Text, nullable=True)
    review_metadata = Column("metadata", JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    outcome = relationship(
        "ReviewOutcome",
        back_populates="review",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="joined",
    )

    __table_args__ = (
        Index("ix_change_reviews_channel_video_created", "channel_id", "video_id", "created_at"),
    )
