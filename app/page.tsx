"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ActionBar, Kbd, Loading, Notice, primaryClass, quietClass, secondaryClass, useDraft, useKey } from "@/components/ui";

type ProjectRow = {
  id: string;
  title: string;
  createdAt: string;
  fileCount: number;
  madeInDemo: boolean;
  next: { text: string; tone: "waiting" | "working" | "done" | "idle" };
};
type Result = { id: string; skipped: string[]; files: { name: string; kind: string; note: string; characters: number }[] };

// The word and dot for where a project is up to
const TONE: Record<string, string> = {
  waiting: "pill pill-wait",
  working: "pill pill-info",
  done: "pill pill-ok",
  idle: "pill pill-idle",
};

// A friendly little picture for the empty list (decorative)
function EmptyPicture() {
  return (
    <svg aria-hidden="true" width="72" height="72" viewBox="0 0 72 72" fill="none" className="mx-auto">
      <rect x="14" y="10" width="40" height="52" rx="8" fill="#fff" stroke="#e3e3dc" strokeWidth="2" />
      <rect x="22" y="22" width="24" height="3" rx="1.5" fill="#d9d9d2" />
      <rect x="22" y="31" width="18" height="3" rx="1.5" fill="#e6e6df" />
      <rect x="22" y="40" width="21" height="3" rx="1.5" fill="#e6e6df" />
      <circle cx="54" cy="52" r="11" fill="#eef0ff" />
      <path d="M54 46v12M48 52h12" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export default function Home() {
  const [requirement, setRequirement] = useDraft("designpilot-request-draft");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [projects, setProjects] = useState<ProjectRow[] | null>(null); // null = still loading
  const [listError, setListError] = useState("");
  const [status, setStatus] = useState<{ keySet: boolean; demo: boolean } | null>(null);
  const [confirmId, setConfirmId] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [dragging, setDragging] = useState(false);
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

  const canStart = (requirement.trim().length > 0 || files.length > 0) && !busy;

  async function start() {
    if (!canStart) return;
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
      const unreadable = data.files.some((f: { kind: string; characters: number }) => f.kind !== "Image" && f.characters === 0);
      setRequirement("");
      setFiles([]);
      if (data.skipped.length > 0 || unreadable) {
        // let the designer read what could not be used before moving on
        setResult(data);
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

  async function removeProject(id: string) {
    setDeleteError("");
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setConfirmId("");
      await loadProjects();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "I couldn't delete that. Please try again.");
    }
  }

  useKey((e) => {
    if (e.key === "Escape") {
      setConfirmId("");
      setDragging(false);
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      start();
    }
  });

  return (
    <main id="main" tabIndex={-1} className="fade-in mx-auto w-full max-w-2xl px-6 pb-40 pt-8">
      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-ink/60 text-xl font-medium text-white backdrop-blur-sm">
          Drop your files here to add them
        </div>
      )}

      {status && !status.demo && !status.keySet && (
        <div role="alert" className="card mb-8 !p-6" style={{ background: "var(--wait-soft)", borderColor: "#f3dcae" }}>
          <p className="font-medium" style={{ color: "var(--wait-ink)" }}>One thing first: I need your key.</p>
          <p className="mt-1 text-[15px]" style={{ color: "var(--wait-ink)" }}>
            Open the file <code>.env.local</code> in this project folder and paste your key right after <code>ANTHROPIC_API_KEY=</code> (no spaces, no quotes). Save the file. You do not need to restart anything.
          </p>
        </div>
      )}

      <label htmlFor="requirement" className="page-title block">
        Tell me what you need to design
      </label>

      <div className="card mt-6 transition-shadow focus-within:shadow-[0_0_0_3px_rgba(79,70,229,0.25)]">
        <textarea
          id="requirement"
          ref={box}
          autoFocus
          value={requirement}
          onChange={(e) => setRequirement(e.target.value)}
          rows={7}
          placeholder="For example: A simple app where staff can ask for leave and managers can say yes or no."
          className="block w-full resize-none border-0 bg-transparent p-0 text-lg leading-relaxed text-ink placeholder:text-muted focus:outline-none"
          style={{ minHeight: 168 }}
        />

        <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-line pt-4">
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
          <button type="button" onClick={() => fileInput.current?.click()} className={secondaryClass}>
            Upload documents
          </button>
          <span className="note">or drag them anywhere on this page. PDF, Word, Excel, CSV, text or pictures.</span>
        </div>

        {files.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {files.map((f) => (
              <li key={f.name + f.size} className="flex items-center gap-2 rounded-full border border-line bg-canvas py-1 pl-3 pr-1 text-sm">
                <span>{f.name}</span>
                <button type="button" onClick={() => setFiles((old) => old.filter((o) => o !== f))} aria-label={`Remove ${f.name}`} className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-line hover:text-ink">
                  <span aria-hidden="true">×</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <div className="mt-6">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      {result && (
        <div className="card mt-6" style={{ background: "var(--wait-soft)", borderColor: "#f3dcae" }}>
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
          </ul>
          <Link href={`/project/${result.id}/questions`} className={`${primaryClass} mt-4`}>
            Continue to the quick questions
          </Link>
        </div>
      )}

      <section className="mt-12" aria-labelledby="my-projects">
        <h2 id="my-projects" className="section-title">
          My projects
        </h2>
        {listError ? (
          <div className="mt-4">
            <Notice tone="error" action={<button onClick={loadProjects} className={secondaryClass}>Try again</button>}>
              {listError}
            </Notice>
          </div>
        ) : projects === null ? (
          <div className="mt-4">
            <Loading onReload={loadProjects}>Loading your projects...</Loading>
          </div>
        ) : projects.length === 0 ? (
          <div className="card mt-4 text-center">
            <EmptyPicture />
            <p className="section-title mt-4">Nothing here yet</p>
            <p className="note mt-1">Your first project will live here. Tell me what you need above, and I will do the design steps with you.</p>
            <button onClick={() => box.current?.focus()} className={`${secondaryClass} mt-4`}>
              Type your first request
            </button>
          </div>
        ) : (
          <>
            {deleteError && <p role="alert" className="mt-2 text-[var(--bad-ink)]">{deleteError}</p>}
            <ul className="mt-4 space-y-4">
              {projects.map((p) => (
                <li key={p.id} className="card !p-6 transition-shadow hover:shadow-[0_2px_4px_rgba(28,28,30,0.05),0_8px_24px_rgba(28,28,30,0.07)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <Link href={`/project/${p.id}`} className="text-base font-medium underline-offset-4 hover:underline">
                      {p.title}
                    </Link>
                    <span className={TONE[p.next.tone]}>{p.next.text}</span>
                  </div>
                  <p className="note mt-1">
                    {new Date(p.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })} · {p.fileCount} {p.fileCount === 1 ? "document" : "documents"}
                  </p>
                  {confirmId === p.id ? (
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-[15px]" role="group" aria-label={`Delete ${p.title}?`}>
                      <span>Delete this project and its files for good?</span>
                      <button onClick={() => removeProject(p.id)} className="btn !min-h-10 !px-4 text-white" style={{ background: "var(--bad-ink)" }}>
                        Yes, delete
                      </button>
                      <button onClick={() => setConfirmId("")} className={`${secondaryClass} !min-h-10 !px-4`}>
                        Keep it <Kbd>Esc</Kbd>
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => { setConfirmId(p.id); setDeleteError(""); }} className="mt-3 text-sm text-muted underline underline-offset-4 hover:text-ink" aria-label={`Delete ${p.title}`}>
                      Delete
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <ActionBar>
        <span className="note mr-auto max-sm:hidden">Your words are kept as you type.</span>
        <button onClick={start} disabled={!canStart} className={primaryClass}>
          {busy ? "Working on it..." : "Start"}
          <Kbd>⌘ Enter</Kbd>
        </button>
      </ActionBar>
    </main>
  );
}
