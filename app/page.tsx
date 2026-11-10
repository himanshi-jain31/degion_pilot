"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell, Icon } from "@/components/AppShell";
import { Kbd, Loading, Notice, primaryClass, secondaryClass, useDraft, useKey } from "@/components/ui";
import { PHASES } from "@/lib/phases";
import { useName } from "@/lib/name";
import { capFirst } from "@/lib/names";

type ProjectRow = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  fileCount: number;
  madeInDemo: boolean;
  phases: Record<string, string>;
  next: { text: string; tone: "waiting" | "working" | "done" | "idle"; phase: string; status: string; badge: string; step: string };
};
type Result = { id: string; skipped: string[]; figmaProblem?: string; files: { name: string; kind: string; note: string; characters: number }[] };

const TONE: Record<string, string> = { waiting: "pill pill-wait", working: "pill pill-info", done: "pill pill-ok", idle: "pill pill-idle" };

const LEAVE_SAMPLE =
  "Employees find it confusing to apply for leave in our HR app. They don't know how many days they have left, and managers miss approval requests. Design a simpler leave request and approval flow for employees and managers.";

// Suggestions fill the box when clicked
const SUGGESTIONS: { label: string; fill: string }[] = [
  { label: "Redesign a flow", fill: "I want to redesign an existing flow: " },
  { label: "Start from one line", fill: "My idea in one line: " },
  { label: "Improve my screens", fill: "I want to improve my current screens: " },
  { label: "Try a sample", fill: LEAVE_SAMPLE },
];

// The tiny line of six steps on each card
function MiniProgress({ phases }: { phases: Record<string, string> }) {
  return (
    <ol aria-hidden="true" className="flex gap-1">
      {PHASES.map((p) => {
        const s = phases[p.name] ?? "Not started";
        const colour = s === "Approved" ? "bg-[var(--ok)]" : s === "Working on it" ? "bg-accent" : s === "Ready for you" || s === "Changes asked" ? "bg-[var(--wait)]" : "bg-[#e3e3ea]";
        return <li key={p.n} className={`h-1.5 flex-1 rounded-full ${colour}`} />;
      })}
    </ol>
  );
}

