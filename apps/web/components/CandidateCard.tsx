import Link from "next/link";
import type { CandidateSummary } from "@/lib/types";
import { ISSUE_LABELS } from "@mimir/shared";
import { PartyLabel } from "./PartyLabel";
import { SourceBadge } from "./SourceBadge";

// The at-a-glance candidate summary. IDENTICAL structure for every candidate — this
// component is the enforcement point for equal visual treatment (NONPARTISAN_POLICY).
//
// Markup note: the whole card is clickable via the stretched-link pattern (the name's
// Link covers the card with an ::after overlay). The SourceBadge is its own <a>, so
// it must NOT be nested inside a Link — nested anchors are invalid HTML and break
// hydration. It sits above the overlay via relative z-10.
export function CandidateCard({ candidate }: { candidate: CandidateSummary }) {
  return (
    <div className="relative rounded border border-black/10 p-4 hover:border-well">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium">
          <Link
            href={`/candidates/${candidate.id}`}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {candidate.fullName}
          </Link>
        </h3>
        <PartyLabel party={candidate.party} />
      </div>

      <div className="mt-1 flex items-center gap-2 text-xs text-ink/60">
        {candidate.isIncumbent && (
          <span className="rounded bg-black/5 px-1.5 py-0.5">Incumbent</span>
        )}
        {candidate.totalRaised != null && (
          <span>Raised ${candidate.totalRaised.toLocaleString()}</span>
        )}
      </div>

      {candidate.topIssues.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1">
          {candidate.topIssues.map((issue) => (
            <li
              key={issue}
              className="rounded-full border border-black/10 px-2 py-0.5 text-xs text-ink/70"
            >
              {ISSUE_LABELS[issue]}
            </li>
          ))}
        </ul>
      )}

      <div className="relative z-10 mt-3 w-fit">
        <SourceBadge source={candidate.source} />
      </div>
    </div>
  );
}
