"""Congress.gov source — incumbent identity (bioguideId) + sponsored bills.

Authoritative legislative source. API docs: https://api.congress.gov/  (real-time).

v1 scope: for each sitting House member that matches an incumbent already in our DB
(by state + district), attach their bioguideId to the Candidate and ingest their most
recent sponsored bills as Bill + BillSponsorship records. Roll-call votes are a
follow-up (the per-member vote API is more involved).

Runs AFTER the FEC roster, since it links to incumbents the FEC pass created.
Needs CONGRESS_GOV_API_KEY.
"""

from __future__ import annotations

from typing import Any, Iterable

from sqlalchemy import text

from ..config import settings
from ..http import get_json
from .base import Record, RunContext, Source, SourceKind, SourceRef

CONGRESS_BASE = "https://api.congress.gov/v3"
SOURCE_NAME = "Congress.gov"
MAX_BILLS_PER_MEMBER = 10


def _ref(url: str) -> SourceRef:
    return SourceRef(kind=SourceKind.CONGRESS, name=SOURCE_NAME, url=url)


def _key() -> str:
    return settings.congress_api_key


def _incumbent_map() -> dict[tuple[str, int], str]:
    """(state name, district number) -> fecCandidateId, for current incumbents in DB."""
    from ..db import engine

    sql = text(
        'SELECT st.name AS state, d.number AS district, c."fecCandidateId" AS fec '
        'FROM "Candidate" c '
        'JOIN "Candidacy" ca ON ca."candidateId" = c.id '
        'JOIN "Seat" s ON ca."seatId" = s.id '
        'JOIN "District" d ON s."districtId" = d.id '
        'JOIN "State" st ON d."stateFips" = st.fips '
        "WHERE ca.status = 'INCUMBENT'"
    )
    with engine.connect() as conn:
        return {(r.state, r.district): r.fec for r in conn.execute(sql)}


class CongressSource(Source):
    kind = SourceKind.CONGRESS

    def fetch(self, ctx: RunContext) -> Iterable[dict[str, Any]]:
        incumbents = _incumbent_map()
        if not incumbents:
            return  # nothing to link to yet (run FEC first)

        # Page through current members; match House members to our incumbents.
        offset = 0
        while True:
            data = get_json(
                f"{CONGRESS_BASE}/member",
                {
                    "currentMember": "true",
                    "limit": 250,
                    "offset": offset,
                    "format": "json",
                    "api_key": _key(),
                },
            )
            members = data.get("members", [])
            for m in members:
                district = m.get("district")
                if district is None:
                    continue  # senators have no district
                fec = incumbents.get((m.get("state"), district))
                if not fec:
                    continue
                bio = m["bioguideId"]
                bills = get_json(
                    f"{CONGRESS_BASE}/member/{bio}/sponsored-legislation",
                    {"limit": MAX_BILLS_PER_MEMBER, "format": "json", "api_key": _key()},
                ).get("sponsoredLegislation", [])
                yield {"fec": fec, "bioguide": bio, "bills": bills}

            total = data.get("pagination", {}).get("count", 0)
            offset += 250
            if offset >= total:
                break

    def normalize(self, raw: dict[str, Any]) -> list[Record]:
        fec = raw["fec"]
        bio = raw["bioguide"]
        member_url = f"{CONGRESS_BASE}/member/{bio}"
        records: list[Record] = [
            Record(
                entity="Candidate",
                key={"fecCandidateId": fec},
                data={"bioguideId": bio},
                source=_ref(member_url),
                update_only=True,  # patch bioguideId onto the existing FEC candidate
            )
        ]

        for b in raw["bills"]:
            btype = (b.get("type") or "").lower()
            try:
                bnum = int(b["number"])
                congress = int(b["congress"])
            except (KeyError, TypeError, ValueError):
                continue
            latest = (b.get("latestAction") or {}).get("text")
            bill_url = b.get("url") or member_url
            records.append(
                Record(
                    entity="Bill",
                    key={"congress": congress, "billType": btype, "billNumber": bnum},
                    data={
                        "title": b.get("title"),
                        "policyArea": (b.get("policyArea") or {}).get("name"),
                        "introducedAt": b.get("introducedDate"),
                        "latestAction": latest,
                    },
                    source=_ref(bill_url),
                )
            )
            records.append(
                Record(
                    entity="BillSponsorship",
                    key={"isCosponsor": False},
                    data={},
                    source=_ref(bill_url),
                    refs={
                        "candidateId": ("Candidate", {"fecCandidateId": fec}),
                        "billId": (
                            "Bill",
                            {"congress": congress, "billType": btype, "billNumber": bnum},
                        ),
                    },
                )
            )
        return records


def get_source() -> CongressSource:
    return CongressSource()
