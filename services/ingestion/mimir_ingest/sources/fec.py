"""FEC source — candidate roster for a district (v1), plus committees & finance (TODO).

Primary source for the candidate roster. API docs:
https://api.open.fec.gov/developers/  (updates nightly).

v1 scope (this milestone): for a given House district and cycle, pull the active
candidates and normalize them into District / Seat / Candidate / Candidacy records,
each carrying a SourceRef. Campaign finance and principal-committee enrichment are
follow-ups (see TODOs).

Set FEC_API_KEY in the environment; falls back to FEC's public DEMO_KEY (rate-limited)
so the pipeline is runnable out of the box.
"""

from __future__ import annotations

from typing import Any, Iterable

from ..config import settings
from ..http import get_json
from ..reference.states import district_geoid
from .base import Record, RunContext, Source, SourceKind, SourceRef

FEC_BASE = "https://api.open.fec.gov/v1"
SOURCE_NAME = "Federal Election Commission"

# Districts to pull. v1 keeps this explicit so a run touches a known, small set;
# a later version can discover all House seats from /elections. (state_abbr, number)
DEFAULT_DISTRICTS: list[tuple[str, int]] = [("IL", 13)]

_PARTY = {
    "DEM": "DEMOCRATIC",
    "REP": "REPUBLICAN",
    "LIB": "LIBERTARIAN",
    "GRE": "GREEN",
    "IND": "INDEPENDENT",
}
_INCUMBENCY = {"I": "INCUMBENT", "C": "CHALLENGER", "O": "OPEN_SEAT"}


def _api_key() -> str:
    return settings.fec_api_key or "DEMO_KEY"


def _ref(url: str) -> SourceRef:
    return SourceRef(kind=SourceKind.FEC, name=SOURCE_NAME, url=url)


def _get(path: str, **params: Any) -> dict[str, Any]:
    params["api_key"] = _api_key()
    return get_json(f"{FEC_BASE}{path}", params)


def format_name(fec_name: str) -> str:
    """FEC stores names as "LAST, FIRST MIDDLE"; render "First Last" for display.

    Note: naive title-casing is imperfect for names like McDonald or O'Brien; a later
    pass can refine casing. The raw FEC name is preserved in the source record.
    """
    name = fec_name.strip()
    if "," in name:
        last, rest = name.split(",", 1)
        name = f"{rest.strip()} {last.strip()}"
    return " ".join(part.capitalize() for part in name.split())


class FecSource(Source):
    kind = SourceKind.FEC

    def __init__(self, districts: list[tuple[str, int]] | None = None) -> None:
        self.districts = districts or DEFAULT_DISTRICTS

    def fetch(self, ctx: RunContext) -> Iterable[dict[str, Any]]:
        """Yield one payload per district: the district descriptor + its candidates."""
        for state_abbr, number in self.districts:
            results: list[dict[str, Any]] = []
            page = 1
            while True:
                data = _get(
                    "/candidates/",
                    office="H",
                    state=state_abbr,
                    district=f"{number:02d}",
                    election_year=ctx.cycle,
                    candidate_status="C",  # statutory candidates
                    per_page=100,
                    page=page,
                    sort="name",
                )
                results.extend(data.get("results", []))
                pagination = data.get("pagination", {})
                if page >= (pagination.get("pages") or 1):
                    break
                page += 1

            query_url = (
                f"{FEC_BASE}/candidates/?office=H&state={state_abbr}"
                f"&district={number:02d}&election_year={ctx.cycle}"
            )
            yield {
                "state_abbr": state_abbr,
                "number": number,
                "cycle": ctx.cycle,
                "query_url": query_url,
                "candidates": results,
            }

    def normalize(self, raw: dict[str, Any]) -> list[Record]:
        state_abbr = raw["state_abbr"]
        number = raw["number"]
        cycle = raw["cycle"]
        geoid = district_geoid(state_abbr, number)
        district_ref = _ref(raw["query_url"])

        records: list[Record] = []

        # District (geometry/demographics come from other sources; nullable here).
        records.append(
            Record(
                entity="District",
                key={"geoid": geoid},
                data={"stateFips": geoid[:2], "number": number},
                source=district_ref,
            )
        )

        candidates = raw["candidates"]
        has_incumbent = any(c.get("incumbent_challenge") == "I" for c in candidates)

        # Seat for this cycle (general election). districtId resolves from geoid;
        # cycle/type are real columns and form the conflict target with districtId.
        records.append(
            Record(
                entity="Seat",
                key={"cycle": cycle, "type": "GENERAL"},
                data={"isOpenSeat": not has_incumbent},
                source=district_ref,
                refs={"districtId": ("District", {"geoid": geoid})},
            )
        )

        for c in candidates:
            fec_id = c["candidate_id"]
            cand_url = f"{FEC_BASE}/candidate/{fec_id}"
            cand_ref = _ref(cand_url)
            records.append(
                Record(
                    entity="Candidate",
                    key={"fecCandidateId": fec_id},
                    data={
                        "fullName": format_name(c.get("name", "")),
                        "party": _PARTY.get((c.get("party") or "").upper(), "UNKNOWN"),
                        # campaignWebsiteUrl / principalCommitteeId: TODO enrich via
                        # /candidate/{id} + /candidate/{id}/committees.
                    },
                    source=cand_ref,
                )
            )
            # Candidacy's conflict target (candidateId, seatId) comes entirely from
            # refs; it has no natural-key columns of its own.
            records.append(
                Record(
                    entity="Candidacy",
                    key={},
                    data={
                        "status": _INCUMBENCY.get(
                            (c.get("incumbent_challenge") or "").upper(), "UNKNOWN"
                        )
                    },
                    source=cand_ref,
                    refs={
                        "candidateId": ("Candidate", {"fecCandidateId": fec_id}),
                        "seatId": ("Seat", {"geoid": geoid, "cycle": cycle, "type": "GENERAL"}),
                    },
                )
            )

        return records


def get_source() -> FecSource:
    return FecSource()
