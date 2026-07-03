# Mímir — Product & Design Brief

> A one-page concept brief for design (Figma). It describes what Mímir is, who it's
> for, the screens, the content each screen shows, the component inventory, and the
> visual/tone direction. Everything here maps to real data already modeled in the
> platform (see `docs/DATA_MODEL.md`).

---

## 1. The product in one sentence

**Mímir is a strictly non-partisan website that lets any voter look up their
congressional district and understand every candidate on their ballot — background,
money, record, and stated positions — with every fact traced to a primary source.**

Named for the Norse well of wisdom. The feeling we want: *calm, trustworthy, neutral,
effortless* — the opposite of cable-news noise.

## 2. Who it's for

- **Primary:** an ordinary voter, 5 minutes before or during deciding how to vote,
  who wants a clear, unbiased picture of their choices. Low patience, high skepticism.
- **Secondary:** journalists, students, and researchers who want sourced facts fast.
- Assume **mobile-first** (people check on their phone), fully responsive to desktop.

## 3. Non-negotiable principles (these shape the UI)

1. **Non-partisan by construction.** No endorsements, ratings, rankings, or ideology
   scores. Every candidate gets the *identical* template and visual weight. Party is a
   small neutral label, never a theme color for the page. Candidate order is disclosed
   (alphabetical by surname).
2. **Every fact is cited.** A "Source: FEC · as of [date]" chip sits on essentially
   every data point. Provenance is a first-class visual element, not fine print.
3. **Calm & neutral aesthetic.** Muted, paper-like palette. No red-vs-blue framing.
   Generous whitespace. Editorial, legible typography. Nothing alarmist.
4. **Scannable in minutes.** A voter should grasp "who's running and what they're
   about" at a glance, then drill down only if they want.

## 4. Information architecture (sitemap)

```
Home  (search / browse entry)
 └─ State            /states/[state]        e.g. "Illinois"
     └─ District      /districts/[geoid]     e.g. "IL-13"  ← the heart of the product
         └─ Candidate /candidates/[id]       e.g. "Nikki Budzinski"
About            /about
Methodology      /methodology   (sources + non-partisan policy, plain-language)
```

The **District page** is the center of gravity. Home → State → District → Candidate is
the main path; a voter ideally lands on their District page directly (search or a
"find my district" flow).

## 5. Screen-by-screen (what design needs to lay out)

### A. Home
- One-line value prop + a **"Find your district"** entry: search by address/ZIP
  (future) or browse by state.
- Browse-by-state grid (50 states + DC/territories).
- Trust framing: "non-partisan · primary sources · no endorsements."

### B. State page
- List of that state's districts, each a row: district label (e.g. "IL-13"),
  partisan-lean tag (Cook PVI — factual, neutral), open-seat flag, candidate count.

### C. District page  ← design the richest screen here
Sections, top to bottom:
1. **District header** — label (IL-13), key facts (population, median income, seat
   status), and a **district map** (Census TIGER boundary — currently a placeholder
   box; design the real map treatment).
2. **Demographics strip** — median income, median age, education, veteran share, etc.
   (Census ACS), each cited.
3. **Candidates** — a grid/list of **identical candidate cards**, with the disclosed
   sort rule shown. This is the core comparison surface.

### D. Candidate profile page
The deep view. Tabs or stacked sections, all source-cited:
1. **Identity** — name, party (neutral label), incumbent/challenger, office, links to
   official campaign site.
2. **Campaign finance** (FEC) — total raised / spent / cash on hand; small-dollar
   share; **top industries / donors**; a simple donations chart. (Neutral, mechanical.)
3. **Stated positions** — the candidate's **own verbatim quotes**, grouped into fixed
   neutral issue categories (Economy, Healthcare, Immigration, Climate, …), each with a
   link to where they said it. Mímir never paraphrases.
4. **Legislative record** (incumbents only, Congress.gov) — sponsored bills, and a
   voting record table (bill · date · Yea/Nay/Present/Not Voting · topic · outcome).
5. **Disclosures** (House Clerk / Senate LDA) — financial & STOCK Act filings, lobbying.

## 6. Core component inventory (build these in Figma)

- **SourceChip** — "Source: [source] · as of [date]", links out. Used everywhere.
- **CandidateCard** — identical per candidate: name, party label, incumbent tag,
  amount raised, top-3 issue tags, source chip. *The equal-treatment guarantee lives
  here.*
- **PartyLabel** — small neutral pill (Democratic / Republican / Independent / …).
  Muted, equal weight; never themes a page.
- **DistrictHeader** + **DistrictMap** (map of the district boundary).
- **DemographicsStat** — labeled stat with a source chip.
- **IssueStance** — issue category + verbatim quote (blockquote) + source link.
- **FinanceSummary** + **DonationsByIndustry** chart + **TopDonors** list.
- **VoteRow** / **VotingRecordTable**.
- **BillCard** (sponsored/cosponsored).
- **OrderingDisclosure** — the "Ordered: alphabetical by surname" note.
- **SampleDataBanner** — dev-only; not part of the production design.

## 7. Data each surface shows (so mockups use real fields)

| Surface | Fields (all cited) | Source |
| --- | --- | --- |
| District header | label, population, median income, seat status, boundary map | Census, FEC |
| Demographics | median income/age, education, veteran %, race, employment | Census ACS |
| Candidate card | name, party, incumbent, total raised, top issues | FEC (+ platforms) |
| Finance | raised/spent/cash, small-dollar %, top industries & donors | FEC |
| Positions | verbatim issue quotes + source URL | campaign sites |
| Legislative | sponsored bills, roll-call votes | Congress.gov |
| Disclosures | financial, STOCK Act, lobbying | House Clerk, Senate LDA |

## 8. Tone & visual direction

- **Palette:** parchment/paper background, near-black ink text, one calm brand accent
  (a deep, neutral blue — "the well"). Party colors appear *only* as tiny label pills.
- **Type:** an editorial serif for headings (authority, calm) + a clean sans for data
  and UI. High legibility, comfortable line length.
- **Layout:** generous whitespace, clear hierarchy, card-based comparison, tables for
  records. Mobile-first single column that expands to two-column comparison on desktop.
- **Motion:** minimal, functional. No dramatic transitions. Trust > flash.
- **Iconography:** simple, civic, understated. A subtle well/water motif for brand.

## 9. Explicit non-goals (do NOT design these)

- No left/right ideology sliders, "match score," or "best candidate for you" quiz.
- No win-probability, grades, or rankings of candidates.
- No red/blue page theming or any layout that gives one candidate more prominence.
- No comment sections, reactions, or social-engagement features on candidates.

## 10. The north-star screen

If Figma delivers **one** concept, make it the **District page** on mobile: the map +
key district facts up top, then a clean, scannable stack of *identical* candidate cards,
each with a visible source chip and neutral party label — a voter's 30-second answer to
"who's on my ballot and what do they stand for," with receipts.
