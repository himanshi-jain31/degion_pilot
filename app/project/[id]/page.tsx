"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PHASES, BUILT_PHASES } from "@/lib/phases";
import type { IdeateOutput, PhaseVersion, Project, DesignOutput, ResearchOutput, TestingOutput, UnderstandOutput, WireframeOutput } from "@/lib/storage";
import { Pill, PlanView, WorkView } from "@/components/UnderstandView";
import { ResearchWork } from "@/components/ResearchView";
import { WireframeWork } from "@/components/WireframeView";
import { FinalResult, PrototypeWork } from "@/components/PrototypeView";
import { TestingWork } from "@/components/TestingView";
import { FigmaPanel } from "@/components/FigmaPanel";
import { DesignStylePanel } from "@/components/DesignStylePanel";
import { DirectionCard, IdeateWork } from "@/components/IdeateView";

type ProjectView = Omit<Project, "files" | "interviewNotes" | "testNotes"> & {
  testNotes: { name: string; uploadedAt: string; round: number }[];
  demo?: boolean;
  designStyle: (Omit<NonNullable<Project["designStyle"]>, "files"> & { files: { name: string; kind: string; note: string }[] }) | null;
  interviewNotes: { name: string; uploadedAt: string }[]; files: { name: string; kind: string; note: string }[] };
type Tab = "Plan" | "Work" | "What I did" | "Check-in";
const TABS: Tab[] = ["Plan", "Work", "What I did", "Check-in"];

const STATUS_COLOUR: Record<string, string> = {
  "Not started": "bg-neutral-100 text-neutral-600",
  "Working on it": "bg-blue-100 text-blue-800",
  "Ready for you": "bg-amber-100 text-amber-800",
  "Changes asked": "bg-orange-100 text-orange-800",
  Approved: "bg-green-100 text-green-800",
};

