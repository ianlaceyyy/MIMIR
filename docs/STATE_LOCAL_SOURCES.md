# Governor & Mayor races — data-sourcing research

Everything Mímir runs on today is **federal**: FEC (candidates + money), Census
(districts + demographics), Congress.gov (bills/votes). None of these cover **state**
(governor) or **local** (mayor) races. This doc scopes what credible sources exist and
what it would take to link them in. (Researched July 2026.)

## The core problem

There is **no single free primary API** for governor/mayor candidates the way the FEC
is for federal candidates. State and local elections are administered by 50 states and
thousands of localities, each with its own systems. So coverage comes from
**aggregators** (some paid) plus **state-by-state primary sources**.

---

## Governors (50 states; ~36 seats up in 2026)

Governor races are the tractable half — a fixed, small set of statewide contests.

### Candidate rosters
| Source | Access | Notes |
| --- | --- | --- |
| **Ballotpedia API** | **Paid** (rate card via data@ballotpedia.org) | The most complete, structured nonpartisan source: candidate names, party, incumbency, bios, websites, election dates. Covers *all* governor races. This is the recommended backbone if there's budget. |
| **Democracy Works Elections API** | **Paid / partnership** | Ballot data *provided by Ballotpedia*; includes governor + down-ballot statewide contests. |
| **Voting Information Project (VIP)** | **Free**, official | Data published by state election officials in an open feed. Authoritative but coverage/completeness varies by state and is more polling-place/ballot-focused than candidate-centric. |
| **State election board sites** (50) | Free, but **scraping** | The true primary source. No common format — 50 different sites/scrapers to build and maintain. Highest effort, highest fidelity, zero licensing cost. |
| ~~Google Civic Info API~~ | **Deprecated** | The Representatives API was turned down; not a viable option. |

### Money (the FEC equivalent for state races)
State candidates file with **state** agencies, not the FEC. Aggregated, free:
- **FollowTheMoney.org** (National Institute on Money in Politics, now part of
  OpenSecrets) — **free API** with a `myFollowTheMoney` account. State-level candidate
  contributions and donors, the state analog of what we pull from the FEC. This is how
  we'd give governors the same "top donors / where the money came from" treatment.
- **OpenSecrets API** — free key; federal plus some state/personal-finance data.

### Demographics / map
- Census ACS already gives us **state-level** demographics (trivial — same API we use
  for districts, just `for=state:*`).
- Statewide boundary = the state polygon (Census TIGER states file; we already handle
  the CD version).

### Effort to integrate governors
1. **Statewide-race model** (already being added for Senate): a `Seat` that is
   statewide (no district). Governors reuse it with `office = GOVERNOR`. ✅ groundwork.
2. **Governors source**: either (a) Ballotpedia API (budget) or (b) a VIP + per-state
   scraping pipeline (free, more engineering).
3. **State finance source**: FollowTheMoney API → the same donor UI we built for FEC.
4. **UI**: a "statewide races" browse (Senate + Governor) — not the district map.

**Verdict:** Governors are a **realistic next-phase build.** With the Ballotpedia API
(paid) + FollowTheMoney (free) it's a few focused sources on top of the statewide-race
model. Without budget, substitute VIP + state scrapers (more work, still doable).

---

## Mayors (~19,000 municipalities)

Mayors are the genuinely hard part.

- **No comprehensive source exists.** The best structured option, **Ballotpedia**,
  only covers mayors of the **top ~100 cities** (≈31 mayoral elections in 2026) — and
  it's paid. Everything below the top 100 has no aggregated feed.
- The primary sources are **individual city/county clerk** websites and local boards —
  thousands of them, wildly inconsistent, many without machine-readable data.
- Municipal **campaign finance** is even more fragmented (city/county disclosure
  systems), with no national aggregator comparable to FollowTheMoney.

### Effort to integrate mayors
- **Top-100 cities only:** feasible via the Ballotpedia API (paid) — bounded, ~31
  races for 2026. This is the realistic scope.
- **All mayors:** effectively a separate product. It would require a commercial data
  provider or a large, ongoing custom-scraping operation across thousands of
  jurisdictions — a major, continuous engineering + data-ops investment.

**Verdict:** Ship mayors as **top-100 cities via Ballotpedia** if there's budget;
comprehensive mayoral coverage is out of scope for the current free-primary-source
model without significant new investment.

---

## Recommended sequence

1. **Senate** (in progress) — free (FEC), builds the statewide-race model.
2. **Governors** — statewide-race model + Ballotpedia (or VIP/scrape) + FollowTheMoney
   for money. The clear next state-level target.
3. **Mayors (top-100)** — Ballotpedia, budget permitting.
4. **All mayors** — only with a commercial dataset or a dedicated scraping program.

Whatever we add, the integrity rule holds: **primary/authoritative source + citation
per fact**, or it doesn't ship.

## Sources
- Ballotpedia API — https://api.ballotpedia.org/v1/documentation ; buy data —
  https://ballotpedia.org/Ballotpedia:Buy_Political_Data
- 2026 governor races — https://ballotpedia.org/Gubernatorial_elections,_2026
- 2026 mayoral races — https://ballotpedia.org/United_States_mayoral_elections,_2026
- Democracy Works Elections API — https://www.democracy.works/elections-api
- Voting Information Project — referenced via Democracy Works / state feeds
- FollowTheMoney API — https://www.followthemoney.org/our-data/apis
- OpenSecrets API — https://www.opensecrets.org/open-data/api
