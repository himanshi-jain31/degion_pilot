"use client";

import Link from "next/link";
import { PHASES } from "@/lib/phases";
import { capFirst } from "@/lib/names";

// What the project list gives us for each project (used on Home and on the My projects page)
export type ProjectRow = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  fileCount: number;
  madeInDemo: boolean;
  phases: Record<string, string>;
  next: { text: string; tone: "waiting" | "working" | "done" | "idle"; phase: string; status: string; badge: string; step: string };
};

export const TONE: Record<string, string> = { waiting: "pill pill-wait", working: "pill pill-info", done: "pill pill-ok", idle: "pill pill-idle" };

// The tiny line of six steps on each card
export function MiniProgress({ phases }: { phases: Record<string, string> }) {
  return (
    <ol aria-hidden="true" className="flex gap-1">
      {PHASES.map((p) => {
        const s = phases[p.name] ?? "Not started";
        const colour = s === "Approved" ? "bg-[var(--ok)]" : s === "Working on it" ? "bg-accent" : s === "Ready for you" || s === "Changes asked" ? "bg-[var(--wait)]" : "bg-[#e4e8f0]";
        return <li key={p.n} className={`h-1.5 flex-1 rounded-full ${colour}`} />;
      })}
    </ol>
  );
}

// One project card: name and status on one line, the six steps, where it is, and what is next
export function ProjectCard({ p }: { p: ProjectRow }) {
  const n = PHASES.find((ph) => ph.name === p.next.phase)?.n ?? 1;
  return (
    <Link
      href={`/project/${p.id}`}
      aria-label={`Open ${capFirst(p.title)}. ${p.next.phase}, step ${n} of 6: ${p.next.badge}. ${p.next.step}`}
      className="shell-card flex h-full flex-col gap-3 p-5 transition-shadow duration-150 hover:shadow-[0_2px_4px_rgba(40,40,80,0.05),0_12px_28px_rgba(60,60,120,0.10)]"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="line-clamp-2 min-w-0 flex-1 text-base font-medium leading-snug [overflow-wrap:anywhere]">{capFirst(p.title)}</span>
        <span className={`${TONE[p.next.tone]} shrink-0 !px-2.5 !text-[13px]`}>{p.next.badge}</span>
      </span>
      <MiniProgress phases={p.phases} />
      <span className="text-soft text-sm">
        {p.next.phase}, step {n} of 6
      </span>
      <span className="mt-auto flex items-start gap-2 text-sm leading-snug">
        <svg aria-hidden="true" className="mt-0.5 shrink-0 text-accent" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
        <span>{p.next.step}</span>
      </span>
    </Link>
  );
}
