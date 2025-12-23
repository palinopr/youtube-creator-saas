# YouTube Creator SaaS - Project Guidelines

## Project Overview

AI-powered YouTube analytics dashboard for content creators. Uses LangGraph agents to provide intelligent insights, SEO optimization, and viral clip generation from video transcripts.

## Architecture

```
Frontend (Next.js 16)     Backend (FastAPI)           External APIs
├── app/                  ├── app/                    ├── YouTube Data API v3
│   ├── page.tsx          │   ├── main.py             ├── YouTube Analytics API
│   ├── dashboard/        │   ├── routers/            ├── OpenAI GPT-4o
│   ├── video/[id]/       │   │   ├── admin/          └── youtube_transcript_api
│   ├── analysis/         │   │   └── analysis/
│   ├── optimize/         │   ├── services/
│   ├── clips/            │   │   ├── youtube/
│   └── deep-analysis/    │   │   └── clips/
├── components/           │   ├── agents/
├── hooks/                │   ├── utils/
└── lib/                  │   ├── db/
    ├── api.ts            │   └── workers/
    └── types.ts          └── data/
```

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Fonts**: Inter, JetBrains Mono

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.12
- **AI Framework**: LangGraph + LangChain
- **LLM**: OpenAI GPT-4o / GPT-4o-mini
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **ORM**: SQLAlchemy
- **Auth**: Google OAuth 2.0
- **HTTP Client**: google-api-python-client

## Key Features

### 1. Analytics Dashboard
- Channel statistics (subscribers, views, video count)
- Recent videos with performance metrics
- AI-powered Q&A about channel performance
- Located in `backend/app/agents/analytics_agent.py`

### 2. SEO Optimizer
- Video SEO analysis with scoring
- Channel-wide SEO audit
- Keyword research from competitor videos
- Metadata generation (titles, descriptions, tags)
- Located in `backend/app/agents/seo_agent.py`

### 3. Viral Clips Generator
- Multi-agent workflow: Analyst -> Creator -> Supervisor -> Refiner
- Identifies viral moments in video transcripts
- Generates "Franken-bite" clips with hook/body/loop structure
- Located in `backend/app/agents/clips_agent.py`

### 4. Deep Channel Analysis
- Pattern detection across videos
- Causal analytics for performance factors
- Background job processing
- Located in `backend/app/tools/deep_analytics.py`

## Project Structure

