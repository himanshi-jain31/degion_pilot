"use client";

import { PHASES, PHASE_INFO } from "@/lib/phases";
import { Icon, PHASE_ICON, type IconName } from "@/components/Icons";
import type { PhaseStatus, Project, UnderstandOutput } from "@/lib/storage";

type OverviewProject = Pick<Project, "title" | "requirement" | "createdAt" | "phases" | "versions" | "thingsIGuessed" | "quickQuestions" | "answers"> & {
  files: { name: string }[];
};

const STATUS_PILL: Record<PhaseStatus, string> = {
  "Not started": "pill pill-idle",
  "Working on it": "pill pill-info",
  "Ready for you": "pill pill-wait",
  "Changes asked": "pill pill-wait",
  Approved: "pill pill-ok",
};

function newest(p: OverviewProject) {
  const times = [p.createdAt, ...p.versions.flatMap((v) => [v.createdAt, v.finishedAt, v.approvedAt])].filter(Boolean) as string[];
  return times.sort().at(-1) ?? p.createdAt;
}

// What should happen next, in one sentence and one button
export function nextStep(p: OverviewProject): { phase: number; text: string; button: string } {
  const open = PHASES.find((ph) => p.phases[ph.name] !== "Approved");
  if (!open) return { phase: 6, text: "Every step is approved. Your work is done.", button: "Look at Testing" };
  const s = p.phases[open.name] ?? "Not started";
  const mine = p.versions.filter((v) => v.phase === open.n);
  const latest = mine.at(-1);
  if (latest?.status === "working") return { phase: open.n, text: `I'm working on ${open.name}. You can watch it here.`, button: `See ${open.name}` };
  if (s === "Ready for you" || (latest?.status === "done" && !latest.approved && s !== "Changes asked"))
    return { phase: open.n, text: `${open.name} is ready. Look at it, then choose Go ahead or Not yet.`, button: `Look at ${open.name}` };
  if (s === "Changes asked") return { phase: open.n, text: `You asked for changes in ${open.name}. Open it to see where it stands.`, button: `Open ${open.name}` };
  return { phase: open.n, text: `Next is ${open.name}. ${PHASE_INFO[open.n].goal}`, button: `Open ${open.name}` };
}

