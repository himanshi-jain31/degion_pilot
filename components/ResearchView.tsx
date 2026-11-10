"use client";

import { useState } from "react";
import type { Finding, ResearchOutput } from "@/lib/storage";
import { ProfileGrid } from "@/components/ProfileCard";
import { List, Pill, Section } from "@/components/UnderstandView";

const isWebLink = (u: string) => /^https?:\/\//i.test(u);

function FindingCard({ f, n }: { f: Finding; n: number }) {
  return (
    <li id={`finding-${n}`} className="scroll-mt-24 rounded-lg border border-neutral-200 p-3 transition-shadow target:ring-2 target:ring-[var(--accent)]">
      <p className="text-xs uppercase tracking-wide text-neutral-600">
        Finding {n} · {f.type}
      </p>
      <p className="mt-1">
        {f.finding}
        <Pill label={f.label} />
        <span className="ml-2 text-xs text-neutral-600">Trust: {f.confidence}</span>
      </p>
      <p className="mt-1 text-sm">
        Source:{" "}
        {isWebLink(f.source_url) ? (
          <a href={f.source_url} target="_blank" rel="noopener noreferrer" className="break-words text-blue-700 underline">
            {f.source_title || f.source_url}
          </a>
        ) : (
          <span>{f.source_title || "No link given"}</span>
        )}
      </p>
      {f.check_note && <p className="mt-1 text-sm text-amber-800">{f.check_note}</p>}
    </li>
  );
}

const LABELS = ["Checked", "My guess", "Test idea only"] as const;
const LABEL_BAR: Record<string, string> = { Checked: "bg-[var(--ok)]", "My guess": "bg-[var(--wait)]", "Test idea only": "bg-[#9a9aa0]" };
const LABEL_HELP: Record<string, string> = { Checked: "has a source", "My guess": "I worked it out", "Test idea only": "made up for testing" };

// How much of the research is backed by a source, in one bar
function EvidenceBar({ findings }: { findings: Finding[] }) {
  const total = findings.length;
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-line" role="img" aria-label={LABELS.map((l) => `${findings.filter((f) => f.label === l).length} ${l}`).join(", ")}>
        {LABELS.map((l) => {
          const n = findings.filter((f) => f.label === l).length;
          return n ? <div key={l} className={LABEL_BAR[l]} style={{ width: `${(n / total) * 100}%` }} /> : null;
        })}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[14px]">
        {LABELS.map((l) => (
          <li key={l} className="flex items-center gap-2">
            <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${LABEL_BAR[l]}`} />
            {findings.filter((f) => f.label === l).length} {l} <span className="text-muted">({LABEL_HELP[l]})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// The Work tab for Phase 2
export function ResearchWork({ out }: { out: ResearchOutput }) {
  const [show, setShow] = useState<string>("All");
  const numbered = out.findings.map((f, i) => ({ f, n: i + 1 }));
  const visible = numbered.filter((x) => show === "All" || x.f.label === show);
  const types = [...new Set(visible.map((x) => x.f.type || "Other"))];
  return (
    <div>
      <Section title="What I found">
        <EvidenceBar findings={out.findings} />
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Show findings">
          {["All", ...LABELS].map((l) => (
            <button key={l} onClick={() => setShow(l)} aria-pressed={show === l} className={`rounded-full border px-3 py-1 text-[14px] ${show === l ? "border-[var(--accent)] bg-accent-soft text-[var(--accent-ink)]" : "border-line bg-card text-muted hover:text-ink"}`}>
              {l}
            </button>
          ))}
        </div>
        {visible.length === 0 && <p className="note mt-4">No findings with this label.</p>}
        <div className="mt-4 space-y-5">
          {types.map((t) => (
            <div key={t}>
              <p className="label-small mb-2">{t}</p>
              <ul className="grid gap-3 lg:grid-cols-2">
                {visible.filter((x) => (x.f.type || "Other") === t).map((x) => (
                  <FindingCard key={x.n} f={x.f} n={x.n} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {out.key_insights.length > 0 && (
        <Section title="Key insights">
          <ul className="space-y-3">
            {out.key_insights.map((k, i) => (
              <li key={i} className="rounded-xl border border-line bg-card p-4">
                <p className="font-medium">{k.insight}</p>
                {k.based_on.length > 0 && (
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-[14px] text-muted">
                    Based on:
                    {k.based_on.map((b, j) => {
                      const num = b.match(/\d+/)?.[0];
                      const ok = num && Number(num) >= 1 && Number(num) <= out.findings.length;
                      const f = ok ? out.findings[Number(num) - 1] : null;
                      return ok ? (
                        <a key={j} href={`#finding-${num}`} onClick={() => setShow("All")} className="rounded-full border border-line px-2.5 py-0.5 text-ink hover:border-[var(--accent)]">
                          <span aria-hidden="true" className={`mr-1.5 inline-block h-2 w-2 rounded-full ${LABEL_BAR[f!.label]}`} />
                          Finding {num}
                        </a>
                      ) : (
                        <span key={j}>{b}</span>
                      );
                    })}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {out.updated_user_profiles.length > 0 && (
        <Section title="User profiles, updated with what I found">
          <ProfileGrid profiles={out.updated_user_profiles} />
        </Section>
      )}

      <Section title="Kit for talking to real users">
        <p className="text-sm"><strong>What we want to learn</strong></p>
        <List items={out.research_kit.goals} />
        <p className="mt-3 text-sm"><strong>Interview questions</strong></p>
        <ol className="list-decimal space-y-1 pl-5">
          {out.research_kit.interview_questions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ol>
        {out.research_kit.survey_questions.length > 0 && (
          <>
            <p className="mt-3 text-sm"><strong>Short survey (if useful)</strong></p>
            <List items={out.research_kit.survey_questions} />
          </>
        )}
        {out.research_kit.who_to_recruit && (
          <p className="mt-3 text-sm"><strong>Who to ask:</strong> {out.research_kit.who_to_recruit}</p>
        )}
      </Section>

      {out.could_not_find.length > 0 && (
        <Section title="What I could not find">
          <List items={out.could_not_find} />
        </Section>
      )}
    </div>
  );
}
