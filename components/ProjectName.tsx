"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { capFirst } from "@/lib/names";
import { Kbd, secondaryClass } from "@/components/ui";

// The project name at the top of the project page. Click it to rename. It saves when you press Enter or click away.
export function ProjectName({ projectId, title, onRenamed }: { projectId: string; title: string; onRenamed: () => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const cancelled = useRef(false);

  useEffect(() => {
    if (editing) {
      input.current?.focus();
      input.current?.select();
    }
  }, [editing]);

  async function save() {
    if (cancelled.current) {
      cancelled.current = false;
      return;
    }
    const next = value.trim();
    if (!next || next === title) {
      setEditing(false);
      setError("");
      return;
    }
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: next }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEditing(false);
      setError("");
      await onRenamed();
    } catch (e) {
      setError(e instanceof Error ? e.message : "I couldn't rename it. Please try again.");
    }
  }

  if (editing) {
    return (
      <div className="mb-6 mt-3 max-w-3xl">
        <label htmlFor="project-name" className="sr-only">Project name</label>
        <input
          id="project-name"
          ref={input}
          value={value}
          maxLength={60}
          onChange={(e) => { setValue(e.target.value); setError(""); }}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); void save(); }
            if (e.key === "Escape") { cancelled.current = true; setEditing(false); setValue(title); setError(""); }
          }}
          className="input !text-[32px] !font-medium !leading-tight"
        />
        <p className="note mt-2">
          Press <Kbd>Enter</Kbd> to save or <Kbd>Esc</Kbd> to cancel.
        </p>
        {error && <p role="alert" className="mt-1 text-[var(--bad-ink)]">{error}</p>}
      </div>
    );
  }
  return (
    <h1 className="mb-6 mt-3 max-w-3xl">
      <button
        onClick={() => { cancelled.current = false; setValue(title); setEditing(true); }}
        aria-label={`${capFirst(title)}. Click to rename this project.`}
        title="Click to rename"
        className="page-title group -mx-2 rounded-xl px-2 text-left transition-colors duration-150 hover:bg-white/70"
      >
        {capFirst(title)}
        <span aria-hidden="true" className="ml-3 align-middle text-base font-normal text-muted opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">Rename</span>
      </button>
    </h1>
  );
}

// "Delete this project" with a question first
export function DeleteProject({ projectId, title }: { projectId: string; title: string }) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "I couldn't delete it. Please try again.");
    }
  }

  useEffect(() => {
    if (!asking) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAsking(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [asking]);

  if (!asking)
    return (
      <button onClick={() => { setAsking(true); setError(""); }} className="text-sm text-muted underline underline-offset-4 hover:text-ink" aria-label={`Delete ${capFirst(title)}`}>
        Delete this project
      </button>
    );
  return (
    <div className="flex flex-wrap items-center gap-3 text-[15px]" role="group" aria-label="Delete this project?">
      <span>Delete this project and its files for good?</span>
      <button onClick={remove} className="btn !min-h-10 !px-4 text-white" style={{ background: "var(--bad-ink)" }}>Yes, delete</button>
      <button onClick={() => setAsking(false)} className={`${secondaryClass} !min-h-10 !px-4`}>Keep it <Kbd>Esc</Kbd></button>
      {error && <span role="alert" className="text-[var(--bad-ink)]">{error}</span>}
    </div>
  );
}
