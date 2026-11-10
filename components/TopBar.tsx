"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// The slim bar at the top of every screen. It shows one calm "Demo mode" badge while sample results are in use.
// It checks again every few seconds and when you come back to the window, so adding a key switches it off by itself.
export function TopBar() {
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    let alive = true;
    const check = () =>
      fetch("/api/status")
        .then((r) => r.json())
        .then((d) => alive && setDemo(!!d.demo))
        .catch(() => undefined);
    check();
    const timer = setInterval(check, 10000);
    window.addEventListener("focus", check);
    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener("focus", check);
    };
  }, []);

  const tip = "Showing sample results. Add an API key to get real designs.";
  return (
    <header className="flex items-center justify-between border-b border-neutral-200 px-5 py-2">
      <Link href="/" className="text-sm font-semibold">
        DesignPilot
      </Link>
      {demo && (
        <span className="group relative">
          <span
            tabIndex={0}
            role="note"
            title={tip}
            aria-label={`Demo mode. ${tip}`}
            className="inline-block cursor-help rounded-full border border-neutral-500 bg-neutral-100 px-3 py-0.5 text-xs text-neutral-700"
          >
            Demo mode
          </span>
          <span
            role="tooltip"
            className="pointer-events-none absolute right-0 top-full z-50 mt-1 hidden w-64 rounded-lg bg-neutral-900 p-2 text-xs text-white group-focus-within:block group-hover:block"
          >
            {tip}
          </span>
        </span>
      )}
    </header>
  );
}
