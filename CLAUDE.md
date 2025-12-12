# YouTube Creator SaaS - Project Guidelines

## Project Overview

AI-powered YouTube analytics dashboard for content creators. Uses LangGraph agents to provide intelligent insights, SEO optimization, and viral clip generation from video transcripts.

## Architecture

```
Frontend (Next.js 16)     Backend (FastAPI)           External APIs
├── app/                  ├── app/                    ├── YouTube Data API v3
│   ├── page.tsx          │   ├── main.py             ├── YouTube Analytics API
│   ├── dashboard/        │   ├── routers/            ├── OpenAI GPT-4o
│   ├── video/[id]/       │   ├── agents/             └── youtube_transcript_api
│   ├── analysis/         │   ├── tools/
│   ├── optimize/         │   ├── db/
│   ├── clips/            │   ├── auth/
│   └── deep-analysis/    │   └── workers/
├── components/           └── data/
└── lib/api.ts                └── youtube_saas.db
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
│   │   │   ├── channel_analysis.py  # /api/analysis endpoints
│   │   │   └── youtube_videos.py    # /api/youtube endpoints
│   │   ├── agents/
│   │   │   ├── analytics_agent.py   # LangGraph analytics agent
│   │   │   ├── seo_agent.py         # SEO optimization agent
│   │   │   └── clips_agent.py       # Viral clips agent
│   │   ├── tools/
│   │   │   ├── youtube_tools.py     # YouTube API wrapper
│   │   │   ├── youtube_api.py       # Low-level API helpers
│   │   │   ├── clips_generator.py   # Clip detection/rendering
│   │   │   ├── transcript_analyzer.py
│   │   │   ├── deep_analytics.py
│   │   │   └── content_optimizer.py
│   │   ├── db/
│   │   │   ├── models.py        # SQLAlchemy models (Job, Cache, Transcript)
│   │   │   └── repository.py    # Database operations
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
│   │   ├── deep-analysis/       # Advanced analytics
│   │   ├── why-it-works/        # Causal analysis
│   │   └── advanced-insights/   # AI insights
│   ├── components/
│   │   └── AIChatPopup.tsx      # Global AI chat widget
│   ├── lib/
│   │   └── api.ts               # API client class
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
- SerpBear (SEO Tracking): http://localhost:3005

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

### 3. SerpBear (Docker - SEO Rank Tracking)
```bash
# Check if running
docker ps | grep serpbear

# If not running, start it
docker start serpbear-app-1

# Or if container doesn't exist, it may need to be recreated from original setup
```

**SerpBear Details:**
- Self-hosted Google keyword rank tracking tool
- Runs in Docker container `serpbear-app-1` on port 3005
- Used by admin SEO Rankings feature (`/admin/seo`)
- API client at `backend/app/services/serpbear.py`
- API Key configured in backend `.env` as `SERPBEAR_API_KEY`

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

## Coding Conventions

### Python (Backend)
- Use type hints for all function parameters and returns
- Async functions where I/O bound (API calls)
- Pydantic models for request/response validation
- Use `@youtube_api_retry` decorator for API calls (handles rate limits)
- Logging with `logger = logging.getLogger(__name__)`
- JSON extraction from LLM responses uses `_extract_json_from_response()` helper

### TypeScript (Frontend)
- Functional components with hooks
- `"use client"` directive for client components
- API calls through `lib/api.ts` client class
- Credentials included in fetch requests (`credentials: "include"`)

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

### CORS
Frontend origins whitelisted:
- http://localhost:3000
- http://127.0.0.1:3000
- Production frontend URL (from settings)

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
- Auto-deploys from Git pushes
- Environment variable: `NEXT_PUBLIC_API_URL=https://api.tubegrow.io`

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

### Required production changes:
1. Set DATABASE_URL for PostgreSQL (optional - using SQLite currently)
2. ~~Update FRONTEND_URL/BACKEND_URL~~ Done
3. ~~Configure OAuth redirect URIs~~ Done
4. ~~Set strong SECRET_KEY~~ Done
