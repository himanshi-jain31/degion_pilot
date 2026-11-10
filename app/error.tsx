"use client";

import Link from "next/link";

// Shown if a screen breaks. Plain words and a way to try again.
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-xl px-5 py-16">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p role="alert" className="mt-3 text-neutral-700">Sorry, this screen stopped working. Your projects are safe. Please try again.</p>
      <div className="mt-5 flex gap-3">
        <button onClick={reset} className="rounded-lg bg-black px-6 py-3 font-medium text-white hover:bg-neutral-800">Try again</button>
        <Link href="/" className="button-link px-4 py-3 underline">Back to Home</Link>
      </div>
    </main>
  );
}
