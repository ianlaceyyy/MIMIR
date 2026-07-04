import Link from "next/link";
import type { CandidateSummary } from "@/lib/types";
import { ISSUE_LABELS } from "@mimir/shared";
import { partyStyle } from "@/lib/party";
import { PartyLabel } from "./PartyLabel";

// At-a-glance candidate card: floating glass, a party-colored accent rail, and the
// key facts. Identical structure for every candidate. Whole card is clickable via the
// stretched-link pattern on the name.
function money(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${n}`;
}

export function CandidateCard({ candidate }: { candidate: CandidateSummary }) {
  const s = partyStyle(candidate.party);
  return (
    <div className="glass glass-hover relative overflow-hidden rounded-2xl p-4">
      {/* party accent rail */}
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: s.color, opacity: 0.85 }}
      />

      <div className="flex items-start justify-between gap-2 pl-2">
        <h3 className="font-semibold leading-tight tracking-tight">
          <Link
            href={`/candidates/${candidate.id}`}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {candidate.fullName}
          </Link>
        </h3>
        <PartyLabel party={candidate.party} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-2 text-xs text-muted">
        <span
          className="rounded-full px-2 py-0.5 font-medium"
          style={{ background: s.tint, color: s.color }}
        >
          {candidate.isIncumbent ? "Incumbent" : "Challenger"}
        </span>
        {candidate.totalRaised != null && candidate.totalRaised > 0 && (
          <span className="rounded-full bg-black/[0.04] px-2 py-0.5">
            {money(candidate.totalRaised)} raised
          </span>
        )}
      </div>

      {candidate.topIssues.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1 pl-2">
          {candidate.topIssues.map((issue) => (
            <li
              key={issue}
              className="rounded-full border hairline bg-white/40 px-2 py-0.5 text-xs text-muted"
            >
              {ISSUE_LABELS[issue]}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex items-center gap-1.5 pl-2 text-[11px] text-muted/80">
        <span className="h-1 w-1 rounded-full bg-current" />
        Source: {candidate.source.name}
      </div>
    </div>
  );
}
