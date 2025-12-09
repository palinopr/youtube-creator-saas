"""
Database models for persistent job and cache storage.
Uses SQLite with SQLAlchemy for production-ready persistence.
"""

import os
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Enum, JSON, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from contextlib import contextmanager

# Database setup
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "data", "youtube_saas.db")

# Ensure data directory exists
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class JobStatus(str, enum.Enum):
    """Job status enumeration."""
    PENDING = "pending"
    QUEUED = "queued"
    PROCESSING = "processing"
    RENDERING = "rendering"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class JobType(str, enum.Enum):
    """Job type enumeration."""
    RENDER_CLIP = "render_clip"
    DEEP_ANALYSIS = "deep_analysis"
    CAUSAL_ANALYSIS = "causal_analysis"
    VIDEO_SYNC = "video_sync"


class Job(Base):
    """
    Persistent job storage for background tasks.
    Replaces in-memory render_jobs dictionary.
    """
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(String(50), unique=True, nullable=False, index=True)
    job_type = Column(Enum(JobType), nullable=False)
    status = Column(Enum(JobStatus), default=JobStatus.PENDING)
    progress = Column(Integer, default=0)
    message = Column(String(500), default="")
    
    # Job-specific data (JSON serialized)
    input_data = Column(JSON, default=dict)
    output_data = Column(JSON, default=dict)
    
    # For render jobs
    video_id = Column(String(50), nullable=True, index=True)
    clip_id = Column(String(50), nullable=True)
    output_path = Column(String(500), nullable=True)
    
    # For analytics jobs
    channel_id = Column(String(50), nullable=True, index=True)
    max_videos = Column(Integer, nullable=True)
    
    # Error tracking
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    def to_dict(self) -> dict:
        """Convert job to dictionary."""
        return {
            "job_id": self.job_id,
            "job_type": self.job_type.value if self.job_type else None,
            "status": self.status.value if self.status else None,
            "progress": self.progress,
            "message": self.message,
            "video_id": self.video_id,
            "clip_id": self.clip_id,
            "output_path": self.output_path,
            "channel_id": self.channel_id,
            "input_data": self.input_data,
            "output_data": self.output_data,
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }


class AnalyticsCache(Base):
    """
    Cache for analytics data to avoid re-fetching from YouTube API.
    Implements ETL pattern: data is synced in background, API queries cache.
    """
    __tablename__ = "analytics_cache"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    channel_id = Column(String(50), nullable=False, index=True)
    cache_key = Column(String(100), nullable=False, index=True)  # e.g., "videos", "deep_analysis"
    
    # Cached data (JSON)
    data = Column(JSON, default=dict)
    
    # Metadata
    video_count = Column(Integer, default=0)
    last_video_date = Column(DateTime, nullable=True)
    
    # Sync status
    is_syncing = Column(Integer, default=0)  # SQLite doesn't have boolean
    last_sync_at = Column(DateTime, nullable=True)
    sync_error = Column(Text, nullable=True)
    
    # TTL management
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)


class VideoCache(Base):
    """
    Individual video cache for ETL pipeline.
    Stores normalized video data for fast querying.
    """
    __tablename__ = "video_cache"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    channel_id = Column(String(50), nullable=False, index=True)
    video_id = Column(String(50), nullable=False, unique=True, index=True)
    
    # Core video data
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    published_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, default=0)
    
    # Statistics (updated during sync)
    view_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    
    # Computed fields
    like_ratio = Column(Float, default=0)
    engagement_score = Column(Float, default=0)
    content_type = Column(String(50), nullable=True)
    
    # Extended metadata (JSON for flexibility)
    metadata = Column(JSON, default=dict)  # tags, celebrities, etc.
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


def init_db():
    """Initialize database tables."""
    Base.metadata.create_all(bind=engine)
    print(f"📦 Database initialized at: {DB_PATH}")


@contextmanager
def get_db_session() -> Session:
    """Get a database session with automatic cleanup."""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


# Initialize database on import
init_db()

