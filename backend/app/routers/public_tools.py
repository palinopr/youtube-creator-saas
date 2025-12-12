"""
Public (no‑auth) lite tools for marketing pages.

These endpoints are intentionally limited and rate‑limited.
They only use public YouTube data and return small previews
that funnel to the waitlist.
"""

from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field, model_validator
from slowapi import Limiter
from slowapi.util import get_remote_address
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import NoTranscriptFound, TranscriptsDisabled
import yt_dlp

from ..config import get_settings


router = APIRouter(prefix="/public", tags=["public-tools"])
limiter = Limiter(key_func=get_remote_address)
settings = get_settings()


VIDEO_ID_RE = re.compile(r"(?:v=|/shorts/|youtu\.be/|/embed/)([A-Za-z0-9_-]{11})")


def extract_video_id(url_or_id: str) -> str:
    value = url_or_id.strip()
    if re.fullmatch(r"[A-Za-z0-9_-]{11}", value):
        return value
    match = VIDEO_ID_RE.search(value)
    if match:
        return match.group(1)
    raise HTTPException(status_code=400, detail="Invalid YouTube URL or video ID.")


def fetch_video_metadata(video_id: str) -> Dict[str, Any]:
    url = f"https://www.youtube.com/watch?v={video_id}"
    ydl_opts = {
        "quiet": True,
        "skip_download": True,
        "nocheckcertificate": True,
        "extract_flat": False,
        "noplaylist": True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not fetch video data: {e}")

    return {
        "video_id": video_id,
        "url": url,
        "title": info.get("title") or "",
        "description": info.get("description") or "",
        "tags": info.get("tags") or [],
        "channel": info.get("channel") or info.get("uploader") or "",
        "channel_id": info.get("channel_id") or "",
        "view_count": int(info.get("view_count") or 0),
        "like_count": int(info.get("like_count") or 0),
        "comment_count": int(info.get("comment_count") or 0),
        "duration_seconds": int(info.get("duration") or 0),
        "upload_date": info.get("upload_date") or "",
        "thumbnail": info.get("thumbnail") or "",
        "categories": info.get("categories") or [],
    }


def fetch_transcript(video_id: str) -> Optional[Dict[str, Any]]:
    try:
        segments = YouTubeTranscriptApi.get_transcript(video_id, languages=["en", "es"])
    except (NoTranscriptFound, TranscriptsDisabled):
        return None
    except Exception:
        return None

    full_text = " ".join(s.get("text", "") for s in segments).strip()
    if not full_text:
        return None
    return {
        "segments": segments,
        "full_text": full_text,
        "word_count": len(full_text.split()),
    }


def score_video_seo(meta: Dict[str, Any], transcript: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    title = (meta.get("title") or "").strip()
    description = (meta.get("description") or "").strip()
    tags: List[str] = meta.get("tags") or []

    score = 100
    issues: List[Dict[str, Any]] = []

    # Title checks
    if not title:
        score -= 40
        issues.append({"issue": "Missing title", "severity": "high"})
    else:
        if len(title) > 70:
            score -= 10
            issues.append({"issue": "Title too long (>70 chars)", "severity": "medium"})
        if len(title) < 30:
            score -= 8
            issues.append({"issue": "Title too short (<30 chars)", "severity": "medium"})

    # Description checks
    desc_words = len(description.split())
    if desc_words < 200:
        score -= 15
        issues.append({"issue": "Low description word count (<200)", "severity": "medium"})
    if not description:
        score -= 10
        issues.append({"issue": "Missing description", "severity": "high"})

    # Tag checks
    if len(tags) < 8:
        score -= 8
        issues.append({"issue": "Too few tags (<8)", "severity": "low"})
    if len(tags) > 25:
        score -= 4
        issues.append({"issue": "Too many tags (>25)", "severity": "low"})

    # Transcript alignment (simple keyword overlap)
    if transcript and transcript.get("full_text"):
        transcript_text = transcript["full_text"].lower()
        title_keywords = [
            w for w in re.findall(r"[a-zA-Z0-9']+", title.lower())
            if len(w) >= 4
        ][:6]
        overlap = sum(1 for w in title_keywords if w in transcript_text)
        if title_keywords and overlap < max(1, len(title_keywords) // 3):
            score -= 6
            issues.append({"issue": "Weak title ↔ transcript keyword alignment", "severity": "low"})
    else:
        score -= 4
        issues.append({"issue": "No transcript found (limits SEO analysis)", "severity": "low"})

    score = max(0, min(100, score))
    return {"score": score, "issues": issues}


def maybe_generate_suggestions(meta: Dict[str, Any], transcript: Optional[Dict[str, Any]], mode: str) -> Optional[Dict[str, Any]]:
    if not settings.openai_api_key:
        return None

    try:
        from openai import OpenAI

        client = OpenAI(api_key=settings.openai_api_key)
        transcript_excerpt = ""
        if transcript and transcript.get("full_text"):
            transcript_excerpt = transcript["full_text"][:2000]

        system = "You are a YouTube SEO expert. Return valid JSON only."
        if mode == "clips":
            user = f"""
You are helping a creator find viral Shorts moments from a transcript.
Return JSON with key `clips` which is an array of 3-5 objects:
{{"start_seconds": number, "end_seconds": number, "hook_title": string, "reason": string, "viral_score": number}}

Transcript (timestamped excerpts, may be truncated):
{transcript_excerpt}
"""
        else:
            user = f"""
Given this YouTube video metadata (and transcript excerpt if available), generate a LITE SEO preview.
Return JSON with keys:
- titles: 3 improved title options (<=70 chars each)
- description: 1 optimized description (<=250 words)
- tags: up to 12 tags (<=30 chars each)
- hashtags: up to 5 hashtags
- top_fixes: 3-5 prioritized fixes

Metadata:
Title: {meta.get("title","")}
Description: {meta.get("description","")[:1500]}
Tags: {meta.get("tags", [])}

Transcript excerpt:
{transcript_excerpt}
"""

        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.4,
            max_tokens=700,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        )
        content = resp.choices[0].message.content or "{}"
        return json.loads(content)
    except Exception:
        return None


class PublicVideoRequest(BaseModel):
    url: str = Field(..., min_length=1, max_length=500, description="YouTube video URL or ID")


class PublicMetadataRequest(BaseModel):
    topic: Optional[str] = Field(default=None, min_length=1, max_length=200)
    url: Optional[str] = Field(default=None, max_length=500)
    current_title: Optional[str] = Field(default=None, max_length=100)
    current_description: Optional[str] = Field(default=None, max_length=5000)

    @model_validator(mode="after")
    def validate_one_source(self):
        if not self.topic and not self.url:
            raise ValueError("Provide either a topic or a YouTube URL.")
        return self


class PublicChannelRequest(BaseModel):
    url_or_handle: str = Field(..., min_length=1, max_length=200, description="YouTube channel URL or @handle")


@router.post("/seo-score")
@limiter.limit("10/minute")
async def public_seo_score(request: Request, body: PublicVideoRequest):
    video_id = extract_video_id(body.url)
    meta = fetch_video_metadata(video_id)
    transcript = fetch_transcript(video_id)
    scoring = score_video_seo(meta, transcript)
    suggestions = maybe_generate_suggestions(meta, transcript, mode="seo")

    return {
        "mode": "lite",
        "video": meta,
        "transcript_found": bool(transcript),
        "seo_score": scoring["score"],
        "issues": scoring["issues"],
        "suggestions": suggestions,
    }


@router.post("/metadata-generator")
@limiter.limit("10/minute")
async def public_metadata_generator(request: Request, body: PublicMetadataRequest):
    meta: Dict[str, Any] = {}
    transcript: Optional[Dict[str, Any]] = None

    if body.url:
        video_id = extract_video_id(body.url)
        meta = fetch_video_metadata(video_id)
        transcript = fetch_transcript(video_id)
        topic = body.topic or meta.get("title") or ""
    else:
        topic = body.topic or ""

    base_meta = {
        "title": body.current_title or meta.get("title") or topic,
        "description": body.current_description or meta.get("description") or "",
        "tags": meta.get("tags") or [],
    }
    suggestions = maybe_generate_suggestions(base_meta, transcript, mode="seo")

    if not suggestions:
        raise HTTPException(status_code=500, detail="Metadata generation unavailable.")

    return {
        "mode": "lite",
        "topic": topic,
        "based_on_video": bool(body.url),
        "suggestions": suggestions,
    }


@router.post("/shorts-clip-finder")
@limiter.limit("6/minute")
async def public_shorts_clip_finder(request: Request, body: PublicVideoRequest):
    video_id = extract_video_id(body.url)
    transcript = fetch_transcript(video_id)
    if not transcript:
        raise HTTPException(status_code=404, detail="No transcript found for this video.")

    # Create a timestamped excerpt for the LLM.
    excerpt_lines: List[str] = []
    for seg in transcript["segments"][:120]:
        start = int(seg.get("start", 0))
        mm, ss = divmod(start, 60)
        excerpt_lines.append(f"{mm:02d}:{ss:02d} {seg.get('text','')}")
    excerpt = "\n".join(excerpt_lines)
    transcript_excerpt = {"full_text": excerpt}
    suggestions = maybe_generate_suggestions({"title": "", "description": "", "tags": []}, transcript_excerpt, mode="clips")

    clips = (suggestions or {}).get("clips") or []
    normalized = []
    for c in clips[:5]:
        try:
            start_s = int(c.get("start_seconds", 0))
            end_s = int(c.get("end_seconds", start_s + 30))
        except Exception:
            continue
        sm, ss = divmod(start_s, 60)
        em, es = divmod(end_s, 60)
        normalized.append(
            {
                "start_seconds": start_s,
                "end_seconds": end_s,
                "start": f"{sm:02d}:{ss:02d}",
                "end": f"{em:02d}:{es:02d}",
                "hook_title": c.get("hook_title", ""),
                "reason": c.get("reason", ""),
                "viral_score": c.get("viral_score", 0),
            }
        )

    return {
        "mode": "lite",
        "video_id": video_id,
        "clips": normalized,
    }


@router.post("/channel-snapshot")
@limiter.limit("6/minute")
async def public_channel_snapshot(request: Request, body: PublicChannelRequest):
    raw = body.url_or_handle.strip()
    if raw.startswith("@"):
        url = f"https://www.youtube.com/{raw}"
    elif raw.startswith("http"):
        url = raw
    else:
        url = f"https://www.youtube.com/@{raw}"

    ydl_opts = {
        "quiet": True,
        "skip_download": True,
        "extract_flat": "in_playlist",
        "nocheckcertificate": True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not fetch channel data: {e}")

    entries = info.get("entries") or []
    recent_videos = []
    for e in entries[:5]:
        recent_videos.append(
            {
                "video_id": e.get("id") or "",
                "title": e.get("title") or "",
                "url": e.get("url") or e.get("webpage_url") or "",
                "view_count": int(e.get("view_count") or 0),
                "upload_date": e.get("upload_date") or "",
            }
        )

    base_meta = {
        "title": info.get("channel") or info.get("uploader") or "",
        "description": info.get("description") or "",
        "tags": [],
    }
    insights = None
    if settings.openai_api_key:
        insights = maybe_generate_suggestions(base_meta, None, mode="seo")
        if insights:
            insights = insights.get("top_fixes") or insights.get("insights")

    return {
        "mode": "lite",
        "channel": {
            "title": info.get("channel") or info.get("uploader") or "",
            "description": info.get("description") or "",
            "channel_id": info.get("channel_id") or "",
            "subscriber_count": int(info.get("channel_follower_count") or 0),
            "video_count": int(info.get("channel_video_count") or 0),
            "url": url,
            "thumbnail": info.get("thumbnail") or "",
        },
        "recent_videos": recent_videos,
        "insights": insights,
    }
