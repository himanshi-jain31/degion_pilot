import { ProfileGrid, tone as avatarTone } from "@/components/ProfileCard";
import { Icon, type IconName } from "@/components/Icons";
import type { PhaseOutput, UnderstandOutput } from "@/lib/storage";

export function Pill({ label }: { label: string }) {
  // Checked has a source (green), My guess is inferred (amber), Test idea only is made up for testing (grey)
  const kind = label === "Checked" ? "pill-ok" : label === "Test idea only" ? "pill-idle" : "pill-wait";
  return <span className={`pill ${kind} ml-2 !text-[13px] align-middle`}>{label}</span>;
}

// Soft colour families for section icons and panels
export type Tone = "indigo" | "green" | "amber" | "rose" | "sky" | "slate";
export const TONE: Record<Tone, { bg: string; fg: string; edge: string }> = {
  indigo: { bg: "#eef0ff", fg: "#4338ca", edge: "#d9ddff" },
  green: { bg: "#ecfdf3", fg: "#166534", edge: "#c7efd6" },
  amber: { bg: "#fff7e6", fg: "#92400e", edge: "#f5dca8" },
  rose: { bg: "#fef2f2", fg: "#b91c1c", edge: "#f6cccc" },
  sky: { bg: "#ecf6ff", fg: "#075985", edge: "#c8e3f8" },
  slate: { bg: "#f4f4f0", fg: "#3f3f46", edge: "#e4e4de" },
};

