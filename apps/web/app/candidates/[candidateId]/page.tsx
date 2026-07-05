import Link from "next/link";
import { notFound } from "next/navigation";
import { getCandidate } from "@/lib/data";
import { PartyLabel } from "@/components/PartyLabel";
import { ISSUE_LABELS } from "@mimir/shared";
import { partyStyle } from "@/lib/party";

export const dynamic = "force-dynamic";

function money(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}
function pct(x: number | null | undefined): string | null {
  return x == null ? null : `${Math.round(x * 100)}%`;
}

// Full candidate profile: identity, campaign finance + donor composition, stated
// positions, and (for incumbents) sponsored bills. Every section cites its source.
export default async function CandidatePage({
  params,
}: {
  params: { candidateId: string };
}) {
  const c = await getCandidate(params.candidateId);
  if (!c) notFound();
  const s = partyStyle(c.party);
  const fin = c.finance;

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-[#2f6fed] underline underline-offset-2">
        ← Map
      </Link>

      {/* Identity */}
      <header className="glass relative overflow-hidden rounded-3xl p-6">
        <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: s.color }} />
        <div className="flex flex-wrap items-center gap-3 pl-2">
          <h1 className="text-3xl font-semibold tracking-tight">{c.fullName}</h1>
          <PartyLabel party={c.party} />
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ background: s.tint, color: s.color }}
          >
            {c.isIncumbent ? "Incumbent" : "Challenger"}
          </span>
        </div>
        <p className="mt-1 pl-2 text-sm text-muted">
          {c.districtLabel} ·{" "}
          {c.campaignWebsiteUrl ? (
            <a href={c.campaignWebsiteUrl} className="underline" target="_blank" rel="noreferrer">
              Campaign site
            </a>
          ) : (
            "House"
          )}
        </p>
      </header>

      {/* Campaign finance + donor composition */}
      <section className="glass rounded-3xl p-6">
        <h2 className="text-lg font-semibold tracking-tight">Campaign finance</h2>
        {fin ? (
          <>
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <Stat label="Raised" value={money(fin.totalRaised)} />
              <Stat label="Spent" value={money(fin.totalSpent)} />
              <Stat label="Cash on hand" value={money(fin.cashOnHand)} />
            </div>

            <h3 className="mt-6 text-xs font-medium uppercase tracking-wide text-muted">
              Where the money came from
            </h3>
            <div className="mt-2 space-y-2">
              <ShareBar
                label="Itemized individual gifts"
                value={fin.individualShare}
                color={s.color}
              />
              <ShareBar label="PAC contributions" value={fin.pacShare} color="#8a94a6" />
            </div>
            <p className="mt-4 text-xs text-muted">
              Itemized individual and PAC contributions as a share of total receipts.
              Source: Federal Election Commission.
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">No FEC finance data on file yet.</p>
        )}
      </section>

      {/* Stated positions */}
      <section className="glass rounded-3xl p-6">
        <h2 className="text-lg font-semibold tracking-tight">Stated positions</h2>
        {c.issueStances.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            No stated positions extracted yet — coming from the candidate&rsquo;s official
            material.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {c.issueStances.map((st, i) => (
              <li key={i} className="rounded-2xl border hairline bg-white/40 p-4">
                <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
                  {ISSUE_LABELS[st.category]}
                </div>
                <blockquote className="text-sm italic">“{st.stanceQuote}”</blockquote>
                <a href={st.sourceUrl} className="mt-2 inline-block text-xs text-[#2f6fed] underline">
                  Source
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Legislative record (incumbents) */}
      {c.isIncumbent && (
        <section className="glass rounded-3xl p-6">
          <h2 className="text-lg font-semibold tracking-tight">Legislative record</h2>
          {c.sponsoredBills.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No sponsored bills on file yet.</p>
          ) : (
            <>
              <h3 className="mt-3 text-xs font-medium uppercase tracking-wide text-muted">
                Sponsored bills
              </h3>
              <ul className="mt-2 space-y-2">
                {c.sponsoredBills.map((b, i) => (
                  <li key={i} className="rounded-2xl border hairline bg-white/40 p-3 text-sm">
                    <div className="font-medium">{b.title}</div>
                    {b.latestAction && (
                      <div className="mt-1 text-xs text-muted">{b.latestAction}</div>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted">Source: Congress.gov</p>
            </>
          )}
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-0.5 text-xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function ShareBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number | null | undefined;
  color: string;
}) {
  const p = pct(value);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="font-medium">{p ?? "—"}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-black/[0.06]">
        <div
          className="h-full rounded-full"
          style={{ width: p ?? "0%", background: color, opacity: 0.85 }}
        />
      </div>
    </div>
  );
}
