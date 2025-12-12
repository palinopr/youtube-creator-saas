---
title: System Architecture
description: End-to-end architecture for the YouTube Creator SaaS.
---

# YouTube Creator SaaS – Architecture

Frontend runs on Vercel (Next.js App Router).  
Backend runs on Railway (FastAPI + background workers).  
Primary external services: Google OAuth/YouTube APIs, OpenAI, Stripe, optional SerpBear, optional Supabase (waitlist).

## High-level module map

```mermaid
mindmap
  root((youtube-saas))
    backend(FastAPI)
      auth(OAuth + JWT cookies)
      routers(/api/*)
      tools(Domain logic)
      agents(AI orchestration)
      scripts(Local CLIs e.g. seo_report)
      workers(DB-backed async jobs)
      db(Postgres/SQLite models + repos)
      billing(Stripe)
      services(SerpBear)
    frontend(Next.js)
      marketing(Landing + pillars + niches + blog)
      app(Dashboard + tools)
      admin(Internal panel)
      lib(ApiClient + utils)
      hooks(Auth + data loaders)
      components(UI)
    supabase(Optional waitlist)
```

## Deployment topology

```mermaid
flowchart LR
  U[User Browser]
  V[Vercel Frontend<br/>Next.js]
  R[Railway Backend<br/>FastAPI]
  PG[(Railway Postgres)]
  G[Google OAuth + YouTube APIs]
  GA[GA4 + Search Console APIs<br/>(internal SEO reporting)]
  OAI[OpenAI API]
  S[Stripe API]
  SB[SerpBear API<br/>(optional)]
  SUP[Supabase<br/>(optional waitlist)]
  CLI[SEO Report CLI<br/>(local)]

  U --> V
  V -->|HTTPS + cookies| R
  R --> PG
  R --> G
  CLI -.-> GA
  R --> OAI
  R --> S
  R -.-> SB
  V -.-> SUP
```

## Authentication flow (multi-tenant SaaS)

```mermaid
sequenceDiagram
  participant FE as Frontend (Vercel)
  participant BE as Backend (Railway)
  participant G as Google OAuth
  participant DB as Postgres

  FE->>BE: GET /auth/login
  BE->>DB: save oauth_state (token_key=state)
  BE-->>FE: 307 Redirect to Google
  FE->>G: user consents
  G-->>BE: GET /auth/callback?code&state
  BE->>DB: verify stored oauth_state
  BE->>G: exchange code for tokens
  BE->>G: fetch userinfo
  BE->>DB: upsert User + Subscription
  BE->>DB: save encrypted OAuth creds (token_key=user.id)
  BE-->>FE: set JWT cookie + redirect ?authenticated=true
```

Notes:
- OAuth credentials are stored per-user in `user_tokens` and encrypted via Fernet (`TOKEN_ENCRYPTION_KEY`).
- Session is a signed JWT cookie (`SESSION_COOKIE_NAME`) with `sub=user_id`.

## Request/analysis flow

```mermaid
flowchart TD
  FE[Frontend] -->|POST /api/analysis/deep/start| BE
  BE -->|create Job| J[(jobs)]
  BE --> FE
  W[WorkerManager poll loop] --> J
  W -->|DEEP_ANALYSIS handler| T[DeepAnalytics/CausalAnalytics]
  T -->|YouTube API via creds| YT[YouTube]
  T -->|result| AC[(analytics_cache)]
  W -->|update status| J
  FE -->|poll /status/{job_id}| BE --> J
  FE -->|GET /deep/cached| BE --> AC
```

## Video ETL flow

```mermaid
flowchart TD
  FE -->|GET /api/videos/recent| BE
  BE -->|check AnalyticsCache videos| AC[(analytics_cache)]
  AC -->|fresh| BE --> VC[(video_cache)] --> BE --> FE
  AC -->|missing/stale| BE -->|queue VIDEO_SYNC job| J[(jobs)]
  BE -->|fallback real-time| YT[YouTube API] --> BE --> FE
  W[WorkerManager] --> J -->|VIDEO_SYNC handler| DA[DeepAnalytics.get_all_videos_extended real_time=False]
  DA --> YT --> DA --> VC
  W -->|set cache videos + clear syncing| AC
```

## Core data model (simplified)

```mermaid
erDiagram
  users ||--o{ youtube_channels : has
  users ||--o{ subscriptions : has
  users ||--o{ user_tokens : has
  users ||--o{ api_usage : generates
  users ||--o{ admin_activity_logs : "admin actions"
  users ||--o{ impersonation_sessions : "admin sessions"

  youtube_channels ||--o{ analytics_cache : caches
  youtube_channels ||--o{ video_cache : caches
  youtube_channels ||--o{ jobs : runs

  users {
    string id PK
    string email
    string google_id
    bool is_admin
    bool is_active
  }
  user_tokens {
    string token_key PK
    text encrypted_credentials
    string oauth_state
  }
  subscriptions {
    int id PK
    string user_id FK
    enum plan_id
    enum status
  }
  jobs {
    string job_id PK
    enum job_type
    enum status
    json input_data
    json output_data
  }
  analytics_cache {
    int id PK
    string channel_id
    string cache_key
    json data
    datetime expires_at
  }
  video_cache {
    int id PK
    string channel_id
    string video_id
    json video_metadata
  }
```

## Production requirements

- Railway `api` service env:
  - `ENVIRONMENT=production`, `DEBUG=false`, `SINGLE_USER_MODE=false`
  - `DATABASE_URL` (Railway Postgres) – required for persistence
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - `SECRET_KEY` (JWT signing)
  - `TOKEN_ENCRYPTION_KEY` (Fernet)
  - `OPENAI_API_KEY`
  - Stripe vars if billing enabled.
- Vercel env:
  - `NEXT_PUBLIC_API_URL=https://api.tubegrow.io`
  - `NEXT_PUBLIC_GA_ID` (and/or measurement id)
  - Supabase waitlist vars if used.

Local-only (internal) SEO reporting:
- Uses Desktop OAuth env vars `SEO_OAUTH_CLIENT_JSON_PATH`, `GA4_PROPERTY_ID`, `GSC_PROPERTY`.
- Runs via `backend/scripts/seo_report.py` on a developer machine and is not deployed to Vercel/Railway.

## Where to look

- Backend API surface: `backend/app/routers/*`
- Core analytics: `backend/app/tools/deep_analytics.py`, `backend/app/tools/causal_analytics.py`
- Jobs/ETL: `backend/app/workers/*`, `backend/app/db/repository.py`
- Frontend pages: `frontend/app/*`
- Shared API client: `frontend/lib/api.ts`
