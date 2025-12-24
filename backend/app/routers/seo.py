"""SEO Optimizer API endpoints."""

from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict
from slowapi import Limiter
from slowapi.util import get_remote_address

from ..auth import get_authenticated_service
from ..auth.dependencies import get_current_user, check_usage, get_channel_profile
from ..db.models import User
from ..agents.seo_agent import SEOAgent
from ..services.youtube import YouTubeTools
from ..tools.description_generator import DescriptionGenerator
from ..tools.transcript_analyzer import TranscriptAnalyzer
from ..services.thumbnail_analyzer import analyze_thumbnail, ThumbnailAnalysisResult

router = APIRouter(prefix="/api/seo", tags=["seo"])
limiter = Limiter(key_func=get_remote_address)


class KeywordResearchRequest(BaseModel):
    """Request model for keyword research."""
    topic: str = Field(..., min_length=1, max_length=200, description="Topic to research")
    limit: int = Field(default=10, ge=1, le=50, description="Number of results")


class MetadataGenerationRequest(BaseModel):
    """Request model for metadata generation."""
    topic: str = Field(..., min_length=1, max_length=200, description="Video topic")
    current_title: Optional[str] = Field(default=None, max_length=100)
    current_description: Optional[str] = Field(default=None, max_length=5000)


class VideoUpdateRequest(BaseModel):
    """Request model for updating video metadata."""
    video_id: str = Field(..., min_length=11, max_length=11, pattern=r'^[a-zA-Z0-9_-]+$')
    title: Optional[str] = Field(default=None, min_length=1, max_length=100, description="Video title (max 100 chars)")
    description: Optional[str] = Field(default=None, max_length=5000, description="Video description (max 5000 chars)")
    tags: Optional[List[str]] = Field(default=None, max_length=30, description="Tags list (max 30 tags)")

    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v):
        if v is not None:
            # Total tags string limit is 500 chars
            total_length = sum(len(tag) for tag in v)
            if total_length > 500:
                raise ValueError('Total tags length exceeds 500 characters')
            # Individual tag max 30 chars
            for tag in v:
                if len(tag) > 30:
                    raise ValueError(f'Tag "{tag[:20]}..." exceeds 30 characters')
        return v


class DescriptionGenerateRequest(BaseModel):
    """Request model for 4-zone description generation."""
    video_id: str = Field(..., min_length=11, max_length=11, pattern=r'^[a-zA-Z0-9_-]+$')
    social_links: Optional[Dict[str, str]] = Field(default=None, description="Social links (instagram, twitter, tiktok, website)")


@router.get("/analyze/{video_id}")
@limiter.limit("20/minute")
async def analyze_video_seo(
    request: Request,
    video_id: str,
    user: User = Depends(get_current_user),
    channel_profile: dict = Depends(get_channel_profile)
):
    """
    Analyze a video's SEO and get AI-powered recommendations.

    Returns:
    - Current SEO data (title, description, tags analysis)
    - SEO score (0-100)
    - Priority improvements
    - Suggested optimized title
    - Suggested tags
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        analytics = get_authenticated_service("youtubeAnalytics", "v2")

        agent = SEOAgent(youtube, analytics, user_id=user.id, channel_profile=channel_profile)
        result = await agent.analyze_video_seo(video_id)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/audit")
@limiter.limit("5/minute")
async def audit_channel_seo(
    request: Request,
    limit: int = 10,
    user: User = Depends(check_usage("ai_queries_per_month")),
    channel_profile: dict = Depends(get_channel_profile)
):
    """
    Audit the channel's recent videos for SEO issues.

    Returns:
    - Channel SEO summary (avg score, common issues)
    - List of videos with SEO scores
    - AI-generated action items
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        analytics = get_authenticated_service("youtubeAnalytics", "v2")

        agent = SEOAgent(youtube, analytics, user_id=user.id, channel_profile=channel_profile)
        result = await agent.audit_channel_seo(limit=limit)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/research")
