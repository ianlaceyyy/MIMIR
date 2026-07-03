"""Finance aggregation is neutral and identical for every candidate."""

from decimal import Decimal

from mimir_ingest.pipelines.finance import aggregate


def test_aggregate_basic():
    rollup = aggregate(
        [
            {"amount": 100, "industry": "Finance"},
            {"amount": 200, "industry": "Finance"},
            {"amount": 700, "industry": "Technology"},
        ]
    )
    assert rollup.total_raised == Decimal(1000)
    assert rollup.average_donation == Decimal(1000) / 3
    # $100 and $200 are <= $200 -> $300 of $1000 is small-dollar.
    assert rollup.small_dollar_share == Decimal(300) / Decimal(1000)
    assert rollup.by_industry["Finance"] == Decimal(300)
    assert rollup.by_industry["Technology"] == Decimal(700)


def test_aggregate_empty():
    rollup = aggregate([])
    assert rollup.total_raised == Decimal(0)
    assert rollup.average_donation == Decimal(0)
    assert rollup.small_dollar_share == Decimal(0)