```
youtube-saas/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry
│   │   ├── config.py            # Settings (pydantic-settings)
│   │   ├── auth/
│   │   │   └── youtube_auth.py  # Google OAuth flow
│   │   ├── routers/
│   │   │   ├── analytics.py     # /api/channel, /api/videos, /api/agent
│   │   │   ├── seo.py           # /api/seo endpoints
│   │   │   ├── clips.py         # /api/clips endpoints
│   │   │   ├── waitlist.py      # /api/waitlist endpoints
│   │   │   ├── channel_analysis.py  # Re-exports from analysis/
│   │   │   ├── admin.py         # Re-exports from admin/
│   │   │   ├── admin/           # Modular admin endpoints
│   │   │   │   ├── __init__.py  # Main admin router
│   │   │   │   ├── users.py     # User management
│   │   │   │   ├── analytics.py # API costs, metrics
│   │   │   │   └── subscriptions.py # Billing admin
│   │   │   └── analysis/        # Modular analysis endpoints
│   │   │       ├── __init__.py  # Main analysis router
│   │   │       ├── deep.py      # Deep analysis
│   │   │       ├── patterns.py  # Pattern detection
│   │   │       ├── causal.py    # Causal analytics
│   │   │       └── insights.py  # Content optimizer, transcripts
│   │   ├── services/
│   │   │   ├── youtube/         # Modular YouTube API services
│   │   │   │   ├── __init__.py  # YouTubeTools unified class
│   │   │   │   ├── base.py      # Base service, retry decorator
│   │   │   │   ├── video_service.py     # Video operations
│   │   │   │   ├── analytics_service.py # Demographics, traffic
│   │   │   │   ├── seo_service.py       # SEO analysis
│   │   │   │   └── comment_service.py   # Comments
│   │   │   ├── clips/           # Modular clip services
│   │   │   │   ├── __init__.py
│   │   │   │   ├── detector.py  # Clip detection
│   │   │   │   ├── renderer.py  # FFmpeg rendering
│   │   │   │   └── types.py     # Clip data types
│   │   │   └── email.py         # Email service (Resend API)
│   │   ├── agents/
│   │   │   ├── analytics_agent.py   # LangGraph analytics agent
│   │   │   ├── seo_agent.py         # SEO optimization agent
│   │   │   ├── clips_agent.py       # Viral clips agent
│   │   │   ├── comment_agent.py     # Comment analysis agent
│   │   │   └── alert_agent.py       # Channel alert agent
│   │   ├── utils/               # Shared utilities
│   │   │   ├── __init__.py
│   │   │   ├── error_handling.py    # Error handler decorator
│   │   │   └── llm_utils.py         # LLM helpers, JSON extraction
│   │   ├── tools/
│   │   │   ├── clips_generator.py   # Re-exports from services/clips
│   │   │   ├── transcript_analyzer.py
│   │   │   ├── deep_analytics.py
│   │   │   └── content_optimizer.py
│   │   ├── db/
│   │   │   ├── models.py            # SQLAlchemy models
│   │   │   ├── repository.py        # Database operations
│   │   │   └── llm_cache_repository.py  # LLM response caching
│   │   └── workers/
│   │       ├── manager.py       # Background job manager
│   │       └── tasks.py         # Async task definitions
│   ├── requirements.txt
│   ├── .env                     # Environment variables
│   └── Dockerfile
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx           # Root layout with dark theme
│   │   ├── page.tsx             # Main dashboard
│   │   ├── globals.css          # Tailwind styles
│   │   ├── dashboard/           # Auth redirect handler
│   │   ├── video/[id]/          # Single video view
│   │   ├── videos/              # Video list
│   │   ├── analysis/            # Channel analysis
│   │   ├── optimize/            # SEO optimization
│   │   ├── clips/               # Clips generator
│   │   ├── audience/            # Audience demographics
│   │   ├── comments/            # Comment analysis
│   │   ├── deep-analysis/       # Advanced analytics
│   │   ├── why-it-works/        # Causal analysis
│   │   ├── advanced-insights/   # AI insights
│   │   └── (marketing)/         # Landing pages
│   │       ├── tubebuddy-alternative/
│   │       └── vidiq-alternative/
│   ├── components/
│   │   ├── landing/
│   │   │   └── WaitlistForm.tsx # Email waitlist form
│   │   ├── dashboard/
│   │   │   ├── ViewsTrendChart.tsx
│   │   │   └── SubscriberChart.tsx
│   │   └── layout/
│   │       └── Sidebar.tsx
│   ├── hooks/
│   │   ├── index.ts             # Hook exports
│   │   ├── useAuth.ts           # Authentication hook
│   │   ├── useAsync.ts          # Async state management
│   │   ├── useForm.ts           # Form handling
│   │   ├── useLocalStorage.ts   # LocalStorage hook
│   │   └── useDashboardData.ts  # Dashboard data fetching
│   ├── lib/
│   │   ├── api.ts               # API client class
│   │   ├── config.ts            # Frontend configuration
│   │   ├── types.ts             # Consolidated TypeScript types
│   │   ├── utils.ts             # Utility functions (formatNumber, etc.)
│   │   └── waitlist.ts          # Waitlist API client
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
└── README.md
```

## Development Commands

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### URLs
- Frontend: http://localhost:3000 (or 3001 if 3000 is in use)
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Services to Start ("turn on the servers")

When user says "turn on the servers", start ALL of the following:

### 1. Backend (FastAPI)
```bash
cd /Users/jaimeortiz/youtube/youtube-saas/backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend (Next.js)
```bash
cd /Users/jaimeortiz/youtube/youtube-saas/frontend
npm run dev
```

## Environment Variables

Backend `.env`:
```env
# Google OAuth (required)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# OpenAI (required for AI features)
OPENAI_API_KEY=sk-...

