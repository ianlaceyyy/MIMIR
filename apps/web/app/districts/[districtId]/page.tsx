import Link from "next/link";
import { notFound } from "next/navigation";
import { getDistrict } from "@/lib/data";
import { CandidateCard } from "@/components/CandidateCard";
import { DistrictHeader } from "@/components/DistrictHeader";
import { CANDIDATE_SORT_RULE } from "@mimir/shared";

export const dynamic = "force-dynamic";

// The core page: one district's seat and EVERY candidate running for it.
// [districtId] is the Census GEOID.
export default async function DistrictPage({
  params,
}: {
  params: { districtId: string };
}) {
  const district = await getDistrict(params.districtId);
  if (!district) notFound();

  return (
    <div className="space-y-8">
      <Link
        href={`/states/${district.stateAbbr.toLowerCase()}`}
        className="text-sm text-well underline"
      >
        ← {district.stateAbbr} districts
      </Link>

      <DistrictHeader district={district} />

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">
            Candidates ({district.candidates.length})
          </h2>
          {/* Non-partisan guarantee: disclose the ordering rule. */}
          <span className="text-xs text-ink/50">Ordered: {CANDIDATE_SORT_RULE}</span>
        </div>

        {district.candidates.length === 0 ? (
          <p className="rounded border border-dashed border-black/20 p-6 text-sm text-ink/60">
            No candidates recorded for this seat yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {district.candidates.map((c) => (
              <CandidateCard key={c.id} candidate={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
