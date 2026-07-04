import type { Party } from "@mimir/shared";
import { partyStyle } from "@/lib/party";

// Party shown as a small color-coded pill — a colored dot + label. Factual color,
// applied identically to every party. See lib/party.ts.
export function PartyLabel({ party, className = "" }: { party: Party; className?: string }) {
  const s = partyStyle(party);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
      style={{ background: s.tint, color: s.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}
