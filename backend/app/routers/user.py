"""
User profile and account settings router.

Endpoints:
- GET /api/user/profile - Get current user profile
- PUT /api/user/profile - Update user profile
- GET /api/user/channels - Get connected YouTube channels
- GET /api/user/settings - Get account settings
- PUT /api/user/settings - Update account settings
- POST /api/user/export-data - Request data export
- POST /api/user/request-deletion - Request account deletion
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import logging

from ..auth.dependencies import get_current_user, get_user_subscription, get_db
from ..db.models import User, YouTubeChannel, Subscription, get_db_session
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/user", tags=["user"])


# =============================================================================
# Pydantic Models
# =============================================================================

class ProfileUpdateRequest(BaseModel):
    """Request model for updating user profile."""
    name: Optional[str] = Field(None, max_length=200)
    bio: Optional[str] = Field(None, max_length=500)


class SettingsUpdateRequest(BaseModel):
    """Request model for updating account settings."""
    timezone: Optional[str] = Field(None, max_length=50)
    theme_preference: Optional[str] = Field(None, pattern="^(dark|light)$")
    language: Optional[str] = Field(None, max_length=10)
    notification_preferences: Optional[Dict[str, bool]] = None


class DeletionRequest(BaseModel):
    """Request model for account deletion."""
    reason: Optional[str] = Field(None, max_length=1000)
    confirm_email: str = Field(..., description="User must type their email to confirm")


# =============================================================================
# Profile Endpoints
# =============================================================================

@router.get("/profile")
async def get_profile(
    user: User = Depends(get_current_user),
    subscription: Subscription = Depends(get_user_subscription),
):
    """
    Get current user profile with subscription and channel info.
    """
    with get_db_session() as db:
        channels = db.query(YouTubeChannel).filter(
            YouTubeChannel.user_id == user.id,
            YouTubeChannel.is_active == True
        ).all()

        channel_list = [ch.to_dict() for ch in channels]

    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "avatar_url": user.avatar_url,
        "bio": user.bio,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
        "subscription": {
            "plan_id": subscription.plan_id.value if subscription else "free",
            "status": subscription.status.value if subscription else "active",
        },
        "channels": channel_list,
        "channels_count": len(channel_list),
    }


@router.put("/profile")
async def update_profile(
    profile_update: ProfileUpdateRequest,
    user: User = Depends(get_current_user),
):
    """
    Update user profile (name, bio).
    """
    with get_db_session() as db:
        user_record = db.query(User).filter(User.id == user.id).first()

        if not user_record:
            raise HTTPException(status_code=404, detail="User not found")

        if profile_update.name is not None:
            user_record.name = profile_update.name
        if profile_update.bio is not None:
            user_record.bio = profile_update.bio

        user_record.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(user_record)

        return {
            "message": "Profile updated successfully",
            "user": {
                "id": user_record.id,
                "name": user_record.name,
                "bio": user_record.bio,
            }
        }


# =============================================================================
# Settings Endpoints
# =============================================================================

@router.get("/settings")
async def get_settings(user: User = Depends(get_current_user)):
    """
    Get user account settings.
    """
    return {
        "timezone": user.timezone or "UTC",
        "theme_preference": user.theme_preference or "dark",
        "language": user.language or "en",
        "notification_preferences": user.notification_preferences or {
            "email_marketing": True,
            "email_product_updates": True,
            "email_weekly_digest": False,
            "email_billing_alerts": True,
        },
    }


@router.put("/settings")
async def update_settings(
    settings_update: SettingsUpdateRequest,
    user: User = Depends(get_current_user),
):
    """
    Update account settings (timezone, theme, notifications).
    """
    with get_db_session() as db:
        user_record = db.query(User).filter(User.id == user.id).first()

        if not user_record:
            raise HTTPException(status_code=404, detail="User not found")

        if settings_update.timezone is not None:
            user_record.timezone = settings_update.timezone
        if settings_update.theme_preference is not None:
            user_record.theme_preference = settings_update.theme_preference
        if settings_update.language is not None:
            user_record.language = settings_update.language
        if settings_update.notification_preferences is not None:
            # Merge with existing preferences
            current_prefs = user_record.notification_preferences or {}
            current_prefs.update(settings_update.notification_preferences)
            user_record.notification_preferences = current_prefs

        user_record.updated_at = datetime.utcnow()
        db.commit()

        return {
            "message": "Settings updated successfully",
            "settings": {
                "timezone": user_record.timezone,
                "theme_preference": user_record.theme_preference,
                "language": user_record.language,
                "notification_preferences": user_record.notification_preferences,
            }
        }


# =============================================================================
# Channels Endpoint
# =============================================================================

@router.get("/channels")
async def get_channels(
    user: User = Depends(get_current_user),
):
    """
    Get connected YouTube channels with stats.
    """
    with get_db_session() as db:
        channels = db.query(YouTubeChannel).filter(
            YouTubeChannel.user_id == user.id,
        ).all()

        return {
            "channels": [ch.to_dict() for ch in channels],
            "total": len(channels),
        }


# =============================================================================
# Data Export (GDPR)
# =============================================================================

@router.post("/export-data")
async def request_data_export(
    user: User = Depends(get_current_user),
):
    """
    Request a data export (GDPR compliance).
    Rate limited to once per 24 hours.
    """
    with get_db_session() as db:
        user_record = db.query(User).filter(User.id == user.id).first()

        if not user_record:
            raise HTTPException(status_code=404, detail="User not found")

        # Check rate limit (one export per 24 hours)
        if user_record.last_data_export_at:
            hours_since = (datetime.utcnow() - user_record.last_data_export_at).total_seconds() / 3600
            if hours_since < 24:
                raise HTTPException(
                    status_code=429,
                    detail=f"Data export requested recently. Try again in {24 - int(hours_since)} hours."
                )

        # Mark export time
        user_record.last_data_export_at = datetime.utcnow()
        db.commit()

        # TODO: Queue background job to generate export and email user
        logger.info(f"Data export requested for user {user.id}")

        return {
            "message": "Data export requested. You will receive an email when ready.",
            "requested_at": user_record.last_data_export_at.isoformat(),
        }


# =============================================================================
# Account Deletion
# =============================================================================

@router.post("/request-deletion")
async def request_account_deletion(
    deletion_request: DeletionRequest,
    user: User = Depends(get_current_user),
):
    """
    Request account deletion.
    Account will be deleted after a 30-day grace period.
    """
    if deletion_request.confirm_email.lower() != user.email.lower():
        raise HTTPException(
            status_code=400,
            detail="Email confirmation does not match your account email."
        )

    with get_db_session() as db:
        user_record = db.query(User).filter(User.id == user.id).first()

        if not user_record:
            raise HTTPException(status_code=404, detail="User not found")

        # Check if already requested
        if user_record.deletion_requested_at:
            grace_period_ends = user_record.deletion_requested_at + timedelta(days=30)
            return {
                "message": "Account deletion already requested.",
                "grace_period_ends": grace_period_ends.isoformat(),
            }

        user_record.deletion_requested_at = datetime.utcnow()
        user_record.deletion_request_reason = deletion_request.reason
        db.commit()

        grace_period_ends = user_record.deletion_requested_at + timedelta(days=30)

        # TODO: Send confirmation email and schedule deletion after grace period
        logger.info(f"Account deletion requested for user {user.id}")

        return {
            "message": "Account deletion requested. Your account will be deleted in 30 days. You can cancel this request by contacting support.",
            "grace_period_ends": grace_period_ends.isoformat(),
        }


@router.post("/cancel-deletion")
async def cancel_deletion_request(
    user: User = Depends(get_current_user),
):
    """
    Cancel a pending account deletion request.
    """
    with get_db_session() as db:
        user_record = db.query(User).filter(User.id == user.id).first()

        if not user_record:
            raise HTTPException(status_code=404, detail="User not found")

        if not user_record.deletion_requested_at:
            raise HTTPException(
                status_code=400,
                detail="No deletion request found."
            )

        user_record.deletion_requested_at = None
        user_record.deletion_request_reason = None
        db.commit()

        logger.info(f"Account deletion cancelled for user {user.id}")

        return {
            "message": "Account deletion request cancelled successfully.",
        }
