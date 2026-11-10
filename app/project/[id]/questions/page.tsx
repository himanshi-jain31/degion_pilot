"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ActionBar, BackLink, Kbd, Loading, Notice, isTypingTarget, primaryClass, quietClass, useKey } from "@/components/ui";

type Question = { id: string; question: string; why_it_matters?: string; options: string[] };
type Quick = { request_summary: string; suggested_depth: string; questions: Question[]; answers?: Record<string, string> };

function QuickQuestions() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quick, setQuick] = useState<Quick | null>(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (again = false) => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/projects/${id}/questions${again ? "?again=1" : ""}`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Something went wrong.");
        setQuick(data);
        // carry on from the first question that has no answer yet
        const firstOpen = (data.questions as Question[]).findIndex((q) => !data.answers?.[q.id]);
        setStep(firstOpen === -1 ? data.questions.length : firstOpen);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    document.title = "Quick questions · DesignPilot";
    load();
  }, [load]);

  const questions = quick?.questions ?? [];
  const current = questions[step];

  // All questions answered: start the first step straight away and open the project
  const finish = useCallback(async () => {
    setStarting(true);
    try {
      await fetch(`/api/projects/${id}/phases/1/run`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    } catch {
      // the project page shows a Start button if this did not work
    }
    router.push(`/project/${id}`);
  }, [id, router]);

  useEffect(() => {
    if (quick && !loading && !error && step >= questions.length && questions.length > 0 && !starting) void finish();
  }, [quick, loading, error, step, questions.length, starting, finish]);

  async function answer(q: Question, choice: string | null) {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${id}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(choice === null ? { questionId: q.id, youDecide: true } : { questionId: q.id, answer: choice }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "I couldn't save that. Please try again.");
      setStep((s) => s + 1); // moves on by itself
    } catch (e) {
      setError(e instanceof Error ? e.message : "I couldn't save that. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // 1 to 4 pick an answer, D means "You decide"
  useKey((e) => {
    if (!current || isTypingTarget(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    const n = Number(e.key);
    if (n >= 1 && n <= current.options.length) answer(current, current.options[n - 1]);
    else if (e.key.toLowerCase() === "d") answer(current, null);
    else if (e.key === "Escape" && step > 0) setStep((s) => s - 1);
  });

  return (
    <main id="main" tabIndex={-1} className="mx-auto w-full max-w-2xl px-6 pb-40 pt-8">
      <BackLink />

      {loading && (
        <div className="mt-6">
          <Loading onReload={() => load()}>Working on it... I am reading what you gave me to think of the right questions.</Loading>
        </div>
      )}

      {!loading && error && (
        <div className="mt-6">
          <Notice tone="error" action={<button onClick={() => (quick ? setError("") : load(true))} className={primaryClass}>Try again</button>}>
            {error}
          </Notice>
        </div>
      )}

      {!loading && quick && current && (
        <section className="mt-6" aria-live="polite">
          {step === 0 && quick.request_summary && (
            <p className="mb-6 rounded-lg bg-neutral-100 p-3 text-neutral-800">Here is what I understood: {quick.request_summary}</p>
          )}
          <p className="text-sm text-neutral-700">
            Question {step + 1} of {questions.length}
          </p>
          <h1 className="mt-1 text-2xl font-semibold">{current.question}</h1>
          {current.why_it_matters && <p className="mt-1 text-sm text-neutral-700">{current.why_it_matters}</p>}
          <div className="mt-5 flex flex-col gap-3">
            {current.options.map((o, i) => (
              <button
                key={o}
                disabled={saving}
                onClick={() => answer(current, o)}
                className="flex items-center justify-between rounded-lg border border-neutral-500 px-4 py-3 text-left text-lg hover:bg-neutral-100 disabled:opacity-50"
              >
                <span>{o}</span>
                <Kbd>{i + 1}</Kbd>
              </button>
            ))}
            <button
              disabled={saving}
              onClick={() => answer(current, null)}
              className="flex items-center justify-between rounded-lg border border-dashed border-neutral-500 px-4 py-3 text-left text-neutral-800 hover:bg-neutral-100 disabled:opacity-50"
            >
              <span>You decide</span>
              <Kbd>D</Kbd>
            </button>
          </div>
        </section>
      )}

      {!loading && quick && !current && !error && (
        <div className="mt-6">
          <Notice>All done. I am starting the first step now.</Notice>
        </div>
      )}

      <ActionBar>
        {step > 0 && quick && current ? (
          <button onClick={() => setStep((s) => s - 1)} className={quietClass}>
            Go back <Kbd>Esc</Kbd>
          </button>
        ) : (
          <span className="text-sm text-neutral-700">Tap an answer. I move on by myself.</span>
        )}
      </ActionBar>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="p-10">Working on it...</p>}>
      <QuickQuestions />
    </Suspense>
  );
}