function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectView | null>(null);
  const [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState(1);
  const [tab, setTab] = useState<Tab>("Plan");
  const [view, setView] = useState<"phase" | "style" | "figma" | "final">("phase");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProject(data);
      setLoadError("");
      if (!picked) {
        // open on the first step that is not approved yet
        const next = PHASES.find((p) => data.phases[p.name] !== "Approved" && BUILT_PHASES.includes(p.n));
        setSelected(next?.n ?? BUILT_PHASES[BUILT_PHASES.length - 1]);
        setPicked(true);
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "I couldn't open this project.");
    }
  }, [id, picked]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const working = project?.versions.some((v) => v.status === "working") ?? false;
  useEffect(() => {
    if (!working) return;
    const t = setInterval(refresh, 2000);
    return () => clearInterval(t);
  }, [working, refresh]);

  // When a run finishes, show the results
  useEffect(() => {
    if (project) document.title = `${project.title} · DesignPilot`;
  }, [project?.title]); // eslint-disable-line react-hooks/exhaustive-deps

  const latestId = project?.versions.filter((v) => v.phase === selected).at(-1)?.id;
  const latestStatus = project?.versions.filter((v) => v.phase === selected).at(-1)?.status;
  useEffect(() => {
    if (latestStatus === "done") setTab("Work");
  }, [latestId, latestStatus]);

  async function post(url: string, body: object) {
    setBusy(true);
    setActionError("");
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      await refresh();
      return data as { goTo?: number; waiting?: boolean; mixing?: boolean };
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
        <h1 className="text-2xl font-semibold">I couldn&apos;t open this project</h1>
        <p role="alert" className="mt-3 text-red-800">{loadError}</p>
        <div className="mt-5 flex gap-3">
          <button onClick={refresh} className="rounded-lg bg-black px-6 py-3 font-medium text-white hover:bg-neutral-800">Try again</button>
          <Link href="/" className="button-link rounded-lg border border-neutral-500 px-6 py-3 hover:bg-neutral-100">Back to Home</Link>
        </div>
      </main>
    );
  if (!project) return <main id="main" tabIndex={-1} role="status" className="p-10 text-neutral-600">Working on it... opening your project.</main>;

  const info = PHASES.find((p) => p.n === selected)!;
  const versions = project.versions.filter((v) => v.phase === selected);
  const latest = versions.at(-1);
  const shown = [...versions].reverse().find((v) => v.status === "done"); // newest finished version
  const previousApproved = selected === 1 || project.versions.some((v) => v.phase === selected - 1 && v.approved);
  const nextBuilt = BUILT_PHASES.includes(selected + 1);
  const round = project.testRound ?? 1;
  const roundNotes = project.testNotes.filter((n) => n.round === round).length;
  const preparedCount = versions.filter((v) => v.part === "prepare" && v.status !== "failed").length;
  const needsNewRound = selected === 6 && !project.fixLoop && !!latest && latest.status !== "working" && preparedCount < round;
  const needsDesignRedo = selected === 5 && !!project.fixLoop?.needsDesign && latest?.approved && latest.status === "done";
  const fixWhere = project.fixLoop?.target === "wireframes" ? "Wireframes" : "Visual design";
  const questionsDone =
    !!project.quickQuestions && project.quickQuestions.questions.every((q) => project.answers[q.id]);
  const built = BUILT_PHASES.includes(selected);
  const finalVersion = project.finalDesignVersionId ? project.versions.find((v) => v.id === project.finalDesignVersionId) : undefined;
  const status = project.phases[info.name] ?? "Not started";

  return (
    <>
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-6 lg:flex-row">
      {/* Phase rail */}
      <nav aria-label="Steps" className="lg:w-56 lg:shrink-0">
        <Link href="/" className="text-sm text-neutral-600 underline">Back to Home</Link>
        <h1 className="mt-3 mb-3 text-lg font-semibold">{project.title}</h1>
        <ol className="space-y-1">
          {PHASES.map((p) => {
            const s = project.phases[p.name] ?? "Not started";
            return (
              <li key={p.n}>
                <button
                  aria-current={view === "phase" && selected === p.n ? "step" : undefined}
                  onClick={() => { setSelected(p.n); setTab("Plan"); setView("phase"); }}
                  className={`w-full rounded-lg px-3 py-2 text-left ${view === "phase" && selected === p.n ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"}`}
                >
                  <span className="block text-sm font-medium">{p.n}. {p.name}</span>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${view === "phase" && selected === p.n ? "bg-white text-neutral-900" : STATUS_COLOUR[s]}`}>{s}</span>
                </button>
              </li>
            );
          })}
          <li className="pt-2">
            <button
              onClick={() => setView("style")}
              className={`w-full rounded-lg px-3 py-2 text-left ${view === "style" ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"}`}
            >
              <span className="block text-sm font-medium">Design style</span>
              <span className="text-xs">{project.designStyle ? "Saved" : "Not set (optional)"}</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setView("figma")}
              className={`w-full rounded-lg px-3 py-2 text-left ${view === "figma" ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"}`}
            >
              <span className="block text-sm font-medium">Add a Figma file</span>
              <span className="text-xs">{(project.figmaFiles ?? []).length ? `${(project.figmaFiles ?? []).length} added` : "Optional, read only"}</span>
            </button>
          </li>
          <li>
            {finalVersion ? (
              <button
                onClick={() => setView("final")}
                className={`w-full rounded-lg px-3 py-2 text-left ${view === "final" ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"}`}
              >
                <span className="block text-sm font-medium">Final result</span>
                <span className="text-xs">Your design is ready</span>
              </button>
            ) : (
              <div className="rounded-lg px-3 py-2 text-neutral-600">
                <span className="block text-sm font-medium">Final result</span>
                <span className="text-xs">Comes after Visual design</span>
              </div>
            )}
          </li>
        </ol>
      </nav>

      {/* Main area */}
      <main id="main" tabIndex={-1} className="min-w-0 flex-1">
        {view === "style" && (
          <div>
            <h2 className="text-2xl font-semibold">Design style</h2>
            <DesignStylePanel key={JSON.stringify(project.designStyle)} projectId={id} style={project.designStyle} onSaved={refresh} />
          </div>
        )}
        {view === "figma" && (
          <div>
            <h2 className="text-2xl font-semibold">Add a Figma file</h2>
            <FigmaPanel projectId={id} files={project.figmaFiles ?? []} onChanged={refresh} />
          </div>
        )}
        {view === "final" && finalVersion?.output && (
          <div>
            <h2 className="text-2xl font-semibold">Final result</h2>
            <FinalResult
              out={finalVersion.output as DesignOutput}
              projectId={id}
              versionId={finalVersion.id}
              testingDone={project.phases["Testing"] === "Approved"}
              onNext={() => { setSelected(6); setTab("Plan"); setView("phase"); }}
            />
          </div>
        )}
        {view === "phase" && (<>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-semibold">{info.n}. {info.name}</h2>
          <span className={`rounded-full px-3 py-1 text-sm ${STATUS_COLOUR[status]}`}>{status}</span>
        </div>

        <div role="tablist" aria-label="Parts of this step" className="mt-4 flex gap-1 border-b border-neutral-200">
          {TABS.map((t, i) => (
            <button
              key={t}
              id={`tab-${t}`}
              role="tab"
              aria-selected={tab === t}
              aria-controls="tab-panel"
              tabIndex={tab === t ? 0 : -1}
              onClick={() => setTab(t)}
              onKeyDown={(e) => {
                const move = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : e.key === "Home" ? -TABS.length : e.key === "End" ? TABS.length : 0;
                if (!move) return;
                e.preventDefault();
                const next = TABS[e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : (i + move + TABS.length) % TABS.length];
                setTab(next);
                document.getElementById(`tab-${next}`)?.focus();
              }}
              className={`px-4 py-2 text-sm font-medium ${tab === t ? "border-b-2 border-black" : "text-neutral-600 hover:text-black"}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div id="tab-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="mt-4">
          {!built ? (
            <p className="text-neutral-600">This step is not built yet. It comes after the earlier steps are working.</p>
          ) : (
            <>
              {latest?.status === "working" && <Progress v={latest} phase={selected} />}

              {latest?.status === "failed" && (
                <div role="alert" className="mb-4 rounded-lg border border-red-300 bg-red-50 p-4">
                  <p role="alert" className="text-red-800">{latest.error}</p>
                  <button
                    disabled={busy}
                    onClick={() => post(`/api/projects/${id}/phases/${selected}/run`, { feedback: latest.feedback, part: latest.part })}
                    className="mt-3 rounded-lg bg-black px-4 py-2 text-white hover:bg-neutral-800 disabled:opacity-50"
                  >
                    Try again
                  </button>
                </div>
              )}

              {selected === 6 && latest?.approved && (
                <p className="mb-4 rounded-lg border border-green-300 bg-green-50 p-3 text-sm">
                  All six steps are done. Your final design is on the Final result page.
                </p>
              )}
              {project.fixLoop && (selected === 6 || (selected === 4 && project.fixLoop.target === "wireframes" && !project.fixLoop.needsDesign) || selected === 5) && (
                <p className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
                  {selected === 6
                    ? `Fixes from testing are being made in ${fixWhere}. When you say Go ahead there, you come back here for another round.`
                    : "These changes are fixes from testing. When you say Go ahead, " + (selected === 4 ? "the design will be redone next, then you come back to Testing." : "you come back to Testing.")}
                </p>
              )}
              {needsDesignRedo && (
                <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
                  <p>The wireframe changed after testing, so the design has to be redone from it.</p>
                  <button disabled={busy} onClick={() => post(`/api/projects/${id}/phases/5/run`, {})} className="mt-3 rounded-lg bg-black px-5 py-2 text-white hover:bg-neutral-800 disabled:opacity-50">
                    Redo the design
                  </button>
                </div>
              )}
              {needsNewRound && (
                <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
                  <p>Your fixes are done. Start round {round} to test the updated prototype.</p>
                  <button
                    disabled={busy}
                    onClick={() => post(`/api/projects/${id}/phases/6/run`, { part: "prepare", feedback: `Round ${round}: the prototype was changed to fix problems found in round ${round - 1}. Make a new test kit that checks those fixes.` })}
                    className="mt-3 rounded-lg bg-black px-5 py-2 text-white hover:bg-neutral-800 disabled:opacity-50"
                  >
                    Start round {round}
                  </button>
                </div>
              )}
              {selected === 5 && !latest && previousApproved && (
                <p className="mb-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm">
                  {(project.figmaFiles ?? []).some((f) => f.role === "design-system")
                    ? "I will use your Figma design system as the design style."
                    : project.designStyle
                    ? "I will use your design style."
                    : "You have not set a design style. I will use a clean neutral look and say it is not matched to a design system."}{" "}
                  <button onClick={() => setView("style")} className="underline">Open Design style</button>
                </p>
              )}
              {!latest && (
                <div className="rounded-lg border border-neutral-200 p-5">
                  {!previousApproved ? (
                    <p>This step starts after you say Go ahead on step {selected - 1}.</p>
                  ) : questionsDone ? (
                    <>
                      <p>I have what I need. When you are ready, I will work out my plan and then do the step.</p>
                      <button
                        disabled={busy}
                        onClick={() => post(`/api/projects/${id}/phases/${selected}/run`, {})}
                        className="mt-4 rounded-lg bg-black px-6 py-3 font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                      >
                        Start {info.name}
                      </button>
                    </>
                  ) : (
                    <>
                      <p>First, I need your answers to a few quick questions.</p>
                      <Link href={`/project/${id}/questions`} className="button-link mt-4 inline-block rounded-lg bg-black px-6 py-3 font-medium text-white hover:bg-neutral-800">
                        Answer quick questions
                      </Link>
                    </>
                  )}
                </div>
              )}

              {actionError && <p role="alert" className="mb-3 text-red-700">{actionError}</p>}

              {shown?.output && latest?.status !== "working" && (
                <>
                  {shown.version > 1 && shown.feedback && (
                    <p className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                      <strong>Version {shown.version}: updated using your feedback.</strong> You asked: &quot;{shown.feedback.length > 200 ? shown.feedback.slice(0, 200) + "…" : shown.feedback}&quot;
                    </p>
                  )}
                  {tab === "Plan" && <PlanView out={shown.output} />}
                  {tab === "Work" && selected === 1 && <WorkView out={shown.output as UnderstandOutput} />}
                  {tab === "Work" && selected === 2 && <ResearchWork out={shown.output as ResearchOutput} />}
                  {tab === "Work" && selected === 6 && (
                    <TestingWork
                      out={shown.output as TestingOutput}
                      projectId={id}
                      notesCount={roundNotes}
                      round={round}
                      onRefresh={refresh}
                      busy={busy}
                      onAnalyse={() => post(`/api/projects/${id}/phases/6/run`, { part: "analyse" })}
                    />
                  )}
                  {tab === "Work" && selected === 5 && <PrototypeWork out={shown.output as DesignOutput} projectId={id} versionId={shown.id} />}
                  {tab === "Work" && selected === 4 && <WireframeWork out={shown.output as WireframeOutput} projectId={id} versionId={shown.id} />}
                  {tab === "Work" && selected === 3 && <IdeateWork out={shown.output as IdeateOutput} />}
                  {tab === "What I did" && <WhatIDid versions={versions} />}
                  {tab === "Check-in" && selected === 6 && !(shown.output as TestingOutput).results_analysis && (
                    <p className="rounded-lg border border-neutral-200 p-4">
                      The check-in comes after the testing. Open the Work tab, download the test kit, run your sessions, then upload your notes.
                    </p>
                  )}
                  {tab === "Check-in" && !(selected === 6 && !(shown.output as TestingOutput).results_analysis) && (
                    <CheckIn
                      version={shown}
                      projectId={id}
                      notesCount={project.interviewNotes.length}
                      onRefresh={refresh}
                      isLatest={latest?.id === shown.id}
                      busy={busy}
                      onGo={async (note, extra) => {
                        const data = await post(`/api/projects/${id}/phases/${selected}/checkin`, { decision: "go", note, ...extra });
                        if (!data) return false;
                        if (data.goTo) {
                          // sent back for fixes, or back to Testing after the fixes
                          setSelected(data.goTo);
                          setTab("Plan");
                        } else if (!extra?.talkToUsers?.startsWith("y") && extra?.direction !== "Mix" && nextBuilt) {
                          // after an approval, open the next step
                          setSelected(selected + 1);
                          setTab("Plan");
                        }
                        // Check-in 5 makes the design final: show it on the Final result page
                        if (selected === 5 && !data.goTo) setView("final");
                        return true;
                      }}
                      onNotYet={(note) => post(`/api/projects/${id}/phases/${selected}/checkin`, { decision: "not_yet", note })}
                    />
                  )}
                </>
              )}
              {!shown?.output && latest && tab === "What I did" && <WhatIDid versions={versions} />}
              {!shown?.output && tab !== "What I did" && tab !== "Plan" && latest?.status !== "working" && (
                <p className="rounded-lg border border-dashed border-neutral-500 p-5 text-neutral-700">
                  Nothing here yet. This fills in after I finish the step.
                </p>
              )}
              {!shown?.output && tab === "Plan" && latest?.status !== "working" && !!latest && latest.status === "failed" && (
                <p className="text-neutral-700">My plan will show here as soon as the step works.</p>
              )}
            </>
          )}
        </div>
        </>)}
      </main>

      {/* Things I guessed */}
      <aside aria-label="Things I guessed" className="lg:w-72 lg:shrink-0">
        <div className="rounded-lg border border-neutral-200 p-4">
          <h2 className="font-medium">Things I guessed</h2>
          {project.thingsIGuessed.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-600">Nothing yet. Anything I guess will show up here.</p>
          ) : (
            <ul className="mt-2 space-y-3 text-sm">
              {project.thingsIGuessed.map((g) => (
                <li key={g.id}>
                  {g.text}
                  <Pill label={g.label} />
                  {g.status && (
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${g.status === "Confirmed" ? "bg-green-100 text-green-800" : g.status === "Wrong" ? "bg-red-100 text-red-800" : "bg-neutral-200 text-neutral-700"}`}>
                      {g.status}
                    </span>
                  )}
                  {g.evidence && <span className="mt-1 block text-xs text-neutral-600">From your notes: {g.evidence}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
    </>
  );
}

const STAGES: Record<number, readonly (readonly [number, string])[]> = {
  1: [
    [0, "Reading your request and your documents"],
    [15, "Writing the brief and working out who will use this"],
    [45, "Writing the requirements"],
    [75, "Checking for things you may not have asked about"],
    [90, "Putting the check-in together"],
  ],
  2: [
    [0, "Planning my searches"],
    [10, "Searching the web and reading sources"],
    [45, "Sorting what I found and linking each source"],
    [75, "Writing insights and the kit for talking to real users"],
    [90, "Putting the check-in together"],
  ],
  4: [
    [0, "Listing every screen"],
    [10, "Drawing the screens one by one"],
    [85, "Joining the screens and checking every button"],
    [95, "Putting the check-in together"],
  ],
  5: [
    [0, "Reading the approved wireframe and your design style"],
    [10, "Applying the design to each screen"],
    [85, "Joining the screens and working out contrast"],
    [95, "Putting the check-in together"],
  ],
  6: [
    [0, "Reading the prototype and your notes"],
    [15, "Working out the test plan, script and problems"],
    [60, "Ranking the problems and checking my guesses"],
    [90, "Putting the check-in together"],
  ],
  3: [
    [0, "Reading the approved research"],
    [15, "Drawing the product structure and flows"],
    [45, "Writing the journeys and storyboard"],
    [70, "Shaping different directions"],
    [90, "Putting the check-in together"],
  ],
};

function Progress({ v, phase }: { v: PhaseVersion; phase: number }) {
  // While the web is being searched no text arrives, so the bar also creeps forward with time
  const elapsed = (Date.now() - new Date(v.createdAt).getTime()) / 1000;
  const fromText = Math.round((v.progressChars / 14000) * 100);
  const percent = Math.min(95, Math.max(fromText, phase === 2 ? Math.min(40, Math.round(elapsed / 2)) : 0));
  const stage = [...STAGES[phase]].reverse().find(([from]) => percent >= from)![1];
  return (
    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4" role="status">
      <p className="font-medium">Working on it...{v.version > 1 && " (using your feedback)"}</p>
      <p className="mt-1 text-sm">{v.progressNote ?? stage}</p>
      <div role="progressbar" aria-label="Progress (an estimate)" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.max(percent, 3)} className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100">
        <div className="h-full bg-blue-600 transition-all" style={{ width: `${Math.max(percent, 3)}%` }} />
      </div>
      <p className="mt-2 text-xs text-neutral-600">
        This bar is my best estimate. It can take a minute or two{phase === 2 ? ", and research can take a few minutes" : ""}.
      </p>
    </div>
  );
}

function WhatIDid({ versions }: { versions: PhaseVersion[] }) {
  const latestDone = [...versions].reverse().find((v) => v.output);
  return (
    <div>
      {latestDone?.output && (
        <section>
          <h3 className="text-lg font-medium">What I did</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {latestDone.output.what_i_did.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </section>
      )}
      <section className="mt-6">
        <h3 className="text-lg font-medium">Versions saved</h3>
        <ul className="mt-2 space-y-2">
          {[...versions].reverse().map((v) => (
            <li key={v.id} className="rounded-lg border border-neutral-200 p-3 text-sm">
              <strong>Version {v.version}</strong> · {new Date(v.createdAt).toLocaleString()} ·{" "}
              {v.status === "done" ? (v.approved ? "Approved" : "Finished") : v.status === "working" ? "Working on it" : "Did not finish"}
              {v.feedback && <p className="mt-1 text-neutral-700">Your feedback: {v.feedback}</p>}
              {v.approvalNote && <p className="mt-1 text-neutral-700">Your note: {v.approvalNote}</p>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

type Extra = { talkToUsers?: string; direction?: string; fix?: string };

function CheckIn(props: {
  version: PhaseVersion;
  projectId: string;
  notesCount: number;
  onRefresh: () => Promise<void>;
  isLatest: boolean;
  busy: boolean;
  onGo: (note: string, extra?: Extra) => Promise<boolean>;
  onNotYet: (note: string) => Promise<unknown>;
}) {
  const { version, busy } = props;
  const [note, setNote] = useState("");
  const [hint, setHint] = useState("");
  const [talk, setTalk] = useState<"no" | "yes">("no");
  const [direction, setDirection] = useState("");
  const recommended = version.phase === 6 ? (version.output as TestingOutput).results_analysis?.recommendation ?? "" : "";
  const [fix, setFix] = useState<string>(/wireframe/i.test(recommended) ? "wireframes" : /visual|design/i.test(recommended) ? "design" : /no fixes/i.test(recommended) ? "none" : "");
  const c = version.output!.checkin;
  const changed = version.output!.what_changed;
  const directions = version.phase === 3 ? (version.output as IdeateOutput).directions : [];

  function goAhead() {
    if (version.phase === 3) {
      if (!direction) return setHint("Please pick a direction, or Mix, first.");
      if (direction === "Mix" && !note.trim()) return setHint("For a mix, please tell me which parts you want from each direction.");
    }
    if (version.phase === 6 && !fix) return setHint("Please choose what should happen next.");
    props.onGo(note, version.phase === 2 ? { talkToUsers: talk } : version.phase === 3 ? { direction } : version.phase === 6 ? { fix } : undefined).then((ok) => ok && setNote(""));
  }

  return (
    <div>
      {version.version > 1 && changed && changed.length > 0 && (
        <section className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="font-medium">What changed</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {changed.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="text-lg font-medium">What I made</h3>
        <p className="mt-2 whitespace-pre-line">{c.what_i_made}</p>
      </section>

      {c.not_sure_about.length > 0 && (
        <section className="mt-5">
          <h3 className="text-lg font-medium">What I&apos;m not sure about</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {c.not_sure_about.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </section>
      )}

      {c.another_view && (
        <section className="mt-5">
          <h3 className="text-lg font-medium">Another view</h3>
          <p className="mt-2">{c.another_view}</p>
        </section>
      )}

      {version.approved ? (
        <p className="mt-6 rounded-lg border border-green-300 bg-green-50 p-4">
          You said Go ahead.{version.chosenDirection && ` You picked direction ${version.chosenDirection}.`} This step is approved.
        </p>
      ) : version.waitingForNotes ? (
        <WaitingForNotes {...props} note={note} />
      ) : (
        <section className="mt-6">
          {version.phase === 2 && (
            <fieldset className="mb-5 rounded-lg border border-neutral-200 p-4">
              <legend className="px-1 font-medium">Talk to real users first?</legend>
              {(["no", "yes"] as const).map((v) => (
                <label key={v} className="mt-1 flex items-center gap-2">
                  <input type="radio" name="talk" checked={talk === v} onChange={() => setTalk(v)} />
                  {v === "no" ? "No, keep going" : "Yes, wait for me"}
                </label>
              ))}
              {talk === "yes" && (
                <p className="mt-2 text-sm text-neutral-600">
                  After you click Go ahead, I will wait. You can then upload your interview notes and I will redo the research with them.
                </p>
              )}
            </fieldset>
          )}

          {version.phase === 3 && (
            <fieldset className="mb-5">
              <legend className="mb-2 font-medium">Which direction do you want to follow?</legend>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {directions.map((d) => (
                  <label key={d.id} className={`block cursor-pointer rounded-lg focus-within:ring-4 focus-within:ring-blue-700 ${direction === d.id ? "ring-2 ring-black" : ""}`}>
                    <input type="radio" name="direction" className="sr-only" checked={direction === d.id} onChange={() => { setDirection(d.id); setHint(""); }} />
                    <DirectionCard d={d} />
                    <span className="block px-1 pt-1 text-sm font-medium">{direction === d.id ? "Selected" : `Pick ${d.id}`}</span>
                  </label>
                ))}
              </div>
              <label className="mt-3 flex items-center gap-2">
                <input type="radio" name="direction" checked={direction === "Mix"} onChange={() => { setDirection("Mix"); setHint(""); }} />
                Mix (take parts from more than one, and say which in the box below)
              </label>
            </fieldset>
          )}

          {version.phase === 6 && (
            <fieldset className="mb-5 rounded-lg border border-neutral-200 p-4">
              <legend className="px-1 font-medium">What should happen next?</legend>
              {([["wireframes", "Send fixes to Wireframes"], ["design", "Send fixes to Visual design"], ["none", "No fixes needed"]] as const).map(([k, l]) => (
                <label key={k} className="mt-1 flex items-center gap-2">
                  <input type="radio" name="fix" checked={fix === k} onChange={() => { setFix(k); setHint(""); }} />
                  {l}
                  {recommended && ((k === "wireframes" && /wireframe/i.test(recommended)) || (k === "design" && /visual|design/i.test(recommended) && !/wireframe/i.test(recommended)) || (k === "none" && /no fixes/i.test(recommended))) && (
                    <span className="rounded-full bg-black px-2 py-0.5 text-xs text-white">My advice</span>
                  )}
                </label>
              ))}
              {fix !== "none" && fix !== "" && (
                <p className="mt-2 text-sm text-neutral-600">I will reopen that step with the list of problems. When you say Go ahead there, you come back to Testing.</p>
              )}
            </fieldset>
          )}

          <label htmlFor="feedback" className="block font-medium">
            {version.phase === 3 ? "Your note (needed for Mix and Not yet, optional otherwise)" : "Your feedback (optional for Go ahead, needed for Not yet)"}
          </label>
          <textarea
            id="feedback"
            rows={4}
            value={note}
            onChange={(e) => { setNote(e.target.value); setHint(""); }}
            placeholder="Tell me what to keep, add or change."
            className="mt-2 w-full rounded-lg border border-neutral-500 p-3 focus:border-black focus:outline-none"
          />
          {hint && <p role="alert" className="mt-2 text-red-700">{hint}</p>}
          <div className="mt-3 flex gap-3">
            <button
              disabled={busy || !props.isLatest}
              onClick={goAhead}
              className="rounded-lg bg-black px-6 py-3 font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              Go ahead
            </button>
            <button
              disabled={busy || !props.isLatest}
              onClick={() => {
                if (!note.trim()) return setHint("Please tell me what to change in the box first.");
                props.onNotYet(note).then((ok) => ok && setNote(""));
              }}
              className="rounded-lg border border-neutral-500 px-6 py-3 font-medium hover:bg-neutral-100 disabled:opacity-50"
            >
              Not yet
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

// Shown after "Yes, wait for me" at Check-in 2
function WaitingForNotes(props: {
  projectId: string;
  notesCount: number;
  onRefresh: () => Promise<void>;
  busy: boolean;
  onGo: (note: string, extra?: Extra) => Promise<boolean>;
  note: string;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [msg, setMsg] = useState("");
  const [working, setWorking] = useState(false);

  async function upload() {
    if (files.length === 0) return setMsg("Please choose at least one file first.");
    setWorking(true);
    setMsg("");
    try {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      const res = await fetch(`/api/projects/${props.projectId}/notes`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFiles([]);
      setMsg(data.skipped.length ? `Saved. I skipped: ${data.skipped.join("; ")}` : "Saved. Your notes are ready.");
      await props.onRefresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "I couldn't save the notes. Please try again.");
    } finally {
      setWorking(false);
    }
  }

  async function redo() {
    setWorking(true);
    setMsg("");
    try {
      const res = await fetch(`/api/projects/${props.projectId}/phases/2/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: "I talked to real users. Redo the research using my interview notes. Keep what still holds up." }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await props.onRefresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <section className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4">
      <h3 className="font-medium">I am waiting for you</h3>
      <p className="mt-1 text-sm">
        Go and talk to real users (the interview questions are in the Work tab). When you are done, upload your notes here: text, Word, Excel or PDF.
      </p>
      <input
        type="file"
        multiple
        accept=".txt,.md,.docx,.xlsx,.csv,.pdf"
        onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        className="mt-3 block text-sm"
      />
      <div className="mt-3 flex flex-wrap gap-3">
        <button disabled={working} onClick={upload} className="rounded-lg border border-neutral-500 px-4 py-2 hover:bg-white disabled:opacity-50">
          Save my notes
        </button>
        <button
          disabled={working || props.notesCount === 0}
          onClick={redo}
          className="rounded-lg bg-black px-4 py-2 text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          Redo the research with my notes
        </button>
        <button disabled={working || props.busy} onClick={() => props.onGo(props.note, { talkToUsers: "no" })} className="rounded-lg px-4 py-2 underline">
          Never mind, keep going
        </button>
      </div>
      <p className="mt-2 text-sm text-neutral-700">Notes saved so far: {props.notesCount}</p>
      {msg && <p className="mt-2 text-sm">{msg}</p>}
    </section>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="p-10">Working on it...</p>}>
      <ProjectPage />
    </Suspense>
  );
}
