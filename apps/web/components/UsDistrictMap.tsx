"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { geoMercator } from "d3-geo";
import type { StateSummary } from "@/lib/types";

// Interactive national map of all congressional districts. Each district is a
// clickable SVG path that drills into /districts/[geoid]. A state dropdown offers a
// quick jump to a whole state. Boundaries come from /us-cd.geojson (Census TIGERweb,
// 119th Congress). Neutral styling — no partisan coloring (see NONPARTISAN_POLICY).

interface DistrictFeature {
  type: "Feature";
  properties: { geoid: string; name: string; state: string };
  geometry: GeoJSON.Geometry;
}

const WIDTH = 960;
const HEIGHT = 500;

// States shown on the continental map. Alaska (02) and Hawaii (15) don't fit a CONUS
// Mercator, so they're excluded from the map but remain reachable via the state
// dropdown. Territories (FIPS > 56) are excluded too.
function isContinental(stateFips: string): boolean {
  const n = Number(stateFips);
  return n <= 56 && n !== 2 && n !== 15;
}

type Projection = (coord: [number, number]) => [number, number] | null;

// All [lon, lat] coordinates of a Polygon/MultiPolygon geometry.
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

// Build an SVG path by projecting each coordinate directly (no geoPath streaming, so
// no clip-extent frame). Handles Polygon and MultiPolygon.
function featurePath(geom: GeoJSON.Geometry, projection: Projection): string {
  const polys: number[][][][] =
    geom.type === "Polygon"
      ? [(geom as GeoJSON.Polygon).coordinates as number[][][]]
      : geom.type === "MultiPolygon"
        ? ((geom as GeoJSON.MultiPolygon).coordinates as number[][][][])
        : [];
  let d = "";
  for (const poly of polys) {
    for (const ring of poly) {
      const pts: string[] = [];
      for (const c of ring) {
        const p = projection(c as [number, number]);
        if (p && isFinite(p[0]) && isFinite(p[1])) {
          pts.push(`${p[0].toFixed(1)},${p[1].toFixed(1)}`);
        }
      }
      if (pts.length >= 2) d += "M" + pts.join("L") + "Z";
    }
  }
  return d;
}

export function UsDistrictMap({ states }: { states: StateSummary[] }) {
  const router = useRouter();
  const [features, setFeatures] = useState<DistrictFeature[]>([]);
  const [hover, setHover] = useState<string | null>(null);

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

  const paths = useMemo(() => {
    if (features.length === 0) return [];
    // Project coordinates ourselves rather than via geoPath. geoPath streams geometry
    // through the projection's clip, which appends the clip-extent rectangle as an
    // extra subpath to every feature (a viewport-spanning "frame"). We also can't use
    // projection.fitSize() — it measures via geoPath and so is thrown off by those
    // same frames. Instead we fit manually from the geographic bounding box.
    let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
    for (const f of features) {
      for (const c of geometryCoords(f.geometry)) {
        if (c[0] < minLon) minLon = c[0];
        if (c[0] > maxLon) maxLon = c[0];
        if (c[1] < minLat) minLat = c[1];
        if (c[1] > maxLat) maxLat = c[1];
      }
    }
    const base = geoMercator().scale(1).translate([0, 0]);
    const tl = base([minLon, maxLat])!;
    const br = base([maxLon, minLat])!;
    const scale = Math.min(WIDTH / (br[0] - tl[0]), HEIGHT / (br[1] - tl[1])) * 0.95;
    const center = base([(minLon + maxLon) / 2, (minLat + maxLat) / 2])!;
    const projection = geoMercator()
      .scale(scale)
      .translate([WIDTH / 2 - scale * center[0], HEIGHT / 2 - scale * center[1]]);

    return features
      .map((f) => ({ geoid: f.properties.geoid, d: featurePath(f.geometry, projection) }))
      .filter((p) => p.d.length > 0);
  }, [features]);

  const label = (geoid: string | null) => {
    if (!geoid) return "";
    const abbr = fipsToAbbr[geoid.slice(0, 2)] ?? geoid.slice(0, 2);
    const num = parseInt(geoid.slice(2), 10);
    return num === 0 ? `${abbr}-AL` : `${abbr}-${num}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink/60">
          Click a district to explore who&rsquo;s running — or jump to a state.
        </p>
        <select
          aria-label="Jump to a state"
          defaultValue=""
          onChange={(e) => e.target.value && router.push(`/states/${e.target.value}`)}
          className="rounded border border-black/15 bg-white px-2 py-1 text-sm"
        >
          <option value="" disabled>
            Jump to a state…
          </option>
          {states.map((s) => (
            <option key={s.fips} value={s.abbr.toLowerCase()}>
              {s.abbr} — {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="relative rounded border border-black/10 bg-white">
        {features.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-ink/40">
            Loading district map…
          </div>
        ) : (
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full" role="img">
            {paths.map((p) => (
              <path
                key={p.geoid}
                d={p.d}
                className="cursor-pointer transition-colors"
                fill={hover === p.geoid ? "#2b4c6f" : "#e7e2d8"}
                stroke="#ffffff"
                strokeWidth={0.4}
                onMouseEnter={() => setHover(p.geoid)}
                onMouseLeave={() => setHover((h) => (h === p.geoid ? null : h))}
                onClick={() => router.push(`/districts/${p.geoid}`)}
              >
                <title>{label(p.geoid)}</title>
              </path>
            ))}
          </svg>
        )}
        {hover && (
          <div className="pointer-events-none absolute left-3 top-3 rounded bg-ink/80 px-2 py-1 text-xs font-medium text-white">
            {label(hover)}
          </div>
        )}
      </div>
    </div>
  );
}
