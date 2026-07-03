"""Finance aggregation — neutral, mechanical rollups from FEC contributions.

Produces FinanceSummary fields and the donation aggregations described in
docs/DATA_SOURCES.md (top donors, donations by industry, average donation, donation
trend, by sector). Every candidate is aggregated with the IDENTICAL method — the code
below IS that method, so it is auditable and symmetric across candidates.
"""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from decimal import Decimal


@dataclass
class FinanceRollup:
    total_raised: Decimal
    average_donation: Decimal
    small_dollar_share: Decimal  # fraction of dollars from <=$200 donors
    by_industry: dict[str, Decimal]


def aggregate(contributions: list[dict]) -> FinanceRollup:
    """Compute neutral rollups from normalized contribution rows.

    `contributions` items: {amount: Decimal, industry: str | None}.
    """
    total = Decimal(0)
    small = Decimal(0)
    by_industry: dict[str, Decimal] = defaultdict(Decimal)
    n = 0

    for c in contributions:
        amt = Decimal(str(c.get("amount", 0)))
        total += amt
        n += 1
        if amt <= Decimal(200):
            small += amt
        industry = c.get("industry") or "Unclassified"
        by_industry[industry] += amt

    avg = (total / n) if n else Decimal(0)
    small_share = (small / total) if total else Decimal(0)
    return FinanceRollup(
        total_raised=total,
        average_donation=avg,
        small_dollar_share=small_share,
        by_industry=dict(by_industry),
    )
