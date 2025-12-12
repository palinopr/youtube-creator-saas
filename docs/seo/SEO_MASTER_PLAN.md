# TubeGrow SEO Master Plan (Dec 2025)

This is the single source of truth for how TubeGrow will win Google + LLM search.
It records our strategy, constraints, execution roadmap, and a running progress log.

**Context**
- Date context for all content: **December 2025**.
- Product status: **waitlist‑only early access** (no public pricing yet).
- Truthfulness rule: **never claim features not actually live** on public pages. Future capabilities go only in roadmap/founder posts labeled “coming in beta”.
- Domain canon: `https://www.tubegrow.io` (no‑www 301 → www).

---

## 1. North Star

Rank top 3 for all high‑intent search and AI‑search queries in our real feature space:
- AI YouTube analytics & insights
- YouTube SEO optimization (titles/descriptions/tags, keyword research)
- AI assistant for creators
- Viral clips / Shorts generation

We win by building **topical authority at scale**, powered by real product outputs, not SEO hacks.

---

## 2. What We Actually Do (Pillars)

Everything we ship or publish must map to one of these 4 pillars:

1. **AI YouTube Analytics Tool**
   - Real‑time channel metrics
   - Video performance dashboards
   - Deep/channel pattern analysis
   - Audience, traffic, revenue insights
2. **AI YouTube SEO Tool**
   - SEO scoring + recommendations per video
   - Optimized title/description/tags generation
   - Competitor‑video keyword research
3. **AI Assistant for Creators**
   - Natural‑language chat over channel + video data
   - Actionable recommendations (what to do next)
4. **Viral Clips / Shorts Generator**
   - Viral moment detection from transcripts
   - Clip suggestions with timestamps + viral score
   - Shorts workflows

Public pillars already live:
- `/features`
- `/ai-youtube-tools`
- `/viral-clips-generator`
- `/alternatives`
- `/blog`

Planned pillars to add:
- `/youtube-analytics-tool`
- `/youtube-seo-tool`

---

## 3. Keyword Strategy

### 3.1 Pillar (BOFU) keywords
We prioritize high‑intent terms that match our features:
- `youtube analytics tool`, `youtube channel analytics`, `youtube analytics dashboard`
- `youtube seo tool`, `youtube seo optimizer`, `youtube seo analysis`
- `youtube title generator`, `youtube title optimizer`
- `youtube description generator`
- `youtube tags generator`, `best youtube tags`
- `youtube keyword research tool`
- `viral clips generator`, `youtube shorts generator`, `youtube clips generator`
- `turn long videos into shorts`, `youtube to shorts`
- `ai youtube tools`, `ai tools for youtube creators`, `ai youtube assistant`

### 3.2 Comparison (MOFU) keywords
We already have a valid comparison page:
- `vidiq alternative`
- `tubebuddy alternative`
- `vidiq vs tubebuddy`

### 3.3 TOFU clusters (blog)
Each TOFU post links to a pillar + niche hub:

Analytics/Growth:
- `how to use youtube analytics`
- `best time to post on youtube`
- `how to grow a youtube channel`
- `increase youtube ctr`
- `improve audience retention youtube`

SEO:
- `youtube seo tips`
- `how to rank youtube videos`
- `best keywords for youtube videos`
- `how to write a youtube description`
- `how to choose youtube tags`

Shorts/Clips:
- `how to make youtube shorts from long videos`
- `best shorts hooks`
- `how to find viral moments`
- `podcast clips generator`

---

## 4. Information Architecture (Scale Without Penalties)

### 4.1 Pillar pages
One “best” landing page per pillar. Each must include:
- Clear H1 + ≤70‑char title
- 800–1500 words of real, useful copy
- Screenshots/workflows from the actual product
- FAQ + `FAQPage` schema
- Strong internal links

### 4.2 Niche hubs (MOFU)
Create `/niches` hub and first 10 niches (largest creator bases):
- Gaming, Fitness, Finance, Tech/AI, Education, Cooking, Beauty/Lifestyle, Music, Entertainment/Reactions, Podcasts.

Each niche page must contain:
- A niche‑specific “how TubeGrow helps” workflow
- Real AI‑generated examples (titles/tags/Shorts hooks)
- Links to: pillar pages + 3–5 niche guides.

### 4.3 Programmatic topic families
Safe programmatic pages (not cities/doorways) powered by our real agents:
- `/niches/{niche}/youtube-seo`
- `/niches/{niche}/shorts-strategy`
- `/topics/{topic}/youtube-keywords`

Quality gate:
- 300–600 unique words
- 3–5 generated examples
- 5+ internal links
- If we can’t make a page meaningfully unique, we don’t ship it.

---

## 5. Link Magnets + Backlinks

We earn links via public tools that preview real capabilities:

1. Free **YouTube SEO Score + Fixes**
2. Free **Title/Description/Tags Generator**
3. Free **Shorts Clip Finder Lite**
4. Free **Channel Snapshot**

Each tool:
- No login required for preview.
- CTA: “Join waitlist for full access.”
- Gets a dedicated landing page + schema.

Live lite tools:
- `/tools/youtube-seo-score`
- `/tools/youtube-metadata-generator`
- `/tools/shorts-clip-finder`
- `/tools/youtube-channel-snapshot`

Backlink cadence:
- 1 tool launch/month → PR push to creator newsletters, AI tool directories, YouTube growth blogs, “VidIQ alternative” roundups.
- Target: 5–10 relevant backlinks/month.

---

## 6. LLM/AI Search Strategy

