"""FEC named top donors — top employers behind each candidate's individual donations.

For each candidate: resolve their principal committee, then pull contributions
aggregated by employer (FEC schedules/schedule_a/by_employer). We keep the top real
employers (dropping "NOT EMPLOYED", "RETIRED", etc.) and store them as aggregated
Contribution rows.

This is ~2 API calls per candidate, so it's slow against FEC's rate limit. Control the
scope with MIMIR_DONOR_SCOPE=incumbents (default) or =all.
"""

from __future__ import annotations

import os
import re
from typing import Any, Iterable

from sqlalchemy import text

from ..config import settings
from ..http import HttpError, get_json
from .base import Record, RunContext, Source, SourceKind, SourceRef

FEC_BASE = "https://api.open.fec.gov/v1"
SOURCE_NAME = "Federal Election Commission"
TOP_N = 12

# Employer values that aren't a real named organization.
_SKIP_EMPLOYERS = {
    "", "NOT EMPLOYED", "SELF-EMPLOYED", "SELF EMPLOYED", "SELF", "RETIRED", "NONE",
    "N/A", "NA", "NULL", "UNEMPLOYED", "HOMEMAKER", "INFORMATION REQUESTED",
    "REQUESTED", "NOT PROVIDED", "NOT APPLICABLE", "NONE (RETIRED)",
}


def _ref(url: str) -> SourceRef:
    return SourceRef(kind=SourceKind.FEC, name=SOURCE_NAME, url=url)


def _slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:40]


def _candidate_ids(scope: str) -> list[str]:
    from ..db import engine

    if scope == "all":
        sql = 'SELECT "fecCandidateId" FROM "Candidate"'
    else:  # incumbents first — highest-value, keeps the run under rate limits
        sql = (
            'SELECT c."fecCandidateId" FROM "Candidate" c '
            'JOIN "Candidacy" ca ON ca."candidateId" = c.id '
            "WHERE ca.status = 'INCUMBENT'"
        )
    with engine.connect() as conn:
        return [r[0] for r in conn.execute(text(sql))]


class FecDonorsSource(Source):
    kind = SourceKind.FEC

    def fetch(self, ctx: RunContext) -> Iterable[dict[str, Any]]:
        key = settings.fec_api_key or "DEMO_KEY"
        scope = os.environ.get("MIMIR_DONOR_SCOPE", "incumbents")
        for fec_id in _candidate_ids(scope):
            try:
                cm = get_json(
                    f"{FEC_BASE}/candidate/{fec_id}/committees/",
                    {"api_key": key, "designation": "P", "cycle": ctx.cycle},
                )
                comms = [c["committee_id"] for c in cm.get("results", [])]
                if not comms:
                    continue
                emp = get_json(
                    f"{FEC_BASE}/schedules/schedule_a/by_employer/",
                    {
                        "api_key": key,
                        "committee_id": comms[0],
                        "cycle": ctx.cycle,
                        "per_page": 40,
                        "sort": "-total",
                    },
                )
            except HttpError:
                continue
            top: list[dict[str, Any]] = []
            for r in emp.get("results", []):
                name = (r.get("employer") or "").strip()
                if name.upper() in _SKIP_EMPLOYERS or not name:
                    continue
                top.append({"employer": name, "total": r.get("total") or 0})
                if len(top) >= TOP_N:
                    break
            if top:
                yield {"fec": fec_id, "committee": comms[0], "employers": top}

    def normalize(self, raw: dict[str, Any]) -> list[Record]:
        fec_id = raw["fec"]
        url = f"{FEC_BASE}/schedules/schedule_a/by_employer/?committee_id={raw['committee']}"
        records: list[Record] = []
        for e in raw["employers"]:
            records.append(
                Record(
                    entity="Contribution",
                    key={
                        "fecTransactionId": f"emp-{fec_id}-{_slug(e['employer'])}",
                        "employer": e["employer"],
                        "donorName": e["employer"],
                        "amount": e["total"],
                        "type": "INDIVIDUAL",
                    },
                    data={},
                    source=_ref(url),
                    refs={"candidateId": ("Candidate", {"fecCandidateId": fec_id})},
                )
            )
        return records


def get_source() -> FecDonorsSource:
    return FecDonorsSource()
