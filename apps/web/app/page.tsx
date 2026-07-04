import { listStates, districtParties } from "@/lib/data";
import { UsDistrictMap } from "@/components/UsDistrictMap";

// Always render at request time so the page reflects current database state.
export const dynamic = "force-dynamic";

// Home: the map IS the interface. Explore by district (click to zoom) or jump to a
// state. Everything drills down to who's running.
export default async function HomePage() {
  const [states, parties] = await Promise.all([listStates(), districtParties()]);

  return (
    <div className="space-y-5">
      <section className="px-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Know who&rsquo;s on your ballot.
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Every U.S. congressional district — color-coded by party, every candidate,
          every fact traced to a primary source. Tap the map to dive in.
        </p>
      </section>

      <UsDistrictMap states={states} parties={parties} />

      {/* legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1 text-xs text-muted">
        {[
          ["Democratic", "#2f6fed"],
          ["Republican", "#e0483d"],
          ["Independent", "#7c5cff"],
          ["Other / vacant", "#d7dbe2"],
        ].map(([name, color]) => (
          <span key={name} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
