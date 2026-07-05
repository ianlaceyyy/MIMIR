"""Source modules — one per authoritative data source.

Register new sources here so pipelines can look them up by name.
"""

from __future__ import annotations

from .base import Source
from . import (
    census_acs,
    congress,
    disclosures,
    fec,
    fec_donors,
    fec_finance,
    fec_senate,
    lobbying,
    tiger,
    twitter_x,
)

# name -> module providing a `get_source()` factory.
REGISTRY: dict[str, object] = {
    "fec": fec,
    "fec_senate": fec_senate,
    "fec_finance": fec_finance,
    "fec_donors": fec_donors,
    "congress": congress,
    "census": census_acs,
    "tiger": tiger,
    "x": twitter_x,
    "lobbying": lobbying,
    "disclosures": disclosures,
}

__all__ = ["Source", "REGISTRY"]
