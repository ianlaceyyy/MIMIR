"""The congressional districts Mímir currently ingests.

One place to control coverage: every source (FEC roster, Census demographics, …) reads
this list, so adding a district here pulls it from all sources on the next run.
Format: (state USPS abbr, district number). Use 0 for at-large.
"""

from __future__ import annotations

TARGET_DISTRICTS: list[tuple[str, int]] = [
    ("IL", 13),
]
