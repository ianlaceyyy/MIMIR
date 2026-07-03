"use client";

/**
 * Interactive U.S. congressional district map on the home page.
 *
 * Layer 1 — state outlines (us-atlas, loaded via dynamic import)
 * Layer 2 — congressional district boundaries (public/us-cd.json, 113th-Congress
 *            geometry; compatible with the app's 4-digit geoid scheme)
 *
 * Interaction model:
 *   • Hover state  → highlights state + shows district boundaries for that state
 *   • Click state  → locks the state selection, shows an inline district picker
 *   • Hover district → highlights district, shows name tooltip
 *   • Click district → navigates to /districts/{geoid}
 *   • Click selected state again (or the ✕) → deselects
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { geoAlbersUsa, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { StateSummary } from "@/lib/types";

// ---------------------------------------------------------------------------
// Minimal local types to avoid external type-package dependencies
// ---------------------------------------------------------------------------

type TopoTopology = {
  type: "Topology";
  objects: Record<
    string,
    {
      type: "GeometryCollection";
      geometries: Array<{
        type: string;
        id?: string | number;
        properties?: Record<string, string>;
        arcs: unknown;
      }>;
    }
  >;
  arcs: number[][][];
  transform?: { scale: [number, number]; translate: [number, number] };
};

// FIPS (2-digit) → two-letter abbreviation lookup.
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

interface DistrictPath {
  geoid: string;      // 4-digit, e.g. "1713"
  stateFips: string;  // 2-digit, e.g. "17"
  label: string;      // e.g. "Congressional District 13"
  d: string;          // SVG path
}

interface Props {
  /** State summaries from the data layer — used to colour states by district count. */
  states: StateSummary[];
}

const WIDTH = 960;
const HEIGHT = 600;

