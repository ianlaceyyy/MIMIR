"""Senate Lobbying Disclosure Act (LDA) source — lobbying disclosures.

Database: https://lda.senate.gov/api/  Feeds Disclosure records (kind=LOBBYING).
"""

from __future__ import annotations

from typing import Any, Iterable

from .base import Record, RunContext, Source, SourceKind, SourceRef

LDA_BASE = "https://lda.senate.gov/api/v1"
SOURCE_NAME = "U.S. Senate Lobbying Disclosure Database"


def _ref(url: str) -> SourceRef:
    return SourceRef(kind=SourceKind.SENATE_LDA, name=SOURCE_NAME, url=url)


class LobbyingSource(Source):
    kind = SourceKind.SENATE_LDA

    def fetch(self, ctx: RunContext) -> Iterable[dict[str, Any]]:
        return []

    def normalize(self, raw: dict[str, Any]) -> list[Record]:
        _ = _ref
        return []


def get_source() -> LobbyingSource:
    return LobbyingSource()
