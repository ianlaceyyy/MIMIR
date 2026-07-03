"""The congressional districts Mímir ingests.

One place to control coverage: every source (FEC roster, Census demographics, …) reads
this list, so changing it here changes what all sources pull on the next run.

By default this is ALL 435 U.S. House districts (119th Congress apportionment, in
effect for the 2024 and 2026 elections). Set MIMIR_DISTRICTS in the environment to a
comma-separated list like "IL-13,NY-3" to ingest just a subset (useful for testing).
Each tuple is (state USPS abbr, district number); at-large districts use 0.
"""

from __future__ import annotations

import os

# House seats per state, 119th Congress (2020 Census apportionment). Sums to 435.
DISTRICT_COUNTS: dict[str, int] = {
    "AL": 7, "AK": 1, "AZ": 9, "AR": 4, "CA": 52, "CO": 8, "CT": 5, "DE": 1,
    "FL": 28, "GA": 14, "HI": 2, "ID": 2, "IL": 17, "IN": 9, "IA": 4, "KS": 4,
    "KY": 6, "LA": 6, "ME": 2, "MD": 8, "MA": 9, "MI": 13, "MN": 8, "MS": 4,
    "MO": 8, "MT": 2, "NE": 3, "NV": 4, "NH": 2, "NJ": 12, "NM": 3, "NY": 26,
    "NC": 14, "ND": 1, "OH": 15, "OK": 5, "OR": 6, "PA": 17, "RI": 2, "SC": 7,
    "SD": 1, "TN": 9, "TX": 38, "UT": 4, "VT": 1, "VA": 11, "WA": 10, "WV": 2,
    "WI": 8, "WY": 1,
}


def all_districts() -> list[tuple[str, int]]:
    out: list[tuple[str, int]] = []
    for abbr, n in DISTRICT_COUNTS.items():
        if n == 1:
            out.append((abbr, 0))  # at-large → Census/FEC district "00"
        else:
            out.extend((abbr, i) for i in range(1, n + 1))
    return out


def _from_env(spec: str) -> list[tuple[str, int]]:
    result: list[tuple[str, int]] = []
    for token in spec.split(","):
        token = token.strip().upper()
        if not token:
            continue
        abbr, _, num = token.partition("-")
        result.append((abbr, int(num) if num else 0))
    return result


_env = os.environ.get("MIMIR_DISTRICTS", "").strip()
TARGET_DISTRICTS: list[tuple[str, int]] = _from_env(_env) if _env else all_districts()
