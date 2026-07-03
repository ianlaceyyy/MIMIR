import type { Party } from "@mimir/shared";

// Party shown as a small, equal-weight factual label. Colors are muted and used
// ONLY here — never to theme a page or elevate one candidate. See NONPARTISAN_POLICY.
const LABEL: Record<Party, string> = {
  DEMOCRATIC: "Democratic",
  REPUBLICAN: "Republican",
  LIBERTARIAN: "Libertarian",
  GREEN: "Green",
  INDEPENDENT: "Independent",
  OTHER: "Other",
  UNKNOWN: "Unknown",
};

export function PartyLabel({ party }: { party: Party }) {
  return (
    <span className="rounded border border-black/15 bg-white px-2 py-0.5 text-xs text-ink/80">
      {LABEL[party]}
    </span>
  );
}
