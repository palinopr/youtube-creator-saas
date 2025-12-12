import os
import sys
import uuid
from datetime import UTC, datetime
from pathlib import Path


def main() -> None:
    os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
    backend_root = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(backend_root))

    from app.v1.contracts.change_log import OutcomeStatus
    from app.v1.contracts.review import Confidence, ReviewVerdict, RiskLevel
    from app.v1.repos.channel_memory_repo import ChannelMemoryRepository
    from app.v1.repos.change_review_repo import ChangeReviewRepository
    from app.v1.repos.review_outcome_repo import ReviewOutcomeRepository

    now = datetime.now(UTC).replace(tzinfo=None)
    channel_id = "UC_TEST"
    video_id = "VIDEO_TEST"

    cm = ChannelMemoryRepository.upsert(
        channel_id=channel_id,
        memory_version=1,
        built_at=now,
        provenance={"source_video_count": 0, "source_last_published_at": None, "transcript_coverage_ratio": 0.0},
        title_baseline={
            "char_len": {"min": 1, "p50": 2, "p90": 3, "max": 4},
            "word_len": {"min": 1, "p50": 2, "p90": 3, "max": 4},
            "casing_style": "title",
            "emoji_rate": 0.0,
            "has_episode_marker_rate": 0.0,
            "common_prefixes": [],
            "common_suffixes": [],
        },
        description_baseline={
            "char_len": {"min": 1, "p50": 2, "p90": 3, "max": 4},
            "has_links_rate": 0.0,
            "required_blocks": [],
            "common_section_headings": [],
        },
        format_signatures=[],
        channel_summary="Test channel summary",
    )
    assert cm["channel_id"] == channel_id
    assert cm["memory_version"] == 1

    review_id = str(uuid.uuid4())
    review = ChangeReviewRepository.create(
        id=review_id,
        channel_id=channel_id,
        video_id=video_id,
        current_title="Current",
        current_description="Current desc",
        proposed_title="Proposed",
        proposed_description="Proposed desc",
        verdict=ReviewVerdict.approve,
        risk_level=RiskLevel.low,
        confidence=Confidence.high,
        reasons=["Looks safe"],
    )
    assert review["id"] == review_id
    assert review["verdict"] == "approve"

    outcome = ReviewOutcomeRepository.upsert(review_id=review_id, status=OutcomeStatus.unknown, evaluated_at=None)
    assert outcome["review_id"] == review_id
    assert outcome["status"] == "unknown"

    fetched = ChangeReviewRepository.get(id=review_id)
    assert fetched is not None
    assert fetched["outcome"] is not None
    assert fetched["outcome"]["status"] == "unknown"

    print("OK: V1 DB smoke check passed")


if __name__ == "__main__":
    main()
