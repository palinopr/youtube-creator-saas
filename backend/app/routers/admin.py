"""
Admin routes for internal business tools.

These endpoints are only accessible to users with is_admin=True.
Used for SEO tracking, business metrics, user management, and other internal tools.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timedelta
from sqlalchemy import func, desc, asc, or_
from sqlalchemy.orm import Session, joinedload
import logging
import hashlib
import secrets

from ..auth.dependencies import require_admin, get_db
from ..db.models import (
    User, Subscription, YouTubeChannel,
    AdminActivityLog, AdminActionType, ImpersonationSession,
    PlanTier, SubscriptionStatus, Job, JobType, JobStatus,
    APIUsage, AgentType, OPENAI_PRICING, IS_SQLITE
)
from ..services.serpbear import (
    serpbear_client,
    get_seo_rankings,
    is_serpbear_running
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])


# =============================================================================
# Pydantic Models
# =============================================================================

class AddDomainRequest(BaseModel):
    domain: str


class AddKeywordRequest(BaseModel):
    domain_id: int
    keyword: str
    device: str = "desktop"
    country: str = "US"


class AddKeywordsBulkRequest(BaseModel):
    domain_id: int
    keywords: list[str]
    device: str = "desktop"
    country: str = "US"


# User Management Models
class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    is_admin: Optional[bool] = None


class SuspendUserRequest(BaseModel):
    reason: str = Field(..., min_length=10, max_length=500)


class ImpersonateRequest(BaseModel):
    reason: str = Field(..., min_length=10, max_length=500)
    duration_minutes: int = Field(default=30, ge=5, le=120)


class SubscriptionUpdateRequest(BaseModel):
    plan_id: Optional[str] = None
    status: Optional[str] = None
    videos_analyzed_this_month: Optional[int] = None
    ai_queries_this_month: Optional[int] = None
    clips_generated_this_month: Optional[int] = None
    notes: Optional[str] = None  # Admin notes for audit


# =============================================================================
# Helper Functions
# =============================================================================

def log_admin_action(
    db: Session,
    admin_user: User,
    action_type: AdminActionType,
    description: str,
    target_user_id: Optional[str] = None,
    target_resource: Optional[str] = None,
    target_resource_id: Optional[str] = None,
    old_value: Optional[dict] = None,
    new_value: Optional[dict] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
):
    """Log an admin action to the audit trail."""
    log_entry = AdminActivityLog(
        admin_user_id=admin_user.id,
        action_type=action_type,
        target_user_id=target_user_id,
        target_resource=target_resource,
        target_resource_id=target_resource_id,
        description=description,
        old_value=old_value,
        new_value=new_value,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(log_entry)
    db.commit()
    return log_entry


def get_client_ip(request: Request) -> str:
    """Extract client IP from request."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# =============================================================================
# Health & Status
# =============================================================================

@router.get("/status")
async def admin_status(user: User = Depends(require_admin)):
    """Check admin panel status and services."""
    serpbear_ok = await is_serpbear_running()

    return {
        "admin": True,
        "user": user.email,
        "services": {
            "serpbear": {
                "running": serpbear_ok,
                "url": "http://localhost:3005" if serpbear_ok else None
            }
        }
    }


# =============================================================================
# SEO Tracking (SerpBear Integration)
# =============================================================================

@router.get("/seo/rankings")
async def get_rankings(user: User = Depends(require_admin)):
    """
    Get current SEO rankings summary.

    Returns all tracked keywords with their positions and changes.
    """
    if not await is_serpbear_running():
        return {
            "error": "SerpBear is not running",
            "message": "Start SerpBear with: cd serpbear && docker compose up -d",
            "keywords": [],
            "total_keywords": 0
        }

    rankings = await get_seo_rankings()
    return rankings


@router.get("/seo/domains")
async def get_domains(user: User = Depends(require_admin)):
    """Get all tracked domains."""
    if not await is_serpbear_running():
        raise HTTPException(status_code=503, detail="SerpBear is not running")

    domains = await serpbear_client.get_domains()
    return {"domains": domains}


@router.post("/seo/domains")
async def add_domain(request: AddDomainRequest, user: User = Depends(require_admin)):
    """Add a new domain to track."""
    if not await is_serpbear_running():
        raise HTTPException(status_code=503, detail="SerpBear is not running")

    domain = await serpbear_client.add_domain(request.domain)
    if not domain:
        raise HTTPException(status_code=400, detail="Failed to add domain")

    return {"domain": domain, "message": f"Domain '{request.domain}' added successfully"}


@router.get("/seo/domains/{domain_id}/keywords")
async def get_keywords(domain_id: int, user: User = Depends(require_admin)):
    """Get all keywords for a domain."""
    if not await is_serpbear_running():
        raise HTTPException(status_code=503, detail="SerpBear is not running")

    keywords = await serpbear_client.get_keywords(domain_id)
    return {"keywords": keywords, "total": len(keywords)}


@router.post("/seo/keywords")
async def add_keyword(request: AddKeywordRequest, user: User = Depends(require_admin)):
    """Add a keyword to track."""
    if not await is_serpbear_running():
        raise HTTPException(status_code=503, detail="SerpBear is not running")

    keyword = await serpbear_client.add_keyword(
        request.domain_id,
        request.keyword,
        request.device,
        request.country
    )

    if not keyword:
        raise HTTPException(status_code=400, detail="Failed to add keyword")

    return {"keyword": keyword, "message": f"Keyword '{request.keyword}' added successfully"}


