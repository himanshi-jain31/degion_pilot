"use client";

import { useEffect, useState } from "react";

// Every screen has the icon bar on the left now, so the top only holds one calm "Demo mode" badge while sample results are in use.
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
    <header className="absolute right-0 top-0 z-30 px-6 py-4">
      {demo && (
        <span className="group relative">
          <span
            tabIndex={0}
            role="note"
            title={tip}
            aria-label={`Demo mode. ${tip}`}
            className="pill pill-idle cursor-help !text-[13px]"
          >
            Demo mode
          </span>
          <span
            role="tooltip"
            className="pointer-events-none absolute right-0 top-full z-50 mt-2 hidden w-64 rounded-xl bg-ink p-3 text-sm text-white shadow-lg group-focus-within:block group-hover:block"
          >
            {tip}
          </span>
        </span>
      )}
    </header>
  );
}
