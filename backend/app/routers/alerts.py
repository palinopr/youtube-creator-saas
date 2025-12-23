"""
Alerts API Router

Provides endpoints for in-app notifications including:
- Fetching user alerts (all, unread only, by type)
- Marking alerts as read
- Dismissing alerts
- Getting unread count for notification badge
- Triggering alert checks (manual refresh)
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from datetime import datetime
import logging

from ..auth import get_authenticated_service
from ..auth.dependencies import get_current_user
from ..db.models import User, AlertType, AlertPriority
from ..agents.alert_agent import (
    AlertAgent,
    get_user_alerts,
    get_unread_count,
    mark_alert_read,
    mark_all_alerts_read,
    dismiss_alert,
    cleanup_duplicate_alerts,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("")
async def list_alerts(
    limit: int = Query(default=20, ge=1, le=100, description="Maximum alerts to return"),
    unread_only: bool = Query(default=False, description="Only return unread alerts"),
    alert_type: Optional[str] = Query(default=None, description="Filter by alert type"),
    user: User = Depends(get_current_user)
):
    """
    Get alerts for the current user.

    Returns a list of alerts sorted by most recent first.
    Can filter by:
    - unread_only: Only show unread alerts
    - alert_type: Filter by type (viral, drop, milestone, engagement, comment_surge, opportunity)
    """
    try:
        # Convert alert_type string to enum if provided
        type_filter = None
        if alert_type:
            try:
                type_filter = AlertType(alert_type)
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid alert type. Valid types: {[t.value for t in AlertType]}"
                )

        alerts = get_user_alerts(
            user_id=user.id,
            limit=limit,
            unread_only=unread_only,
            alert_type=type_filter
        )

        return {
            "alerts": alerts,
            "count": len(alerts),
            "unread_count": get_unread_count(user.id),
            "generated_at": datetime.utcnow().isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching alerts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/unread-count")
async def get_unread_alert_count(
    user: User = Depends(get_current_user)
):
    """
    Get the count of unread alerts.

    Useful for displaying a notification badge in the UI.
    """
    try:
        count = get_unread_count(user.id)
        return {"unread_count": count}

    except Exception as e:
        logger.error(f"Error getting unread count: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{alert_id}/read")
async def mark_as_read(
    alert_id: int,
    user: User = Depends(get_current_user)
):
    """
    Mark a specific alert as read.
    """
    try:
        success = mark_alert_read(user.id, alert_id)

        if not success:
            raise HTTPException(status_code=404, detail="Alert not found")

        return {
            "success": True,
            "message": "Alert marked as read",
            "alert_id": alert_id,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking alert as read: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/read-all")
async def mark_all_as_read(
    user: User = Depends(get_current_user)
):
    """
    Mark all alerts as read.
    """
    try:
        count = mark_all_alerts_read(user.id)

        return {
            "success": True,
            "message": f"Marked {count} alerts as read",
            "updated_count": count,
        }

    except Exception as e:
        logger.error(f"Error marking all alerts as read: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{alert_id}/dismiss")
async def dismiss_single_alert(
    alert_id: int,
    user: User = Depends(get_current_user)
):
    """
    Dismiss (soft delete) an alert.

    Dismissed alerts won't appear in the alerts list but are kept for analytics.
    """
    try:
        success = dismiss_alert(user.id, alert_id)

        if not success:
            raise HTTPException(status_code=404, detail="Alert not found")

        return {
            "success": True,
            "message": "Alert dismissed",
            "alert_id": alert_id,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error dismissing alert: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/check")
async def check_for_new_alerts(
    user: User = Depends(get_current_user)
):
    """
    Manually trigger alert checks for the current user.

    This runs all alert detection logic and creates new alerts if any
    significant events are detected. Useful for:
    - Testing the alert system
    - Forcing a refresh after major channel events
    - When the user wants immediate updates

    Note: In production, this should also run on a schedule (every 15-30 minutes).
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        youtube_analytics = get_authenticated_service("youtubeAnalytics", "v2")

        agent = AlertAgent(youtube, youtube_analytics, user_id=user.id)
        new_alerts = await agent.check_all_alerts()

        return {
            "success": True,
            "new_alerts_count": len(new_alerts),
            "alerts": new_alerts,
            "message": f"Found {len(new_alerts)} new alert(s)" if new_alerts else "No new alerts detected",
            "checked_at": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"Error checking for new alerts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cleanup")
async def cleanup_duplicates(
    user: User = Depends(get_current_user)
):
    """
    Remove duplicate alerts for the current user.

    Keeps only the oldest instance of each milestone alert
    and removes duplicate titles for other alert types.
    """
    try:
        deleted_count = cleanup_duplicate_alerts(user.id)

        return {
            "success": True,
            "deleted_count": deleted_count,
            "message": f"Removed {deleted_count} duplicate alert(s)" if deleted_count else "No duplicates found",
        }

    except Exception as e:
        logger.error(f"Error cleaning up duplicates: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/types")
async def get_alert_types():
    """
    Get all available alert types with descriptions.

    Useful for building filter UIs.
    """
    return {
        "types": [
            {
                "value": AlertType.VIRAL.value,
                "label": "Viral Video",
                "description": "Video performing 3x+ above channel average",
                "icon": "trending-up",
            },
            {
                "value": AlertType.DROP.value,
                "label": "Performance Drop",
                "description": "Significant decrease in views or engagement",
                "icon": "trending-down",
            },
            {
                "value": AlertType.MILESTONE.value,
                "label": "Milestone",
                "description": "Channel reached a subscriber milestone",
                "icon": "trophy",
            },
            {
                "value": AlertType.ENGAGEMENT.value,
                "label": "Engagement Spike",
                "description": "Unusual increase in likes or engagement",
                "icon": "heart",
            },
            {
                "value": AlertType.COMMENT_SURGE.value,
                "label": "Comment Surge",
                "description": "Unusual comment activity detected",
                "icon": "message-circle",
            },
            {
                "value": AlertType.OPPORTUNITY.value,
                "label": "Opportunity",
                "description": "Trending topic or opportunity in your niche",
                "icon": "lightbulb",
            },
            {
                "value": AlertType.WARNING.value,
                "label": "Warning",
                "description": "General warnings like upload consistency",
                "icon": "alert-triangle",
            },
        ]
    }


@router.get("/priorities")
async def get_alert_priorities():
    """
    Get all alert priority levels with descriptions.

    Useful for building priority filter UIs.
    """
    return {
        "priorities": [
            {
                "value": AlertPriority.CRITICAL.value,
                "label": "Critical",
                "description": "Requires immediate attention",
                "color": "red",
            },
            {
                "value": AlertPriority.HIGH.value,
                "label": "High",
                "description": "Important, should review soon",
                "color": "orange",
            },
            {
                "value": AlertPriority.MEDIUM.value,
                "label": "Medium",
                "description": "Notable but not urgent",
                "color": "yellow",
            },
            {
                "value": AlertPriority.LOW.value,
                "label": "Low",
                "description": "Informational",
                "color": "gray",
            },
        ]
    }
