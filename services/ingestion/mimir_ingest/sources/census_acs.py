"""Census American Community Survey (ACS) source — district demographics.

API docs: https://api.census.gov/data.html  (ACS 5-year, annual). Feeds one
Demographics row per district: median income, population, median age, bachelor's+
share, and veteran share. (race/employment/housing JSON breakdowns are TODO.)

Pulls the districts listed in mimir_ingest/targets.py. Needs CENSUS_API_KEY.
"""

from __future__ import annotations

from typing import Any, Iterable

from ..config import settings
from ..http import get_json
from ..reference.states import BY_ABBR, district_geoid
from ..targets import TARGET_DISTRICTS
from .base import Record, RunContext, Source, SourceKind, SourceRef

ACS_YEAR = 2023  # ACS 5-year vintage (118th Congress districts)
ACS_BASE = f"https://api.census.gov/data/{ACS_YEAR}/acs/acs5"
SOURCE_NAME = "U.S. Census Bureau (ACS)"

# ACS variables we request. Some feed columns directly; others are inputs to a ratio.
_VARS = [
    "B19013_001E",  # median household income
    "B01003_001E",  # total population
    "B01002_001E",  # median age
    "B15003_001E",  # population 25+ (education denominator)
    "B15003_022E",  # bachelor's
    "B15003_023E",  # master's
    "B15003_024E",  # professional degree
    "B15003_025E",  # doctorate
    "B21001_001E",  # civilian pop 18+ (veteran denominator)
    "B21001_002E",  # veterans
]


def _ref(url: str) -> SourceRef:
    return SourceRef(kind=SourceKind.CENSUS, name=SOURCE_NAME, url=url)


def _num(raw: dict[str, Any], key: str) -> float | None:
    """ACS uses large negative sentinels (e.g. -666666666) for missing values."""
    try:
        v = float(raw[key])
    except (KeyError, TypeError, ValueError):
        return None
    return None if v <= -1e6 else v


class CensusAcsSource(Source):
    kind = SourceKind.CENSUS

    def __init__(self, districts: list[tuple[str, int]] | None = None) -> None:
        self.districts = districts or TARGET_DISTRICTS

    def fetch(self, ctx: RunContext) -> Iterable[dict[str, Any]]:
        key = settings.census_api_key
        for state_abbr, number in self.districts:
            fips = BY_ABBR[state_abbr.upper()].fips
            url = (
                f"{ACS_BASE}?get={','.join(_VARS)}"
                f"&for=congressional%20district:{number:02d}&in=state:{fips}"
            )
            data = get_json(f"{url}&key={key}" if key else url)
            header, row = data[0], data[1]
            values = dict(zip(header, row))
            yield {
                "geoid": district_geoid(state_abbr, number),
                "url": url,  # store the key-less URL as the citation
                "values": values,
            }

    def normalize(self, raw: dict[str, Any]) -> list[Record]:
        v = raw["values"]

        median_income = _num(v, "B19013_001E")
        population = _num(v, "B01003_001E")
        median_age = _num(v, "B01002_001E")

        edu_total = _num(v, "B15003_001E")
        bachelors_plus = sum(
            _num(v, k) or 0 for k in ("B15003_022E", "B15003_023E", "B15003_024E", "B15003_025E")
        )
        bachelors_plus_share = (bachelors_plus / edu_total) if edu_total else None

        vet_total = _num(v, "B21001_001E")
        veterans = _num(v, "B21001_002E")
        veteran_share = (veterans / vet_total) if vet_total else None

        return [
            Record(
                entity="Demographics",
                key={"vintage": ACS_YEAR},
                data={
                    "medianIncome": int(median_income) if median_income is not None else None,
                    "population": int(population) if population is not None else None,
                    "medianAge": median_age,
                    "bachelorsPlusShare": round(bachelors_plus_share, 4)
                    if bachelors_plus_share is not None
                    else None,
                    "veteranShare": round(veteran_share, 4) if veteran_share is not None else None,
                },
                source=_ref(raw["url"]),
                refs={"districtId": ("District", {"geoid": raw["geoid"]})},
            )
        ]


def get_source() -> CensusAcsSource:
    return CensusAcsSource()
