import Link from "next/link";

// Public-facing statement of sources + non-partisan commitments. Mirrors the
// contents of docs/DATA_SOURCES.md and docs/NONPARTISAN_POLICY.md for voters.
export default function MethodologyPage() {
  return (
    <article className="prose max-w-none space-y-4">
      <h1 className="text-2xl font-semibold">Methodology</h1>

      <h2 className="text-lg font-semibold">Where our facts come from</h2>
      <p className="text-sm text-ink/80">
        Every fact on Mímir comes from a primary, authoritative source and is shown with
        a citation and an &ldquo;as of&rdquo; date:
      </p>
      <ul className="list-disc pl-6 text-sm text-ink/80">
        <li>District boundaries &amp; demographics — U.S. Census Bureau (TIGER/Line, ACS)</li>
        <li>Seats, candidate rosters &amp; campaign finance — Federal Election Commission</li>
        <li>Bills, sponsorship &amp; voting records — Congress.gov</li>
        <li>Stated positions — the candidate&rsquo;s own official campaign material</li>
        <li>Social posts — the X API (official accounts)</li>
        <li>Disclosures — U.S. House Clerk and U.S. Senate Lobbying databases</li>
      </ul>

      <h2 className="text-lg font-semibold">How we stay non-partisan</h2>
      <ul className="list-disc pl-6 text-sm text-ink/80">
        <li>No endorsements, ratings, rankings, or ideology scores — ever.</li>
        <li>Every candidate uses the identical template and visual weight.</li>
        <li>Candidates are ordered alphabetically by surname; the rule is always shown.</li>
        <li>Positions are shown as the candidate&rsquo;s own verbatim words with a link.</li>
        <li>All aggregates use the same method for every candidate, documented here.</li>
      </ul>

      <p className="text-sm text-ink/60">
        Read the full policy in the project repository&rsquo;s{" "}
        <code>docs/NONPARTISAN_POLICY.md</code>.
      </p>

      <Link href="/" className="text-sm text-well underline">
        ← Back to browse
      </Link>
    </article>
  );
}
