import Link from "next/link";

export default function AboutPage() {
  return (
    <article className="space-y-4">
      <h1 className="text-2xl font-semibold">About Mímir</h1>
      <p className="text-sm text-ink/80">
        Mímir is a non-partisan civic-information platform. Our goal is simple: help any
        voter understand who is on their ballot in a few minutes, using only verifiable
        facts drawn from primary sources.
      </p>
      <p className="text-sm text-ink/80">
        We do not endorse candidates, predict outcomes, or score anyone. We catalog
        elections by district, list every candidate for each seat, and present the same
        information about each of them — each fact cited to its origin.
      </p>
      <Link href="/methodology" className="text-sm text-well underline">
        Read our methodology →
      </Link>
    </article>
  );
}
