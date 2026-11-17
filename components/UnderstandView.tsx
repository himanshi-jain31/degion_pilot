import { split, tone as avatarTone } from "@/components/ProfileCard";
import { Icon, type IconName } from "@/components/Icons";
import type { PhaseOutput, UnderstandOutput } from "@/lib/storage";

export function Pill({ label }: { label: string }) {
  // Checked has a source (green), My guess is inferred (amber), Test idea only is made up for testing (grey)
  const kind = label === "Checked" ? "pill-ok" : label === "Test idea only" ? "pill-test" : "pill-wait";
  return <span className={`pill ${kind} ml-2 !text-[13px] align-middle`}>{label}</span>;
}

// Soft colour families for section icons and panels
export type Tone = "indigo" | "green" | "amber" | "rose" | "sky" | "slate";
export const TONE: Record<Tone, { bg: string; fg: string; edge: string }> = {
  indigo: { bg: "#eef0ff", fg: "#4338ca", edge: "var(--line)" },
  green: { bg: "#ecfdf3", fg: "#166534", edge: "var(--line)" },
  amber: { bg: "#fff7e6", fg: "#92400e", edge: "var(--line)" },
  rose: { bg: "#fef2f2", fg: "#b91c1c", edge: "var(--line)" },
  sky: { bg: "#ecf6ff", fg: "#075985", edge: "var(--line)" },
  slate: { bg: "#f3f5f9", fg: "#3f3f46", edge: "var(--line)" },
};

