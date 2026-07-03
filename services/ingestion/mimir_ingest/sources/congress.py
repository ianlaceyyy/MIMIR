"""Congress.gov source — current members, sponsored/cosponsored bills, and votes.

Authoritative legislative source. API docs: https://api.congress.gov/  (real-time).
Feeds incumbent identity (bioguideId), Bill / BillSponsorship, and Vote records.
"""

from __future__ import annotations

from typing import Any, Iterable

from .base import Record, RunContext, Source, SourceKind, SourceRef

CONGRESS_BASE = "https://api.congress.gov/v3"
SOURCE_NAME = "Congress.gov"


def _ref(url: str) -> SourceRef:
    return SourceRef(kind=SourceKind.CONGRESS, name=SOURCE_NAME, url=url)


class CongressSource(Source):
    kind = SourceKind.CONGRESS

    def fetch(self, ctx: RunContext) -> Iterable[dict[str, Any]]:
        """TODO: pull members, then per member their sponsored/cosponsored bills
        (/member/{bioguideId}/sponsored-legislation) and roll-call votes."""
        return []

    def normalize(self, raw: dict[str, Any]) -> list[Record]:
        """Map a bill payload -> Bill (+ BillSponsorship) records.

        Votes are emitted as Vote records keyed on
        (chamber, congress, session, rollNumber, candidateId).
        """
        # TODO: branch on payload type (member | bill | vote) and emit accordingly.
        _ = _ref
        return []


def get_source() -> CongressSource:
    return CongressSource()
