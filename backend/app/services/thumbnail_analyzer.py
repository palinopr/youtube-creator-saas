"""
Thumbnail Analysis Service using OpenAI Vision API (GPT-4o)

Analyzes YouTube thumbnails for CTR optimization:
- Text readability
- Face detection & emotion
- Color contrast
- Composition (rule of thirds, focal point)
"""

import logging
import hashlib
import json
from typing import Optional
from openai import AsyncOpenAI
from pydantic import BaseModel

from ..config import get_settings

logger = logging.getLogger(__name__)


class ThumbnailMetric(BaseModel):
    """Individual metric result"""
    score: int  # 0-100
    feedback: str
    details: Optional[dict] = None


class ThumbnailAnalysisResult(BaseModel):
    """Complete thumbnail analysis result"""
    overall_score: int  # 0-100
    text_readability: ThumbnailMetric
    face_detection: ThumbnailMetric
    color_contrast: ThumbnailMetric
    composition: ThumbnailMetric
    suggestions: list[str]
    summary: str


# Cache for thumbnail analysis results
_analysis_cache: dict[str, ThumbnailAnalysisResult] = {}


def _get_cache_key(thumbnail_url: str) -> str:
    """Generate cache key from thumbnail URL"""
    return hashlib.sha256(thumbnail_url.encode()).hexdigest()[:16]


async def analyze_thumbnail(thumbnail_url: str, use_cache: bool = True) -> ThumbnailAnalysisResult:
    """
    Analyze a YouTube thumbnail using GPT-4o Vision API.

    Args:
        thumbnail_url: URL of the YouTube thumbnail
        use_cache: Whether to use cached results

    Returns:
        ThumbnailAnalysisResult with scores and suggestions
    """
    settings = get_settings()

    # Check cache
    cache_key = _get_cache_key(thumbnail_url)
    if use_cache and cache_key in _analysis_cache:
        logger.info(f"Returning cached thumbnail analysis for {cache_key}")
        return _analysis_cache[cache_key]

    client = AsyncOpenAI(api_key=settings.openai_api_key)

    prompt = """Analyze this YouTube thumbnail for click-through rate (CTR) optimization.

Evaluate these 4 metrics (score each 0-100):

1. **Text Readability** (if text exists):
   - Is text large enough to read at thumbnail size (small)?
   - Does text have good contrast against background?
   - Is text concise (3-5 words max)?

2. **Face Detection**:
   - Are there faces visible?
   - Are faces showing strong emotion (surprise, excitement, shock)?
   - Is at least one face in the "power zone" (left third or center)?

3. **Color Contrast**:
   - Are colors bright and attention-grabbing?
   - Is there good contrast between elements?
   - Does it stand out against YouTube's white/dark backgrounds?

4. **Composition**:
   - Is there a clear focal point?
   - Does it follow rule of thirds?
   - Is the layout clean (not cluttered)?

Return your analysis as JSON in this exact format:
```json
{
  "overall_score": 75,
  "text_readability": {
    "score": 80,
    "feedback": "Text is readable but could be larger",
    "details": {"has_text": true, "text_visible": true}
  },
  "face_detection": {
    "score": 90,
    "feedback": "Face visible with surprised expression - great for CTR",
    "details": {"faces_detected": 1, "emotion": "surprised"}
  },
  "color_contrast": {
    "score": 70,
    "feedback": "Colors are somewhat muted, could be brighter",
    "details": {"dominant_colors": ["blue", "gray", "white"]}
  },
  "composition": {
    "score": 85,
    "feedback": "Clear focal point, good use of thirds",
    "details": {"has_focal_point": true, "follows_thirds": true}
  },
  "suggestions": [
    "Increase text size by 20% for better mobile visibility",
    "Add a brighter color accent to draw attention",
    "Consider adding an emoji or icon near the text"
  ],
  "summary": "Good thumbnail with strong face emotion. Main improvements: brighter colors and larger text."
}
```

Be specific and actionable in your suggestions. Focus on what will increase clicks."""

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": thumbnail_url,
                                "detail": "high"
                            }
                        }
                    ]
                }
            ],
            max_tokens=1000,
            temperature=0
        )

        # Extract JSON from response
        content = response.choices[0].message.content or ""

        # Parse JSON from response (handle markdown code blocks)
        json_str = content
        if "```json" in content:
            json_str = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            json_str = content.split("```")[1].split("```")[0].strip()

        data = json.loads(json_str)

        result = ThumbnailAnalysisResult(
            overall_score=data.get("overall_score", 50),
            text_readability=ThumbnailMetric(**data.get("text_readability", {
                "score": 50,
                "feedback": "Unable to analyze text"
            })),
            face_detection=ThumbnailMetric(**data.get("face_detection", {
                "score": 50,
                "feedback": "Unable to analyze faces"
            })),
            color_contrast=ThumbnailMetric(**data.get("color_contrast", {
                "score": 50,
                "feedback": "Unable to analyze colors"
            })),
            composition=ThumbnailMetric(**data.get("composition", {
                "score": 50,
                "feedback": "Unable to analyze composition"
            })),
            suggestions=data.get("suggestions", []),
            summary=data.get("summary", "Analysis completed")
        )

        # Cache result
        _analysis_cache[cache_key] = result
        logger.info(f"Thumbnail analyzed and cached: score={result.overall_score}")

        return result

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse thumbnail analysis JSON: {e}")
        raise ValueError(f"Failed to parse AI response: {e}")
    except Exception as e:
        logger.error(f"Thumbnail analysis failed: {e}")
        raise


def clear_cache():
    """Clear the thumbnail analysis cache"""
    global _analysis_cache
    _analysis_cache = {}
    logger.info("Thumbnail analysis cache cleared")
