"""
Public (no‑auth) lite tools for marketing pages.

These endpoints are intentionally limited and rate‑limited.
They only use public YouTube data and return small previews
that funnel to the waitlist.
"""

from __future__ import annotations

import json
import re
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field, model_validator
from slowapi import Limiter
from slowapi.util import get_remote_address
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import NoTranscriptFound, TranscriptsDisabled
import yt_dlp

from ..config import get_settings
from ..db.models import MarketingLead, MarketingAgentAsk, get_db_session


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


class PublicLeadRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    name: Optional[str] = Field(default=None, max_length=200)
    source: str = Field(default="landing_agent", max_length=100)


class PublicAskRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    lead_id: Optional[str] = Field(default=None, max_length=36)
    question: str = Field(..., min_length=1, max_length=1200)
    page_url: Optional[str] = Field(default=None, max_length=500)


def _normalize_email(email: str) -> str:
    return (email or "").strip().lower()


def _load_kb_chunks() -> List[Dict[str, str]]:
    """
    Load the TubeGrow KB and split into coarse chunks.
    Lightweight retrieval (no vector DB).
    """
    kb_path = Path(__file__).resolve().parents[1] / "data" / "tubegrow_kb.md"
    try:
        text = kb_path.read_text(encoding="utf-8")
    except Exception:
        return []

    # Split on H2 headings so each chunk is coherent.
    parts = re.split(r"(?m)^## ", text)
    chunks: List[Dict[str, str]] = []

    # First part contains the title/intro.
    if parts and parts[0].strip():
        chunks.append({"title": "Intro", "text": parts[0].strip()[:2000]})

    for part in parts[1:]:
        lines = part.splitlines()
        heading = (lines[0] or "").strip()
        body = "\n".join(lines[1:]).strip()
        if not body:
            continue
        chunks.append({"title": heading[:80], "text": body[:2400]})

    return chunks


def _simple_retrieve(chunks: List[Dict[str, str]], query: str, k: int = 4) -> List[Dict[str, str]]:
    query = (query or "").lower()
    tokens = [t for t in re.findall(r"[a-z0-9]{3,}", query) if t not in {"the", "and", "for", "with", "what", "how", "does", "tube", "grow"}]
    if not tokens:
        return chunks[:k]

    scored: List[tuple[int, Dict[str, str]]] = []
    for c in chunks:
        hay = (c.get("title", "") + "\n" + c.get("text", "")).lower()
        score = sum(1 for t in tokens if t in hay)
        scored.append((score, c))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [c for s, c in scored[:k] if s > 0] or chunks[:k]


def _normalize_public_url(url: str) -> str:
    u = (url or "").strip()
    if not u:
        return ""
    # Normalize canonical host.
    u = u.replace("https://tubegrow.io", "https://www.tubegrow.io")
    u = u.replace("http://tubegrow.io", "https://www.tubegrow.io")
    return u


PUBLIC_SUGGESTED_URL_ALLOWLIST = {
    "https://www.tubegrow.io/",
    "https://www.tubegrow.io/#waitlist",
    "https://www.tubegrow.io/about",
    "https://www.tubegrow.io/features",
    "https://www.tubegrow.io/blog",
    "https://www.tubegrow.io/tools",
    "https://www.tubegrow.io/youtube-analytics-tool",
    "https://www.tubegrow.io/youtube-seo-tool",
    "https://www.tubegrow.io/viral-clips-generator",
    "https://www.tubegrow.io/ai-youtube-tools",
    "https://www.tubegrow.io/alternatives",
    "https://www.tubegrow.io/privacy",
    "https://www.tubegrow.io/terms",
}


def _sanitize_public_copy(text: str) -> str:
    """
    Extra safety layer: remove phrasing that should never appear in public agent outputs.
    """
    t = (text or "").strip()
    if not t:
        return ""
    t = re.sub(r"\bYouTube creator\s+SaaS\b", "AI-powered YouTube growth platform", t, flags=re.IGNORECASE)
    t = re.sub(r"\bSaaS\b", "platform", t, flags=re.IGNORECASE)
    t = re.sub(r"\bLangGraph\b", "AI", t, flags=re.IGNORECASE)
    t = re.sub(r"\bOpenAI\b", "AI", t, flags=re.IGNORECASE)
    t = re.sub(r"\bGPT[- ]?[0-9a-zA-Z.]+\b", "AI", t, flags=re.IGNORECASE)
    t = re.sub(r"\bmodel\b", "AI system", t, flags=re.IGNORECASE)
    return t.strip()


