"""Core contracts shared by every source module.

The key invariant: a `Record` cannot exist without a `SourceRef`. This is what makes
provenance mandatory across the whole pipeline.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Iterable, Protocol, runtime_checkable


class SourceKind(str, Enum):
    FEC = "FEC"
    CONGRESS = "CONGRESS"
    CENSUS = "CENSUS"
    X = "X"
    CAMPAIGN_SITE = "CAMPAIGN_SITE"
    HOUSE_CLERK = "HOUSE_CLERK"
    SENATE_LDA = "SENATE_LDA"
    MIT_ELECTION_LAB = "MIT_ELECTION_LAB"


@dataclass(frozen=True)
class SourceRef:
    """Exact origin of a value: which source, which URL, when fetched."""

    kind: SourceKind
    name: str
    url: str
    fetched_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class Record:
    """A normalized row ready to upsert.

    `entity` is the target table (e.g. "Candidate", "District"); `key` holds the
    stable external id(s) used for idempotent upsert; `data` is the column payload.
    `source` is REQUIRED — the upsert layer rejects records without it.
    """

    entity: str
    key: dict[str, Any]
    data: dict[str, Any]
    source: SourceRef

    def __post_init__(self) -> None:
        if self.source is None:  # pragma: no cover - defensive
            raise ValueError(f"{self.entity} record is missing a SourceRef")


@dataclass
class RunContext:
    cycle: int
    dry_run: bool = False


@runtime_checkable
class Source(Protocol):
    kind: SourceKind

    def fetch(self, ctx: RunContext) -> Iterable[Any]:
        """Yield raw payloads from the upstream API/crawl."""
        ...

    def normalize(self, raw: Any) -> list[Record]:
        """Turn one raw payload into normalized Records (each with a SourceRef)."""
        ...
