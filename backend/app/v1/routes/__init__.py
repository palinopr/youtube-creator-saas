"""V1 routers (thin, event-driven actions)."""

from fastapi import APIRouter

from .change_log import router as change_log_router
from .review import router as review_router

router = APIRouter(prefix="/api/v1", tags=["v1"])
router.include_router(review_router)
router.include_router(change_log_router)
