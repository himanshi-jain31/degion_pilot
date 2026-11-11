"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";

// Shown if a screen breaks. Plain words and a way to try again.
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <AppShell>
      <main id="main" tabIndex={-1} className="fade-in mx-auto w-full max-w-xl px-6 pb-24 pt-24">
        <div className="shell-card p-8">
          <h1 className="page-title !text-[28px]">Something went wrong</h1>
          <p role="alert" className="text-soft mt-3">Sorry, this screen stopped working. Your projects are safe. Please try again.</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button onClick={reset} className="btn btn-primary">Try again</button>
            <Link href="/" className="btn btn-quiet button-link">Back to Home</Link>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
