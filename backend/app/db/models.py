"""
Database models for persistent job and cache storage.
Supports PostgreSQL for production and SQLite for local development.

Multi-tenant SaaS architecture with:
- User: Account holder (Google OAuth)
- YouTubeChannel: Connected YouTube channel(s) per user
- Subscription: Stripe billing subscription
"""

import os
import enum
import logging
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Enum, JSON, Float, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from sqlalchemy.pool import QueuePool, StaticPool
from contextlib import contextmanager

logger = logging.getLogger(__name__)

# Database setup - supports both PostgreSQL (production) and SQLite (development)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SQLITE_DB_PATH = os.path.join(BASE_DIR, "data", "youtube_saas.db")

# Read DATABASE_URL from environment, default to SQLite for local development
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL is None:
    # Default to SQLite for local development
    os.makedirs(os.path.dirname(SQLITE_DB_PATH), exist_ok=True)
    DATABASE_URL = f"sqlite:///{SQLITE_DB_PATH}"
    IS_SQLITE = True
elif DATABASE_URL.startswith("postgres://"):
    # Heroku uses postgres:// but SQLAlchemy requires postgresql://
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    IS_SQLITE = False
else:
    IS_SQLITE = DATABASE_URL.startswith("sqlite")


def get_engine_kwargs() -> dict:
    """
    Get database engine configuration based on database type.
    
    SQLite requires check_same_thread=False for multi-threaded access.
    PostgreSQL uses connection pooling for production performance.
    """
    if IS_SQLITE:
        return {
            "connect_args": {"check_same_thread": False},
            "poolclass": StaticPool,  # Better for SQLite with threading
        }
    else:
        # PostgreSQL production settings
        return {
            "poolclass": QueuePool,
            "pool_size": 5,
            "max_overflow": 10,
            "pool_pre_ping": True,  # Verify connections before use
            "pool_recycle": 300,    # Recycle connections after 5 minutes
        }


engine = create_engine(DATABASE_URL, **get_engine_kwargs())
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
    expires_at = Column(DateTime, nullable=True, index=True)  # Index for cache expiry queries