export function Overview({ project, onOpenPhase }: { project: OverviewProject; onOpenPhase: (n: number) => void }) {
  const approved = PHASES.filter((ph) => project.phases[ph.name] === "Approved").length;
  const working = project.versions.some((v) => v.status === "working");
  const waiting = PHASES.some((ph) => ["Ready for you", "Changes asked"].includes(project.phases[ph.name]));
  const state = working ? "Working on it" : waiting ? "Waiting for you" : approved === 6 ? "All approved" : approved === 0 ? "Just started" : "In progress";
  const understood = [...project.versions].reverse().find((v) => v.phase === 1 && v.status === "done" && v.output);
  const u = understood?.output as UnderstandOutput | undefined;
  const next = nextStep(project);
  // the first sentence is the headline, the rest sits under it in quieter text
  const [lead, ...rest] = next.text.split(/(?<=[.!?])\s+/);
  const more = rest.join(" ");

  return (
    <div className="fade-in space-y-8">
      {/* The one thing to do next. This is the focal point of the page. */}
      <section aria-label="What to do next" className="glass-card rounded-2xl p-6 sm:p-8">
        <span className="glass-badge">Next step</span>

        <div className="relative z-10">
          <h2 className="font-display max-w-2xl pr-28 text-[30px] font-semibold leading-tight sm:text-[38px]">{lead}</h2>
          {more && <p className="text-soft mt-2 max-w-xl text-[17px] leading-snug">{more}</p>}

          <p className="mt-8 flex items-baseline gap-2" aria-label={`${approved} of 6 steps approved`}>
            <span className="font-display text-[56px] font-semibold leading-none">{approved}</span>
            <span className="text-[17px] text-[#2f3b5a]">/ 6 steps approved</span>
          </p>
          <ol className="mt-3 flex max-w-md gap-1.5" role="progressbar" aria-valuemin={0} aria-valuemax={6} aria-valuenow={approved} aria-label="Steps approved">
            {PHASES.map((ph) => {
              const st = project.phases[ph.name] ?? "Not started";
              return <li key={ph.n} className={`h-1.5 flex-1 rounded-full ${st === "Approved" ? "bg-[var(--ok)]" : ph.n === next.phase ? "bg-[var(--accent)]" : "bg-white/80"}`} />;
            })}
          </ol>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <button onClick={() => onOpenPhase(next.phase)} className="btn btn-primary min-w-[240px]">
              {next.button}
              <span aria-hidden="true">→</span>
            </button>
            <p className="text-[13px] text-[#3a4768]">{state} · last changed {new Date(newest(project)).toLocaleString()}</p>
          </div>
        </div>
      </section>

      {/* Three small summaries. Full detail lives on the Understand page. */}
      <section aria-label="At a glance">
        <h2 className="section-title mb-4">At a glance</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <GlanceTile icon="sparkles" title="The idea" line="What you asked me to design" onOpen={() => onOpenPhase(1)} link="Read the full brief">
            <p className="text-[16px] leading-snug">{u?.brief.one_line ?? project.quickQuestions?.request_summary ?? project.title}</p>
          </GlanceTile>

          <GlanceTile icon="users" title="Who it is for" line="The people I am designing for" onOpen={() => onOpenPhase(1)} link="See user profiles">
            {u && u.users.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {u.users.map((x) => (
                  <li key={x.name} className="rounded-full bg-[#f3f5f9] px-3 py-1.5 text-[14px]">{x.name}</li>
                ))}
              </ul>
            ) : (
              <p className="note">Shown after the Understand step.</p>
            )}
          </GlanceTile>

          <GlanceTile icon="help" title="Still unsure" line="Things I could not answer yet" onOpen={() => onOpenPhase(1)} link="See the questions">
            <p className="flex items-baseline gap-2">
              <span className="font-display text-[40px] font-semibold leading-none">{u ? u.open_questions.length : 0}</span>
              <span className="text-[15px] text-muted">{u && u.open_questions.length === 1 ? "open question" : "open questions"}</span>
            </p>
            <p className="note mt-2">{project.thingsIGuessed.length} things I guessed so far</p>
          </GlanceTile>
        </div>
      </section>

      {/* The 6 steps as one slim row */}
      <section aria-label="The 6 steps">
        <h2 className="section-title mb-4">The 6 steps</h2>
        <ol className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {PHASES.map((ph) => {
            const s = project.phases[ph.name] ?? "Not started";
            return (
              <li key={ph.n} className="flex">
                <button onClick={() => onOpenPhase(ph.n)} className="card flex w-full flex-col items-start gap-2 !p-4 text-left transition-shadow hover:shadow-md">
                  <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-[var(--accent-ink)]"><Icon name={PHASE_ICON[ph.n]} size={18} /></span>
                  <span className="text-[16px] font-medium leading-snug"><span className="mr-1 text-[13px] font-normal text-muted">{ph.n}.</span>{ph.name}</span>
                  <span className={`${STATUS_PILL[s]} !text-[12px]`}>{s}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

function GlanceTile({ icon, title, line, link, onOpen, children }: { icon: IconName; title: string; line: string; link: string; onOpen: () => void; children: React.ReactNode }) {
  return (
    <article className="card flex flex-col !p-5">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-[var(--accent-ink)]"><Icon name={icon} size={18} /></span>
        <div>
          <h3 className="text-[17px] font-medium leading-tight">{title}</h3>
          <p className="note">{line}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
      <button onClick={onOpen} className="mt-auto pt-4 text-left text-[14px] font-medium text-[var(--accent-ink)] hover:underline">{link} →</button>
    </article>
  );
}
