"""Database access for ingestion — the write side.

Prisma (packages/db/schema.prisma) OWNS the schema and migrations. This module is a
hand-maintained mirror used only for writes; scripts/check_schema_parity.py (TODO)
diffs it against the Prisma schema in CI to catch drift.

Central invariant enforced here: `upsert_records()` REJECTS any record without a
SourceRef, so un-sourced facts can never enter the database.
"""

from __future__ import annotations

from collections.abc import Iterable

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from .config import settings
from .sources.base import Record

engine = create_engine(settings.database_url or "postgresql://localhost/mimir", future=True)
SessionLocal = sessionmaker(bind=engine, class_=Session, expire_on_commit=False)


class MissingSourceError(ValueError):
    """Raised when a fact-bearing record arrives without provenance."""


def upsert_records(records: Iterable[Record], *, dry_run: bool = False) -> int:
    """Idempotently upsert records keyed on their stable external ids.

    Every record MUST carry a SourceRef; the SourceRef is persisted and linked so the
    web UI can cite the origin and 'as of' date for the value.
    """
    count = 0
    for rec in records:
        if rec.source is None:
            raise MissingSourceError(f"{rec.entity} {rec.key} has no SourceRef")
        count += 1
        if dry_run:
            continue
        # TODO: 1) upsert Source (unique on kind+name) and insert a SourceRef row;
        #       2) upsert the target `rec.entity` row on `rec.key` with `rec.data`,
        #          attaching the SourceRef id.
        # Implement per-entity SQLAlchemy Core statements or ON CONFLICT upserts.
    return count
