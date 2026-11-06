import type { PhaseOutput, UnderstandOutput } from "@/lib/storage";

export function Pill({ label }: { label: string }) {
  const colour =
    label === "Checked" ? "bg-green-100 text-green-800" : label === "Test idea only" ? "bg-purple-100 text-purple-800" : "bg-amber-100 text-amber-800";
  return <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${colour}`}>{label}</span>;
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="text-lg font-medium">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

export function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  );
}

// The Plan tab: what I will do and what I will skip
export function PlanView({ out }: { out: PhaseOutput }) {
  return (
    <div>
      <Section title="What I will do">
        <List items={out.plan.will_do} />
      </Section>
      <Section title="What I will skip, and why">
        {out.plan.will_skip.length === 0 ? (
          <p className="text-neutral-600">Nothing. I did every part.</p>
        ) : (
          <ul className="list-disc space-y-1 pl-5">
            {out.plan.will_skip.map((s, i) => (
              <li key={i}>
                <strong>{s.item}:</strong> {s.why}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

// The Work tab: the results, shown nicely
export function WorkView({ out }: { out: UnderstandOutput }) {
  return (
    <div>
      <Section title="The brief">
        <p className="font-medium">{out.brief.one_line}</p>
        {out.brief.full && <p className="mt-2 whitespace-pre-line">{out.brief.full}</p>}
      </Section>

      {out.another_view && (
        <Section title="Another view">
          <p>{out.another_view}</p>
        </Section>
      )}

      <Section title="Who will use this">
        <ul className="space-y-2">
          {out.users.map((u, i) => (
            <li key={i}>
              <strong>{u.name}</strong>
              <Pill label={u.label} />
              <p className="text-neutral-700">{u.note}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="User profiles (first draft)">
        <div className="grid gap-3 sm:grid-cols-2">
          {out.user_profiles.map((u, i) => (
            <div key={i} className="rounded-lg border border-neutral-200 p-3">
              <p className="font-medium">
                {u.name}
                <Pill label={u.label} />
              </p>
              <p className="mt-1 text-sm">
                <strong>Goal:</strong> {u.goal}
              </p>
              <p className="mt-1 text-sm">
                <strong>Situation:</strong> {u.situation}
              </p>
              {u.frustrations.length > 0 && (
                <div className="mt-1 text-sm">
                  <strong>Frustrations:</strong>
                  <List items={u.frustrations} />
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Requirements">
        <ul className="space-y-3">
          {out.requirements.map((r) => (
            <li key={r.id} className="rounded-lg border border-neutral-200 p-3">
              <p>
                <strong>{r.id}</strong> {r.story}
                <Pill label={r.label} />
              </p>
              {r.done_checks.length > 0 && (
                <div className="mt-1 text-sm">
                  <span className="text-neutral-600">Done when:</span>
                  <List items={r.done_checks} />
                </div>
              )}
            </li>
          ))}
        </ul>
      </Section>

      {out.edge_cases.length > 0 && (
        <Section title="Tricky moments (empty, error, slow, and more)">
          <List items={out.edge_cases} />
        </Section>
      )}

      {out.not_asked_about.length > 0 && (
        <Section title="Things you may not have asked about">
          <ul className="space-y-1">
            {out.not_asked_about.map((n, i) => (
              <li key={i}>
                <strong>{n.topic}:</strong> {n.why_it_matters}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {out.success_measures.length > 0 && (
        <Section title="How we will know it worked">
          <List items={out.success_measures} />
        </Section>
      )}

      {out.open_questions.length > 0 && (
        <Section title="Questions I could not answer">
          <List items={out.open_questions} />
        </Section>
      )}
    </div>
  );
}
