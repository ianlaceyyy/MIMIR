// View models the pages render. These are the shapes the data layer returns —
// deliberately decoupled from Prisma rows so the UI stays stable as the schema grows.

import type { IssueCategory, Party, SourceRef } from "@mimir/shared";

export interface StateSummary {
  fips: string;
  abbr: string;
  name: string;
  districtCount: number;
}

export interface DistrictSummary {
  id: string;
  geoid: string;
  stateAbbr: string;
  number: number; // 0 = at-large
  label: string; // e.g. "IL-13"
  cookPvi: string | null;
  isOpenSeat: boolean;
  candidateCount: number;
}

export interface CandidateSummary {
  id: string;
  fullName: string;
  party: Party;
  isIncumbent: boolean;
  campaignWebsiteUrl: string | null;
  totalRaised: number | null;
  topIssues: IssueCategory[];
  source: SourceRef; // provenance for the roster entry
}

export interface DistrictDetail extends DistrictSummary {
  population: number | null;
  demographics: DemographicsView | null;
  candidates: CandidateSummary[];
  geometryGeoJson: unknown | null; // for the map
  sources: SourceRef[];
}

export interface DemographicsView {
  vintage: number;
  medianIncome: number | null;
  medianAge: number | null;
  bachelorsPlusShare: number | null;
  veteranShare: number | null;
  source: SourceRef;
}

export interface IssueStanceView {
  category: IssueCategory;
  stanceQuote: string; // verbatim
  sourceUrl: string;
  extractedAt: string;
}

export interface FinanceView {
  cycle: number;
  totalRaised: number;
  totalSpent: number;
  cashOnHand: number;
  smallDollarShare: number | null;
  individualShare?: number | null;
  pacShare?: number | null;
  topIndustries: { industry: string; total: number }[];
  source: SourceRef;
}

export interface StatewideRace {
  stateFips: string;
  stateAbbr: string;
  stateName: string;
  isOpenSeat: boolean;
  candidates: CandidateSummary[];
}

export interface CandidateDetail extends CandidateSummary {
  districtLabel: string;
  finance: FinanceView | null;
  topDonors?: { employer: string; amount: number }[];
  issueStances: IssueStanceView[];
  // Incumbent-only sections; empty for challengers.
  recentVotes: { billRef: string; position: string; date: string | null }[];
  sponsoredBills: { title: string; latestAction: string | null; policyArea?: string | null }[];
}
