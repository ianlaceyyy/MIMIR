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

        {/* Floating glass header — sticky, translucent, no hard boundary. */}
        <header className="sticky top-0 z-30 px-3 pt-3">
          <div className="glass mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-5 py-3">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Mí<span className="text-[#2f6fed]">mir</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm text-muted">
              <Link href="/" className="rounded-full px-3 py-1.5 hover:bg-black/5 hover:text-ink">
                House
              </Link>
              <Link
                href="/senate"
                className="rounded-full px-3 py-1.5 hover:bg-black/5 hover:text-ink"
              >
                Senate
              </Link>
              <Link
                href="/about"
                className="rounded-full px-3 py-1.5 hover:bg-black/5 hover:text-ink"
              >
                About
              </Link>
              <Link
                href="/methodology"
                className="rounded-full px-3 py-1.5 hover:bg-black/5 hover:text-ink"
              >
                Methodology
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-3 py-6">{children}</main>

        <footer className="mx-auto max-w-6xl px-6 py-10 text-xs text-muted">
          Non-partisan by design. Facts drawn from primary government sources and
          candidates&rsquo; own official material — each one cited. Mímir makes no
          endorsements.{" "}
          <Link href="/methodology" className="underline underline-offset-2">
            Methodology
          </Link>
          .
        </footer>
      </body>
    </html>
  );
}
