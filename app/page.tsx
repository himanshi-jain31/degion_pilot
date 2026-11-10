"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ActionBar, Kbd, Loading, Notice, primaryClass, quietClass, useDraft, useKey } from "@/components/ui";

type ProjectRow = {
  id: string;
  title: string;
  createdAt: string;
  fileCount: number;
  madeInDemo: boolean;
  next: { text: string; tone: "waiting" | "working" | "done" | "idle" };
};
type Result = { id: string; skipped: string[]; files: { name: string; kind: string; note: string; characters: number }[] };

const TONE: Record<string, string> = {
  waiting: "bg-amber-100 text-amber-900",
  working: "bg-blue-100 text-blue-900",
  done: "bg-green-100 text-green-900",
  idle: "bg-neutral-100 text-neutral-800",
};

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
    <main id="main" tabIndex={-1} className="mx-auto max-w-2xl px-5 pb-32 pt-8">
      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/60 text-2xl font-semibold text-white">
          Drop your files here to add them
        </div>
      )}

      {status && !status.demo && !status.keySet && (
        <div role="alert" className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm">
          <p className="font-medium">One thing first: I need your key.</p>
          <p className="mt-1">
            Open the file <code>.env.local</code> in this project folder and paste your key right after <code>ANTHROPIC_API_KEY=</code> (no spaces, no quotes). Save the file. You do not need to restart anything.
          </p>
        </div>
      )}

      <label htmlFor="requirement" className="block text-2xl font-semibold">
        Tell me what you need to design
      </label>
      <textarea
        id="requirement"
        ref={box}
        autoFocus
        value={requirement}
        onChange={(e) => setRequirement(e.target.value)}
        rows={8}
        placeholder="For example: A simple app where staff can ask for leave and managers can say yes or no."
        className="mt-3 w-full rounded-lg border border-neutral-500 p-4 text-lg focus:border-black focus:outline-none"
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
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
        <button type="button" onClick={() => fileInput.current?.click()} className="rounded-lg border border-neutral-500 px-4 py-2 hover:bg-neutral-100">
          Upload documents
        </button>
        <span className="text-sm text-neutral-700">or drag them anywhere on this page. PDF, Word, Excel, CSV, text or pictures.</span>
      </div>

      {files.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {files.map((f) => (
            <li key={f.name + f.size} className="flex items-center gap-2">
              <span>{f.name}</span>
              <button type="button" onClick={() => setFiles((old) => old.filter((o) => o !== f))} aria-label={`Remove ${f.name}`} className="text-neutral-700 underline">
                remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <div className="mt-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      {result && (
        <div className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm">
          <p className="font-medium">Your project is saved. Please read this before you go on.</p>
          <ul className="mt-2 space-y-1">
            {result.files.map((f) => (
              <li key={f.name}>
                <strong>{f.name}</strong> ({f.kind}): {f.note}
                {f.characters > 0 && ` ${f.characters.toLocaleString()} characters read.`}
                {f.kind !== "Image" && f.characters === 0 && " I could not use anything from this file, so I will work without it."}
              </li>
            ))}
            {result.skipped.map((s) => (
              <li key={s} className="text-red-800">
                Skipped: {s}
              </li>
            ))}
          </ul>
          <Link href={`/project/${result.id}/questions`} className={`${primaryClass} button-link mt-3`}>
            Continue to the quick questions
          </Link>
        </div>
      )}

      <section className="mt-12" aria-labelledby="my-projects">
        <h2 id="my-projects" className="text-xl font-medium">
          My projects
        </h2>
        {listError ? (
          <div className="mt-3">
            <Notice tone="error" action={<button onClick={loadProjects} className={quietClass}>Try again</button>}>
              {listError}
            </Notice>
          </div>
        ) : projects === null ? (
          <div className="mt-3">
            <Loading onReload={loadProjects}>Loading your projects...</Loading>
          </div>
        ) : projects.length === 0 ? (
          <div className="mt-3">
            <Notice action={<button onClick={() => box.current?.focus()} className={quietClass}>Type your first request</button>}>
              No projects yet. Your first one will show up here.
            </Notice>
          </div>
        ) : (
          <>
            {deleteError && <p role="alert" className="mt-2 text-red-800">{deleteError}</p>}
            <ul className="mt-3 divide-y divide-neutral-200 rounded-lg border border-neutral-300">
              {projects.map((p) => (
                <li key={p.id} className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link href={`/project/${p.id}`} className="font-medium underline">
                      {p.title}
                    </Link>
                    <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${TONE[p.next.tone]}`}>{p.next.text}</span>
                  </div>
                  <p className="text-sm text-neutral-700">
                    {new Date(p.createdAt).toLocaleString()} · {p.fileCount} {p.fileCount === 1 ? "document" : "documents"}
                  </p>
                  {confirmId === p.id ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm" role="group" aria-label={`Delete ${p.title}?`}>
                      <span>Delete this project and its files for good?</span>
                      <button onClick={() => removeProject(p.id)} className="rounded-lg bg-red-800 px-3 py-1 text-white hover:bg-red-900">
                        Yes, delete
                      </button>
                      <button onClick={() => setConfirmId("")} className="rounded-lg border border-neutral-500 px-3 py-1 hover:bg-neutral-100">
                        Keep it <Kbd>Esc</Kbd>
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => { setConfirmId(p.id); setDeleteError(""); }} className="mt-1 text-sm underline" aria-label={`Delete ${p.title}`}>
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
        <span className="mr-auto text-sm text-neutral-700 max-sm:hidden">Your words are kept as you type.</span>
        <button onClick={start} disabled={!canStart} className={primaryClass}>
          {busy ? "Working on it..." : "Start"}
          <Kbd onDark>⌘ Enter</Kbd>
        </button>
      </ActionBar>
    </main>
  );
}
