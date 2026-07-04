"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { geoMercator } from "d3-geo";
import type { StateSummary } from "@/lib/types";
import { partyStyle } from "@/lib/party";

// Interactive national map of every congressional district.
//  • Districts are color-coded by their incumbent's party (factual, equal treatment).
//  • Click a district (national view) to ZOOM into its state; click again in the
//    zoomed view to open that district's page. A dropdown jumps/zooms to any state.
// Boundaries: /us-cd.geojson (Census TIGERweb, 119th Congress). We project each
// coordinate ourselves (geoPath injects a clip-frame artifact; see git history).

interface DistrictFeature {
  type: "Feature";
  properties: { geoid: string; name: string; state: string };
  geometry: GeoJSON.Geometry;
}

const WIDTH = 960;
const HEIGHT = 560;

function isContinental(stateFips: string): boolean {
  const n = Number(stateFips);
  return n <= 56 && n !== 2 && n !== 15; // 50 states + DC, minus AK/HI (via dropdown)
}

type Projection = (coord: [number, number]) => [number, number] | null;

function geometryCoords(geom: GeoJSON.Geometry): [number, number][] {
  const polys: number[][][][] =
    geom.type === "Polygon"
      ? [(geom as GeoJSON.Polygon).coordinates as number[][][]]
      : geom.type === "MultiPolygon"
        ? ((geom as GeoJSON.MultiPolygon).coordinates as number[][][][])
        : [];
  const out: [number, number][] = [];
  for (const poly of polys) for (const ring of poly) for (const c of ring) out.push(c as [number, number]);
  return out;
}

interface Shape {
  geoid: string;
  state: string;
  d: string;
  bbox: [number, number, number, number]; // minX, minY, maxX, maxY (screen space)
}

function shapeFor(f: DistrictFeature, projection: Projection): Shape | null {
  const polys: number[][][][] =
    f.geometry.type === "Polygon"
      ? [(f.geometry as GeoJSON.Polygon).coordinates as number[][][]]
      : ((f.geometry as GeoJSON.MultiPolygon).coordinates as number[][][][]);
  let d = "";
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const poly of polys) {
    for (const ring of poly) {
      const pts: string[] = [];
      for (const c of ring) {
        const p = projection(c as [number, number]);
        if (!p || !isFinite(p[0]) || !isFinite(p[1])) continue;
        pts.push(`${p[0].toFixed(1)},${p[1].toFixed(1)}`);
        if (p[0] < minX) minX = p[0];
        if (p[0] > maxX) maxX = p[0];
        if (p[1] < minY) minY = p[1];
        if (p[1] > maxY) maxY = p[1];
      }
      if (pts.length >= 2) d += "M" + pts.join("L") + "Z";
    }
  }
  if (!d) return null;
  return { geoid: f.properties.geoid, state: f.properties.state, d, bbox: [minX, minY, maxX, maxY] };
}

