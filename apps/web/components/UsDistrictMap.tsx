"use client";

/**
 * Interactive U.S. map on the home page.
 *
 * Phase 1 — state-level navigation:
 *   • Renders all 50 states + DC/territories using AlbersUSA projection.
 *   • Clicking a state navigates to /states/{abbr}.
 *   • States are shaded by district count when that data is available.
 *
 * Phase 2 — congressional district overlay (future):
 *   • Drop in a 119th-CD TopoJSON asset (e.g. public/us-cd.json) and
 *     uncomment the district layer below; each district will link to
 *     /districts/{geoid}.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { geoAlbersUsa, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { StateSummary } from "@/lib/types";

// Minimal TopoJSON topology shape we need for type-safety without external deps.
type TopoTopology = {
  type: "Topology";
  objects: {
    states: {
      type: "GeometryCollection";
      geometries: Array<{ type: string; id: string | number; arcs: unknown }>;
    };
  };
  arcs: number[][][];
  transform?: { scale: [number, number]; translate: [number, number] };
};

// FIPS → two-letter abbreviation lookup.
const FIPS_TO_ABBR: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
  "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
  "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
  "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
  "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
  "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
  "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
  "56": "WY", "60": "AS", "66": "GU", "69": "MP", "72": "PR",
  "78": "VI",
};

interface Props {
  /** State summaries from the data layer — used to colour states by district count. */
  states: StateSummary[];
}

const WIDTH = 960;
const HEIGHT = 600;

export function UsDistrictMap({ states }: Props) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState<string | null>(null); // FIPS of hovered state
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  // Build a lookup from FIPS → StateSummary for quick access.
  const stateByFips = new Map<string, StateSummary>();
  for (const s of states) {
    stateByFips.set(s.fips, s);
  }

  // Max district count for colour interpolation.
  const maxDistricts = Math.max(...states.map((s) => s.districtCount), 1);

  const [paths, setPaths] = useState<{ id: string; d: string }[]>([]);

  useEffect(() => {
    // Dynamically import the heavy TopoJSON asset so it's code-split and
    // doesn't block the initial server render.
    import("us-atlas/states-10m.json").then((mod) => {
      const topo = mod.default as unknown as TopoTopology;

      const projection = geoAlbersUsa().scale(1300).translate([WIDTH / 2, HEIGHT / 2]);
      const pathGenerator = geoPath(projection);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stateFeatures = feature(topo as any, topo.objects.states as any) as any;
      // feature() with a GeometryCollection returns a FeatureCollection
      const features: Array<{ id: string | number; geometry: unknown }> =
        stateFeatures.features ?? [];

      const computed = features.map((f) => ({
        id: String(f.id),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        d: pathGenerator(f as any) ?? "",
      }));

      setPaths(computed);
    });
  }, []);

  function fillColour(fips: string): string {
    const summary = stateByFips.get(fips);
    if (!summary) return "#d1d5db"; // grey — no data
    if (hovered === fips) return "#1d4ed8"; // blue on hover

    // Subtle blue shade scaled by district count.
    const intensity = summary.districtCount / maxDistricts;
    // Interpolate between #dbeafe (very light blue) and #3b82f6 (medium blue).
    const r = Math.round(219 - intensity * (219 - 59));
    const g = Math.round(190 - intensity * (190 - 130));
    const b = Math.round(254 - intensity * (254 - 246));
    return `rgb(${r},${g},${b})`;
  }

  function handleMouseEnter(fips: string, e: React.MouseEvent<SVGPathElement>) {
    setHovered(fips);
    const summary = stateByFips.get(fips);
    const abbr = FIPS_TO_ABBR[fips];
    if (summary) {
      const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
      const svgX = e.clientX - rect.left;
      const svgY = e.clientY - rect.top;
      setTooltip({
        x: svgX,
        y: svgY,
        text: `${summary.name} — ${summary.districtCount} district${summary.districtCount !== 1 ? "s" : ""}`,
      });
    } else if (abbr) {
      setTooltip(null);
    }
  }

  function handleMouseLeave() {
    setHovered(null);
    setTooltip(null);
  }

  function handleClick(fips: string) {
    const abbr = FIPS_TO_ABBR[fips];
    if (!abbr) return;
    router.push(`/states/${abbr.toLowerCase()}`);
  }

  if (paths.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded border border-black/10 bg-black/[0.02] text-sm text-ink/40"
        style={{ height: 300 }}
      >
        Loading map…
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded border border-black/10">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        aria-label="Interactive map of U.S. states — click a state to browse its congressional districts"
        role="img"
      >
        <g>
          {paths.map(({ id, d }) => {
            const abbr = FIPS_TO_ABBR[id];
            const isClickable = Boolean(abbr);
            return (
              <path
                key={id}
                d={d}
                fill={fillColour(id)}
                stroke="#fff"
                strokeWidth={0.5}
                style={{ cursor: isClickable ? "pointer" : "default" }}
                role={isClickable ? "button" : undefined}
                aria-label={
                  isClickable
                    ? `${stateByFips.get(id)?.name ?? abbr} — click to view districts`
                    : undefined
                }
                onMouseEnter={(e) => handleMouseEnter(id, e)}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleClick(id)}
              />
            );
          })}
        </g>
      </svg>

      {tooltip && (
        <div
          className="pointer-events-none absolute rounded bg-gray-900 px-2 py-1 text-xs text-white shadow"
          style={{ left: tooltip.x + 8, top: tooltip.y - 28 }}
        >
          {tooltip.text}
        </div>
      )}

      <p className="border-t border-black/10 px-3 py-1.5 text-xs text-ink/50">
        Click a state to browse its congressional districts.
        {states.length === 0 && " Map is in preview mode — no data loaded yet."}
      </p>
    </div>
  );
}
