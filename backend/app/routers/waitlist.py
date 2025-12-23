"""
Waitlist API endpoints.
Migrated from Supabase to consolidate all data in backend.
"""

import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func

from ..db.models import get_db_session, Waitlist, WaitlistStatus
from ..services.email import send_waitlist_confirmation_email

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/waitlist", tags=["waitlist"])


class WaitlistSignupRequest(BaseModel):
    """Request model for waitlist signup."""
    email: EmailStr = Field(..., description="Email address to add to waitlist")
    referral_source: Optional[str] = Field(None, max_length=200, description="How they found us")


class WaitlistSignupResponse(BaseModel):
    """Response model for waitlist signup."""
    success: bool
    message: str
    position: Optional[int] = None


class WaitlistConfirmRequest(BaseModel):
    """Request model for email confirmation."""
    token: str = Field(..., description="Confirmation token from email")


class WaitlistConfirmResponse(BaseModel):
    """Response model for email confirmation."""
    success: bool
    message: str
    email: Optional[str] = None


@router.post("/signup", response_model=WaitlistSignupResponse)
async def signup_waitlist(request: Request, data: WaitlistSignupRequest):
    """
    Add an email to the waitlist and send confirmation email.

    Returns position in waitlist if successful.
    """
    email = data.email.lower().strip()

    # Get client info for tracking
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent", "")[:500]

    with get_db_session() as db:
        # Check if email already exists
        existing = db.query(Waitlist).filter(Waitlist.email == email).first()

        if existing:
            if existing.status == WaitlistStatus.CONFIRMED:
                return WaitlistSignupResponse(
                    success=True,
                    message="You're already on the waitlist!",
                    position=existing.position,
                )
            else:
                # Resend confirmation email for pending entries
                await send_waitlist_confirmation_email(email, existing.confirmation_token)
                return WaitlistSignupResponse(
                    success=True,
                    message="Confirmation email resent. Please check your inbox.",
                    position=existing.position,
                )

        # Calculate position (max position + 1)
        max_position = db.query(func.max(Waitlist.position)).scalar() or 0
        new_position = max_position + 1

        # Create new waitlist entry
        entry = Waitlist(
            email=email,
            referral_source=data.referral_source,
            ip_address=ip_address,
            user_agent=user_agent,
            position=new_position,
            status=WaitlistStatus.PENDING,
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)

        # Send confirmation email
        email_sent = await send_waitlist_confirmation_email(email, entry.confirmation_token)

        if email_sent:
            return WaitlistSignupResponse(
                success=True,
                message="Please check your email to confirm your spot!",
                position=new_position,
            )
        else:
            # Email failed but entry created - user can retry
            logger.warning(f"Failed to send confirmation email to {email}")
            return WaitlistSignupResponse(
                success=True,
                message="You've been added! We'll send a confirmation email shortly.",
                position=new_position,
            )


@router.post("/confirm", response_model=WaitlistConfirmResponse)
async def confirm_waitlist(data: WaitlistConfirmRequest):
    """
    Confirm email address using token from confirmation email.
    """
    with get_db_session() as db:
        entry = db.query(Waitlist).filter(
            Waitlist.confirmation_token == data.token
        ).first()

        if not entry:
            raise HTTPException(status_code=404, detail="Invalid or expired confirmation token")

        if entry.status == WaitlistStatus.CONFIRMED:
            return WaitlistConfirmResponse(
                success=True,
                message="Your email is already confirmed!",
                email=entry.email,
            )

        # Update status to confirmed
        entry.status = WaitlistStatus.CONFIRMED
        entry.confirmed_at = datetime.utcnow()
        db.commit()

        logger.info(f"Waitlist entry confirmed: {entry.email} (position {entry.position})")

        return WaitlistConfirmResponse(
            success=True,
            message="Your spot is confirmed! We'll notify you when we launch.",
            email=entry.email,
        )


@router.get("/status/{token}")
async def get_waitlist_status(token: str):
    """
    Check waitlist status by confirmation token.
    Used by the frontend confirmation page.
    """
    with get_db_session() as db:
        entry = db.query(Waitlist).filter(
            Waitlist.confirmation_token == token
        ).first()

        if not entry:
            raise HTTPException(status_code=404, detail="Token not found")

        return {
            "email": entry.email,
            "status": entry.status.value if entry.status else "pending",
            "position": entry.position,
            "confirmed_at": entry.confirmed_at.isoformat() if entry.confirmed_at else None,
        }
