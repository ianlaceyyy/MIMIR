# Mímir

**A non-partisan civic-information platform that catalogs U.S. elections by district
and gives voters a clear, sourced overview of every candidate running for a seat.**

> In Norse myth, Mímir guards the well of wisdom at the roots of Yggdrasil. This
> project is a well voters can draw from: verifiable facts about who is on their
> ballot, drawn only from primary, authoritative sources.

---

## What it does

1. **Catalogs elections by district.** Browse by state → district → the seat up for
   election. Every congressional district is a first-class page with the incumbent,
   partisan lean, demographics, and a district map.
2. **Lists every candidate for that seat.** Each district page shows all candidates
   running, with the structured profile described in [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md):
   biography, campaign finance, platform/issues, legislative record (for incumbents),
   voting record, and social presence.
3. **Gives voters an at-a-glance overview.** Candidate cards summarize candidacy in a
   scannable, comparable format so a voter can understand their choices in minutes.
4. **Ships as a website.** Server-rendered (Next.js) for speed, SEO, and shareable
   per-candidate / per-district URLs.
5. **Uses only credible sources.** Every fact is traceable to a primary government
   source (FEC, Congress.gov, U.S. Census, House/Senate clerks) or the candidate's own
   official material. Provenance is stored per-field and shown in the UI. See
   [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md).
6. **Is strictly non-partisan.** No endorsements, no editorial scoring, no ranking of
   candidates. Presentation is identical and order is neutral for every candidate. See
   [`docs/NONPARTISAN_POLICY.md`](docs/NONPARTISAN_POLICY.md).

## Repository layout

```
mimir/
├── apps/
│   └── web/            Next.js website (voter-facing UI + read API)
├── services/
│   └── ingestion/      Python ETL: pulls, normalizes, and sources every dataset
├── packages/
│   ├── db/             Prisma schema — canonical data model + migrations
│   └── shared/         Shared TypeScript types (mirror of the data model)
├── docs/               Architecture, data model, source list, non-partisan policy
├── scripts/            Dev/ops helpers (seed, backfill, source-health checks)
└── docker-compose.yml  Local Postgres + PostGIS
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full picture.

## Data sources at a glance

| Domain | Primary source | API | Cadence |
| --- | --- | --- | --- |
| District boundaries | U.S. Census TIGER/Line | ✓ | Annual |
| Seats up / candidate roster | FEC API | ✓ | Daily |
| Campaign finance & donations | FEC API | ✓ | Nightly |
| Bills, sponsorship, votes | Congress.gov API | ✓ | Real-time |
| District demographics | Census ACS API | ✓ | Annual |
| Candidate platforms | Official campaign sites (crawled) | — | On change |
| Social posts | X API | ✓ | Live |
| Lobbying / financial disclosures | Senate LDA, House Clerk | partial | Periodic |

Full reliability notes and endpoint details live in [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md).

## Getting started (local)

> ⚠️ Scaffold status: this repo is a codebase *structure*. Modules are stubbed with
> clear contracts and TODOs; ingestion does not yet pull live data.

```bash
# 1. Start Postgres + PostGIS
docker compose up -d

# 2. Web app
cd apps/web
cp ../../.env.example .env
pnpm install
pnpm prisma migrate dev        # applies packages/db/schema.prisma
pnpm dev                       # http://localhost:3000

# 3. Ingestion service
cd services/ingestion
cp ../../.env.example .env
uv sync                        # or: pip install -e .
python -m mimir_ingest.pipelines.run --source fec --dry-run
```

## Guiding principles

- **Primary sources only.** If a fact can't be traced to an authoritative source, it
  doesn't ship. Every field carries a `SourceRef`.
- **Neutral by construction.** Non-partisanship is enforced in the data model and UI,
  not left to editorial discretion. See [`docs/NONPARTISAN_POLICY.md`](docs/NONPARTISAN_POLICY.md).
- **Transparent freshness.** Every record shows when it was fetched and from where.
- **Reproducible.** Ingestion is idempotent; re-running a pipeline yields the same
  normalized rows.

## License

TBD (pending review).
