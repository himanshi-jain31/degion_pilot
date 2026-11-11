"use client";

import { PHASES, PHASE_INFO } from "@/lib/phases";
import { Icon, PHASE_ICON, type IconName } from "@/components/Icons";
import type { PhaseStatus, Project, UnderstandOutput } from "@/lib/storage";
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
  // the first sentence is the headline, the rest sits under it in quieter text
  const [lead, ...rest] = next.text.split(/(?<=[.!?])\s+/);
  const more = rest.join(" ");

  const told = (project.quickQuestions?.questions ?? [])
    .filter((q) => project.answers[q.id] && project.answers[q.id] !== "You decide")
    .map((q) => ({ q: q.question, a: project.answers[q.id] }));
  const left = (project.quickQuestions?.questions ?? []).filter((q) => project.answers[q.id] === "You decide");

  return (
    <div className="fade-in space-y-8">
      {/* The one thing to do next. This is the focal point of the page. */}
      <section
        aria-label="What to do next"
        className="relative overflow-hidden rounded-2xl border border-[var(--line)] p-6 sm:p-8"
        style={{ background: "radial-gradient(520px 220px at 100% 0%, rgba(176,190,255,0.32), transparent 70%), radial-gradient(420px 200px at 0% 115%, rgba(186,222,255,0.30), transparent 70%), #ffffff", boxShadow: "0 1px 2px rgba(15,27,45,0.04), 0 14px 36px -14px rgba(40,70,140,0.16)" }}
      >
        <p className="eyebrow">Next step</p>
        <h2 className="font-display mt-3 max-w-3xl text-[26px] font-semibold leading-snug sm:text-[30px]">{lead}</h2>
        {more && <p className="text-soft mt-2 max-w-2xl text-[17px] leading-snug">{more}</p>}
        <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-5">
          <button onClick={() => onOpenPhase(next.phase)} className="btn btn-primary">
            {next.button}
            <span aria-hidden="true">→</span>
          </button>
          <div className="flex min-w-[240px] flex-1 items-center gap-3">
            <ol className="flex flex-1 gap-1.5" role="progressbar" aria-valuemin={0} aria-valuemax={6} aria-valuenow={approved} aria-label="Steps approved">
              {PHASES.map((ph) => {
                const st = project.phases[ph.name] ?? "Not started";
                return <li key={ph.n} className={`h-1.5 flex-1 rounded-full ${st === "Approved" ? "bg-[var(--ok)]" : ph.n === next.phase ? "bg-[var(--accent)]/45" : "bg-[#e6e9f0]"}`} />;
              })}
            </ol>
            <span className="note whitespace-nowrap">{approved} of 6 approved</span>
          </div>
        </div>
        <p className="note mt-5 border-t border-[var(--line)] pt-4">{state} · last changed {new Date(newest(project)).toLocaleString()}</p>
      </section>

      {/* B. What I understood */}
      <section aria-label="What I understood">
        <h2 className="section-title mb-4">What I understood</h2>
        <UnderstoodCanvas requirement={project.requirement} files={project.files} shortVersion={project.quickQuestions?.request_summary} u={u} />
      </section>

      {/* C. Told to me vs guessed */}
      <section aria-label="What you told me">
        <h2 className="section-title mb-4">What you told me</h2>
        <div className={`grid gap-4 ${u && u.open_questions.length > 0 ? "lg:grid-cols-2" : ""}`}>
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

          {u && u.open_questions.length > 0 && (
            <Tile title="Still to find out" icon="help" tone="rose" hint={`${u.open_questions.length} open`}>
              <ul className="space-y-2">
                {u.open_questions.map((q, i) => (
                  <li key={i} className="flex items-start gap-3 rounded-xl bg-[var(--bad-soft)] px-3 py-2.5 text-[15px] leading-snug text-[var(--bad-ink)]">
                    <span aria-hidden="true" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[12px] font-semibold">?</span>{q}
                  </li>
                ))}
              </ul>
              <p className="note mt-3">Everything I guessed is in the &ldquo;Things I guessed&rdquo; panel.</p>
            </Tile>
          )}
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
