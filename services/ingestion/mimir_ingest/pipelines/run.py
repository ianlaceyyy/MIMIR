"""CLI entrypoint: run one source (or all) for a cycle.

    python -m mimir_ingest.pipelines.run --source fec --cycle 2026 --dry-run
    python -m mimir_ingest.pipelines.run --all --cycle 2026
"""

from __future__ import annotations

import argparse
import logging

from ..config import settings
from ..db import upsert_records
from ..sources import REGISTRY
from ..sources.base import RunContext

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("mimir.ingest")


def run_source(name: str, ctx: RunContext) -> int:
    module = REGISTRY.get(name)
    if module is None:
        raise SystemExit(f"Unknown source '{name}'. Known: {', '.join(REGISTRY)}")
    source = module.get_source()  # type: ignore[attr-defined]

    total = 0
    for raw in source.fetch(ctx):
        records = source.normalize(raw)
        total += upsert_records(records, dry_run=ctx.dry_run)
    log.info("source=%s cycle=%s upserted=%d dry_run=%s", name, ctx.cycle, total, ctx.dry_run)
    return total


def main() -> None:
    parser = argparse.ArgumentParser(description="Mímir ingestion runner")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--source", help=f"one of: {', '.join(REGISTRY)}")
    group.add_argument("--all", action="store_true", help="run every registered source")
    parser.add_argument("--cycle", type=int, default=settings.cycle)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    ctx = RunContext(cycle=args.cycle, dry_run=args.dry_run)
    sources = list(REGISTRY) if args.all else [args.source]
    grand_total = sum(run_source(name, ctx) for name in sources)
    log.info("done: %d records across %d source(s)", grand_total, len(sources))


if __name__ == "__main__":
    main()
