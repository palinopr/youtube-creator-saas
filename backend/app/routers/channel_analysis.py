"""
Channel analysis routes - re-export from analysis submodule for backward compatibility.

This file exists for backward compatibility. The analysis routes have been
split into separate modules under app/routers/analysis/:
- __init__.py: Main router combining all sub-routers
- deep.py: Deep analysis endpoints (async job-based and synchronous)
- patterns.py: Pattern detection and top performers endpoints
- causal.py: Causal analytics (celebrity impact, success factors, etc.)
- insights.py: Content optimization and transcript analysis
- base.py: Shared Pydantic models
"""

# Re-export router from the analysis package
from .analysis import router

__all__ = ["router"]
