"""Source modules — one per authoritative data source.

Register new sources here so pipelines can look them up by name.
"""

from __future__ import annotations

from .base import Source
from . import census_acs, congress, disclosures, fec, lobbying, tiger, twitter_x

# name -> module providing a `get_source()` factory.
REGISTRY: dict[str, object] = {
    "fec": fec,
    "congress": congress,
    "census": census_acs,
    "tiger": tiger,
    "x": twitter_x,
    "lobbying": lobbying,
    "disclosures": disclosures,
}

__all__ = ["Source", "REGISTRY"]
