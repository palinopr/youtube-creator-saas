from fastapi import APIRouter, Depends

from ..contracts.review import ReviewChangeInput, ReviewChangeOutput
from ..services.review_service import ReviewService
from ...auth.dependencies import get_current_user
from ...db.models import User

router = APIRouter()


def get_review_service() -> ReviewService:
    return ReviewService()


@router.post("/review", response_model=ReviewChangeOutput)
async def review_change(
    request: ReviewChangeInput,
    _: User = Depends(get_current_user),
    service: ReviewService = Depends(get_review_service),
) -> ReviewChangeOutput:
    return service.review_change(request)
