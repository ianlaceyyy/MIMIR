"""Census American Community Survey (ACS) source — district demographics.

API docs: https://api.census.gov/data.html  (annual). Feeds the Demographics table:
median income, education, race, age, population, employment, housing, internet access,
veteran %, urban/rural, and sector shares (manufacturing, agriculture, energy).
"""

from __future__ import annotations

from typing import Any, Iterable

from .base import Record, RunContext, Source, SourceKind, SourceRef

ACS_BASE = "https://api.census.gov/data"
SOURCE_NAME = "U.S. Census Bureau (ACS)"

# ACS variable codes -> our fields. Extend as demographics coverage grows.
ACS_VARIABLES = {
    "B19013_001E": "medianIncome",
    "B01003_001E": "population",
    "B01002_001E": "medianAge",
}


def _ref(url: str) -> SourceRef:
    return SourceRef(kind=SourceKind.CENSUS, name=SOURCE_NAME, url=url)


class CensusAcsSource(Source):
    kind = SourceKind.CENSUS

    def fetch(self, ctx: RunContext) -> Iterable[dict[str, Any]]:
        """TODO: GET /{vintage}/acs/acs5?get=<vars>&for=congressional+district:*"""
        return []

    def normalize(self, raw: dict[str, Any]) -> list[Record]:
        """Map an ACS row -> one Demographics record for a district GEOID."""
        # TODO: translate ACS_VARIABLES and build the GEOID key.
        _ = (_ref, ACS_VARIABLES)
        return []


def get_source() -> CensusAcsSource:
    return CensusAcsSource()