@router.post("/seo/keywords/bulk")
async def add_keywords_bulk(request: AddKeywordsBulkRequest, user: User = Depends(require_admin)):
    """Add multiple keywords at once."""
    if not await is_serpbear_running():
        raise HTTPException(status_code=503, detail="SerpBear is not running")

    keywords = await serpbear_client.add_keywords_bulk(
        request.domain_id,
        request.keywords,
        request.device,
        request.country
    )

    return {
        "added": len(keywords),
        "total_requested": len(request.keywords),
        "keywords": keywords
    }


@router.get("/seo/domains/{domain_id}/keywords/{keyword_id}/history")
async def get_keyword_history(domain_id: int, keyword_id: int, user: User = Depends(require_admin)):
    """Get ranking history for a keyword."""
    if not await is_serpbear_running():
        raise HTTPException(status_code=503, detail="SerpBear is not running")

    history = await serpbear_client.get_keyword_history(domain_id, keyword_id)
    return {"history": history}


@router.post("/seo/domains/{domain_id}/refresh")
async def refresh_rankings(domain_id: int, user: User = Depends(require_admin)):
    """Trigger a refresh of keyword rankings."""
    if not await is_serpbear_running():
        raise HTTPException(status_code=503, detail="SerpBear is not running")

    success = await serpbear_client.refresh_keywords(domain_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to trigger refresh")

    return {"message": "Refresh triggered. Rankings will update shortly."}


@router.delete("/seo/domains/{domain_id}/keywords/{keyword_id}")
async def delete_keyword(domain_id: int, keyword_id: int, user: User = Depends(require_admin)):
    """Delete a keyword from tracking."""
    if not await is_serpbear_running():
        raise HTTPException(status_code=503, detail="SerpBear is not running")

    success = await serpbear_client.delete_keyword(domain_id, keyword_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete keyword")

    return {"message": "Keyword deleted successfully"}


# =============================================================================
# Suggested Keywords for TubeGrow
# =============================================================================

@router.get("/seo/suggested-keywords")
async def get_suggested_keywords(user: User = Depends(require_admin)):
    """
    Get suggested keywords to track for TubeGrow.

    These are pre-defined keywords relevant to YouTube creator tools.
    """
    return {
        "product_keywords": [
            "youtube analytics tool",
            "youtube seo tool",
            "viral clips generator",
            "youtube growth tool",
            "youtube thumbnail analyzer",
            "youtube video optimizer",
            "youtube keyword research tool",
            "youtube channel analyzer",
            "ai youtube tools",
            "youtube creator tools",
        ],
        "content_keywords": [
            "how to grow youtube channel",
            "youtube algorithm tips",
            "best time to post on youtube",
            "how to get more views on youtube",
            "youtube seo tips",
            "how to make viral youtube videos",
            "youtube shorts tips",
            "youtube monetization tips",
            "youtube thumbnail tips",
            "youtube title optimization",
        ],
        "competitor_keywords": [
            "tubics alternative",
            "vidiq alternative",
            "tubebuddy alternative",
            "morningfame alternative",
        ]
    }


# =============================================================================
# User Management
# =============================================================================

@router.get("/users")
async def list_users(
    request: Request,
    search: Optional[str] = None,
    status: Optional[str] = Query(None, regex="^(active|suspended|deleted|all)$"),
    plan: Optional[str] = None,
    sort_by: str = Query("created_at", regex="^(created_at|last_login_at|email|name)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List all users with search, filter, and pagination."""
    query = db.query(User).options(
        joinedload(User.subscription),
        joinedload(User.channels)
    )

    # Apply filters
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                User.email.ilike(search_term),
                User.name.ilike(search_term),
            )
        )

    if status == "active":
        query = query.filter(User.suspended_at.is_(None), User.deleted_at.is_(None))
    elif status == "suspended":
        query = query.filter(User.suspended_at.isnot(None))
    elif status == "deleted":
        query = query.filter(User.deleted_at.isnot(None))
    # "all" returns everything

    if plan:
        query = query.join(Subscription).filter(Subscription.plan_id == plan)

    # Get total count
    total = query.count()

    # Apply sorting
    sort_column = getattr(User, sort_by)
    if sort_order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))

    # Apply pagination
    offset = (page - 1) * per_page
    users = query.offset(offset).limit(per_page).all()

    # Format users to match frontend expected structure
    formatted_users = []
    for u in users:
        user_dict = u.to_dict()
        formatted_users.append({
            "id": user_dict.get("id"),
            "email": user_dict.get("email"),
            "name": user_dict.get("name"),
            "picture": user_dict.get("avatar_url"),  # Frontend uses "picture"
            "is_admin": user_dict.get("is_admin", False),
            "is_suspended": user_dict.get("suspended_at") is not None,
            "suspended_at": user_dict.get("suspended_at"),
            "suspended_reason": user_dict.get("suspended_reason"),
            "created_at": user_dict.get("created_at"),
            "last_login": user_dict.get("last_login_at"),  # Frontend uses "last_login"
            "subscription_plan": u.subscription.plan_id.value if u.subscription else "free",
            "channels_count": len(u.channels),  # Frontend uses "channels_count"
        })

    return {
        "items": formatted_users,  # Frontend expects "items"
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page,  # Frontend expects "pages"
    }


