// Prisma data provider — the LIVE source, used when MIMIR_DATA_SOURCE=prisma.
// READ-ONLY: the site never mutates data. Each returned fact carries its SourceRef.
// Requires `prisma generate` (and a populated database) before use.
//
// Candidate ordering ALWAYS goes through orderCandidates() from @mimir/shared.

import { prisma } from "@mimir/db";
import { orderCandidates } from "@mimir/shared";
import type {
  CandidateDetail,
  DistrictDetail,
  DistrictSummary,
  StateSummary,
} from "../types";

export async function listStates(): Promise<StateSummary[]> {
  const states = await prisma.state.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { districts: true } } },
  });
  return states.map((s) => ({
    fips: s.fips,
    abbr: s.abbr,
    name: s.name,
    districtCount: s._count.districts,
  }));
}

export async function listDistrictsByState(abbr: string): Promise<DistrictSummary[]> {
  const districts = await prisma.district.findMany({
    where: { state: { abbr: abbr.toUpperCase() } },
    orderBy: { number: "asc" },
    include: {
      state: true,
      seats: { include: { _count: { select: { candidacies: true } } } },
    },
  });

  return districts.map((d) => {
    const currentSeat = d.seats[0];
    return {
      id: d.id,
      geoid: d.geoid,
      stateAbbr: d.state.abbr,
      number: d.number,
      label: districtLabel(d.state.abbr, d.number),
      cookPvi: d.cookPvi,
      isOpenSeat: currentSeat?.isOpenSeat ?? false,
      candidateCount: currentSeat?._count.candidacies ?? 0,
    };
  });
}

export async function getDistrict(geoid: string): Promise<DistrictDetail | null> {
  const d = await prisma.district.findUnique({
    where: { geoid },
    include: {
      state: true,
      demographics: true,
      seats: {
        orderBy: { cycle: "desc" },
        take: 1,
        include: {
          candidacies: {
            include: {
              candidate: { include: { financeSummaries: true, issueStances: true } },
            },
          },
        },
      },
    },
  });
  if (!d) return null;

  const seat = d.seats[0];
  const candidates = orderCandidates(
    (seat?.candidacies ?? []).map((c) => toCandidateSummary(c)),
  );

  // TODO: serialize PostGIS geometry to GeoJSON via a raw query (ST_AsGeoJSON).
  return {
    id: d.id,
    geoid: d.geoid,
    stateAbbr: d.state.abbr,
    number: d.number,
    label: districtLabel(d.state.abbr, d.number),
    cookPvi: d.cookPvi,
    isOpenSeat: seat?.isOpenSeat ?? false,
    candidateCount: candidates.length,
    population: d.population,
    demographics: null, // TODO map d.demographics + its SourceRef
    candidates,
    geometryGeoJson: null,
    sources: [],
  };
}

export async function getCandidate(id: string): Promise<CandidateDetail | null> {
  // TODO: assemble finance, issue stances, votes, and sponsored bills with SourceRefs.
  void prisma;
  void id;
  return null;
}

// --- helpers ---------------------------------------------------------------

export function districtLabel(stateAbbr: string, number: number): string {
  return number === 0 ? `${stateAbbr}-AL` : `${stateAbbr}-${number}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toCandidateSummary(candidacy: any) {
  const c = candidacy.candidate;
  return {
    id: c.id,
    fullName: c.fullName,
    party: c.party,
    isIncumbent: candidacy.status === "INCUMBENT",
    campaignWebsiteUrl: c.campaignWebsiteUrl,
    totalRaised: c.financeSummaries?.[0]?.totalRaised
      ? Number(c.financeSummaries[0].totalRaised)
      : null,
    topIssues: (c.issueStances ?? []).map((s: any) => s.category).slice(0, 3),
    source: {
      kind: "FEC" as const,
      name: "Federal Election Commission",
      url: "https://api.open.fec.gov/",
      fetchedAt: c.fetchedAt?.toISOString() ?? new Date(0).toISOString(),
    },
  };
}
