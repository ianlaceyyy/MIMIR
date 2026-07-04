"""FEC campaign-finance totals — receipts, disbursements, cash on hand per candidate.

Uses the bulk /candidates/totals endpoint (paginated) rather than one call per
candidate. Only emits FinanceSummary rows for candidates already in our DB (loaded by
the FEC roster pass), so it runs after `fec`.
"""

from __future__ import annotations

from typing import Any, Iterable

from sqlalchemy import text

from ..config import settings
from ..http import get_json
from .base import Record, RunContext, Source, SourceKind, SourceRef

FEC_BASE = "https://api.open.fec.gov/v1"
SOURCE_NAME = "Federal Election Commission"


def _ref(url: str) -> SourceRef:
    return SourceRef(kind=SourceKind.FEC, name=SOURCE_NAME, url=url)


def _our_candidate_ids() -> set[str]:
    from ..db import engine

    with engine.connect() as conn:
        return {r[0] for r in conn.execute(text('SELECT "fecCandidateId" FROM "Candidate"'))}


class FecFinanceSource(Source):
    kind = SourceKind.FEC

    def fetch(self, ctx: RunContext) -> Iterable[dict[str, Any]]:
        ours = _our_candidate_ids()
        if not ours:
            return
        key = settings.fec_api_key or "DEMO_KEY"
        page = 1
        while True:
            data = get_json(
                f"{FEC_BASE}/candidates/totals/",
                {"api_key": key, "cycle": ctx.cycle, "office": "H", "per_page": 100, "page": page},
            )
            rows = [r for r in data.get("results", []) if r.get("candidate_id") in ours]
            if rows:
                yield {"cycle": ctx.cycle, "rows": rows}
            pagination = data.get("pagination", {})
            if page >= (pagination.get("pages") or 1):
                break
            page += 1

    def normalize(self, raw: dict[str, Any]) -> list[Record]:
        cycle = raw["cycle"]
        records: list[Record] = []
        for r in raw["rows"]:
            fec_id = r["candidate_id"]
            records.append(
                Record(
                    entity="FinanceSummary",
                    key={"cycle": cycle},
                    data={
                        "totalRaised": r.get("receipts") or 0,
                        "totalSpent": r.get("disbursements") or 0,
                        "cashOnHand": r.get("cash_on_hand_end_period") or 0,
                    },
                    source=_ref(f"{FEC_BASE}/candidate/{fec_id}/totals"),
                    refs={"candidateId": ("Candidate", {"fecCandidateId": fec_id})},
                )
            )
        return records


def get_source() -> FecFinanceSource:
    return FecFinanceSource()
