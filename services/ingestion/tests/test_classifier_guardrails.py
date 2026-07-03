"""The classifier may only use fixed categories and verbatim quotes."""

from mimir_ingest.classify.issues import ISSUE_CATEGORIES, IssueStanceDraft, _validate

SOURCE = "We will expand affordable housing and cap rent increases statewide."


def test_valid_stance_is_verbatim_and_known_category():
    draft = IssueStanceDraft(
        category="HOUSING",
        stance_quote="We will expand affordable housing",
        source_url="https://example-campaign.org/issues",
    )
    assert _validate(draft, SOURCE)


def test_rejects_unknown_category():
    draft = IssueStanceDraft("IDEOLOGY_SCORE", "We will expand affordable housing", "u")
    assert not _validate(draft, SOURCE)
    assert "IDEOLOGY_SCORE" not in ISSUE_CATEGORIES


def test_rejects_non_verbatim_quote():
    # A paraphrase that is not a substring of the source must be rejected.
    draft = IssueStanceDraft("HOUSING", "The candidate strongly supports housing.", "u")
    assert not _validate(draft, SOURCE)
