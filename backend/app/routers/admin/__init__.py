"""
Admin routes for internal business tools.

These endpoints are only accessible to users with is_admin=True.
Used for business metrics, user management, and other internal tools.

This module combines all admin sub-routers:
- users: User management, impersonation
- subscriptions: Subscription management
- analytics: Revenue, platform analytics, API cost tracking
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from datetime import datetime, timedelta
from sqlalchemy import func, desc
from sqlalchemy.orm import Session, joinedload

from ...auth.dependencies import require_admin, get_db
from ...db.models import (
    User, Subscription, AdminActivityLog, AdminActionType,
    PlanTier, SubscriptionStatus,
)

# Import sub-routers
from .users import router as users_router
from .subscriptions import router as subscriptions_router
from .analytics import router as analytics_router

# Create main admin router
router = APIRouter(prefix="/api/admin", tags=["admin"])

# Include all sub-routers
router.include_router(users_router)
router.include_router(subscriptions_router)
router.include_router(analytics_router)


# =============================================================================
# Health & Status
# =============================================================================

@router.get("/status")
async def admin_status(user: User = Depends(require_admin)):
    """Check admin panel status."""
    return {
        "admin": True,
        "user": user.email,
    }


# =============================================================================
# Admin Activity Log
# =============================================================================

@router.get("/activity-log")
async def get_admin_activity_log(
    admin_id: Optional[str] = None,
    action_type: Optional[str] = None,
    target_user_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get admin activity log for audit purposes."""
    query = db.query(AdminActivityLog).options(
        joinedload(AdminActivityLog.admin_user),
        joinedload(AdminActivityLog.target_user)
    )

    if admin_id:
        query = query.filter(AdminActivityLog.admin_user_id == admin_id)

    if action_type:
        try:
            action = AdminActionType(action_type)
            query = query.filter(AdminActivityLog.action_type == action)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid action type: {action_type}")

    if target_user_id:
        query = query.filter(AdminActivityLog.target_user_id == target_user_id)

    if start_date:
        try:
            start = datetime.fromisoformat(start_date)
            query = query.filter(AdminActivityLog.created_at >= start)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format")

    if end_date:
        try:
            end = datetime.fromisoformat(end_date)
            query = query.filter(AdminActivityLog.created_at <= end)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format")

    total = query.count()
    offset = (page - 1) * per_page
    logs = query.order_by(desc(AdminActivityLog.created_at)).offset(offset).limit(per_page).all()

    # Format logs to match frontend's ActivityLog interface
    formatted_logs = []
    for log in logs:
        formatted_logs.append({
            "id": log.id,
            "admin_user_id": log.admin_user_id,
            "admin_name": log.admin_user.name if log.admin_user else "Unknown",
            "admin_email": log.admin_user.email if log.admin_user else "unknown@unknown.com",
            "action_type": log.action_type.value if log.action_type else "unknown",
            "target_user_id": log.target_user_id,
            "target_user_email": log.target_user.email if log.target_user else None,
            "description": log.description,
            "old_value": log.old_value,
            "new_value": log.new_value,
            "ip_address": log.ip_address,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        })

    return {
        "items": formatted_logs,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page,
    }


# =============================================================================
# Dashboard Overview
# =============================================================================

@router.get("/dashboard")
async def get_admin_dashboard(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get admin dashboard overview data."""
    now = datetime.utcnow()
    day_ago = now - timedelta(days=1)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    # User stats
    total_users = db.query(User).filter(User.deleted_at.is_(None)).count()
    new_users_today = db.query(User).filter(User.created_at >= day_ago).count()
    new_users_week = db.query(User).filter(User.created_at >= week_ago).count()
    new_users_month = db.query(User).filter(User.created_at >= month_ago).count()
    active_today = db.query(User).filter(User.last_login_at >= day_ago).count()
    suspended_users = db.query(User).filter(User.suspended_at.isnot(None)).count()

    # Subscription stats
    plan_counts = db.query(
        Subscription.plan_id,
        func.count(Subscription.id)
    ).filter(
        Subscription.status == SubscriptionStatus.ACTIVE
    ).group_by(Subscription.plan_id).all()

    subscribers_by_plan = {plan.value: count for plan, count in plan_counts}
    plan_prices = {"free": 0, "starter": 19, "pro": 49, "agency": 149}
    mrr = sum(subscribers_by_plan.get(plan, 0) * price for plan, price in plan_prices.items())

    # Count paid vs trial subscriptions
    paid_subscribers = db.query(Subscription).filter(
        Subscription.status == SubscriptionStatus.ACTIVE,
        Subscription.plan_id != PlanTier.FREE
    ).count()

    trial_subscribers = db.query(Subscription).filter(
        Subscription.status == SubscriptionStatus.TRIALING
    ).count()

    # Recent activity
    recent_activity = db.query(AdminActivityLog).options(
        joinedload(AdminActivityLog.admin_user)
    ).order_by(desc(AdminActivityLog.created_at)).limit(10).all()

    return {
        "users": {
            "total": total_users,
            "new_today": new_users_today,
            "new_this_week": new_users_week,
            "new_this_month": new_users_month,
            "active_today": active_today,
            "suspended": suspended_users,
        },
        "subscriptions": {
            "by_plan": subscribers_by_plan,
            "active_paid": paid_subscribers,
            "trial": trial_subscribers,
        },
        "revenue": {
            "mrr": mrr,
            "arr": mrr * 12,
        },
        "system": {
            "pending_jobs": 0,  # No job tracking table currently
            "failed_jobs_24h": 0,
            "api_calls_today": 0,
        },
        "recent_activity": [
            {
                "admin_name": log.admin_user.name if log.admin_user else "Unknown",
                "action_type": log.action_type.value if log.action_type else "unknown",
                "description": log.description,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in recent_activity
        ],
    }
