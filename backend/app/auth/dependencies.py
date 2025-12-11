"""
Authentication dependencies for FastAPI endpoints.
Provides user scoping for multi-tenant architecture.

Usage in routers:
    from ..auth.dependencies import get_current_user, require_subscription, require_feature

    @router.get("/data")
    async def get_data(user: User = Depends(get_current_user)):
        # user is guaranteed to be authenticated
        ...

    @router.get("/premium-data")
    async def get_premium_data(user: User = Depends(require_feature("deep_analysis"))):
        # user has access to deep_analysis feature
        ...
"""

from fastapi import HTTPException, Request, Depends
from typing import Optional, Callable
from datetime import datetime
import logging

from ..db.models import User, YouTubeChannel, Subscription, get_db_session, PlanTier, SessionLocal

logger = logging.getLogger(__name__)


def get_db():
    """
    FastAPI dependency that provides a database session.
    Automatically closes the session when the request is done.

    Usage:
        @router.get("/data")
        async def get_data(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_current_user_optional(request: Request) -> Optional[User]:
    """
    Get the current authenticated user if available.
    Returns None if not authenticated (doesn't raise an error).

    For multi-tenant mode, this checks the session/cookie for user_id.
    Currently supports single-user mode by checking if credentials exist.
    """
    # In single-user mode, we check for stored credentials
    # In multi-tenant mode, this would check session cookies
    from .youtube_auth import load_credentials, DEFAULT_TOKEN_KEY

    cred_data = load_credentials(DEFAULT_TOKEN_KEY)

    if not cred_data:
        return None

    # For now, return a mock user in single-user mode
    # In full multi-tenant mode, we'd look up the user from the session
    with get_db_session() as session:
        # Try to find existing user - first look for admin, then any active user
        user = session.query(User).filter(User.is_admin == True, User.is_active == True).first()

        if not user:
            # Fall back to any active user
            user = session.query(User).filter(User.is_active == True).first()

        if not user:
            # Create default user for single-user mode migration
            user = User(
                email="default@local",
                google_id="local-default",
                name="Default User",
                is_active=True,
            )
            session.add(user)
            session.commit()
            session.refresh(user)

            # Also create a free subscription for the user
            subscription = Subscription(
                user_id=user.id,
                plan_id=PlanTier.FREE,
            )
            session.add(subscription)
            session.commit()

        session.expunge(user)
        return user


async def get_current_user(request: Request) -> User:
    """
    Get the current authenticated user.
    Raises 401 if not authenticated.

    Use this as a dependency in protected endpoints:
        @router.get("/my-data")
        async def my_data(user: User = Depends(get_current_user)):
            ...
    """
    user = await get_current_user_optional(request)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated. Please login at /auth/login"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Account is deactivated. Please contact support."
        )

    return user


async def get_current_channel(
    request: Request,
    user: User = Depends(get_current_user)
) -> YouTubeChannel:
    """
    Get the active YouTube channel for the current user.
    Raises 404 if no channel is connected.

    Use this when you need both user and their YouTube channel:
        @router.get("/channel-data")
        async def channel_data(channel: YouTubeChannel = Depends(get_current_channel)):
            ...
    """
    with get_db_session() as session:
        # Get primary channel, or first active channel
        channel = session.query(YouTubeChannel).filter(
            YouTubeChannel.user_id == user.id,
            YouTubeChannel.is_active == True
        ).order_by(
            YouTubeChannel.is_primary.desc()
        ).first()

        if not channel:
            raise HTTPException(
                status_code=404,
                detail="No YouTube channel connected. Please connect your channel."
            )

        session.expunge(channel)
        return channel


async def get_user_subscription(
    user: User = Depends(get_current_user)
) -> Subscription:
    """
    Get the subscription for the current user.
    Creates a free subscription if none exists.
    """
    with get_db_session() as session:
        subscription = session.query(Subscription).filter(
            Subscription.user_id == user.id
        ).first()

        if not subscription:
            # Create free subscription
            subscription = Subscription(
                user_id=user.id,
                plan_id=PlanTier.FREE,
            )
            session.add(subscription)
            session.commit()
            session.refresh(subscription)

        session.expunge(subscription)
        return subscription


def require_subscription(
    allowed_statuses: list[str] = ["active", "trialing"]
) -> Callable:
    """
    Dependency factory that requires an active subscription.

    Usage:
        @router.get("/premium-data")
        async def premium_data(user: User = Depends(require_subscription())):
            ...
    """
    async def dependency(
        user: User = Depends(get_current_user),
        subscription: Subscription = Depends(get_user_subscription)
    ) -> User:
        if subscription.status.value not in allowed_statuses:
            raise HTTPException(
                status_code=403,
                detail=f"Subscription required. Current status: {subscription.status.value}"
            )
        return user

    return dependency


def require_plan(min_plan: str) -> Callable:
    """
    Dependency factory that requires a minimum plan tier.

    Plan hierarchy: free < starter < pro < agency

    Usage:
        @router.get("/pro-feature")
        async def pro_feature(user: User = Depends(require_plan("pro"))):
            ...
    """
    plan_hierarchy = ["free", "starter", "pro", "agency"]

    async def dependency(
        user: User = Depends(get_current_user),
        subscription: Subscription = Depends(get_user_subscription)
    ) -> User:
        user_plan_index = plan_hierarchy.index(subscription.plan_id.value)
        required_plan_index = plan_hierarchy.index(min_plan)

        if user_plan_index < required_plan_index:
            raise HTTPException(
                status_code=403,
                detail=f"This feature requires {min_plan} plan or higher. Current plan: {subscription.plan_id.value}"
            )
        return user

    return dependency


def require_feature(feature: str) -> Callable:
    """
    Dependency factory that requires access to a specific feature.

    Usage:
        @router.post("/generate-clips")
        async def generate_clips(user: User = Depends(require_feature("clips_generation"))):
            ...
    """
    async def dependency(
        user: User = Depends(get_current_user),
        subscription: Subscription = Depends(get_user_subscription)
    ) -> User:
        from ..billing.plans import check_feature_access

        if not check_feature_access(subscription.plan_id.value, feature):
            raise HTTPException(
                status_code=403,
                detail=f"Feature '{feature}' is not available in your plan ({subscription.plan_id.value}). Please upgrade."
            )
        return user

    return dependency


async def check_and_increment_usage(
    resource: str,
    user: User = Depends(get_current_user),
    subscription: Subscription = Depends(get_user_subscription)
) -> User:
    """
    Check if user has remaining quota for a resource and increment usage.

    Resources:
    - videos_per_month
    - ai_queries_per_month
    - clips_per_month

    Usage:
        @router.post("/analyze")
        async def analyze(user: User = Depends(check_usage("videos_per_month"))):
            ...
    """
    # Admin users bypass all usage limits
    if user.is_admin:
        logger.debug(f"Admin user {user.email} bypassing usage check for {resource}")
        return user

    from ..billing.plans import get_usage_limit

    limit = get_usage_limit(subscription.plan_id.value, resource)

    # Get current usage based on resource type
    usage_field_map = {
        "videos_per_month": "videos_analyzed_this_month",
        "ai_queries_per_month": "ai_queries_this_month",
        "clips_per_month": "clips_generated_this_month",
    }

    usage_field = usage_field_map.get(resource)
    if not usage_field:
        logger.warning(f"Unknown resource type: {resource}")
        return user

    current_usage = getattr(subscription, usage_field, 0)

    # Check if unlimited
    if limit == -1:
        # Still increment for tracking, but don't block
        with get_db_session() as session:
            sub = session.query(Subscription).filter(Subscription.id == subscription.id).first()
            if sub:
                setattr(sub, usage_field, current_usage + 1)
                session.commit()
        return user

    # Check limit
    if current_usage >= limit:
        raise HTTPException(
            status_code=429,
            detail=f"Monthly limit reached for {resource}. Used: {current_usage}/{limit}. Please upgrade your plan."
        )

    # Increment usage
    with get_db_session() as session:
        sub = session.query(Subscription).filter(Subscription.id == subscription.id).first()
        if sub:
            setattr(sub, usage_field, current_usage + 1)
            session.commit()

    return user


def check_usage(resource: str) -> Callable:
    """
    Dependency factory for checking and incrementing resource usage.

    Usage:
        @router.post("/analyze-video")
        async def analyze(user: User = Depends(check_usage("videos_per_month"))):
            ...
    """
    async def dependency(
        user: User = Depends(get_current_user),
        subscription: Subscription = Depends(get_user_subscription)
    ) -> User:
        return await check_and_increment_usage(resource, user, subscription)

    return dependency


async def require_admin(
    user: User = Depends(get_current_user)
) -> User:
    """
    Dependency that requires the user to be an admin.

    Usage:
        @router.get("/admin/data")
        async def admin_data(user: User = Depends(require_admin)):
            ...
    """
    if not user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    return user
