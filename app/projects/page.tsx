"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProjectCard, type ProjectRow } from "@/components/ProjectCard";
import { Loading, Notice, primaryClass, secondaryClass } from "@/components/ui";

// Every project, newest first. Open one by clicking its card.
export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectRow[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error();
      setProjects(await res.json());
    } catch {
      setError("I couldn't load your projects.");
    }
  }, []);

  useEffect(() => {
    document.title = "My projects · DesignPilot";
    load();
  }, [load]);

  const waiting = (projects ?? []).filter((p) => p.next.status === "Ready for you" && p.next.badge === "Ready for you").length;

  return (
    <AppShell>
      <main id="main" tabIndex={-1} className="fade-in mx-auto w-full max-w-5xl px-6 pb-24 pt-20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <h1 className="page-title">My projects</h1>
            {waiting > 0 && <span className="pill pill-wait">{waiting === 1 ? "1 project needs you" : `${waiting} projects need you`}</span>}
          </div>
          <Link href="/#new" className={primaryClass}>
            New design
          </Link>
        </div>
        <p className="text-soft mt-2 text-lg">
          {projects === null ? "All your designs in one place." : projects.length === 1 ? "1 project, newest first." : `${projects.length} projects, newest first.`}
        </p>

        <div className="mt-8">
          {error ? (
            <Notice tone="error" action={<button onClick={load} className={secondaryClass}>Try again</button>}>{error}</Notice>
          ) : projects === null ? (
            <Loading onReload={load}>Loading your projects...</Loading>
          ) : projects.length === 0 ? (
            <div className="shell-card p-8 text-center">
              <p className="text-lg font-medium">No projects yet</p>
              <p className="text-soft mt-1">Tell me what you need to design and your first project will show up here.</p>
              <Link href="/#new" className={`${primaryClass} mt-4`}>Start a new design</Link>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <li key={p.id}>
                  <ProjectCard p={p} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </AppShell>
  );
}
