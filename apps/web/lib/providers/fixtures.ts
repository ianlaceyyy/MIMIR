// Fixtures data provider — the DEFAULT source while we build out the UI and
// formalize the data model. Everything here is FICTIONAL sample content used to
// exercise every field the UI renders. No real candidates, no real quotes.
//
// States and district labels are real public geography; the candidate rosters,
// finance figures, and stated positions are invented. A visible SAMPLE DATA banner
// (components/SampleDataBanner) is shown site-wide while this provider is active.
//
// Swap to live data by setting MIMIR_DATA_SOURCE=prisma once ingestion has run.

import { orderCandidates } from "@mimir/shared";
import type {
  CandidateDetail,
  CandidateSummary,
  DistrictDetail,
  DistrictSummary,
  StateSummary,
} from "../types";

const now = "2026-07-01T00:00:00.000Z";

const fecSource = (path: string) => ({
  kind: "FEC" as const,
  name: "Federal Election Commission",
  url: `https://api.open.fec.gov/v1/${path}`,
  fetchedAt: now,
});

const censusSource = (geoid: string) => ({
  kind: "CENSUS" as const,
  name: "U.S. Census Bureau (ACS)",
  url: `https://api.census.gov/data/2023/acs/acs5?for=congressional+district:${geoid}`,
  fetchedAt: now,
});

// --- States ----------------------------------------------------------------

const STATES: StateSummary[] = [
  { fips: "17", abbr: "IL", name: "Illinois", districtCount: 2 },
  { fips: "36", abbr: "NY", name: "New York", districtCount: 2 },
];

// --- Candidates (fictional) -------------------------------------------------
// Keyed by id. Each is a full CandidateDetail; summaries are derived from these.