@router.get("/users/{user_id}")
async def get_user_details(
    request: Request,
    user_id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get comprehensive user details including channels, subscription, and usage."""
    user = db.query(User).options(
        joinedload(User.subscription),
        joinedload(User.channels)
    ).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Log view action
    log_admin_action(
        db=db,
        admin_user=admin,
        action_type=AdminActionType.USER_VIEW,
        description=f"Viewed user details for {user.email}",
        target_user_id=user_id,
        ip_address=get_client_ip(request),
    )

    # Get recent admin activity for this user
    recent_activity = db.query(AdminActivityLog).filter(
        AdminActivityLog.target_user_id == user_id
    ).order_by(desc(AdminActivityLog.created_at)).limit(10).all()

    # Format to match frontend UserDetails interface
    user_dict = user.to_dict()
    sub = user.subscription

    return {
        "id": user_dict.get("id"),
        "email": user_dict.get("email"),
        "name": user_dict.get("name"),
        "picture": user_dict.get("avatar_url"),
        "is_admin": user_dict.get("is_admin", False),
        "is_suspended": user.suspended_at is not None,
        "suspended_at": user_dict.get("suspended_at"),
        "suspended_reason": user_dict.get("suspended_reason"),
        "suspended_by": user_dict.get("suspended_by"),
        "created_at": user_dict.get("created_at"),
        "last_login": user_dict.get("last_login_at"),
        "subscription": {
            "plan": sub.plan_id.value if sub else "free",
            "status": sub.status.value if sub else "active",
            "stripe_customer_id": sub.stripe_customer_id if sub else None,
            "current_period_end": sub.current_period_end.isoformat() if sub and sub.current_period_end else None,
            "monthly_usage": {
                "clips_generated": sub.clips_generated_this_month if sub else 0,
                "seo_analyses": sub.videos_analyzed_this_month if sub else 0,
                "agent_queries": sub.ai_queries_this_month if sub else 0,
            },
        },
        "channels": [
            {
                "id": ch.channel_id,
                "title": ch.title,
                "subscriber_count": ch.subscriber_count or 0,
                "video_count": ch.video_count or 0,
            }
            for ch in user.channels
        ],
        "activity": [
            {
                "action_type": log.action_type.value if log.action_type else "unknown",
                "description": log.description,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in recent_activity
        ],
    }


@router.put("/users/{user_id}")
async def update_user(
    request: Request,
    user_id: str,
    user_update: UserUpdateRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Update user details (name, email, admin status)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    old_values = user.to_dict()
    changes = {}

    if user_update.name is not None:
        changes["name"] = {"old": user.name, "new": user_update.name}
        user.name = user_update.name

    if user_update.email is not None:
        # Check if email is already taken
        existing = db.query(User).filter(User.email == user_update.email, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        changes["email"] = {"old": user.email, "new": user_update.email}
        user.email = user_update.email

    if user_update.is_admin is not None:
        changes["is_admin"] = {"old": user.is_admin, "new": user_update.is_admin}
        user.is_admin = user_update.is_admin

    if changes:
        user.updated_at = datetime.utcnow()
        db.commit()

        log_admin_action(
            db=db,
            admin_user=admin,
            action_type=AdminActionType.USER_EDIT,
            description=f"Updated user {user.email}: {', '.join(changes.keys())}",
            target_user_id=user_id,
            old_value=old_values,
            new_value=user.to_dict(),
            ip_address=get_client_ip(request),
        )

    return {"user": user.to_dict(), "changes": changes}


@router.post("/users/{user_id}/suspend")
async def suspend_user(
    request: Request,
    user_id: str,
    suspend_request: SuspendUserRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Suspend a user account with reason."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot suspend yourself")

    if user.is_admin:
        raise HTTPException(status_code=400, detail="Cannot suspend admin users")

    if user.suspended_at:
        raise HTTPException(status_code=400, detail="User is already suspended")

    user.suspended_at = datetime.utcnow()
    user.suspended_reason = suspend_request.reason
    user.suspended_by = admin.id
    user.is_active = False
    db.commit()

    log_admin_action(
        db=db,
        admin_user=admin,
        action_type=AdminActionType.USER_SUSPEND,
        description=f"Suspended user {user.email}: {suspend_request.reason}",
        target_user_id=user_id,
        new_value={"reason": suspend_request.reason},
        ip_address=get_client_ip(request),
    )

    return {"message": f"User {user.email} suspended", "user": user.to_dict()}


@router.post("/users/{user_id}/unsuspend")
async def unsuspend_user(
    request: Request,
    user_id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Reactivate a suspended user account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.suspended_at:
        raise HTTPException(status_code=400, detail="User is not suspended")

    old_reason = user.suspended_reason
    user.suspended_at = None
    user.suspended_reason = None
    user.suspended_by = None
    user.is_active = True
    db.commit()

    log_admin_action(
        db=db,
        admin_user=admin,
        action_type=AdminActionType.USER_UNSUSPEND,
        description=f"Unsuspended user {user.email}",
        target_user_id=user_id,
        old_value={"reason": old_reason},
        ip_address=get_client_ip(request),
    )

    return {"message": f"User {user.email} unsuspended", "user": user.to_dict()}


@router.delete("/users/{user_id}")
async def delete_user(
    request: Request,
    user_id: str,
    hard_delete: bool = Query(False),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Delete a user account (soft delete by default)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    if user.is_admin:
        raise HTTPException(status_code=400, detail="Cannot delete admin users")

    user_email = user.email

    if hard_delete:
        db.delete(user)
        db.commit()
        action_desc = f"Hard deleted user {user_email}"
    else:
        user.deleted_at = datetime.utcnow()
        user.is_active = False
        db.commit()
        action_desc = f"Soft deleted user {user_email}"

    log_admin_action(
        db=db,
        admin_user=admin,
        action_type=AdminActionType.USER_DELETE,
        description=action_desc,
        target_user_id=user_id if not hard_delete else None,
        new_value={"hard_delete": hard_delete},
        ip_address=get_client_ip(request),
    )

    return {"message": action_desc}


# =============================================================================
# Subscription Management
# =============================================================================

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


# =============================================================================
# Revenue Analytics
# =============================================================================

@router.get("/revenue/metrics")
async def get_revenue_metrics(
    period: str = Query("30d", regex="^(7d|30d|90d|1y|all)$"),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get revenue metrics: MRR, subscribers by plan, etc.

    Note: Admin accounts are excluded from revenue calculations.
    """
    now = datetime.utcnow()
    month_ago = now - timedelta(days=30)

    # Get admin user IDs to exclude from revenue calculations
    admin_user_ids = [u.id for u in db.query(User.id).filter(User.is_admin == True).all()]

    # Count subscribers by plan (excluding admins)
    plan_counts_query = db.query(
        Subscription.plan_id,
        func.count(Subscription.id)
    ).filter(
        Subscription.status == SubscriptionStatus.ACTIVE
    )
    if admin_user_ids:
        plan_counts_query = plan_counts_query.filter(
            ~Subscription.user_id.in_(admin_user_ids)
        )
    plan_counts = plan_counts_query.group_by(Subscription.plan_id).all()

    subscribers_by_plan = {plan.value: count for plan, count in plan_counts}

    # Calculate MRR (Monthly Recurring Revenue) - excludes admin accounts
    # Prices: Free=$0, Starter=$19, Pro=$49, Agency=$149
    plan_prices = {"free": 0, "starter": 19, "pro": 49, "agency": 149}
    mrr = sum(subscribers_by_plan.get(plan, 0) * price for plan, price in plan_prices.items())

    # Total subscribers (excluding admins)
    total_subs_query = db.query(Subscription).filter(
        Subscription.status == SubscriptionStatus.ACTIVE
    )
    if admin_user_ids:
        total_subs_query = total_subs_query.filter(
            ~Subscription.user_id.in_(admin_user_ids)
        )
    total_subscribers = total_subs_query.count()

    # Paid subscribers (excluding admins)
    paid_subs_query = db.query(Subscription).filter(
        Subscription.status == SubscriptionStatus.ACTIVE,
        Subscription.plan_id != PlanTier.FREE
    )
    if admin_user_ids:
        paid_subs_query = paid_subs_query.filter(
            ~Subscription.user_id.in_(admin_user_ids)
        )
    paid_subscribers = paid_subs_query.count()

    # Trial subscribers count (excluding admins)
    trial_subs_query = db.query(Subscription).filter(
        Subscription.status == SubscriptionStatus.TRIALING
    )
    if admin_user_ids:
        trial_subs_query = trial_subs_query.filter(
            ~Subscription.user_id.in_(admin_user_ids)
        )
    trial_subscribers = trial_subs_query.count()

    # Churn: canceled in period
    period_days = {"7d": 7, "30d": 30, "90d": 90, "1y": 365, "all": 3650}
    days = period_days.get(period, 30)
    cutoff = now - timedelta(days=days)

    canceled_count = db.query(Subscription).filter(
        Subscription.status == SubscriptionStatus.CANCELED,
        Subscription.updated_at >= cutoff
    ).count()

    churn_rate = (canceled_count / total_subscribers * 100) if total_subscribers > 0 else 0

    # Calculate average revenue per user (ARPU)
    arpu = mrr / paid_subscribers if paid_subscribers > 0 else 0

    # Build plan_breakdown array for frontend
    plan_breakdown = []
    total_count = sum(subscribers_by_plan.values()) or 1  # Avoid division by zero
    for plan_name, price in plan_prices.items():
        count = subscribers_by_plan.get(plan_name, 0)
        revenue = count * price
        percentage = round((count / total_count) * 100, 1) if total_count > 0 else 0
        plan_breakdown.append({
            "plan": plan_name,
            "count": count,
            "revenue": revenue,
            "percentage": percentage,
        })

    # New subscriptions this month (excluding admins)
    new_subs_query = db.query(Subscription).filter(
        Subscription.created_at >= month_ago
    )
    if admin_user_ids:
        new_subs_query = new_subs_query.filter(
            ~Subscription.user_id.in_(admin_user_ids)
        )
    new_subs_this_month = new_subs_query.count()

    # Cancellations this month (excluding admins)
    cancellations_query = db.query(Subscription).filter(
        Subscription.status == SubscriptionStatus.CANCELED,
        Subscription.updated_at >= month_ago
    )
    if admin_user_ids:
        cancellations_query = cancellations_query.filter(
            ~Subscription.user_id.in_(admin_user_ids)
        )
    cancellations_this_month = cancellations_query.count()

    # Query AdminActivityLog for subscription changes to get real upgrade/downgrade counts
    plan_hierarchy = {"free": 0, "starter": 1, "pro": 2, "agency": 3}
    upgrades_this_month = 0
    downgrades_this_month = 0

    # Get subscription change logs from this month
    subscription_changes = db.query(AdminActivityLog).filter(
        AdminActivityLog.action_type == AdminActionType.SUBSCRIPTION_CHANGE,
        AdminActivityLog.created_at >= month_ago
    ).all()

    for log in subscription_changes:
        old_val = log.old_value or {}
        new_val = log.new_value or {}
        old_plan = old_val.get("plan_id", "free")
        new_plan = new_val.get("plan_id", "free")

        old_rank = plan_hierarchy.get(old_plan, 0)
        new_rank = plan_hierarchy.get(new_plan, 0)

        if new_rank > old_rank:
            upgrades_this_month += 1
        elif new_rank < old_rank:
            downgrades_this_month += 1

    # MRR change (simplified - based on new subs vs cancellations)
    # In a real scenario, you'd track historical MRR
    avg_new_sub_value = 29  # Rough average between starter/pro/agency
    mrr_change_estimate = (new_subs_this_month - cancellations_this_month) * avg_new_sub_value
    mrr_change_percent = (mrr_change_estimate / mrr * 100) if mrr > 0 else 0

    return {
        "mrr": mrr,
        "arr": mrr * 12,
        "total_revenue": mrr,  # For simplicity, using MRR as total (would normally track cumulative)
        "active_subscriptions": total_subscribers,
        "paid_subscriptions": paid_subscribers,
        "trial_subscriptions": trial_subscribers,
        "churn_rate": round(churn_rate, 2),
        "average_revenue_per_user": round(arpu, 2),
        "plan_breakdown": plan_breakdown,
        "admin_excluded": len(admin_user_ids),  # Number of admin accounts excluded
        "trends": {
            "mrr_change": round(mrr_change_percent, 1),
            "new_subscriptions_this_month": new_subs_this_month,
            "cancellations_this_month": cancellations_this_month,
            "upgrades_this_month": upgrades_this_month,
            "downgrades_this_month": downgrades_this_month,
        },
    }


@router.get("/revenue/trends")
async def get_revenue_trends(
    period: str = Query("30d", regex="^(7d|30d|90d|1y)$"),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get upgrade/downgrade trends."""
    period_days = {"7d": 7, "30d": 30, "90d": 90, "1y": 365}
    days = period_days.get(period, 30)
    cutoff = datetime.utcnow() - timedelta(days=days)

    # New subscriptions in period
    new_subs = db.query(Subscription).filter(
        Subscription.created_at >= cutoff
    ).count()

    # Active subscriptions over time (simplified - count by plan)
    active_by_plan = db.query(
        Subscription.plan_id,
        func.count(Subscription.id)
    ).filter(
        Subscription.status == SubscriptionStatus.ACTIVE
    ).group_by(Subscription.plan_id).all()

    return {
        "new_subscriptions": new_subs,
        "active_by_plan": {plan.value: count for plan, count in active_by_plan},
        "period": period,
    }


# =============================================================================
# Platform Analytics
# =============================================================================

@router.get("/analytics/users")
async def get_user_analytics(
    period: str = Query("30d", regex="^(7d|30d|90d|1y)$"),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get user analytics: DAU, MAU, WAU, new signups."""
    now = datetime.utcnow()
    day_ago = now - timedelta(days=1)
    two_days_ago = now - timedelta(days=2)
    week_ago = now - timedelta(days=7)
    two_weeks_ago = now - timedelta(days=14)
    month_ago = now - timedelta(days=30)
    two_months_ago = now - timedelta(days=60)

    # Current period active users
    dau = db.query(User).filter(User.last_login_at >= day_ago).count()
    wau = db.query(User).filter(User.last_login_at >= week_ago).count()
    mau = db.query(User).filter(User.last_login_at >= month_ago).count()

    # Previous period active users (for change calculation)
    prev_dau = db.query(User).filter(
        User.last_login_at >= two_days_ago,
        User.last_login_at < day_ago
    ).count()
    prev_wau = db.query(User).filter(
        User.last_login_at >= two_weeks_ago,
        User.last_login_at < week_ago
    ).count()
    prev_mau = db.query(User).filter(
        User.last_login_at >= two_months_ago,
        User.last_login_at < month_ago
    ).count()

    # Calculate changes
    dau_change = ((dau - prev_dau) / prev_dau * 100) if prev_dau > 0 else 0
    wau_change = ((wau - prev_wau) / prev_wau * 100) if prev_wau > 0 else 0
    mau_change = ((mau - prev_mau) / prev_mau * 100) if prev_mau > 0 else 0

    # New signups
    new_today = db.query(User).filter(User.created_at >= day_ago).count()
    new_this_week = db.query(User).filter(User.created_at >= week_ago).count()
    new_this_month = db.query(User).filter(User.created_at >= month_ago).count()

    # Total users
    total_users = db.query(User).filter(User.deleted_at.is_(None)).count()

    # Calculate retention rate (users who logged in this month / users who signed up last month)
    last_month_signups = db.query(User).filter(
        User.created_at >= two_months_ago,
        User.created_at < month_ago
    ).count()
    retained_users = db.query(User).filter(
        User.created_at >= two_months_ago,
        User.created_at < month_ago,
        User.last_login_at >= month_ago
    ).count()
    retention_rate = (retained_users / last_month_signups * 100) if last_month_signups > 0 else 0

    # Growth rate (month over month)
    prev_month_total = db.query(User).filter(
        User.created_at < month_ago,
        User.deleted_at.is_(None)
    ).count()
    growth_rate = ((total_users - prev_month_total) / prev_month_total * 100) if prev_month_total > 0 else 0

    return {
        "dau": dau,
        "wau": wau,
        "mau": mau,
        "dau_change": round(dau_change, 1),
        "wau_change": round(wau_change, 1),
        "mau_change": round(mau_change, 1),
        "retention_rate": round(retention_rate, 1),
        "new_users_today": new_today,
        "new_users_this_week": new_this_week,
        "new_users_this_month": new_this_month,
        "total_users": total_users,
        "growth_rate": round(growth_rate, 1),
    }


@router.get("/analytics/features")
async def get_feature_usage(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get feature usage breakdown from Job table and subscription usage."""
    now = datetime.utcnow()
    day_ago = now - timedelta(days=1)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    # Aggregate usage across all subscriptions
    usage = db.query(
        func.sum(Subscription.videos_analyzed_this_month).label("total_videos"),
        func.sum(Subscription.ai_queries_this_month).label("total_ai_queries"),
        func.sum(Subscription.clips_generated_this_month).label("total_clips"),
    ).first()

    total_seo = usage.total_videos or 0
    total_queries = usage.total_ai_queries or 0

    # Query real clip jobs from Job table
    clips_today = db.query(Job).filter(
        Job.job_type == JobType.RENDER_CLIP,
        Job.created_at >= day_ago
    ).count()

    clips_this_week = db.query(Job).filter(
        Job.job_type == JobType.RENDER_CLIP,
        Job.created_at >= week_ago
    ).count()

    clips_this_month = db.query(Job).filter(
        Job.job_type == JobType.RENDER_CLIP,
        Job.created_at >= month_ago
    ).count()

    total_clips = db.query(Job).filter(
        Job.job_type == JobType.RENDER_CLIP
    ).count()

    # Query real deep analysis jobs from Job table
    deep_analysis_today = db.query(Job).filter(
        Job.job_type == JobType.DEEP_ANALYSIS,
        Job.created_at >= day_ago
    ).count()

    deep_analysis_this_week = db.query(Job).filter(
        Job.job_type == JobType.DEEP_ANALYSIS,
        Job.created_at >= week_ago
    ).count()

    deep_analysis_this_month = db.query(Job).filter(
        Job.job_type == JobType.DEEP_ANALYSIS,
        Job.created_at >= month_ago
    ).count()

    total_deep_analysis = db.query(Job).filter(
        Job.job_type == JobType.DEEP_ANALYSIS
    ).count()

    # Channel stats
    total_channels = db.query(YouTubeChannel).filter(YouTubeChannel.is_active == True).count()
    new_channels_today = db.query(YouTubeChannel).filter(YouTubeChannel.created_at >= day_ago).count()

    return {
        "clips_generated": {
            "today": clips_today,
            "this_week": clips_this_week,
            "this_month": clips_this_month,
            "total": total_clips,
        },
        "seo_analyses": {
            "today": deep_analysis_today,
            "this_week": deep_analysis_this_week,
            "this_month": max(total_seo, deep_analysis_this_month),
            "total": max(total_seo, total_deep_analysis),
        },
        "agent_queries": {
            "today": 0,  # AI queries not tracked in Job table
            "this_week": 0,
            "this_month": total_queries,
            "total": total_queries,
        },
        "channels_connected": {
            "today": new_channels_today,
            "total": total_channels,
        },
    }


@router.get("/analytics/system")
async def get_system_health(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get system health metrics from Job table."""
    from sqlalchemy import text

    now = datetime.utcnow()
    day_ago = now - timedelta(days=1)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    # Database connectivity check
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "error"

    # SerpBear status
    serpbear_running = await is_serpbear_running()

    # Query real job queue stats from Job table
    pending_jobs = db.query(Job).filter(
        Job.status == JobStatus.PENDING
    ).count()

    queued_jobs = db.query(Job).filter(
        Job.status == JobStatus.QUEUED
    ).count()

    processing_jobs = db.query(Job).filter(
        Job.status.in_([JobStatus.PROCESSING, JobStatus.RENDERING])
    ).count()

    completed_today = db.query(Job).filter(
        Job.status == JobStatus.COMPLETED,
        Job.completed_at >= day_ago
    ).count()

    failed_today = db.query(Job).filter(
        Job.status == JobStatus.FAILED,
        Job.updated_at >= day_ago
    ).count()

    # Total jobs for stats
    total_jobs_today = db.query(Job).filter(Job.created_at >= day_ago).count()
    total_jobs_this_week = db.query(Job).filter(Job.created_at >= week_ago).count()
    total_jobs_this_month = db.query(Job).filter(Job.created_at >= month_ago).count()

    return {
        "api_calls": {
            "today": total_jobs_today,
            "this_week": total_jobs_this_week,
            "this_month": total_jobs_this_month,
        },
        "job_queue": {
            "pending": pending_jobs + queued_jobs,
            "processing": processing_jobs,
            "completed_today": completed_today,
            "failed_today": failed_today,
        },
        "response_times": {
            "avg_ms": 0,  # Would need request timing middleware
            "p95_ms": 0,
            "p99_ms": 0,
        },
        "uptime": {
            "status": db_status,
            "uptime_percentage": 99.9 if db_status == "healthy" else 0,
            "last_incident": None,
        },
    }


# =============================================================================
# API Cost Tracking
# =============================================================================

@router.get("/api-costs/summary")
async def get_api_costs_summary(
    period: str = Query("30d", regex="^(7d|30d|90d|1y|all)$"),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Get API cost summary: total costs, costs by agent, costs by model.
    """
    now = datetime.utcnow()
    period_days = {"7d": 7, "30d": 30, "90d": 90, "1y": 365, "all": 3650}
    days = period_days.get(period, 30)
    cutoff = now - timedelta(days=days)

    # Base query for the period
    base_query = db.query(APIUsage).filter(APIUsage.created_at >= cutoff)

    # Total costs
    totals = db.query(
        func.sum(APIUsage.cost_usd).label("total_cost"),
        func.sum(APIUsage.prompt_tokens).label("total_prompt_tokens"),
        func.sum(APIUsage.completion_tokens).label("total_completion_tokens"),
        func.sum(APIUsage.total_tokens).label("total_tokens"),
        func.count(APIUsage.id).label("total_requests"),
        func.avg(APIUsage.latency_ms).label("avg_latency"),
    ).filter(APIUsage.created_at >= cutoff).first()

    # Costs by agent type
    by_agent = db.query(
        APIUsage.agent_type,
        func.sum(APIUsage.cost_usd).label("cost"),
        func.sum(APIUsage.total_tokens).label("tokens"),
        func.count(APIUsage.id).label("requests"),
    ).filter(APIUsage.created_at >= cutoff).group_by(APIUsage.agent_type).all()

    # Costs by model
    by_model = db.query(
        APIUsage.model,
        func.sum(APIUsage.cost_usd).label("cost"),
        func.sum(APIUsage.total_tokens).label("tokens"),
        func.count(APIUsage.id).label("requests"),
    ).filter(APIUsage.created_at >= cutoff).group_by(APIUsage.model).all()

    # Success/failure rate
    success_count = db.query(APIUsage).filter(
        APIUsage.created_at >= cutoff,
        APIUsage.success == True
    ).count()
    failed_count = db.query(APIUsage).filter(
        APIUsage.created_at >= cutoff,
        APIUsage.success == False
    ).count()

    total_requests = totals.total_requests or 0
    success_rate = (success_count / total_requests * 100) if total_requests > 0 else 0

    # Compare to previous period
    prev_cutoff = cutoff - timedelta(days=days)
    prev_totals = db.query(
        func.sum(APIUsage.cost_usd).label("total_cost"),
        func.count(APIUsage.id).label("total_requests"),
    ).filter(
        APIUsage.created_at >= prev_cutoff,
        APIUsage.created_at < cutoff
    ).first()

    prev_cost = prev_totals.total_cost or 0
    current_cost = totals.total_cost or 0
    cost_change = ((current_cost - prev_cost) / prev_cost * 100) if prev_cost > 0 else 0

    return {
        "period": period,
        "totals": {
            "cost_usd": round(current_cost, 4) if current_cost else 0,
            "prompt_tokens": totals.total_prompt_tokens or 0,
            "completion_tokens": totals.total_completion_tokens or 0,
            "total_tokens": totals.total_tokens or 0,
            "requests": total_requests,
            "avg_latency_ms": round(totals.avg_latency, 1) if totals.avg_latency else 0,
            "success_rate": round(success_rate, 1),
            "failed_requests": failed_count,
        },
        "trends": {
            "cost_change_percent": round(cost_change, 1),
            "previous_period_cost": round(prev_cost, 4) if prev_cost else 0,
        },
        "by_agent": [
            {
                "agent_type": row.agent_type.value if row.agent_type else "unknown",
                "cost_usd": round(row.cost, 4) if row.cost else 0,
                "tokens": row.tokens or 0,
                "requests": row.requests or 0,
            }
            for row in by_agent
        ],
        "by_model": [
            {
                "model": row.model,
                "cost_usd": round(row.cost, 4) if row.cost else 0,
                "tokens": row.tokens or 0,
                "requests": row.requests or 0,
            }
            for row in by_model
        ],
        "pricing": OPENAI_PRICING,
    }


@router.get("/api-costs/breakdown")
async def get_api_costs_breakdown(
    period: str = Query("30d", regex="^(7d|30d|90d)$"),
    group_by: str = Query("day", regex="^(day|hour|agent|model)$"),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Get API cost breakdown by time period or category.
    """
    now = datetime.utcnow()
    period_days = {"7d": 7, "30d": 30, "90d": 90}
    days = period_days.get(period, 30)
    cutoff = now - timedelta(days=days)

    if group_by == "day":
        # Group by date
        if IS_SQLITE:
            date_trunc = func.date(APIUsage.created_at)
        else:
            date_trunc = func.date_trunc('day', APIUsage.created_at)

        results = db.query(
            date_trunc.label("date"),
            func.sum(APIUsage.cost_usd).label("cost"),
            func.sum(APIUsage.total_tokens).label("tokens"),
            func.count(APIUsage.id).label("requests"),
        ).filter(
            APIUsage.created_at >= cutoff
        ).group_by(date_trunc).order_by(date_trunc).all()

        breakdown = [
            {
                "date": str(row.date),
                "cost_usd": round(row.cost, 4) if row.cost else 0,
                "tokens": row.tokens or 0,
                "requests": row.requests or 0,
            }
            for row in results
        ]
    elif group_by == "hour":
        # Group by hour (last 7 days only)
        if IS_SQLITE:
            hour_trunc = func.strftime('%Y-%m-%d %H:00', APIUsage.created_at)
        else:
            hour_trunc = func.date_trunc('hour', APIUsage.created_at)

        short_cutoff = now - timedelta(days=7)
        results = db.query(
            hour_trunc.label("hour"),
            func.sum(APIUsage.cost_usd).label("cost"),
            func.count(APIUsage.id).label("requests"),
        ).filter(
            APIUsage.created_at >= short_cutoff
        ).group_by(hour_trunc).order_by(hour_trunc).all()

        breakdown = [
            {
                "hour": str(row.hour),
                "cost_usd": round(row.cost, 4) if row.cost else 0,
                "requests": row.requests or 0,
            }
            for row in results
        ]
    elif group_by == "agent":
        # Group by agent and day
        if IS_SQLITE:
            date_trunc = func.date(APIUsage.created_at)
        else:
            date_trunc = func.date_trunc('day', APIUsage.created_at)

        results = db.query(
            date_trunc.label("date"),
            APIUsage.agent_type,
            func.sum(APIUsage.cost_usd).label("cost"),
            func.count(APIUsage.id).label("requests"),
        ).filter(
            APIUsage.created_at >= cutoff
        ).group_by(date_trunc, APIUsage.agent_type).order_by(date_trunc).all()

        breakdown = [
            {
                "date": str(row.date),
                "agent_type": row.agent_type.value if row.agent_type else "unknown",
                "cost_usd": round(row.cost, 4) if row.cost else 0,
                "requests": row.requests or 0,
            }
            for row in results
        ]
    else:  # model
        # Group by model and day
        if IS_SQLITE:
            date_trunc = func.date(APIUsage.created_at)
        else:
            date_trunc = func.date_trunc('day', APIUsage.created_at)

        results = db.query(
            date_trunc.label("date"),
            APIUsage.model,
            func.sum(APIUsage.cost_usd).label("cost"),
            func.count(APIUsage.id).label("requests"),
        ).filter(
            APIUsage.created_at >= cutoff
        ).group_by(date_trunc, APIUsage.model).order_by(date_trunc).all()

        breakdown = [
            {
                "date": str(row.date),
                "model": row.model,
                "cost_usd": round(row.cost, 4) if row.cost else 0,
                "requests": row.requests or 0,
            }
            for row in results
        ]

    return {
        "period": period,
        "group_by": group_by,
        "breakdown": breakdown,
    }


@router.get("/api-costs/recent")
async def get_recent_api_calls(
    agent_type: Optional[str] = None,
    model: Optional[str] = None,
    success: Optional[bool] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Get recent API calls with filtering.
    """
    query = db.query(APIUsage)

    if agent_type:
        try:
            agent = AgentType(agent_type)
            query = query.filter(APIUsage.agent_type == agent)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid agent_type: {agent_type}")

    if model:
        query = query.filter(APIUsage.model == model)

    if success is not None:
        query = query.filter(APIUsage.success == success)

    total = query.count()
    offset = (page - 1) * per_page
    calls = query.order_by(desc(APIUsage.created_at)).offset(offset).limit(per_page).all()

    return {
        "items": [call.to_dict() for call in calls],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page,
    }


@router.get("/api-costs/by-user")
async def get_api_costs_by_user(
    period: str = Query("30d", regex="^(7d|30d|90d|all)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Get API costs grouped by user.
    """
    now = datetime.utcnow()
    period_days = {"7d": 7, "30d": 30, "90d": 90, "all": 3650}
    days = period_days.get(period, 30)
    cutoff = now - timedelta(days=days)

    # Query costs by user
    results = db.query(
        APIUsage.user_id,
        func.sum(APIUsage.cost_usd).label("total_cost"),
        func.sum(APIUsage.total_tokens).label("total_tokens"),
        func.count(APIUsage.id).label("total_requests"),
    ).filter(
        APIUsage.created_at >= cutoff
    ).group_by(APIUsage.user_id).order_by(desc("total_cost")).all()

    total = len(results)
    offset = (page - 1) * per_page
    paginated = results[offset:offset + per_page]

    # Get user details
    user_ids = [r.user_id for r in paginated if r.user_id]
    users = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()}

    items = []
    for row in paginated:
        user = users.get(row.user_id)
        items.append({
            "user_id": row.user_id,
            "user_email": user.email if user else "anonymous",
            "user_name": user.name if user else "Anonymous",
            "cost_usd": round(row.total_cost, 4) if row.total_cost else 0,
            "tokens": row.total_tokens or 0,
            "requests": row.total_requests or 0,
        })

    return {
        "period": period,
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page,
    }


# =============================================================================
# Impersonation
# =============================================================================

@router.post("/users/{user_id}/impersonate")
async def impersonate_user(
    request: Request,
    user_id: str,
    impersonate_request: ImpersonateRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Start an impersonation session for debugging."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot impersonate yourself")

    if user.is_admin:
        raise HTTPException(status_code=400, detail="Cannot impersonate admin users")

    # Generate session token
    session_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(session_token.encode()).hexdigest()

    # Create impersonation session
    session = ImpersonationSession(
        admin_user_id=admin.id,
        target_user_id=user_id,
        session_token_hash=token_hash,
        expires_at=datetime.utcnow() + timedelta(minutes=impersonate_request.duration_minutes),
        reason=impersonate_request.reason,
    )
    db.add(session)
    db.commit()

    log_admin_action(
        db=db,
        admin_user=admin,
        action_type=AdminActionType.USER_IMPERSONATE,
        description=f"Started impersonation of {user.email}: {impersonate_request.reason}",
        target_user_id=user_id,
        new_value={"duration_minutes": impersonate_request.duration_minutes, "reason": impersonate_request.reason},
        ip_address=get_client_ip(request),
    )

    return {
        "session_id": session.id,
        "token": session_token,
        "expires_at": session.expires_at.isoformat(),
        "target_user": user.to_dict(),
    }


@router.post("/impersonate/end")
async def end_impersonation(
    request: Request,
    session_id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """End an impersonation session."""
    session = db.query(ImpersonationSession).filter(
        ImpersonationSession.id == session_id,
        ImpersonationSession.admin_user_id == admin.id,
        ImpersonationSession.is_active == True
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Impersonation session not found")

    session.ended_at = datetime.utcnow()
    session.is_active = False
    db.commit()

    return {"message": "Impersonation session ended", "session": session.to_dict()}


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
