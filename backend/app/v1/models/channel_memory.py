import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, JSON, String, Text, UniqueConstraint, Index

from app.db.models import Base


class ChannelMemory(Base):
    """
    Durable channel memory: baselines + patterns used to conservatively review changes.

    Mirrors `app.v1.contracts.channel_memory.ChannelMemory`.
    """

    __tablename__ = "channel_memory"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    channel_id = Column(String(50), nullable=False, index=True)
    memory_version = Column(Integer, nullable=False)
    built_at = Column(DateTime, nullable=False)

    provenance = Column(JSON, nullable=False)
    title_baseline = Column(JSON, nullable=False)
    description_baseline = Column(JSON, nullable=False)
    format_signatures = Column(JSON, nullable=False, default=list)

    channel_summary = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("channel_id", "memory_version", name="uq_channel_memory_channel_version"),
        Index("ix_channel_memory_channel_built_at", "channel_id", "built_at"),
    )