class TranscriptCache(Base):
    """
    Permanent cache for video transcripts.
    Transcripts never change after upload - cache forever.
    Saves 250 API quota units per video!
    """
    __tablename__ = "transcript_cache"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    video_id = Column(String(50), nullable=False, unique=True, index=True)
    
    # Transcript content
    transcript_text = Column(Text, nullable=False)
    transcript_segments = Column(JSON, default=list)  # [{start, duration, text}, ...]
    language = Column(String(10), default="en")
    
    # Source tracking (for debugging)
    source = Column(String(50), default="unknown")  # 'youtube_transcript_api', 'youtube_api', 'whisper'
    
    # Word timestamps for precise cutting (optional, from Whisper)
    word_timestamps = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self) -> dict:
        return {
            "video_id": self.video_id,
            "transcript_text": self.transcript_text,
            "transcript_segments": self.transcript_segments,
            "language": self.language,
            "source": self.source,
            "word_timestamps": self.word_timestamps,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class LLMCache(Base):
    """
    Cache for LLM responses to reduce API costs.
    Stores prompt hashes and responses for reuse.
    """
    __tablename__ = "llm_cache"

    id = Column(Integer, primary_key=True, autoincrement=True)
    prompt_hash = Column(String(64), unique=True, nullable=False, index=True)  # SHA-256 hash
    model = Column(String(50), nullable=False, index=True)

    # Cached response
    response = Column(Text, nullable=False)

    # Request metadata
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)

    # TTL management
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True, index=True)
    hit_count = Column(Integer, default=0)  # Track cache hits

    def to_dict(self) -> dict:
        return {
            "prompt_hash": self.prompt_hash,
            "model": self.model,
            "response": self.response,
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "hit_count": self.hit_count,
        }


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
    video_metadata = Column(JSON, default=dict)  # tags, celebrities, etc.

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class UserToken(Base):
    """
    Secure storage for OAuth tokens.
    Tokens are encrypted at rest using Fernet symmetric encryption.
    Replaces insecure file-based token storage.
    """
    __tablename__ = "user_tokens"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # Token identifier (for single-user: "default", for multi-tenant: user_id)
    token_key = Column(String(100), nullable=False, unique=True, index=True, default="default")

    # Encrypted OAuth credentials (JSON string encrypted with Fernet)
    encrypted_credentials = Column(Text, nullable=True)

    # OAuth state for CSRF protection (temporary, cleared after callback)
    oauth_state = Column(String(200), nullable=True)

    # Token metadata (not sensitive)
    channel_id = Column(String(50), nullable=True)
    channel_name = Column(String(200), nullable=True)

    # Token expiry tracking
    token_expiry = Column(DateTime, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# =============================================================================
# Multi-Tenant SaaS Models
# =============================================================================

class SubscriptionStatus(str, enum.Enum):
    """Subscription status enumeration."""
    ACTIVE = "active"
    CANCELED = "canceled"
    PAST_DUE = "past_due"
    TRIALING = "trialing"
    UNPAID = "unpaid"


class AdminActionType(str, enum.Enum):
    """Types of admin actions for audit logging."""
    USER_VIEW = "user_view"
    USER_EDIT = "user_edit"
    USER_SUSPEND = "user_suspend"
    USER_UNSUSPEND = "user_unsuspend"
    USER_DELETE = "user_delete"
    USER_IMPERSONATE = "user_impersonate"
    SUBSCRIPTION_CHANGE = "subscription_change"
    SUBSCRIPTION_OVERRIDE = "subscription_override"
    USAGE_RESET = "usage_reset"


class PlanTier(str, enum.Enum):
    """Subscription plan tiers."""
    FREE = "free"
    STARTER = "starter"
    PRO = "pro"
    AGENCY = "agency"


class User(Base):
    """
    User account holder (via Google OAuth).
    Central entity for multi-tenant architecture.
    """
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    google_id = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=True)
    avatar_url = Column(String(500), nullable=True)

    # Profile
    bio = Column(Text, nullable=True)

    # Preferences
    timezone = Column(String(50), default="UTC")
    theme_preference = Column(String(20), default="dark")
    language = Column(String(10), default="en")
    notification_preferences = Column(JSON, default=lambda: {
        "email_marketing": True,
        "email_product_updates": True,
        "email_weekly_digest": False,
        "email_billing_alerts": True,
    })

    # Data management (GDPR)
    last_data_export_at = Column(DateTime, nullable=True)
    deletion_requested_at = Column(DateTime, nullable=True)
    deletion_request_reason = Column(Text, nullable=True)

    # Account status
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)  # Admin users can access /admin routes

    # Suspension (admin action)
    suspended_at = Column(DateTime, nullable=True)
    suspended_reason = Column(String(500), nullable=True)
    suspended_by = Column(String(36), nullable=True)  # Admin user ID who suspended

    # Soft delete
    deleted_at = Column(DateTime, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login_at = Column(DateTime, nullable=True)

    # Relationships
    channels = relationship("YouTubeChannel", back_populates="user", cascade="all, delete-orphan")
    subscription = relationship("Subscription", back_populates="user", uselist=False, cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        """Convert user to dictionary (safe for API responses)."""
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "avatar_url": self.avatar_url,
            "bio": self.bio,
            "timezone": self.timezone or "UTC",
            "theme_preference": self.theme_preference or "dark",
            "language": self.language or "en",
            "notification_preferences": self.notification_preferences or {},
            "is_active": self.is_active,
            "is_admin": self.is_admin,
            "suspended_at": self.suspended_at.isoformat() if self.suspended_at else None,
            "suspended_reason": self.suspended_reason,
            "deleted_at": self.deleted_at.isoformat() if self.deleted_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login_at": self.last_login_at.isoformat() if self.last_login_at else None,
            "last_data_export_at": self.last_data_export_at.isoformat() if self.last_data_export_at else None,
            "deletion_requested_at": self.deletion_requested_at.isoformat() if self.deletion_requested_at else None,
        }

    @property
    def is_suspended(self) -> bool:
        """Check if user is currently suspended."""
        return self.suspended_at is not None

    @property
    def is_deleted(self) -> bool:
        """Check if user is soft-deleted."""
        return self.deleted_at is not None


class YouTubeChannel(Base):
    """
    Connected YouTube channel for a user.
    Users can connect multiple channels (e.g., Brand Accounts).
    """
    __tablename__ = "youtube_channels"

    id = Column(String(50), primary_key=True)  # YouTube channel ID (UC...)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Channel metadata
    channel_name = Column(String(200), nullable=True)
    thumbnail_url = Column(String(500), nullable=True)
    subscriber_count = Column(Integer, default=0)

    # OAuth tokens (encrypted)
    encrypted_access_token = Column(Text, nullable=True)
    encrypted_refresh_token = Column(Text, nullable=True)
    token_expiry = Column(DateTime, nullable=True)

    # Status
    is_active = Column(Boolean, default=True)
    is_primary = Column(Boolean, default=False)  # Primary channel for this user

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_sync_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="channels")

    def to_dict(self) -> dict:
        """Convert channel to dictionary (safe for API responses)."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "channel_name": self.channel_name,
            "thumbnail_url": self.thumbnail_url,
            "subscriber_count": self.subscriber_count,
            "is_active": self.is_active,
            "is_primary": self.is_primary,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_sync_at": self.last_sync_at.isoformat() if self.last_sync_at else None,
        }


class Subscription(Base):
    """
    Stripe subscription for billing.
    One subscription per user (upgrade/downgrade changes plan_id).
    """
    __tablename__ = "subscriptions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    # Stripe identifiers
    stripe_customer_id = Column(String(100), unique=True, nullable=True, index=True)
    stripe_subscription_id = Column(String(100), unique=True, nullable=True, index=True)

    # Plan details
    plan_id = Column(Enum(PlanTier), default=PlanTier.FREE, nullable=False)
    status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE, nullable=False)

    # Billing period
    current_period_start = Column(DateTime, nullable=True)
    current_period_end = Column(DateTime, nullable=True)
    cancel_at_period_end = Column(Boolean, default=False)

    # Usage tracking (reset monthly)
    videos_analyzed_this_month = Column(Integer, default=0)
    ai_queries_this_month = Column(Integer, default=0)
    clips_generated_this_month = Column(Integer, default=0)
    usage_reset_at = Column(DateTime, default=datetime.utcnow)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="subscription")

    def to_dict(self) -> dict:
        """Convert subscription to dictionary (safe for API responses)."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "plan_id": self.plan_id.value if self.plan_id else None,
            "status": self.status.value if self.status else None,
            "current_period_end": self.current_period_end.isoformat() if self.current_period_end else None,
            "cancel_at_period_end": self.cancel_at_period_end,
            "usage": {
                "videos_analyzed": self.videos_analyzed_this_month,
                "ai_queries": self.ai_queries_this_month,
                "clips_generated": self.clips_generated_this_month,
                "reset_at": self.usage_reset_at.isoformat() if self.usage_reset_at else None,
            },
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def is_feature_enabled(self, feature: str) -> bool:
        """Check if a feature is enabled for this subscription's plan."""
        from ..billing.plans import PLANS
        plan_features = PLANS.get(self.plan_id.value, {}).get("features", {})
        return plan_features.get(feature, False)

    def get_limit(self, resource: str) -> int:
        """Get the limit for a resource (-1 means unlimited)."""
        from ..billing.plans import PLANS
        plan_features = PLANS.get(self.plan_id.value, {}).get("features", {})
        return plan_features.get(resource, 0)


