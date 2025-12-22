from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exception_handlers import http_exception_handler as fastapi_http_exception_handler
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import logging

from .auth import auth_router
from .routers.analytics import router as analytics_router
from .routers.seo import router as seo_router
from .routers.channel_analysis import router as analysis_router
from .routers.clips import router as clips_router
from .routers.youtube_videos import router as youtube_videos_router
from .routers.billing import router as billing_router
from .routers.admin import router as admin_router
from .routers.user import router as user_router
from .routers.audience import router as audience_router
from .routers.traffic import router as traffic_router
from .routers.revenue import router as revenue_router
from .routers.comments import router as comments_router
from .routers.alerts import router as alerts_router
from .routers.public_tools import router as public_tools_router
from .v1.routes import router as v1_router
from .config import get_settings
from .workers.manager import start_workers, stop_workers
from .db.models import init_db

settings = get_settings()
logger = logging.getLogger(__name__)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    print("🚀 TubeGrow API starting up...")
    print(f"📍 Backend URL: {settings.backend_url}")
    print(f"🌐 Frontend URL: {settings.frontend_url}")
    
    if not settings.google_client_id:
        print("⚠️  Warning: GOOGLE_CLIENT_ID not set. OAuth will not work.")
    if not settings.openai_api_key:
        print("⚠️  Warning: OPENAI_API_KEY not set. AI features will not work.")
    
    # Initialize database
    init_db()
    
    # Start background workers for async tasks
    start_workers()
    print("🔧 Background workers started")
    
    yield
    
    # Shutdown workers
    stop_workers()
    print("👋 TubeGrow API shutting down...")


app = FastAPI(
    title="TubeGrow API",
    description="AI-powered analytics dashboard for YouTube creators",
    version="1.0.0",
    lifespan=lifespan,
)

# Attach rate limiter to app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Sanitize server errors in production while preserving 4xx details.
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    if exc.status_code >= 500 and not settings.debug:
        logger.exception("Server HTTPException", exc_info=exc)
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})
    return await fastapi_http_exception_handler(request, exc)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception", exc_info=exc)
    if settings.debug:
        return JSONResponse(status_code=500, content={"detail": str(exc)})
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "https://tubegrow.io",
        "https://www.tubegrow.io",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(analytics_router)
