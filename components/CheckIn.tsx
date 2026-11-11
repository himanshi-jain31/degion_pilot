"use client";

import { useEffect, useRef, useState } from "react";
import type { IdeateOutput, PhaseVersion, TestingOutput } from "@/lib/storage";
import { DirectionCard } from "@/components/IdeateView";
import { FramePreview } from "@/components/WireframeView";
import { ActionBar, Kbd, isTypingTarget, primaryClass, quietClass, secondaryClass, useDraft, useKey } from "@/components/ui";

export type Extra = { talkToUsers?: string; direction?: string; fix?: string };

const outlineClass = secondaryClass;

// The check-in: the summary first, in big text. Details are one click away.
// Go ahead is the main button (and the Enter key). Not yet opens the feedback box with the cursor in it.
export function CheckIn(props: {
  version: PhaseVersion;
  projectId: string;
  notesCount: number;
  onRefresh: () => Promise<void>;
  onOpenWork: () => void;
  isLatest: boolean;
  busy: boolean;
  onGo: (note: string, extra?: Extra) => Promise<boolean>;
  onNotYet: (note: string) => Promise<unknown>;
}) {
  const { version, busy } = props;
  const [note, setNote] = useDraft(`designpilot-note-${props.projectId}-${version.id}`);
  const [mode, setMode] = useState<"none" | "note" | "notYet">("none");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [hint, setHint] = useState("");
  const [talk, setTalk] = useState<"no" | "yes">("no");
  const [direction, setDirection] = useState("");
  const recommended = version.phase === 6 ? (version.output as TestingOutput).results_analysis?.recommendation ?? "" : "";
  const [fix, setFix] = useState<string>(/wireframe/i.test(recommended) ? "wireframes" : /visual|design/i.test(recommended) ? "design" : /no fixes/i.test(recommended) ? "none" : "");
  const noteBox = useRef<HTMLTextAreaElement>(null);

  const c = version.output!.checkin;
  const changed = version.output!.what_changed;
  const directions = version.phase === 3 ? (version.output as IdeateOutput).directions : [];
  const canAct = !busy && props.isLatest && !version.approved && !version.waitingForNotes;

  useEffect(() => {
    if (mode !== "none") noteBox.current?.focus(); // the cursor is already in the box
  }, [mode]);

  async function goAhead() {
    if (!canAct) return;
    if (version.phase === 3) {
      if (!direction) return setHint("Pick a direction first (tap one of the cards), or choose Mix.");
      if (direction === "Mix" && !note.trim()) {
        setMode("note");
        return setHint("For a mix, tell me which parts you want from each direction.");
      }
    }
    if (version.phase === 6 && !fix) return setHint("Choose what should happen next first.");
    const ok = await props.onGo(note, version.phase === 2 ? { talkToUsers: talk } : version.phase === 3 ? { direction } : version.phase === 6 ? { fix } : undefined);
    if (ok) {
      setNote("");
      setMode("none");
    }
  }

  async function sendFeedback() {
    if (!canAct) return;
    if (!note.trim()) return setHint("Tell me what to change first.");
    const ok = await props.onNotYet(note);
    if (ok) {
      setNote("");
      setMode("none");
    }
  }

  useKey((e) => {
    if (version.approved || version.waitingForNotes) return;
    if (e.key === "Escape") {
      if (mode !== "none") setMode("none");
      else if (detailsOpen) setDetailsOpen(false);
      setHint("");
      return;
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (mode === "notYet") void sendFeedback();
      else void goAhead();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey && mode === "none" && !isTypingTarget(e)) {
      e.preventDefault();
      void goAhead();
    }
  });

  if (version.approved) {
    return (
      <p className="card flex items-center gap-3" style={{ background: "var(--ok-soft)", borderColor: "#c9ecd6", color: "var(--ok-ink)" }}>
        <span aria-hidden="true">✓</span>
        <span>You said Go ahead.{version.chosenDirection && ` You picked direction ${version.chosenDirection}.`} This step is approved.</span>
      </p>
    );
  }
  if (version.waitingForNotes) return <WaitingForNotes projectId={props.projectId} notesCount={props.notesCount} onRefresh={props.onRefresh} busy={busy} onGo={props.onGo} note={note} />;

  const previewUrl =
    version.phase === 4 ? `/api/projects/${props.projectId}/wireframe?version=${version.id}` : version.phase === 5 ? `/api/projects/${props.projectId}/prototype?version=${version.id}` : "";

  return (
    <div className="fade-in space-y-6">
      {version.version > 1 && changed && changed.length > 0 && (
        <section className="card" style={{ background: "var(--accent-soft)", borderColor: "#dfe2ff" }}>
          <h3 className="font-medium" style={{ color: "var(--accent-ink)" }}>What changed</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5" style={{ color: "var(--accent-ink)" }}>
            {changed.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="card" aria-labelledby="made">
        <h2 id="made" className="label-small">What I made</h2>
        <p className="mt-3 whitespace-pre-line text-xl leading-relaxed">{c.what_i_made}</p>

        {previewUrl && (
          <div className="mt-6">
            <FramePreview url={previewUrl} downloadUrl={version.phase === 5 ? `${previewUrl}&download=1` : undefined} title={version.phase === 5 ? "Prototype preview" : "Wireframe preview"} />
          </div>
        )}

        {c.not_sure_about.length > 0 && (
          <div className="mt-6 border-t border-line pt-6">
            <h2 id="unsure" className="label-small">What I&apos;m not sure about</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-base">
              {c.not_sure_about.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* The one choice that goes with Go ahead for steps 2, 3 and 6 */}
      {version.phase === 2 && (
        <fieldset className="card">
          <legend className="section-title float-left mb-3 w-full">Talk to real users first?</legend>
          <div className="clear-both space-y-2">
            {(["no", "yes"] as const).map((v) => (
              <label key={v} className="flex items-center gap-3">
                <input type="radio" name="talk" checked={talk === v} onChange={() => setTalk(v)} />
                {v === "no" ? "No, keep going" : "Yes, wait for me"}
              </label>
            ))}
          </div>
          {talk === "yes" && <p className="note mt-3">After Go ahead, I will wait. You can then add your interview notes and I will redo the research with them.</p>}
        </fieldset>
      )}

      {version.phase === 3 && (
        <fieldset>
          <legend className="section-title mb-4">Which direction do you want to follow?</legend>
          <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
            {directions.map((d) => (
              <label key={d.id} className="flex cursor-pointer rounded-2xl focus-within:outline focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-[var(--accent)]">
                <input type="radio" name="direction" className="sr-only" checked={direction === d.id} onChange={() => { setDirection(d.id); setHint(""); }} />
                <DirectionCard d={d} recommended={d.id === (version.output as IdeateOutput).recommendation.direction} selected={direction === d.id} pick />
              </label>
            ))}
          </div>
          <label className="mt-4 flex items-center gap-3">
            <input type="radio" name="direction" checked={direction === "Mix"} onChange={() => { setDirection("Mix"); setHint(""); }} />
            Mix (take parts from more than one)
          </label>
        </fieldset>
      )}

      {version.phase === 6 && (
        <fieldset className="card">
          <legend className="section-title float-left mb-3 w-full">What should happen next?</legend>
          <div className="clear-both space-y-2">
            {([["wireframes", "Send fixes to Wireframes"], ["design", "Send fixes to Visual design"], ["none", "No fixes needed"]] as const).map(([k, l]) => (
              <label key={k} className="flex items-center gap-3">
                <input type="radio" name="fix" checked={fix === k} onChange={() => { setFix(k); setHint(""); }} />
                {l}
                {recommended && ((k === "wireframes" && /wireframe/i.test(recommended)) || (k === "design" && /visual|design/i.test(recommended) && !/wireframe/i.test(recommended)) || (k === "none" && /no fixes/i.test(recommended))) && (
                  <span className="pill pill-info !text-[13px]">My advice</span>
                )}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {/* Details, one click away */}
      <div>
        <button onClick={() => setDetailsOpen((o) => !o)} aria-expanded={detailsOpen} className="btn btn-quiet !px-0">
          {detailsOpen ? "Hide the details" : "See the details"}
        </button>
        {detailsOpen && (
          <div className="card fade-in mt-2">
            {c.another_view && (
              <>
                <h3 className="label-small">Another view</h3>
                <p className="mt-2">{c.another_view}</p>
              </>
            )}
            <button onClick={props.onOpenWork} className={`${secondaryClass} mt-4`}>
              Open everything I made
            </button>
          </div>
        )}
      </div>

      {/* The feedback box appears when you need it, with the cursor in it */}
      {mode !== "none" && (
        <section className="card fade-in">
          <label htmlFor="feedback" className="section-title block">
            {mode === "notYet" ? "What should I change?" : "Your note"}
          </label>
          <textarea
            id="feedback"
            ref={noteBox}
            rows={4}
            value={note}
            onChange={(e) => { setNote(e.target.value); setHint(""); }}
            placeholder="Tell me what to keep, add or change."
            className="input mt-3"
          />
          <p className="note mt-2">Your words are kept as you type.</p>
        </section>
      )}
      {hint && <p role="alert" className="font-medium text-[var(--bad-ink)]">{hint}</p>}

      <ActionBar>
        {mode === "none" ? (
          <>
            <button onClick={() => setMode("note")} disabled={!canAct} className={quietClass}>
              Add a note
            </button>
            <button onClick={() => { setMode("notYet"); setHint(""); }} disabled={!canAct} className={outlineClass}>
              Not yet
            </button>
            <button onClick={goAhead} disabled={!canAct} className={primaryClass}>
              Go ahead <Kbd>Enter</Kbd>
            </button>
          </>
        ) : (
          <>
            <button onClick={() => { setMode("none"); setHint(""); }} className={quietClass}>
              Cancel <Kbd>Esc</Kbd>
            </button>
            {mode === "notYet" ? (
              <button onClick={sendFeedback} disabled={!canAct || !note.trim()} className={primaryClass}>
                Send feedback <Kbd>⌘ Enter</Kbd>
              </button>
            ) : (
              <button onClick={goAhead} disabled={!canAct} className={primaryClass}>
                Go ahead with my note <Kbd>⌘ Enter</Kbd>
              </button>
            )}
          </>
        )}
      </ActionBar>
    </div>
  );
}

// Shown after "Yes, wait for me" at Check-in 2. Notes are saved the moment you choose them.
function WaitingForNotes(props: {
  projectId: string;
  notesCount: number;
  onRefresh: () => Promise<void>;
  busy: boolean;
  onGo: (note: string, extra?: Extra) => Promise<boolean>;
  note: string;
}) {
  const [msg, setMsg] = useState("");
  const [working, setWorking] = useState(false);

  async function upload(files: File[]) {
    if (files.length === 0) return;
    setWorking(true);
    setMsg("");
    try {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      const res = await fetch(`/api/projects/${props.projectId}/notes`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
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
    <section className="rounded-lg border border-amber-300 bg-amber-50 p-5 pb-6">
      <h2 className="text-xl font-semibold">I am waiting for you</h2>
      <p className="mt-2 text-lg">
        Go and talk to real users. The interview questions are under Work. When you are done, add your notes here: text, Word, Excel or PDF. They are saved as soon as you choose them.
      </p>
      <label className="mt-4 block">
        <span className="block font-medium">Choose your notes</span>
        <input type="file" multiple accept=".txt,.md,.docx,.xlsx,.csv,.pdf" onChange={(e) => { void upload(Array.from(e.target.files ?? [])); e.target.value = ""; }} className="mt-1 block text-sm" />
      </label>
      <p className="mt-3 text-neutral-800">Notes saved so far: {props.notesCount}</p>
      {msg && <p role="status" className="mt-2">{msg}</p>}
      <ActionBar>
        <button disabled={working || props.busy} onClick={() => props.onGo(props.note, { talkToUsers: "no" })} className={quietClass}>
          Never mind, keep going
        </button>
        <button disabled={working || props.notesCount === 0} onClick={redo} className={primaryClass}>
          Redo the research with my notes
        </button>
      </ActionBar>
    </section>
  );
}