export function UsDistrictMap({
  states,
  parties,
}: {
  states: StateSummary[];
  parties: Record<string, string>;
}) {
  const router = useRouter();
  const [features, setFeatures] = useState<DistrictFeature[]>([]);
  const [hover, setHover] = useState<string | null>(null);
  const [zoomState, setZoomState] = useState<string | null>(null); // state FIPS or null

  const fipsToAbbr = useMemo(
    () => Object.fromEntries(states.map((s) => [s.fips, s.abbr])),
    [states],
  );

  useEffect(() => {
    let active = true;
    fetch("/us-cd.geojson")
      .then((r) => r.json())
      .then((d) => {
        const feats = (d.features ?? []).filter((f: DistrictFeature) =>
          isContinental(f.properties.state),
        );
        if (active) setFeatures(feats);
      })
      .catch(() => setFeatures([]));
    return () => {
      active = false;
    };
  }, []);

  const shapes = useMemo(() => {
    if (features.length === 0) return [];
    let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
    for (const f of features)
      for (const c of geometryCoords(f.geometry)) {
        if (c[0] < minLon) minLon = c[0];
        if (c[0] > maxLon) maxLon = c[0];
        if (c[1] < minLat) minLat = c[1];
        if (c[1] > maxLat) maxLat = c[1];
      }
    const base = geoMercator().scale(1).translate([0, 0]);
    const tl = base([minLon, maxLat])!;
    const br = base([maxLon, minLat])!;
    const scale = Math.min(WIDTH / (br[0] - tl[0]), HEIGHT / (br[1] - tl[1])) * 0.96;
    const center = base([(minLon + maxLon) / 2, (minLat + maxLat) / 2])!;
    const projection = geoMercator()
      .scale(scale)
      .translate([WIDTH / 2 - scale * center[0], HEIGHT / 2 - scale * center[1]]);
    return features
      .map((f) => shapeFor(f, projection))
      .filter((s): s is Shape => s !== null);
  }, [features]);

  // Zoom transform: fit the current target (a state's shapes, or the whole map).
  const transform = useMemo(() => {
    const target = zoomState ? shapes.filter((s) => s.state === zoomState) : shapes;
    if (target.length === 0) return "translate(0,0) scale(1)";
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const s of target) {
      x0 = Math.min(x0, s.bbox[0]);
      y0 = Math.min(y0, s.bbox[1]);
      x1 = Math.max(x1, s.bbox[2]);
      y1 = Math.max(y1, s.bbox[3]);
    }
    const pad = zoomState ? 0.82 : 1;
    const k = Math.min(WIDTH / (x1 - x0), HEIGHT / (y1 - y0)) * pad;
    const tx = WIDTH / 2 - (k * (x0 + x1)) / 2;
    const ty = HEIGHT / 2 - (k * (y0 + y1)) / 2;
    return `translate(${tx.toFixed(1)},${ty.toFixed(1)}) scale(${k.toFixed(3)})`;
  }, [shapes, zoomState]);

  const label = (geoid: string | null) => {
    if (!geoid) return "";
    const abbr = fipsToAbbr[geoid.slice(0, 2)] ?? geoid.slice(0, 2);
    const num = parseInt(geoid.slice(2), 10);
    return num === 0 ? `${abbr}-AL` : `${abbr}-${num}`;
  };

  const onDistrictClick = (s: Shape) => {
    if (zoomState === s.state) {
      router.push(`/districts/${s.geoid}`); // already zoomed in → open details
    } else {
      setZoomState(s.state); // national → zoom into the state
    }
  };

  const zoomedAbbr = zoomState ? fipsToAbbr[zoomState] : null;

  return (
    <div className="relative">
      {/* controls float over the map */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-3">
        <div className="pointer-events-auto">
          {zoomState ? (
            <button
              onClick={() => setZoomState(null)}
              className="glass glass-hover rounded-full px-3 py-1.5 text-sm font-medium"
            >
              ← Back to US{zoomedAbbr ? ` · ${zoomedAbbr}` : ""}
            </button>
          ) : (
            <span className="glass rounded-full px-3 py-1.5 text-xs text-muted">
              Tap a district to zoom · tap again for details
            </span>
          )}
        </div>
        <select
          aria-label="Jump to a state"
          value={zoomState ?? ""}
          onChange={(e) => setZoomState(e.target.value || null)}
          className="glass pointer-events-auto rounded-full px-3 py-1.5 text-sm outline-none"
        >
          <option value="">Jump to a state…</option>
          {states
            .filter((s) => isContinental(s.fips))
            .map((s) => (
              <option key={s.fips} value={s.fips}>
                {s.abbr} — {s.name}
              </option>
            ))}
        </select>
      </div>

      {hover && (
        <div className="glass pointer-events-none absolute bottom-3 left-3 z-10 rounded-full px-3 py-1.5 text-sm font-semibold">
          {label(hover)}
        </div>
      )}

      <div className="glass overflow-hidden rounded-3xl">
        {shapes.length === 0 ? (
          <div className="flex h-[60vh] items-center justify-center text-sm text-muted">
            Loading district map…
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="h-[62vh] max-h-[720px] w-full"
            role="img"
            aria-label="Map of U.S. congressional districts"
          >
            <g
              style={{ transition: "transform 0.6s cubic-bezier(0.22,1,0.36,1)" }}
              transform={transform}
            >
              {shapes.map((s) => {
                const isDim = zoomState && s.state !== zoomState;
                const st = partyStyle(parties[s.geoid] ?? "UNKNOWN");
                const hasParty = Boolean(parties[s.geoid]);
                return (
                  <path
                    key={s.geoid}
                    d={s.d}
                    vectorEffect="non-scaling-stroke"
                    fill={hasParty ? st.color : "#d7dbe2"}
                    fillOpacity={hover === s.geoid ? 0.95 : isDim ? 0.15 : 0.6}
                    stroke="#ffffff"
                    strokeWidth={0.6}
                    className="cursor-pointer transition-[fill-opacity] duration-150"
                    onMouseEnter={() => setHover(s.geoid)}
                    onMouseLeave={() => setHover((h) => (h === s.geoid ? null : h))}
                    onClick={() => onDistrictClick(s)}
                  >
                    <title>{label(s.geoid)}</title>
                  </path>
                );
              })}
            </g>
          </svg>
        )}
      </div>
    </div>
  );
}
