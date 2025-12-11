"""
Audience Intelligence API Router

Provides endpoints for audience demographics, geography, and device type analytics.
Uses YouTube Analytics API to fetch viewerPercentage breakdowns.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
import logging

from ..auth import get_authenticated_service
from ..auth.dependencies import get_current_user
from ..db.models import User
from ..tools.youtube_tools import YouTubeTools

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/audience", tags=["audience"])


@router.get("/demographics")
async def get_demographics(
    days: int = Query(default=30, ge=1, le=365, description="Days of history"),
    user: User = Depends(get_current_user)
):
    """
    Get audience demographics breakdown by age group and gender.

    Returns viewerPercentage for each demographic segment:
    - Age groups: 13-17, 18-24, 25-34, 35-44, 45-54, 55-64, 65+
    - Gender: Male, Female, Other
    - Combined age-gender breakdown (top 10)
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        youtube_analytics = get_authenticated_service("youtubeAnalytics", "v2")
        tools = YouTubeTools(youtube, youtube_analytics)

        data = tools.get_demographics(days=days)

        if "error" in data:
            raise HTTPException(status_code=400, detail=data["error"])

        return data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching demographics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/geography")
async def get_geography(
    days: int = Query(default=30, ge=1, le=365, description="Days of history"),
    limit: int = Query(default=20, ge=1, le=100, description="Number of countries to return"),
    user: User = Depends(get_current_user)
):
    """
    Get geographic distribution of views by country.

    Returns per country:
    - views: Total view count
    - watch_time_minutes: Total watch time
    - avg_view_duration_seconds: Average view duration
    - percentage: Percentage of total views

    Sorted by view count descending.
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        youtube_analytics = get_authenticated_service("youtubeAnalytics", "v2")
        tools = YouTubeTools(youtube, youtube_analytics)

        data = tools.get_geography(days=days, limit=limit)

        if "error" in data:
            raise HTTPException(status_code=400, detail=data["error"])

        return data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching geography: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/devices")
async def get_device_types(
    days: int = Query(default=30, ge=1, le=365, description="Days of history"),
    user: User = Depends(get_current_user)
):
    """
    Get device type breakdown showing how audience consumes content.

    Device types:
    - MOBILE 📱: Smartphones
    - DESKTOP 💻: Desktop/laptop computers
    - TABLET 📱: Tablets
    - TV 📺: Smart TVs, Chromecast, etc.
    - GAME_CONSOLE 🎮: PlayStation, Xbox, etc.

    Returns views, watch time, and average view duration per device.
    Useful for optimizing content format (vertical vs horizontal, etc.)
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        youtube_analytics = get_authenticated_service("youtubeAnalytics", "v2")
        tools = YouTubeTools(youtube, youtube_analytics)

        data = tools.get_device_types(days=days)

        if "error" in data:
            raise HTTPException(status_code=400, detail=data["error"])

        return data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching device types: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary")
async def get_audience_summary(
    days: int = Query(default=30, ge=1, le=365, description="Days of history"),
    user: User = Depends(get_current_user)
):
    """
    Get comprehensive audience summary combining demographics, geography, and devices.

    One call to get all audience intelligence data.
    Useful for the main Audience dashboard page.
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        youtube_analytics = get_authenticated_service("youtubeAnalytics", "v2")
        tools = YouTubeTools(youtube, youtube_analytics)

        # Fetch all audience data
        demographics = tools.get_demographics(days=days)
        geography = tools.get_geography(days=days, limit=10)
        devices = tools.get_device_types(days=days)

        # Check for errors
        errors = []
        if "error" in demographics:
            errors.append(f"demographics: {demographics['error']}")
        if "error" in geography:
            errors.append(f"geography: {geography['error']}")
        if "error" in devices:
            errors.append(f"devices: {devices['error']}")

        return {
            "period": f"{days} days",
            "demographics": demographics if "error" not in demographics else None,
            "geography": geography if "error" not in geography else None,
            "devices": devices if "error" not in devices else None,
            "errors": errors if errors else None,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching audience summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))