const CANDIDATES: Record<string, CandidateDetail> = {
  "cand-vega": {
    id: "cand-vega",
    fullName: "Marisol Vega",
    party: "DEMOCRATIC",
    isIncumbent: true,
    campaignWebsiteUrl: "https://example.org/vega",
    totalRaised: 2_450_000,
    topIssues: ["HEALTHCARE", "HOUSING", "CLIMATE"],
    source: fecSource("candidate/H0IL13001"),
    districtLabel: "IL-13",
    finance: {
      cycle: 2026,
      totalRaised: 2_450_000,
      totalSpent: 1_310_000,
      cashOnHand: 1_140_000,
      smallDollarShare: 0.42,
      topIndustries: [
        { industry: "Healthcare", total: 320_000 },
        { industry: "Education", total: 210_000 },
        { industry: "Labor", total: 185_000 },
      ],
      source: fecSource("candidate/H0IL13001/totals"),
    },
    issueStances: [
      {
        category: "HEALTHCARE",
        stanceQuote:
          "I will fight to cap out-of-pocket prescription costs so no family has to choose between medicine and rent.",
        sourceUrl: "https://example.org/vega/issues/healthcare",
        extractedAt: now,
      },
      {
        category: "HOUSING",
        stanceQuote:
          "We need to build more affordable homes and protect renters from unfair increases.",
        sourceUrl: "https://example.org/vega/issues/housing",
        extractedAt: now,
      },
    ],
    recentVotes: [
      { billRef: "hr-1234-119", position: "YEA", date: "2026-05-14" },
      { billRef: "hr-0876-119", position: "NAY", date: "2026-04-30" },
    ],
    sponsoredBills: [
      {
        title: "Affordable Insulin Access Act (sample)",
        latestAction: "Referred to the Committee on Energy and Commerce",
      },
    ],
  },
  "cand-whitfield": {
    id: "cand-whitfield",
    fullName: "Grant Whitfield",
    party: "REPUBLICAN",
    isIncumbent: false,
    campaignWebsiteUrl: "https://example.org/whitfield",
    totalRaised: 1_980_000,
    topIssues: ["TAXES", "ENERGY", "IMMIGRATION"],
    source: fecSource("candidate/H0IL13002"),
    districtLabel: "IL-13",
    finance: {
      cycle: 2026,
      totalRaised: 1_980_000,
      totalSpent: 1_050_000,
      cashOnHand: 930_000,
      smallDollarShare: 0.35,
      topIndustries: [
        { industry: "Energy", total: 265_000 },
        { industry: "Finance", total: 240_000 },
        { industry: "Agriculture", total: 160_000 },
      ],
      source: fecSource("candidate/H0IL13002/totals"),
    },
    issueStances: [
      {
        category: "TAXES",
        stanceQuote:
          "Small businesses in our district deserve lower taxes and less red tape so they can hire and grow.",
        sourceUrl: "https://example.org/whitfield/issues/economy",
        extractedAt: now,
      },
      {
        category: "ENERGY",
        stanceQuote:
          "I support an all-of-the-above energy strategy that keeps costs down for working families.",
        sourceUrl: "https://example.org/whitfield/issues/energy",
        extractedAt: now,
      },
    ],
    recentVotes: [],
    sponsoredBills: [],
  },
  "cand-okoro": {
    id: "cand-okoro",
    fullName: "Dana Okoro",
    party: "INDEPENDENT",
    isIncumbent: false,
    campaignWebsiteUrl: "https://example.org/okoro",
    totalRaised: 410_000,
    topIssues: ["CRIMINAL_JUSTICE", "EDUCATION"],
    source: fecSource("candidate/H0IL13003"),
    districtLabel: "IL-13",
    finance: {
      cycle: 2026,
      totalRaised: 410_000,
      totalSpent: 220_000,
      cashOnHand: 190_000,
      smallDollarShare: 0.71,
      topIndustries: [
        { industry: "Education", total: 58_000 },
        { industry: "Technology", total: 41_000 },
      ],
      source: fecSource("candidate/H0IL13003/totals"),
    },
    issueStances: [
      {
        category: "EDUCATION",
        stanceQuote:
          "Every student should have access to a great public school regardless of their zip code.",
        sourceUrl: "https://example.org/okoro/issues/education",
        extractedAt: now,
      },
    ],
    recentVotes: [],
    sponsoredBills: [],
  },
  "cand-lindqvist": {
    id: "cand-lindqvist",
    fullName: "Erik Lindqvist",
    party: "DEMOCRATIC",
    isIncumbent: true,
    campaignWebsiteUrl: "https://example.org/lindqvist",
    totalRaised: 3_120_000,
    topIssues: ["ECONOMIC_POLICY", "TECHNOLOGY", "LABOR"],
    source: fecSource("candidate/H0NY03001"),
    districtLabel: "NY-03",
    finance: {
      cycle: 2026,
      totalRaised: 3_120_000,
      totalSpent: 1_890_000,
      cashOnHand: 1_230_000,
      smallDollarShare: 0.29,
      topIndustries: [
        { industry: "Finance", total: 520_000 },
        { industry: "Technology", total: 415_000 },
        { industry: "Labor", total: 260_000 },
      ],
      source: fecSource("candidate/H0NY03001/totals"),
    },
    issueStances: [
      {
        category: "ECONOMIC_POLICY",
        stanceQuote:
          "We will invest in the industries of the future while making sure workers share in the gains.",
        sourceUrl: "https://example.org/lindqvist/issues/economy",
        extractedAt: now,
      },
    ],
    recentVotes: [{ billRef: "s-0455-119", position: "YEA", date: "2026-06-02" }],
    sponsoredBills: [
      { title: "Regional Broadband Expansion Act (sample)", latestAction: "Introduced in Senate" },
    ],
  },
  "cand-reyes": {
    id: "cand-reyes",
    fullName: "Priya Reyes",
    party: "REPUBLICAN",
    isIncumbent: false,
    campaignWebsiteUrl: "https://example.org/reyes",
    totalRaised: 2_640_000,
    topIssues: ["IMMIGRATION", "DEFENSE", "TAXES"],
    source: fecSource("candidate/H0NY03002"),
    districtLabel: "NY-03",
    finance: {
      cycle: 2026,
      totalRaised: 2_640_000,
      totalSpent: 1_470_000,
      cashOnHand: 1_170_000,
      smallDollarShare: 0.38,
      topIndustries: [
        { industry: "Finance", total: 480_000 },
        { industry: "Defense", total: 300_000 },
      ],
      source: fecSource("candidate/H0NY03002/totals"),
    },
    issueStances: [
      {
        category: "IMMIGRATION",
        stanceQuote:
          "We can secure the border and honor our tradition as a nation of immigrants at the same time.",
        sourceUrl: "https://example.org/reyes/issues/immigration",
        extractedAt: now,
      },
    ],
    recentVotes: [],
    sponsoredBills: [],
  },
};

