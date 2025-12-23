"""
Admin waitlist management endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from typing import Optional
from datetime import datetime, timedelta
from sqlalchemy import desc, asc, func
from sqlalchemy.orm import Session
from pydantic import BaseModel
import logging

from ...auth.dependencies import require_admin, get_db
from ...db.models import User, Waitlist, WaitlistStatus, AdminActionType
from ...services.email import send_waitlist_confirmation_email
from .base import log_admin_action, get_client_ip

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/waitlist", tags=["admin-waitlist"])


# =============================================================================
# Pydantic Models
# =============================================================================

class UpdateWaitlistStatusRequest(BaseModel):
    status: str


# =============================================================================
# List & Stats
# =============================================================================

@router.get("")
async def list_waitlist(
    request: Request,
    search: Optional[str] = None,
    status: Optional[str] = Query(None, regex="^(pending|confirmed|invited|converted|all)$"),
    sort_by: str = Query("created_at", regex="^(created_at|position|email|confirmed_at)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List all waitlist entries with search, filter, and pagination."""
    query = db.query(Waitlist)

    # Apply filters
    if search:
        search_term = f"%{search}%"
        query = query.filter(Waitlist.email.ilike(search_term))

    if status and status != "all":
        try:
            status_enum = WaitlistStatus(status)
            query = query.filter(Waitlist.status == status_enum)
        except ValueError:
            pass

    # Get total count
    total = query.count()

    # Apply sorting
    sort_column = getattr(Waitlist, sort_by)
    if sort_order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))

    # Apply pagination
    offset = (page - 1) * per_page
    entries = query.offset(offset).limit(per_page).all()

    # Format entries
    formatted_entries = []
    for entry in entries:
        formatted_entries.append({
            "id": entry.id,
            "email": entry.email,
            "position": entry.position,
            "status": entry.status.value if entry.status else None,
            "referral_source": entry.referral_source,
            "ip_address": entry.ip_address,
            "created_at": entry.created_at.isoformat() if entry.created_at else None,
            "confirmed_at": entry.confirmed_at.isoformat() if entry.confirmed_at else None,
        })

    return {
        "items": formatted_entries,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page if total > 0 else 0,
    }


@router.get("/stats")
async def get_waitlist_stats(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get waitlist statistics."""
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Count by status
    status_counts = db.query(
        Waitlist.status,
        func.count(Waitlist.id)
    ).group_by(Waitlist.status).all()

    counts = {
        "pending": 0,
        "confirmed": 0,
        "invited": 0,
        "converted": 0,
    }
    for status, count in status_counts:
        if status:
            counts[status.value] = count

    total = sum(counts.values())

    # Today's signups
    today_count = db.query(Waitlist).filter(
        Waitlist.created_at >= today_start
    ).count()

    # Top referral sources
    top_sources = db.query(
        Waitlist.referral_source,
        func.count(Waitlist.id).label("count")
    ).filter(
        Waitlist.referral_source.isnot(None),
        Waitlist.referral_source != ""
    ).group_by(
        Waitlist.referral_source
    ).order_by(
        desc("count")
    ).limit(5).all()

    return {
        "total": total,
        "pending": counts["pending"],
        "confirmed": counts["confirmed"],
        "invited": counts["invited"],
        "converted": counts["converted"],
        "today": today_count,
        "top_sources": [
            {"source": src or "direct", "count": cnt}
            for src, cnt in top_sources
        ],
    }


# =============================================================================
# Update Status
# =============================================================================

@router.put("/{entry_id}")
async def update_waitlist_status(
    entry_id: str,
    data: UpdateWaitlistStatusRequest,
    request: Request,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Update waitlist entry status."""
    entry = db.query(Waitlist).filter(Waitlist.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Waitlist entry not found")

    try:
        new_status = WaitlistStatus(data.status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {data.status}")

    old_status = entry.status.value if entry.status else None
    entry.status = new_status

    # If marking as confirmed and not already confirmed, set confirmed_at
    if new_status == WaitlistStatus.CONFIRMED and not entry.confirmed_at:
        entry.confirmed_at = datetime.utcnow()

    db.commit()

    # Log admin action
    log_admin_action(
        db=db,
        admin_user=admin,
        action_type=AdminActionType.USER_EDIT,
        description=f"Updated waitlist status for {entry.email} from {old_status} to {new_status.value}",
        target_resource="waitlist",
        target_resource_id=entry_id,
        old_value={"status": old_status},
        new_value={"status": new_status.value},
        ip_address=get_client_ip(request),
    )

    return {
        "success": True,
        "message": f"Status updated to {new_status.value}",
        "entry": {
            "id": entry.id,
            "email": entry.email,
            "status": entry.status.value,
        }
    }


# =============================================================================
# Resend Confirmation Email
# =============================================================================

@router.post("/{entry_id}/resend")
async def resend_confirmation_email(
    entry_id: str,
    request: Request,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Resend confirmation email for a pending waitlist entry."""
    entry = db.query(Waitlist).filter(Waitlist.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Waitlist entry not found")

    if entry.status != WaitlistStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot resend confirmation for {entry.status.value} entries"
        )

    # Send email
    success = await send_waitlist_confirmation_email(entry.email, entry.confirmation_token)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to send confirmation email")

    # Log admin action
    log_admin_action(
        db=db,
        admin_user=admin,
        action_type=AdminActionType.USER_EDIT,
        description=f"Resent confirmation email to {entry.email}",
        target_resource="waitlist",
        target_resource_id=entry_id,
        ip_address=get_client_ip(request),
    )

    return {
        "success": True,
        "message": f"Confirmation email resent to {entry.email}",
    }


# =============================================================================
# Delete Entry
# =============================================================================

@router.delete("/{entry_id}")
async def delete_waitlist_entry(
    entry_id: str,
    request: Request,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Delete a waitlist entry."""
    entry = db.query(Waitlist).filter(Waitlist.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Waitlist entry not found")

    email = entry.email
    db.delete(entry)
    db.commit()

    # Log admin action
    log_admin_action(
        db=db,
        admin_user=admin,
        action_type=AdminActionType.USER_DELETE,
        description=f"Deleted waitlist entry for {email}",
        target_resource="waitlist",
        target_resource_id=entry_id,
        old_value={"email": email},
        ip_address=get_client_ip(request),
    )

    return {
        "success": True,
        "message": f"Waitlist entry for {email} deleted",
    }