- Keep `public/llms.txt` updated with pillars, tools, and best guides.
- Add FAQ + structured data to pillars and niche hubs.
- When ready, add a crawlable `/docs` area explaining workflows and outputs.
- Avoid hidden/blocked content being referenced in llms.txt.

---

## 7. Technical SEO Checklist (Always On)

Must stay green:
- All marketing + blog routes return `200` and have canonical URLs.
- `robots.txt` blocks app/admin routes only.
- `sitemap.xml` includes only indexable final URLs.
- No pricing routes or claims while waitlist‑only.
- Titles ≤70 chars, one H1 per page.
- No broken internal links.
- `llms.txt` passes spec.

Expected Semrush warnings we ignore:
- Low text‑to‑HTML ratio (modern Next.js behavior).

### 7.1 Reporting setup (internal)

We track SEO impact with weekly GA4 + Search Console pulls (internal only) using the local CLI at `backend/scripts/seo_report.py`.

**Environment keys** (store locally in `backend/.env`, never commit):
- `SEO_OAUTH_CLIENT_ID`
- `SEO_OAUTH_CLIENT_SECRET`
- `SEO_OAUTH_CLIENT_JSON_PATH` (path to Desktop OAuth JSON)
- `GA4_PROPERTY_ID`
- `GSC_PROPERTY`
- Optional: `SEO_OAUTH_TOKEN_PATH` (defaults to `backend/.cache/seo-token.json`)

**How the CLI works**
1. Loads `backend/.env`, reads the OAuth JSON path + GA4/GSC targets.
2. First run opens a browser consent (Desktop OAuth). After you approve, tokens cache to `backend/.cache/seo-token.json`.
3. Pulls:
   - GA4 totals for last `--ga4-days` (default 7): sessions, activeUsers, newUsers, engagedSessions.
   - GA4 sessions by channel + top organic landing pages.
   - Search Console totals for last `--gsc-days` (default 28) + top queries + top pages.
4. Outputs Markdown by default, or raw JSON with `--json`. Use `--out` to write a file.

**Run (local)**
`backend/venv/bin/python backend/scripts/seo_report.py --out docs/seo/reports/2025-12-12.md`

Flags:
- `--ga4-days N`
- `--gsc-days N`
- `--json`
- `--out path`

**Security**
- Never commit the OAuth JSON, cached token, or reports containing private metrics.

---

## 8. Execution Timeline

**Weeks 1–2**
- Add `/youtube-analytics-tool` pillar.
- Add `/youtube-seo-tool` pillar.
- Add `/niches` hub + 10 niche pages.

**Weeks 3–6**
- Ship 2 free tools + landing pages.
- Publish 20–30 niche TOFU guides.
- Reinforce internal linking.

**Weeks 7–12**
- Expand to 50+ niche/topic pages.
- Publish 100+ guides total.
- Run PR pushes monthly.

Ongoing:
- 2 guides/week minimum.
- 1 new niche/topic page/week.
- 1 free tool/month until 4 shipped.

---

## 9. Progress Tracking

### 9.1 Current status (Dec 12, 2025)

**Technical SEO**
- [x] Sitemap clean and dynamic.
- [x] Robots blocks app/admin routes.
- [x] Blog slugs fixed (no 4xx).
- [x] Titles trimmed on marketing pages.
- [x] H1 hierarchy fixed on blog posts.
- [x] Pricing removed from marketing UI.
- [x] `llms.txt` added and converted to spec format.
- [x] Canonical host aligned to `www`.
- [ ] Add canonical for no‑www orphan if Semrush persists (monitor).

**Content**
- [x] Pillar pages live: `/features`, `/ai-youtube-tools`, `/viral-clips-generator`, `/alternatives`.
- [x] 7 initial long‑form blog posts live.
- [x] Add `/youtube-analytics-tool`.
- [x] Add `/youtube-seo-tool`.
- [x] Add `/niches` hub.
- [x] Add first 10 niches.

**Link Magnets**
- [x] Free SEO score checker (lite).
- [x] Free metadata generator (lite).
- [x] Free Shorts clip finder lite.
- [x] Free channel snapshot (lite).

### 9.2 Running log

Add entries with date + outcome.

| Date (2025) | Change | Outcome |
|---|---|---|
| Dec 11–12 | Fixed 4xx blog slugs, canonicals, removed pricing, llms.txt, H1 cleanup | Semrush errors → only expected warnings |
| Dec 12 | Trim env‑newline malformed login URL, llms spec rewrite, blog title vs H1 fix | Crawl error removed, AI‑search spec compliant |
| Dec 12 | Shipped analytics/SEO pillars, niches hub + 10 niches, and 4 lite link‑magnet tools | IA expanded, link magnets live for outreach |
| Dec 12 | Added webmanifest + fixed OG/Twitter/icon URLs; tightened AI-tools + clips claims to current features; added SEO checklist post | Reduced 404 noise, improved internal linking + trust, expanded SEO coverage |
| Dec 12 | Added landing “Resources” section, fixed support email, and published Shorts analytics + tag generator posts | More internal links to tools/posts, more TOFU coverage for tracked keywords |
| Dec 12 | Removed “free plan”/vanity stats claims from marketing pages (About/Features) | Copy now matches waitlist‑only status |

---

## 10. How We Update This Doc

- Every SEO‑relevant PR adds a short line to **9.2 Running log**.
- Every week we update **9.1 Current status**.
- If scope changes (new pillar, new tool), update sections 2–8 first, then tracking.