@limiter.limit("10/minute")
async def research_keywords(
    request: Request,
    keyword_request: KeywordResearchRequest,
    user: User = Depends(check_usage("ai_queries_per_month")),
    channel_profile: dict = Depends(get_channel_profile)
):
    """
    Research keywords by analyzing competitor videos.

    Returns:
    - Top performing competitor videos
    - Popular tags from competitors
    - AI analysis with keyword suggestions
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")

        agent = SEOAgent(youtube, user_id=user.id, channel_profile=channel_profile)
        result = await agent.research_keywords(keyword_request.topic, limit=keyword_request.limit)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate")
@limiter.limit("10/minute")
async def generate_metadata(
    request: Request,
    metadata_request: MetadataGenerationRequest,
    user: User = Depends(check_usage("ai_queries_per_month")),
    channel_profile: dict = Depends(get_channel_profile)
):
    """
    Generate optimized title, description, and tags for a video topic.

    Returns:
    - 3 optimized title options
    - Full SEO-optimized description
    - 15 recommended tags
    - Hashtag suggestions
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")

        agent = SEOAgent(youtube, user_id=user.id, channel_profile=channel_profile)
        result = await agent.generate_optimized_metadata(
            video_topic=metadata_request.topic,
            current_title=metadata_request.current_title,
            current_description=metadata_request.current_description
        )
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/videos")
async def get_videos_for_optimization(
    limit: int = 20,
    user: User = Depends(get_current_user)
):
    """
    Get recent videos with their SEO scores for optimization.
    
    Returns list of videos sorted by SEO score (lowest first = needs most work).
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        
        tools = YouTubeTools(youtube)
        videos = tools.get_videos_for_seo_audit(limit=limit)
        
        return {
            "videos": videos,
            "total": len(videos)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/update")
async def update_video_metadata(
    request: VideoUpdateRequest,
    user: User = Depends(get_current_user)
):
    """
    Update a video's metadata (title, description, tags).
    
    This actually updates the video on YouTube!
    Only updates the fields that are provided.
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        
        tools = YouTubeTools(youtube)
        result = tools.update_video_metadata(
            video_id=request.video_id,
            title=request.title,
            description=request.description,
            tags=request.tags
        )
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        error_msg = str(e)
        if "forbidden" in error_msg.lower():
            raise HTTPException(
                status_code=403, 
                detail="You don't have permission to edit this video. Make sure you're the video owner."
            )
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/video/{video_id}")
async def get_video_for_editing(
    video_id: str,
    user: User = Depends(get_current_user)
):
    """
    Get a video's current metadata for editing.
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")
        
        tools = YouTubeTools(youtube)
        result = tools.get_video_for_editing(video_id)
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-description")
@limiter.limit("10/minute")
async def generate_optimized_description(
    request: Request,
    desc_request: DescriptionGenerateRequest,
    user: User = Depends(check_usage("ai_queries_per_month"))
):
    """
    Generate a 4-zone optimized description based on video transcript.

    Uses the SOP architecture:
    - Zone 1: Hook (first 200 chars - above the fold)
    - Zone 2: Context (SEO keywords)
    - Zone 3: Navigation (timestamps/chapters)
    - Zone 4: Funnel (social links, CTAs)

    Returns the full description plus each zone separately.
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")

        # Get video details
        tools = YouTubeTools(youtube)
        video = tools.get_video_for_editing(desc_request.video_id)
        
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        
        # Get transcript with Whisper fallback if YouTube captions unavailable
        transcript_analyzer = TranscriptAnalyzer(youtube)
        transcript_data = await transcript_analyzer.get_transcript_with_fallback(
            desc_request.video_id,
            use_whisper_fallback=True  # Enable Whisper fallback
        )
        
        # Check for transcript - can be in 'text' or 'full_text' field
        transcript_text = None
        transcript_source = None
        if transcript_data:
            transcript_text = transcript_data.get("text") or transcript_data.get("full_text")
            transcript_source = transcript_data.get("source", "unknown")
        
        if not transcript_text:
            # No transcript available even with Whisper - use AI to generate from title only
            generator = DescriptionGenerator()
            result = await generator.generate_from_title_only(
                title=video["title"],
                social_links=desc_request.social_links,
                original_description=video.get("description", "")
            )
            result["transcript_available"] = False
            result["transcript_source"] = None
            return result
        
        # Generate 4-zone description (pass original description to extract existing links)
        generator = DescriptionGenerator()
        result = await generator.generate_description(
            title=video["title"],
            transcript=transcript_text,
            social_links=desc_request.social_links,
            original_description=video.get("description", "")
        )
        
        # Add transcript metadata (include transcript for frontend caching)
        result["transcript_available"] = True
        result["transcript_source"] = transcript_source  # 'youtube_captions' or 'whisper'
        result["transcript_text"] = transcript_text  # For frontend to cache
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analyze-thumbnail/{video_id}")
@limiter.limit("20/minute")
async def analyze_video_thumbnail(
    request: Request,
    video_id: str,
    user: User = Depends(get_current_user)
):
    """
    Analyze a video's thumbnail for CTR optimization using GPT-4o Vision.

    Returns:
    - Overall CTR score (0-100)
    - Text readability analysis
    - Face detection and emotion
    - Color contrast score
    - Composition analysis
    - Actionable improvement suggestions
    """
    try:
        youtube = get_authenticated_service("youtube", "v3")

        # Get video thumbnail URL
        tools = YouTubeTools(youtube)
        video = tools.get_video_for_editing(video_id)

        if not video:
            raise HTTPException(status_code=404, detail="Video not found")

        thumbnail_url = video.get("thumbnail_url")
        if not thumbnail_url:
            raise HTTPException(status_code=400, detail="Video has no thumbnail")

        # Analyze thumbnail using OpenAI Vision
        result = await analyze_thumbnail(thumbnail_url)

        return {
            "success": True,
            "video_id": video_id,
            "thumbnail_url": thumbnail_url,
            "analysis": result.model_dump()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _build_zone4(social_links: Optional[Dict[str, str]] = None) -> str:
    """Build Zone 4 - The static funnel section."""
    lines = []
    
    if social_links:
        links = []
        if social_links.get("instagram"):
            links.append(f"📸 Instagram: {social_links['instagram']}")
        if social_links.get("twitter"):
            links.append(f"🐦 Twitter/X: {social_links['twitter']}")
        if social_links.get("tiktok"):
            links.append(f"🎵 TikTok: {social_links['tiktok']}")
        if social_links.get("website"):
            links.append(f"🌐 Web: {social_links['website']}")
        
        if links:
            lines.append("🔗 SÍGUENOS:")
            lines.extend(links)
            lines.append("")
    
    lines.append("👍 Dale LIKE si te gustó el contenido")
    lines.append("🔔 SUSCRÍBETE y activa la campanita")
    lines.append("💬 Comenta tu opinión abajo")
    
    return "\n".join(lines)


def _build_fallback_desc(title: str, social_links: Optional[Dict[str, str]] = None) -> str:
    """Build fallback description when transcript unavailable."""
    parts = [
        f"🔥 {title}",
        "",
        "📺 No te pierdas este contenido exclusivo de MoluscoTV.",
        "",
        _build_zone4(social_links),
        "",
        "#MoluscoTV #Podcast #Entretenimiento"
    ]
    return "\n".join(parts)

