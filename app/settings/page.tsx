"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { initialsOf, useName } from "@/lib/name";
import { Icon } from "@/components/Icons";

// Settings: your name (it saves by itself) and whether the real AI or sample results are in use
export default function SettingsPage() {
  const [name, setName, loaded] = useName();
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState<{ keySet: boolean; demo: boolean } | null>(null);

  useEffect(() => {
    document.title = "Settings · DesignPilot";
    fetch("/api/status").then((r) => r.json()).then(setStatus).catch(() => setStatus(null));
  }, []);

  return (
    <AppShell>
      <main id="main" tabIndex={-1} className="fade-in mx-auto w-full max-w-2xl px-6 pb-24 pt-20">
        <h1 className="page-title">Settings</h1>

        <section className="shell-card mt-8 p-6" aria-labelledby="name-h">
          <h2 id="name-h" className="section-title">Your name</h2>
          <p className="text-soft mt-1 text-[15px]">I use it to say hello on Home. It stays on this computer.</p>
          <div className="mt-4 flex items-center gap-4">
            <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] font-medium text-[var(--accent-ink)]">
              {initialsOf(name) || "?"}
            </span>
            <div className="relative flex-1">
              <label htmlFor="name" className="sr-only">Your name</label>
              <span aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted"><Icon name="edit" size={17} /></span>
              <input
                id="name"
                value={loaded ? name : ""}
                onChange={(e) => { setName(e.target.value.slice(0, 40)); setSaved(true); }}
                placeholder="For example: Priya"
                autoComplete="given-name"
                className="input !pr-11"
              />
            </div>
          </div>
          <p role="status" aria-live="polite" className="text-soft mt-2 text-sm">{saved ? "Saved" : "It saves by itself."}</p>
        </section>

        <section className="shell-card mt-6 p-6" aria-labelledby="ai-h">
          <h2 id="ai-h" className="section-title">The AI</h2>
          {status === null ? (
            <p className="text-soft mt-2">Checking...</p>
          ) : status.demo ? (
            <>
              <p className="mt-2"><span className="pill pill-idle">Demo mode</span></p>
              <p className="mt-3">You are seeing sample results. To use the real AI, open the file <code>.env.local</code> in the project folder, paste your key after <code>ANTHROPIC_API_KEY=</code>, and save the file. You do not need to restart anything.</p>
            </>
          ) : status.keySet ? (
            <p className="mt-2"><span className="pill pill-ok">Real AI is on</span></p>
          ) : (
            <>
              <p className="mt-2"><span className="pill pill-wait">I need your key</span></p>
              <p className="mt-3">Open the file <code>.env.local</code> in the project folder, paste your key after <code>ANTHROPIC_API_KEY=</code>, and save the file.</p>
            </>
          )}
        </section>
      </main>
    </AppShell>
  );
}