export default function Home() {
  const [requirement, setRequirement] = useDraft("designpilot-request-draft");
  const [files, setFiles] = useState<File[]>([]);
  const [figmaOpen, setFigmaOpen] = useState(false);
  const [figmaUrl, setFigmaUrl] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [projects, setProjects] = useState<ProjectRow[] | null>(null); // null = still loading
  const [listError, setListError] = useState("");
  const [status, setStatus] = useState<{ keySet: boolean; demo: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [page, setPage] = useState(0);
  const [name, , nameLoaded] = useName();
  const fileInput = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  const loadProjects = useCallback(async () => {
    setListError("");
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error();
      setProjects(await res.json());
    } catch {
      setListError("I couldn't load your projects.");
    }
  }, []);

  useEffect(() => {
    document.title = "DesignPilot";
    loadProjects();
    fetch("/api/status").then((r) => r.json()).then(setStatus).catch(() => setStatus(null));
  }, [loadProjects]);

  // "New design" in the icon bar leads here and puts the cursor in the box
  useEffect(() => {
    const focusIfNew = () => {
      if (location.hash === "#new") {
        box.current?.focus();
        window.scrollTo({ top: 0 });
      }
    };
    focusIfNew();
    window.addEventListener("hashchange", focusIfNew);
    return () => window.removeEventListener("hashchange", focusIfNew);
  }, []);

  // The box grows with what you write
  useEffect(() => {
    const t = box.current;
    if (!t) return;
    t.style.height = "auto";
    t.style.height = `${Math.min(t.scrollHeight, 220)}px`;
  }, [requirement]);

  // Drag files anywhere on the page
  useEffect(() => {
    const over = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes("Files")) return;
      e.preventDefault();
      setDragging(true);
    };
    const leave = (e: DragEvent) => {
      if (e.relatedTarget === null) setDragging(false);
    };
    const drop = (e: DragEvent) => {
      if (!e.dataTransfer?.files.length) return;
      e.preventDefault();
      setDragging(false);
      addFiles(Array.from(e.dataTransfer.files));
    };
    window.addEventListener("dragover", over);
    window.addEventListener("dragleave", leave);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragover", over);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("drop", drop);
    };
  }, []);

  function addFiles(list: File[]) {
    setFiles((old) => [...old, ...list.filter((f) => !old.some((o) => o.name === f.name && o.size === f.size))]);
  }

  const canSend = (requirement.trim().length > 0 || files.length > 0) && !busy;

  async function send() {
    if (!canSend) return;
    setError("");
    setResult(null);
    setBusy(true);
    try {
      const form = new FormData();
      form.append("requirement", requirement);
      files.forEach((f) => form.append("files", f));
      const res = await fetch("/api/projects", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");

      // A Figma link is read right after the project is made (read only)
      let figmaProblem = "";
      if (figmaUrl.trim()) {
        try {
          const f = await fetch(`/api/projects/${data.id}/figma`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: figmaUrl }) });
          const fd = await f.json();
          if (!f.ok) figmaProblem = fd.error || "I could not read that Figma link.";
        } catch {
          figmaProblem = "I could not reach Figma. You can add the link later under Add a Figma file.";
        }
      }

      const unreadable = data.files.some((f: { kind: string; characters: number }) => f.kind !== "Image" && f.characters === 0);
      setRequirement("");
      setFiles([]);
      setFigmaUrl("");
      setFigmaOpen(false);
      if (data.skipped.length > 0 || unreadable || figmaProblem) {
        // let the designer read what could not be used before moving on
        setResult({ ...data, figmaProblem });
        await loadProjects();
        return;
      }
      router.push(`/project/${data.id}/questions`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  useKey((e) => {
    if (e.key === "Escape") {
      setDragging(false);
      setMenuOpen(false);
    }
  });

  function fillWith(text: string) {
    setRequirement(text);
    setTimeout(() => {
      const t = box.current;
      if (!t) return;
      t.focus();
      t.setSelectionRange(text.length, text.length);
    }, 0);
  }

  const needYou = (projects ?? []).filter((p) => p.next.status === "Ready for you" && p.next.badge === "Ready for you");
  const pageSize = 3;
  const recent = (projects ?? []).slice(0, 9);
  const pages = Math.max(1, Math.ceil(recent.length / pageSize));
  const shownCards = recent.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <AppShell>
      <main id="main" tabIndex={-1} className="fade-in mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 pb-28 pt-16 sm:pt-20">
        {dragging && (
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-ink/60 text-xl font-medium text-white backdrop-blur-sm">
            Drop your files here to add them
          </div>
        )}

        {/* 1. Greeting */}
        <header className="text-center">
          <h1 className="text-[40px] font-medium leading-tight tracking-tight">
            Hello,{" "}
            <span className="text-accent" suppressHydrationWarning>
              {nameLoaded && name.trim() ? name.trim() : "there"}
            </span>
          </h1>
          <p className="text-soft mt-2 text-xl">What would you like to design today?</p>

          {/* 2. Status line: only when something is ready for you. It scrolls to the cards. */}
          {needYou.length > 0 && (
            <p className="mt-4">
              <a
                href="#projects"
                onClick={(e) => {
                  e.preventDefault();
                  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                  document.getElementById("projects")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
                }}
                className="pill pill-wait underline-offset-4 hover:underline"
              >
                {needYou.length === 1 ? "1 project needs you" : `${needYou.length} projects need you`}
              </a>
            </p>
          )}
        </header>

        {status && !status.demo && !status.keySet && (
          <div role="alert" className="shell-card mt-8 p-5" style={{ background: "var(--wait-soft)", borderColor: "#f3dcae" }}>
            <p className="font-medium" style={{ color: "var(--wait-ink)" }}>One thing first: I need your key.</p>
            <p className="mt-1 text-[15px]" style={{ color: "var(--wait-ink)" }}>
              Open the file <code>.env.local</code> in this project folder and paste your key right after <code>ANTHROPIC_API_KEY=</code> (no spaces, no quotes). Save the file. You do not need to restart anything.
            </p>
          </div>
        )}

        {/* 3. The text box */}
        <div className="shell-card card-focus mt-10 p-4">
          {(files.length > 0 || figmaOpen) && (
            <div className="mb-3 space-y-3">
              {files.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {files.map((f) => (
                    <li key={f.name + f.size} className="flex items-center gap-2 rounded-full border border-line bg-canvas py-1 pl-3 pr-1 text-sm">
                      <span>{f.name}</span>
                      <button type="button" onClick={() => setFiles((old) => old.filter((o) => o !== f))} aria-label={`Remove ${f.name}`} className="flex h-8 w-8 items-center justify-center rounded-full text-soft hover:bg-line hover:text-ink">
                        <span aria-hidden="true">×</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {figmaOpen && (
                <div className="flex items-center gap-2">
                  <label htmlFor="figma-link" className="sr-only">Figma link</label>
                  <input
                    id="figma-link"
                    value={figmaUrl}
                    onChange={(e) => setFigmaUrl(e.target.value)}
                    placeholder="Paste a Figma link (I only read it, I never change it)"
                    className="input !py-2 !text-[15px]"
                    autoFocus
                  />
                  <button type="button" onClick={() => { setFigmaOpen(false); setFigmaUrl(""); }} className="btn btn-quiet !px-3">
                    Remove
                  </button>
                </div>
              )}
            </div>
          )}
          <label htmlFor="requirement" className="sr-only">
            Describe what you need to design
          </label>
          <textarea
            id="requirement"
            ref={box}
            autoFocus
            value={requirement}
            rows={2}
            onChange={(e) => setRequirement(e.target.value)}
            onKeyDown={(e) => {
              // Enter sends. Shift+Enter makes a new line.
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Describe what you need to design..."
            className="bare block w-full resize-none border-0 bg-transparent px-2 py-1 text-lg leading-relaxed text-ink placeholder:text-soft"
            style={{ minHeight: 64 }}
          />
          <div className="mt-2 flex items-center justify-between">
            <div className="relative">
              <input
                ref={fileInput}
                type="file"
                multiple
                aria-label="Choose documents"
                accept=".pdf,.docx,.xlsx,.csv,.txt,.md,.png,.jpg,.jpeg,.gif,.webp"
                className="hidden"
                onChange={(e) => {
                  addFiles(Array.from(e.target.files ?? []));
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Add documents or a Figma link"
                title="Add documents or a Figma link"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e3e3ee] bg-white text-[#55555b] transition-colors duration-150 hover:bg-[#f4f4fa] hover:text-ink"
              >
                <Icon name="plus" />
              </button>
              {/* The menu opens below the box */}
              {menuOpen && (
                <div role="menu" className="shell-card fade-in absolute left-0 top-full z-20 mt-2 w-64 p-2">
                  <button role="menuitem" type="button" onClick={() => { setMenuOpen(false); fileInput.current?.click(); }} className="block w-full rounded-lg px-3 py-2 text-left hover:bg-[#f4f4fa]">
                    Attach documents
                    <span className="text-soft block text-sm">PDF, Word, Excel, CSV, text, pictures</span>
                  </button>
                  <button role="menuitem" type="button" onClick={() => { setMenuOpen(false); setFigmaOpen(true); }} className="block w-full rounded-lg px-3 py-2 text-left hover:bg-[#f4f4fa]">
                    Add a Figma link
                    <span className="text-soft block text-sm">Read only. Nothing in Figma changes.</span>
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-soft hidden text-sm sm:inline">
                <Kbd>Enter</Kbd> to send, <Kbd>Shift Enter</Kbd> for a new line
              </span>
              <button
                type="button"
                onClick={() => void send()}
                disabled={!canSend}
                aria-label={busy ? "Working on it" : "Send"}
                title="Send"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white transition-colors duration-150 hover:bg-[var(--accent-hover)] disabled:opacity-40"
              >
                {busy ? <span className="text-xs">...</span> : (
                  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
        <p className="text-soft mt-2 text-center text-sm sm:hidden">Your words are kept as you type.</p>

        {/* 4. Suggestions, one row below the box */}
        <div className="mt-4 flex flex-wrap justify-center gap-2 lg:flex-nowrap" role="group" aria-label="Ideas to start from">
          {SUGGESTIONS.map((s) => (
            <button key={s.label} type="button" onClick={() => fillWith(s.fill)} className="chip whitespace-nowrap">
              {s.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4">
            <Notice tone="error">{error}</Notice>
          </div>
        )}

        {result && (
          <div className="shell-card mt-6 p-5" style={{ background: "var(--wait-soft)", borderColor: "#f3dcae" }}>
            <p className="font-medium" style={{ color: "var(--wait-ink)" }}>Your project is saved. Please read this before you go on.</p>
            <ul className="mt-2 space-y-1 text-[15px]" style={{ color: "var(--wait-ink)" }}>
              {result.files.map((f) => (
                <li key={f.name}>
                  <strong>{f.name}</strong> ({f.kind}): {f.note}
                  {f.characters > 0 && ` ${f.characters.toLocaleString()} characters read.`}
                  {f.kind !== "Image" && f.characters === 0 && " I could not use anything from this file, so I will work without it."}
                </li>
              ))}
              {result.skipped.map((s) => (
                <li key={s}>Skipped: {s}</li>
              ))}
              {result.figmaProblem && <li>Figma link: {result.figmaProblem} You can add it later under Add a Figma file.</li>}
            </ul>
            <Link href={`/project/${result.id}/questions`} className={`${primaryClass} mt-4`}>
              Continue to the quick questions
            </Link>
          </div>
        )}

        {/* 5. Your projects */}
        <section id="projects" className="mt-14 scroll-mt-8" aria-labelledby="your-projects">
          <h2 id="your-projects" className="section-title">
            Your projects
          </h2>
          <div className="mt-4">
            {listError ? (
              <Notice tone="error" action={<button onClick={loadProjects} className={secondaryClass}>Try again</button>}>
                {listError}
              </Notice>
            ) : projects === null ? (
              <Loading onReload={loadProjects}>Loading your projects...</Loading>
            ) : recent.length === 0 ? (
              <div className="shell-card mx-auto max-w-md p-6 text-center">
                <p className="text-lg font-medium">Your first design will show up here</p>
                <p className="text-soft mt-1 text-[15px]">Tell me what you need above. I do the design steps with you and stop for your Go ahead after each one.</p>
              </div>
            ) : (
              <>
                <ul key={page} className="fade-in grid gap-4 sm:grid-cols-3">
                  {shownCards.map((p) => {
                    const n = PHASES.find((ph) => ph.name === p.next.phase)?.n ?? 1;
                    return (
                      <li key={p.id}>
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
                      </li>
                    );
                  })}
                </ul>
                {/* Dots only when there are more than 3 projects */}
                {projects.length > 3 && pages > 1 && (
                  <div className="mt-4 flex justify-center gap-2" role="group" aria-label="More projects">
                    {Array.from({ length: pages }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i)}
                        aria-label={`Show projects ${i * pageSize + 1} to ${Math.min(recent.length, (i + 1) * pageSize)}`}
                        aria-current={i === page ? "true" : undefined}
                        className="flex !min-h-6 h-6 w-6 items-center justify-center rounded-full"
                      >
                        <span className={`block h-2 w-2 rounded-full transition-colors duration-150 ${i === page ? "bg-accent" : "bg-[#cfd0dc]"}`} />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <p className="text-soft mt-auto pt-16 text-center text-xs">
          DesignPilot can make mistakes. Check important details before sharing.
        </p>
      </main>
    </AppShell>
  );
}
