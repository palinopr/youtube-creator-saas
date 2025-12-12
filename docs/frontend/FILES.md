---
title: Frontend File Map
description: Per-file documentation for the Next.js frontend.
---

# Frontend File Map (`frontend/`)

This document lists every meaningful frontend source/config file and what it does.  
Excluded from this doc: `.next/`, `.vercel/`, `node_modules/`, build caches.

## Root config

- `frontend/next.config.js`  
  Next.js configuration. Enables Turbopack and app-router settings for Vercel builds.

- `frontend/tailwind.config.ts`  
  Tailwind theme, colors, and content scanning paths.

- `frontend/postcss.config.js`  
  PostCSS pipeline (Tailwind + autoprefixer).

- `frontend/tsconfig.json`  
  TypeScript compiler settings + path aliases.

- `frontend/next-env.d.ts`  
  Next.js TS ambient types.

- `frontend/proxy.ts`  
  Next middleware proxy helper (used by edge/runtime routes).

- `frontend/Dockerfile`  
  Optional container build for local/dev hosting.

- `frontend/package.json` / `frontend/package-lock.json`  
  Frontend dependencies and scripts (`dev`, `build`, `start`).

- `frontend/env.example`, `frontend/.env.local.example`  
  Environment variable templates (API URL, Supabase waitlist, GA).

- `frontend/.env.local`  
  Local developer env (kept for local use; do not remove).

## App routes (`frontend/app`)

App Router pages. Marketing routes are grouped under `(marketing)`.

### Marketing group (`frontend/app/(marketing)`)

- `frontend/app/(marketing)/layout.tsx`  
  Shared marketing layout (header/footer, metadata, styling).

- `frontend/app/(marketing)/about/page.tsx`  
  Public “About” landing page.

- `frontend/app/(marketing)/features/page.tsx`  
  Features overview page linking to product areas.

- `frontend/app/(marketing)/pricing/page.tsx`  
  Pricing + plan comparison marketing view.

- `frontend/app/(marketing)/ai-youtube-tools/page.tsx`  
  SEO/AI tools landing page.

- `frontend/app/(marketing)/viral-clips-generator/page.tsx`  
  Clips product landing/SEO page.

- `frontend/app/(marketing)/alternatives/page.tsx`  
  Alternatives/comparison marketing content.

- `frontend/app/(marketing)/blog/page.tsx`  
  Blog index (SSG).

- `frontend/app/(marketing)/blog/[slug]/page.tsx`  
  Blog post renderer with `generateStaticParams`.

- `frontend/app/(marketing)/privacy/page.tsx`  
  Privacy policy.

- `frontend/app/(marketing)/terms/page.tsx`  
  Terms of service.

### Product pages

- `frontend/app/layout.tsx`  
  Root app layout. Global metadata, fonts, GA injection, providers.

- `frontend/app/globals.css`  
  Tailwind base + global styles.

- `frontend/app/page.tsx`  
  Main dashboard/landing gate (auth-aware, routes to onboarding/app).

- `frontend/app/dashboard/page.tsx`  
  Core user dashboard: channel stats, charts, alerts, recent videos.

- `frontend/app/analysis/page.tsx`  
  “Analysis patterns” view (lighter deep insights).

- `frontend/app/deep-analysis/page.tsx`  
  Deep analysis UI. Cache-first load, async job start/poll, tabbed insights.

- `frontend/app/why-it-works/page.tsx`  
  Causal analysis UI (“Why it works”). Cache-first, async job polling.

- `frontend/app/advanced-insights/page.tsx`  
  Advanced causal analysis UI (feature‑gated).

- `frontend/app/optimize/page.tsx`  
  Optimization blueprint + quick wins + next video suggestions.

- `frontend/app/videos/page.tsx`  
  List of user videos with search/sort, links to per‑video view.

- `frontend/app/video/[id]/page.tsx`  
  Per‑video dashboard/editor (title/tags/description suggestions + stats).

- `frontend/app/clips/page.tsx`  
  Viral clips generator UI. Select a video, generate segments, queue renders, poll/SSE.

- `frontend/app/clips/types.ts`  
  Shared TS types for clips flows.

- `frontend/app/clips/components/*`  
  UI building blocks for clips:
  - `ClipCard.tsx`: renders a suggested clip
  - `EditClipModal.tsx`: edit segments/metadata before render
  - `GenerationProgress.tsx`: generation progress UI
  - `SegmentBadge.tsx`: per-segment pill UI
  - `VideoHero.tsx`: selected video header
  - `VideoSelector.tsx`: picker/search list
  - `index.ts`: barrel export.

- `frontend/app/clips/hooks/*`  
  Clips logic hooks:
  - `useClipGeneration.ts`: calls backend suggest/generate endpoints
  - `useRenderQueue.ts`: manages render jobs, status polling, downloads
  - `index.ts`: barrel export.

