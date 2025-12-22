"""
Admin subscription management endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from typing import Optional
from datetime import datetime
from sqlalchemy import desc
from sqlalchemy.orm import Session, joinedload

from ...auth.dependencies import require_admin, get_db
from ...db.models import (
    User, Subscription, AdminActionType,
    PlanTier, SubscriptionStatus,
)
from .base import SubscriptionUpdateRequest, log_admin_action, get_client_ip

router = APIRouter(tags=["admin-subscriptions"])


@router.get("/subscriptions")
async def list_subscriptions(
    status: Optional[str] = Query(None, regex="^(active|canceled|past_due|trialing|all)$"),
    plan: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List all subscriptions with filters."""
    query = db.query(Subscription).options(joinedload(Subscription.user))

    if status and status != "all":
        query = query.filter(Subscription.status == status)

    if plan:
        query = query.filter(Subscription.plan_id == plan)

    total = query.count()
    offset = (page - 1) * per_page
    subscriptions = query.order_by(desc(Subscription.created_at)).offset(offset).limit(per_page).all()

    # Format to match frontend Subscription interface
    formatted_subscriptions = []
    for sub in subscriptions:
        formatted_subscriptions.append({
            "user_id": sub.user_id,
            "user_email": sub.user.email if sub.user else None,
            "user_name": sub.user.name if sub.user else None,
            "plan": sub.plan_id.value if sub.plan_id else "free",
            "status": sub.status.value if sub.status else "active",
            "stripe_customer_id": sub.stripe_customer_id,
            "stripe_subscription_id": sub.stripe_subscription_id,
            "current_period_start": sub.current_period_start.isoformat() if sub.current_period_start else None,
            "current_period_end": sub.current_period_end.isoformat() if sub.current_period_end else None,
            "cancel_at_period_end": sub.cancel_at_period_end or False,
            "created_at": sub.created_at.isoformat() if sub.created_at else None,
            "monthly_usage": {
                "clips_generated": sub.clips_generated_this_month or 0,
                "seo_analyses": sub.videos_analyzed_this_month or 0,
                "agent_queries": sub.ai_queries_this_month or 0,
            },
        })

    return {
        "items": formatted_subscriptions,  # Frontend expects "items"
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page,  # Frontend expects "pages"
    }


@router.put("/users/{user_id}/subscription")
async def update_user_subscription(
    request: Request,
    user_id: str,
    subscription_update: SubscriptionUpdateRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Manually update a user's subscription (admin override)."""
    user = db.query(User).options(joinedload(User.subscription)).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    sub = user.subscription
    if not sub:
        raise HTTPException(status_code=404, detail="User has no subscription")

    old_values = sub.to_dict()
    changes = {}

    if subscription_update.plan_id is not None:
        try:
            new_plan = PlanTier(subscription_update.plan_id)
            changes["plan_id"] = {"old": sub.plan_id.value, "new": new_plan.value}
            sub.plan_id = new_plan
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid plan: {subscription_update.plan_id}")

    if subscription_update.status is not None:
        try:
            new_status = SubscriptionStatus(subscription_update.status)
            changes["status"] = {"old": sub.status.value, "new": new_status.value}
            sub.status = new_status
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {subscription_update.status}")

    if subscription_update.videos_analyzed_this_month is not None:
        changes["videos_analyzed"] = {"old": sub.videos_analyzed_this_month, "new": subscription_update.videos_analyzed_this_month}
        sub.videos_analyzed_this_month = subscription_update.videos_analyzed_this_month

    if subscription_update.ai_queries_this_month is not None:
        changes["ai_queries"] = {"old": sub.ai_queries_this_month, "new": subscription_update.ai_queries_this_month}
        sub.ai_queries_this_month = subscription_update.ai_queries_this_month

    if subscription_update.clips_generated_this_month is not None:
        changes["clips_generated"] = {"old": sub.clips_generated_this_month, "new": subscription_update.clips_generated_this_month}
        sub.clips_generated_this_month = subscription_update.clips_generated_this_month

    if changes:
        sub.updated_at = datetime.utcnow()
        db.commit()

        log_admin_action(
            db=db,
            admin_user=admin,
            action_type=AdminActionType.SUBSCRIPTION_OVERRIDE,
            description=f"Updated subscription for {user.email}: {', '.join(changes.keys())}. Notes: {subscription_update.notes or 'None'}",
            target_user_id=user_id,
            target_resource="subscription",
            target_resource_id=sub.id,
            old_value=old_values,
            new_value=sub.to_dict(),
            ip_address=get_client_ip(request),
        )

    return {"subscription": sub.to_dict(), "changes": changes}


@router.post("/users/{user_id}/subscription/reset-usage")
async def reset_user_usage(
    request: Request,
    user_id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Reset a user's monthly usage counters."""
    user = db.query(User).options(joinedload(User.subscription)).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    sub = user.subscription
    if not sub:
        raise HTTPException(status_code=404, detail="User has no subscription")

    old_usage = {
        "videos_analyzed": sub.videos_analyzed_this_month,
        "ai_queries": sub.ai_queries_this_month,
        "clips_generated": sub.clips_generated_this_month,
    }

    sub.videos_analyzed_this_month = 0
    sub.ai_queries_this_month = 0
    sub.clips_generated_this_month = 0
    sub.usage_reset_at = datetime.utcnow()
    db.commit()

    log_admin_action(
        db=db,
        admin_user=admin,
        action_type=AdminActionType.USAGE_RESET,
        description=f"Reset usage for {user.email}",
        target_user_id=user_id,
        target_resource="subscription",
        old_value=old_usage,
        new_value={"videos_analyzed": 0, "ai_queries": 0, "clips_generated": 0},
        ip_address=get_client_ip(request),
    )

    return {"message": f"Usage reset for {user.email}", "subscription": sub.to_dict()}
