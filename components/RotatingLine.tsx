"use client";

import { useEffect, useRef, useState } from "react";

// Friendly lines that take turns under the greeting. The first one is the plain question.
const LINES = [
  "What would you like to design today?",
  "Got a messy idea? Let's make it clear.",
  "Tell me the problem. I'll find its shape.",
  "One sentence is enough to start.",
  "Bring a rough thought. Leave with a working prototype.",
  "Who is it for, and what do they need?",
  "Small ideas grow into great screens.",
  "Let's make something people love to use.",
];

// A line that fades from one sentence to the next. It pauses when you point at it,
// and it stays still if your computer is set to reduce motion (the dots still work).
export function RotatingLine() {
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [paused, setPaused] = useState(false);
  const [still, setStill] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const set = () => setStill(q.matches);
    set();
    q.addEventListener("change", set);
    return () => q.removeEventListener("change", set);
  }, []);

  function goTo(next: number) {
    if (timer.current) clearTimeout(timer.current);
    if (still) return setIndex(next);
    setLeaving(true);
    timer.current = setTimeout(() => {
      setIndex(next);
      setLeaving(false);
    }, 260);
  }

  useEffect(() => {
    if (paused || still) return;
    const t = setInterval(() => goTo((index + 1) % LINES.length), 4200);
    return () => clearInterval(t);
  });

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <p aria-live="off" className="text-soft mt-2 flex min-h-[2lh] items-center justify-center text-xl">
        <span key={index} className={leaving ? "line-out" : still ? "" : "line-in"}>{LINES[index]}</span>
      </p>
      <div className="mt-2 flex items-center justify-center gap-2" role="group" aria-label="Choose a line">
        {LINES.map((l, i) => (
          <button
            key={l}
            onClick={() => goTo(i)}
            aria-label={`Show line ${i + 1}: ${l}`}
            aria-current={i === index}
            className="group flex h-4 w-4 items-center justify-center rounded-full"
          >
            <span className={`block rounded-full transition-all duration-300 ${i === index ? "h-1.5 w-5 bg-accent" : "h-1.5 w-1.5 bg-[#cdd3e0] group-hover:bg-[#9aa3b2]"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
