// Shown site-wide whenever the app is serving fixtures instead of live data.
// Integrity guardrail: sample content is fictional and must never be mistaken for
// real candidate facts. See lib/providers/fixtures.ts.
export function SampleDataBanner() {
  return (
    <div className="bg-amber-100 text-amber-900 border-b border-amber-300">
      <div className="mx-auto max-w-5xl px-4 py-2 text-center text-xs">
        <strong>Sample data.</strong> Candidates, finance figures, and quotes shown here
        are fictional placeholders for development. No real people or claims are
        represented.
      </div>
    </div>
  );
}
