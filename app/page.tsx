"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ProjectRow = { id: string; title: string; createdAt: string; fileCount: number };
type Result = {
  skipped: string[];
  files: { name: string; kind: string; note: string; characters: number }[];
};

export default function Home() {
  const [requirement, setRequirement] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [projectId, setProjectId] = useState("");
  const [projects, setProjects] = useState<ProjectRow[] | null>(null); // null = still loading
  const [listError, setListError] = useState("");
  const [status, setStatus] = useState<{ demo: boolean; keySet: boolean } | null>(null);
  const [confirmId, setConfirmId] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function loadProjects() {
    setListError("");
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error();
      setProjects(await res.json());
    } catch {
      setListError("I couldn't load your projects.");
    }
  }

  useEffect(() => {
    document.title = "DesignPilot";
    loadProjects();
    fetch("/api/status").then((r) => r.json()).then(setStatus).catch(() => setStatus(null));
  }, []);

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

  async function start() {
    setError("");
    setResult(null);
    if (!requirement.trim() && files.length === 0) {
      setError("Please type what you need, or add a document.");
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append("requirement", requirement);
      files.forEach((f) => form.append("files", f));
      const res = await fetch("/api/projects", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      const unreadable = data.files.some((f: { kind: string; characters: number }) => f.kind !== "Image" && f.characters === 0);
      if (data.skipped.length > 0 || unreadable) {
        // let the designer read what was skipped before moving on
        setResult(data);
        setProjectId(data.id);
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

  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-2xl px-5 py-10">
      <h1 className="text-3xl font-semibold">DesignPilot</h1>
      <p className="mt-1 text-neutral-600">I do the design steps for you. You say Go ahead after each one.</p>

      {status?.demo && (
        <p className="mt-4 rounded-lg bg-purple-100 p-3 text-sm text-purple-900">
          Demo mode is on: every result is made up so you can try the screens. To use the real AI, remove the line DEMO_MODE=on from the file .env.local.
        </p>
      )}
      {status && !status.demo && !status.keySet && (
        <div role="alert" className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm">
          <p className="font-medium">One thing first: I need your key.</p>
          <p className="mt-1">
            Open the file <code>.env.local</code> in this project folder and paste your key right after <code>ANTHROPIC_API_KEY=</code> (no spaces, no quotes). Save the file. You do not need to restart anything.
          </p>
        </div>
      )}

      <section className="mt-8">
        <label htmlFor="requirement" className="block text-lg font-medium">
          Tell me what you need to design
        </label>
        <textarea
          id="requirement"
          value={requirement}
          onChange={(e) => setRequirement(e.target.value)}
          rows={7}
          placeholder="For example: A simple app where staff can ask for leave and managers can say yes or no."
          className="mt-2 w-full rounded-lg border border-neutral-500 p-3 text-base focus:border-black focus:outline-none"
        />

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            ref={fileInput}
            type="file"
            multiple
            accept=".pdf,.docx,.xlsx,.csv,.txt,.md,.png,.jpg,.jpeg,.gif,.webp"
            className="hidden"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="rounded-lg border border-neutral-500 px-4 py-2 hover:bg-neutral-100"
          >
            Upload documents
          </button>
          <span className="text-sm text-neutral-600">PDF, Word, Excel, CSV, text or pictures</span>
        </div>

        {files.length > 0 && (
          <ul className="mt-3 list-disc pl-5 text-sm">
            {files.map((f) => (
              <li key={f.name + f.size}>{f.name}</li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={start}
          disabled={busy}
          className="mt-5 rounded-lg bg-black px-6 py-3 font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {busy ? "Working on it..." : "Start"}
        </button>

        {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}

        {result && (
          <div className="mt-5 rounded-lg border border-green-300 bg-green-50 p-4 text-sm">
            <p className="font-medium">Your project is saved. Please read this before you go on.</p>
            <Link href={`/project/${projectId}/questions`} className="mt-1 inline-block underline">
              Continue to the quick questions
            </Link>
            <ul className="mt-2 space-y-1">
              {result.files.map((f) => (
                <li key={f.name}>
                  <strong>{f.name}</strong> ({f.kind}): {f.note}
                  {f.characters > 0 && ` ${f.characters.toLocaleString()} characters read.`}
                  {f.kind !== "Image" && f.characters === 0 && " I could not use anything from this file, so I will work without it."}
                </li>
              ))}
              {result.skipped.map((s) => (
                <li key={s} className="text-red-700">
                  Skipped: {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-medium">My projects</h2>
        {listError ? (
          <div role="alert" className="mt-3 rounded-lg border border-red-300 bg-red-50 p-4">
            <p className="text-red-800">{listError}</p>
            <button onClick={loadProjects} className="mt-3 rounded-lg bg-black px-4 py-2 text-white hover:bg-neutral-800">Try again</button>
          </div>
        ) : projects === null ? (
          <p role="status" className="mt-2 text-neutral-600">Loading your projects...</p>
        ) : projects.length === 0 ? (
          <p className="mt-2 text-neutral-600">No projects yet. Type what you need above and click Start. Your first project will show up here.</p>
        ) : (
          <>
          {deleteError && <p role="alert" className="mt-2 text-red-700">{deleteError}</p>}
          <ul className="mt-3 divide-y divide-neutral-200 rounded-lg border border-neutral-200">
            {projects.map((p) => (
              <li key={p.id} className="p-4">
                <Link href={`/project/${p.id}`} className="font-medium underline">
                  {p.title}
                </Link>
                <p className="text-sm text-neutral-600">
                  {new Date(p.createdAt).toLocaleString()} · {p.fileCount}{" "}
                  {p.fileCount === 1 ? "document" : "documents"}
                </p>
                {confirmId === p.id ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm" role="group" aria-label={`Delete ${p.title}?`}>
                    <span>Delete this project and its files for good?</span>
                    <button onClick={() => removeProject(p.id)} className="rounded-lg bg-red-700 px-3 py-1 text-white hover:bg-red-800">Yes, delete</button>
                    <button onClick={() => setConfirmId("")} className="rounded-lg border border-neutral-500 px-3 py-1 hover:bg-neutral-100">Keep it</button>
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
    </main>
  );
}
