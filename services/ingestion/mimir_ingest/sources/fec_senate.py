"""FEC Senate roster — 2026 statewide Senate candidates.

Same FEC API as the House roster, filtered to office=S. Emits a statewide Seat
(office=SENATE) per state plus Candidate/Candidacy rows. States are already seeded.
"""

from __future__ import annotations

from typing import Any, Iterable

from ..config import settings
from ..http import get_json
from ..reference.states import BY_ABBR
from .base import Record, RunContext, Source, SourceKind, SourceRef
from .fec import _PARTY, format_name  # reuse party map + name formatting

FEC_BASE = "https://api.open.fec.gov/v1"
SOURCE_NAME = "Federal Election Commission"
_INCUMBENCY = {"I": "INCUMBENT", "C": "CHALLENGER", "O": "OPEN_SEAT"}


def _ref(url: str) -> SourceRef:
    return SourceRef(kind=SourceKind.FEC, name=SOURCE_NAME, url=url)


class FecSenateSource(Source):
    kind = SourceKind.FEC

    def fetch(self, ctx: RunContext) -> Iterable[dict[str, Any]]:
        key = settings.fec_api_key or "DEMO_KEY"
        # Group all Senate candidates for the cycle by state.
        by_state: dict[str, list[dict[str, Any]]] = {}
        page = 1
        while True:
            data = get_json(
                f"{FEC_BASE}/candidates/",
                {
                    "api_key": key,
                    "office": "S",
                    "election_year": ctx.cycle,
                    "candidate_status": "C",
                    "per_page": 100,
                    "page": page,
                    "sort": "name",
                },
            )
            for c in data.get("results", []):
                st = c.get("state")
                if st in BY_ABBR:
                    by_state.setdefault(st, []).append(c)
            pagination = data.get("pagination", {})
            if page >= (pagination.get("pages") or 1):
                break
            page += 1

        for state_abbr, cands in by_state.items():
            yield {"state_abbr": state_abbr, "cycle": ctx.cycle, "candidates": cands}

    def normalize(self, raw: dict[str, Any]) -> list[Record]:
        state_abbr = raw["state_abbr"]
        cycle = raw["cycle"]
        fips = BY_ABBR[state_abbr].fips
        cands = raw["candidates"]
        seat_ref = _ref(f"{FEC_BASE}/candidates/?office=S&state={state_abbr}&election_year={cycle}")
        has_incumbent = any(c.get("incumbent_challenge") == "I" for c in cands)

        records: list[Record] = [
            Record(
                entity="StatewideSeat",
                key={"stateFips": fips, "office": "SENATE", "cycle": cycle, "type": "GENERAL"},
                data={"isOpenSeat": not has_incumbent},
                source=seat_ref,
            )
        ]
        for c in cands:
            fec_id = c["candidate_id"]
            cand_ref = _ref(f"{FEC_BASE}/candidate/{fec_id}")
            records.append(
                Record(
                    entity="Candidate",
                    key={"fecCandidateId": fec_id},
                    data={
                        "fullName": format_name(c.get("name", "")),
                        "party": _PARTY.get((c.get("party") or "").upper(), "UNKNOWN"),
                    },
                    source=cand_ref,
                )
            )
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
                        "seatId": (
                            "StatewideSeat",
                            {"stateFips": fips, "office": "SENATE", "cycle": cycle, "type": "GENERAL"},
                        ),
                    },
                )
            )
        return records


def get_source() -> FecSenateSource:
    return FecSenateSource()
