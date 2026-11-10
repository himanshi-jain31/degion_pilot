"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PHASES, BUILT_PHASES, PHASE_INFO } from "@/lib/phases";
import type { IdeateOutput, PhaseVersion, Project, DesignOutput, ResearchOutput, TestingOutput, UnderstandOutput, WireframeOutput } from "@/lib/storage";
import { Pill, PlanView, WorkView } from "@/components/UnderstandView";
import { ResearchWork } from "@/components/ResearchView";
import { WireframeWork } from "@/components/WireframeView";
import { FinalResult, PrototypeWork } from "@/components/PrototypeView";
import { TestingWork } from "@/components/TestingView";
import { FigmaPanel } from "@/components/FigmaPanel";
import { DesignStylePanel } from "@/components/DesignStylePanel";
import { IdeateWork } from "@/components/IdeateView";
import { CheckIn } from "@/components/CheckIn";
import { Progress } from "@/components/Progress";
import { Icon, PHASE_ICON } from "@/components/Icons";
import { Overview } from "@/components/Overview";
import { PhaseLine } from "@/components/PhaseLine";
import { ActionBar, BackLink, Loading, Notice, primaryClass, quietClass } from "@/components/ui";

type ProjectView = Omit<Project, "files" | "interviewNotes" | "testNotes"> & {
  testNotes: { name: string; uploadedAt: string; round: number }[];
  demo?: boolean;
  designStyle: (Omit<NonNullable<Project["designStyle"]>, "files"> & { files: { name: string; kind: string; note: string }[] }) | null;
  interviewNotes: { name: string; uploadedAt: string }[];
  files: { name: string; kind: string; note: string }[];
};

const STATUS_COLOUR: Record<string, string> = {
  "Not started": "pill pill-idle",
  "Working on it": "pill pill-info",
  "Ready for you": "pill pill-wait",
  "Changes asked": "pill pill-wait",
  Approved: "pill pill-ok",
};

