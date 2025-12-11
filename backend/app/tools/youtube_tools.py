from typing import Optional, List, Dict, Any, Callable, TypeVar
from datetime import datetime, timedelta
from functools import wraps
import logging

from googleapiclient.discovery import Resource
from googleapiclient.errors import HttpError
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception,
    before_sleep_log,
    RetryError,
)

logger = logging.getLogger(__name__)

# Type variable for generic return types
T = TypeVar('T')


def is_retryable_error(exception: BaseException) -> bool:
    """
    Determine if an exception should trigger a retry.
    
    Retries on:
    - HTTP 429 (Too Many Requests / Rate Limited)
    - HTTP 5xx (Server Errors)
    - Connection errors
    """
    if isinstance(exception, HttpError):
        status_code = exception.resp.status
        # Retry on rate limiting (429) and server errors (5xx)
        if status_code == 429:
            logger.warning(f"Rate limited by YouTube API (429). Will retry...")
            return True
        if 500 <= status_code < 600:
            logger.warning(f"YouTube API server error ({status_code}). Will retry...")
            return True
    # Also retry on connection-related errors
    if isinstance(exception, (ConnectionError, TimeoutError)):
        logger.warning(f"Connection error: {exception}. Will retry...")
        return True
    return False


def youtube_api_retry(func: Callable[..., T]) -> Callable[..., T]:
    """
    Decorator that adds retry logic to YouTube API calls.
    
    Uses exponential backoff with:
    - Max 5 attempts
    - Wait 1s, 2s, 4s, 8s, 16s between retries (capped at 60s)
    - Only retries on rate limits (429) and server errors (5xx)
    """
    @retry(
        retry=retry_if_exception(is_retryable_error),
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=1, min=1, max=60),
        before_sleep=before_sleep_log(logger, logging.WARNING),
        reraise=True,
    )
    @wraps(func)
    def wrapper(*args, **kwargs) -> T:
        return func(*args, **kwargs)
    return wrapper


