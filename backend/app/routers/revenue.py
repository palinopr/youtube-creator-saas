"""
Revenue & Monetization API Router

Provides endpoints for YouTube revenue and monetization analytics.
Requires the yt-analytics-monetary.readonly OAuth scope.
Gracefully handles non-monetized channels.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
import logging

from ..auth import get_authenticated_service
from ..auth.dependencies import get_current_user
from ..db.models import User
from ..services.youtube import YouTubeTools

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/revenue", tags=["revenue"])


@router.get("/overview")
async def get_revenue_overview(
    days: int = Query(default=30, ge=1, le=365, description="Days of history"),
    user: User = Depends(get_current_user)
):
    """
    Get comprehensive revenue and monetization data.

    Requires:
    - YouTube Partner Program membership (channel must be monetized)
    - yt-analytics-monetary.readonly OAuth scope

    Returns:
    - totals: Aggregated revenue metrics
      - estimated_revenue: Total estimated earnings
      - ad_revenue: Revenue from ads
      - youtube_premium_revenue: Revenue from YouTube Premium viewers
      - gross_revenue: Gross revenue before YouTube's cut
      - avg_cpm: Average CPM (cost per 1000 monetized views)
      - monetized_playbacks: Number of ad-eligible plays
      - ad_impressions: Total ad impressions shown

    - daily_data: Day-by-day breakdown with revenue and CPM

    - revenue_by_country: Top 10 countries by revenue with CPM
      (CPM varies significantly by geography - US typically highest)

    If channel is not monetized, returns error with explanation.
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        youtube_analytics = get_authenticated_service("youtubeAnalytics", "v2")
        tools = YouTubeTools(youtube, youtube_analytics)

        data = tools.get_revenue_data(days=days)

        # Handle non-monetized channels gracefully
        if "error" in data:
            if data.get("error") == "monetization_not_available":
                return {
                    "available": False,
                    "error": "monetization_not_available",
                    "message": data.get("message", "Revenue data requires YouTube Partner Program membership."),
                    "help": {
                        "title": "How to enable revenue tracking",
                        "steps": [
                            "1. Meet YouTube Partner Program requirements (1,000 subs + 4,000 watch hours)",
                            "2. Apply for and get accepted to YouTube Partner Program",
                            "3. Link an AdSense account to your channel",
                            "4. Re-authenticate this app with the monetary API scope",
                        ]
                    }
                }
            raise HTTPException(status_code=400, detail=data["error"])

        return {
            "available": True,
            **data
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching revenue data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/by-country")
async def get_revenue_by_country(
    days: int = Query(default=30, ge=1, le=365, description="Days of history"),
    limit: int = Query(default=10, ge=1, le=50, description="Number of countries"),
    user: User = Depends(get_current_user)
):
    """
    Get revenue breakdown by country.

    Shows how much revenue comes from each country along with CPM.
    CPM (Cost Per Mille) varies dramatically by country:
    - US: Typically $5-15 CPM
    - UK/Canada/Australia: $4-10 CPM
    - Germany/France: $3-8 CPM
    - India/Brazil: $0.50-2 CPM

    Understanding geography helps optimize content strategy:
    - High CPM countries = more valuable views
    - Target content to high-value demographics
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        youtube_analytics = get_authenticated_service("youtubeAnalytics", "v2")
        tools = YouTubeTools(youtube, youtube_analytics)

        data = tools.get_revenue_data(days=days)

        if "error" in data:
            if data.get("error") == "monetization_not_available":
                return {
                    "available": False,
                    "message": "Revenue data requires YouTube Partner Program membership."
                }
            raise HTTPException(status_code=400, detail=data["error"])

        # Extract just the country data
        countries = data.get("revenue_by_country", [])[:limit]

        # Calculate total for percentages
        total_revenue = sum(c.get("revenue", 0) for c in countries)

        for country in countries:
            if total_revenue > 0:
                country["percentage"] = round((country["revenue"] / total_revenue) * 100, 1)
            else:
                country["percentage"] = 0

        return {
            "available": True,
            "period": data.get("period"),
            "start_date": data.get("start_date"),
            "end_date": data.get("end_date"),
            "total_revenue": round(total_revenue, 2),
            "countries": countries,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching revenue by country: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/daily")
async def get_daily_revenue(
    days: int = Query(default=30, ge=1, le=365, description="Days of history"),
    user: User = Depends(get_current_user)
):
    """
    Get daily revenue breakdown.

    Returns day-by-day revenue data for charts:
    - date: Date string (YYYY-MM-DD)
    - estimated_revenue: Daily earnings
    - ad_revenue: Revenue from ads
    - premium_revenue: Revenue from YouTube Premium
    - cpm: CPM for that day
    - playback_cpm: Playback-based CPM

    Useful for tracking revenue trends and identifying high/low days.
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        youtube_analytics = get_authenticated_service("youtubeAnalytics", "v2")
        tools = YouTubeTools(youtube, youtube_analytics)

        data = tools.get_revenue_data(days=days)

        if "error" in data:
            if data.get("error") == "monetization_not_available":
                return {
                    "available": False,
                    "message": "Revenue data requires YouTube Partner Program membership."
                }
            raise HTTPException(status_code=400, detail=data["error"])

        # Calculate stats
        daily_data = data.get("daily_data", [])
        revenues = [d.get("estimated_revenue", 0) for d in daily_data]

        stats = {
            "total": round(sum(revenues), 2),
            "average": round(sum(revenues) / len(revenues), 2) if revenues else 0,
            "best_day": max(revenues) if revenues else 0,
            "worst_day": min(revenues) if revenues else 0,
        }

        # Find best and worst days
        if daily_data:
            best_idx = revenues.index(stats["best_day"])
            worst_idx = revenues.index(stats["worst_day"])
            stats["best_day_date"] = daily_data[best_idx]["date"]
            stats["worst_day_date"] = daily_data[worst_idx]["date"]

        return {
            "available": True,
            "period": data.get("period"),
            "start_date": data.get("start_date"),
            "end_date": data.get("end_date"),
            "stats": stats,
            "daily_data": daily_data,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching daily revenue: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_monetization_status(
    user: User = Depends(get_current_user)
):
    """
    Check if monetization data is available for the channel.

    Quick check to determine if the channel is:
    1. Part of YouTube Partner Program
    2. Has AdSense linked
    3. Has granted monetary API scope

    Returns status without full revenue data.
    Useful for UI to know whether to show revenue dashboard.
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        youtube_analytics = get_authenticated_service("youtubeAnalytics", "v2")
        tools = YouTubeTools(youtube, youtube_analytics)

        # Try to fetch just 1 day of revenue to check access
        data = tools.get_revenue_data(days=1)

        if "error" in data:
            if data.get("error") == "monetization_not_available":
                return {
                    "monetization_available": False,
                    "reason": "Channel not monetized or monetary scope not granted",
                    "can_enable": True,
                }
            return {
                "monetization_available": False,
                "reason": data.get("error", "Unknown error"),
                "can_enable": False,
            }

        # If we got data, monetization is available
        totals = data.get("totals", {})

        return {
            "monetization_available": True,
            "has_revenue": totals.get("estimated_revenue", 0) > 0,
            "last_day_revenue": data.get("daily_data", [{}])[-1].get("estimated_revenue", 0) if data.get("daily_data") else 0,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking monetization status: {e}")
        return {
            "monetization_available": False,
            "reason": str(e),
            "can_enable": False,
        }