- `frontend/app/comments/page.tsx`  
  Comment analysis UI (sentiment, questions, ideas).

- `frontend/app/audience/page.tsx`  
  Audience intelligence UI (geo/demographics/devices).

- `frontend/app/traffic/page.tsx`  
  Traffic sources UI.

- `frontend/app/revenue/page.tsx`  
  Revenue/monetization UI.

- `frontend/app/settings/page.tsx`  
  Settings root with nav.

- `frontend/app/settings/profile/page.tsx`  
  Profile edit UI.

- `frontend/app/settings/account/page.tsx`  
  Account management (GDPR export/deletion).

- `frontend/app/settings/billing/page.tsx`  
  Subscription/billing status + portal/checkout links.

- `frontend/app/settings/billing/history/page.tsx`  
  Invoice/history listing.

- `frontend/app/onboarding/page.tsx`  
  First‑run onboarding, plan selection, auth confirmation.

- `frontend/app/waitlist/confirm/page.tsx`  
  Waitlist email confirmation flow via Supabase functions.

### Admin pages (`frontend/app/admin`)

Internal admin UI. Each page uses `/api/admin/*` endpoints.

- `frontend/app/admin/layout.tsx`  
  Admin layout + sidebar + admin access check + impersonation banner.

- `frontend/app/admin/page.tsx`  
  Admin dashboard overview.

- `frontend/app/admin/users/page.tsx`  
  User list, suspend/delete/impersonate actions.

- `frontend/app/admin/users/[id]/page.tsx`  
  Per-user admin detail view + activity.

- `frontend/app/admin/subscriptions/page.tsx`  
  Subscription overrides and usage reset.

- `frontend/app/admin/revenue/page.tsx`  
  MRR, subscriber distribution, churn metrics.

- `frontend/app/admin/api-costs/page.tsx`  
  OpenAI/token cost charts and breakdown.

- `frontend/app/admin/analytics/page.tsx`  
  Internal analytics (feature usage, retention-like signals).

- `frontend/app/admin/activity/page.tsx`  
  Admin audit log UI.

- `frontend/app/admin/seo/page.tsx`  
  SerpBear SEO rank tracking UI (requires SerpBear service configured).

### Metadata/edge routes

- `frontend/app/error.tsx` / `frontend/app/global-error.tsx`  
  Client + global error boundaries.

- `frontend/app/icon.tsx`, `frontend/app/apple-icon.tsx`,
  `frontend/app/opengraph-image.tsx`, `frontend/app/twitter-image.tsx`  
  Dynamic OG/icon image generators.

- `frontend/app/robots.ts`, `frontend/app/sitemap.ts`  
  Robots and sitemap generators.

## Components (`frontend/components`)

Reusable UI pieces.

- `frontend/components/layout/DashboardLayout.tsx`  
  Main signed-in layout wrapper + top/bottom chrome.

- `frontend/components/layout/Sidebar.tsx`  
  App navigation sidebar.

- `frontend/components/providers/ErrorProvider.tsx`  
  Toast/error reporting provider.

- `frontend/components/dashboard/*`  
  Dashboard widgets:
  stat cards, charts, alerts panel, health score, viral radar, skeleton loaders, etc.

- `frontend/components/billing/*`  
  Plan cards/badges and usage bars for billing UI.

- `frontend/components/landing/*`  
  Landing page sections: hero, features tabs, FAQ, pricing CTA, testimonials, waitlist form.

- `frontend/components/marketing/*`  
  Marketing header/footer and exports.

- `frontend/components/video/*`  
  Video editors: title/tags/description AI-assisted forms + preview.

- `frontend/components/seo/*`  
  JSON‑LD generators and exports for SEO pages.

- `frontend/components/ui/*`  
  Small primitives like Logo and TrendIndicator.

- `frontend/components/AIChatPopup.tsx` / `frontend/components/ConditionalAIChatPopup.tsx`  
  Embedded AI chat UI and conditional wrapper.

## Hooks (`frontend/hooks`)

- `frontend/hooks/useAuth.ts`  
  Auth status polling + login/logout helpers. Redirects when `requireAuth=true`.

- `frontend/hooks/useDashboardData.ts`  
  Shared data loader for dashboard-style pages (parallel API calls, caching in state).

## Lib (`frontend/lib`)

- `frontend/lib/api.ts`  
  Central `ApiClient`. Adds `credentials: "include"` and wraps all backend calls.

- `frontend/lib/config.ts`  
  Base API URL resolver + endpoint constant objects for all domains.

- `frontend/lib/utils.ts`  
  Formatting and helper utilities (numbers, dates, classes).

- `frontend/lib/blog.ts`  
  Blog post metadata + loader for SSG blog pages.

- `frontend/lib/supabase.ts`  
  Minimal Supabase REST client for waitlist signup/confirmation.

