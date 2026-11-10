import { ProfileGrid } from "@/components/ProfileCard";
import type { PhaseOutput, UnderstandOutput } from "@/lib/storage";

export function Pill({ label }: { label: string }) {
  // Checked has a source (green), My guess is inferred (amber), Test idea only is made up for testing (grey)
  const kind = label === "Checked" ? "pill-ok" : label === "Test idea only" ? "pill-idle" : "pill-wait";
  return <span className={`pill ${kind} ml-2 !text-[13px] align-middle`}>{label}</span>;
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 border-t border-line pt-8 first:mt-0 first:border-0 first:pt-0">
      <h3 className="flex items-center gap-2 text-[17px] font-medium">
        <span aria-hidden="true" className="h-4 w-1 rounded-full bg-accent" />
        {title}
      </h3>
      <div className="mt-3">{children}</div>
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

// The plan: what I will do as a numbered path, and what I will skip as quiet "skipped" cards
export function PlanView({ out }: { out: PhaseOutput }) {
  const steps = out.plan.will_do;
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <p className="label-small mb-3">What I will do</p>
        <ol>
          {steps.map((t, i) => (
            <li key={i} className="relative flex gap-4 pb-4 last:pb-0">
              {i < steps.length - 1 && <span aria-hidden="true" className="absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-px bg-[#d9d9f5]" />}
              <span aria-hidden="true" className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[14px] font-medium text-[var(--accent-ink)] ring-4 ring-canvas">{i + 1}</span>
              <p className="pt-1 text-[16px] leading-snug">{t}</p>
            </li>
          ))}
        </ol>
      </div>
      <div className="lg:col-span-2">
        <p className="label-small mb-3">What I will skip, and why</p>
        {out.plan.will_skip.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-4 text-muted">Nothing. I did every part.</p>
        ) : (
          <ul className="space-y-2">
            {out.plan.will_skip.map((s, i) => (
              <li key={i} className="rounded-xl border border-dashed border-[#d6d6cf] bg-[#f6f6f2] p-3">
                <p className="text-[15px] font-medium text-muted line-through decoration-[#b5b5ad]">{s.item}</p>
                <p className="mt-0.5 text-[14px] text-muted">{s.why}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
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
        <ProfileGrid profiles={out.user_profiles} />
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
