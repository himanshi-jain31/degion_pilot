"use client";

import { PHASES } from "@/lib/phases";

type Status = "Not started" | "Working on it" | "Ready for you" | "Changes asked" | "Approved";

// A small line of all 6 steps at the top, so you always know where you are
export function PhaseLine({ phases, selected, onSelect }: { phases: Record<string, Status>; selected: number | null; onSelect: (n: number) => void }) {
  return (
    <nav aria-label="Progress through the 6 steps">
      <ol className="flex items-center gap-1 overflow-x-auto">
        {PHASES.map((p, i) => {
          const s = phases[p.name] ?? "Not started";
          const done = s === "Approved";
          const active = selected === p.n;
          const dot = done ? "bg-green-700 text-white" : s === "Working on it" ? "bg-blue-700 text-white" : s === "Ready for you" || s === "Changes asked" ? "bg-amber-500 text-black" : "bg-neutral-200 text-neutral-800";
          return (
            <li key={p.n} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden="true" className={`h-0.5 w-4 sm:w-8 ${done || phases[PHASES[i - 1].name] === "Approved" ? "bg-green-700" : "bg-neutral-300"}`} />}
              <button
                onClick={() => onSelect(p.n)}
                aria-current={active ? "step" : undefined}
                aria-label={`${p.n}. ${p.name}: ${s}`}
                title={`${p.name}: ${s}`}
                className={`flex items-center gap-2 rounded-full px-2 py-1 ${active ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"}`}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${active ? "bg-white text-neutral-900" : dot}`}>{done ? "✓" : p.n}</span>
                <span className={`text-sm ${active ? "" : "max-md:hidden"}`}>{p.name}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
