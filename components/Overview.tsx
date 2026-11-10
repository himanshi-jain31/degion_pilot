"use client";

import { PHASES } from "@/lib/phases";
import type { PhaseStatus, Project, UnderstandOutput } from "@/lib/storage";
import { Pill } from "@/components/UnderstandView";

type OverviewProject = Pick<Project, "title" | "requirement" | "createdAt" | "phases" | "versions" | "thingsIGuessed" | "quickQuestions" | "answers"> & {
  files: { name: string }[];
};

// Plain-words goal and deliverables for each step. This is the same for every project.
const PHASE_INFO: Record<number, { goal: string; makes: string[] }> = {
  1: { goal: "Make sure I understood what you need.", makes: ["Brief", "User profiles", "Requirements", "Things you may not have asked about"] },
  2: { goal: "Find out what already exists and what people need.", makes: ["Competitors and patterns", "What people say", "What the numbers say", "Accessibility"] },
  3: { goal: "Shape the product and pick a direction.", makes: ["Product structure", "User flows", "User journeys", "2 to 3 directions"] },
  4: { goal: "Draw every screen in grey, clickable form.", makes: ["Wireframes of every screen and state"] },
  5: { goal: "Give it the final look.", makes: ["Working HTML prototype"] },
  6: { goal: "Check it with real people.", makes: ["Test plan and script", "Analysis of your test notes", "Suggested fixes"] },
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
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="section-title !mb-0">Overview</h2>
          <span className={`pill ${state === "Working on it" ? "pill-info" : state === "All approved" ? "pill-ok" : state === "Waiting for you" ? "pill-wait" : "pill-idle"}`}>{state}</span>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={6} aria-valuenow={approved} aria-label="Steps approved">
            <div className="h-full rounded-full bg-[var(--ok)] transition-all duration-300" style={{ width: `${(approved / 6) * 100}%` }} />
          </div>
          <span className="note whitespace-nowrap">{approved} of 6 steps approved</span>
        </div>
        <p className="note mt-3">Last changed {new Date(newest(project)).toLocaleString()}</p>
      </section>

      {/* F. Next step: one clear action */}
      <section aria-label="What to do next" className="rounded-2xl border border-[var(--accent)]/30 bg-accent-soft p-6">
        <p className="label-small text-[var(--accent-ink)]">What to do next</p>
        <p className="mt-1 text-lg">{next.text}</p>
        <button onClick={() => onOpenPhase(next.phase)} className="btn btn-primary mt-4">{next.button}</button>
      </section>

      {/* B. What I understood */}
      <section aria-label="What I understood">
        <h2 className="section-title">What I understood</h2>
        <div className="card space-y-5">
          <div>
            <p className="label-small">In your words</p>
            <p className="mt-1 whitespace-pre-wrap">{project.requirement}</p>
            {project.files.length > 0 && <p className="note mt-2">Documents: {project.files.map((f) => f.name).join(", ")}</p>}
          </div>
          {project.quickQuestions?.request_summary && (
            <div>
              <p className="label-small">My short version</p>
              <p className="mt-1">{project.quickQuestions.request_summary}</p>
            </div>
          )}
          {u ? (
            <>
              <div>
                <p className="label-small">The brief</p>
                <p className="mt-1">{u.brief.one_line}</p>
                {u.brief.full && <p className="note mt-1">{u.brief.full}</p>}
              </div>
              {u.users.length > 0 && (
                <div>
                  <p className="label-small">Who it is for</p>
                  <ul className="mt-2 grid gap-3 sm:grid-cols-2">
                    {u.users.map((x, i) => (
                      <li key={i} className="rounded-xl border border-line p-3 text-[15px]">
                        <strong className="font-medium">{x.name}</strong><Pill label={x.label} />
                        <span className="note mt-1 block">{x.note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {u.requirements.length > 0 && (
                <div>
                  <p className="label-small">What it needs to do</p>
                  <ul className="mt-2 space-y-1.5 text-[15px]">
                    {u.requirements.map((r) => (
                      <li key={r.id}><span className="text-muted">{r.id}</span> {r.story}<Pill label={r.label} /></li>
                    ))}
                  </ul>
                </div>
              )}
              {u.success_measures.length > 0 && (
                <div>
                  <p className="label-small">How we will know it worked</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px]">{u.success_measures.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
              )}
            </>
          ) : (
            <p className="note">The full brief, users and requirements appear here once Understand has finished.</p>
          )}
          <p className="note">To change something, open Understand and use the Check-in. Your note there is applied when I redo the step.</p>
        </div>
      </section>

      {/* C. Told to me vs guessed */}
      <section aria-label="What is known and what is guessed">
        <h2 className="section-title">What you told me, and what I guessed</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card">
            <p className="label-small">You told me</p>
            {told.length === 0 && left.length === 0 ? (
              <p className="note mt-2">No answers yet.</p>
            ) : (
              <ul className="mt-3 space-y-3 text-[15px]">
                {told.map((t, i) => (
                  <li key={i}>
                    <span className="note block">{t.q}</span>
                    {t.a}
                  </li>
                ))}
                {left.map((q) => (
                  <li key={q.id}>
                    <span className="note block">{q.question}</span>
                    You left this to me, so it is one of my guesses.
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card">
            <p className="label-small">Things I guessed</p>
            {project.thingsIGuessed.length === 0 ? (
              <p className="note mt-2">Nothing yet. Anything I guess will show up here.</p>
            ) : (
              <div className="mt-3 space-y-4">
                {groups.map((g) => {
                  const items = project.thingsIGuessed.filter((x) => x.label === g.label);
                  if (items.length === 0) return null;
                  return (
                    <div key={g.label}>
                      <p className="text-[15px] font-medium">{g.label}<span className="note ml-2 font-normal">{g.text}</span></p>
                      <ul className="mt-1 space-y-2 text-[15px]">
                        {items.map((x) => (
                          <li key={x.id}>
                            {x.text}
                            {x.status && <span className={`ml-2 ${x.status === "Confirmed" ? "pill pill-ok" : x.status === "Wrong" ? "pill pill-bad" : "pill pill-idle"} !text-[13px]`}>{x.status}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
            {u && u.open_questions.length > 0 && (
              <div className="mt-4 border-t border-line pt-3">
                <p className="text-[15px] font-medium">Still to find out</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-[15px]">{u.open_questions.map((q, i) => <li key={i}>{q}</li>)}</ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* D + E. Roadmap and what each step gives you */}
      <section aria-label="The 6 steps">
        <h2 className="section-title">The 6 steps</h2>
        <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {PHASES.map((ph) => {
            const s = project.phases[ph.name] ?? "Not started";
            const info = PHASE_INFO[ph.n];
            const made = project.versions.some((v) => v.phase === ph.n && v.status === "done");
            const prevOk = ph.n === 1 || project.phases[PHASES[ph.n - 2].name] === "Approved";
            return (
              <li key={ph.n}>
                <button onClick={() => onOpenPhase(ph.n)} className="card h-full w-full text-left transition-shadow duration-150 hover:shadow-md">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[15px] font-medium">{ph.n}. {ph.name}</span>
                    <span className={`${STATUS_PILL[s]} !text-[13px]`}>{s}</span>
                  </span>
                  <span className="note mt-2 block">{info.goal}</span>
                  <span className="mt-3 block text-[14px] text-muted">You get:</span>
                  <span className="block text-[15px]">{info.makes.join(" · ")}</span>
                  <span className="note mt-3 block">
                    {s === "Approved" ? "You said Go ahead." : made ? "Made. Waiting for your Go ahead." : prevOk ? "Waiting to start." : `Opens after you approve ${PHASES[ph.n - 2].name}.`}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
