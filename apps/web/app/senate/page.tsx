import Link from "next/link";
import { listSenateRaces } from "@/lib/data";
import { CandidateCard } from "@/components/CandidateCard";
import { CANDIDATE_SORT_RULE } from "@mimir/shared";

export const dynamic = "force-dynamic";

// Statewide Senate races for 2026 — the non-district complement to the House map.
export default async function SenatePage() {
  const races = await listSenateRaces();

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-[#2f6fed] underline underline-offset-2">
        ← Map
      </Link>

      <section className="px-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          2026 Senate races
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Statewide U.S. Senate contests — every candidate, source-cited from the FEC.
          Ordered: {CANDIDATE_SORT_RULE.toLowerCase()}.
        </p>
      </section>

      {races.length === 0 ? (
        <p className="glass rounded-2xl p-6 text-sm text-muted">No Senate races loaded yet.</p>
      ) : (
        <div className="space-y-6">
          {races.map((race) => (
            <section key={race.stateFips} className="glass rounded-3xl p-5">
              <div className="mb-3 flex items-baseline justify-between px-1">
                <h2 className="text-lg font-semibold tracking-tight">
                  {race.stateName}{" "}
                  <span className="text-sm font-normal text-muted">
                    · Senate ({race.candidates.length})
                  </span>
                </h2>
                {race.isOpenSeat && (
                  <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-xs text-muted">
                    Open seat
                  </span>
                )}
              </div>
              {race.candidates.length === 0 ? (
                <p className="px-1 text-sm text-muted">No candidates recorded yet.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {race.candidates.map((c) => (
                    <CandidateCard key={c.id} candidate={c} />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
