"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Loading, Notice, secondaryClass } from "@/components/ui";

type DesignFile = { id: string; name: string; role: string | null; summary: string; addedAt: string; projectId: string; projectTitle: string };

const ROLE: Record<string, string> = {
  "design-system": "My design system",
  "current-screens": "My current screens",
  inspiration: "Inspiration",
  reference: "Reference",
};

// Every Figma file shared in any project. Read only.
export default function DesignFilesPage() {
  const [files, setFiles] = useState<DesignFile[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/design-files");
      if (!res.ok) throw new Error();
      setFiles(await res.json());
    } catch {
      setError("I couldn't load your design files.");
    }
  }, []);

  useEffect(() => {
    document.title = "Design files · DesignPilot";
    load();
  }, [load]);

  return (
    <AppShell>
      <main id="main" tabIndex={-1} className="fade-in mx-auto w-full max-w-2xl px-6 pb-24 pt-20">
        <h1 className="page-title">Design files</h1>
        <p className="text-soft mt-2 text-lg">Figma files you shared. I only read them. I never change them.</p>

        <div className="mt-8">
          {error ? (
            <Notice tone="error" action={<button onClick={load} className={secondaryClass}>Try again</button>}>{error}</Notice>
          ) : files === null ? (
            <Loading onReload={load}>Loading your design files...</Loading>
          ) : files.length === 0 ? (
            <div className="shell-card p-6 text-center">
              <p className="text-lg font-medium">No design files yet</p>
              <p className="text-soft mt-1">Add a Figma link with the + button on Home, or inside a project under Add a Figma file.</p>
              <Link href="/#new" className={`${secondaryClass} mt-4`}>Start a new design</Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {files.map((f) => (
                <li key={f.id} className="shell-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="font-medium">{f.name}</p>
                    <span className={f.role ? "pill pill-info" : "pill pill-wait"}>{f.role ? ROLE[f.role] : "Waiting for your answer"}</span>
                  </div>
                  <p className="text-soft mt-1 text-sm">{f.summary}</p>
                  <p className="mt-3 text-sm">
                    In project: <Link href={`/project/${f.projectId}`} className="underline underline-offset-4">{f.projectTitle}</Link>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </AppShell>
  );
}
