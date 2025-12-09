"""
Repository classes for database operations.
Provides clean abstraction over SQLAlchemy models.
"""

import uuid
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from .models import (
    Job, JobStatus, JobType,
    AnalyticsCache, VideoCache,
    get_db_session
)


class JobRepository:
    """
    Repository for job persistence.
    Replaces in-memory render_jobs dictionary.
    """
    
    @staticmethod
    def create_job(
        job_type: JobType,
        video_id: Optional[str] = None,
        clip_id: Optional[str] = None,
        channel_id: Optional[str] = None,
        input_data: Optional[dict] = None,
        max_videos: Optional[int] = None,
    ) -> Job:
        """Create a new job and return it."""
        job_id = str(uuid.uuid4())[:12]
        
        with get_db_session() as session:
            job = Job(
                job_id=job_id,
                job_type=job_type,
                status=JobStatus.QUEUED,
                progress=0,
                message="Queued for processing...",
                video_id=video_id,
                clip_id=clip_id,
                channel_id=channel_id,
                input_data=input_data or {},
                max_videos=max_videos,
            )
            session.add(job)
            session.flush()
            # Return a copy since session will close
            return job.to_dict()
    
    @staticmethod
    def get_job(job_id: str) -> Optional[Dict[str, Any]]:
        """Get a job by ID."""
        with get_db_session() as session:
            job = session.query(Job).filter(Job.job_id == job_id).first()
            return job.to_dict() if job else None
    
    @staticmethod
    def update_job(
        job_id: str,
        status: Optional[JobStatus] = None,
        progress: Optional[int] = None,
        message: Optional[str] = None,
        output_path: Optional[str] = None,
        output_data: Optional[dict] = None,
        error_message: Optional[str] = None,
        started_at: Optional[datetime] = None,
        completed_at: Optional[datetime] = None,
    ) -> bool:
        """Update a job's status and fields."""
        with get_db_session() as session:
            job = session.query(Job).filter(Job.job_id == job_id).first()
            if not job:
                return False
            
            if status is not None:
                job.status = status
            if progress is not None:
                job.progress = progress
            if message is not None:
                job.message = message
            if output_path is not None:
                job.output_path = output_path
            if output_data is not None:
                job.output_data = output_data
            if error_message is not None:
                job.error_message = error_message
            if started_at is not None:
                job.started_at = started_at
            if completed_at is not None:
                job.completed_at = completed_at
            
            job.updated_at = datetime.utcnow()
            return True
    
    @staticmethod
    def delete_job(job_id: str) -> bool:
        """Delete a job."""
        with get_db_session() as session:
            job = session.query(Job).filter(Job.job_id == job_id).first()
            if job:
                session.delete(job)
                return True
            return False
    
    @staticmethod
    def list_jobs(
        job_type: Optional[JobType] = None,
        status: Optional[JobStatus] = None,
        channel_id: Optional[str] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """List jobs with optional filters."""
        with get_db_session() as session:
            query = session.query(Job)
            
            if job_type:
                query = query.filter(Job.job_type == job_type)
            if status:
                query = query.filter(Job.status == status)
            if channel_id:
                query = query.filter(Job.channel_id == channel_id)
            
            jobs = query.order_by(Job.created_at.desc()).limit(limit).all()
            return [job.to_dict() for job in jobs]
    
    @staticmethod
    def get_pending_jobs(job_type: Optional[JobType] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Get pending jobs for processing."""
        with get_db_session() as session:
            query = session.query(Job).filter(
                Job.status.in_([JobStatus.QUEUED, JobStatus.PENDING])
            )
            
            if job_type:
                query = query.filter(Job.job_type == job_type)
            
            jobs = query.order_by(Job.created_at.asc()).limit(limit).all()
            return [job.to_dict() for job in jobs]
    
    @staticmethod
    def cleanup_old_jobs(max_age_hours: int = 24) -> int:
        """Delete jobs older than max_age_hours."""
        cutoff = datetime.utcnow() - timedelta(hours=max_age_hours)
        
        with get_db_session() as session:
            # Get jobs to delete
            old_jobs = session.query(Job).filter(Job.created_at < cutoff).all()
            count = len(old_jobs)
            
            for job in old_jobs:
                session.delete(job)
            
            return count
    
    @staticmethod
    def get_job_by_channel_and_type(
        channel_id: str,
        job_type: JobType,
        status: Optional[JobStatus] = None
    ) -> Optional[Dict[str, Any]]:
        """Get the most recent job for a channel and type."""
        with get_db_session() as session:
            query = session.query(Job).filter(
                and_(
                    Job.channel_id == channel_id,
                    Job.job_type == job_type
                )
            )
            
            if status:
                query = query.filter(Job.status == status)
            
            job = query.order_by(Job.created_at.desc()).first()
            return job.to_dict() if job else None


class AnalyticsCacheRepository:
    """
    Repository for analytics cache.
    Implements ETL pattern for avoiding real-time 5k video fetches.
    """
    
    @staticmethod
    def get_cache(channel_id: str, cache_key: str) -> Optional[Dict[str, Any]]:
        """Get cached analytics data."""
        with get_db_session() as session:
            cache = session.query(AnalyticsCache).filter(
                and_(
                    AnalyticsCache.channel_id == channel_id,
                    AnalyticsCache.cache_key == cache_key
                )
            ).first()
            
            if not cache:
                return None
            
            # Check if expired
            if cache.expires_at and cache.expires_at < datetime.utcnow():
                return None
            
            return {
                "channel_id": cache.channel_id,
                "cache_key": cache.cache_key,
                "data": cache.data,
                "video_count": cache.video_count,
                "is_syncing": bool(cache.is_syncing),
                "last_sync_at": cache.last_sync_at.isoformat() if cache.last_sync_at else None,
                "sync_error": cache.sync_error,
                "expires_at": cache.expires_at.isoformat() if cache.expires_at else None,
            }
    
    @staticmethod
    def set_cache(
        channel_id: str,
        cache_key: str,
        data: dict,
        video_count: int = 0,
        ttl_hours: int = 6,
    ) -> bool:
        """Set analytics cache with TTL."""
        expires_at = datetime.utcnow() + timedelta(hours=ttl_hours)
        
        with get_db_session() as session:
            cache = session.query(AnalyticsCache).filter(
                and_(
                    AnalyticsCache.channel_id == channel_id,
                    AnalyticsCache.cache_key == cache_key
                )
            ).first()
            
            if cache:
                cache.data = data
                cache.video_count = video_count
                cache.expires_at = expires_at
                cache.last_sync_at = datetime.utcnow()
                cache.is_syncing = 0
                cache.sync_error = None
                cache.updated_at = datetime.utcnow()
            else:
                cache = AnalyticsCache(
                    channel_id=channel_id,
                    cache_key=cache_key,
                    data=data,
                    video_count=video_count,
                    expires_at=expires_at,
                    last_sync_at=datetime.utcnow(),
                    is_syncing=0,
                )
                session.add(cache)
            
            return True
    
    @staticmethod
    def set_syncing(channel_id: str, cache_key: str, is_syncing: bool) -> bool:
        """Mark cache as syncing."""
        with get_db_session() as session:
            cache = session.query(AnalyticsCache).filter(
                and_(
                    AnalyticsCache.channel_id == channel_id,
                    AnalyticsCache.cache_key == cache_key
                )
            ).first()
            
            if cache:
                cache.is_syncing = 1 if is_syncing else 0
                cache.updated_at = datetime.utcnow()
                return True
            
            # Create placeholder if doesn't exist
            if is_syncing:
                cache = AnalyticsCache(
                    channel_id=channel_id,
                    cache_key=cache_key,
                    data={},
                    is_syncing=1,
                )
                session.add(cache)
                return True
            
            return False
    
    @staticmethod
    def set_sync_error(channel_id: str, cache_key: str, error: str) -> bool:
        """Set sync error."""
        with get_db_session() as session:
            cache = session.query(AnalyticsCache).filter(
                and_(
                    AnalyticsCache.channel_id == channel_id,
                    AnalyticsCache.cache_key == cache_key
                )
            ).first()
            
            if cache:
                cache.sync_error = error
                cache.is_syncing = 0
                cache.updated_at = datetime.utcnow()
                return True
            
            return False
    
    @staticmethod
    def is_cache_stale(channel_id: str, cache_key: str, max_age_hours: int = 6) -> bool:
        """Check if cache is stale and needs refresh."""
        with get_db_session() as session:
            cache = session.query(AnalyticsCache).filter(
                and_(
                    AnalyticsCache.channel_id == channel_id,
                    AnalyticsCache.cache_key == cache_key
                )
            ).first()
            
            if not cache:
                return True
            
            if not cache.last_sync_at:
                return True
            
            age = datetime.utcnow() - cache.last_sync_at
            return age > timedelta(hours=max_age_hours)


class VideoCacheRepository:
    """
    Repository for individual video cache.
    Supports incremental sync and fast queries.
    """
    
    @staticmethod
    def upsert_videos(channel_id: str, videos: List[Dict[str, Any]]) -> int:
        """Insert or update multiple videos."""
        count = 0
        
        with get_db_session() as session:
            for video_data in videos:
                existing = session.query(VideoCache).filter(
                    VideoCache.video_id == video_data["video_id"]
                ).first()
                
                if existing:
                    # Update existing
                    existing.title = video_data.get("title", existing.title)
                    existing.view_count = video_data.get("view_count", existing.view_count)
                    existing.like_count = video_data.get("like_count", existing.like_count)
                    existing.comment_count = video_data.get("comment_count", existing.comment_count)
                    existing.like_ratio = video_data.get("like_ratio", existing.like_ratio)
                    existing.engagement_score = video_data.get("engagement_score", existing.engagement_score)
                    existing.content_type = video_data.get("content_type", existing.content_type)
                    existing.metadata = video_data.get("metadata", existing.metadata)
                    existing.updated_at = datetime.utcnow()
                else:
                    # Insert new
                    video = VideoCache(
                        channel_id=channel_id,
                        video_id=video_data["video_id"],
                        title=video_data.get("title", ""),
                        description=video_data.get("description", ""),
                        published_at=video_data.get("pub_date"),
                        duration_seconds=video_data.get("duration_seconds", 0),
                        view_count=video_data.get("view_count", 0),
                        like_count=video_data.get("like_count", 0),
                        comment_count=video_data.get("comment_count", 0),
                        like_ratio=video_data.get("like_ratio", 0),
                        engagement_score=video_data.get("engagement_score", 0),
                        content_type=video_data.get("content_type"),
                        metadata=video_data.get("metadata", {}),
                    )
                    session.add(video)
                    count += 1
        
        return count
    
    @staticmethod
    def get_videos(
        channel_id: str,
        limit: int = 5000,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """Get cached videos for a channel."""
        with get_db_session() as session:
            videos = session.query(VideoCache).filter(
                VideoCache.channel_id == channel_id
            ).order_by(VideoCache.published_at.desc()).offset(offset).limit(limit).all()
            
            return [
                {
                    "video_id": v.video_id,
                    "title": v.title,
                    "description": v.description,
                    "published_at": v.published_at.isoformat() if v.published_at else None,
                    "duration_seconds": v.duration_seconds,
                    "view_count": v.view_count,
                    "like_count": v.like_count,
                    "comment_count": v.comment_count,
                    "like_ratio": v.like_ratio,
                    "engagement_score": v.engagement_score,
                    "content_type": v.content_type,
                    "metadata": v.metadata,
                }
                for v in videos
            ]
    
    @staticmethod
    def get_video_count(channel_id: str) -> int:
        """Get total video count for a channel."""
        with get_db_session() as session:
            return session.query(VideoCache).filter(
                VideoCache.channel_id == channel_id
            ).count()
    
    @staticmethod
    def get_latest_video_date(channel_id: str) -> Optional[datetime]:
        """Get the most recent video date for incremental sync."""
        with get_db_session() as session:
            video = session.query(VideoCache).filter(
                VideoCache.channel_id == channel_id
            ).order_by(VideoCache.published_at.desc()).first()
            
            return video.published_at if video else None