# App URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000

# Security
SECRET_KEY=your-secret-key

# Email (Resend - for waitlist confirmation emails)
RESEND_API_KEY=re_xxxx

# Optional: LangSmith tracing
LANGCHAIN_TRACING_V2=false
LANGCHAIN_API_KEY=
LANGCHAIN_PROJECT=
```

## API Endpoints Overview

### Authentication
- `GET /auth/login` - Start OAuth flow
- `GET /auth/callback` - OAuth callback
- `GET /auth/status` - Check auth status
- `POST /auth/logout` - Clear session

### Analytics
- `GET /api/channel/stats` - Channel statistics
- `GET /api/videos/recent` - Recent videos
- `GET /api/videos/{video_id}` - Video details
- `POST /api/agent/query` - AI chat query

### SEO
- `GET /api/seo/analyze/{video_id}` - Analyze video SEO
- `GET /api/seo/audit` - Channel SEO audit
- `POST /api/seo/research` - Keyword research
- `POST /api/seo/generate` - Generate metadata

### Clips
- `POST /api/clips/generate` - Generate clip suggestions
- `POST /api/clips/render` - Render clip to MP4
- `GET /api/clips/{job_id}/status` - Check render status
- `GET /api/clips/{job_id}/download` - Download clip

### Analysis
- `GET /api/analysis/patterns` - Channel patterns
- `GET /api/analysis/top-videos` - Top performers
- `POST /api/analysis/deep` - Start deep analysis job

### Waitlist
- `POST /api/waitlist/signup` - Add email to waitlist
- `POST /api/waitlist/confirm` - Confirm email with token
- `GET /api/waitlist/status/{token}` - Check confirmation status

## Coding Conventions

### Python (Backend)
- Use type hints for all function parameters and returns
- Async functions where I/O bound (API calls)
- Pydantic models for request/response validation
- Use `@youtube_api_retry` decorator for API calls (handles rate limits)
- Logging with `logger = logging.getLogger(__name__)`
- JSON extraction from LLM responses uses `_extract_json_from_response()` helper
- Import YouTubeTools from `services.youtube` (NOT `tools.youtube_tools`)

### TypeScript (Frontend)
- Functional components with hooks
- `"use client"` directive for client components
- API calls through `lib/api.ts` client class
- Credentials included in fetch requests (`credentials: "include"`)
- Shared types in `lib/types.ts`
- Utility functions in `lib/utils.ts` (formatNumber, formatDate, etc.)

### LangGraph Agents
- State defined as TypedDict
- Nodes are async functions returning state updates
- Conditional edges for workflow control
- System prompts define agent personality/behavior
- Tools wrapped with `@tool` decorator

## Database Models

### Job
Tracks background tasks (render_clip, deep_analysis, etc.)
- Status: pending, queued, processing, rendering, completed, failed, cancelled
- Stores input/output data as JSON

### AnalyticsCache
ETL cache for YouTube data
- Prevents repeated API calls
- Background sync with TTL

### TranscriptCache
Permanent transcript storage
- Saves 250 API quota units per video
- Stores word-level timestamps for clip cutting

### VideoCache
Normalized video data
- Computed fields: like_ratio, engagement_score
- Updated during background sync

### LLMCache
Caches LLM responses to reduce API costs
- Keyed by SHA-256 hash of prompt
- TTL-based expiration
- Hit count tracking for analytics

### Waitlist
Email waitlist for pre-launch signups
- Status: pending, confirmed, invited, converted
- Auto-assigned position number
- Confirmation token for email verification

## Important Notes

### YouTube API Quotas
- Daily quota: 10,000 units
- Read operations: 1-3 units
- Write operations: 50-1600 units
- Use caching aggressively

### OAuth Scopes
- `youtube.readonly` - Read channel/video data
- `yt-analytics.readonly` - Read analytics data

### Rate Limiting
- YouTube API uses exponential backoff on 429 errors
- `tenacity` library handles retries automatically
- Max 5 attempts with 1-60s wait

### CORS Configuration
Frontend origins whitelisted in `backend/app/main.py`:
- `https://tubegrow.io`
- `https://www.tubegrow.io`
- `http://localhost:3000`
- `http://localhost:3001`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:3001`

**IMPORTANT:** Frontend must call `https://api.tubegrow.io`, NOT the Railway internal URL.

