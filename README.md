# YouTube Creator SaaS - Analytics Dashboard

An AI-powered analytics dashboard for YouTube creators using LangGraph agents.

## Setup Instructions

### 1. Google Cloud Project Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., "YouTube Creator SaaS")
3. Enable the following APIs:
   - **YouTube Data API v3**: [Enable here](https://console.cloud.google.com/apis/library/youtube.googleapis.com)
   - **YouTube Analytics API**: [Enable here](https://console.cloud.google.com/apis/library/youtubeanalytics.googleapis.com)

### 2. OAuth 2.0 Credentials

1. Go to [Credentials page](https://console.cloud.google.com/apis/credentials)
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - User Type: External
   - App name: YouTube Creator SaaS
   - Add scopes:
     - `https://www.googleapis.com/auth/youtube.readonly`
     - `https://www.googleapis.com/auth/yt-analytics.readonly`
4. Create OAuth client ID:
   - Application type: **Web application**
   - Name: YouTube Creator SaaS
   - Authorized redirect URIs: `http://localhost:8000/auth/callback`
5. Download the JSON file and save it as `backend/client_secrets.json`

### 3. Environment Variables

Copy the example env file and fill in your credentials:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your values:
- `GOOGLE_CLIENT_ID`: From OAuth credentials
- `GOOGLE_CLIENT_SECRET`: From OAuth credentials
- `OPENAI_API_KEY`: Your OpenAI API key (for AI insights)
- `SECRET_KEY`: Random 32+ char secret for signing sessions
- `TOKEN_ENCRYPTION_KEY`: Fernet key to encrypt OAuth tokens (required in production)
- `FRONTEND_URL`: Your Vercel domain (https)
- `BACKEND_URL`: Your Railway backend domain (https)
- `ENVIRONMENT`: Set to `production` on Railway

Optional (local only): SEO reporting CLI env keys:
- `SEO_OAUTH_CLIENT_JSON_PATH`: Desktop OAuth JSON download path
- `GA4_PROPERTY_ID`: GA4 property number (e.g., `516202730`)
- `GSC_PROPERTY`: Search Console property (e.g., `sc-domain:tubegrow.io`)

### 4. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs at: http://localhost:8000

### 5. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:3000

## Features

- 📊 **Channel Analytics**: View subscribers, views, watch time
- 📹 **Video Performance**: Track individual video metrics
- 🤖 **AI Insights**: Ask questions about your channel performance
- 📈 **Trend Analysis**: See performance over time

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│  FastAPI + LG   │────▶│  YouTube APIs   │
│   (Frontend)    │◀────│   (Backend)     │◀────│  (Data Source)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  OpenAI/Claude  │
                        │   (AI Agent)    │
                        └─────────────────┘
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login` | GET | Start YouTube OAuth flow |
| `/auth/callback` | GET | OAuth callback handler |
| `/api/channel/stats` | GET | Get channel statistics |
| `/api/videos/recent` | GET | Get recent videos |
| `/api/agent/query` | POST | Ask AI agent a question |
