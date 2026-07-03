"""U.S. House Clerk source — financial & STOCK Act disclosures.

Reports: https://disclosures-clerk.house.gov/  Feeds Disclosure records
(kind=FINANCIAL | STOCK_ACT). Committee assignments come from Congress.gov.
"""

from __future__ import annotations

from typing import Any, Iterable

from .base import Record, RunContext, Source, SourceKind, SourceRef

CLERK_BASE = "https://disclosures-clerk.house.gov"
SOURCE_NAME = "U.S. House Clerk Financial Disclosure Reports"


def _ref(url: str) -> SourceRef:
    return SourceRef(kind=SourceKind.HOUSE_CLERK, name=SOURCE_NAME, url=url)


class DisclosuresSource(Source):
    kind = SourceKind.HOUSE_CLERK

    def fetch(self, ctx: RunContext) -> Iterable[dict[str, Any]]:
        return []

    def normalize(self, raw: dict[str, Any]) -> list[Record]:
        _ = _ref
        return []


def get_source() -> DisclosuresSource:
    return DisclosuresSource()
