# mimir-ingest

The ETL service. Pulls each dataset from its authoritative source, normalizes it,
attaches provenance (`SourceRef`), and upserts it into the Postgres database whose
schema is owned by `packages/db/schema.prisma`.

## Design contract

Every source module in `mimir_ingest/sources/` implements `Source`:

```python
class Source(Protocol):
    kind: SourceKind
    def fetch(self, ctx: RunContext) -> Iterable[Raw]: ...
    def normalize(self, raw: Raw) -> list[Record]: ...   # each Record carries a SourceRef
```

Pipelines in `mimir_ingest/pipelines/` wire `fetch → normalize → upsert`. The upsert
layer (`db.py`) **rejects any fact-bearing record without a `SourceRef`** — this is how
provenance stays mandatory.

## Idempotency

Upserts key on stable external IDs (FEC `candidate_id`, Census `GEOID`, Congress
`bioguideId`, bill `(congress, type, number)`), so re-running a pipeline converges to
the same rows.

## Running

```bash
uv sync                                            # or pip install -e '.[dev]'
python -m mimir_ingest.pipelines.run --source fec --cycle 2026 --dry-run
python -m mimir_ingest.pipelines.run --all --cycle 2026
```

## Scheduling (target cadence)

| Pipeline | Cadence | Source |
| --- | --- | --- |
| districts / demographics | annual | Census TIGER + ACS |
| candidates / seats | daily | FEC |
| finance / donations | nightly | FEC |
| bills / votes | on change (poll hourly) | Congress.gov |
| platforms | on change (crawl weekly) | campaign sites + classifier |
| social | live (poll) | X API |

Run via GitHub Actions / Cloud Run cron. See `docs/ARCHITECTURE.md`.
