"""Provenance is mandatory: upsert must reject records without a SourceRef."""

import pytest

from mimir_ingest.db import MissingSourceError, upsert_records
from mimir_ingest.sources.base import Record, SourceKind, SourceRef


def _record(with_source: bool) -> Record:
    # Bypass Record.__post_init__ guard to simulate a source-less record reaching db.
    rec = Record(
        entity="Candidate",
        key={"fecCandidateId": "H0IL01000"},
        data={"fullName": "Test Candidate"},
        source=SourceRef(
            kind=SourceKind.FEC,
            name="Federal Election Commission",
            url="https://api.open.fec.gov/v1/candidate/H0IL01000",
        ),
    )
    if not with_source:
        object.__setattr__(rec, "source", None)
    return rec


def test_upsert_accepts_sourced_record_dry_run():
    assert upsert_records([_record(with_source=True)], dry_run=True) == 1


def test_upsert_rejects_unsourced_record():
    with pytest.raises(MissingSourceError):
        upsert_records([_record(with_source=False)], dry_run=True)
