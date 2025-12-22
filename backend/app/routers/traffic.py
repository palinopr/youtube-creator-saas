"""
Traffic Sources API Router

Provides endpoints for traffic source analytics, subscriber sources, and playback locations.
Uses YouTube Analytics API to understand where views and subscribers come from.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
import logging

from ..auth import get_authenticated_service
from ..auth.dependencies import get_current_user
from ..db.models import User
from ..services.youtube import YouTubeTools

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/traffic", tags=["traffic"])


@router.get("/sources")
async def get_traffic_sources(
    days: int = Query(default=30, ge=1, le=365, description="Days of history"),
    user: User = Depends(get_current_user)
):
    """
    Get traffic source breakdown showing where views come from.

    Traffic source types:
    - YT_SEARCH: YouTube Search
    - RELATED_VIDEO: Suggested Videos (algorithm recommendation)
    - BROWSE: Browse Features (home page, subscription feed)
    - EXT_URL: External Websites
    - PLAYLIST: Playlists
    - NOTIFICATION: Bell notifications
    - END_SCREEN: End screen clicks
    - SHORTS: Shorts feed
    - SUBSCRIBER: Subscriber feed
    - And more...

    Returns views, watch time, and percentage per source.
    Critical for understanding channel growth drivers.
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        youtube_analytics = get_authenticated_service("youtubeAnalytics", "v2")
        tools = YouTubeTools(youtube, youtube_analytics)

        data = tools.get_traffic_sources(days=days)

        if "error" in data:
            raise HTTPException(status_code=400, detail=data["error"])

        return data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching traffic sources: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/subscribers")
async def get_subscriber_sources(
    days: int = Query(default=30, ge=1, le=365, description="Days of history"),
    user: User = Depends(get_current_user)
):
    """
    Get subscriber gain/loss by source.

    Shows:
    - Where subscribers are gained (from subscribed vs non-subscribed viewers)
    - Where subscribers are lost
    - Net change per source

    Useful for understanding subscriber conversion rates and churn.
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        youtube_analytics = get_authenticated_service("youtubeAnalytics", "v2")
        tools = YouTubeTools(youtube, youtube_analytics)

        data = tools.get_subscriber_sources(days=days)

        if "error" in data:
            raise HTTPException(status_code=400, detail=data["error"])

        return data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching subscriber sources: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/playback-locations")
async def get_playback_locations(
    days: int = Query(default=30, ge=1, le=365, description="Days of history"),
    user: User = Depends(get_current_user)
):
    """
    Get where videos are being watched (playback location).

    Playback location types:
    - WATCH: YouTube Watch Page (standard viewing)
    - EMBEDDED: Embedded Player (on external websites)
    - CHANNEL: Channel Page
    - SEARCH: Search Results preview
    - BROWSE: Browse Features
    - SHORTS: YouTube Shorts player
    - YT_OTHER: Other YouTube Pages
    - EXTERNAL_APP: External Apps (mobile apps with YouTube API)

    Returns views, watch time, and percentage per location.
    Useful for understanding where your content is consumed.
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        youtube_analytics = get_authenticated_service("youtubeAnalytics", "v2")
        tools = YouTubeTools(youtube, youtube_analytics)

        data = tools.get_playback_locations(days=days)

        if "error" in data:
            raise HTTPException(status_code=400, detail=data["error"])

        return data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching playback locations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary")
async def get_traffic_summary(
    days: int = Query(default=30, ge=1, le=365, description="Days of history"),
    user: User = Depends(get_current_user)
):
    """
    Get comprehensive traffic summary combining all traffic analytics.

    Includes:
    - Traffic sources (where views come from)
    - Subscriber sources (where subs come from)
    - Playback locations (where videos are watched)

    One call to get all traffic intelligence data.
    Useful for the main Traffic dashboard page.
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        youtube_analytics = get_authenticated_service("youtubeAnalytics", "v2")
        tools = YouTubeTools(youtube, youtube_analytics)

        # Fetch all traffic data
        traffic_sources = tools.get_traffic_sources(days=days)
        subscriber_sources = tools.get_subscriber_sources(days=days)
        playback_locations = tools.get_playback_locations(days=days)

        # Check for errors
        errors = []
        if "error" in traffic_sources:
            errors.append(f"traffic_sources: {traffic_sources['error']}")
        if "error" in subscriber_sources:
            errors.append(f"subscriber_sources: {subscriber_sources['error']}")
        if "error" in playback_locations:
            errors.append(f"playback_locations: {playback_locations['error']}")

        # Calculate key insights
        insights = []

        # Top traffic source
        if "sources" in traffic_sources and traffic_sources["sources"]:
            top_source = traffic_sources["sources"][0]
            insights.append({
                "type": "top_traffic_source",
                "title": f"{top_source['source_name']} is your #1 traffic source",
                "description": f"{top_source['percentage']}% of views ({top_source['views']:,} views)",
            })

        # Subscriber health
        if "net_change" in subscriber_sources:
            net = subscriber_sources["net_change"]
            gained = subscriber_sources.get("total_gained", 0)
            lost = subscriber_sources.get("total_lost", 0)
            if gained > 0:
                retention_rate = round(((gained - lost) / gained) * 100, 1)
                insights.append({
                    "type": "subscriber_health",
                    "title": f"Subscriber retention: {retention_rate}%",
                    "description": f"+{gained:,} gained, -{lost:,} lost = {net:+,} net",
                })

        return {
            "period": f"{days} days",
            "traffic_sources": traffic_sources if "error" not in traffic_sources else None,
            "subscriber_sources": subscriber_sources if "error" not in subscriber_sources else None,
            "playback_locations": playback_locations if "error" not in playback_locations else None,
            "insights": insights,
            "errors": errors if errors else None,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching traffic summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))
