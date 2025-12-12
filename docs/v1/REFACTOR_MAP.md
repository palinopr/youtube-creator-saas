# Refactor Map (Keep / Repurpose / Delete)

This map is intentionally blunt: anything not supporting the 3 V1 actions is removed, deferred, or repurposed.

V1 actions only:
1) Connect Channel (async)
2) Review Proposed Change
3) Change Log

## Backend

### Keep (foundation)
- `youtube-saas/backend/app/auth/*` (OAuth + sessions)
- `youtube-saas/backend/app/db/models.py` (users/channels/jobs/caches — no schema changes in PR#1)
- `youtube-saas/backend/app/db/repository.py` (job + cache repositories — no behavior changes in PR#1)
- `youtube-saas/backend/app/workers/*` (background job execution)
- `youtube-saas/backend/app/tools/youtube_api.py`
- `youtube-saas/backend/app/tools/youtube_tools.py`
- `youtube-saas/backend/app/tools/youtube_channel.py`

### Repurpose
- **Agents → Actions**: anything under `youtube-saas/backend/app/agents/*` becomes bounded “actions” with strict input/output.
- `youtube-saas/backend/app/routers/analytics.py` (if kept)
  - Keep only: connect helpers + selecting a review target.
  - Remove: “insights”, “analysis”, “assistant” semantics.
- Public/demo endpoints (if any) under `youtube-saas/backend/app/routers/public_tools.py`
  - Either remove entirely or keep as a **limited demo** that does not imply V1 capabilities.

### Delete / Defer (out of scope for V1)
- Routers:
  - `youtube-saas/backend/app/routers/seo.py`
  - `youtube-saas/backend/app/routers/clips.py`
  - `youtube-saas/backend/app/routers/channel_analysis.py`
  - `youtube-saas/backend/app/routers/audience.py`
  - `youtube-saas/backend/app/routers/traffic.py`
  - `youtube-saas/backend/app/routers/revenue.py`
  - `youtube-saas/backend/app/routers/comments.py`
  - `youtube-saas/backend/app/routers/alerts.py` (defer unless it can be strictly reframed as a Risk Queue)
  - `youtube-saas/backend/app/routers/public_tools.py`
  - `youtube-saas/backend/app/routers/billing.py`
  - `youtube-saas/backend/app/routers/admin.py` (entire admin surface is out of V1 scope)
- Agents/tools:
  - `youtube-saas/backend/app/agents/*` (LangGraph chat agents; replaced by bounded actions)
  - `youtube-saas/backend/app/tools/content_optimizer.py`
  - `youtube-saas/backend/app/tools/deep_analytics.py`
  - `youtube-saas/backend/app/tools/causal_analytics.py`
  - `youtube-saas/backend/app/tools/clips_generator.py`
  - `youtube-saas/backend/app/tools/description_generator.py`
- Services:
  - `youtube-saas/backend/app/services/serpbear.py`

## Frontend

### Keep (foundation)
- `youtube-saas/frontend/app/layout.tsx`, `youtube-saas/frontend/app/globals.css` (base shell)
- Shared UI components in `youtube-saas/frontend/components/*` (repurpose into calm screens)

### Repurpose
- Any “assistant/chat” UI becomes a **review form** + **review result** (no conversational loop).
- Marketing “tools” pages become either:
  - removed, or
  - a limited demo that does not misrepresent V1.

### Delete / Defer (out of scope for V1)
- In-app dashboards and “insights”:
  - `youtube-saas/frontend/app/command-center/page.tsx`
  - `youtube-saas/frontend/app/dashboard/page.tsx`
  - `youtube-saas/frontend/app/analysis/page.tsx`
  - `youtube-saas/frontend/app/deep-analysis/page.tsx`
  - `youtube-saas/frontend/app/advanced-insights/page.tsx`
  - `youtube-saas/frontend/app/why-it-works/page.tsx`
  - `youtube-saas/frontend/app/audience/page.tsx`
  - `youtube-saas/frontend/app/traffic/page.tsx`
  - `youtube-saas/frontend/app/revenue/page.tsx`
  - `youtube-saas/frontend/app/comments/page.tsx`
- SEO + tools + growth marketing pages:
  - `youtube-saas/frontend/app/optimize/page.tsx`
  - `youtube-saas/frontend/app/(marketing)/*` (most will be removed or rewritten to match the new product truth)
  - `youtube-saas/frontend/app/rss.xml/route.ts`, `youtube-saas/frontend/app/sitemap.ts` (only keep if the new product needs them; V1 doesn’t)
- Clips UI:
  - `youtube-saas/frontend/app/clips/*`
- Billing UI:
  - `youtube-saas/frontend/app/settings/billing/page.tsx`
- Any “AI chat popup”:
  - `youtube-saas/frontend/components/AIChatPopup.tsx` (delete)

## Non-app directories (recommendation)
- `viral-learning/` and `serpbear/` are out of scope; archive or remove once the review product is the only focus.
