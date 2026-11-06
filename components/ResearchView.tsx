import type { Finding, ResearchOutput } from "@/lib/storage";
import { List, Pill, Section } from "@/components/UnderstandView";

const isWebLink = (u: string) => /^https?:\/\//i.test(u);

function FindingCard({ f, n }: { f: Finding; n: number }) {
  return (
    <li className="rounded-lg border border-neutral-200 p-3">
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

// The Work tab for Phase 2
export function ResearchWork({ out }: { out: ResearchOutput }) {
  return (
    <div>
      <Section title="What I found">
        <ul className="space-y-3">
          {out.findings.map((f, i) => (
            <FindingCard key={i} f={f} n={i + 1} />
          ))}
        </ul>
      </Section>

      {out.key_insights.length > 0 && (
        <Section title="Key insights">
          <ul className="space-y-2">
            {out.key_insights.map((k, i) => (
              <li key={i}>
                <strong>{k.insight}</strong>
                {k.based_on.length > 0 && <span className="text-sm text-neutral-600"> (from finding {k.based_on.join(", ")})</span>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {out.updated_user_profiles.length > 0 && (
        <Section title="User profiles, updated with what I found">
          <div className="grid gap-3 sm:grid-cols-2">
            {out.updated_user_profiles.map((u, i) => (
              <div key={i} className="rounded-lg border border-neutral-200 p-3">
                <p className="font-medium">
                  {u.name}
                  <Pill label={u.label} />
                </p>
                <p className="mt-1 text-sm"><strong>Goal:</strong> {u.goal}</p>
                <p className="mt-1 text-sm"><strong>Situation:</strong> {u.situation}</p>
                {u.frustrations.length > 0 && <List items={u.frustrations} />}
              </div>
            ))}
          </div>
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