export function Section({ title, children, icon, tone = "indigo", hint }: { title: string; children: React.ReactNode; icon?: IconName; tone?: Tone; hint?: string }) {
  const t = TONE[tone];
  return (
    <section className="mt-8 border-t border-line pt-8 first:mt-0 first:border-0 first:pt-0">
      <h3 className="flex items-center gap-3 text-[18px] font-medium">
        {icon ? (
          <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: t.bg, color: t.fg }}><Icon name={icon} size={19} /></span>
        ) : (
          <span aria-hidden="true" className="h-4 w-1 rounded-full bg-accent" />
        )}
        <span>{title}{hint && <span className="note ml-3 font-normal">{hint}</span>}</span>
      </h3>
      <div className="mt-4">{children}</div>
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
  const card = "rounded-2xl border bg-card p-4 transition duration-150 hover:-translate-y-0.5 hover:shadow-md";
  return (
    <div>
      <Section title="The brief" icon="file-text" tone="indigo">
        <div className="rounded-2xl border p-5 sm:p-6" style={{ borderColor: TONE.indigo.edge, background: "linear-gradient(135deg, #eef0ff 0%, #ffffff 70%)" }}>
          <p className="text-[22px] font-medium leading-snug tracking-tight">{out.brief.one_line}</p>
          {out.brief.full && (
            <details className="group mt-4">
              <summary className="inline-flex cursor-pointer select-none list-none items-center gap-1.5 text-[15px] font-medium text-[var(--accent-ink)] [&::-webkit-details-marker]:hidden">
                <span className="group-open:hidden">Read the full brief</span>
                <span className="hidden group-open:inline">Hide the full brief</span>
                <span aria-hidden="true" className="transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <p className="mt-3 max-w-3xl whitespace-pre-line leading-relaxed">{out.brief.full}</p>
            </details>
          )}
        </div>
      </Section>

      {out.another_view && (
        <Section title="Another view" icon="lightbulb" tone="amber">
          <div className="flex gap-3 rounded-2xl border p-4 sm:p-5" style={{ background: TONE.amber.bg, borderColor: TONE.amber.edge, color: TONE.amber.fg }}>
            <Icon name="lightbulb" size={20} className="mt-0.5" />
            <p className="text-[16px] leading-snug">{out.another_view}</p>
          </div>
        </Section>
      )}

      <Section title="Who will use this" icon="users" tone="sky">
        <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {out.users.map((u, i) => {
            const [bg, fg] = avatarTone(u.name);
            return (
              <li key={i} className={`${card} flex items-start gap-3`} style={{ borderColor: TONE.sky.edge }}>
                <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[18px] font-semibold" style={{ background: bg, color: fg }}>{u.name.trim().charAt(0).toUpperCase()}</span>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-x-1 font-medium leading-snug">{u.name}<Pill label={u.label} /></p>
                  <p className="mt-1 text-[15px] leading-snug text-muted">{u.note}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="User profiles (first draft)" icon="target" tone="indigo">
        <ProfileGrid profiles={out.user_profiles} />
      </Section>

      <Section title="Requirements" icon="list-checks" tone="green" hint={`${out.requirements.length} things it must do`}>
        <ul className="grid gap-3 xl:grid-cols-2">
          {out.requirements.map((r) => (
            <li key={r.id} className={card} style={{ borderColor: TONE.green.edge }}>
              <div className="flex items-start gap-3">
                <span className="rounded-lg px-2 py-1 text-[13px] font-semibold" style={{ background: TONE.green.bg, color: TONE.green.fg }}>{r.id}</span>
                <p className="min-w-0 flex-1 text-[16px] leading-snug">{r.story}<Pill label={r.label} /></p>
              </div>
              {r.done_checks.length > 0 && (
                <details className="group mt-3">
                  <summary className="flex cursor-pointer select-none list-none items-center gap-2 text-[14px] font-medium [&::-webkit-details-marker]:hidden" style={{ color: TONE.green.fg }}>
                    <span aria-hidden="true" className="transition-transform group-open:rotate-90">›</span>
                    Done when ({r.done_checks.length})
                  </summary>
                  <ul className="mt-2 space-y-1.5">
                    {r.done_checks.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-[14px] leading-snug" style={{ background: TONE.green.bg }}>
                        <Icon name="check" size={15} className="mt-0.5" />{c}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </li>
          ))}
        </ul>
      </Section>

      {out.edge_cases.length > 0 && (
        <Section title="Tricky moments" icon="alert" tone="amber" hint="empty, error, slow and more">
          <ul className="grid gap-2 md:grid-cols-2 2xl:grid-cols-3">
            {out.edge_cases.map((e, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl border p-3 text-[15px] leading-snug transition hover:-translate-y-0.5 hover:shadow-md" style={{ background: TONE.amber.bg, borderColor: TONE.amber.edge, color: TONE.amber.fg }}>
                <Icon name="alert" size={17} className="mt-0.5" />{e}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {out.not_asked_about.length > 0 && (
        <Section title="Things you may not have asked about" icon="help" tone="sky">
          <ul className="grid gap-3 md:grid-cols-2">
            {out.not_asked_about.map((n, i) => (
              <li key={i} className={card} style={{ borderColor: TONE.sky.edge }}>
                <p className="font-medium" style={{ color: TONE.sky.fg }}>{n.topic}</p>
                <p className="mt-1 text-[15px] leading-snug text-muted">{n.why_it_matters}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {out.success_measures.length > 0 && (
        <Section title="How we will know it worked" icon="check" tone="green">
          <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {out.success_measures.map((m, i) => (
              <li key={i} className="flex items-start gap-3 rounded-2xl border p-4 text-[15px] leading-snug transition hover:-translate-y-0.5 hover:shadow-md" style={{ background: TONE.green.bg, borderColor: TONE.green.edge, color: TONE.green.fg }}>
                <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white"><Icon name="check" size={14} /></span>{m}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {out.open_questions.length > 0 && (
        <Section title="Questions I could not answer" icon="message" tone="rose" hint="Tell me in the Check-in note">
          <ul className="grid gap-3 md:grid-cols-2">
            {out.open_questions.map((q, i) => (
              <li key={i} className="flex items-start gap-3 rounded-2xl border p-4 text-[15px] leading-snug transition hover:-translate-y-0.5 hover:shadow-md" style={{ background: TONE.rose.bg, borderColor: TONE.rose.edge, color: TONE.rose.fg }}>
                <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[13px] font-semibold">?</span>{q}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
