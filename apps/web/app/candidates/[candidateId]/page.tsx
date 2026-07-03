import Link from "next/link";
import { notFound } from "next/navigation";
import { getCandidate } from "@/lib/data";
import { PartyLabel } from "@/components/PartyLabel";
import { SourceBadge } from "@/components/SourceBadge";
import { ISSUE_LABELS } from "@mimir/shared";

export const dynamic = "force-dynamic";

// Full candidate profile: bio, finance, stated positions, and (for incumbents)
// legislative + voting record. Every section cites its source.
export default async function CandidatePage({
  params,
}: {
  params: { candidateId: string };
}) {
  const candidate = await getCandidate(params.candidateId);
  if (!candidate) notFound();

  return (
    <div className="space-y-8">
      <Link href="/" className="text-sm text-well underline">
        ← Back
      </Link>

      <header className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{candidate.fullName}</h1>
        <PartyLabel party={candidate.party} />
        {candidate.isIncumbent && (
          <span className="rounded bg-black/5 px-2 py-0.5 text-xs">Incumbent</span>
        )}
      </header>
      <p className="text-sm text-ink/60">{candidate.districtLabel}</p>

      {/* Stated positions — verbatim quotes only, each with a citation. */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Stated positions</h2>
        {candidate.issueStances.length === 0 ? (
          <p className="text-sm text-ink/60">No stated positions extracted yet.</p>
        ) : (
          <ul className="space-y-4">
            {candidate.issueStances.map((s, i) => (
              <li key={i} className="rounded border border-black/10 p-4">
                <div className="mb-1 text-xs font-medium uppercase tracking-wide text-ink/60">
                  {ISSUE_LABELS[s.category]}
                </div>
                <blockquote className="text-sm italic">“{s.stanceQuote}”</blockquote>
                <a
                  href={s.sourceUrl}
                  className="mt-2 inline-block text-xs text-well underline"
                >
                  Source ({new Date(s.extractedAt).toLocaleDateString()})
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Campaign finance — neutral, mechanical aggregates. */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Campaign finance</h2>
        {candidate.finance ? (
          <div className="rounded border border-black/10 p-4 text-sm">
            <dl className="grid grid-cols-2 gap-2">
              <dt className="text-ink/60">Total raised</dt>
              <dd>${candidate.finance.totalRaised.toLocaleString()}</dd>
              <dt className="text-ink/60">Total spent</dt>
              <dd>${candidate.finance.totalSpent.toLocaleString()}</dd>
              <dt className="text-ink/60">Cash on hand</dt>
              <dd>${candidate.finance.cashOnHand.toLocaleString()}</dd>
            </dl>
            <div className="mt-3">
              <SourceBadge source={candidate.finance.source} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink/60">No FEC finance data on file yet.</p>
        )}
      </section>

      {candidate.isIncumbent && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Legislative record</h2>
          <p className="text-sm text-ink/60">
            Sponsored bills and recent votes (Congress.gov) render here for sitting
            members. TODO: wire up in lib/data.getCandidate().
          </p>
        </section>
      )}
    </div>
  );
}
