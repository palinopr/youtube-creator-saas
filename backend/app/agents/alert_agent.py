"""
Alert Agent - Real-time Channel Monitoring

Detects important events and creates in-app notifications:
- Viral videos (views significantly above channel average)
- View drops (performance significantly below normal)
- Subscriber milestones (100, 1K, 5K, 10K, 50K, 100K, 500K, 1M, etc.)
- Engagement spikes (unusual like/comment activity)
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import logging

from googleapiclient.discovery import Resource
from sqlalchemy.orm import Session

from ..config import get_settings
from ..services.youtube import YouTubeTools
from ..db.models import Alert, AlertType, AlertPriority, SessionLocal

settings = get_settings()
logger = logging.getLogger(__name__)

# Subscriber milestone thresholds
SUBSCRIBER_MILESTONES = [
    100, 500, 1000, 2500, 5000, 10000, 25000, 50000,
    100000, 250000, 500000, 1000000, 2500000, 5000000, 10000000
]


class AlertAgent:
    """
    Monitors channel performance and generates alerts for significant events.

    Designed to run periodically (every 15-30 minutes) to catch:
    - Videos going viral (3x+ average views in 24h)
    - Sudden performance drops
    - Subscriber milestones
    - Engagement anomalies
    """

    def __init__(
        self,
        youtube_service: Resource,
        analytics_service: Optional[Resource] = None,
        user_id: Optional[str] = None
    ):
        self.youtube_tools = YouTubeTools(youtube_service, analytics_service)
        self.user_id = user_id

    async def check_all_alerts(self) -> List[Dict[str, Any]]:
        """
        Run all alert checks and return any new alerts generated.

        Returns:
            List of alert dictionaries that were created
        """
        new_alerts = []

        try:
            # Get channel stats for milestone checks
            channel_stats = self.youtube_tools.get_channel_stats()

            # Check for subscriber milestones
            milestone_alerts = await self._check_subscriber_milestones(channel_stats)
            new_alerts.extend(milestone_alerts)

            # Get analytics for performance checks
            analytics = self.youtube_tools.get_analytics_overview(days=30)

            if "error" not in analytics:
                # Check for viral videos
                viral_alerts = await self._check_viral_videos(analytics)
                new_alerts.extend(viral_alerts)

                # Check for performance drops
                drop_alerts = await self._check_performance_drops(analytics)
                new_alerts.extend(drop_alerts)

                # Check for engagement anomalies
                engagement_alerts = await self._check_engagement_anomalies(analytics)
                new_alerts.extend(engagement_alerts)

            # Save alerts to database
            if new_alerts and self.user_id:
                self._save_alerts(new_alerts)

            return new_alerts

        except Exception as e:
            logger.error(f"Error checking alerts: {e}")
            return []

    async def _check_subscriber_milestones(self, channel_stats: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Check if channel has crossed any subscriber milestones."""
        alerts = []

        subscriber_count = channel_stats.get("subscriber_count", 0)
        channel_title = channel_stats.get("title", "Your channel")

        # Find the highest milestone crossed
        for milestone in reversed(SUBSCRIBER_MILESTONES):
            if subscriber_count >= milestone:
                # Check if we've already alerted for this milestone
                if self._milestone_already_alerted(milestone):
                    break  # Already alerted for this and lower milestones

                # Format subscriber count nicely
                formatted = self._format_number(milestone)

                alerts.append({
                    "alert_type": AlertType.MILESTONE,
                    "priority": AlertPriority.HIGH if milestone >= 100000 else AlertPriority.MEDIUM,
                    "title": f"Milestone reached: {formatted} subscribers!",
                    "message": f"Congratulations! {channel_title} has reached {formatted} subscribers. Keep up the amazing work!",
                    "data": {
                        "milestone": milestone,
                        "current_count": subscriber_count,
                        "milestone_type": "subscribers",
                    }
                })
                break  # Only alert for the highest milestone

        return alerts

    async def _check_viral_videos(self, analytics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Check for videos performing significantly above average."""
        alerts = []

        daily_data = analytics.get("daily_data", [])
        if len(daily_data) < 7:
            return alerts

        # Calculate 30-day average daily views
        total_views = sum(d.get("views", 0) for d in daily_data)
        avg_daily_views = total_views / len(daily_data) if daily_data else 0

        if avg_daily_views < 100:  # Skip for very small channels
            return alerts

        # Check last 24 hours (most recent day)
        recent_views = daily_data[-1].get("views", 0) if daily_data else 0

        # Viral threshold: 3x average
        viral_threshold = avg_daily_views * 3

        if recent_views >= viral_threshold:
            multiplier = round(recent_views / avg_daily_views, 1)

            # Get recent videos to identify which might be going viral
            recent_videos = self.youtube_tools.get_recent_videos(limit=5)
            top_video = recent_videos[0] if recent_videos else None

            video_info = ""
            video_id = None
            video_title = None

            if top_video:
                video_id = top_video.get("video_id")
                video_title = top_video.get("title", "")[:100]
                video_info = f'Your video "{video_title}" may be going viral!'

            alerts.append({
                "alert_type": AlertType.VIRAL,
                "priority": AlertPriority.CRITICAL if multiplier >= 5 else AlertPriority.HIGH,
                "title": f"Viral moment detected: {multiplier}x normal views!",
                "message": f"Your channel is getting {self._format_number(recent_views)} views today, which is {multiplier}x your average. {video_info}",
                "video_id": video_id,
                "video_title": video_title,
                "data": {
                    "views_today": recent_views,
                    "average_views": round(avg_daily_views),
                    "multiplier": multiplier,
                }
            })

        return alerts

    async def _check_performance_drops(self, analytics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Check for significant performance drops."""
        alerts = []

        daily_data = analytics.get("daily_data", [])
        if len(daily_data) < 14:  # Need 2 weeks of data
            return alerts

        # Compare last 7 days to previous 7 days
        recent_week = daily_data[-7:]
        previous_week = daily_data[-14:-7]

        recent_views = sum(d.get("views", 0) for d in recent_week)
        previous_views = sum(d.get("views", 0) for d in previous_week)

        if previous_views < 100:  # Skip for very small numbers
            return alerts

        # Calculate percentage drop
        change_pct = ((recent_views - previous_views) / previous_views) * 100

        # Alert if views dropped by more than 30%
        if change_pct <= -30:
            alerts.append({
                "alert_type": AlertType.DROP,
                "priority": AlertPriority.HIGH if change_pct <= -50 else AlertPriority.MEDIUM,
                "title": f"Views down {abs(round(change_pct))}% this week",
                "message": f"Your views have dropped from {self._format_number(previous_views)} to {self._format_number(recent_views)} compared to last week. Consider reviewing your recent content strategy.",
                "data": {
                    "recent_views": recent_views,
                    "previous_views": previous_views,
                    "change_percent": round(change_pct, 1),
                    "period": "7 days",
                }
            })

        # Also check subscribers
        recent_subs = sum(d.get("subscribers_gained", 0) - d.get("subscribers_lost", 0) for d in recent_week)
        previous_subs = sum(d.get("subscribers_gained", 0) - d.get("subscribers_lost", 0) for d in previous_week)

        if previous_subs > 10:  # Meaningful subscriber activity
            sub_change_pct = ((recent_subs - previous_subs) / previous_subs) * 100 if previous_subs else 0

            # Alert if subscriber growth dropped significantly
            if sub_change_pct <= -40:
                alerts.append({
                    "alert_type": AlertType.DROP,
                    "priority": AlertPriority.MEDIUM,
                    "title": f"Subscriber growth down {abs(round(sub_change_pct))}%",
                    "message": f"Subscriber growth has slowed from {previous_subs:+} to {recent_subs:+} this week. This could indicate a change in content appeal or algorithm reach.",
                    "data": {
                        "recent_subs": recent_subs,
                        "previous_subs": previous_subs,
                        "change_percent": round(sub_change_pct, 1),
                        "period": "7 days",
                    }
                })

        return alerts

    async def _check_engagement_anomalies(self, analytics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Check for unusual engagement patterns."""
        alerts = []

        daily_data = analytics.get("daily_data", [])
        if len(daily_data) < 7:
            return alerts

        # Calculate average engagement metrics
        total_comments = sum(d.get("comments", 0) for d in daily_data)
        total_likes = sum(d.get("likes", 0) for d in daily_data)

        avg_daily_comments = total_comments / len(daily_data) if daily_data else 0
        avg_daily_likes = total_likes / len(daily_data) if daily_data else 0

        # Check yesterday's engagement
        yesterday = daily_data[-1] if daily_data else {}
        comments_yesterday = yesterday.get("comments", 0)
        likes_yesterday = yesterday.get("likes", 0)

        # Alert on comment surge (3x+ average) - could be viral or controversy
        if avg_daily_comments > 5 and comments_yesterday >= avg_daily_comments * 3:
            multiplier = round(comments_yesterday / avg_daily_comments, 1)
            alerts.append({
                "alert_type": AlertType.COMMENT_SURGE,
                "priority": AlertPriority.MEDIUM,
                "title": f"Comment surge: {multiplier}x normal activity",
                "message": f"You received {comments_yesterday} comments yesterday, which is {multiplier}x your average. Check your comments for trending discussions or issues to address.",
                "data": {
                    "comments": comments_yesterday,
                    "average_comments": round(avg_daily_comments),
                    "multiplier": multiplier,
                }
            })

        # Alert on engagement spike (positive signal)
        if avg_daily_likes > 10 and likes_yesterday >= avg_daily_likes * 2.5:
            multiplier = round(likes_yesterday / avg_daily_likes, 1)
            alerts.append({
                "alert_type": AlertType.ENGAGEMENT,
                "priority": AlertPriority.LOW,
                "title": f"Engagement spike: {multiplier}x average likes",
                "message": f"Your content received {likes_yesterday} likes yesterday, significantly above your average of {round(avg_daily_likes)}. Your audience is resonating with your recent content!",
                "data": {
                    "likes": likes_yesterday,
                    "average_likes": round(avg_daily_likes),
                    "multiplier": multiplier,
                }
            })

        return alerts

    def _milestone_already_alerted(self, milestone: int) -> bool:
        """Check if we've already sent an alert for this milestone."""
        if not self.user_id:
            return False

        try:
            session = SessionLocal()
            try:
                existing = session.query(Alert).filter(
                    Alert.user_id == self.user_id,
                    Alert.alert_type == AlertType.MILESTONE,
                    Alert.data["milestone"].astext.cast(int) == milestone
                ).first()
                return existing is not None
            finally:
                session.close()
        except Exception as e:
            logger.error(f"Error checking milestone alerts: {e}")
            return False

    def _save_alerts(self, alerts: List[Dict[str, Any]]) -> None:
        """Save alerts to the database with deduplication."""
        if not self.user_id:
            return

        try:
            session = SessionLocal()
            try:
                saved_count = 0
                for alert_data in alerts:
                    alert_type = alert_data.get("alert_type")
                    title = alert_data.get("title", "")
                    data = alert_data.get("data", {})

                    # Check for existing duplicate alert
                    existing = self._check_duplicate_alert(
                        session, alert_type, title, data
                    )

                    if existing:
                        logger.debug(f"Skipping duplicate alert: {title}")
                        continue

                    alert = Alert(
                        user_id=self.user_id,
                        alert_type=alert_type,
                        priority=alert_data.get("priority", AlertPriority.MEDIUM),
                        title=title,
                        message=alert_data.get("message", ""),
                        video_id=alert_data.get("video_id"),
                        video_title=alert_data.get("video_title"),
                        data=data,
                    )
                    session.add(alert)
                    saved_count += 1

                session.commit()
                if saved_count > 0:
                    logger.info(f"Saved {saved_count} new alerts for user {self.user_id}")
            except Exception as e:
                session.rollback()
                logger.error(f"Error saving alerts: {e}")
            finally:
                session.close()
        except Exception as e:
            logger.error(f"Error creating session for alerts: {e}")

    def _check_duplicate_alert(
        self,
        session: Session,
        alert_type: AlertType,
        title: str,
        data: Dict[str, Any]
    ) -> bool:
        """
        Check if a similar alert already exists.

        For milestones: check by milestone value in data
        For viral/drops: check by title (includes date context)
        For others: check by title match
        """
        try:
            # For milestone alerts, check by the specific milestone value
            if alert_type == AlertType.MILESTONE:
                milestone = data.get("milestone")
                if milestone:
                    existing = session.query(Alert).filter(
                        Alert.user_id == self.user_id,
                        Alert.alert_type == AlertType.MILESTONE,
                        Alert.data["milestone"].astext.cast(int) == milestone
                    ).first()
                    return existing is not None

            # For other alerts, check if same title exists in last 24 hours
            # (allows similar alerts after a day passes)
            from datetime import timedelta
            cutoff = datetime.utcnow() - timedelta(hours=24)

            existing = session.query(Alert).filter(
                Alert.user_id == self.user_id,
                Alert.alert_type == alert_type,
                Alert.title == title,
                Alert.created_at >= cutoff
            ).first()

            return existing is not None

        except Exception as e:
            logger.error(f"Error checking duplicate alert: {e}")
            return False  # Allow saving on error to avoid losing alerts

    @staticmethod
    def _format_number(num: int) -> str:
        """Format large numbers with K, M suffixes."""
        if num >= 1000000:
            return f"{num / 1000000:.1f}M"
        elif num >= 1000:
            return f"{num / 1000:.1f}K"
        return str(num)


# Utility functions for API endpoints

def get_user_alerts(
    user_id: str,
    limit: int = 20,
    unread_only: bool = False,
    alert_type: Optional[AlertType] = None
) -> List[Dict[str, Any]]:
    """
    Fetch alerts for a user.

    Args:
        user_id: The user's ID
        limit: Maximum number of alerts to return
        unread_only: If True, only return unread alerts
        alert_type: Filter by specific alert type

    Returns:
        List of alert dictionaries
    """
    try:
        session = SessionLocal()
        try:
            query = session.query(Alert).filter(
                Alert.user_id == user_id,
                Alert.is_dismissed == False
            )

            if unread_only:
                query = query.filter(Alert.is_read == False)

            if alert_type:
                query = query.filter(Alert.alert_type == alert_type)

            alerts = query.order_by(Alert.created_at.desc()).limit(limit).all()

            return [alert.to_dict() for alert in alerts]
        finally:
            session.close()
    except Exception as e:
        logger.error(f"Error fetching alerts: {e}")
        return []


def get_unread_count(user_id: str) -> int:
    """Get the count of unread alerts for a user."""
    try:
        session = SessionLocal()
        try:
            count = session.query(Alert).filter(
                Alert.user_id == user_id,
                Alert.is_read == False,
                Alert.is_dismissed == False
            ).count()
            return count
        finally:
            session.close()
    except Exception as e:
        logger.error(f"Error counting unread alerts: {e}")
        return 0


def mark_alert_read(user_id: str, alert_id: int) -> bool:
    """Mark a specific alert as read."""
    try:
        session = SessionLocal()
        try:
            alert = session.query(Alert).filter(
                Alert.id == alert_id,
                Alert.user_id == user_id
            ).first()

            if alert:
                alert.is_read = True
                alert.read_at = datetime.utcnow()
                session.commit()
                return True
            return False
        finally:
            session.close()
    except Exception as e:
        logger.error(f"Error marking alert read: {e}")
        return False


def mark_all_alerts_read(user_id: str) -> int:
    """Mark all alerts as read for a user. Returns count of updated alerts."""
    try:
        session = SessionLocal()
        try:
            updated = session.query(Alert).filter(
                Alert.user_id == user_id,
                Alert.is_read == False
            ).update({
                "is_read": True,
                "read_at": datetime.utcnow()
            })
            session.commit()
            return updated
        finally:
            session.close()
    except Exception as e:
        logger.error(f"Error marking all alerts read: {e}")
        return 0


def dismiss_alert(user_id: str, alert_id: int) -> bool:
    """Dismiss (soft delete) an alert."""
    try:
        session = SessionLocal()
        try:
            alert = session.query(Alert).filter(
                Alert.id == alert_id,
                Alert.user_id == user_id
            ).first()

            if alert:
                alert.is_dismissed = True
                alert.dismissed_at = datetime.utcnow()
                session.commit()
                return True
            return False
        finally:
            session.close()
    except Exception as e:
        logger.error(f"Error dismissing alert: {e}")
        return False


def delete_old_alerts(days: int = 30) -> int:
    """Delete alerts older than specified days. Returns count of deleted alerts."""
    try:
        session = SessionLocal()
        try:
            cutoff = datetime.utcnow() - timedelta(days=days)
            deleted = session.query(Alert).filter(
                Alert.created_at < cutoff,
                Alert.is_dismissed == True
            ).delete()
            session.commit()
            return deleted
        finally:
            session.close()
    except Exception as e:
        logger.error(f"Error deleting old alerts: {e}")
        return 0


def cleanup_duplicate_alerts(user_id: str) -> int:
    """
    Remove duplicate milestone alerts for a user, keeping only the oldest one.
    Also removes duplicate non-milestone alerts with identical titles.

    Returns count of deleted duplicates.
    """
    try:
        session = SessionLocal()
        try:
            deleted_count = 0

            # 1. Clean up duplicate milestone alerts
            # Get all milestone alerts grouped by milestone value
            milestone_alerts = session.query(Alert).filter(
                Alert.user_id == user_id,
                Alert.alert_type == AlertType.MILESTONE
            ).order_by(Alert.created_at.asc()).all()

            seen_milestones = set()
            for alert in milestone_alerts:
                milestone = alert.data.get("milestone") if alert.data else None
                if milestone in seen_milestones:
                    # This is a duplicate, delete it
                    session.delete(alert)
                    deleted_count += 1
                else:
                    seen_milestones.add(milestone)

            # 2. Clean up duplicate non-milestone alerts with same title
            # (keep oldest of each title per alert_type)
            for alert_type in [AlertType.VIRAL, AlertType.DROP, AlertType.ENGAGEMENT,
                              AlertType.COMMENT_SURGE, AlertType.OPPORTUNITY, AlertType.WARNING]:
                alerts = session.query(Alert).filter(
                    Alert.user_id == user_id,
                    Alert.alert_type == alert_type
                ).order_by(Alert.created_at.asc()).all()

                seen_titles = set()
                for alert in alerts:
                    if alert.title in seen_titles:
                        session.delete(alert)
                        deleted_count += 1
                    else:
                        seen_titles.add(alert.title)

            session.commit()
            if deleted_count > 0:
                logger.info(f"Cleaned up {deleted_count} duplicate alerts for user {user_id}")
            return deleted_count

        finally:
            session.close()
    except Exception as e:
        logger.error(f"Error cleaning up duplicate alerts: {e}")
        return 0
