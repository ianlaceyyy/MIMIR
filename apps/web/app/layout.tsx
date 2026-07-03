import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { USING_SAMPLE_DATA } from "@/lib/data";
import { SampleDataBanner } from "@/components/SampleDataBanner";

export const metadata: Metadata = {
  title: "Mímir — Know who's on your ballot",
  description:
    "A non-partisan catalog of U.S. elections by district. Every candidate, every source cited.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {USING_SAMPLE_DATA && <SampleDataBanner />}
        <header className="border-b border-black/10">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-xl font-semibold text-well">
              Mímir
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/">Browse</Link>
              <Link href="/about">About</Link>
              <Link href="/methodology">Methodology</Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>

        <footer className="mt-16 border-t border-black/10">
          <div className="mx-auto max-w-5xl px-4 py-6 text-xs text-ink/60">
            Non-partisan by design. All facts drawn from primary government sources and
            candidates&rsquo; own official material — each one cited. Mímir makes no
            endorsements. See our{" "}
            <Link href="/methodology" className="underline">
              methodology
            </Link>
            .
          </div>
        </footer>
      </body>
    </html>
  );
}
