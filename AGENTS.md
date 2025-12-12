# TubeGrow (YouTube SaaS) — Agent Notes

This repo powers `https://www.tubegrow.io` (TubeGrow): a YouTube creator SaaS with AI analytics + SEO tooling.

## Product Status (Dec 2025)

- **Waitlist-only early access. No public pricing.**
- Public pages must be **truthful**: never claim features, customers, or pricing that aren’t live.
- Anything “coming soon” goes in roadmap/docs, clearly labeled (not marketing claims).

## Repo Layout

- `frontend/` — Next.js 16 app (marketing + blog + tools + app UI).
- `backend/` — FastAPI backend (YouTube OAuth + APIs + agents + internal SEO reporting CLI).
- `docs/` — architecture + SEO strategy + progress tracking.

Key docs:
- `docs/ARCHITECTURE.md` — system overview/mermaid.
- `docs/seo/SEO_MASTER_PLAN.md` — single source of truth for SEO plan + running log.

## Non-Negotiables (Project Rules)

- **Waitlist-only everywhere** (no pricing tables, no plan selection flows in UI).
- **Don’t commit secrets** (OAuth JSON, GA secrets, API keys, tokens).
- **Avoid spam/doorway SEO tactics** (no “city pages” or fake backlink schemes).
- **Always commit + push to `main`** after meaningful changes.

## Deploy + Verification Rules

- **Always push** changes to GitHub `main` (Vercel/Railway deploys should follow).
- After a deploy, **watch for errors**:
  - Vercel CLI: `vercel ls`, `vercel deployments`, `vercel logs <deployment-url-or-id>`
  - Railway CLI: `railway status`, `railway logs`
- **Smoke-check production after ~1 minute** (or once deploy completes):
  - Use Playwright to load key pages and confirm the change is live.
  - Always validate the “waitlist-only” constraint (no prices visible anywhere public).
- If a deploy fails or changes don’t appear:
  - Check logs first (Vercel/Railway).
  - Record what happened + how it was fixed in the progress log (below).

## Progress Logging + Keeping Docs In Sync

- Every meaningful change must update the running log in:
  - `docs/seo/SEO_MASTER_PLAN.md`
- If a change impacts architecture/routes/pages/tools, update the diagrams/docs too:
  - `docs/ARCHITECTURE.md` (Mermaid must match current reality)
- Keep “source of truth” consistent:
  - product status (waitlist-only)
  - public feature claims
  - internal docs + diagrams

## SEO: Current State (as of Dec 12, 2025)

Already shipped:
- Blog + marketing SEO cleanup (H1s, titles, canonical host alignment to `www`).
- `llms.txt` present in `frontend/public/llms.txt` (kept simple/spec-like).
- Pillar pages live: `/youtube-analytics-tool`, `/youtube-seo-tool`.
- Niche hub + first 10 niches: `/niches` + `/niches/{niche}`.
- “Link magnet” lite tools: `/tools/*` (SEO score, metadata generator, clip finder, channel snapshot).
- RSS feed route: `/rss.xml`.
- **Pricing removed** from marketing UI and **in-app pricing surfaces disabled** (onboarding/billing).

Expected Semrush warning:
- Low text-to-HTML ratio on Next.js pages (acceptable; not a blocker).

## Common Gotchas

- Keep all content date context in **December 2025** (no “2024” guidance unless historical and clearly labeled).
- When adding new pages, ensure:
  - One real `<h1>`
  - Title ≤ 70 chars
  - Internal links to relevant pillars + tools + related posts
  - No broken links / 4xx routes

## Local Dev

- Frontend: `cd frontend && npm run dev`
- Backend: `cd backend && uvicorn app.main:app --reload`

## SEO Reporting (Internal Only)

There is an internal CLI at `backend/scripts/seo_report.py` used to pull GA4/GSC metrics.
Keep OAuth credentials and tokens local in `backend/.env` and cache directories. Never commit them.