# =============================================================================
# Admin Models
# =============================================================================

class AdminActivityLog(Base):
    """
    Audit log for admin actions.
    Tracks all admin operations for security and compliance.
    """
    __tablename__ = "admin_activity_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    admin_user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    action_type = Column(Enum(AdminActionType), nullable=False, index=True)
    target_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    target_resource = Column(String(100), nullable=True)  # e.g., "subscription", "channel"
    target_resource_id = Column(String(36), nullable=True)

    # Action details
    description = Column(String(500), nullable=False)
    old_value = Column(JSON, nullable=True)  # State before change
    new_value = Column(JSON, nullable=True)  # State after change

    # Request context
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    admin_user = relationship("User", foreign_keys=[admin_user_id])
    target_user = relationship("User", foreign_keys=[target_user_id])

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "admin_user_id": self.admin_user_id,
            "admin_email": self.admin_user.email if self.admin_user else None,
            "action_type": self.action_type.value if self.action_type else None,
            "target_user_id": self.target_user_id,
            "target_email": self.target_user.email if self.target_user else None,
            "target_resource": self.target_resource,
            "target_resource_id": self.target_resource_id,
            "description": self.description,
            "old_value": self.old_value,
            "new_value": self.new_value,
            "ip_address": self.ip_address,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ImpersonationSession(Base):
    """
    Track admin impersonation sessions for security.
    """
    __tablename__ = "impersonation_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    admin_user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    target_user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)

    # Session token (hashed)
    session_token_hash = Column(String(64), nullable=False, unique=True)

    # Time bounds
    started_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    ended_at = Column(DateTime, nullable=True)

    # Reason for impersonation (required for audit)
    reason = Column(String(500), nullable=False)

    # Status
    is_active = Column(Boolean, default=True)

    # Relationships
    admin_user = relationship("User", foreign_keys=[admin_user_id])
    target_user = relationship("User", foreign_keys=[target_user_id])

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "admin_user_id": self.admin_user_id,
            "admin_email": self.admin_user.email if self.admin_user else None,
            "target_user_id": self.target_user_id,
            "target_email": self.target_user.email if self.target_user else None,
            "reason": self.reason,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "ended_at": self.ended_at.isoformat() if self.ended_at else None,
            "is_active": self.is_active,
        }


