"use client";

import { useState } from "react";
import type { Severity, TestingOutput } from "@/lib/storage";
import { List, Section } from "@/components/UnderstandView";

const SEV_COLOUR: Record<Severity, string> = {
  High: "bg-red-100 text-red-800",
  Medium: "bg-amber-100 text-amber-800",
  Low: "bg-neutral-200 text-neutral-700",
};

const SEV_BORDER: Record<Severity, string> = { High: "border-l-[var(--bad)]", Medium: "border-l-[var(--wait)]", Low: "border-l-[#9aa3b2]" };

// Screens named in a sentence (only when the screen's name really appears in it)
function screensIn(text: string, screens: string[]) {
  const t = text.toLowerCase();
  return screens.filter((n) => n.trim().length >= 3 && t.includes(n.trim().toLowerCase()));
}

function ScreenChips({ text, screens }: { text: string; screens: string[] }) {
  const hit = screensIn(text, screens);
  if (hit.length === 0) return null;
  return (
    <span className="ml-2 inline-flex flex-wrap gap-1 align-middle">
      {hit.map((h) => <span key={h} className="pill pill-info !text-[12px]">Screen: {h}</span>)}
    </span>
  );
}

function SeverityBar({ items }: { items: { severity: Severity }[] }) {
  if (items.length === 0) return null;
  const levels: Severity[] = ["High", "Medium", "Low"];
  const fill: Record<Severity, string> = { High: "bg-[var(--bad)]", Medium: "bg-[var(--wait)]", Low: "bg-[#9aa3b2]" };
  return (
    <div className="mb-4">
      <div className="flex h-3 overflow-hidden rounded-full bg-line" role="img" aria-label={levels.map((l) => `${items.filter((i) => i.severity === l).length} ${l}`).join(", ")}>
        {levels.map((l) => { const n = items.filter((i) => i.severity === l).length; return n ? <div key={l} className={fill[l]} style={{ width: `${(n / items.length) * 100}%` }} /> : null; })}
      </div>
      <p className="mt-2 text-[14px]">{levels.map((l) => `${items.filter((i) => i.severity === l).length} ${l}`).join(" · ")}</p>
    </div>
  );
}

function Sev({ s }: { s: Severity }) {
  return <span className={`mr-2 rounded-full px-2 py-0.5 text-xs font-medium ${SEV_COLOUR[s]}`}>{s}</span>;
}

