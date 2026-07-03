# Data model

The canonical schema lives in [`packages/db/schema.prisma`](../packages/db/schema.prisma).
This document explains the entities and how they map to the sources in
`docs/DATA_SOURCES.md`. Every fact-bearing row references a `Source` via `SourceRef`.

## Entities

### `State`
US state/territory. Parent of districts. `{ fips, abbr, name }`.

### `District`
A congressional district and the seat it represents.
- `geoid` (Census GEOID, stable key), `state`, `number`
- `incumbentId`, `party`, `electionYear`, `isOpenSeat`
- `cookPvi` (partisan lean, as-of dated), `population`
- `geometry` (PostGIS `geometry(MultiPolygon, 4326)` for the map)
- Sources: TIGER (geometry), FEC (seat), Congress.gov (incumbent).

### `Seat` / `Election`
The contest for a district in a given cycle. Separated from `District` so historical
cycles and special elections are first-class. Holds `cycle`, `electionDate`, `type`
(general/primary/special), and the candidate set.

### `Candidate`
A person running for a seat.
- `fecCandidateId` (stable key), `bioguideId` (if a sitting member), `fullName`,
  `party`, `incumbentChallengerStatus`, `office`, `districtId`
- `campaignWebsiteUrl`, `principalCommitteeId`
- Relations: `financeSummary`, `contributions`, `issueStances`, `sponsoredBills`,
  `votes`, `socialAccounts`, `disclosures`.
- Sources: FEC (identity/roster/committee), Congress.gov (legislative identity).

### `FinanceSummary`
Per-candidate, per-cycle rollups: total raised/spent, cash on hand, individual vs PAC
share, average donation, small-dollar share. Derived from `Contribution` +
`IndependentExpenditure`. Neutral, mechanical aggregation only.

### `Contribution`
One FEC contribution record: amount, date, donor employer, occupation, city/state,
committee, contribution type (individual/PAC/transfer). Enables donor and industry
aggregation. Source: FEC.

### `IndependentExpenditure`
Super PAC / independent spending for or against a candidate, kept separate from the
candidate's own committee money. Source: FEC.

### `IssueStance`
A candidate's stated position in one fixed issue category.
- `candidateId`, `category` (enum, see non-partisan policy), `stanceQuote` (verbatim),
  `sourceUrl`, `extractedAt`
- Produced by `classify/issues.py` under the LLM guardrails. Stores the candidate's
  own words + citation; Mímir adds no interpretation.

### `Bill`
Legislation tied to a member: sponsored/cosponsored, with title, congress, number,
summary, actions, committee referrals. Source: Congress.gov.

### `Vote`
One roll-call vote by a member: `billId`, `date`, `position`
(Yea/Nay/Present/NotVoting), `partyMajorityPosition`, `topic`, `outcome`.
Source: Congress.gov.

### `SocialAccount` / `SocialPost`
Official X account and its posts: text, type (tweet/reply/retweet), media, hashtags,
mentions, engagement counts, and issue tags. Computed neutrally (frequency, issue
emphasis, engagement). Source: X API.

### `Demographics`
Per-district ACS snapshot: median income, education, race, age, population,
employment, housing, internet access, veteran %, urban/rural, and sector shares
(manufacturing, agriculture, energy). As-of dated. Source: Census ACS.

### `Disclosure`
Financial disclosure / STOCK Act / lobbying records tied to a member.
Sources: House Clerk, Senate LDA.

### `Source` + `SourceRef`  ← the provenance backbone
- `Source`: `{ id, name, kind (FEC|CONGRESS|CENSUS|X|CAMPAIGN_SITE|CLERK|LDA|MIT),
  homepageUrl, reliability }`.
- `SourceRef`: attaches a `Source` + exact `url` + `fetchedAt` to a specific record
  and field. **The upsert layer rejects fact-bearing rows without a `SourceRef`.**
  This is what lets every value in the UI show "Source: FEC · fetched 2026-06-30".

## Relationship sketch

```
State 1───* District 1───* Seat/Election *───* Candidate
                                                   ├─1─ FinanceSummary
                                                   ├─*─ Contribution
                                                   ├─*─ IndependentExpenditure
                                                   ├─*─ IssueStance
                                                   ├─*─ Bill (sponsored/cosponsored)
                                                   ├─*─ Vote
                                                   ├─*─ SocialAccount ─* SocialPost
                                                   └─*─ Disclosure
District 1───1 Demographics
(every fact-bearing row) *───1 SourceRef *───1 Source
```

## Keys & idempotency

Stable external IDs are the upsert keys, so re-ingestion is idempotent:
- `District.geoid` (Census GEOID)
- `Candidate.fecCandidateId` (FEC), `Candidate.bioguideId` (Congress)
- `Bill` = `(congress, billType, billNumber)`
- `Vote` = `(chamber, congress, session, rollNumber, bioguideId)`