class YouTubeTools:
    """YouTube API wrapper tools for analytics and channel management."""
    
    def __init__(self, youtube_service: Resource, analytics_service: Optional[Resource] = None):
        self.youtube = youtube_service
        self.analytics = analytics_service
        self._channel_id: Optional[str] = None
    
    @property
    def channel_id(self) -> str:
        """Get the authenticated user's channel ID."""
        if not self._channel_id:
            self._channel_id = self._fetch_channel_id()
        return self._channel_id
    
    @youtube_api_retry
    def _fetch_channel_id(self) -> str:
        """Fetch channel ID with retry logic."""
        response = self.youtube.channels().list(
            part="id",
            mine=True
        ).execute()
        
        if not response.get("items"):
            raise ValueError("No channel found for authenticated user")
        
        return response["items"][0]["id"]
    
    @youtube_api_retry
    def get_channel_stats(self) -> Dict[str, Any]:
        """Get channel statistics including subscribers, views, and video count."""
        response = self.youtube.channels().list(
            part="snippet,statistics,brandingSettings",
            mine=True
        ).execute()
        
        if not response.get("items"):
            raise ValueError("No channel found for authenticated user")
        
        channel = response["items"][0]
        snippet = channel["snippet"]
        stats = channel["statistics"]
        
        return {
            "channel_id": channel["id"],
            "title": snippet["title"],
            "description": snippet.get("description", ""),
            "subscriber_count": int(stats.get("subscriberCount", 0)),
            "view_count": int(stats.get("viewCount", 0)),
            "video_count": int(stats.get("videoCount", 0)),
            "thumbnail_url": snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
        }
    
    @youtube_api_retry
    def get_recent_videos(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent videos from the channel with their statistics."""
        # First, get the uploads playlist ID
        channel_response = self.youtube.channels().list(
            part="contentDetails",
            mine=True
        ).execute()
        
        if not channel_response.get("items"):
            return []
        
        uploads_playlist_id = channel_response["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]
        
        # Get videos from uploads playlist
        playlist_response = self.youtube.playlistItems().list(
            part="snippet,contentDetails",
            playlistId=uploads_playlist_id,
            maxResults=limit
        ).execute()
        
        video_ids = [item["contentDetails"]["videoId"] for item in playlist_response.get("items", [])]
        
        if not video_ids:
            return []
        
        # Get video statistics
        videos_response = self.youtube.videos().list(
            part="snippet,statistics",
            id=",".join(video_ids)
        ).execute()
        
        videos = []
        for video in videos_response.get("items", []):
            snippet = video["snippet"]
            stats = video.get("statistics", {})
            
            videos.append({
                "video_id": video["id"],
                "title": snippet["title"],
                "published_at": snippet["publishedAt"],
                "view_count": int(stats.get("viewCount", 0)),
                "like_count": int(stats.get("likeCount", 0)),
                "comment_count": int(stats.get("commentCount", 0)),
                "thumbnail_url": snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
            })
        
        return videos
    
    @youtube_api_retry
    def get_video_details(self, video_id: str) -> Dict[str, Any]:
        """Get detailed information about a specific video."""
        response = self.youtube.videos().list(
            part="snippet,statistics,contentDetails",
            id=video_id
        ).execute()
        
        if not response.get("items"):
            raise ValueError(f"Video not found: {video_id}")
        
        video = response["items"][0]
        snippet = video["snippet"]
        stats = video.get("statistics", {})
        content = video.get("contentDetails", {})
        
        return {
            "video_id": video["id"],
            "title": snippet["title"],
            "description": snippet.get("description", ""),
            "published_at": snippet["publishedAt"],
            "channel_title": snippet["channelTitle"],
            "tags": snippet.get("tags", []),
            "category_id": snippet.get("categoryId", ""),
            "duration": content.get("duration", ""),
            "view_count": int(stats.get("viewCount", 0)),
            "like_count": int(stats.get("likeCount", 0)),
            "comment_count": int(stats.get("commentCount", 0)),
            "thumbnail_url": snippet.get("thumbnails", {}).get("maxres", 
                           snippet.get("thumbnails", {}).get("high", {})).get("url", ""),
        }
    
    @youtube_api_retry
    def get_analytics_overview(self, days: int = 30) -> Dict[str, Any]:
        """Get analytics overview for the past N days."""
        if not self.analytics:
            return {"error": "Analytics service not available"}
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        try:
            response = self.analytics.reports().query(
                ids=f"channel=={self.channel_id}",
                startDate=start_date.strftime("%Y-%m-%d"),
                endDate=end_date.strftime("%Y-%m-%d"),
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
                "start_date": start_date.strftime("%Y-%m-%d"),
                "end_date": end_date.strftime("%Y-%m-%d"),
                "totals": totals,
                "daily_data": daily_data,
            }
            
        except Exception as e:
            return {"error": str(e)}

    # ==================== AUDIENCE INTELLIGENCE ====================

    @youtube_api_retry
    def get_demographics(self, days: int = 30) -> Dict[str, Any]:
        """
        Get audience demographics breakdown by age group and gender.
        Returns viewerPercentage for each demographic segment.
        """
        if not self.analytics:
            return {"error": "Analytics service not available"}

        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        try:
            # Get age group breakdown
            age_response = self.analytics.reports().query(
                ids=f"channel=={self.channel_id}",
                startDate=start_date.strftime("%Y-%m-%d"),
                endDate=end_date.strftime("%Y-%m-%d"),
                metrics="viewerPercentage",
                dimensions="ageGroup",
                sort="-viewerPercentage"
            ).execute()

            age_groups = []
            for row in age_response.get("rows", []):
                age_groups.append({
                    "age_group": row[0],
                    "percentage": round(row[1], 2)
                })

            # Get gender breakdown
            gender_response = self.analytics.reports().query(
                ids=f"channel=={self.channel_id}",
                startDate=start_date.strftime("%Y-%m-%d"),
                endDate=end_date.strftime("%Y-%m-%d"),
                metrics="viewerPercentage",
                dimensions="gender",
                sort="-viewerPercentage"
            ).execute()

            genders = []
            for row in gender_response.get("rows", []):
                gender_label = row[0]
                if gender_label == "male":
                    gender_label = "Male"
                elif gender_label == "female":
                    gender_label = "Female"
                else:
                    gender_label = "Other"
                genders.append({
                    "gender": gender_label,
                    "percentage": round(row[1], 2)
                })

            # Get combined age-gender breakdown for detailed analysis
            combined_response = self.analytics.reports().query(
                ids=f"channel=={self.channel_id}",
                startDate=start_date.strftime("%Y-%m-%d"),
                endDate=end_date.strftime("%Y-%m-%d"),
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
                "start_date": start_date.strftime("%Y-%m-%d"),
                "end_date": end_date.strftime("%Y-%m-%d"),
                "age_groups": age_groups,
                "genders": genders,
                "combined": combined[:10],  # Top 10 segments
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

        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        try:
            response = self.analytics.reports().query(
                ids=f"channel=={self.channel_id}",
                startDate=start_date.strftime("%Y-%m-%d"),
                endDate=end_date.strftime("%Y-%m-%d"),
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

                # Human-readable source names
                source_labels = {
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

                sources.append({
                    "source_type": source_type,
                    "source_name": source_labels.get(source_type, source_type.replace("_", " ").title()),
                    "views": views,
                    "watch_time_minutes": round(watch_time, 1),
                })

            # Calculate percentages
            for source in sources:
                source["percentage"] = round((source["views"] / total_views * 100), 1) if total_views > 0 else 0

            return {
                "period": f"{days} days",
                "start_date": start_date.strftime("%Y-%m-%d"),
                "end_date": end_date.strftime("%Y-%m-%d"),
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

        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        try:
            response = self.analytics.reports().query(
                ids=f"channel=={self.channel_id}",
                startDate=start_date.strftime("%Y-%m-%d"),
                endDate=end_date.strftime("%Y-%m-%d"),
                metrics="views,estimatedMinutesWatched,averageViewDuration",
                dimensions="country",
                sort="-views",
                maxResults=limit
            ).execute()

            total_views = 0
            countries = []

            # Country code to name mapping (common ones)
            country_names = {
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

            for row in response.get("rows", []):
                country_code = row[0]
                views = row[1]
                watch_time = row[2]
                avg_duration = row[3]
                total_views += views

                countries.append({
                    "country_code": country_code,
                    "country_name": country_names.get(country_code, country_code),
                    "views": views,
                    "watch_time_minutes": round(watch_time, 1),
                    "avg_view_duration_seconds": round(avg_duration, 1),
                })

            # Calculate percentages
            for country in countries:
                country["percentage"] = round((country["views"] / total_views * 100), 1) if total_views > 0 else 0

            return {
                "period": f"{days} days",
                "start_date": start_date.strftime("%Y-%m-%d"),
                "end_date": end_date.strftime("%Y-%m-%d"),
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

        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        try:
            response = self.analytics.reports().query(
                ids=f"channel=={self.channel_id}",
                startDate=start_date.strftime("%Y-%m-%d"),
                endDate=end_date.strftime("%Y-%m-%d"),
                metrics="views,estimatedMinutesWatched,averageViewDuration",
                dimensions="deviceType",
                sort="-views"
            ).execute()

            total_views = 0
            devices = []

            device_icons = {
                "MOBILE": "📱",
                "DESKTOP": "💻",
                "TABLET": "📱",
                "TV": "📺",
                "GAME_CONSOLE": "🎮",
                "UNKNOWN": "❓",
            }

            device_labels = {
                "MOBILE": "Mobile",
                "DESKTOP": "Desktop",
                "TABLET": "Tablet",
                "TV": "TV",
                "GAME_CONSOLE": "Game Console",
                "UNKNOWN": "Unknown",
            }

            for row in response.get("rows", []):
                device_type = row[0]
                views = row[1]
                watch_time = row[2]
                avg_duration = row[3]
                total_views += views

                devices.append({
                    "device_type": device_type,
                    "device_name": device_labels.get(device_type, device_type),
                    "icon": device_icons.get(device_type, "❓"),
                    "views": views,
                    "watch_time_minutes": round(watch_time, 1),
                    "avg_view_duration_seconds": round(avg_duration, 1),
                })

            # Calculate percentages
            for device in devices:
                device["percentage"] = round((device["views"] / total_views * 100), 1) if total_views > 0 else 0

            return {
                "period": f"{days} days",
                "start_date": start_date.strftime("%Y-%m-%d"),
                "end_date": end_date.strftime("%Y-%m-%d"),
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

        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        try:
            # Daily revenue data
            daily_response = self.analytics.reports().query(
                ids=f"channel=={self.channel_id}",
                startDate=start_date.strftime("%Y-%m-%d"),
                endDate=end_date.strftime("%Y-%m-%d"),
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
                startDate=start_date.strftime("%Y-%m-%d"),
                endDate=end_date.strftime("%Y-%m-%d"),
                metrics="estimatedRevenue,cpm,monetizedPlaybacks",
                dimensions="country",
                sort="-estimatedRevenue",
                maxResults=10
            ).execute()

            country_names = {
                "US": "United States", "GB": "United Kingdom", "CA": "Canada",
                "AU": "Australia", "DE": "Germany", "FR": "France", "IN": "India",
                "BR": "Brazil", "MX": "Mexico", "JP": "Japan", "KR": "South Korea",
            }

            revenue_by_country = []
            for row in country_response.get("rows", []):
                country_code = row[0]
                revenue_by_country.append({
                    "country_code": country_code,
                    "country_name": country_names.get(country_code, country_code),
                    "revenue": round(row[1], 2),
                    "cpm": round(row[2], 2),
                    "monetized_playbacks": row[3],
                })

            return {
                "period": f"{days} days",
                "start_date": start_date.strftime("%Y-%m-%d"),
                "end_date": end_date.strftime("%Y-%m-%d"),
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

        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        try:
            # Use day dimension for subscriber metrics (subscribedStatus is not valid with these metrics)
            response = self.analytics.reports().query(
                ids=f"channel=={self.channel_id}",
                startDate=start_date.strftime("%Y-%m-%d"),
                endDate=end_date.strftime("%Y-%m-%d"),
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
                "start_date": start_date.strftime("%Y-%m-%d"),
                "end_date": end_date.strftime("%Y-%m-%d"),
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

        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        try:
            response = self.analytics.reports().query(
                ids=f"channel=={self.channel_id}",
                startDate=start_date.strftime("%Y-%m-%d"),
                endDate=end_date.strftime("%Y-%m-%d"),
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
                "start_date": start_date.strftime("%Y-%m-%d"),
                "end_date": end_date.strftime("%Y-%m-%d"),
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
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        try:
            response = self.analytics.reports().query(
                ids=f"channel=={self.channel_id}",
                startDate=start_date.strftime("%Y-%m-%d"),
                endDate=end_date.strftime("%Y-%m-%d"),
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
    
    @youtube_api_retry
    def search_videos(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search for videos on the channel."""
        response = self.youtube.search().list(
            part="snippet",
            channelId=self.channel_id,
            q=query,
            type="video",
            maxResults=limit
        ).execute()
        
        results = []
        for item in response.get("items", []):
            snippet = item["snippet"]
            results.append({
                "video_id": item["id"]["videoId"],
                "title": snippet["title"],
                "description": snippet.get("description", ""),
                "published_at": snippet["publishedAt"],
                "thumbnail_url": snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
            })
        
        return results

    # ==================== SEO ANALYSIS TOOLS ====================
    
    @youtube_api_retry
    def get_video_seo_data(self, video_id: str) -> Dict[str, Any]:
        """Get comprehensive SEO data for a video."""
        response = self.youtube.videos().list(
            part="snippet,statistics,contentDetails,topicDetails,status",
            id=video_id
        ).execute()
        
        if not response.get("items"):
            raise ValueError(f"Video not found: {video_id}")
        
        video = response["items"][0]
        snippet = video["snippet"]
        stats = video.get("statistics", {})
        content = video.get("contentDetails", {})
        topics = video.get("topicDetails", {})
        status = video.get("status", {})
        
        # Analyze title
        title = snippet.get("title", "")
        title_analysis = {
            "text": title,
            "length": len(title),
            "word_count": len(title.split()),
            "has_numbers": any(c.isdigit() for c in title),
            "has_brackets": "[" in title or "]" in title or "(" in title or ")" in title,
            "has_emoji": any(ord(c) > 127 for c in title),
            "is_all_caps": title.isupper(),
        }
        
        # Analyze description
        description = snippet.get("description", "")
        description_analysis = {
            "text": description[:500] + "..." if len(description) > 500 else description,
            "full_length": len(description),
            "word_count": len(description.split()),
            "has_links": "http" in description.lower(),
            "has_timestamps": any(c.isdigit() and ":" in description for c in description),
            "has_hashtags": "#" in description,
            "line_count": description.count("\n") + 1,
        }
        
        # Analyze tags
        tags = snippet.get("tags", [])
        tags_analysis = {
            "tags": tags,
            "count": len(tags),
            "total_characters": sum(len(tag) for tag in tags),
            "avg_tag_length": sum(len(tag) for tag in tags) / len(tags) if tags else 0,
        }
        
        return {
            "video_id": video_id,
            "title_analysis": title_analysis,
            "description_analysis": description_analysis,
            "tags_analysis": tags_analysis,
            "category_id": snippet.get("categoryId", ""),
            "default_language": snippet.get("defaultLanguage", ""),
            "default_audio_language": snippet.get("defaultAudioLanguage", ""),
            "duration": content.get("duration", ""),
            "definition": content.get("definition", ""),
            "caption": content.get("caption", "false"),
            "privacy_status": status.get("privacyStatus", ""),
            "made_for_kids": status.get("madeForKids", False),
            "topic_categories": topics.get("topicCategories", []),
            "statistics": {
                "views": int(stats.get("viewCount", 0)),
                "likes": int(stats.get("likeCount", 0)),
                "comments": int(stats.get("commentCount", 0)),
            },
            "thumbnail_url": snippet.get("thumbnails", {}).get("maxres", 
                           snippet.get("thumbnails", {}).get("high", {})).get("url", ""),
        }
    
    @youtube_api_retry
    def get_channel_keywords(self) -> List[str]:
        """Get channel-level keywords from branding settings."""
        response = self.youtube.channels().list(
            part="brandingSettings",
            mine=True
        ).execute()
        
        if not response.get("items"):
            return []
        
        branding = response["items"][0].get("brandingSettings", {})
        channel_settings = branding.get("channel", {})
        keywords = channel_settings.get("keywords", "")
        
        # Parse keywords (they're space-separated, quotes for multi-word)
        if not keywords:
            return []
        
        import re
        # Match quoted strings or single words
        return re.findall(r'"([^"]+)"|(\S+)', keywords)
    
    @youtube_api_retry
    def search_competitor_videos(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search for competitor videos on YouTube (not limited to own channel)."""
        response = self.youtube.search().list(
            part="snippet",
            q=query,
            type="video",
            maxResults=limit,
            order="viewCount"
        ).execute()
        
        video_ids = [item["id"]["videoId"] for item in response.get("items", [])]
        
        if not video_ids:
            return []
        
        # Get video statistics
        videos_response = self.youtube.videos().list(
            part="snippet,statistics",
            id=",".join(video_ids)
        ).execute()
        
        results = []
        for video in videos_response.get("items", []):
            snippet = video["snippet"]
            stats = video.get("statistics", {})
            results.append({
                "video_id": video["id"],
                "title": snippet["title"],
                "description": snippet.get("description", "")[:200],
                "channel_title": snippet["channelTitle"],
                "published_at": snippet["publishedAt"],
                "tags": snippet.get("tags", [])[:10],  # First 10 tags
                "view_count": int(stats.get("viewCount", 0)),
                "like_count": int(stats.get("likeCount", 0)),
                "comment_count": int(stats.get("commentCount", 0)),
                "thumbnail_url": snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
            })
        
        return results
    
    @youtube_api_retry
    def get_videos_for_seo_audit(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get recent videos with SEO-relevant data for audit."""
        videos = self.get_recent_videos(limit=limit)
        
        if not videos:
            return []
        
        video_ids = [v["video_id"] for v in videos]
        
        # Get full video details including tags
        videos_response = self.youtube.videos().list(
            part="snippet,statistics",
            id=",".join(video_ids)
        ).execute()
        
        results = []
        for video in videos_response.get("items", []):
            snippet = video["snippet"]
            stats = video.get("statistics", {})
            
            title = snippet.get("title", "")
            description = snippet.get("description", "")
            tags = snippet.get("tags", [])
            
            # Calculate SEO score (simple heuristic)
            seo_score = 0
            seo_issues = []
            
            # Title checks
            if 30 <= len(title) <= 60:
                seo_score += 20
            else:
                seo_issues.append("Title length not optimal (aim for 30-60 chars)")
            
            # Description checks
            if len(description) >= 200:
                seo_score += 20
            else:
                seo_issues.append("Description too short (aim for 200+ chars)")
            
            if "http" in description.lower():
                seo_score += 10
            else:
                seo_issues.append("No links in description")
            
            # Tags checks
            if len(tags) >= 5:
                seo_score += 20
            else:
                seo_issues.append(f"Only {len(tags)} tags (aim for 5+)")
            
            if len(tags) >= 10:
                seo_score += 10
            
            # Hashtags check
            if "#" in description:
                seo_score += 10
            else:
                seo_issues.append("No hashtags in description")
            
            # Engagement rate
            views = int(stats.get("viewCount", 0))
            likes = int(stats.get("likeCount", 0))
            if views > 0:
                engagement_rate = (likes / views) * 100
                if engagement_rate > 4:
                    seo_score += 10
            
            results.append({
                "video_id": video["id"],
                "title": title,
                "title_length": len(title),
                "description_length": len(description),
                "tags_count": len(tags),
                "tags": tags[:5],  # First 5 tags
                "seo_score": min(seo_score, 100),
                "seo_issues": seo_issues,
                "view_count": views,
                "like_count": likes,
                "comment_count": int(stats.get("commentCount", 0)),
                "thumbnail_url": snippet.get("thumbnails", {}).get("medium", {}).get("url", ""),
            })
        
        # Sort by SEO score (lowest first - most improvement needed)
        results.sort(key=lambda x: x["seo_score"])
        
        return results

    # ==================== VIDEO UPDATE TOOLS ====================
    
    @youtube_api_retry
    def update_video_metadata(
        self, 
        video_id: str, 
        title: Optional[str] = None,
        description: Optional[str] = None,
        tags: Optional[List[str]] = None,
        category_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Update video metadata (title, description, tags).
        
        Only updates the fields that are provided (not None).
        Returns the updated video data.
        """
        # First, get the current video data to preserve fields we're not updating
        current_response = self.youtube.videos().list(
            part="snippet,status",
            id=video_id
        ).execute()
        
        if not current_response.get("items"):
            raise ValueError(f"Video not found: {video_id}")
        
        current_video = current_response["items"][0]
        current_snippet = current_video["snippet"]
        
        # Build the update request body
        update_body = {
            "id": video_id,
            "snippet": {
                "title": title if title is not None else current_snippet["title"],
                "description": description if description is not None else current_snippet.get("description", ""),
                "tags": tags if tags is not None else current_snippet.get("tags", []),
                "categoryId": category_id if category_id is not None else current_snippet.get("categoryId", "22"),
            }
        }
        
        # Execute the update
        response = self.youtube.videos().update(
            part="snippet",
            body=update_body
        ).execute()
        
        updated_snippet = response["snippet"]
        
        return {
            "success": True,
            "video_id": video_id,
            "updated": {
                "title": updated_snippet["title"],
                "description": updated_snippet.get("description", "")[:200] + "..." if len(updated_snippet.get("description", "")) > 200 else updated_snippet.get("description", ""),
                "tags_count": len(updated_snippet.get("tags", [])),
                "category_id": updated_snippet.get("categoryId", ""),
            },
            "message": "Video metadata updated successfully!"
        }
    
    @youtube_api_retry
    def get_video_for_editing(self, video_id: str) -> Dict[str, Any]:
        """Get video data in a format suitable for editing."""
        response = self.youtube.videos().list(
            part="snippet,status,statistics",
            id=video_id
        ).execute()

        if not response.get("items"):
            raise ValueError(f"Video not found: {video_id}")

        video = response["items"][0]
        snippet = video["snippet"]
        stats = video.get("statistics", {})

        return {
            "video_id": video_id,
            "title": snippet.get("title", ""),
            "description": snippet.get("description", ""),
            "tags": snippet.get("tags", []),
            "category_id": snippet.get("categoryId", "22"),
            "thumbnail_url": snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
            "view_count": int(stats.get("viewCount", 0)),
            "like_count": int(stats.get("likeCount", 0)),
            "published_at": snippet.get("publishedAt", ""),
        }

    # ==================== COMMENT TOOLS ====================

    @youtube_api_retry
    def get_video_comments(self, video_id: str, max_results: int = 100) -> Dict[str, Any]:
        """
        Get comments for a specific video.

        Args:
            video_id: The YouTube video ID
            max_results: Maximum number of comments to fetch (default 100, max 100 per page)

        Returns:
            Dictionary with video info and list of comments with metadata
        """
        try:
            # First get video info
            video_info = self.get_video_details(video_id)

            # Fetch comment threads
            response = self.youtube.commentThreads().list(
                part="snippet,replies",
                videoId=video_id,
                maxResults=min(max_results, 100),
                order="relevance",  # Get most relevant comments first
                textFormat="plainText"
            ).execute()

            comments = []
            for item in response.get("items", []):
                snippet = item["snippet"]["topLevelComment"]["snippet"]

                # Get channel info for the commenter
                author_channel_url = snippet.get("authorChannelUrl", "")
                author_channel_id = snippet.get("authorChannelId", {}).get("value", "")

                comment_data = {
                    "comment_id": item["id"],
                    "text": snippet["textDisplay"],
                    "author": snippet["authorDisplayName"],
                    "author_channel_id": author_channel_id,
                    "author_channel_url": author_channel_url,
                    "author_profile_image": snippet.get("authorProfileImageUrl", ""),
                    "like_count": snippet.get("likeCount", 0),
                    "published_at": snippet["publishedAt"],
                    "updated_at": snippet.get("updatedAt", snippet["publishedAt"]),
                    "reply_count": item["snippet"].get("totalReplyCount", 0),
                }

                # Include replies if present
                if item.get("replies"):
                    comment_data["replies"] = [
                        {
                            "comment_id": reply["id"],
                            "text": reply["snippet"]["textDisplay"],
                            "author": reply["snippet"]["authorDisplayName"],
                            "like_count": reply["snippet"].get("likeCount", 0),
                            "published_at": reply["snippet"]["publishedAt"],
                        }
                        for reply in item["replies"].get("comments", [])[:5]  # Limit replies
                    ]

                comments.append(comment_data)

            return {
                "video_id": video_id,
                "video_title": video_info.get("title", ""),
                "total_comment_count": video_info.get("comment_count", 0),
                "fetched_count": len(comments),
                "comments": comments,
            }

        except HttpError as e:
            if e.resp.status == 403:
                return {
                    "video_id": video_id,
                    "error": "comments_disabled",
                    "message": "Comments are disabled for this video"
                }
            raise
        except Exception as e:
            logger.error(f"Error fetching comments for {video_id}: {e}")
            return {"video_id": video_id, "error": str(e)}

    @youtube_api_retry
    def get_channel_comments(self, limit: int = 100, videos_to_check: int = 10) -> Dict[str, Any]:
        """
        Get recent comments across the channel's recent videos.

        Args:
            limit: Maximum total comments to return
            videos_to_check: Number of recent videos to check for comments

        Returns:
            Dictionary with comments from multiple videos
        """
        try:
            # Get recent videos
            recent_videos = self.get_recent_videos(limit=videos_to_check)

            all_comments = []
            video_comment_counts = {}

            comments_per_video = max(10, limit // videos_to_check)

            for video in recent_videos:
                video_id = video["video_id"]
                result = self.get_video_comments(video_id, max_results=comments_per_video)

                if "error" not in result:
                    video_comment_counts[video_id] = {
                        "title": video["title"],
                        "count": len(result.get("comments", []))
                    }

                    for comment in result.get("comments", []):
                        comment["video_id"] = video_id
                        comment["video_title"] = video["title"]
                        all_comments.append(comment)

                if len(all_comments) >= limit:
                    break

            # Sort by like count (most engaging comments first)
            all_comments.sort(key=lambda x: x.get("like_count", 0), reverse=True)

            return {
                "total_fetched": len(all_comments),
                "videos_checked": len(video_comment_counts),
                "video_breakdown": video_comment_counts,
                "comments": all_comments[:limit],
            }

        except Exception as e:
            logger.error(f"Error fetching channel comments: {e}")
            return {"error": str(e)}

    @youtube_api_retry
    def get_commenter_channel_info(self, channel_id: str) -> Dict[str, Any]:
        """
        Get info about a commenter's channel to identify notable commenters.

        Args:
            channel_id: The YouTube channel ID of the commenter

        Returns:
            Channel info including subscriber count if available
        """
        try:
            response = self.youtube.channels().list(
                part="snippet,statistics",
                id=channel_id
            ).execute()

            if not response.get("items"):
                return {"channel_id": channel_id, "found": False}

            channel = response["items"][0]
            snippet = channel["snippet"]
            stats = channel.get("statistics", {})

            # Check if subscriber count is hidden
            subscriber_count = int(stats.get("subscriberCount", 0)) if not stats.get("hiddenSubscriberCount", False) else None

            return {
                "channel_id": channel_id,
                "found": True,
                "title": snippet["title"],
                "description": snippet.get("description", "")[:200],
                "thumbnail_url": snippet.get("thumbnails", {}).get("default", {}).get("url", ""),
                "subscriber_count": subscriber_count,
                "video_count": int(stats.get("videoCount", 0)),
                "view_count": int(stats.get("viewCount", 0)),
                "is_creator": subscriber_count and subscriber_count > 1000,  # Consider 1K+ subs as a creator
            }

        except Exception as e:
            logger.error(f"Error fetching channel info for {channel_id}: {e}")
            return {"channel_id": channel_id, "found": False, "error": str(e)}

