// Party color-coding. Applied equally to every party — factual color, not ranking.
// Colors are the conventional US party hues, tuned for a light, translucent UI.

import type { Party } from "@mimir/shared";

export interface PartyStyle {
  label: string;
  /** solid accent (text, borders, dots) */
  color: string;
  /** translucent tint for glass fills / glows */
  tint: string;
}

export const PARTY_STYLE: Record<Party, PartyStyle> = {
  DEMOCRATIC: { label: "Democratic", color: "#2f6fed", tint: "rgba(47,111,237,0.14)" },
  REPUBLICAN: { label: "Republican", color: "#e0483d", tint: "rgba(224,72,61,0.14)" },
  INDEPENDENT: { label: "Independent", color: "#7c5cff", tint: "rgba(124,92,255,0.14)" },
  LIBERTARIAN: { label: "Libertarian", color: "#d4a017", tint: "rgba(212,160,23,0.16)" },
  GREEN: { label: "Green", color: "#17a34a", tint: "rgba(23,163,74,0.14)" },
  OTHER: { label: "Other", color: "#6b7280", tint: "rgba(107,114,128,0.12)" },
  UNKNOWN: { label: "Unknown", color: "#9aa1ab", tint: "rgba(154,161,171,0.10)" },
};

export function partyStyle(party: Party | string | null | undefined): PartyStyle {
  return PARTY_STYLE[(party as Party) ?? "UNKNOWN"] ?? PARTY_STYLE.UNKNOWN;
}
