"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PhaseVersion } from "@/lib/storage";

// Friendly steps shown while a phase is being worked on. The number is where the step begins (a rough share of the work).
const STAGES: Record<number, readonly (readonly [number, string])[]> = {
  1: [[0, "Reading your request and your files"], [15, "Writing the brief and working out who will use this"], [45, "Writing the requirements"], [75, "Looking for things you may not have asked about"], [90, "Putting your check-in together"]],
  2: [[0, "Planning my searches"], [10, "Searching the web and reading sources"], [45, "Sorting what I found and linking each source"], [75, "Writing insights and a kit for talking to real users"], [90, "Putting your check-in together"]],
  3: [[0, "Reading the approved research"], [15, "Drawing the product structure and flows"], [45, "Writing the journeys and storyboard"], [70, "Shaping different directions"], [90, "Putting your check-in together"]],
  4: [[0, "Listing every screen"], [10, "Drawing the screens one by one"], [85, "Joining the screens and checking every button"], [95, "Putting your check-in together"]],
  5: [[0, "Reading the approved wireframe and your design style"], [10, "Applying the design to each screen"], [85, "Joining the screens and checking colours"], [95, "Putting your check-in together"]],
  6: [[0, "Reading the prototype and your notes"], [15, "Working out the test plan, script and problems"], [60, "Ranking the problems and checking my guesses"], [90, "Putting your check-in together"]],
};

// A rough guess of how long each step takes, used until there is enough progress to measure
const TYPICAL_SECONDS: Record<number, number> = { 1: 60, 2: 180, 3: 75, 4: 150, 5: 150, 6: 75 };

function timeLeft(seconds: number): string {
  if (seconds < 20) return "Almost done";
  if (seconds < 75) return "About a minute left";
  return `About ${Math.round(seconds / 60)} minutes left`;
}

export function Progress({ v, phase }: { v: PhaseVersion; phase: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const elapsed = Math.max(0, (now - new Date(v.createdAt).getTime()) / 1000);
  // While the web is searched no text arrives, so the bar also moves with time
  const fromText = Math.round((v.progressChars / 14000) * 100);
  const percent = Math.min(95, Math.max(fromText, phase === 2 ? Math.min(40, Math.round(elapsed / 2)) : 0, Math.min(30, Math.round(elapsed / 3))));
  const stages = STAGES[phase] ?? STAGES[1];
  const currentIndex = stages.reduce((acc, [from], i) => (percent >= from ? i : acc), 0);
  const remaining = percent >= 12 ? (elapsed * (100 - percent)) / percent : Math.max(15, (TYPICAL_SECONDS[phase] ?? 90) - elapsed);

  return (
    <section className="rounded-lg border border-blue-200 bg-blue-50 p-5" role="status" aria-live="polite">
      <p className="text-xl font-semibold">Working on it...{v.version > 1 && " (using your feedback)"}</p>
      <p className="mt-1 text-lg">{timeLeft(remaining)}</p>
      <div role="progressbar" aria-label="Progress (an estimate)" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.max(percent, 3)} className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100">
        <div className="h-full bg-blue-700 transition-all" style={{ width: `${Math.max(percent, 3)}%` }} />
      </div>
      <ul className="mt-4 space-y-1">
        {stages.map(([, label], i) => (
          <li key={label} className={i === currentIndex ? "font-medium" : i < currentIndex ? "text-neutral-700" : "text-neutral-600"}>
            <span aria-hidden="true" className="mr-2 inline-block w-4">{i < currentIndex ? "✓" : i === currentIndex ? "…" : ""}</span>
            {i === currentIndex ? v.progressNote ?? label : label}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-neutral-800">
        You can leave this page. I keep working, and your check-in will be waiting when you come back.{" "}
        <Link href="/" className="underline">Back to Home</Link>
      </p>
    </section>
  );
}
