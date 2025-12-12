---
title: Backend File Map
description: Per-file documentation for backend/app (FastAPI + workers).
---

# Backend File Map (`backend/app`)

This document lists every meaningful backend source file and what it does.  
Files under `backend/app/data/` and `__pycache__/` are runtime artifacts and are not documented here.

## Root package

- `backend/app/__init__.py`  
  Package marker and public re-exports for the backend app.

- `backend/app/main.py`  
  FastAPI application entrypoint. Configures:
  - lifespan startup/shutdown (DB init + start/stop workers)
  - CORS for Vercel frontend + custom domains
  - sanitized production error handlers
  - router registration for all API modules.

- `backend/app/config.py`  
  `Settings` via Pydantic. Loads env vars from `.env`. Validates production requirements:
  `SECRET_KEY`, Google OAuth creds, `TOKEN_ENCRYPTION_KEY`, etc. Also contains session cookie defaults.

## Auth (`backend/app/auth`)

- `backend/app/auth/__init__.py`  
  Re-exports the auth router for inclusion in `main.py`.

- `backend/app/auth/youtube_auth.py`  
  Google OAuth flow:
  - `GET /auth/login`: builds OAuth URL + stores CSRF state
  - `GET /auth/callback`: verifies state, exchanges code, fetches Google profile,
    creates/updates `User`, saves encrypted OAuth credentials into `UserToken`
    scoped by `user.id` (multi-tenant), issues JWT cookie session, redirects to frontend.
  - `GET /auth/status`: returns whether user is authenticated.
  - `POST /auth/logout`: clears credentials and cookie.
  - `get_authenticated_service(...)`: helper to build YouTube/Analytics clients from stored creds.

- `backend/app/auth/session.py`  
  JWT session helpers used in SaaS mode:
  - `create_session_token(user_id)`
  - `decode_session_token(token)` → returns `user_id` or `None`.

- `backend/app/auth/dependencies.py`  
  FastAPI dependencies for:
  - `get_current_user` / `get_current_user_optional`
  - `get_current_channel`
  - `get_user_subscription`
  - usage metering & quotas via `check_usage`
  - admin gate via `require_admin`.
  Also sets request-scoped token key for multi-tenant credentials.

- `backend/app/auth/token_encryption.py`  
  Fernet-based encryption layer for OAuth credentials.
  Stores encrypted JSON in DB; falls back to plaintext only if key missing (dev).

- `backend/app/auth/context.py`  
  ContextVar-based request-scoped token-key store so legacy call sites can
  fetch the correct tenant’s credentials automatically.

## Database (`backend/app/db`)

- `backend/app/db/__init__.py`  
  Re-exports models, repos, and DB helpers (`init_db`, `get_db_session`).

- `backend/app/db/models.py`  
  SQLAlchemy models + DB engine setup. Key tables:
  - `User`, `YouTubeChannel`, `Subscription`, `APIUsage`
  - `UserToken` (encrypted OAuth credentials + OAuth state)
  - `Job` (persistent async jobs), `AnalyticsCache`, `VideoCache`
  - admin/audit: `AdminActivityLog`, `ImpersonationSession`
  Also auto-initializes DB schema on import.

- `backend/app/db/repository.py`  
  Repository layer:
  - `JobRepository`: create/update/list/delete jobs.
  - `AnalyticsCacheRepository`: store results for `deep_analysis`, `causal_analysis`, `videos`.
  - `VideoCacheRepository`: upsert and query ETL video records.

## Workers (`backend/app/workers`)

- `backend/app/workers/__init__.py`  
  Package marker.

- `backend/app/workers/manager.py`  
  Persistent background worker manager:
  - polls `jobs` table for queued jobs
  - runs handlers in a `ThreadPoolExecutor`
  - updates job status/progress/output/error
  - registers handlers for render/analysis/sync jobs.

- `backend/app/workers/tasks.py`  
  Actual job handlers:
  - `process_render_job`: ffmpeg clip rendering, OAuth download when possible.
  - `process_analytics_job`: shared handler for deep/causal/video-sync ETL.
  - `_run_deep_analysis`, `_run_causal_analysis`, `_run_video_sync`: tool-specific logic.

## Tools (`backend/app/tools`)

These are the core domain services. Routers and workers call into these.

- `backend/app/tools/__init__.py`  
  Convenience re-exports.

- `backend/app/tools/youtube_api.py`  
  Low-level YouTube API wrapper:
  - builds authenticated clients from creds
  - fetches playlists/videos/stats
  - supports OAuth-first downloads for owned videos, with yt‑dlp fallback.

- `backend/app/tools/youtube_tools.py`  
  Higher-level convenience methods for dashboard needs:
  recent videos, channel stats, analytics overview, etc.

- `backend/app/tools/youtube_channel.py`  
  Shared helper `resolve_mine_channel_id(youtube)` to get the current user’s channel id.

