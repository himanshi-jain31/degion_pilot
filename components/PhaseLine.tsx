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
          const dot = done ? "bg-[var(--ok)] text-white" : s === "Working on it" ? "bg-accent text-white" : s === "Ready for you" || s === "Changes asked" ? "bg-[var(--wait-soft)] text-[var(--wait-ink)] ring-1 ring-[var(--wait)]" : "bg-line text-muted";
          return (
            <li key={p.n} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden="true" className={`h-px w-4 sm:w-8 ${phases[PHASES[i - 1].name] === "Approved" ? "bg-[var(--ok)]" : "bg-[#dbe0ea]"}`} />}
              <button
                onClick={() => onSelect(p.n)}
                aria-current={active ? "step" : undefined}
                aria-label={`${p.n}. ${p.name}: ${s}`}
                title={`${p.name}: ${s}`}
                className={`flex items-center gap-2 rounded-full px-2 py-1 transition-colors duration-150 ${active ? "bg-card shadow-[0_1px_2px_rgba(28,28,30,0.06)] ring-1 ring-line" : "hover:bg-card/70"}`}
              >
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-medium ${dot}`}>{done ? "✓" : p.n}</span>
                <span className={`text-[15px] ${active ? "font-medium text-ink" : "text-muted max-md:hidden"}`}>{p.name}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
