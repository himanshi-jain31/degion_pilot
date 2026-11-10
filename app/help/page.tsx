"use client";

import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { PHASES } from "@/lib/phases";

const WHAT: Record<string, string> = {
  Understand: "I turn your request into a clear brief, who will use it, and what it must do.",
  Research: "I look at similar products and good practice, and show every source.",
  Ideate: "I draw the product structure and the flows, then offer different directions to choose from.",
  Wireframes: "I draw every screen in grey, clickable, for every kind of user.",
  "Visual design": "I give the screens their final look and make a working prototype.",
  Testing: "I prepare a test kit, then read your test notes and rank the problems.",
};

// A plain help page: how it works, shortcuts, and what to do when something is off
export default function HelpPage() {
  useEffect(() => {
    document.title = "Help · DesignPilot";
  }, []);
  return (
    <AppShell>
      <main id="main" tabIndex={-1} className="fade-in mx-auto w-full max-w-2xl px-6 pb-24 pt-20">
        <h1 className="page-title">Help</h1>
        <p className="text-soft mt-2 text-lg">DesignPilot does the design steps with you. After every step it stops and waits for your Go ahead.</p>

        <section className="shell-card mt-8 p-6" aria-labelledby="steps">
          <h2 id="steps" className="section-title">The six steps</h2>
          <ol className="mt-4 space-y-3">
            {PHASES.map((p) => (
              <li key={p.n}>
                <strong>{p.n}. {p.name}.</strong> <span className="text-soft">{WHAT[p.name]}</span>
              </li>
            ))}
          </ol>
          <p className="text-soft mt-4 text-sm">Your final result is a working prototype that opens in a browser, on a phone and on a laptop.</p>
        </section>

        <section className="shell-card mt-6 p-6" aria-labelledby="check-in">
          <h2 id="check-in" className="section-title">The check-in</h2>
          <p className="mt-2">After each step you see what I made and what I am not sure about. Then you choose:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>Go ahead:</strong> I start the next step.</li>
            <li><strong>Not yet:</strong> tell me what to change, and I redo the step. You will see &quot;Version 2: updated using your feedback&quot;.</li>
          </ul>
        </section>

        <section className="shell-card mt-6 p-6" aria-labelledby="keys">
          <h2 id="keys" className="section-title">Keyboard shortcuts</h2>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
            <dt><kbd className="kbd">Enter</kbd></dt><dd>On Home: send your request. In the check-in: Go ahead.</dd>
            <dt><kbd className="kbd">Shift Enter</kbd></dt><dd>On Home: a new line in the box.</dd>
            <dt><kbd className="kbd">1</kbd> to <kbd className="kbd">4</kbd></dt><dd>In the quick questions: pick an answer. <kbd className="kbd">D</kbd> means You decide.</dd>
            <dt><kbd className="kbd">Esc</kbd></dt><dd>Close the feedback box or a menu, or go back a question.</dd>
            <dt><kbd className="kbd">⌘ Enter</kbd></dt><dd>Send your feedback from the feedback box.</dd>
          </dl>
        </section>

        <section className="shell-card mt-6 p-6" aria-labelledby="real">
          <h2 id="real" className="section-title">Sample results and the real AI</h2>
          <p className="mt-2">
            If you see a small <strong>Demo mode</strong> badge at the top right, you are looking at sample results. To get real designs, open the file <code>.env.local</code> in the project folder and paste your key after <code>ANTHROPIC_API_KEY=</code>. Save the file. The badge goes away by itself. Start a new project for real work.
          </p>
        </section>

        <section className="shell-card mt-6 p-6" aria-labelledby="trouble">
          <h2 id="trouble" className="section-title">If something looks wrong</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Every message has a <strong>Try again</strong> button. Use it first.</li>
            <li>You can leave a page while I am working. Your check-in will be waiting.</li>
            <li>Everything saves by itself. There is no Save button.</li>
          </ul>
        </section>
      </main>
    </AppShell>
  );
}
