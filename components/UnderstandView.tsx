import { ProfileGrid, tone as avatarTone } from "@/components/ProfileCard";
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
function FirstFew<T>({ items, n = 4, render, noun }: { items: T[]; n?: number; render: (x: T, i: number) => React.ReactNode; noun: string }) {
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

// One block: a title, one line saying what it is for, then the content
function Block({ title, purpose, icon, tone, action, children }: { title: string; purpose: string; icon: IconName; tone: Tone; action?: boolean; children: React.ReactNode }) {
  const t = TONE[tone];
  return (
    <section aria-label={title} className={`rounded-2xl border bg-card p-5 sm:p-6 ${action ? "border-2" : ""}`} style={{ borderColor: action ? "#f3b3b3" : t.edge }}>
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: t.bg, color: t.fg }}><Icon name={icon} size={19} /></span>
        <div>
          <h3 className="text-[18px] font-medium leading-tight">{title}</h3>
          <p className="note mt-0.5">{purpose}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

// "As staff, I can ask for time off, so that my manager can answer." becomes who, what and why
function parseStory(story: string) {
  const m = story.trim().match(/^as (?:a |an |the )?(.+?),?\s+i (?:can|want to|need to|should be able to)\s+(.+?)(?:,?\s+so (?:that )?(.+?))?\.?$/i);
  return m ? { who: m[1], what: m[2], why: m[3] } : null;
}

// The Work tab: the results, shown in a fixed order. The answer first, then what needs you, then the detail.
export function WorkView({ out, requirement = "", files = [], shortVersion }: { out: UnderstandOutput; requirement?: string; files?: { name: string }[]; shortVersion?: string }) {
  const statement = out.brief.one_line || shortVersion || "";
  const watch = [
    ...out.not_asked_about.map((n) => ({ title: n.topic, text: n.why_it_matters })),
    ...out.edge_cases.map((e) => ({ title: "Tricky moment", text: e })),
  ];
  const anyTestOnly = [...out.users, ...out.requirements].some((x) => x.label === "Test idea only");
  const tag = (label: string) => (label === "Test idea only" ? null : <Pill label={label} />);

  return (
    <div className="space-y-4">
      {/* 1. The answer */}
      <section aria-label="What I understood" className="rounded-2xl border border-line p-5 sm:p-7" style={{ background: "linear-gradient(135deg, #f6f7ff 0%, #ffffff 70%)" }}>
        <p className="text-[12px] font-medium uppercase tracking-wide text-[var(--accent-ink)]">What I understood</p>
        <p className="mt-2 text-[26px] font-medium leading-tight tracking-tight sm:text-[30px]">{statement || "I'm still reading your request."}</p>
        <details className="group mt-4">
          <summary className="inline-flex cursor-pointer select-none list-none items-center gap-1.5 text-[15px] font-medium text-[var(--accent-ink)] [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">See what you said and the full brief</span>
            <span className="hidden group-open:inline">Hide</span>
            <span aria-hidden="true" className="transition-transform group-open:rotate-180">⌄</span>
          </summary>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-[#f5f7fb] p-4">
              <p className="label-small">You said</p>
              <p className="mt-1 whitespace-pre-wrap text-[15px] leading-snug">{requirement}</p>
              {files.length > 0 && <p className="note mt-2">Documents: {files.map((f) => f.name).join(", ")}</p>}
            </div>
            <div className="rounded-xl bg-[#f5f7fb] p-4">
              <p className="label-small">The full brief</p>
              <p className="mt-1 text-[15px] leading-relaxed">{out.brief.full}</p>
            </div>
          </div>
        </details>
      </section>

      {/* 2. The only block that needs something from you */}
      {out.open_questions.length > 0 && (
        <Block title="Questions for you" purpose="I could not answer these myself. Tell me in the Check-in note below, or say Go ahead and I will keep guessing." icon="message" tone="rose" action>
          <ol className="space-y-2">
            {out.open_questions.map((q, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl px-3 py-2.5 text-[15px] leading-snug" style={{ background: TONE.rose.bg, color: TONE.rose.fg }}>
                <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[13px] font-semibold">{i + 1}</span>{q}
              </li>
            ))}
          </ol>
          <a href="#checkin" className="mt-3 inline-block text-[14px] font-medium text-[var(--accent-ink)] hover:underline">Go to the Check-in ↓</a>
        </Block>
      )}

      {/* 3. Who */}
      {out.users.length > 0 && (
        <Block title="Who it is for" purpose="The people I am designing for. Check I got them right." icon="users" tone="sky">
          <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {out.users.map((x, i) => {
              const [bg, fg] = avatarTone(x.name);
              return (
                <li key={i} className="flex items-start gap-3 rounded-xl border border-line p-3">
                  <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold" style={{ background: bg, color: fg }}>{x.name.trim().charAt(0).toUpperCase()}</span>
                  <p className="min-w-0 text-[15px] leading-snug"><span className="font-medium">{x.name}</span>{tag(x.label)}<span className="mt-0.5 block text-muted">{x.note}</span></p>
                </li>
              );
            })}
          </ul>
          {out.user_profiles.length > 0 && (
            <details className="group mt-4">
              <summary className="cursor-pointer select-none list-none text-[14px] font-medium text-[var(--accent-ink)] [&::-webkit-details-marker]:hidden">
                <span className="group-open:hidden">See the full user profiles ({out.user_profiles.length})</span>
                <span className="hidden group-open:inline">Hide the user profiles</span>
              </summary>
              <div className="mt-4"><ProfileGrid profiles={out.user_profiles} /></div>
            </details>
          )}
        </Block>
      )}

      {/* 4. What it must do */}
      {out.requirements.length > 0 && (
        <Block title="What it needs to do" purpose="The must-haves. If one is wrong or missing, say so in the Check-in." icon="list-checks" tone="green" >
          <ul className="space-y-3">
            <FirstFew
              items={out.requirements}
              noun="must-haves"
              render={(r) => {
                const s = parseStory(r.story);
                return (
                  <li key={r.id} className="rounded-xl border border-line p-3.5">
                    <div className="flex items-start gap-3">
                      <span className="rounded-lg px-2 py-0.5 text-[13px] font-semibold" style={{ background: TONE.green.bg, color: TONE.green.fg }}>{r.id}</span>
                      <p className="min-w-0 flex-1 text-[16px] leading-snug">
                        {s ? <><span className="text-muted">{s.who}: </span><span className="font-medium">{s.what}</span>{s.why && <span className="block text-[14px] text-muted">so that {s.why}</span>}</> : r.story}
                      </p>
                      {tag(r.label)}
                    </div>
                    {r.done_checks.length > 0 && (
                      <details className="group mt-2 pl-11">
                        <summary className="cursor-pointer select-none list-none text-[13px] font-medium text-[var(--accent-ink)] [&::-webkit-details-marker]:hidden">
                          <span className="group-open:hidden">How we know it is done ({r.done_checks.length})</span>
                          <span className="hidden group-open:inline">Hide</span>
                        </summary>
                        <ul className="mt-2 space-y-1">
                          {r.done_checks.map((c, i) => (
                            <li key={i} className="flex items-start gap-2 text-[14px] leading-snug text-muted"><Icon name="check" size={15} className="mt-0.5 shrink-0" />{c}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </li>
                );
              }}
            />
          </ul>
        </Block>
      )}

      {/* 5. How we will know it worked */}
      {out.success_measures.length > 0 && (
        <Block title="How we will know it worked" purpose="What success looks like once people use it." icon="target" tone="amber">
          <ol className="space-y-2">
            {out.success_measures.map((m, i) => (
              <li key={i} className="flex items-start gap-3 text-[16px] leading-snug">
                <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold" style={{ background: TONE.amber.bg, color: TONE.amber.fg }}>{i + 1}</span>{m}
              </li>
            ))}
          </ol>
        </Block>
      )}

      {/* 6. Things to watch */}
      {watch.length > 0 && (
        <Block title="Watch out for" purpose="Things you may not have asked about, and moments where it could go wrong. Nothing to answer, just read." icon="alert" tone="amber">
          <ul className="space-y-3">
            <FirstFew
              items={watch}
              noun="things"
              render={(w, i) => (
                <li key={i} className="flex items-start gap-3 text-[15px] leading-snug">
                  <Icon name="alert" size={17} className="mt-0.5 shrink-0 text-[#92400e]" />
                  <p><span className="font-medium">{w.title === "Tricky moment" ? w.text : w.title}</span>{w.title !== "Tricky moment" && <span className="block text-muted">{w.text}</span>}</p>
                </li>
              )}
            />
          </ul>
        </Block>
      )}

      {out.another_view && (
        <details className="group rounded-2xl border border-dashed border-[#d5dbe6] p-5">
          <summary className="flex cursor-pointer select-none list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
            <Icon name="lightbulb" size={19} className="text-[#92400e]" />
            <span className="font-medium">Another way to look at it</span>
            <span className="note ml-auto"><span className="group-open:hidden">Show</span><span className="hidden group-open:inline">Hide</span></span>
          </summary>
          <p className="mt-3 text-[16px] leading-snug">{out.another_view}</p>
        </details>
      )}

      {anyTestOnly && <p className="note px-1">Some items here are test ideas only, made up to try the app. They have no tag.</p>}
    </div>
  );
}
