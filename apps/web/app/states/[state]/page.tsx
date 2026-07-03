import Link from "next/link";
import { notFound } from "next/navigation";
import { listDistrictsByState } from "@/lib/data";

// A state's districts. Each links to the seat page listing its candidates.
export default async function StatePage({ params }: { params: { state: string } }) {
  const districts = await listDistrictsByState(params.state);
  if (districts.length === 0) {
    // Could be an empty DB or an unknown state; treat unknown as 404 once seeded.
    return (
      <div className="space-y-4">
        <Link href="/" className="text-sm text-well underline">
          ← All states
        </Link>
        <p className="rounded border border-dashed border-black/20 p-6 text-sm text-ink/60">
          No districts loaded for {params.state.toUpperCase()} yet.
        </p>
      </div>
    );
  }

  const stateAbbr = districts[0].stateAbbr;

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-well underline">
        ← All states
      </Link>
      <h1 className="text-2xl font-semibold">{stateAbbr} — Congressional districts</h1>

      <ul className="divide-y divide-black/10 rounded border border-black/10">
        {districts.map((d) => (
          <li key={d.id}>
            <Link
              href={`/districts/${d.geoid}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-black/[0.02]"
            >
              <span className="font-medium">{d.label}</span>
              <span className="flex items-center gap-3 text-sm text-ink/60">
                {d.cookPvi && <span>PVI {d.cookPvi}</span>}
                {d.isOpenSeat && (
                  <span className="rounded bg-black/5 px-2 py-0.5 text-xs">Open seat</span>
                )}
                <span>{d.candidateCount} candidates</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Silence unused import until unknown-state handling is added.
void notFound;
