import Link from "next/link";
import { listStates } from "@/lib/data";

// Home: enter the catalog by state. From here: state -> district -> candidates.
export default async function HomePage() {
  const states = await listStates();

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold text-well">Know who&rsquo;s on your ballot.</h1>
        <p className="max-w-2xl text-ink/80">
          Mímir catalogs every U.S. congressional election by district and shows all the
          candidates running for that seat — their background, campaign finance, stated
          positions, and record — with every fact traced to a primary source.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-ink/60">
          Browse by state
        </h2>
        {states.length === 0 ? (
          <p className="rounded border border-dashed border-black/20 p-6 text-sm text-ink/60">
            No data loaded yet. Run the ingestion service to populate districts.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {states.map((s) => (
              <li key={s.fips}>
                <Link
                  href={`/states/${s.abbr.toLowerCase()}`}
                  className="block rounded border border-black/10 px-3 py-2 text-sm hover:border-well"
                >
                  <span className="font-medium">{s.abbr}</span>
                  <span className="ml-1 text-ink/50">({s.districtCount})</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
