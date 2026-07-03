"""Issue classification — the ONLY place an LLM touches candidate content.

Guardrails (enforced here and documented in docs/NONPARTISAN_POLICY.md):
  ALLOWED  : map a passage to one or more FIXED issue categories; extract the
             candidate's own verbatim sentences as evidence; return the citing URL.
  FORBIDDEN: generating new claims, summarizing in Mímir's voice, ranking candidates,
             inferring motives, predicting outcomes, or labeling a stance as
             good/bad/moderate/extreme.

Output is fully reviewable: each IssueStance stores the verbatim quote + source URL.
"""

from __future__ import annotations

from dataclasses import dataclass

# Fixed vocabulary — mirrors packages/shared and the Prisma IssueCategory enum.
# The model may NOT invent categories outside this list.
ISSUE_CATEGORIES: tuple[str, ...] = (
    "ECONOMIC_POLICY",
    "FOREIGN_POLICY",
    "IMMIGRATION",
    "HEALTHCARE",
    "TAXES",
    "DEFENSE",
    "EDUCATION",
    "ENERGY",
    "CLIMATE",
    "AI",
    "TECHNOLOGY",
    "HOUSING",
    "LABOR",
    "SOCIAL_ISSUES",
    "CRIMINAL_JUSTICE",
)

SYSTEM_PROMPT = """You are a neutral classifier for a strictly non-partisan civic \
platform. You will receive verbatim text from a candidate's official campaign \
material. Your ONLY job is to:
1. Identify which of the fixed issue categories the text addresses.
2. For each, extract the candidate's OWN verbatim sentence(s) stating their position.

You MUST NOT: summarize or paraphrase; add commentary; judge, rate, or rank the \
position; place it on any ideological spectrum; infer motives; or invent categories. \
Return only categories from the provided list. If the text states no clear position, \
return an empty list.
"""


@dataclass(frozen=True)
class IssueStanceDraft:
    category: str
    stance_quote: str  # verbatim
    source_url: str


def classify_platform_text(text: str, source_url: str) -> list[IssueStanceDraft]:
    """Classify one platform document into neutral issue stances.

    TODO: call Anthropic Messages API (settings.classifier_model) with SYSTEM_PROMPT,
    the fixed ISSUE_CATEGORIES, and `text`; parse a strict JSON response of
    {category, verbatim_quote} objects; validate every category is in ISSUE_CATEGORIES
    and every quote is a substring of `text` (reject hallucinated quotes); attach
    source_url. Return [] if nothing qualifies.
    """
    _ = (SYSTEM_PROMPT, ISSUE_CATEGORIES, text, source_url)
    return []


def _validate(draft: IssueStanceDraft, source_text: str) -> bool:
    """A stance is valid only if its category is known and its quote is verbatim."""
    return (
        draft.category in ISSUE_CATEGORIES
        and draft.stance_quote.strip() != ""
        and draft.stance_quote in source_text
    )
