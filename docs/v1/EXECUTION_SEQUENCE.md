# V1 Execution Sequence (PR Order)

Goal: refactor TubeGrow into a conservative **decision‑review** SaaS with only 3 user actions, while minimizing regressions.

Principles:
- Ship in small, reversible PRs.
- Keep the Review output contract strict (bounded fields, conservative defaults).
- Prefer repurposing OAuth/jobs/caches over rewriting infrastructure.

## PR #1 — V1 constitution: docs + strict contracts only

Definition of Done:
- `youtube-saas/docs/v1/V1_BLUEPRINT.md` captures philosophy + the 3 actions + token discipline + UI flow.
- `youtube-saas/docs/v1/REFACTOR_MAP.md` clearly marks keep/repurpose/delete.
- `youtube-saas/docs/v1/EXECUTION_SEQUENCE.md` defines PR#1–PR#5 with DoD.
- Strict contracts exist and are mirrored:
  - `youtube-saas/backend/app/v1/contracts/review.py`
  - `youtube-saas/backend/app/v1/contracts/channel_memory.py`
  - `youtube-saas/backend/app/v1/contracts/change_log.py`
  - `youtube-saas/frontend/lib/contracts/review.ts`
  - `youtube-saas/frontend/lib/contracts/channelMemory.ts`
- **No changes** to DB schema, routers, UI pages, ingestion jobs, or providers.

## PR #2 — Add V1 action surfaces (minimal, bounded)

Definition of Done:
- Introduce V1 “actions” (non-chat) with strict request/response models.
- Add minimal endpoints for:
  - Review Proposed Change (returns the strict review output).
  - Change Log read (returns the strict change log entry list).
- Legacy/SEO/analytics routes remain untouched (no behavior changes outside the new V1 surface).

## PR #3 — Connect Channel (async) + Channel Memory build pipeline

Definition of Done:
- Connecting a channel enqueues a bounded ingestion/build workflow (event-driven).
- Channel Memory is built from cached YouTube snapshots and stored as a durable artifact.
- Rebuilds are idempotent and happen only on events (connect, explicit rebuild, scheduled refresh).

## PR #4 — Change Log persistence + outcome evaluation

Definition of Done:
- Every review is persisted into the Change Log.
- Outcome status is tracked (`unknown|positive|neutral|negative`) with optional `evaluated_at`.
- Outcome evaluation is async and conservative (no dashboards, no “optimization loops”).

## PR #5 — Calm V1 UI + remove/defer non‑V1 features

Definition of Done:
- UI flow matches: `Risk Queue` → `Review Screen` → `Change Log` (calm, minimal).
- Remove/defer out‑of‑scope pages and features (SEO scoring, keyword tools, mass “growth” features, chat).
- Product messaging aligns with V1 truth (review system, not VidIQ, not chatbot).