function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectView | null>(null);
  const [loadError, setLoadError] = useState<{ text: string; missing: boolean } | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [checkinEl, setCheckinEl] = useState<HTMLElement | null>(null);
  const [checkinSeen, setCheckinSeen] = useState(false);
  const [view, setView] = useState<"overview" | "phase" | "style" | "figma" | "final">("overview");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      const data = await res.json();
      if (!res.ok) throw Object.assign(new Error(data.error), { missing: res.status === 404 });
      setProject(data);
      setLoadError(null);
    } catch (e) {
      setLoadError({ text: e instanceof Error ? e.message : "I couldn't open this project.", missing: !!(e as { missing?: boolean })?.missing });
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Open on the first step that is not approved yet
  useEffect(() => {
    if (project && selected === null) {
      const next = PHASES.find((p) => project.phases[p.name] !== "Approved" && BUILT_PHASES.includes(p.n));
      const n = next?.n ?? BUILT_PHASES[BUILT_PHASES.length - 1];
      setSelected(n);
    }
  }, [project, selected]);

  const working = project?.versions.some((v) => v.status === "working") ?? false;
  useEffect(() => {
    if (!working) return;
    const t = setInterval(refresh, 2000);
    return () => clearInterval(t);
  }, [working, refresh]);

  useEffect(() => {
    if (project) document.title = `${project.title} · DesignPilot`;
  }, [project?.title]); // eslint-disable-line react-hooks/exhaustive-deps

  const sel = selected ?? 1;

  // Knows when the Check-in is on screen, so the bottom button only shows when it is needed
  useEffect(() => {
    if (!checkinEl) return;
    const o = new IntersectionObserver(([e]) => setCheckinSeen(e.isIntersecting), { threshold: 0.2 });
    o.observe(checkinEl);
    return () => o.disconnect();
  }, [checkinEl]);

  function choosePhase(n: number) {
    setSelected(n);
    setView("phase");
    window.scrollTo({ top: 0 });
  }

  async function post(url: string, body: object) {
    setBusy(true);
    setActionError("");
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      await refresh();
      return data as { goTo?: number; started?: number; waiting?: boolean; mixing?: boolean };
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  if (loadError)
    return (
      <main id="main" tabIndex={-1} className="mx-auto max-w-xl px-5 py-16">
        <h1 className="mb-4 text-2xl font-semibold">{loadError.missing ? "I can't find this project" : "I couldn't open this project"}</h1>
        <Notice
          tone="error"
          action={
            loadError.missing ? (
              <Link href="/" className={`${primaryClass} button-link`}>Back to Home</Link>
            ) : (
              <button onClick={refresh} className={primaryClass}>Try again</button>
            )
          }
        >
          {loadError.missing ? "It may have been deleted. Your other projects are on Home." : loadError.text}
        </Notice>
      </main>
    );
  if (!project)
    return (
      <main id="main" tabIndex={-1} className="mx-auto max-w-xl px-5 py-16">
        <Loading onReload={refresh}>Working on it... opening your project.</Loading>
      </main>
    );

  const info = PHASES.find((p) => p.n === sel)!;
  const versions = project.versions.filter((v) => v.phase === sel);
  const latest = versions.at(-1);
  const shown = [...versions].reverse().find((v) => v.status === "done"); // newest finished version
  const previousApproved = sel === 1 || project.versions.some((v) => v.phase === sel - 1 && v.approved);
  const nextPhase = PHASES.find((p) => p.n === sel + 1 && BUILT_PHASES.includes(p.n));
  const round = project.testRound ?? 1;
  const roundNotes = project.testNotes.filter((n) => n.round === round).length;
  const preparedCount = versions.filter((v) => v.part === "prepare" && v.status !== "failed").length;
  const needsNewRound = sel === 6 && !project.fixLoop && !!latest && latest.status !== "working" && preparedCount < round;
  const needsDesignRedo = sel === 5 && !!project.fixLoop?.needsDesign && latest?.approved && latest.status === "done";
  const fixWhere = project.fixLoop?.target === "wireframes" ? "Wireframes" : "Visual design";
  const questionsDone = !!project.quickQuestions && project.quickQuestions.questions.every((q) => project.answers[q.id]);
  const built = BUILT_PHASES.includes(sel);
  const finalVersion = project.finalDesignVersionId ? project.versions.find((v) => v.id === project.finalDesignVersionId) : undefined;
  const status = project.phases[info.name] ?? "Not started";
  // Screen names from the newest finished design (or wireframe), so Testing can point at them
  const screenNames = (([5, 4].map((n) => [...project.versions].reverse().find((v) => v.phase === n && v.status === "done" && v.output)).find(Boolean)?.output as WireframeOutput | undefined)?.screens ?? []).map((x) => x.name);
  const needsAnalysis = sel === 6 && !!shown?.output && !(shown.output as TestingOutput).results_analysis && latest?.status === "done";

  // The one main action for this screen. It always sits bottom right.
  function mainAction() {
    if (view === "style") return <ActionBar><button onClick={() => setView("phase")} className={primaryClass}>Done</button></ActionBar>;
    if (view !== "phase" || !built) return null;
    const run = (body: object) => () => post(`/api/projects/${id}/phases/${sel}/run`, body);
    if (latest?.status === "working")
      return <ActionBar><button disabled className={primaryClass}>Working on it...</button></ActionBar>;
    if (latest?.status === "failed")
      return <ActionBar><button disabled={busy} onClick={run({ feedback: latest.feedback, part: latest.part })} className={primaryClass}>Try again</button></ActionBar>;
    if (needsDesignRedo)
      return <ActionBar><button disabled={busy} onClick={run({})} className={primaryClass}>Redo the design</button></ActionBar>;
    if (needsNewRound)
      return (
        <ActionBar>
          <button disabled={busy} onClick={run({ part: "prepare", feedback: `Round ${round}: the prototype was changed to fix problems found in round ${round - 1}. Make a new test kit that checks those fixes.` })} className={primaryClass}>
            Start round {round}
          </button>
        </ActionBar>
      );
    if (!latest) {
      if (!previousApproved) return <ActionBar><button disabled className={primaryClass}>Waiting for step {sel - 1}</button></ActionBar>;
      if (!questionsDone) return <ActionBar><Link href={`/project/${id}/questions`} className={`${primaryClass} button-link`}>Answer quick questions</Link></ActionBar>;
      return <ActionBar><button disabled={busy} onClick={run({})} className={primaryClass}>Start {info.name}</button></ActionBar>;
    }
    if (needsAnalysis)
      return (
        <ActionBar>
          <button disabled={busy || roundNotes === 0} onClick={() => post(`/api/projects/${id}/phases/6/run`, { part: "analyse" })} className={primaryClass}>
            {roundNotes === 0 ? "Add your notes first" : "Analyse my notes"}
          </button>
        </ActionBar>
      );
    if (shown?.output && latest.status === "done") {
      if (latest.approved) {
        if (sel >= 5 && finalVersion) return <ActionBar><button onClick={() => setView("final")} className={primaryClass}>See the final result</button></ActionBar>;
        if (nextPhase) return <ActionBar><button onClick={() => choosePhase(nextPhase.n)} className={primaryClass}>Next: {nextPhase.name}</button></ActionBar>;
        return null;
      }
      if (!(checkinEl && checkinSeen)) return <ActionBar><button onClick={() => document.getElementById("checkin")?.scrollIntoView({ behavior: "smooth" })} className={primaryClass}>Go to the check-in</button></ActionBar>;
    }
    return null; // the check-in shows its own buttons
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pb-40 pt-2">
      <header className="mb-8">
        <BackLink />
        <h1 className="page-title mb-6 mt-3 max-w-3xl">{project.title}</h1>
        <PhaseLine phases={project.phases} selected={view === "phase" ? sel : null} onSelect={choosePhase} />
      </header>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Phase rail */}
        <nav aria-label="Steps" className="lg:w-60 lg:shrink-0">
          <ol className="space-y-1">
            <li>
              <button
                aria-current={view === "overview" ? "page" : undefined}
                onClick={() => setView("overview")}
                className={`w-full rounded-xl border px-4 py-3 text-left transition-colors duration-150 ${view === "overview" ? "border-line bg-card shadow-[0_1px_2px_rgba(28,28,30,0.04)]" : "border-transparent text-muted hover:bg-card/70 hover:text-ink"}`}
              >
                <span className={`block text-[15px] ${view === "overview" ? "font-medium text-ink" : ""}`}>Overview</span>
                <span className="text-[13px]">{PHASES.filter((p) => project.phases[p.name] === "Approved").length} of 6 approved</span>
              </button>
            </li>
            {PHASES.map((p) => {
              const s = project.phases[p.name] ?? "Not started";
              const active = view === "phase" && sel === p.n;
              return (
                <li key={p.n}>
                  <button
                    aria-current={active ? "step" : undefined}
                    onClick={() => choosePhase(p.n)}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition-colors duration-150 ${active ? "border-line bg-card shadow-[0_1px_2px_rgba(28,28,30,0.04)]" : "border-transparent text-muted hover:bg-card/70 hover:text-ink"}`}
                  >
                    <span className={`flex items-center gap-2 text-[15px] ${active ? "font-medium text-ink" : ""}`}><Icon name={PHASE_ICON[p.n]} size={16} />{p.n}. {p.name}</span>
                    <span className={`${STATUS_COLOUR[s]} mt-1 !text-[13px]`}>{s}</span>
                  </button>
                </li>
              );
            })}
            <li className="pt-4">
              <button onClick={() => setView("style")} className={`w-full rounded-xl border px-4 py-3 text-left transition-colors duration-150 ${view === "style" ? "border-line bg-card shadow-[0_1px_2px_rgba(28,28,30,0.04)]" : "border-transparent text-muted hover:bg-card/70 hover:text-ink"}`}>
                <span className="block text-[15px]">Design style</span>
                <span className="text-[13px]">{project.designStyle ? "Saved" : "Optional"}</span>
              </button>
            </li>
            <li>
              <button onClick={() => setView("figma")} className={`w-full rounded-xl border px-4 py-3 text-left transition-colors duration-150 ${view === "figma" ? "border-line bg-card shadow-[0_1px_2px_rgba(28,28,30,0.04)]" : "border-transparent text-muted hover:bg-card/70 hover:text-ink"}`}>
                <span className="block text-[15px]">Add a Figma file</span>
                <span className="text-[13px]">{(project.figmaFiles ?? []).length ? `${(project.figmaFiles ?? []).length} added` : "Optional, read only"}</span>
              </button>
            </li>
            <li>
              {finalVersion ? (
                <button onClick={() => setView("final")} className={`w-full rounded-xl border px-4 py-3 text-left transition-colors duration-150 ${view === "final" ? "border-line bg-card shadow-[0_1px_2px_rgba(28,28,30,0.04)]" : "border-transparent text-muted hover:bg-card/70 hover:text-ink"}`}>
                  <span className="block text-[15px]">Final result</span>
                  <span className="text-[13px]">Your design is ready</span>
                </button>
              ) : (
                <div className="rounded-xl px-4 py-3 text-muted">
                  <span className="block text-[15px]">Final result</span>
                  <span className="text-[13px]">Comes after Visual design</span>
                </div>
              )}
            </li>
          </ol>
        </nav>

        {/* Main area */}
        <main id="main" tabIndex={-1} className="min-w-0 flex-1">
          {view === "overview" && <Overview project={project} onOpenPhase={choosePhase} />}
          {view === "style" && (
            <div>
              <h2 className="section-title">Design style</h2>
              <DesignStylePanel projectId={id} style={project.designStyle} onSaved={refresh} />
            </div>
          )}
          {view === "figma" && (
            <div>
              <h2 className="section-title">Add a Figma file</h2>
              <FigmaPanel projectId={id} files={project.figmaFiles ?? []} onChanged={refresh} />
            </div>
          )}
          {view === "final" && finalVersion?.output && (
            <div>
              <h2 className="section-title">Final result</h2>
              <FinalResult
                out={finalVersion.output as DesignOutput}
                projectId={id}
                versionId={finalVersion.id}
                testingDone={project.phases["Testing"] === "Approved"}
                onNext={() => choosePhase(6)}
              />
            </div>
          )}
          {view === "phase" && (
            <>
              <div className="relative overflow-hidden rounded-3xl border border-line bg-card p-6 shadow-[0_1px_2px_rgba(28,28,30,0.04),0_8px_28px_rgba(79,70,229,0.06)] sm:p-8">
                <div className="relative">
                  <div className="flex items-start gap-4">
                    <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-white"><Icon name={PHASE_ICON[info.n]} size={24} /></span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h2 className="text-[30px] font-medium leading-tight tracking-tight">{info.name}</h2>
                        <span className={STATUS_COLOUR[status]}>{status}</span>
                      </div>
                      <p className="label-small mt-0.5">Step {info.n} of 6</p>
                      <p className="mt-2 max-w-xl text-[17px] text-muted">{PHASE_INFO[info.n].goal}</p>
                    </div>
                  </div>
                  <ol className="mt-6 flex flex-wrap items-center gap-2 text-[14px]" aria-label="Where this step is">
                    {[
                      ["Plan", !!shown?.output || latest?.status === "working"],
                      ["Made", !!shown?.output && latest?.status !== "working"],
                      ["Your decision", status === "Approved"],
                    ].map(([label, done], i) => (
                      <li key={String(label)} className="flex items-center gap-2">
                        {i > 0 && <span aria-hidden="true" className={`h-px w-6 ${done ? "bg-[var(--ok)]" : "bg-[#dcdcd5]"}`} />}
                        <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 ${done ? "bg-[var(--ok-soft)] text-[var(--ok-ink)]" : "bg-[#f1f1ed] text-muted"}`}>
                          <span aria-hidden="true">{done ? "✓" : i + 1}</span>
                          {label}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div key={sel} className="fade-in mt-8 space-y-12">
                {!built ? (
                  <Notice>This step is not built yet. It comes after the earlier steps are working.</Notice>
                ) : (
                  <>
                    {latest?.status === "working" && <Progress v={latest} phase={sel} />}

                    {latest?.status === "failed" && (
                      <Notice tone="error">{latest.error} Use the Try again button at the bottom right.</Notice>
                    )}

                    {sel === 6 && latest?.approved && (
                      <p className="rounded-lg border border-green-300 bg-green-50 p-3">All six steps are done. Your final design is on the Final result page.</p>
                    )}
                    {project.fixLoop && (sel === 6 || (sel === 4 && project.fixLoop.target === "wireframes" && !project.fixLoop.needsDesign) || sel === 5) && (
                      <p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
                        {sel === 6
                          ? `Fixes from testing are being made in ${fixWhere}. When you say Go ahead there, you come back here for another round.`
                          : "These changes are fixes from testing. When you say Go ahead, " + (sel === 4 ? "the design will be redone next, then you come back to Testing." : "you come back to Testing.")}
                      </p>
                    )}
                    {needsDesignRedo && <Notice>The wireframe changed after testing, so the design has to be redone from it.</Notice>}
                    {needsNewRound && <Notice>Your fixes are done. Start round {round} to test the updated prototype.</Notice>}
                    {sel === 5 && !latest && previousApproved && (
                      <p className="text-sm text-neutral-800">
                        {(project.figmaFiles ?? []).some((f) => f.role === "design-system")
                          ? "I will use your Figma design system as the design style."
                          : project.designStyle
                          ? "I will use your design style."
                          : "You have not set a design style. I will use a clean neutral look."}{" "}
                        <button onClick={() => setView("style")} className="underline">Open Design style</button>
                      </p>
                    )}
                    {!latest && (
                      <Notice>
                        {!previousApproved
                          ? `This step starts after you say Go ahead on step ${sel - 1}.`
                          : questionsDone
                          ? "I have what I need. Start when you are ready. I will plan first, then do the step."
                          : "First, I need your answers to a few quick questions."}
                      </Notice>
                    )}

                    {actionError && <Notice tone="error">{actionError}</Notice>}

                    {shown?.output && latest?.status !== "working" && (
                      <>
                        {shown.version > 1 && shown.feedback && (
                          <p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                            <strong>Version {shown.version}: updated using your feedback.</strong> You asked: &quot;{shown.feedback.length > 200 ? shown.feedback.slice(0, 200) + "…" : shown.feedback}&quot;
                          </p>
                        )}

                        <details open={!shown.approved} className="group">
                          <summary className="flex cursor-pointer select-none list-none items-center gap-3 [&::-webkit-details-marker]:hidden"><span className="step-badge">1</span><span className="section-title">My plan</span><span className="note ml-auto group-open:hidden">Show</span></summary>
                          <div className="mt-5">
                          <PlanView out={shown.output} />
                          </div>
                        </details>

                        <section id="made" aria-label="What I made" className="scroll-mt-6">
                          <h3 className="mb-2 flex items-center gap-3"><span className="step-badge">2</span><span className="section-title">What I made</span></h3>
                          {sel === 1 && <WorkView out={shown.output as UnderstandOutput} />}
                          {sel === 2 && <ResearchWork out={shown.output as ResearchOutput} />}
                          {sel === 3 && (
                            <IdeateWork
                              out={shown.output as IdeateOutput}
                              onMakeJourneysFuller={
                                !shown.approved && latest?.id === shown.id && !busy
                                  ? () => post(`/api/projects/${id}/phases/3/checkin`, { decision: "not_yet", note: "Make the user journeys fuller: 5 to 7 stages each, with what the person does, thinks and feels, a feeling score, the problem at each stage, and the same stages again for the future." })
                                  : undefined
                              }
                            />
                          )}
                          {sel === 4 && <WireframeWork out={shown.output as WireframeOutput} projectId={id} versionId={shown.id} />}
                          {sel === 5 && <PrototypeWork out={shown.output as DesignOutput} projectId={id} versionId={shown.id} style={project.designStyle} />}
                          {sel === 6 && (
                            <TestingWork out={shown.output as TestingOutput} projectId={id} notesCount={roundNotes} round={round} onRefresh={refresh} screens={screenNames} />
                          )}
                        </section>

                        <section id="checkin" ref={setCheckinEl} aria-label="Check-in" className="scroll-mt-6">
                          <h3 className="mb-3 flex items-center gap-3"><span className="step-badge">3</span><span className="section-title">Your decision: Check-in</span></h3>
                          {sel === 6 && !(shown.output as TestingOutput).results_analysis ? (
                            <Notice>The check-in comes after the testing. Download the test kit above, run your sessions, then add your notes.</Notice>
                          ) : (
                            <CheckIn
                              key={shown.id}
                              version={shown}
                              projectId={id}
                              notesCount={project.interviewNotes.length}
                              onRefresh={refresh}
                              onOpenWork={() => document.getElementById("made")?.scrollIntoView({ behavior: "smooth" })}
                              isLatest={latest?.id === shown.id}
                              busy={busy}
                              onGo={async (note, extra) => {
                                const data = await post(`/api/projects/${id}/phases/${sel}/checkin`, { decision: "go", note, ...extra });
                                if (!data) return false;
                                if (data.goTo) choosePhase(data.goTo); // sent back for fixes, or back to Testing
                                else if (data.started) choosePhase(data.started); // the next step is already working
                                else if (sel === 5) setView("final");
                                return true;
                              }}
                              onNotYet={(note) => post(`/api/projects/${id}/phases/${sel}/checkin`, { decision: "not_yet", note })}
                            />
                          )}
                        </section>
                      </>
                    )}

                    {latest && latest.status !== "working" && (
                      <details>
                        <summary className="flex cursor-pointer select-none list-none items-center gap-3 rounded-xl py-1 [&::-webkit-details-marker]:hidden"><span aria-hidden="true" className="step-badge !bg-[#f1f1ed] !text-muted">↺</span><span className="section-title">What I did</span><span className="note ml-auto">History</span></summary>
                        <div className="mt-5"><WhatIDid versions={versions} /></div>
                      </details>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </main>

        {/* Things I guessed */}
        <aside aria-label="Things I guessed" className="lg:w-80 lg:shrink-0">
          <div className="card !p-6">
            <h2 className="section-title">Things I guessed</h2>
            {project.thingsIGuessed.length === 0 ? (
              <p className="note mt-2">Nothing yet. Anything I guess will show up here.</p>
            ) : (
              <ul className="mt-4 space-y-4 text-sm leading-relaxed">
                {project.thingsIGuessed.map((g) => (
                  <li key={g.id}>
                    {g.text}
                    <Pill label={g.label} />
                    {g.status && (
                      <span className={`ml-2 ${g.status === "Confirmed" ? "pill pill-ok" : g.status === "Wrong" ? "pill pill-bad" : "pill pill-idle"} !text-[13px]`}>
                        {g.status}
                      </span>
                    )}
                    {g.evidence && <span className="note mt-1 block">From your notes: {g.evidence}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      {mainAction()}
    </div>
  );
}

function WhatIDid({ versions }: { versions: PhaseVersion[] }) {
  const latestDone = [...versions].reverse().find((v) => v.output);
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {latestDone?.output && (
        <section>
          <p className="label-small mb-3">Steps I took</p>
          <ol>
            {latestDone.output.what_i_did.map((t, i, all) => (
              <li key={i} className="relative flex gap-3 pb-3 last:pb-0">
                {i < all.length - 1 && <span aria-hidden="true" className="absolute left-[11px] top-6 h-[calc(100%-1rem)] w-px bg-line" />}
                <span aria-hidden="true" className="z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f1f1ed] text-[12px] text-muted ring-4 ring-canvas">{i + 1}</span>
                <p className="text-[15px] leading-snug">{t}</p>
              </li>
            ))}
          </ol>
        </section>
      )}
      <section>
        <p className="label-small mb-3">Versions saved</p>
        <ul className="space-y-2">
          {[...versions].reverse().map((v) => {
            const state = v.status === "done" ? (v.approved ? "Approved" : "Finished") : v.status === "working" ? "Working on it" : "Did not finish";
            const pill = v.approved ? "pill-ok" : v.status === "done" ? "pill-wait" : v.status === "working" ? "pill-info" : "pill-bad";
            return (
              <li key={v.id} className="rounded-xl border border-line bg-card p-4 text-[15px]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">Version {v.version}</span>
                  <span className={`pill ${pill} !text-[13px]`}>{state}</span>
                </div>
                <p className="note mt-1">{new Date(v.createdAt).toLocaleString()}</p>
                {v.feedback && <p className="mt-2 text-[14px]"><span className="text-muted">Your feedback:</span> {v.feedback}</p>}
                {v.approvalNote && <p className="mt-2 text-[14px]"><span className="text-muted">Your note:</span> {v.approvalNote}</p>}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="p-10">Working on it...</p>}>
      <ProjectPage />
    </Suspense>
  );
}
