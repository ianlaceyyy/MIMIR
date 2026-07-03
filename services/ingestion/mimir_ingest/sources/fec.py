"""FEC source — candidates, seats up for election, committees, and campaign finance.

Primary source for the candidate roster and the donations dataset. API docs:
https://api.open.fec.gov/developers/  (updates nightly).

This is the reference implementation other source modules follow. Network calls are
stubbed with TODOs; the fetch/normalize contract and provenance handling are real.
"""

from __future__ import annotations

from typing import Any, Iterable

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from ..config import settings
from .base import Record, RunContext, Source, SourceKind, SourceRef

FEC_BASE = "https://api.open.fec.gov/v1"
SOURCE_NAME = "Federal Election Commission"


def _ref(url: str) -> SourceRef:
    return SourceRef(kind=SourceKind.FEC, name=SOURCE_NAME, url=url)


@retry(stop=stop_after_attempt(4), wait=wait_exponential(multiplier=1, max=30))
def _get(client: httpx.Client, path: str, **params: Any) -> dict[str, Any]:
    params["api_key"] = settings.fec_api_key
    resp = client.get(f"{FEC_BASE}{path}", params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()


class FecSource(Source):
    kind = SourceKind.FEC

    def fetch(self, ctx: RunContext) -> Iterable[dict[str, Any]]:
        """Yield candidate pages for the cycle.

        TODO: paginate GET /candidates?cycle=<>&office=H&is_active_candidate=true
        and, per candidate, GET /candidate/{id}/totals and /schedules/schedule_a
        (individual contributions) for the finance + donations datasets.
        """
        headers = {"User-Agent": settings.user_agent}
        with httpx.Client(headers=headers) as client:
            # data = _get(client, "/candidates", cycle=ctx.cycle, office="H", per_page=100)
            # yield from data["results"]
            _ = client  # placeholder until wired
        return []

    def normalize(self, raw: dict[str, Any]) -> list[Record]:
        """Map one FEC candidate payload -> Candidate (+ Candidacy) records."""
        url = f"{FEC_BASE}/candidate/{raw.get('candidate_id', '')}"
        candidate = Record(
            entity="Candidate",
            key={"fecCandidateId": raw["candidate_id"]},
            data={
                "fullName": raw.get("name", ""),
                "party": _map_party(raw.get("party")),
                "campaignWebsiteUrl": raw.get("candidate_url"),
                "principalCommitteeId": raw.get("principal_committee_id"),
            },
            source=_ref(url),
        )
        # TODO: also emit Candidacy (link to Seat via office/state/district+cycle),
        #       FinanceSummary, and Contribution records.
        return [candidate]


def _map_party(fec_party: str | None) -> str:
    return {
        "DEM": "DEMOCRATIC",
        "REP": "REPUBLICAN",
        "LIB": "LIBERTARIAN",
        "GRE": "GREEN",
        "IND": "INDEPENDENT",
    }.get((fec_party or "").upper(), "UNKNOWN")


def get_source() -> FecSource:
    return FecSource()
