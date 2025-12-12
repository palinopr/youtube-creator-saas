from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from app.db.models import get_db_session
from app.v1.models.channel_memory import ChannelMemory


class ChannelMemoryRepository:
    @staticmethod
    def upsert(
        *,
        channel_id: str,
        memory_version: int,
        built_at: datetime,
        provenance: dict[str, Any],
        title_baseline: dict[str, Any],
        description_baseline: dict[str, Any],
        format_signatures: list[dict[str, Any]],
        channel_summary: Optional[str] = None,
    ) -> dict[str, Any]:
        with get_db_session() as session:
            existing = (
                session.query(ChannelMemory)
                .filter(ChannelMemory.channel_id == channel_id, ChannelMemory.memory_version == memory_version)
                .first()
            )
            if existing:
                existing.built_at = built_at
                existing.provenance = provenance
                existing.title_baseline = title_baseline
                existing.description_baseline = description_baseline
                existing.format_signatures = format_signatures
                existing.channel_summary = channel_summary
                session.flush()
                return ChannelMemoryRepository._to_dict(existing)

            record = ChannelMemory(
                channel_id=channel_id,
                memory_version=memory_version,
                built_at=built_at,
                provenance=provenance,
                title_baseline=title_baseline,
                description_baseline=description_baseline,
                format_signatures=format_signatures,
                channel_summary=channel_summary,
            )
            session.add(record)
            session.flush()
            return ChannelMemoryRepository._to_dict(record)

    @staticmethod
    def get_latest(*, channel_id: str) -> Optional[dict[str, Any]]:
        with get_db_session() as session:
            record = (
                session.query(ChannelMemory)
                .filter(ChannelMemory.channel_id == channel_id)
                .order_by(ChannelMemory.memory_version.desc())
                .first()
            )
            return ChannelMemoryRepository._to_dict(record) if record else None

    @staticmethod
    def get_by_version(*, channel_id: str, memory_version: int) -> Optional[dict[str, Any]]:
        with get_db_session() as session:
            record = (
                session.query(ChannelMemory)
                .filter(ChannelMemory.channel_id == channel_id, ChannelMemory.memory_version == memory_version)
                .first()
            )
            return ChannelMemoryRepository._to_dict(record) if record else None

    @staticmethod
    def delete_by_version(*, channel_id: str, memory_version: int) -> bool:
        with get_db_session() as session:
            record = (
                session.query(ChannelMemory)
                .filter(ChannelMemory.channel_id == channel_id, ChannelMemory.memory_version == memory_version)
                .first()
            )
            if not record:
                return False
            session.delete(record)
            return True

    @staticmethod
    def _to_dict(record: ChannelMemory) -> dict[str, Any]:
        return {
            "id": record.id,
            "channel_id": record.channel_id,
            "memory_version": record.memory_version,
            "built_at": record.built_at,
            "provenance": record.provenance,
            "title_baseline": record.title_baseline,
            "description_baseline": record.description_baseline,
            "format_signatures": record.format_signatures,
            "channel_summary": record.channel_summary,
            "created_at": record.created_at,
            "updated_at": record.updated_at,
        }