def _normalize_agent_payload(payload: Any) -> Dict[str, Any]:
    """
    Ensure the public agent response matches the expected shape.
    This prevents frontend crashes when the model returns strings instead of arrays, etc.
    """
    if not isinstance(payload, dict):
        return {
            "title": "TubeGrow AI Agent",
            "answer": "I couldn't format an answer for that. Please try again.",
            "next_steps": [],
            "suggested_pages": [],
            "disclaimer": "Waitlist-only early access.",
        }

    title = payload.get("title") if isinstance(payload.get("title"), str) else "TubeGrow AI Agent"
    answer = payload.get("answer") if isinstance(payload.get("answer"), str) else ""
    disclaimer = payload.get("disclaimer") if isinstance(payload.get("disclaimer"), str) else ""

    next_steps_raw = payload.get("next_steps")
    if isinstance(next_steps_raw, list):
        next_steps = [_sanitize_public_copy(str(s)) for s in next_steps_raw if str(s).strip()]
    elif isinstance(next_steps_raw, str):
        next_steps = [_sanitize_public_copy(next_steps_raw)] if next_steps_raw.strip() else []
    else:
        next_steps = []

    suggested_pages_raw = payload.get("suggested_pages")
    suggested_pages: List[Dict[str, str]] = []
    if isinstance(suggested_pages_raw, list):
        for item in suggested_pages_raw:
            if not isinstance(item, dict):
                continue
            label = item.get("label")
            url = item.get("url")
            if not isinstance(label, str) or not isinstance(url, str):
                continue
            url = _normalize_public_url(url)
            if not url.startswith("https://www.tubegrow.io/"):
                continue
            if url.startswith("https://www.tubegrow.io/waitlist"):
                url = "https://www.tubegrow.io/#waitlist"
            if url not in PUBLIC_SUGGESTED_URL_ALLOWLIST:
                continue
            suggested_pages.append({"label": label.strip()[:80], "url": url})

    return {
        "title": _sanitize_public_copy(title)[:120] or "TubeGrow AI Agent",
        "answer": _sanitize_public_copy(answer),
        "next_steps": next_steps[:8],
        "suggested_pages": suggested_pages[:6],
        "disclaimer": (
            _sanitize_public_copy(disclaimer) or "Waitlist-only early access. Answers are guidance, not guarantees."
        )[:240],
    }


def _upsert_lead(email: str, name: Optional[str], source: str, request: Request) -> str:
    now = datetime.utcnow()
    ip = get_remote_address(request)
    ua = request.headers.get("user-agent", "")[:300] if request else ""
    email_norm = _normalize_email(email)

    with get_db_session() as session:
        lead = session.query(MarketingLead).filter(MarketingLead.email == email_norm).first()
        if lead:
            if name and not lead.name:
                lead.name = name.strip()[:200]
            lead.source = lead.source or (source or "landing_agent")
            lead.ip_last = ip
            lead.user_agent_last = ua
            lead.updated_at = now
            session.add(lead)
            session.flush()
            session.refresh(lead)
            return lead.id

        lead = MarketingLead(
            email=email_norm,
            name=(name.strip()[:200] if name else None),
            source=(source or "landing_agent")[:100],
            ip_last=ip,
            user_agent_last=ua,
            created_at=now,
            updated_at=now,
        )
        session.add(lead)
        session.flush()
        session.refresh(lead)
        return lead.id


@router.post("/lead")
@limiter.limit("10/minute")
async def create_public_lead(request: Request, body: PublicLeadRequest):
    """
    Capture a marketing lead (email required) for the public landing AI agent.
    """
    email = _normalize_email(body.email)
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        raise HTTPException(status_code=400, detail="Invalid email address.")

    lead_id = _upsert_lead(email=email, name=body.name, source=body.source, request=request)
    return {"ok": True, "lead_id": lead_id}


