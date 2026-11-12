"use client";

import { useEffect, useState } from "react";

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

const EVERY_MS = 3200;

// All the lines sit on top of each other in the same spot. Only one is visible at a time, and the change is a soft fade.
// Nothing is rebuilt between lines, so it cannot flash. It pauses while you point at it,
// and stays on the first line if your computer is set to reduce motion.
export function RotatingLine() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const set = () => setStill(q.matches);
    set();
    q.addEventListener("change", set);
    return () => q.removeEventListener("change", set);
  }, []);

  useEffect(() => {
    if (paused || still) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % LINES.length), EVERY_MS);
    return () => clearInterval(t);
  }, [paused, still]);

  return (
    <p
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="text-soft mt-2 grid text-center text-xl"
    >
      {LINES.map((line, i) => {
        const on = i === index;
        const next = i === (index + 1) % LINES.length;
        return (
          <span
            key={line}
            aria-hidden={!on}
            className="col-start-1 row-start-1 transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none"
            style={{ opacity: on ? 1 : 0, transform: on ? "translateY(0)" : next ? "translateY(8px)" : "translateY(-8px)" }}
          >
            {line}
          </span>
        );
      })}
    </p>
  );
}
