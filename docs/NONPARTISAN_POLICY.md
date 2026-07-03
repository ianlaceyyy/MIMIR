# Non-partisan policy

Non-partisanship in Mímir is a **design constraint enforced in code and data**, not a
matter of editorial goodwill. This document is the contract every contributor,
pipeline, and UI component must satisfy.

## Principles

1. **No endorsements, ever.** Mímir never recommends, ranks, rates, or scores a
   candidate's quality, electability, or values.
2. **Equal treatment by construction.** Every candidate for a seat gets the identical
   template, field set, and visual weight. There is no "featured" candidate.
3. **Neutral ordering.** Candidates are ordered by a neutral, disclosed rule
   (default: alphabetical by surname). Party is never the primary sort. The active
   sort rule is always shown to the user.
4. **Facts, attributed.** Everything shown is a verifiable fact from a primary source
   (see `docs/DATA_SOURCES.md`) with a visible citation and "as of" date. No
   interpretation, no adjectives supplied by Mímir.
5. **Party is a label, not a lens.** Party affiliation is displayed because it is a
   factual ballot attribute. It never changes styling, prominence, or ordering.
6. **Symmetry in aggregates.** Any computed metric (donation totals, issue emphasis,
   attendance) is computed with the exact same method for all candidates, and the
   method is documented and linked.

## Enforcement mechanisms

| Risk | Mechanism |
| --- | --- |
| Editorializing language creeps into content | UI renders **only** source-attributed fields; free-text is verbatim quotes with citation, never paraphrase by Mímir |
| Unequal prominence | Shared `CandidateCard` component; layout tests assert identical structure per candidate |
| Biased ordering | Central `orderCandidates()` util with a single disclosed rule; ordering is covered by tests |
| LLM injects opinion during platform classification | Classifier is constrained to **assign** text to predefined neutral issue buckets and extract verbatim quotes; it may not summarize, judge, or infer intent (see below) |
| Sentiment misused as candidate rating | Post sentiment is stored as a descriptor of a *post's tone*, labeled as such, and never aggregated into a candidate "score" |
| Source imbalance | Same sources applied to all candidates; if data is missing for one, the field shows "No data from [source]" rather than being hidden |

## LLM classification guardrails

The only place an LLM touches candidate content is `classify/issues.py`, and it is
tightly boxed:

- **Allowed:** map a passage to one or more of the fixed issue categories; extract the
  candidate's own verbatim sentences as evidence; return the citing URL.
- **Forbidden:** generating new claims, summarizing in Mímir's voice, ranking
  candidates, inferring motives, predicting outcomes, or characterizing a position as
  good/bad/extreme/moderate.
- **Output is reviewable:** every classification stores the source quote + URL so a
  human (or the voter) can verify the mapping.
- **Deterministic vocabulary:** the issue category list is fixed in
  `packages/shared` and cannot be expanded by the model at runtime.

## The fixed issue vocabulary

Economic Policy · Foreign Policy · Immigration · Healthcare · Taxes · Defense ·
Education · Energy · Climate · AI · Technology · Housing · Labor · Social Issues ·
Criminal Justice

Positions are attached to these categories as **the candidate's own stated stance
with a citation** — Mímir does not place candidates on a left/right axis.

## What Mímir will not build

- Left/right or ideology scores.
- "Best candidate for you" quizzes that imply a correct answer.
- Predictive ratings, win probabilities, or grades.
- Any ranking of candidates other than the neutral, disclosed sort.

If a proposed feature cannot be implemented without violating the principles above, it
does not belong in Mímir.
