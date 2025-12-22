import uuid

from fastapi import APIRouter, Depends

from ..contracts.review import ReviewChangeInput, ReviewChangeOutput
from ..repos.change_review_repo import ChangeReviewRepository
from ..services.review_service import ReviewService
from ...auth.dependencies import get_current_user, verify_channel_ownership
from ...db.models import User

router = APIRouter()


def get_review_service() -> ReviewService:
    return ReviewService()


@router.post("/review", response_model=ReviewChangeOutput)
async def review_change(
    request: ReviewChangeInput,
    user: User = Depends(get_current_user),
    service: ReviewService = Depends(get_review_service),
) -> ReviewChangeOutput:
    verify_channel_ownership(user, request.channel_id)
    output = service.review_change(request)

    review_id = str(uuid.uuid4())
    ChangeReviewRepository.create(
        id=review_id,
        channel_id=request.channel_id,
        video_id=request.video_id,
        current_title=request.current_title,
        current_description=request.current_description,
        proposed_title=request.proposed_title,
        proposed_description=request.proposed_description,
        verdict=output.verdict,
        risk_level=output.risk_level,
        confidence=output.confidence,
        reasons=output.reasons,
        conservative_title_suggestion=(
            output.conservative_suggestion.title if output.conservative_suggestion else None
        ),
        conservative_description_suggestion=(
            output.conservative_suggestion.description if output.conservative_suggestion else None
        ),
        metadata=(output.metadata.model_dump() if output.metadata else None),
    )

    return output