app.include_router(seo_router)
app.include_router(analysis_router)
app.include_router(clips_router)
app.include_router(youtube_videos_router)
app.include_router(billing_router)
app.include_router(admin_router)
app.include_router(user_router)
app.include_router(audience_router)
app.include_router(traffic_router)
app.include_router(revenue_router)
app.include_router(comments_router)
app.include_router(alerts_router)
app.include_router(public_tools_router)
app.include_router(v1_router)


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": "TubeGrow API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "auth": {
                "login": "/auth/login",
                "callback": "/auth/callback",
                "status": "/auth/status",
                "logout": "/auth/logout",
            },
            "analytics": {
                "channel_stats": "/api/channel/stats",
                "recent_videos": "/api/videos/recent",
                "video_details": "/api/videos/{video_id}",
                "agent_query": "/api/agent/query",
            },
            "seo": {
                "analyze_video": "/api/seo/analyze/{video_id}",
                "audit_channel": "/api/seo/audit",
                "research_keywords": "/api/seo/research",
                "generate_metadata": "/api/seo/generate",
                "videos_for_optimization": "/api/seo/videos",
            },
            "analysis": {
                "patterns": "/api/analysis/patterns - Data-driven SEO patterns from YOUR videos",
                "top_videos": "/api/analysis/top-videos - Your best performing videos",
                "compare": "/api/analysis/compare/{video_id} - Compare video to your top performers",
                "deep": "/api/analysis/deep - ASYNC deep analysis (submit job, poll for results)",
                "deep_status": "/api/analysis/deep/status/{job_id} - Check deep analysis job status",
            },
            "clips": {
                "generate": "/api/clips/generate - Generate viral short clip suggestions",
                "render": "/api/clips/render - Render clip to MP4 with captions (async)",
                "status": "/api/clips/{job_id}/status - Check render progress",
                "download": "/api/clips/{job_id}/download - Download rendered clip",
            },
            "youtube": {
                "channel": "/api/youtube/channel - Get connected YouTube channel info",
                "videos": "/api/youtube/videos - List user's own videos",
                "video_details": "/api/youtube/videos/{video_id} - Get video details",
                "verify_ownership": "/api/youtube/videos/{video_id}/verify-ownership - Verify user owns video",
                "prepare_download": "/api/youtube/videos/{video_id}/prepare-download - Download user's video",
            },
            "billing": {
                "plans": "/api/billing/plans - Get available subscription plans",
                "subscription": "/api/billing/subscription - Get current subscription status",
                "checkout": "/api/billing/checkout - Create Stripe checkout session",
                "portal": "/api/billing/portal - Create Stripe customer portal session",
                "usage": "/api/billing/usage - Get usage statistics",
                "downgrade": "/api/billing/downgrade - Downgrade to free plan",
                "webhook": "/api/billing/webhook - Stripe webhook handler",
            },
            "admin": {
                "status": "/api/admin/status - Check admin services status",
                "seo_rankings": "/api/admin/seo/rankings - Get SEO rankings summary",
                "seo_domains": "/api/admin/seo/domains - Manage tracked domains",
                "seo_keywords": "/api/admin/seo/keywords - Manage tracked keywords",
                "api_costs_summary": "/api/admin/api-costs/summary - Get API cost summary",
                "api_costs_breakdown": "/api/admin/api-costs/breakdown - Get cost breakdown by day/agent/model",
                "api_costs_recent": "/api/admin/api-costs/recent - Get recent API calls",
                "api_costs_by_user": "/api/admin/api-costs/by-user - Get costs by user",
            },
            "user": {
                "profile": "/api/user/profile - Get/update user profile",
                "settings": "/api/user/settings - Get/update account settings",
                "channels": "/api/user/channels - Get connected YouTube channels",
                "export_data": "/api/user/export-data - Request GDPR data export",
                "request_deletion": "/api/user/request-deletion - Request account deletion",
                "cancel_deletion": "/api/user/cancel-deletion - Cancel deletion request",
            },
            "audience": {
                "demographics": "/api/audience/demographics - Age/gender breakdown",
                "geography": "/api/audience/geography - Views by country",
                "devices": "/api/audience/devices - Device type breakdown (mobile, desktop, TV)",
                "summary": "/api/audience/summary - Combined audience intelligence data",
            },
            "traffic": {
                "sources": "/api/traffic/sources - Where views come from (search, suggested, browse)",
                "subscribers": "/api/traffic/subscribers - Subscriber gain/loss by source",
                "playback_locations": "/api/traffic/playback-locations - Where videos are watched",
                "summary": "/api/traffic/summary - Combined traffic analytics",
            },
            "revenue": {
                "overview": "/api/revenue/overview - Revenue and monetization data",
                "by_country": "/api/revenue/by-country - Revenue breakdown by country with CPM",
                "daily": "/api/revenue/daily - Day-by-day revenue breakdown",
                "status": "/api/revenue/status - Check if monetization is available",
            },
            "comments": {
                "analyze": "/api/comments/analyze - AI-powered comment analysis across channel",
                "analyze_video": "/api/comments/analyze/{video_id} - Analyze comments for specific video",
                "sentiment_trend": "/api/comments/sentiment-trend - Sentiment trends across videos",
                "questions": "/api/comments/questions - Extract questions needing responses",
                "content_ideas": "/api/comments/content-ideas - Mine content ideas from comments",
                "notable_commenters": "/api/comments/notable-commenters - Find creators who commented",
            }
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