export function UsDistrictMap({ states }: Props) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);

  // State paths (layer 1)
  const [statePaths, setStatePaths] = useState<{ id: string; d: string }[]>([]);
  // District paths (layer 2)
  const [districtPaths, setDistrictPaths] = useState<DistrictPath[]>([]);

  // Interaction state
  const [hoveredState, setHoveredState] = useState<string | null>(null);   // FIPS
  const [selectedState, setSelectedState] = useState<string | null>(null); // FIPS (clicked/locked)
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null); // geoid
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  // Build a lookup from FIPS → StateSummary.
  const stateByFips = new Map<string, StateSummary>();
  for (const s of states) {
    stateByFips.set(s.fips, s);
  }
  const maxDistricts = Math.max(...states.map((s) => s.districtCount), 1);

  // Load layer 1 — states TopoJSON (bundled in us-atlas, code-split).
  useEffect(() => {
    import("us-atlas/states-10m.json").then((mod) => {
      const topo = mod.default as unknown as TopoTopology;
      const projection = geoAlbersUsa().scale(1300).translate([WIDTH / 2, HEIGHT / 2]);
      const pathGen = geoPath(projection);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fc = feature(topo as any, topo.objects.states as any) as any;
      const computed: { id: string; d: string }[] = (fc.features ?? []).map(
        (f: { id: string | number; [k: string]: unknown }) => ({
          id: String(f.id),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          d: pathGen(f as any) ?? "",
        })
      );
      setStatePaths(computed);
    });
  }, []);

  // Load layer 2 — congressional district boundaries (public asset, fetched at runtime).
  useEffect(() => {
    fetch("/us-cd.json")
      .then((r) => r.json())
      .then((topo: TopoTopology) => {
        const projection = geoAlbersUsa().scale(1300).translate([WIDTH / 2, HEIGHT / 2]);
        const pathGen = geoPath(projection);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fc = feature(topo as any, topo.objects.default as any) as any;
        const computed: DistrictPath[] = [];
        for (const f of fc.features ?? []) {
          const props = f.properties as Record<string, string> | undefined;
          const geoid = props?.geoid;
          if (!geoid) continue; // skip the border-lines sentinel
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const d = pathGen(f as any);
          if (!d) continue;
          computed.push({
            geoid,
            stateFips: geoid.slice(0, 2),
            label: props?.name ?? `District ${geoid.slice(2)}`,
            d,
          });
        }
        setDistrictPaths(computed);
      })
      .catch(() => {
        // Public asset not found — silently degrade; state-only map still works.
      });
  }, []);

  // Colour for a state path.
  function stateFill(fips: string): string {
    const isSelected = selectedState === fips;
    const isHovered = hoveredState === fips && !selectedState;

    if (isSelected || isHovered) return "#1d4ed8"; // vivid blue

    const summary = stateByFips.get(fips);
    if (!summary) return "#d1d5db"; // no data → grey

    // Interpolate light-blue scale by district count.
    const intensity = summary.districtCount / maxDistricts;
    const r = Math.round(219 - intensity * (219 - 59));
    const g = Math.round(190 - intensity * (190 - 130));
    const b = Math.round(254 - intensity * (254 - 246));
    return `rgb(${r},${g},${b})`;
  }

  // Position tooltip relative to the SVG container.
  const updateTooltip = useCallback(
    (e: React.MouseEvent<SVGPathElement>, text: string) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, text });
    },
    []
  );

  // ----- State event handlers -----
  function onStateMouseEnter(fips: string, e: React.MouseEvent<SVGPathElement>) {
    setHoveredState(fips);
    const s = stateByFips.get(fips);
    if (s) {
      updateTooltip(e, `${s.name} — ${s.districtCount} district${s.districtCount !== 1 ? "s" : ""}`);
    }
  }

  function onStateMouseLeave() {
    setHoveredState(null);
    setTooltip(null);
  }

  function onStateClick(fips: string) {
    setSelectedState((prev) => (prev === fips ? null : fips));
    setHoveredDistrict(null);
    setTooltip(null);
  }

  // ----- District event handlers -----
  function onDistrictMouseEnter(dp: DistrictPath, e: React.MouseEvent<SVGPathElement>) {
    setHoveredDistrict(dp.geoid);
    const abbr = FIPS_TO_ABBR[dp.stateFips] ?? dp.stateFips;
    const num = parseInt(dp.geoid.slice(2), 10);
    updateTooltip(e, `${abbr}-${num} — ${dp.label}`);
  }

  function onDistrictMouseLeave() {
    setHoveredDistrict(null);
    setTooltip(null);
  }

  function onDistrictClick(dp: DistrictPath) {
    router.push(`/districts/${dp.geoid}`);
  }

  // Districts to render in the overlay (those belonging to hovered/selected state).
  const activeFips = selectedState ?? hoveredState;
  const visibleDistricts = activeFips
    ? districtPaths.filter((dp) => dp.stateFips === activeFips)
    : [];

  // Inline district picker (shown when a state is locked/selected).
  const selectedSummary = selectedState ? stateByFips.get(selectedState) : null;
  const selectedAbbr = selectedState ? FIPS_TO_ABBR[selectedState] : null;
  const selectedDistricts = selectedState
    ? districtPaths.filter((dp) => dp.stateFips === selectedState)
    : [];

  if (statePaths.length === 0) {
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
    <div className="space-y-3">
      {/* Map SVG */}
      <div className="relative overflow-hidden rounded border border-black/10">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full"
          aria-label="Interactive map of the United States — click a state to browse congressional districts"
          role="img"
        >
          {/* Layer 1: state fills */}
          <g>
            {statePaths.map(({ id, d }) => {
              const abbr = FIPS_TO_ABBR[id];
              return (
                <path
                  key={id}
                  d={d}
                  fill={stateFill(id)}
                  stroke="#fff"
                  strokeWidth={0.5}
                  style={{ cursor: abbr ? "pointer" : "default" }}
                  role={abbr ? "button" : undefined}
                  aria-label={
                    abbr
                      ? `${stateByFips.get(id)?.name ?? abbr} — click to view districts`
                      : undefined
                  }
                  onMouseEnter={(e) => abbr && onStateMouseEnter(id, e)}
                  onMouseLeave={onStateMouseLeave}
                  onClick={() => abbr && onStateClick(id)}
                />
              );
            })}
          </g>

          {/* Layer 2: district boundaries for the active state */}
          {visibleDistricts.length > 0 && (
            <g>
              {visibleDistricts.map((dp) => {
                const isHov = hoveredDistrict === dp.geoid;
                return (
                  <path
                    key={dp.geoid}
                    d={dp.d}
                    fill={isHov ? "#1e40af" : "rgba(30,64,175,0.25)"}
                    stroke={isHov ? "#1e3a8a" : "#1d4ed8"}
                    strokeWidth={isHov ? 1.2 : 0.6}
                    style={{ cursor: "pointer" }}
                    role="button"
                    aria-label={`${FIPS_TO_ABBR[dp.stateFips] ?? dp.stateFips}-${parseInt(dp.geoid.slice(2), 10)} — click to view candidates`}
                    onMouseEnter={(e) => onDistrictMouseEnter(dp, e)}
                    onMouseLeave={onDistrictMouseLeave}
                    onClick={() => onDistrictClick(dp)}
                  />
                );
              })}
            </g>
          )}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="pointer-events-none absolute rounded bg-gray-900 px-2 py-1 text-xs text-white shadow"
            style={{ left: tooltip.x + 8, top: tooltip.y - 28 }}
          >
            {tooltip.text}
          </div>
        )}

        <p className="border-t border-black/10 px-3 py-1.5 text-xs text-ink/50">
          {selectedState
            ? `Showing districts for ${selectedSummary?.name ?? selectedAbbr}. Click a district or click the state again to deselect.`
            : "Click a state to explore its congressional districts."}
          {states.length === 0 && " (Preview mode — no data loaded yet.)"}
        </p>
      </div>

      {/* District picker panel — shown when a state is selected */}
      {selectedState && selectedDistricts.length > 0 && (
        <div className="rounded border border-black/10 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium">
              {selectedSummary?.name ?? selectedAbbr} — Congressional Districts
            </h3>
            <button
              onClick={() => setSelectedState(null)}
              className="rounded px-2 py-0.5 text-xs text-ink/50 hover:bg-black/5"
              aria-label="Deselect state"
            >
              ✕ Clear
            </button>
          </div>
          <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {selectedDistricts
              .sort((a, b) => a.geoid.localeCompare(b.geoid))
              .map((dp) => {
                const num = parseInt(dp.geoid.slice(2), 10);
                const abbr = FIPS_TO_ABBR[dp.stateFips] ?? dp.stateFips;
                return (
                  <li key={dp.geoid}>
                    <button
                      onClick={() => onDistrictClick(dp)}
                      className="w-full rounded border border-black/10 px-2 py-1.5 text-left text-sm hover:border-well hover:bg-black/[0.02]"
                    >
                      <span className="font-medium">
                        {abbr}-{num === 0 ? "AL" : num}
                      </span>
                    </button>
                  </li>
                );
              })}
          </ul>
        </div>
      )}

      {/* State selected but no district boundaries loaded yet */}
      {selectedState && selectedDistricts.length === 0 && districtPaths.length === 0 && (
        <p className="rounded border border-dashed border-black/20 p-4 text-sm text-ink/50">
          Loading district boundaries…
        </p>
      )}
    </div>
  );
}

