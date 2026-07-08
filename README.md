# Panthers Partner Finder — Discord Audience Affinity

An internal tool for the Carolina Panthers partnerships team. It uses the
[Qloo Taste AI API](https://docs.qloo.com) to build a shortlist of brands, games,
shows, and podcasts whose audiences over-index with a Discord-like taste profile,
biased toward the Carolinas market.

**Why this approach:** Qloo's knowledge graph covers taste domains (brands, video
games, movies/TV, music, books, places) — it has no "NFL team" entity type. So
instead of querying "Carolina Panthers" directly, the app anchors on Discord as a
Qloo brand entity, plus a location signal (default: Charlotte, NC) and an age-range
skew (default: under 36, Discord's core demographic), and asks Qloo's Insights API
to rank other entities by affinity to that combined taste profile. The output is a
sponsorship / co-marketing candidate list, not a guaranteed partnership fit — treat
it as a research aid for the partnerships team, not a final answer.

## How it works

1. `POST /api/partners` resolves the anchor brand (default `"Discord"`) to a Qloo
   entity via `/search`.
2. It then calls Qloo's `/v2/insights` once per selected category (brands, video
   games, TV shows, podcasts, artists, movies, books), passing the anchor entity as
   `signal.interests.entities`, plus the location and age-range signals.
3. Results across categories are merged, sorted by affinity score, and rendered as
   cards with affinity %, popularity, and taste tags.

All Qloo calls happen server-side (`lib/qloo.ts`, marked `server-only`) so the API
key never reaches the browser.

## Getting Started

1. Install dependencies (already done if you just cloned this):
   ```bash
   npm install
   ```
2. Copy the env template and add your Qloo API key:
   ```bash
   cp .env.local.example .env.local
   # then edit .env.local and set QLOO_API_KEY=...
   ```
3. Run the dev server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000).

Without a valid `QLOO_API_KEY`, the form will load but searches will return a clear
error explaining the key is missing — no mock data is used.

## Deploying on Vercel

1. Push this project to a GitHub/GitLab/Bitbucket repo (or use `vercel` CLI directly
   from this folder).
2. In the [Vercel dashboard](https://vercel.com/new), import the repo (Framework
   Preset: Next.js — auto-detected).
3. Under **Project Settings → Environment Variables**, add:
   - `QLOO_API_KEY` — your Qloo API key (required)
   - `QLOO_API_BASE` — only if you need to override the default
     `https://api.qloo.com`
4. Deploy. No other configuration is required — the app has no database.

Or from the CLI, after `npm install -g vercel`:

```bash
vercel        # first deploy, links the project
vercel env add QLOO_API_KEY
vercel --prod
```

## Project structure

- `app/page.tsx` — the search form + results UI (client component).
- `app/api/partners/route.ts` — server route that resolves the anchor entity and
  fans out to Qloo Insights per category.
- `lib/qloo.ts` — thin server-only Qloo API client (`/search`, `/v2/insights`).
- `lib/constants.ts` — shared dropdown/category options and defaults.

## Extending

- **Compare view**: Qloo's `/v2/analysis/compare` can compare two entity groups
  (e.g. Discord vs. a shortlisted candidate) to show shared/differentiating tags —
  useful for a one-pager on *why* a specific partner fits.
- **Shortlisting/export**: persist selected candidates client-side (or to a small
  DB) and add a CSV export for the partnerships team to share externally.
- **Custom tags/audiences**: `/v2/tags` and `/v2/audiences` can resolve richer
  signals (e.g. "esports," "streaming") to blend in alongside the Discord anchor.
