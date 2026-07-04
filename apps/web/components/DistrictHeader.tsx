import type { DistrictDetail } from "@/lib/types";

// District overview: identity, population, and key demographics — in a floating glass
// panel with a clean stat grid.
export function DistrictHeader({ district }: { district: DistrictDetail }) {
  const stats: [string, string][] = [];
  if (district.cookPvi) stats.push(["Partisan lean", district.cookPvi]);
  if (district.population != null)
    stats.push(["Population", district.population.toLocaleString()]);
  stats.push(["Seat", district.isOpenSeat ? "Open seat" : "Contested"]);
  if (district.demographics?.medianIncome != null)
    stats.push(["Median income", `$${district.demographics.medianIncome.toLocaleString()}`]);
  if (district.demographics?.medianAge != null)
    stats.push(["Median age", `${district.demographics.medianAge}`]);
  if (district.demographics?.bachelorsPlusShare != null)
    stats.push([
      "Bachelor's+",
      `${Math.round(district.demographics.bachelorsPlusShare * 100)}%`,
    ]);

  return (
    <section className="glass rounded-3xl p-6">
      <h1 className="text-3xl font-semibold tracking-tight">{district.label}</h1>
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 md:grid-cols-4">
        {stats.map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs uppercase tracking-wide text-muted">{k}</dt>
            <dd className="mt-0.5 text-lg font-medium tracking-tight">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
