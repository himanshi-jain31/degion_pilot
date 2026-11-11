"use client";

import { PHASES, PHASE_INFO } from "@/lib/phases";
import { Icon, PHASE_ICON, type IconName } from "@/components/Icons";
import type { PhaseStatus, Project, UnderstandOutput } from "@/lib/storage";
import { GuessList } from "@/components/Guesses";
import { Tile, UnderstoodCanvas } from "@/components/UnderstoodCanvas";

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

  const told = (project.quickQuestions?.questions ?? [])
    .filter((q) => project.answers[q.id] && project.answers[q.id] !== "You decide")
    .map((q) => ({ q: q.question, a: project.answers[q.id] }));
  const left = (project.quickQuestions?.questions ?? []).filter((q) => project.answers[q.id] === "You decide");
  const groups: { label: "Checked" | "My guess" | "Test idea only"; text: string }[] = [
    { label: "Checked", text: "Has a source" },
    { label: "My guess", text: "I worked this out. Please confirm or correct it." },
    { label: "Test idea only", text: "Made up so we can test. Not real." },
  ];

  return (
    <div className="fade-in space-y-8">
      {/* A. Project identity */}
      <section aria-label="This project" className="card">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h2 className="eyebrow">Project overview</h2>
          <span className={`pill ${state === "Working on it" ? "pill-info" : state === "All approved" ? "pill-ok" : state === "Waiting for you" ? "pill-wait" : "pill-idle"}`}>{state}</span>
          <span className="note ml-auto whitespace-nowrap">{approved} of 6 steps approved</span>
        </div>

        {/* The six steps as glowing nodes joined by hairlines. Click one to open it. */}
        <ol className="mt-6 flex" aria-label={`The 6 steps, ${approved} approved`}>
          {PHASES.map((ph, i) => {
            const st = project.phases[ph.name] ?? "Not started";
            const done = st === "Approved";
            const current = !done && next.phase === ph.n;
            return (
              <li key={ph.n} className="relative flex-1">
                {i < PHASES.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute left-[calc(50%+24px)] top-6 h-px w-[calc(100%-48px)] sm:left-[calc(50%+36px)] sm:top-[34px] sm:w-[calc(100%-72px)]"
                    style={{ background: done ? "linear-gradient(90deg, rgba(22,163,74,0.55), rgba(22,163,74,0.18))" : "linear-gradient(90deg, #d5dbe6, #e6e9f0)" }}
                  />
                )}
                <button onClick={() => onOpenPhase(ph.n)} aria-label={`${ph.n}. ${ph.name}: ${st}`} className="group flex w-full flex-col items-center gap-2.5 rounded-2xl px-1 pb-1 text-center">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-full bg-white/70 ring-1 transition-transform duration-200 group-hover:-translate-y-0.5 sm:h-[68px] sm:w-[68px] ${current ? "halo-pulse ring-[rgba(79,70,229,0.35)]" : done ? "ring-[rgba(22,163,74,0.25)]" : "ring-[#e6e9f0]"}`}>
                    <span className={`relative flex h-9 w-9 items-center justify-center rounded-full shadow-[0_1px_2px_rgba(15,27,45,0.08),0_6px_14px_-6px_rgba(40,70,140,0.25)] sm:h-11 sm:w-11 ${done ? "bg-[var(--ok-soft)] text-[var(--ok-ink)]" : current ? "bg-white text-[var(--accent)]" : "bg-white text-[#8a94a6]"}`}>
                      <Icon name={PHASE_ICON[ph.n]} size={20} />
                      {done && <span aria-hidden="true" className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--ok)] text-white ring-2 ring-white"><Icon name="check" size={10} /></span>}
                    </span>
                  </span>
                  <span className="hidden min-w-0 sm:block">
                    <span className={`block truncate text-[14px] font-medium ${current ? "text-ink" : done ? "text-ink" : "text-muted"}`}>{ph.name}</span>
                    <span className="block text-[12px] text-muted">{st}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <p className="note mt-5 border-t border-line pt-4">Last changed {new Date(newest(project)).toLocaleString()}</p>
      </section>

      {/* F. Next step: one clear action */}
      <section aria-label="What to do next" className="rounded-2xl border border-[var(--accent)]/30 bg-accent-soft p-6">
        <p className="label-small text-[var(--accent-ink)]">What to do next</p>
        <p className="mt-1 text-lg">{next.text}</p>
        <button onClick={() => onOpenPhase(next.phase)} className="btn btn-primary mt-4">{next.button}</button>
      </section>

      {/* B. What I understood */}
      <section aria-label="What I understood">
        <h2 className="section-title mb-4">What I understood</h2>
        <UnderstoodCanvas requirement={project.requirement} files={project.files} shortVersion={project.quickQuestions?.request_summary} u={u} />
      </section>

      {/* C. Told to me vs guessed */}
      <section aria-label="What is known and what is guessed">
        <h2 className="section-title mb-4">What you told me, and what I guessed</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Tile title="You told me" icon="message" tone="sky" hint={told.length + left.length > 0 ? `${told.length + left.length} answers` : undefined}>
            {told.length === 0 && left.length === 0 ? (
              <p className="note">No answers yet.</p>
            ) : (
              <ul className="space-y-3">
                {told.map((t, i) => (
                  <li key={i}>
                    <p className="note mb-1">{t.q}</p>
                    <p className="ml-6 inline-block max-w-full rounded-2xl rounded-tl-sm bg-[#ecf6ff] px-3.5 py-2 text-[15px] leading-snug text-[#075985]">{t.a}</p>
                  </li>
                ))}
                {left.map((q) => (
                  <li key={q.id}>
                    <p className="note mb-1">{q.question}</p>
                    <p className="ml-6 inline-block max-w-full rounded-2xl rounded-tl-sm border border-dashed border-[#d5dbe6] px-3.5 py-2 text-[15px] leading-snug text-muted">You left this to me, so it is one of my guesses.</p>
                  </li>
                ))}
              </ul>
            )}
          </Tile>

          <Tile title="Things I guessed" icon="help" tone="amber" hint={project.thingsIGuessed.length > 0 ? `${project.thingsIGuessed.length} guesses` : undefined}>
            {project.thingsIGuessed.length === 0 ? (
              <p className="note">Nothing yet. Anything I guess will show up here.</p>
            ) : (
              <div className="space-y-4">
                {groups.map((g) => {
                  const items = project.thingsIGuessed.filter((x) => x.label === g.label);
                  if (items.length === 0) return null;
                  const dot = g.label === "Checked" ? "bg-[var(--ok)]" : g.label === "My guess" ? "bg-[var(--wait)]" : "bg-[#9aa3b2]";
                  return (
                    <div key={g.label}>
                      <p className="mb-2 flex items-center gap-2 text-[15px] font-medium"><span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${dot}`} />{g.label}<span className="note font-normal">{g.text}</span></p>
                      <GuessList items={items} />
                    </div>
                  );
                })}
              </div>
            )}
            {u && u.open_questions.length > 0 && (
              <div className="mt-5 rounded-2xl p-3" style={{ background: "#fef2f2" }}>
                <p className="mb-1.5 flex items-center gap-2 text-[15px] font-medium text-[var(--bad-ink)]"><Icon name="help" size={16} />Still to find out</p>
                <ul className="space-y-1 text-[15px] leading-snug text-[var(--bad-ink)]">{u.open_questions.map((q, i) => <li key={i} className="flex gap-2"><span aria-hidden="true">?</span>{q}</li>)}</ul>
              </div>
            )}
          </Tile>
        </div>
      </section>

      {/* D + E. Roadmap and what each step gives you */}
      <section aria-label="The 6 steps">
        <h2 className="section-title">The 6 steps</h2>
        <ol className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {PHASES.map((ph) => {
            const s = project.phases[ph.name] ?? "Not started";
            const info = PHASE_INFO[ph.n];
            const made = project.versions.some((v) => v.phase === ph.n && v.status === "done");
            const prevOk = ph.n === 1 || project.phases[PHASES[ph.n - 2].name] === "Approved";
            return (
              <li key={ph.n} className="flex">
                <article className="card relative flex w-full flex-col !p-5 transition-shadow duration-150 focus-within:shadow-md hover:shadow-md">
                  <div className="flex items-center justify-between gap-3">
                    <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-[var(--accent-ink)]"><Icon name={PHASE_ICON[ph.n]} size={20} /></span>
                    <span className={`${STATUS_PILL[s]} !text-[13px]`}>{s}</span>
                  </div>
                  <h3 className="mt-4 text-[18px] font-medium leading-snug">
                    <button onClick={() => onOpenPhase(ph.n)} className="text-left after:absolute after:inset-0 after:content-['']">
                      <span className="mr-1.5 text-[14px] font-normal text-muted">{ph.n}.</span>{ph.name}
                    </button>
                  </h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-muted">{info.goal}</p>
                  <p className="label-small mt-4">You get</p>
                  <ul className="mb-4 mt-2 flex flex-wrap gap-2">
                    {info.makes.map((m) => (
                      <li key={m.label} className="flex items-center gap-2 rounded-full bg-[#f3f5f9] py-1.5 pl-2.5 pr-3 text-[13px] leading-snug text-ink"><Icon name={m.icon as IconName} size={15} className="text-[var(--accent-ink)]" />{m.label}</li>
                    ))}
                  </ul>
                  <p className="mt-auto border-t border-line pt-3 text-[14px] leading-snug text-muted">
                    {s === "Approved" ? "✓ You said Go ahead." : made ? "Made. Waiting for your Go ahead." : prevOk ? "Waiting to start." : `Opens after you approve ${PHASES[ph.n - 2].name}.`}
                  </p>
                </article>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
