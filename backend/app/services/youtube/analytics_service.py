"""
YouTube analytics service - demographics, traffic, geography, and audience metrics.
"""

from typing import List, Dict, Any
from datetime import datetime, timedelta
import logging

from googleapiclient.errors import HttpError

from .base import YouTubeBaseService, youtube_api_retry

logger = logging.getLogger(__name__)


# Country code to name mapping
COUNTRY_NAMES = {
    "US": "United States", "GB": "United Kingdom", "CA": "Canada",
    "AU": "Australia", "DE": "Germany", "FR": "France", "IN": "India",
    "BR": "Brazil", "MX": "Mexico", "JP": "Japan", "KR": "South Korea",
    "ES": "Spain", "IT": "Italy", "NL": "Netherlands", "RU": "Russia",
    "PH": "Philippines", "ID": "Indonesia", "TH": "Thailand", "VN": "Vietnam",
    "PL": "Poland", "AR": "Argentina", "CO": "Colombia", "CL": "Chile",
    "ZA": "South Africa", "NG": "Nigeria", "EG": "Egypt", "SA": "Saudi Arabia",
    "AE": "UAE", "TR": "Turkey", "PK": "Pakistan", "BD": "Bangladesh",
    "MY": "Malaysia", "SG": "Singapore", "NZ": "New Zealand", "IE": "Ireland",
    "SE": "Sweden", "NO": "Norway", "DK": "Denmark", "FI": "Finland",
    "AT": "Austria", "CH": "Switzerland", "BE": "Belgium", "PT": "Portugal",
}

# Traffic source labels
TRAFFIC_SOURCE_LABELS = {
    "ADVERTISING": "Advertising",
    "ANNOTATION": "Annotations",
    "CAMPAIGN_CARD": "Campaign Cards",
    "END_SCREEN": "End Screens",
    "EXT_URL": "External Websites",
    "HASHTAGS": "Hashtags",
    "NOTIFICATION": "Notifications",
    "NO_LINK_EMBEDDED": "Embedded (No Link)",
    "NO_LINK_OTHER": "Other (No Link)",
    "PLAYLIST": "Playlists",
    "PROMOTED": "Promoted Content",
    "RELATED_VIDEO": "Suggested Videos",
    "SHORTS": "Shorts Feed",
    "SUBSCRIBER": "Subscriber Feed",
    "YT_CHANNEL": "Channel Page",
    "YT_OTHER_PAGE": "Other YouTube Pages",
    "YT_PLAYLIST_PAGE": "Playlist Pages",
    "YT_SEARCH": "YouTube Search",
    "EXTERNAL_APP": "External Apps",
    "LIVE_REDIRECT": "Live Redirect",
    "VIDEO_REMIXES": "Video Remixes",
}

# Device type mappings
DEVICE_ICONS = {
    "MOBILE": "📱",
    "DESKTOP": "💻",
    "TABLET": "📱",
    "TV": "📺",
    "GAME_CONSOLE": "🎮",
    "UNKNOWN": "❓",
}

DEVICE_LABELS = {
    "MOBILE": "Mobile",
    "DESKTOP": "Desktop",
    "TABLET": "Tablet",
    "TV": "TV",
    "GAME_CONSOLE": "Game Console",
    "UNKNOWN": "Unknown",
}


