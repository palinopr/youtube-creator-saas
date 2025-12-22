"""
Content optimization and transcript analysis endpoints.

Provides AI-powered optimization recommendations and transcript analytics.
"""

from fastapi import APIRouter, HTTPException, Request, Depends
from slowapi import Limiter
from slowapi.util import get_remote_address

from ...auth import get_authenticated_service
from ...auth.dependencies import get_current_user, check_usage
from ...db.models import User
from ...tools.content_optimizer import ContentOptimizer
from .base import GenerateTitleRequest, ScoreVideoRequest, ExtractMetaTagsRequest

router = APIRouter(tags=["analysis-insights"])
limiter = Limiter(key_func=get_remote_address)


# =============================================================================
# Content Optimizer Endpoints
# =============================================================================

@router.get("/optimize")
async def get_optimization_blueprint(user: User = Depends(get_current_user)):
    """
    Get complete optimization blueprint based on ALL channel data.

    Returns actionable recommendations:
    - Optimal video formula (title, celebrities, content type)
    - Celebrity strategy (who to feature, who to avoid)
    - Title rules (structure, power words, length)
    - Posting strategy (when, how often)
    - Content ideas (ready-to-use video concepts)
    - Things to avoid
    - Quick wins (immediate actions)
    """
    try:
        optimizer = ContentOptimizer({})
        blueprint = optimizer.get_optimization_blueprint()

        return {
            "optimization_blueprint": blueprint,
            "message": "Based on analysis of 5,000+ videos - use these specific recommendations!"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimize/generate-title")
@limiter.limit("10/minute")
async def generate_optimized_title(
    request: Request,
    title_request: GenerateTitleRequest,
    user: User = Depends(check_usage("ai_queries_per_month"))
):
    """
    Generate AI-optimized title for a video topic.

    Uses all our data insights to create the perfect title:
    - 70-90 character length
    - Power words that work for YOUR channel
    - Celebrity name placement
    - Emoji optimization
    - Controversial angle

    Args:
        topic: What the video is about
        celebrities: List of celebrities to mention

    Returns:
        5 optimized title options ranked best to good
    """
    try:
        optimizer = ContentOptimizer({})
        result = await optimizer.generate_optimized_title(
            topic=title_request.topic,
            celebrities=title_request.celebrities,
            transcript=title_request.transcript
        )
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimize/extract-meta-tags")
@limiter.limit("10/minute")
async def extract_meta_tags(
    request: Request,
    meta_request: ExtractMetaTagsRequest,
    user: User = Depends(check_usage("ai_queries_per_month"))
):
    """
    Extract 15-20 meta tags from transcript to maximize SEO.

    Uses the transcript to find:
    - Tier 1: Names of people mentioned (celebrities, guests)
    - Tier 2: Topics, places, brands discussed
    - Tier 3: Category tags (podcast, entrevista, etc.)
    - Tier 4: Common misspellings for discoverability

    Returns:
        List of tags optimized to fill the 500-char YouTube tag limit
    """
    try:
        optimizer = ContentOptimizer({})
        result = await optimizer.extract_meta_tags(
            transcript=meta_request.transcript,
            current_title=meta_request.title
        )
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimize/score")
@limiter.limit("10/minute")
async def score_video_before_publish(
    request: Request,
    score_request: ScoreVideoRequest,
    user: User = Depends(check_usage("ai_queries_per_month"))
):
    """
    Score a video idea BEFORE you publish to predict success.

    Checks:
    - Title length (70-90 chars = optimal)
    - Emoji presence (+13.8% views)
    - Celebrity count (2-3 = 2.5x-3.7x more views)
    - Controversial angle (+40% views)
    - Description optimization
    - Known issues (timestamps hurt!)

    Args:
        title: Your proposed title
        description: Your proposed description
        celebrities: Celebrities mentioned

    Returns:
        Score out of 100, prediction, and specific fixes
    """
    try:
        optimizer = ContentOptimizer({})
        result = await optimizer.score_video_idea(
            title=score_request.title,
            description=score_request.description,
            celebrities=score_request.celebrities
        )
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/optimize/next-video")
async def get_next_video_recommendation(user: User = Depends(get_current_user)):
    """
    Get THE specific video you should make next.

    Returns:
    - Exactly what to create based on current data
    - Celebrity selection
    - Title template
    - Expected performance
    """
    try:
        optimizer = ContentOptimizer({})
        blueprint = optimizer.get_optimization_blueprint()

        # Get the highest priority content idea
        content_ideas = blueprint.get("content_ideas", [])
        high_priority = [idea for idea in content_ideas if "HIGH" in idea.get("priority", "")]

        if high_priority:
            next_video = high_priority[0]
        elif content_ideas:
            next_video = content_ideas[0]
        else:
            next_video = {
                "title": "Feature a rising celebrity with controversy angle",
                "why": "Based on data patterns",
                "predicted_views": "Variable",
                "celebrities": ["Pitbull", "Don Omar", "6ix9ine"],
                "priority": "Try rising celebrities!"
            }

        return {
            "next_video_recommendation": next_video,
            "why_this_video": "Based on analysis of 5,000+ videos, this has the highest predicted success",
            "celebrity_strategy": blueprint.get("celebrity_strategy", {}).get("feature_now", {}),
            "quick_checklist": [
                "✅ Title 70-90 chars",
                "✅ Add emoji 🔥 💀 😱",
                "✅ Feature 2-3 celebrities",
                "✅ Controversial angle",
                "✅ Medium description (200-500 chars)",
                "✅ Add 3+ hashtags",
                "❌ NO timestamps in description",
            ]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/optimize/quick-wins")
async def get_quick_wins(user: User = Depends(get_current_user)):
    """
    Get immediate actions that will boost your channel.

    These are low-effort, high-impact changes you can make TODAY.
    """
    try:
        optimizer = ContentOptimizer({})
        blueprint = optimizer.get_optimization_blueprint()

        return {
            "quick_wins": blueprint.get("quick_wins", []),
            "avoid_list": blueprint.get("avoid_list", {}),
            "message": "Do these TODAY for immediate improvement!"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# Transcript Analysis Endpoints
# =============================================================================

@router.get("/transcripts/patterns")
@limiter.limit("3/minute")
async def analyze_transcript_patterns(
    request: Request,
    max_videos: int = 50,
    user: User = Depends(check_usage("ai_queries_per_month"))
):
    """
    Analyze video transcripts to find what CONTENT drives views.

    This goes beyond titles/metadata to understand:
    - What topics are DISCUSSED in top videos
    - Which celebrities are mentioned IN the content
    - Content depth and structure patterns
    - What conversations resonate with viewers

    Args:
        max_videos: Number of top videos to analyze (default 50)

    Returns:
        Content patterns from transcript analysis
    """
    try:
        from ...tools.transcript_analyzer import TranscriptAnalyzer

        youtube = get_authenticated_service("youtube", "v3")
        analyzer = TranscriptAnalyzer(youtube)

        result = await analyzer.analyze_top_videos_transcripts(max_videos=max_videos)

        return result

    except ImportError as e:
        raise HTTPException(
            status_code=500,
            detail=f"youtube-transcript-api not installed. Run: pip install youtube-transcript-api. Error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/transcripts/video/{video_id}")
@limiter.limit("10/minute")
async def analyze_single_video_transcript(
    request: Request,
    video_id: str,
    user: User = Depends(check_usage("ai_queries_per_month"))
):
    """
    Deep AI analysis of a single video's transcript.

    Uses GPT-4 to analyze:
    - Main topics discussed
    - Celebrities mentioned and context
    - Emotional hooks
    - Controversy level
    - Engagement triggers
    - Content structure
    - Key quotes
    - Improvement suggestions

    Args:
        video_id: YouTube video ID to analyze

    Returns:
        Detailed AI analysis of the video content
    """
    try:
        from ...tools.transcript_analyzer import TranscriptAnalyzer

        youtube = get_authenticated_service("youtube", "v3")
        analyzer = TranscriptAnalyzer(youtube)

        result = await analyzer.deep_analyze_video_transcript(video_id)

        return result

    except ImportError as e:
        raise HTTPException(
            status_code=500,
            detail=f"youtube-transcript-api not installed. Run: pip install youtube-transcript-api"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/transcripts/compare")
@limiter.limit("3/minute")
async def compare_top_vs_bottom_transcripts(
    request: Request,
    max_videos: int = 100,
    user: User = Depends(check_usage("ai_queries_per_month"))
):
    """
    Compare transcripts of TOP performing videos vs BOTTOM performing videos.

    Identifies:
    - What celebrities appear MORE in successful videos
    - What topics drive views when DISCUSSED (not just in title)
    - Content depth differences
    - Patterns unique to successful videos

    Args:
        max_videos: Total videos to analyze (top half vs bottom half)

    Returns:
        Comparison insights showing what content actually works
    """
    try:
        from ...tools.transcript_analyzer import TranscriptAnalyzer

        youtube = get_authenticated_service("youtube", "v3")
        analyzer = TranscriptAnalyzer(youtube)

        result = await analyzer.find_content_patterns(max_videos=max_videos)

        return result

    except ImportError as e:
        raise HTTPException(
            status_code=500,
            detail=f"youtube-transcript-api not installed. Run: pip install youtube-transcript-api"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/transcripts/get/{video_id}")
async def get_video_transcript(video_id: str, user: User = Depends(get_current_user)):
    """
    Get the raw transcript of a video.

    Args:
        video_id: YouTube video ID

    Returns:
        The transcript text and metadata
    """
    try:
        from ...tools.transcript_analyzer import TranscriptAnalyzer

        youtube = get_authenticated_service("youtube", "v3")
        analyzer = TranscriptAnalyzer(youtube)

        transcript = await analyzer.get_transcript(video_id)

        # Return even partial results (like available transcripts list)
        if transcript:
            return transcript

        return {
            "video_id": video_id,
            "status": "not_available",
            "message": "No transcripts found for this video"
        }

    except ImportError as e:
        raise HTTPException(
            status_code=500,
            detail=f"youtube-transcript-api not installed. Run: pip install youtube-transcript-api"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