- `backend/app/tools/deep_analytics.py`  
  Deep analytics engine + ETL-friendly fetch:
  - `get_all_videos_extended(..., real_time=True|False)` with safety caps
  - `run_full_analysis(...)` producing posting-time, title, engagement, content-type, growth insights.

- `backend/app/tools/causal_analytics.py`  
  “Why it works” causal analysis:
  celebrity impact, description patterns, title vs content, success factors.
  Also supports ETL mode via `real_time=False` for 5k-video runs in workers.

- `backend/app/tools/advanced_causal.py`  
  Advanced causal overlays:
  factor combinations, celebrity trends, multi‑celebrity effects, engagement quality,
  controversy interactions, content×celebrity matrices, title patterns.

- `backend/app/tools/channel_analyzer.py`  
  Pattern extraction and lightweight analysis for “analysis/patterns” endpoints,
  plus custom scoring model builder.

- `backend/app/tools/content_optimizer.py`  
  Turns analysis into a practical blueprint + quick wins + next‑video suggestions.

- `backend/app/tools/clips_generator.py`  
  Clip generation/rendering pipeline:
  - transcript chunking & segment selection
  - OAuth/yt‑dlp download
  - caption generation and ffmpeg rendering
  - supports async progress callbacks.

- `backend/app/tools/transcript_analyzer.py`  
  Transcript parsing and analytics utilities feeding clip/SEO tools.

- `backend/app/tools/description_generator.py`  
  AI‑assisted description generation for SEO/optimization flows.

## Routers (`backend/app/routers`)

Each file defines a FastAPI router mounted in `main.py`.

- `backend/app/routers/__init__.py`  
  Package marker.

- `backend/app/routers/analytics.py`  
  Main dashboard APIs:
  - `/api/channel/stats`, `/api/analytics/overview`
  - `/api/videos/recent`, `/api/videos/{id}`
  - video ETL sync APIs `/api/videos/sync/*`.

- `backend/app/routers/channel_analysis.py`  
  Analysis suite:
  deep/causal/advanced endpoints, async job start/status/delete,
  cache read endpoints (`/deep/cached`, `/causal/cached`),
  content optimizer endpoints.

- `backend/app/routers/clips.py`  
  Viral clips generation UI backend:
  suggests clips, queues render jobs, exposes job status/download,
  SSE stream for live updates.

- `backend/app/routers/youtube_videos.py`  
  Direct YouTube video listing/search/details and ownership verification.

- `backend/app/routers/comments.py`  
  Comment analysis endpoints (per‑video and channel‑wide).

- `backend/app/routers/audience.py`  
  Audience demographics/geography/devices summaries.

- `backend/app/routers/traffic.py`  
  Traffic sources, subscriber sources, playback locations.

- `backend/app/routers/revenue.py`  
  Revenue/CPM/monetization availability endpoints.

- `backend/app/routers/seo.py`  
  Creator-facing SEO optimizer endpoints (meta tags, suggestions).

- `backend/app/routers/alerts.py`  
  Alerts CRUD + unread counts; integrates with alert agent outputs.

- `backend/app/routers/billing.py`  
  Public billing endpoints:
  plans, subscription status, Stripe checkout/portal sessions, webhook handler.

- `backend/app/routers/user.py`  
  User profile/settings, connected channels, GDPR export/deletion requests.

- `backend/app/routers/admin.py`  
  Internal admin panel endpoints:
  system status, user management, subscription overrides, revenue/API-cost analytics,
  audit log, optional SerpBear SEO controls, impersonation session creation/end.

## Agents (`backend/app/agents`)

LangChain/LangGraph agents that orchestrate tools for AI answers.

- `backend/app/agents/__init__.py`  
  Exports agent classes.

- `backend/app/agents/analytics_agent.py`  
  Multi-tool analytics assistant for `/api/agent/query`.

- `backend/app/agents/clips_agent.py`  
  Agent that selects viral clip segments and metadata.

- `backend/app/agents/comment_agent.py`  
  Agent for comment sentiment, questions, notable commenters, ideas.

- `backend/app/agents/seo_agent.py`  
  Agent for SEO/title/description improvements.

- `backend/app/agents/alert_agent.py`  
  Agent for generating alerts based on analytics anomalies.

## Billing helpers (`backend/app/billing`)

- `backend/app/billing/__init__.py`  
  Package marker.

- `backend/app/billing/plans.py`  
  Defines tiers, features, and monthly usage limits.

- `backend/app/billing/stripe_service.py`  
  Stripe API wrapper for subscriptions and billing events.

## Services (`backend/app/services`)

- `backend/app/services/__init__.py`  
  Package marker.

- `backend/app/services/serpbear.py`  
  Async client for SerpBear (external SEO rank tracker). Optional in production.

## Misc training data

- `backend/app/CLIPPER_TRAINING_DATA.md`  
  Notes/training examples for the clipper agent.

- `backend/app/clipper_training.json`  
  Structured training examples for clips selection.

