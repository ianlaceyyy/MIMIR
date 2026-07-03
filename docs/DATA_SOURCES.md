# Data sources

Mímir draws **only** from primary, authoritative sources. Each field in the data
model is traceable to one of the sources below via a `SourceRef` (see
`docs/DATA_MODEL.md`). Reliability ratings reflect authoritativeness for the field.

| Information | Best source | API | Update cadence | Reliability |
| --- | --- | --- | --- | --- |
| Congressional districts (boundaries) | U.S. Census Bureau — TIGER/Line | ✓ | Annual | ★★★★★ |
| Seats up for election | Federal Election Commission (FEC) | ✓ | Daily | ★★★★★ |
| Candidate roster | FEC API | ✓ | Daily | ★★★★★ |
| Campaign donations | FEC API | ✓ | Nightly | ★★★★★ |
| Bills introduced | Congress.gov API | ✓ | Real-time | ★★★★★ |
| Voting record | Congress.gov API | ✓ | Real-time | ★★★★★ |
| Bill sponsorship | Congress.gov API | ✓ | Real-time | ★★★★★ |
| Candidate websites | Candidate official websites | usually no | Live | ★★★★★ |
| Social-media posts | X API | ✓ | Live | ★★★★☆ |
| District demographics | Census — American Community Survey (ACS) | ✓ | Annual | ★★★★★ |
| Election results | MIT Election Data & Science Lab | download/API | After elections | ★★★★★ |

## Per-source detail

### 1. Congressional districts & seats
- **Sources:** Census TIGER/Line shapefiles (geometry), FEC API (seats up +
  candidate roster), Congress.gov API (current member per district).
- **Stored per district:** state, district number, incumbent, party, election year,
  open-seat flag, Cook PVI (partisan lean), population, boundary geometry (map).
- Module: `sources/tiger.py`, `sources/fec.py`, `sources/congress.py`.

### 2. Candidate information — FEC API (primary)
- Provides: candidate ID, office, district, incumbent/challenger status, principal
  committee, campaign website, filing history, financial reports. Updates nightly.
- Module: `sources/fec.py`.

### 3. Donations — FEC API (highest-value dataset)
- Exposes: every individual contribution, employer, occupation, donor city/state,
  PAC donations, Super PAC expenditures, committee transfers, independent
  expenditures, fundraising totals.
- Aggregations we compute (neutral, mechanical): top donors, donations by industry,
  average donation, donation trend over time, and by sector (corporate, labor,
  finance, technology, healthcare, oil & gas, …).
- Module: `sources/fec.py` (+ `pipelines/finance.py` for aggregation).

### 4. Candidate platforms — official campaign sites (crawled)
- No standardized API. We crawl each official campaign site and extract: issues,
  policies, press releases, speeches, policy PDFs, news.
- An LLM then **classifies** (never generates) the text into neutral issue buckets:
  Economic Policy, Foreign Policy, Immigration, Healthcare, Taxes, Defense,
  Education, Energy, Climate, AI, Technology, Housing, Labor, Social Issues,
  Criminal Justice. Guardrails in `docs/NONPARTISAN_POLICY.md`.
- Modules: `sources/campaign_sites.py`, `classify/issues.py`.

### 5. Bills — Congress.gov API (authoritative)
- Sponsored bills, cosponsored bills, committee referrals, amendments, summaries,
  bill text, legislative actions.
- Module: `sources/congress.py`.

### 6. Voting record — Congress.gov API
- Per vote: bill, date, Yes/No/Present/Not Voting, party-majority position, topic,
  outcome.
- Module: `sources/congress.py`.

### 7. Social posts — X API
- Collect tweets, replies, retweets, likes, media, hashtags, mentions; classify each
  post by issue. Computed neutrally: posting frequency, issue emphasis, engagement,
  trending topics. (Sentiment is stored as a neutral descriptor, not a score of the
  candidate — see non-partisan policy.)
- Module: `sources/twitter_x.py`.

### 8. District demographics — Census ACS API (highly recommended)
- Median income, education, race, age, population, employment, housing, internet
  access, veteran %, urban/rural, manufacturing, agriculture, energy production.
- Module: `sources/census_acs.py`.

## Additional datasets worth integrating

| Dataset | Source |
| --- | --- |
| Lobbying disclosures | U.S. Senate Lobbying Disclosure Database |
| Committee assignments | Congress.gov API |
| Financial disclosures | U.S. House Clerk Financial Disclosure Reports |
| STOCK Act disclosures | U.S. House Clerk Financial Disclosure Reports |
| PACs and committees | FEC API |
| Candidate fundraising | FEC API |

Modules: `sources/lobbying.py`, `sources/disclosures.py`.

## Source hygiene rules

- **Attribution required.** Every stored field references the exact endpoint/URL and
  retrieval timestamp. Un-sourced data is rejected at the upsert layer.
- **Respect terms & robots.** Crawlers honor `robots.txt`, set the
  `INGEST_USER_AGENT`, and rate-limit. X data respects API terms.
- **Prefer official over aggregated.** When two sources conflict, the primary
  government source wins and the conflict is logged.
- **Date everything.** Time-sensitive facts (PVI, demographics, finance totals) carry
  the "as of" date shown in the UI.
