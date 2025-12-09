from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .auth import auth_router
from .routers.analytics import router as analytics_router
from .routers.seo import router as seo_router
from .routers.channel_analysis import router as analysis_router
from .routers.clips import router as clips_router
from .config import get_settings
from .workers.manager import start_workers, stop_workers
from .db.models import init_db

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    print("🚀 YouTube Creator SaaS API starting up...")
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
    print("👋 YouTube Creator SaaS API shutting down...")


app = FastAPI(
    title="YouTube Creator SaaS API",
    description="AI-powered analytics dashboard for YouTube creators",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
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


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": "YouTube Creator SaaS API",
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
            }
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
