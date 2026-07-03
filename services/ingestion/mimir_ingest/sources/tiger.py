"""Census TIGER/Line source — congressional district boundary geometry.

Shapefiles (annual): https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html
Feeds District.geometry (PostGIS MultiPolygon, SRID 4326) used to render maps.
Unlike the API sources, this downloads and parses a shapefile rather than JSON.
"""

from __future__ import annotations

from typing import Any, Iterable

from .base import Record, RunContext, Source, SourceKind, SourceRef

TIGER_INDEX = "https://www2.census.gov/geo/tiger/TIGER2024/CD/"
SOURCE_NAME = "U.S. Census Bureau (TIGER/Line)"


def _ref(url: str) -> SourceRef:
    return SourceRef(kind=SourceKind.CENSUS, name=SOURCE_NAME, url=url)


class TigerSource(Source):
    kind = SourceKind.CENSUS

    def fetch(self, ctx: RunContext) -> Iterable[dict[str, Any]]:
        """TODO: download the CD shapefile zip, read features (fiona/pyogrio),
        yield {geoid, state_fips, cd_number, geometry_wkt}."""
        return []

    def normalize(self, raw: dict[str, Any]) -> list[Record]:
        """Map a shapefile feature -> District record (geometry stored via PostGIS)."""
        # TODO: build District key on geoid; store geometry as EWKT for GeoAlchemy2.
        _ = _ref
        return []


def get_source() -> TigerSource:
    return TigerSource()
