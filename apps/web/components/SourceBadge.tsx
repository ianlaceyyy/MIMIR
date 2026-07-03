import type { SourceRef } from "@mimir/shared";

// Every fact in the UI is accompanied by one of these. It's the visible half of the
// provenance guarantee: what the source is, and when we fetched it.
export function SourceBadge({ source }: { source: SourceRef }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-xs text-ink/50 hover:text-well"
      title={`Fetched ${new Date(source.fetchedAt).toLocaleString()}`}
    >
      <span className="rounded bg-black/5 px-1.5 py-0.5">Source: {source.name}</span>
      <span>· as of {new Date(source.fetchedAt).toLocaleDateString()}</span>
    </a>
  );
}