export function Section({ title, children, icon, tone = "indigo", hint }: { title: string; children: React.ReactNode; icon?: IconName; tone?: Tone; hint?: string }) {
  const t = TONE[tone];
  return (
    <section className="mt-4 rounded-2xl border bg-card p-5 first:mt-0 sm:p-6" style={{ borderColor: t.edge }}>
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
              <span aria-hidden="true" className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[14px] font-medium text-[var(--accent-ink)] ring-4 ring-white">{i + 1}</span>
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
              <li key={i} className="rounded-xl border border-dashed border-[#d5dbe6] bg-[#f5f7fb] p-3">
                <p className="text-[15px] font-medium text-muted line-through decoration-[#b3bccb]">{s.item}</p>
                <p className="mt-0.5 text-[14px] text-muted">{s.why}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// Show the first few items, keep the rest one click away
export function FirstFew<T>({ items, n = 4, render, noun }: { items: T[]; n?: number; render: (x: T, i: number) => React.ReactNode; noun: string }) {
  return (
    <>
      {items.slice(0, n).map((x, i) => render(x, i))}
      {items.length > n && (
        <li className="list-none">
          <details className="group">
            <summary className="cursor-pointer select-none list-none py-1 text-[14px] font-medium text-[var(--accent-ink)] [&::-webkit-details-marker]:hidden">
              <span className="group-open:hidden">See all {items.length} {noun}</span>
              <span className="hidden group-open:inline">Show fewer</span>
            </summary>
            <ul className="mt-3 space-y-3">{items.slice(n).map((x, i) => render(x, i + n))}</ul>
          </details>
        </li>
      )}
    </>
  );
}

// One numbered block: a plain question as the title, one line saying what it is for, then the content
export function Block({ n, title, purpose, children }: { n: number; title: string; purpose: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="rounded-2xl border border-line bg-card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[14px] font-semibold text-[var(--accent-ink)]">{n}</span>
        <div>
          <h3 className="text-[19px] font-medium leading-tight">{title}</h3>
          <p className="note mt-0.5">{purpose}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

// "As staff, I can ask for time off, so that my manager can answer." becomes who and what
function parseStory(story: string) {
  const m = story.trim().match(/^as (?:a |an |the )?(.+?),?\s+i (?:can|want to|need to|should be able to)\s+(.+?)(?:,?\s+so (?:that )?(.+?))?\.?$/i);
  return m ? { who: m[1], what: m[2].charAt(0).toUpperCase() + m[2].slice(1) } : null;
}

type Person = { name: string; role: string; wants?: string; annoyed: string[]; note?: string; label: string };

// The Work tab, in the order a designer thinks: the problem, the people, the needs, what good looks like, then what needs a look.
export function WorkView({ out }: { out: UnderstandOutput; requirement?: string; files?: { name: string }[]; shortVersion?: string }) {
  const statement = out.brief.one_line;

  // One card per person: the longer profile when there is one, the short note when there is not
  const people: Person[] = [
    ...out.user_profiles.map((p) => ({ ...split(p.name), wants: p.goal, annoyed: p.frustrations, label: p.label })),
    ...out.users
      .filter((u) => {
        const stem = (t: string) => split(t).name.toLowerCase().replace(/[^a-z]/g, "").slice(0, 4);
        return !out.user_profiles.some((p) => stem(p.name) === stem(u.name) || split(p.name).role.toLowerCase().replace(/[^a-z]/g, "").startsWith(stem(u.name)));
      })
      .map((u) => ({ ...split(u.name), note: u.note, annoyed: [] as string[], label: u.label })),
  ];

  const watch = [
    ...out.not_asked_about.map((n) => ({ title: n.topic, text: n.why_it_matters })),
    ...out.edge_cases.map((e) => ({ title: e, text: "" })),
  ];
  const anyTestOnly = [...out.users, ...out.user_profiles, ...out.requirements].some((x) => x.label === "Test idea only");
  const tag = (label: string) => (label === "Test idea only" ? null : <Pill label={label} />);

  return (
    <div className="space-y-4">
      {out.open_questions.length > 0 && (
        <a href="#questions" className="flex items-center gap-3 rounded-2xl border-2 border-[#f3b3b3] px-5 py-3 text-[15px] font-medium" style={{ background: TONE.rose.bg, color: TONE.rose.fg }}>
          <Icon name="message" size={18} />
          {out.open_questions.length === 1 ? "1 question needs your answer" : `${out.open_questions.length} questions need your answer`}
          <span className="ml-auto" aria-hidden="true">↓</span>
        </a>
      )}

      <Block n={1} title="What we are solving" purpose="The problem in plain words.">
        <p className="text-[24px] font-medium leading-tight tracking-tight sm:text-[28px]">{statement || "I'm still reading your request."}</p>
        {out.brief.full && <p className="mt-3 max-w-3xl text-[16px] leading-relaxed text-muted">{out.brief.full}</p>}
        {out.another_view && (
          <p className="mt-4 flex items-start gap-2 rounded-xl px-3.5 py-3 text-[15px] leading-snug" style={{ background: TONE.amber.bg, color: TONE.amber.fg }}>
            <Icon name="lightbulb" size={18} className="mt-0.5 shrink-0" /><span><span className="font-medium">Another way to see it: </span>{out.another_view}</span>
          </p>
        )}
      </Block>

      {people.length > 0 && (
        <Block n={2} title="Who it is for" purpose="The people we design for. Check we have the right ones.">
          <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {people.map((x, i) => {
              const [bg, fg] = avatarTone(x.name + x.role);
              return (
                <li key={i} className="flex flex-col gap-3 rounded-xl border border-line p-4">
                  <div className="flex items-center gap-3">
                    <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[19px] font-semibold" style={{ background: bg, color: fg }}>{x.name.charAt(0).toUpperCase()}</span>
                    <p className="min-w-0 leading-tight"><span className="text-[17px] font-medium">{x.name}</span>{tag(x.label)}{x.role && <span className="block text-[14px] text-muted">{x.role}</span>}</p>
                  </div>
                  {x.wants && <p className="text-[15px] leading-snug"><span className="label-small mr-1.5">Wants</span>{x.wants}</p>}
                  {x.note && <p className="text-[15px] leading-snug text-muted">{x.note}</p>}
                  {x.annoyed.length > 0 && <p className="text-[15px] leading-snug"><span className="label-small mr-1.5">Annoyed by</span>{x.annoyed.slice(0, 2).join(", ")}</p>}
                </li>
              );
            })}
          </ul>
        </Block>
      )}

      {out.requirements.length > 0 && (
        <Block n={3} title="What it must do" purpose="The must-haves. If one is wrong or missing, use Add a note below.">
          <ul className="space-y-2">
            <FirstFew
              items={out.requirements}
              noun="must-haves"
              n={5}
              render={(r) => {
                const s = parseStory(r.story);
                return (
                  <li key={r.id} className="flex items-start gap-3 rounded-xl bg-[#f7f9fc] px-4 py-3 text-[16px] leading-snug">
                    <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[12px]" style={{ background: TONE.green.bg, color: TONE.green.fg }}><Icon name="check" size={13} /></span>
                    <span className="min-w-0 flex-1">{s ? s.what : r.story}{s && <span className="ml-2 text-[14px] text-muted">for {s.who}</span>}</span>
                    {tag(r.label)}
                  </li>
                );
              }}
            />
          </ul>
        </Block>
      )}

      {out.success_measures.length > 0 && (
        <Block n={4} title="What good looks like" purpose="How we will know it worked once people use it.">
          <ul className="grid gap-3 md:grid-cols-2">
            {out.success_measures.map((m, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl border border-line p-4 text-[16px] font-medium leading-snug">
                <Icon name="target" size={19} className="mt-0.5 shrink-0 text-[#92400e]" />{m}
              </li>
            ))}
          </ul>
        </Block>
      )}

      {(out.open_questions.length > 0 || watch.length > 0) && (
        <Block n={5} title="Before we go on" purpose="What still needs a look.">
          <div className={`grid items-start gap-4 ${out.open_questions.length > 0 && watch.length > 0 ? "lg:grid-cols-2" : ""}`}>
            {out.open_questions.length > 0 && (
              <div id="questions" className="scroll-mt-6 rounded-xl border-2 border-[#f3b3b3] p-4" style={{ background: TONE.rose.bg }}>
                <p className="font-medium" style={{ color: TONE.rose.fg }}>Needs your answer</p>
                <p className="note mb-3">Use Add a note below, or choose Go ahead and I will keep guessing.</p>
                <ol className="space-y-2">
                  {out.open_questions.map((q, i) => (
                    <li key={i} className="flex items-start gap-3 text-[16px] leading-snug" style={{ color: TONE.rose.fg }}>
                      <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[13px] font-semibold">{i + 1}</span>{q}
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {watch.length > 0 && (
              <div className="rounded-xl border border-line p-4">
                <p className="font-medium">Worth keeping in mind</p>
                <p className="note mb-3">Nothing to answer. Just good to know.</p>
                <ul className="space-y-2.5">
                  <FirstFew
                    items={watch}
                    noun="things"
                    n={4}
                    render={(w, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[15px] leading-snug">
                        <Icon name="alert" size={16} className="mt-0.5 shrink-0 text-[#92400e]" />
                        <p><span className="font-medium">{w.title.charAt(0).toUpperCase() + w.title.slice(1)}</span>{w.text && <span className="block text-muted">{w.text}</span>}</p>
                      </li>
                    )}
                  />
                </ul>
              </div>
            )}
          </div>
        </Block>
      )}

      {anyTestOnly && <p className="note px-1">Some items here are test ideas only, made up to try the app. They have no tag.</p>}
    </div>
  );
}
