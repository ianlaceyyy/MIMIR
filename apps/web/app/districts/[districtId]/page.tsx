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
    <div className="space-y-6">
      <Link href="/" className="text-sm text-[#2f6fed] underline underline-offset-2">
        ← Map
      </Link>

      <DistrictHeader district={district} />

      <section>
        <div className="mb-3 flex items-baseline justify-between px-1">
          <h2 className="text-lg font-semibold tracking-tight">
            Candidates ({district.candidates.length})
          </h2>
          {/* Non-partisan guarantee: disclose the ordering rule. */}
          <span className="text-xs text-muted">Ordered: {CANDIDATE_SORT_RULE}</span>
        </div>

        {district.candidates.length === 0 ? (
          <p className="glass rounded-2xl p-6 text-sm text-muted">
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
