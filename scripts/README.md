# scripts

Dev/ops helpers.

- `seed_states.py` (TODO) — load the 50 states + territories (FIPS/abbr/name).
- `check_schema_parity.py` (TODO) — diff `mimir_ingest/db.py` SQLAlchemy models
  against `packages/db/schema.prisma`; fail CI on drift.
- `source_health.py` (TODO) — ping each source API and report reachability + latency.

Keep scripts idempotent and safe to run against a fresh database.
