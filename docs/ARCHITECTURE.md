# Architecture

Mímir has three moving parts around one database.

```
        ┌──────────────────────────────────────────────────────────────┐
        │                      Authoritative sources                     │
        │  FEC · Congress.gov · Census (TIGER + ACS) · House/Senate      │
        │  clerks · X API · candidate official sites                     │
        └───────────────┬──────────────────────────────────────────────┘
                        │  scheduled pulls (idempotent)
                        ▼
        ┌──────────────────────────────────────────────────────────────┐
        │  services/ingestion  (Python ETL)                              │
        │   sources/*  → normalize → attach SourceRef → upsert           │
        │   classify/  → neutral issue tagging of platform text (LLM)    │
        └───────────────┬──────────────────────────────────────────────┘
                        │  writes
                        ▼
        ┌──────────────────────────────────────────────────────────────┐
        │  Postgres + PostGIS   (schema owned by packages/db/Prisma)     │
        │   District · Seat · Candidate · FinanceSummary · Contribution  │
        │   Platform/IssueStance · Bill · Vote · SocialAccount · Source  │
        └───────────────┬──────────────────────────────────────────────┘
                        │  reads (Prisma client)
                        ▼
        ┌──────────────────────────────────────────────────────────────┐
        │  apps/web  (Next.js, server components)                         │
        │   /  →  /states/[state]  →  /districts/[id]  →  /candidates/[id]│
        └──────────────────────────────────────────────────────────────┘
```

## Components

### `apps/web` — the website
- **Next.js (App Router), React server components, TypeScript, Tailwind.**
- Chosen for SEO (every district/candidate is a crawlable, shareable URL),
  server-side rendering (fast first paint on data-heavy pages), and simple
  co-location of read-only API route handlers.
- Reads the database through the Prisma client in `packages/db`.
- Renders maps from PostGIS district geometry (GeoJSON) via MapLibre.
- Contains **no business logic that mutates data** — the web tier is read-only.

### `services/ingestion` — the ETL
- **Python** (rich ecosystem for gov-data clients, geospatial, and LLM calls).
- One module per source under `sources/`, each exposing a uniform contract:
  `fetch() → normalize() → list[record]`, where every record carries a
  `SourceRef` (source name, URL, retrieval timestamp).
- `pipelines/` orchestrates source → DB upserts; runs are **idempotent** and keyed
  on stable IDs (e.g., FEC `candidate_id`, GEOID, Congress `bioguideId`).
- `classify/` turns free-text candidate platform material into neutral issue
  stances (see `docs/NONPARTISAN_POLICY.md` for the guardrails).
- Scheduled by cron/GitHub Actions at each source's natural cadence.

### `packages/db` — canonical schema
- **Prisma** owns the schema and migrations; this is the single source of truth
  for the data model.
- The Python service connects to the **same** Postgres. To prevent drift, the
  SQLAlchemy models in `mimir_ingest/db.py` are a hand-maintained mirror and the
  CI check `scripts/check_schema_parity.py` (TODO) diffs them against Prisma.

### `packages/shared` — shared types
- TypeScript enums/types (issue categories, party labels, source kinds) shared by
  the web app so UI and API agree on vocabulary.

## Why this split

- **Language fit:** Python for data engineering + geospatial + LLM; TypeScript for
  a fast, SEO-friendly server-rendered site.
- **Blast radius:** ingestion can fail or backfill without touching the live site;
  the site only ever reads already-validated, already-sourced rows.
- **Auditability:** because writes funnel through one ingestion layer, provenance
  (`Source` / `SourceRef`) is attached in exactly one place.

## Data flow guarantees

1. **Provenance is mandatory.** The upsert layer rejects any field-bearing record
   that lacks a `SourceRef`. Un-sourced facts cannot enter the DB.
2. **Freshness is visible.** Every row stores `fetchedAt`; the UI surfaces "as of"
   dates and links back to the origin.
3. **Idempotency.** Re-running a pipeline for a cycle converges to the same rows.

## Deployment (target)

- Web: Vercel or any Node host.
- DB: managed Postgres with PostGIS (e.g., Neon/Supabase/RDS).
- Ingestion: scheduled jobs (GitHub Actions / Cloud Run / cron) writing to the DB.