// The upload box for test notes. Notes are saved the moment you choose them. "Analyse my notes" is the main button at the bottom.
function NotesUpload(props: { projectId: string; notesCount: number; round: number; onRefresh: () => Promise<void> }) {
  const [msg, setMsg] = useState("");
  const [working, setWorking] = useState(false);

  async function save(files: File[]) {
    if (files.length === 0) return;
    setWorking(true);
    setMsg("");
    try {
      const form = new FormData();
      form.append("kind", "test");
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

  return (
    <section className="mt-6 rounded-lg border border-line bg-amber-50 p-4">
      <h3 className="font-medium">Round {props.round}: add your test notes</h3>
      <p className="mt-1 text-sm">
        Run your sessions with the test kit. Then add what you wrote down: text, Word, Excel or PDF. They are saved as soon as you choose them. I only use what is in your notes. I will not invent numbers or quotes.
      </p>
      <label className="mt-3 block">
        <span className="sr-only">Choose your test notes</span>
        <input type="file" multiple disabled={working} accept=".txt,.md,.docx,.xlsx,.csv,.pdf" onChange={(e) => { void save(Array.from(e.target.files ?? [])); e.target.value = ""; }} className="block text-sm" />
      </label>
      <p className="mt-2 text-sm text-neutral-800">Notes saved for this round: {props.notesCount}</p>
      {msg && <p role="status" className="mt-2 text-sm">{msg}</p>}
    </section>
  );
}

// The Work tab for Phase 6
export function TestingWork(props: {
  out: TestingOutput;
  projectId: string;
  notesCount: number;
  round: number;
  onRefresh: () => Promise<void>;
  screens?: string[];
}) {
  const { out } = props;
  const screens = props.screens ?? [];
  const r = out.results_analysis;
  const updates = out.guess_updates ?? [];
  return (
    <div>
      {r && (
        <>
          <Section title="What the test notes say" icon="message" tone="sky">
            <ul className="space-y-2">
              {r.task_results.map((t, i) => (
                <li key={i} className="rounded-lg border border-line p-3">
                  <p className="font-medium">{t.task}</p>
                  <p className="text-sm"><strong>Succeeded:</strong> {t.succeeded}</p>
                  <p className="text-sm"><strong>Got stuck at:</strong> {t.stuck_at}</p>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Problems found, most important first" icon="alert" tone="rose">
            {r.issues.length === 0 ? (
              <p>No problems were found in the notes.</p>
            ) : (
              <>
              <SeverityBar items={r.issues} />
              <ol className="space-y-3">
                {r.issues.map((i, n) => (
                  <li key={n} className={`rounded-lg border border-l-4 border-line p-3 ${SEV_BORDER[i.severity]}`}>
                    <p>
                      <span className="mr-2 font-semibold">{n + 1}.</span>
                      <Sev s={i.severity} />
                      {i.issue}
                      <ScreenChips text={`${i.issue} ${i.fix}`} screens={screens} />
                    </p>
                    <p className="mt-1 text-sm"><strong>How many people:</strong> {i.how_many}</p>
                    <p className="text-sm"><strong>Suggested fix:</strong> {i.fix}</p>
                  </li>
                ))}
              </ol>
              </>
            )}
            {r.recommendation && <p className="mt-3 text-sm"><strong>My advice:</strong> {r.recommendation}</p>}
          </Section>

          {updates.length > 0 && (
            <Section title="Things I guessed: what the notes show" icon="help" tone="amber">
              <ul className="space-y-2 text-sm">
                {updates.map((u) => (
                  <li key={u.id}>
                    <span className={`mr-2 rounded-full px-2 py-0.5 text-xs font-medium ${u.status === "Confirmed" ? "bg-green-100 text-green-800" : u.status === "Wrong" ? "bg-red-100 text-red-800" : "bg-neutral-200 text-neutral-700"}`}>{u.status}</span>
                    {u.guess}
                    {u.evidence && <span className="block text-neutral-600">From your notes: {u.evidence}</span>}
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </>
      )}

      <Section title="Test kit" icon="clipboard" tone="green">
        <p className="text-sm text-neutral-600">Everything you need to run the sessions, on one page you can print.</p>
        <a href={`/api/projects/${props.projectId}/testkit`} className="button-link mt-2 inline-block rounded-lg bg-black px-5 py-2 text-white hover:bg-neutral-800">
          Download test kit
        </a>
      </Section>

      {!r && <NotesUpload projectId={props.projectId} notesCount={props.notesCount} round={props.round} onRefresh={props.onRefresh} />}

      <Section title="Test plan" icon="target" tone="indigo">
        <List items={out.test_plan.goals} />
        <ul className="mt-3 space-y-2">
          {out.test_plan.tasks.map((t, i) => (
            <li key={i} className="rounded-lg border border-line p-3">
              <p className="font-medium">Task {i + 1}: {t.task}</p>
              <p className="text-sm"><strong>Success looks like:</strong> {t.success}</p>
              {t.tests.length > 0 && <p className="text-xs text-neutral-600">Tests: {t.tests.join(", ")}</p>}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Script" icon="list-checks" tone="sky">
        <ol className="list-decimal space-y-1 pl-5">
          {out.script.map((t, i) => <li key={i}>{t}</li>)}
        </ol>
        <p className="mt-2 text-sm text-neutral-600">The 10 standard usability questions are added at the end of the downloaded kit.</p>
      </Section>

      <Section title="Expert check" icon="eye" tone="amber">
        <p className="text-sm text-neutral-600">This is my own review of the prototype. It is not a test with real people.</p>
        <div className="mt-3"><SeverityBar items={out.expert_check} /></div>
        <ul className="space-y-2">
          {out.expert_check.map((e, i) => (
            <li key={i}>
              <Sev s={e.severity} />
              {e.issue} <span className="text-sm text-neutral-600">({e.where})</span>
              <ScreenChips text={`${e.where} ${e.issue}`} screens={screens} />
            </li>
          ))}
        </ul>
        {out.cannot_check_automatically.length > 0 && (
          <>
            <p className="mt-3 text-sm font-medium">What automatic checks cannot catch</p>
            <List items={out.cannot_check_automatically} />
          </>
        )}
        {out.not_tested.length > 0 && (
          <>
            <p className="mt-3 text-sm font-medium">What this plan does not test</p>
            <List items={out.not_tested} />
          </>
        )}
      </Section>
    </div>
  );
}
