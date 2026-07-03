// Shared vocabulary used by the web app (and mirrored by the Python service and
// Prisma schema). Keeping these in one place is part of the non-partisan contract:
// the issue vocabulary is fixed and cannot be silently expanded.

export const ISSUE_CATEGORIES = [
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
] as const;
export type IssueCategory = (typeof ISSUE_CATEGORIES)[number];

export const ISSUE_LABELS: Record<IssueCategory, string> = {
  ECONOMIC_POLICY: "Economic Policy",
  FOREIGN_POLICY: "Foreign Policy",
  IMMIGRATION: "Immigration",
  HEALTHCARE: "Healthcare",
  TAXES: "Taxes",
  DEFENSE: "Defense",
  EDUCATION: "Education",
  ENERGY: "Energy",
  CLIMATE: "Climate",
  AI: "AI",
  TECHNOLOGY: "Technology",
  HOUSING: "Housing",
  LABOR: "Labor",
  SOCIAL_ISSUES: "Social Issues",
  CRIMINAL_JUSTICE: "Criminal Justice",
};

export type Party =
  | "DEMOCRATIC"
  | "REPUBLICAN"
  | "LIBERTARIAN"
  | "GREEN"
  | "INDEPENDENT"
  | "OTHER"
  | "UNKNOWN";

export type SourceKind =
  | "FEC"
  | "CONGRESS"
  | "CENSUS"
  | "X"
  | "CAMPAIGN_SITE"
  | "HOUSE_CLERK"
  | "SENATE_LDA"
  | "MIT_ELECTION_LAB";

/** A citation shown next to every fact in the UI. */
export interface SourceRef {
  kind: SourceKind;
  name: string;
  url: string;
  fetchedAt: string; // ISO
}

/**
 * NON-PARTISAN GUARANTEE: the one place candidate order is decided.
 * Default rule is alphabetical by surname. Party is never the sort key.
 * Keep this the *only* function that orders candidates for display, and always
 * disclose the active rule in the UI. See docs/NONPARTISAN_POLICY.md.
 */
export const CANDIDATE_SORT_RULE = "Alphabetical by surname (A→Z)" as const;

export function orderCandidates<T extends { fullName: string }>(candidates: T[]): T[] {
  const surname = (name: string) => name.trim().split(/\s+/).slice(-1)[0].toLowerCase();
  return [...candidates].sort((a, b) =>
    surname(a.fullName).localeCompare(surname(b.fullName)),
  );
}