@router.post("/agent/ask")
@limiter.limit("6/minute")
async def public_agent_ask(request: Request, body: PublicAskRequest):
    """
    Public (no-auth) TubeGrow agent.

    Requires an email (lead capture). Scoped to TubeGrow + YouTube creator growth topics.
    """
    if not settings.openai_api_key:
        raise HTTPException(status_code=503, detail="AI is not configured.")

    email = _normalize_email(body.email)
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        raise HTTPException(status_code=400, detail="Invalid email address.")

    lead_id = _upsert_lead(email=email, name=None, source="landing_agent", request=request)

    # Per-email daily cap (extra protection beyond IP throttling).
    today = datetime.utcnow().date().isoformat()
    with get_db_session() as session:
        lead_db = session.query(MarketingLead).filter(MarketingLead.id == lead_id).first()
        if not lead_db:
            raise HTTPException(status_code=500, detail="Lead not found.")

        if lead_db.ask_day != today:
            lead_db.ask_day = today
            lead_db.ask_count_day = 0

        if (lead_db.ask_count_day or 0) >= 20:
            raise HTTPException(status_code=429, detail="Daily limit reached. Please try again tomorrow.")

        lead_db.ask_count_day = (lead_db.ask_count_day or 0) + 1
        lead_db.ask_count_total = (lead_db.ask_count_total or 0) + 1
        lead_db.last_ask_at = datetime.utcnow()
        session.add(lead_db)

    chunks = _load_kb_chunks()
    retrieved = _simple_retrieve(chunks, body.question, k=4)
    context = "\n\n".join([f"### {c['title']}\n{c['text']}" for c in retrieved if c.get("text")])

    system = (
        "You are the public TubeGrow AI agent for tubegrow.io.\n"
        "You ONLY answer questions about TubeGrow and YouTube creator growth (analytics, SEO, Shorts/clips).\n"
        "If the user asks anything outside this scope, refuse briefly and redirect to tubegrow.io pages.\n"
        "You must be truthful: if something is not in the provided context, say you’re not sure.\n"
        "Do NOT describe TubeGrow as a 'SaaS'. Use 'AI-powered YouTube growth platform' instead.\n"
        "Do NOT reveal implementation details or internal technology (e.g., LangGraph, OpenAI, model names, backend, database, APIs).\n"
        "If asked about internal implementation, say you can’t share details and focus on what the platform does.\n"
        "TubeGrow is waitlist-only early access; do not mention pricing.\n"
        "Return a JSON object with keys: title (string), answer (string), next_steps (array of strings), suggested_pages (array of {label,url}), disclaimer (string).\n"
        "suggested_pages must be an array of {label,url} and MUST use only these URLs:\n"
        "- https://www.tubegrow.io/\n"
        "- https://www.tubegrow.io/#waitlist\n"
        "- https://www.tubegrow.io/features\n"
        "- https://www.tubegrow.io/blog\n"
        "- https://www.tubegrow.io/tools\n"
        "- https://www.tubegrow.io/youtube-analytics-tool\n"
        "- https://www.tubegrow.io/youtube-seo-tool\n"
        "- https://www.tubegrow.io/viral-clips-generator\n"
        "- https://www.tubegrow.io/ai-youtube-tools\n"
        "- https://www.tubegrow.io/alternatives\n"
    )

    user = f"""User question:
{body.question}

Grounding context (facts you can rely on):
{context}
"""

    try:
        from openai import OpenAI

        client = OpenAI(api_key=settings.openai_api_key)
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.3,
            max_tokens=900,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        )
        content = resp.choices[0].message.content or "{}"
        payload = _normalize_agent_payload(json.loads(content))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {e}")

    answer_preview = ""
    try:
        answer_preview = (payload.get("answer") or "")[:2000]
    except Exception:
        answer_preview = ""

    # Optional: log the ask (helps improve prompts + see what users want).
    with get_db_session() as session:
        ask = MarketingAgentAsk(
            lead_id=lead_id,
            email=email,
            page_url=body.page_url,
            question=body.question,
            answer_preview=answer_preview,
            model="gpt-4o-mini",
        )
        session.add(ask)

    return {"ok": True, "lead_id": lead_id, "result": payload}