class YouTubeAnalyticsService(YouTubeBaseService):
    """Service for YouTube Analytics operations."""

    def _get_date_range(self, days: int) -> tuple[str, str]:
        """Get start and end date strings for analytics queries."""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        return start_date.strftime("%Y-%m-%d"), end_date.strftime("%Y-%m-%d")

    @youtube_api_retry
    def get_analytics_overview(self, days: int = 30) -> Dict[str, Any]:
        """Get analytics overview for the past N days."""
        if not self.analytics:
            return {"error": "Analytics service not available"}

        start_date, end_date = self._get_date_range(days)

        try:
            response = self.analytics.reports().query(
                ids=f"channel=={self.channel_id}",
                startDate=start_date,
                endDate=end_date,
                metrics="views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost,likes,dislikes,shares,comments",
                dimensions="day",
                sort="day"
            ).execute()

            rows = response.get("rows", [])

            # Aggregate totals
            totals = {
                "views": 0,
                "watch_time_minutes": 0,
                "avg_view_duration": 0,
                "subscribers_gained": 0,
                "subscribers_lost": 0,
                "likes": 0,
                "dislikes": 0,
                "shares": 0,
                "comments": 0,
            }

            daily_data = []
            for row in rows:
                date = row[0]
                daily = {
                    "date": date,
                    "views": row[1],
                    "watch_time_minutes": row[2],
                    "avg_view_duration": row[3],
                    "subscribers_gained": row[4],
                    "subscribers_lost": row[5],
                    "likes": row[6],
                    "dislikes": row[7],
                    "shares": row[8],
                    "comments": row[9],
                }
                daily_data.append(daily)

                totals["views"] += row[1]
                totals["watch_time_minutes"] += row[2]
                totals["subscribers_gained"] += row[4]
                totals["subscribers_lost"] += row[5]
                totals["likes"] += row[6]
                totals["dislikes"] += row[7]
                totals["shares"] += row[8]
                totals["comments"] += row[9]

            if rows:
                totals["avg_view_duration"] = totals["watch_time_minutes"] * 60 / totals["views"] if totals["views"] > 0 else 0

            return {
                "period": f"{days} days",
                "start_date": start_date,
                "end_date": end_date,
                "totals": totals,
                "daily_data": daily_data,
            }

        except Exception as e:
            return {"error": str(e)}

    @youtube_api_retry
    def get_demographics(self, days: int = 30) -> Dict[str, Any]:
        """
        Get audience demographics breakdown by age group and gender.
        Returns viewerPercentage for each demographic segment.
        """
        if not self.analytics:
            return {"error": "Analytics service not available"}

        start_date, end_date = self._get_date_range(days)

        try:
            # First, get total views for calculating estimated view counts
            views_response = self.analytics.reports().query(
                ids=f"channel=={self.channel_id}",
                startDate=start_date,
                endDate=end_date,
                metrics="views"
            ).execute()
            total_views = views_response.get("rows", [[0]])[0][0] if views_response.get("rows") else 0

            # Get age group breakdown
            age_response = self.analytics.reports().query(
                ids=f"channel=={self.channel_id}",
                startDate=start_date,
                endDate=end_date,
                metrics="viewerPercentage",
                dimensions="ageGroup",
                sort="-viewerPercentage"
            ).execute()

            age_groups = []
            for row in age_response.get("rows", []):
                percentage = round(row[1], 2)
                estimated_views = int(total_views * percentage / 100) if total_views > 0 else 0
                age_groups.append({
                    "age_group": row[0],
                    "views": estimated_views,  # Frontend expects views field
                    "percentage": percentage
                })

            # Get gender breakdown
            gender_response = self.analytics.reports().query(
                ids=f"channel=={self.channel_id}",
                startDate=start_date,
                endDate=end_date,
                metrics="viewerPercentage",
                dimensions="gender",
                sort="-viewerPercentage"
            ).execute()

            genders = []
            gender_obj = {}  # Object format for frontend compatibility
            for row in gender_response.get("rows", []):
                gender_label = row[0]
                if gender_label == "male":
                    gender_label = "Male"
                elif gender_label == "female":
                    gender_label = "Female"
                else:
                    gender_label = "Other"

                percentage = round(row[1], 2)
                estimated_views = int(total_views * percentage / 100) if total_views > 0 else 0

                genders.append({
                    "gender": gender_label,
                    "percentage": percentage
                })

                # Build object format: { male: { views, percentage }, female: {...} }
                gender_obj[gender_label.lower()] = {
                    "views": estimated_views,
                    "percentage": percentage
                }

            # Get combined age-gender breakdown for detailed analysis
            combined_response = self.analytics.reports().query(
                ids=f"channel=={self.channel_id}",
                startDate=start_date,
                endDate=end_date,
                metrics="viewerPercentage",
                dimensions="ageGroup,gender",
                sort="-viewerPercentage"
            ).execute()

            combined = []
            for row in combined_response.get("rows", []):
                combined.append({
                    "age_group": row[0],
                    "gender": row[1].capitalize(),
                    "percentage": round(row[2], 2)
                })

            return {
                "period": f"{days} days",
                "start_date": start_date,
                "end_date": end_date,
                "age_groups": age_groups,
                "genders": genders,  # Keep array format for compatibility
                "gender": gender_obj,  # Object format for frontend
                "combined": combined[:10],  # Top 10 segments
                "total_views": total_views,  # Include total views
            }

        except Exception as e:
            logger.error(f"Error fetching demographics: {e}")
            return {"error": str(e)}

    @youtube_api_retry
    def get_traffic_sources(self, days: int = 30) -> Dict[str, Any]:
        """
        Get traffic source breakdown showing where views come from.
        Sources include: Browse, Search, Suggested, External, Playlists, etc.
        """
        if not self.analytics:
            return {"error": "Analytics service not available"}

        start_date, end_date = self._get_date_range(days)

        try:
            response = self.analytics.reports().query(
                ids=f"channel=={self.channel_id}",
                startDate=start_date,
                endDate=end_date,
                metrics="views,estimatedMinutesWatched",
                dimensions="insightTrafficSourceType",
                sort="-views"
            ).execute()

            total_views = 0
            sources = []

            for row in response.get("rows", []):
                source_type = row[0]
                views = row[1]
                watch_time = row[2]
                total_views += views

                sources.append({
                    "source_type": source_type,
                    "source_name": TRAFFIC_SOURCE_LABELS.get(source_type, source_type.replace("_", " ").title()),
                    "views": views,
                    "watch_time_minutes": round(watch_time, 1),
                })

            # Calculate percentages
            for source in sources:
                source["percentage"] = round((source["views"] / total_views * 100), 1) if total_views > 0 else 0

            return {
                "period": f"{days} days",
                "start_date": start_date,
                "end_date": end_date,
                "total_views": total_views,
                "sources": sources,
            }

        except Exception as e:
            logger.error(f"Error fetching traffic sources: {e}")
            return {"error": str(e)}

    @youtube_api_retry
    def get_geography(self, days: int = 30, limit: int = 20) -> Dict[str, Any]:
        """
        Get geographic distribution of views by country.
        Returns views, watch time, and average view duration per country.
        """
        if not self.analytics:
            return {"error": "Analytics service not available"}

        start_date, end_date = self._get_date_range(days)

        try:
            response = self.analytics.reports().query(
                ids=f"channel=={self.channel_id}",
                startDate=start_date,
                endDate=end_date,
                metrics="views,estimatedMinutesWatched,averageViewDuration",
                dimensions="country",
                sort="-views",
                maxResults=limit
            ).execute()

            total_views = 0
            countries = []

            for row in response.get("rows", []):
                country_code = row[0]
                views = row[1]
                watch_time = row[2]
                avg_duration = row[3]
                total_views += views

                countries.append({
                    "country_code": country_code,
                    "country": COUNTRY_NAMES.get(country_code, country_code),  # Frontend expects "country"
                    "country_name": COUNTRY_NAMES.get(country_code, country_code),  # Keep for compatibility
                    "views": views,
                    "watch_time_hours": round(watch_time / 60, 2),  # Frontend expects hours
                    "watch_time_minutes": round(watch_time, 1),  # Keep for compatibility
                    "avg_view_duration_seconds": round(avg_duration, 1),
                })

            # Calculate percentages
            for country in countries:
                country["percentage"] = round((country["views"] / total_views * 100), 1) if total_views > 0 else 0

            return {
                "period": f"{days} days",
                "start_date": start_date,
                "end_date": end_date,
                "total_views": total_views,
                "countries": countries,
            }

        except Exception as e:
            logger.error(f"Error fetching geography: {e}")
            return {"error": str(e)}

    @youtube_api_retry
    def get_device_types(self, days: int = 30) -> Dict[str, Any]:
        """
        Get device type breakdown (mobile, desktop, tablet, TV, game console).
        Helps understand how audience consumes content.
        """
        if not self.analytics:
            return {"error": "Analytics service not available"}

        start_date, end_date = self._get_date_range(days)

        try:
            response = self.analytics.reports().query(
                ids=f"channel=={self.channel_id}",
                startDate=start_date,
                endDate=end_date,
                metrics="views,estimatedMinutesWatched,averageViewDuration",
                dimensions="deviceType",
                sort="-views"
            ).execute()

            total_views = 0
            devices = []

            for row in response.get("rows", []):
                device_type = row[0]
                views = row[1]
                watch_time = row[2]
                avg_duration = row[3]
                total_views += views

                devices.append({
                    "device_type": device_type,
                    "device_name": DEVICE_LABELS.get(device_type, device_type),
                    "icon": DEVICE_ICONS.get(device_type, "❓"),
                    "views": views,
                    "watch_time_hours": round(watch_time / 60, 2),  # Frontend expects hours
                    "watch_time_minutes": round(watch_time, 1),  # Keep for compatibility
                    "avg_view_duration_seconds": round(avg_duration, 1),
                })

            # Calculate percentages
            for device in devices:
                device["percentage"] = round((device["views"] / total_views * 100), 1) if total_views > 0 else 0

            return {
                "period": f"{days} days",
                "start_date": start_date,
                "end_date": end_date,
                "total_views": total_views,
                "devices": devices,
            }

        except Exception as e:
            logger.error(f"Error fetching device types: {e}")
            return {"error": str(e)}

    @youtube_api_retry
    def get_revenue_data(self, days: int = 30) -> Dict[str, Any]:
        """
        Get revenue and monetization data.
        Requires yt-analytics-monetary.readonly OAuth scope.
        Returns estimated revenue, ad revenue, CPM, and playback-based CPM.
        """
        if not self.analytics:
            return {"error": "Analytics service not available"}

        start_date, end_date = self._get_date_range(days)

        try:
            # Daily revenue data
            daily_response = self.analytics.reports().query(
                ids=f"channel=={self.channel_id}",
                startDate=start_date,
                endDate=end_date,
                metrics="estimatedRevenue,estimatedAdRevenue,estimatedRedPartnerRevenue,grossRevenue,cpm,playbackBasedCpm,monetizedPlaybacks,adImpressions",
                dimensions="day",
                sort="day"
            ).execute()

            daily_data = []
            totals = {
                "estimated_revenue": 0,
                "ad_revenue": 0,
                "youtube_premium_revenue": 0,
                "gross_revenue": 0,
                "monetized_playbacks": 0,
                "ad_impressions": 0,
            }

            for row in daily_response.get("rows", []):
                date = row[0]
                estimated_revenue = row[1]
                ad_revenue = row[2]
                premium_revenue = row[3]
                gross_revenue = row[4]
                cpm = row[5]
                playback_cpm = row[6]
                monetized_playbacks = row[7]
                ad_impressions = row[8]

                daily_data.append({
                    "date": date,
                    "estimated_revenue": round(estimated_revenue, 2),
                    "ad_revenue": round(ad_revenue, 2),
                    "premium_revenue": round(premium_revenue, 2),
                    "cpm": round(cpm, 2),
                    "playback_cpm": round(playback_cpm, 2),
                })

                totals["estimated_revenue"] += estimated_revenue
                totals["ad_revenue"] += ad_revenue
                totals["youtube_premium_revenue"] += premium_revenue
                totals["gross_revenue"] += gross_revenue
                totals["monetized_playbacks"] += monetized_playbacks
                totals["ad_impressions"] += ad_impressions

            # Calculate averages
            if totals["monetized_playbacks"] > 0:
                totals["avg_cpm"] = round((totals["estimated_revenue"] / totals["monetized_playbacks"]) * 1000, 2)
            else:
                totals["avg_cpm"] = 0

            # Round totals
            totals["estimated_revenue"] = round(totals["estimated_revenue"], 2)
            totals["ad_revenue"] = round(totals["ad_revenue"], 2)
            totals["youtube_premium_revenue"] = round(totals["youtube_premium_revenue"], 2)
            totals["gross_revenue"] = round(totals["gross_revenue"], 2)

            # Revenue by country (CPM varies significantly by geography)
            country_response = self.analytics.reports().query(
                ids=f"channel=={self.channel_id}",
                startDate=start_date,
                endDate=end_date,
                metrics="estimatedRevenue,cpm,monetizedPlaybacks",
                dimensions="country",
                sort="-estimatedRevenue",
                maxResults=10
            ).execute()

            revenue_by_country = []
            for row in country_response.get("rows", []):
                country_code = row[0]
                revenue_by_country.append({
                    "country_code": country_code,
                    "country_name": COUNTRY_NAMES.get(country_code, country_code),
                    "revenue": round(row[1], 2),
                    "cpm": round(row[2], 2),
                    "monetized_playbacks": row[3],
                })

            return {
                "period": f"{days} days",
                "start_date": start_date,
                "end_date": end_date,
                "totals": totals,
                "daily_data": daily_data,
                "revenue_by_country": revenue_by_country,
            }

        except HttpError as e:
            if e.resp.status == 403:
                return {
                    "error": "monetization_not_available",
                    "message": "Revenue data requires YouTube Partner Program membership and monetary API scope. Please ensure your channel is monetized and re-authenticate with the monetary scope."
                }
            logger.error(f"Error fetching revenue data: {e}")
            return {"error": str(e)}
        except Exception as e:
            logger.error(f"Error fetching revenue data: {e}")
            return {"error": str(e)}

    @youtube_api_retry
    def get_subscriber_sources(self, days: int = 30) -> Dict[str, Any]:
        """
        Get subscriber gain/loss by source.
        Shows where subscribers come from and where they're lost.
        """
        if not self.analytics:
            return {"error": "Analytics service not available"}

        start_date, end_date = self._get_date_range(days)

        try:
            response = self.analytics.reports().query(
                ids=f"channel=={self.channel_id}",
                startDate=start_date,
                endDate=end_date,
                metrics="subscribersGained,subscribersLost",
                dimensions="day",
                sort="day"
            ).execute()

            daily_data = []
            total_gained = 0
            total_lost = 0

            for row in response.get("rows", []):
                date = row[0]
                gained = row[1]
                lost = row[2]
                total_gained += gained
                total_lost += lost

                daily_data.append({
                    "date": date,
                    "subscribers_gained": gained,
                    "subscribers_lost": lost,
                    "net_change": gained - lost,
                })

            return {
                "period": f"{days} days",
                "start_date": start_date,
                "end_date": end_date,
                "total_gained": total_gained,
                "total_lost": total_lost,
                "net_change": total_gained - total_lost,
                "daily_data": daily_data,
            }

        except Exception as e:
            logger.error(f"Error fetching subscriber sources: {e}")
            return {"error": str(e)}

    @youtube_api_retry
    def get_playback_locations(self, days: int = 30) -> Dict[str, Any]:
        """
        Get where videos are being watched (YouTube watch page, embedded, etc.).
        """
        if not self.analytics:
            return {"error": "Analytics service not available"}

        start_date, end_date = self._get_date_range(days)

        try:
            response = self.analytics.reports().query(
                ids=f"channel=={self.channel_id}",
                startDate=start_date,
                endDate=end_date,
                metrics="views,estimatedMinutesWatched",
                dimensions="insightPlaybackLocationType",
                sort="-views"
            ).execute()

            total_views = 0
            locations = []

            location_labels = {
                "WATCH": "YouTube Watch Page",
                "EMBEDDED": "Embedded Player",
                "CHANNEL": "Channel Page",
                "SEARCH": "Search Results",
                "BROWSE": "Browse Features",
                "SHORTS": "YouTube Shorts",
                "YT_OTHER": "Other YouTube Pages",
                "EXTERNAL_APP": "External App",
            }

            for row in response.get("rows", []):
                location_type = row[0]
                views = row[1]
                watch_time = row[2]
                total_views += views

                locations.append({
                    "location_type": location_type,
                    "location_name": location_labels.get(location_type, location_type.replace("_", " ").title()),
                    "views": views,
                    "watch_time_minutes": round(watch_time, 1),
                })

            # Calculate percentages
            for location in locations:
                location["percentage"] = round((location["views"] / total_views * 100), 1) if total_views > 0 else 0

            return {
                "period": f"{days} days",
                "start_date": start_date,
                "end_date": end_date,
                "total_views": total_views,
                "locations": locations,
            }

        except Exception as e:
            logger.error(f"Error fetching playback locations: {e}")
            return {"error": str(e)}

    @youtube_api_retry
    def get_top_videos(self, days: int = 30, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top performing videos by views in the past N days."""
        if not self.analytics:
            return []

        start_date, end_date = self._get_date_range(days)

        try:
            response = self.analytics.reports().query(
                ids=f"channel=={self.channel_id}",
                startDate=start_date,
                endDate=end_date,
                metrics="views,estimatedMinutesWatched,averageViewDuration,likes,comments",
                dimensions="video",
                sort="-views",
                maxResults=limit
            ).execute()

            video_ids = [row[0] for row in response.get("rows", [])]

            if not video_ids:
                return []

            # Get video details
            videos_response = self.youtube.videos().list(
                part="snippet",
                id=",".join(video_ids)
            ).execute()

            video_titles = {
                v["id"]: v["snippet"]["title"]
                for v in videos_response.get("items", [])
            }

            top_videos = []
            for row in response.get("rows", []):
                video_id = row[0]
                top_videos.append({
                    "video_id": video_id,
                    "title": video_titles.get(video_id, "Unknown"),
                    "views": row[1],
                    "watch_time_minutes": row[2],
                    "avg_view_duration": row[3],
                    "likes": row[4],
                    "comments": row[5],
                })

            return top_videos

        except Exception as e:
            return []