## Testing

No test framework configured yet. Consider adding:
- pytest for backend
- Jest/Vitest for frontend

## Deployment

### Production URLs
| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | https://tubegrow.io |
| Backend | Railway | https://api.tubegrow.io |

### Railway (Backend)
- Project: `youtube-saas-backend`
- Service: `api`
- Dockerfile: `backend/Dockerfile`
- Health endpoint: `/health`

**Railway CLI Commands:**
```bash
# Check status
railway status

# View logs
railway logs

# Set environment variables
railway variables --set "KEY=value"

# View all variables
railway variables --kv
```

**⚠️ IMPORTANT: How to Deploy to Railway**
```bash
# ALWAYS deploy via Git push (NOT railway up)
git add .
git commit -m "your message"
git push origin main
```
**DO NOT use `railway up`** - it has a bug that passes `$PORT` as literal string instead of expanding it. Always deploy by pushing to GitHub - Railway auto-deploys from the connected repo.

### Vercel (Frontend)
- Auto-deploys from Git pushes to `main` branch
- Project: `frontend` in `palinos-projects`

**Vercel CLI Commands:**
```bash
cd frontend

# List environment variables
vercel env ls

# Update environment variable
echo "https://api.tubegrow.io" | vercel env add NEXT_PUBLIC_API_URL production --force

# Trigger redeploy (via empty commit if CLI deploy fails)
git commit --allow-empty -m "chore: trigger redeploy" && git push origin main
```

**Environment Variables (Vercel):**
- `NEXT_PUBLIC_API_URL` = `https://api.tubegrow.io` (MUST be api.tubegrow.io, NOT Railway internal URL)
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` = Google Analytics ID

### Google OAuth Configuration
- Client: `TubeGrow Production` (Web application)
- Client ID: `1006336789698-utsh149brh430722r51bsou3emafmqig.apps.googleusercontent.com`
- Authorized redirect URI: `https://api.tubegrow.io/auth/callback`

### Railway Environment Variables
```env
GOOGLE_CLIENT_ID=1006336789698-utsh149brh430722r51bsou3emafmqig.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<secret>
OPENAI_API_KEY=<secret>
SECRET_KEY=<secret>
ENCRYPTION_KEY=<secret>
FRONTEND_URL=https://tubegrow.io
```

## Common Issues & Fixes

### CORS Errors
**Symptom:** `Access-Control-Allow-Origin` errors in browser console
**Cause:** Frontend calling wrong backend URL or origin not whitelisted
**Fix:**
1. Ensure `NEXT_PUBLIC_API_URL` on Vercel is `https://api.tubegrow.io`
2. Check CORS origins in `backend/app/main.py`

### 403 Forbidden Errors
**Symptom:** API returns 403 for authenticated endpoints
**Cause:** Session expired or cookies not being sent
**Fix:** Sign out and sign back in with Google OAuth

### Import Errors After Refactor
**Symptom:** `ModuleNotFoundError: No module named 'app.tools.youtube_tools'`
**Cause:** Old import path used after youtube_tools was split
**Fix:** Change imports from `..tools.youtube_tools` to `..services.youtube`

### Build Failures (TypeScript)
**Symptom:** Type errors during `npm run build`
**Fix:** Check that all component props match their interfaces, especially for shared components like `WaitlistForm`

### Required production changes:
1. Set DATABASE_URL for PostgreSQL (optional - using SQLite currently)
2. ~~Update FRONTEND_URL/BACKEND_URL~~ Done
3. ~~Configure OAuth redirect URIs~~ Done
4. ~~Set strong SECRET_KEY~~ Done
