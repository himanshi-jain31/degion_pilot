"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Question = { id: string; question: string; why_it_matters?: string; options: string[] };
type Quick = { request_summary: string; suggested_depth: string; questions: Question[]; answers?: Record<string, string> };

function QuickQuestions() {
  const { id } = useParams<{ id: string }>();
  const [quick, setQuick] = useState<Quick | null>(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  async function answer(q: Question, choice: string | null) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${id}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          choice === null ? { questionId: q.id, youDecide: true } : { questionId: q.id, answer: choice }
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "I couldn't save that. Please try again.");
      setStep((s) => s + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "I couldn't save that. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const questions = quick?.questions ?? [];
  const current = questions[step];

  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-2xl px-5 py-10">
      <Link href="/" className="text-sm text-neutral-600 underline">
        Back to Home
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">A few quick questions</h1>

      {loading && <p role="status" className="mt-6 text-neutral-600">Working on it... I am reading what you gave me.</p>}

      {!loading && error && (
        <div role="alert" className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4">
          <p role="alert" className="text-red-800">{error}</p>
          <button
            onClick={() => (quick ? setError("") : load(true))}
            className="mt-3 rounded-lg bg-black px-4 py-2 text-white hover:bg-neutral-800"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && quick && current && (
        <section className="mt-6">
          {step === 0 && quick.request_summary && (
            <p className="mb-5 rounded-lg bg-neutral-100 p-3 text-neutral-700">
              Here is what I understood: {quick.request_summary}
            </p>
          )}
          <p className="text-sm text-neutral-600">
            Question {step + 1} of {questions.length}
          </p>
          <h2 className="mt-1 text-xl font-medium">{current.question}</h2>
          {current.why_it_matters && <p className="mt-1 text-sm text-neutral-600">{current.why_it_matters}</p>}
          {step > 0 && (
            <button onClick={() => setStep((n) => n - 1)} className="mt-3 text-sm underline">
              Go back to the last question
            </button>
          )}
          <div className="mt-4 flex flex-col gap-2">
            {current.options.map((o) => (
              <button
                key={o}
                disabled={saving}
                onClick={() => answer(current, o)}
                className="rounded-lg border border-neutral-500 px-4 py-3 text-left hover:bg-neutral-100 disabled:opacity-50"
              >
                {o}
              </button>
            ))}
            <button
              disabled={saving}
              onClick={() => answer(current, null)}
              className="rounded-lg border border-dashed border-neutral-500 px-4 py-3 text-left text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
            >
              You decide
            </button>
          </div>
        </section>
      )}

      {!loading && quick && !current && !error && (
        <section className="mt-6 rounded-lg border border-green-300 bg-green-50 p-4">
          <p className="font-medium">Thank you. Your answers are saved.</p>
          <p className="mt-1 text-sm">
            Anything you left to me is saved in the &quot;Things I guessed&quot; list. Next you can start the first design step.
          </p>
          <button onClick={() => setStep(questions.length - 1)} className="mr-4 mt-3 text-sm underline">
            Change my last answer
          </button>
          <Link href={`/project/${id}`} className="button-link mt-3 inline-block rounded-lg bg-black px-5 py-2 text-white hover:bg-neutral-800">
            Go to my project
          </Link>
        </section>
      )}
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
