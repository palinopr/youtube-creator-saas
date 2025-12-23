"""
Admin routes - re-export from admin submodule for backward compatibility.

This file exists for backward compatibility. The admin routes have been
split into separate modules under app/routers/admin/:
- __init__.py: Main router combining all sub-routers + status, dashboard, activity-log
- users.py: User management, impersonation
- subscriptions.py: Subscription management
- analytics.py: Revenue, platform analytics, API cost tracking
- base.py: Shared Pydantic models and helper functions
"""

# Re-export router from the admin package
from .admin import router

__all__ = ["router"]
