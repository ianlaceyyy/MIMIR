import type { DistrictDetail } from "@/lib/types";

// District overview: identity, partisan lean, population, and key demographics.
// The map (PostGIS geometry -> GeoJSON) mounts in the placeholder below.
export function DistrictHeader({ district }: { district: DistrictDetail }) {
  return (
    <section className="grid gap-6 md:grid-cols-[2fr,3fr]">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{district.label}</h1>
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          {district.cookPvi && (
            <>
              <dt className="text-ink/60">Partisan lean (Cook PVI)</dt>
              <dd>{district.cookPvi}</dd>
            </>
          )}
          {district.population != null && (
            <>
              <dt className="text-ink/60">Population</dt>
              <dd>{district.population.toLocaleString()}</dd>
            </>
          )}
          <dt className="text-ink/60">Seat status</dt>
          <dd>{district.isOpenSeat ? "Open seat" : "Contested"}</dd>
          {district.demographics?.medianIncome != null && (
            <>
              <dt className="text-ink/60">Median income</dt>
              <dd>${district.demographics.medianIncome.toLocaleString()}</dd>
            </>
          )}
        </dl>
      </div>

      {/* Map placeholder — render TIGER geometry with MapLibre once geometryGeoJson is wired. */}
      <div className="flex min-h-[220px] items-center justify-center rounded border border-dashed border-black/20 text-sm text-ink/40">
        District map (TIGER/Line geometry)
      </div>
    </section>
  );
}
