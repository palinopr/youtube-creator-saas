"""
Admin user management endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from typing import Optional
from datetime import datetime
from sqlalchemy import desc, asc, or_
from sqlalchemy.orm import Session, joinedload
import hashlib
import secrets
import logging

from ...auth.dependencies import require_admin, get_db
from ...db.models import (
    User, Subscription, AdminActivityLog, AdminActionType,
    ImpersonationSession,
)
from .base import (
    UserUpdateRequest, SuspendUserRequest, ImpersonateRequest,
    log_admin_action, get_client_ip,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["admin-users"])


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
    from datetime import timedelta

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