# =============================================================================
# API Usage Tracking
# =============================================================================

class AgentType(str, enum.Enum):
    """AI Agent types."""
    ANALYTICS = "analytics"
    SEO = "seo"
    CLIPS = "clips"
    DEEP_ANALYSIS = "deep_analysis"
    CHAT = "chat"
    COMMENTS = "comments"
    ALERTS = "alerts"
    OTHER = "other"


class AlertType(str, enum.Enum):
    """Alert type enumeration."""
    VIRAL = "viral"              # Video going viral (3x+ average views)
    DROP = "drop"                # Significant view drop
    MILESTONE = "milestone"      # Subscriber/view milestones
    ENGAGEMENT = "engagement"    # Engagement spike or drop
    COMMENT_SURGE = "comment_surge"  # Unusual comment activity
    OPPORTUNITY = "opportunity"  # Trending topic in niche
    WARNING = "warning"          # General warnings (upload consistency, etc.)


class AlertPriority(str, enum.Enum):
    """Alert priority levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Alert(Base):
    """
    In-app notification/alert for real-time events.
    Tracks viral moments, drops, milestones, and opportunities.
    """
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Alert type and priority
    alert_type = Column(Enum(AlertType), nullable=False, index=True)
    priority = Column(Enum(AlertPriority), default=AlertPriority.MEDIUM)

    # Content
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)

    # Related entities (optional)
    video_id = Column(String(50), nullable=True, index=True)
    video_title = Column(String(500), nullable=True)

    # Alert data (JSON for flexibility)
    data = Column(JSON, default=dict)  # threshold values, metrics, etc.

    # Status
    is_read = Column(Boolean, default=False, index=True)
    is_dismissed = Column(Boolean, default=False)
    action_taken = Column(String(100), nullable=True)  # e.g., "viewed_video", "dismissed"

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    read_at = Column(DateTime, nullable=True)
    dismissed_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "alert_type": self.alert_type.value if self.alert_type else None,
            "priority": self.priority.value if self.priority else None,
            "title": self.title,
            "message": self.message,
            "video_id": self.video_id,
            "video_title": self.video_title,
            "data": self.data,
            "is_read": self.is_read,
            "is_dismissed": self.is_dismissed,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "read_at": self.read_at.isoformat() if self.read_at else None,
        }


class APIUsage(Base):
    """
    Track OpenAI API usage for cost monitoring.
    Records every LLM call with tokens and estimated cost.
    """
    __tablename__ = "api_usage"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    # Agent/Feature info
    agent_type = Column(Enum(AgentType), nullable=False, index=True)
    endpoint = Column(String(200), nullable=True)  # API endpoint that triggered this

    # Model info
    model = Column(String(50), nullable=False, index=True)  # gpt-4o, gpt-4o-mini, etc.

    # Token counts
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)

    # Cost in USD (calculated based on model pricing)
    cost_usd = Column(Float, default=0.0)

    # Request metadata
    request_id = Column(String(100), nullable=True)  # For debugging
    success = Column(Boolean, default=True)
    error_message = Column(String(500), nullable=True)
    latency_ms = Column(Integer, nullable=True)  # Response time in milliseconds

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "agent_type": self.agent_type.value if self.agent_type else None,
            "endpoint": self.endpoint,
            "model": self.model,
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
            "total_tokens": self.total_tokens,
            "cost_usd": round(self.cost_usd, 6) if self.cost_usd else 0,
            "success": self.success,
            "latency_ms": self.latency_ms,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# OpenAI pricing per 1M tokens (as of Dec 2024)
OPENAI_PRICING = {
    "gpt-4o": {"input": 2.50, "output": 10.00},
    "gpt-4o-mini": {"input": 0.15, "output": 0.60},
    "gpt-4-turbo": {"input": 10.00, "output": 30.00},
    "gpt-4": {"input": 30.00, "output": 60.00},
    "gpt-3.5-turbo": {"input": 0.50, "output": 1.50},
}


def calculate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> float:
    """Calculate cost in USD for an API call."""
    pricing = OPENAI_PRICING.get(model, OPENAI_PRICING.get("gpt-4o-mini"))
    input_cost = (prompt_tokens / 1_000_000) * pricing["input"]
    output_cost = (completion_tokens / 1_000_000) * pricing["output"]
    return input_cost + output_cost


def track_api_usage(
    db: Session,
    agent_type: AgentType,
    model: str,
    prompt_tokens: int,
    completion_tokens: int,
    user_id: Optional[str] = None,
    endpoint: Optional[str] = None,
    request_id: Optional[str] = None,
    success: bool = True,
    error_message: Optional[str] = None,
    latency_ms: Optional[int] = None,
) -> APIUsage:
    """
    Record an API usage entry.
    Call this after every LLM call to track costs.
    """
    total_tokens = prompt_tokens + completion_tokens
    cost = calculate_cost(model, prompt_tokens, completion_tokens)

    usage = APIUsage(
        user_id=user_id,
        agent_type=agent_type,
        endpoint=endpoint,
        model=model,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=total_tokens,
        cost_usd=cost,
        request_id=request_id,
        success=success,
        error_message=error_message,
        latency_ms=latency_ms,
    )
    db.add(usage)
    db.commit()
    return usage


class MarketingLead(Base):
    """
    Marketing leads captured from public pages (e.g., the landing AI agent).

    This is intentionally separate from the waitlist flow: it is a general lead
    capture channel that can be used for follow-ups and product feedback.
    """

    __tablename__ = "marketing_leads"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=True)
    source = Column(String(100), default="landing_agent")

    ask_count_total = Column(Integer, default=0)
    ask_count_day = Column(Integer, default=0)
    ask_day = Column(String(10), nullable=True)  # YYYY-MM-DD (UTC)
    last_ask_at = Column(DateTime, nullable=True)

    ip_last = Column(String(64), nullable=True)
    user_agent_last = Column(String(300), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class MarketingAgentAsk(Base):
    """
    Optional logging of questions asked on public pages.
    Keep answers small (truncated) to avoid storing sensitive/large content.
    """

    __tablename__ = "marketing_agent_asks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    lead_id = Column(String(36), ForeignKey("marketing_leads.id"), nullable=True, index=True)
    email = Column(String(255), nullable=False, index=True)
    page_url = Column(String(500), nullable=True)
    question = Column(Text, nullable=False)
    answer_preview = Column(Text, nullable=True)
    model = Column(String(100), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    lead = relationship("MarketingLead", lazy="joined")


# =============================================================================
# Waitlist (migrated from Supabase)
# =============================================================================

class WaitlistStatus(str, enum.Enum):
    """Waitlist entry status."""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    INVITED = "invited"
    CONVERTED = "converted"


class Waitlist(Base):
    """
    Email waitlist for pre-launch signups.
    Migrated from Supabase to consolidate all data in one database.
    """
    __tablename__ = "waitlist"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)

    # Signup context
    referral_source = Column(String(200), nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)

    # Waitlist position (auto-incremented)
    position = Column(Integer, nullable=True)

    # Confirmation
    status = Column(Enum(WaitlistStatus), default=WaitlistStatus.PENDING, index=True)
    confirmation_token = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True)
    confirmed_at = Column(DateTime, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self) -> dict:
        """Convert to dictionary (safe for API responses)."""
        return {
            "id": self.id,
            "email": self.email,
            "position": self.position,
            "status": self.status.value if self.status else None,
            "confirmed_at": self.confirmed_at.isoformat() if self.confirmed_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


def init_db():
    """Initialize database tables."""
    # Ensure V1 model modules are imported so they register with SQLAlchemy metadata
    # before `create_all` runs (this repo doesn't currently use Alembic).
    from app.v1.models import channel_memory as _channel_memory  # noqa: F401
    from app.v1.models import change_review as _change_review  # noqa: F401
    from app.v1.models import review_outcome as _review_outcome  # noqa: F401

    Base.metadata.create_all(bind=engine)
    
    if IS_SQLITE:
        db_info = f"SQLite @ {SQLITE_DB_PATH}"
    else:
        # Mask the password in the connection string for logging
        safe_url = DATABASE_URL
        if "@" in safe_url:
            # Format: postgresql://user:pass@host:port/db -> postgresql://user:***@host:port/db
            prefix, rest = safe_url.split("://", 1)
            if "@" in rest:
                user_pass, host_db = rest.split("@", 1)
                if ":" in user_pass:
                    user, _ = user_pass.split(":", 1)
                    safe_url = f"{prefix}://{user}:***@{host_db}"
        db_info = f"PostgreSQL @ {safe_url}"
    
    logger.info(f"📦 Database initialized: {db_info}")
    print(f"📦 Database initialized: {db_info}")


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
