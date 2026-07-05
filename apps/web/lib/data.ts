// Data-access facade for the web app. READ-ONLY.
//
// Selects a provider at runtime:
//   MIMIR_DATA_SOURCE=fixtures  (default) — pure-TS fictional sample data; no DB.
//   MIMIR_DATA_SOURCE=prisma              — live database (requires `prisma generate`).
//
// The Prisma provider is loaded via dynamic import so the default fixtures build has
// no dependency on the generated Prisma client. Pages import ONLY from this module.

import type {
  CandidateDetail,
  DistrictDetail,
  DistrictSummary,
  StateSummary,
  StatewideRace,
} from "./types";
import * as fixtures from "./providers/fixtures";

export const DATA_SOURCE = process.env.MIMIR_DATA_SOURCE === "prisma" ? "prisma" : "fixtures";
export const USING_SAMPLE_DATA = DATA_SOURCE === "fixtures";

type Provider = {
  listStates(): Promise<StateSummary[]>;
  listDistrictsByState(abbr: string): Promise<DistrictSummary[]>;
  getDistrict(geoid: string): Promise<DistrictDetail | null>;
  getCandidate(id: string): Promise<CandidateDetail | null>;
  districtParties(): Promise<Record<string, string>>;
  listSenateRaces(): Promise<StatewideRace[]>;
};

async function provider(): Promise<Provider> {
  if (DATA_SOURCE === "prisma") return import("./providers/prisma");
  return fixtures;
}

/** geoid -> incumbent party, for color-coding the national map. */
export async function districtParties(): Promise<Record<string, string>> {
  return (await provider()).districtParties();
}

/** 2026 statewide Senate races with candidates. */
export async function listSenateRaces(): Promise<StatewideRace[]> {
  return (await provider()).listSenateRaces();
}

export async function listStates(): Promise<StateSummary[]> {
  return (await provider()).listStates();
}

export async function listDistrictsByState(abbr: string): Promise<DistrictSummary[]> {
  return (await provider()).listDistrictsByState(abbr);
}

export async function getDistrict(geoid: string): Promise<DistrictDetail | null> {
  return (await provider()).getDistrict(geoid);
}

export async function getCandidate(id: string): Promise<CandidateDetail | null> {
  return (await provider()).getCandidate(id);
}
