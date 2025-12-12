# V1 Blueprint — Conservative YouTube Change Review SaaS

TubeGrow V1 is a **conservative review system** for YouTube teams. It reviews proposed changes and helps prevent regressions. It is **not** a chatbot, not a general “AI assistant”, and not a VidIQ competitor.

## Product Philosophy (V1 Constitution)

Non‑negotiables:
- Default stance is **“do not change”**: `warn`/`block` should be more common than `approve`.
- **Event‑driven**: work happens on user actions + discrete events, not constant polling.
- **Not a growth tool**: V1 does not chase keywords, score SEO, or generate “100 ideas”.
- **Institutional memory** over conversation: the system remembers channel baselines and review history.

## V1 = Three Actions Only

1) **Connect Channel (async)**  
   Authorize YouTube, enqueue ingestion, and build/update Channel Memory in the background.

2) **Review Proposed Change**  
   Given a “current vs proposed” edit for a video (title/description), return a strict verdict and minimal suggestion.

3) **Change Log**  
   A durable record of reviews and their later outcomes (if evaluated).

Everything else is V2+ or removed.

## Review Action Contract (Plain English)

The Review action accepts a *single proposed edit* to a single YouTube video and returns a conservative decision.

### Input (what the client must send)
- `channel_id`: the connected YouTube channel ID.
- `video_id`: the target YouTube video ID.
- `current_title` / `current_description`: the current text.
- `proposed_title` / `proposed_description`: the proposed replacement text.

### Output (what the server must return)
- `verdict`: one of `approve`, `warn`, `block`.
- `risk_level`: one of `low`, `medium`, `high`.
- `reasons`: 1–3 short, plain‑English reasons (max 3).
- `confidence`: one of `low`, `medium`, `high`.
- `conservative_suggestion` (optional): the smallest safe edit, if any (no rewrites, no variants).
- `metadata` (optional): a *small* structured payload (e.g., “compared against format baseline X”).

Rules:
- No extra fields. No “chatty” prose. No long explanations.
- If uncertain, prefer `warn` and keep the suggestion minimal or omit it.

## Token Discipline + Caching

V1 treats LLM usage as a scarce resource.
- The “conversation” is not the product; **Channel Memory** and **Change Log** are.
- Expensive analysis runs **only on events** (connect, explicit rebuild, review request, scheduled outcome evaluation).
- Review-time calls should rely on cached memory/baselines; avoid recomputing “whole channel” analysis.

## UI Flow (Calm, Minimal)

`Risk Queue` → `Review Screen` → `Change Log`

- Risk Queue: items needing review or follow‑up.
- Review Screen: show current vs proposed + strict review output.
- Change Log: searchable history + outcome status (no dashboards, no gamification).
