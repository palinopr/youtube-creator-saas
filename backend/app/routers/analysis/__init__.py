"""
Analysis routes package.

This package contains all channel analysis related endpoints split into logical modules:
- deep.py: Deep analysis endpoints (async job-based and synchronous)
- patterns.py: Pattern detection and top performers endpoints
- causal.py: Causal analytics (celebrity impact, success factors, etc.)
- insights.py: Content optimization and transcript analysis
- base.py: Shared Pydantic models
"""

from fastapi import APIRouter

from .deep import router as deep_router
from .patterns import router as patterns_router
from .causal import router as causal_router
from .insights import router as insights_router

# Create main analysis router with prefix
router = APIRouter(prefix="/api/analysis", tags=["analysis"])

# Include all sub-routers
router.include_router(deep_router)
router.include_router(patterns_router)
router.include_router(causal_router)
router.include_router(insights_router)

__all__ = ["router"]