// --- Districts --------------------------------------------------------------

interface FixtureDistrict {
  detail: Omit<DistrictDetail, "candidates" | "candidateCount">;
  candidateIds: string[];
}

const DISTRICTS: Record<string, FixtureDistrict> = {
  "1713": {
    detail: {
      id: "dist-il-13",
      geoid: "1713",
      stateAbbr: "IL",
      number: 13,
      label: "IL-13",
      cookPvi: "D+3",
      isOpenSeat: false,
      population: 763_000,
      demographics: {
        vintage: 2023,
        medianIncome: 64_200,
        medianAge: 36.4,
        bachelorsPlusShare: 0.34,
        veteranShare: 0.06,
        source: censusSource("1713"),
      },
      geometryGeoJson: null,
      sources: [fecSource("elections?state=IL&district=13"), censusSource("1713")],
    },
    candidateIds: ["cand-vega", "cand-whitfield", "cand-okoro"],
  },
  "1707": {
    detail: {
      id: "dist-il-07",
      geoid: "1707",
      stateAbbr: "IL",
      number: 7,
      label: "IL-07",
      cookPvi: "D+38",
      isOpenSeat: true,
      population: 751_000,
      demographics: {
        vintage: 2023,
        medianIncome: 58_900,
        medianAge: 34.1,
        bachelorsPlusShare: 0.41,
        veteranShare: 0.04,
        source: censusSource("1707"),
      },
      geometryGeoJson: null,
      sources: [fecSource("elections?state=IL&district=07")],
    },
    candidateIds: [],
  },
  "3603": {
    detail: {
      id: "dist-ny-03",
      geoid: "3603",
      stateAbbr: "NY",
      number: 3,
      label: "NY-03",
      cookPvi: "D+2",
      isOpenSeat: false,
      population: 776_000,
      demographics: {
        vintage: 2023,
        medianIncome: 112_400,
        medianAge: 41.8,
        bachelorsPlusShare: 0.49,
        veteranShare: 0.05,
        source: censusSource("3603"),
      },
      geometryGeoJson: null,
      sources: [fecSource("elections?state=NY&district=03"), censusSource("3603")],
    },
    candidateIds: ["cand-lindqvist", "cand-reyes"],
  },
  "3610": {
    detail: {
      id: "dist-ny-10",
      geoid: "3610",
      stateAbbr: "NY",
      number: 10,
      label: "NY-10",
      cookPvi: "D+37",
      isOpenSeat: false,
      population: 769_000,
      demographics: null,
      geometryGeoJson: null,
      sources: [fecSource("elections?state=NY&district=10")],
    },
    candidateIds: [],
  },
};

// --- Helpers ----------------------------------------------------------------

function toSummary(c: CandidateDetail): CandidateSummary {
  return {
    id: c.id,
    fullName: c.fullName,
    party: c.party,
    isIncumbent: c.isIncumbent,
    campaignWebsiteUrl: c.campaignWebsiteUrl,
    totalRaised: c.totalRaised,
    topIssues: c.topIssues,
    source: c.source,
  };
}

// --- Public API (matches lib/data.ts contract) ------------------------------

export async function listStates(): Promise<StateSummary[]> {
  return STATES;
}

export async function listDistrictsByState(abbr: string): Promise<DistrictSummary[]> {
  const upper = abbr.toUpperCase();
  return Object.values(DISTRICTS)
    .filter((d) => d.detail.stateAbbr === upper)
    .sort((a, b) => a.detail.number - b.detail.number)
    .map((d) => ({
      id: d.detail.id,
      geoid: d.detail.geoid,
      stateAbbr: d.detail.stateAbbr,
      number: d.detail.number,
      label: d.detail.label,
      cookPvi: d.detail.cookPvi,
      isOpenSeat: d.detail.isOpenSeat,
      candidateCount: d.candidateIds.length,
    }));
}

export async function getDistrict(geoid: string): Promise<DistrictDetail | null> {
  const d = DISTRICTS[geoid];
  if (!d) return null;
  const candidates = orderCandidates(
    d.candidateIds.map((id) => toSummary(CANDIDATES[id])),
  );
  return { ...d.detail, candidates, candidateCount: candidates.length };
}

export async function getCandidate(id: string): Promise<CandidateDetail | null> {
  return CANDIDATES[id] ?? null;
}
