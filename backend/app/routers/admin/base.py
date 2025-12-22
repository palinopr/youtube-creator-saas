"""
Admin base - shared Pydantic models and helper functions.
"""

from fastapi import Request
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session

from ...db.models import User, AdminActivityLog, AdminActionType


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
