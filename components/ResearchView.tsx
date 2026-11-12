"use client";

import { useState } from "react";
import type { Finding, ResearchOutput } from "@/lib/storage";
import { Icon, type IconName } from "@/components/Icons";
import { ProfileGrid } from "@/components/ProfileCard";
import { Section, TONE, type Tone } from "@/components/UnderstandView";
import { capFirst } from "@/lib/names";

const isWebLink = (u: string) => /^https?:\/\//i.test(u);

const LABELS = ["Checked", "My guess", "Test idea only"] as const;
const LABEL_COLOUR: Record<string, string> = { Checked: "#16a34a", "My guess": "#d97706", "Test idea only": "#8b9bd9" };
const LABEL_HELP: Record<string, string> = { Checked: "has a source", "My guess": "I worked it out", "Test idea only": "made up for testing" };
const LABEL_PILL: Record<string, string> = { Checked: "pill-ok", "My guess": "pill-wait", "Test idea only": "pill-test" };

// One icon for each kind of finding, picked from its name
function typeIcon(t: string): IconName {
  const s = t.toLowerCase();
  if (/compet/.test(s)) return "compass";
  if (/pattern/.test(s)) return "layout";
  if (/people|qual|say/.test(s)) return "message";
  if (/number|quant|data|stat/.test(s)) return "chart";
  if (/access/.test(s)) return "eye";
  return "search";
}

// Each kind of finding has its own soft colour from the app palette
function typeTone(t: string): Tone {
  const s = t.toLowerCase();
  if (/compet/.test(s)) return "indigo";
  if (/pattern/.test(s)) return "sky";
  if (/people|qual|say/.test(s)) return "green";
  if (/number|quant|data|stat/.test(s)) return "amber";
  if (/access/.test(s)) return "rose";
  return "slate";
}

// A ring that shows how many findings are backed by a source, and how many are only guesses
function Donut({ findings }: { findings: Finding[] }) {
  const r = 46, c = 2 * Math.PI * r, total = findings.length;
  // where each coloured piece of the ring starts
  const pieces = LABELS.map((l) => ({ l, n: findings.filter((f) => f.label === l).length })).filter((p) => p.n > 0);
  const starts = pieces.map((_, i) => pieces.slice(0, i).reduce((sum, p) => sum + (p.n / total) * c, 0));
  return (
    <svg viewBox="0 0 120 120" role="img" aria-label={LABELS.map((l) => `${findings.filter((f) => f.label === l).length} ${l}`).join(", ")} className="h-[112px] w-[112px] shrink-0 xl:h-[148px] xl:w-[148px]">
      <circle cx="60" cy="60" r={r} fill="none" stroke="#eef0f6" strokeWidth="12" />
      {pieces.map((p, i) => {
        const len = Math.max((p.n / total) * c - 3, 0);
        return <circle key={p.l} cx="60" cy="60" r={r} fill="none" stroke={LABEL_COLOUR[p.l]} strokeWidth="12" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-starts[i]} strokeLinecap="round" transform="rotate(-90 60 60)" />;
      })}
      <text x="60" y="58" textAnchor="middle" fontSize="28" fontWeight="600" fill="#0e1a2b">{total}</text>
      <text x="60" y="76" textAnchor="middle" fontSize="11" fill="#5d6a7c">{total === 1 ? "finding" : "findings"}</text>
    </svg>
  );
}

// Three small bars for how much to trust a finding
function Trust({ level }: { level: Finding["confidence"] }) {
  const n = level === "High" ? 3 : level === "Medium" ? 2 : 1;
  const colour = level === "High" ? "#16a34a" : level === "Medium" ? "#d97706" : "#e07a7a";
  return (
    <span className="flex items-center gap-1.5 text-[12px] text-muted" aria-label={`Trust: ${level}`}>
      <span aria-hidden="true" className="flex items-end gap-0.5">
        {[1, 2, 3].map((i) => <span key={i} className="w-1 rounded-sm" style={{ height: 4 + i * 3, background: i <= n ? colour : "#dfe3ec" }} />)}
      </span>
      Trust: {level}
    </span>
  );
}

function FindingCard({ f, n }: { f: Finding; n: number }) {
  return (
    <li id={`finding-${n}`} className="flex scroll-mt-24 flex-col gap-3 rounded-2xl border border-[var(--line)] bg-white p-4 transition target:ring-2 target:ring-[var(--accent)] hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: TONE[typeTone(f.type)].bg, color: TONE[typeTone(f.type)].fg }}><Icon name={typeIcon(f.type)} size={15} /></span>
          <span className="truncate text-[13px] font-medium" style={{ color: TONE[typeTone(f.type)].fg }}>{capFirst(f.type || "Finding")}</span>
        </span>
        <span className={`pill ${LABEL_PILL[f.label] ?? "pill-wait"} shrink-0 !px-2.5 !py-0.5 !text-[12px]`}>{f.label}</span>
      </div>
      <p className="text-[17px] font-medium leading-snug">{capFirst(f.finding)}</p>
      {f.check_note && <p className="flex gap-2 rounded-lg bg-[var(--wait-soft)] px-2.5 py-2 text-[13px] leading-snug text-[var(--wait-ink)]"><Icon name="alert" size={14} className="mt-0.5" />{f.check_note}</p>}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] pt-3">
        {isWebLink(f.source_url) ? (
          <a href={f.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[var(--line)] px-2.5 py-1 text-[13px] hover:border-[#cdd3e0]">
            <span aria-hidden="true">↗</span><span className="truncate">{f.source_title || f.source_url}</span>
          </a>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f3f5f9] px-2.5 py-1 text-[13px] text-muted">{f.source_title || "No link given"}</span>
        )}
        <Trust level={f.confidence} />
      </div>
    </li>
  );
}

function Numbered({ items }: { items: string[] }) {
  return (
    <ol className="grid gap-2 lg:grid-cols-2">
      {items.map((q, i) => (
        <li key={i} className="flex items-start gap-3 rounded-xl bg-white px-3 py-2.5 text-[15px] leading-snug">
          <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eef0ff] text-[12px] font-semibold text-[var(--accent-ink)]">{i + 1}</span>{q}
        </li>
      ))}
    </ol>
  );
}

function KitTile({ title, icon, children }: { title: string; icon: IconName; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-[#f5f7fb] p-4">
      <p className="mb-3 flex items-center gap-2 text-[15px] font-medium"><span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[var(--muted)]"><Icon name={icon} size={15} /></span>{title}</p>
      {children}
    </div>
  );
}

// The Work part for Phase 2
export function ResearchWork({ out }: { out: ResearchOutput }) {
  const [type, setType] = useState("All");
  const [label, setLabel] = useState("All");
  const total = out.findings.length;
  const numbered = out.findings.map((f, i) => ({ f, n: i + 1 }));
  const counts = Object.fromEntries(LABELS.map((l) => [l, out.findings.filter((f) => f.label === l).length])) as Record<string, number>;
  const types = [...new Set(out.findings.map((f) => f.type || "Other"))];
  const perType = types.map((t) => ({ t, n: out.findings.filter((f) => (f.type || "Other") === t).length }));
  const maxType = Math.max(...perType.map((x) => x.n), 1);
  const shown = numbered.filter((x) => (type === "All" || (x.f.type || "Other") === type) && (label === "All" || x.f.label === label));
  const reset = () => { setType("All"); setLabel("All"); };

  return (
    <div>
      <Section title="What I found" icon="search" tone="sky" hint={`${total} ${total === 1 ? "finding" : "findings"}`}>
        {/* The picture first: how much is backed by a source, and what it covers */}
        <div className="grid gap-6 md:grid-cols-2 md:items-center xl:gap-10">
          <div className="flex items-center gap-3 xl:gap-5">
            <Donut findings={out.findings} />
            <ul className="space-y-2.5">
              {LABELS.map((l) => (
                <li key={l} className="flex items-center gap-2.5">
                  <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: LABEL_COLOUR[l] }} />
                  <span className="text-[20px] font-semibold leading-none xl:text-[22px]">{counts[l]}</span>
                  <span className="text-[14px] leading-tight"><span className="block font-medium">{l}</span><span className="text-[12px] text-muted">{LABEL_HELP[l]}</span></span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="eyebrow mb-3">What it covers</p>
            <ul className="space-y-2.5">
              {perType.map(({ t, n }) => (
                <li key={t} className="flex items-center gap-3 text-[14px]">
                  <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: TONE[typeTone(t)].bg, color: TONE[typeTone(t)].fg }}><Icon name={typeIcon(t)} size={15} /></span>
                  <span className="w-24 shrink-0 truncate xl:w-32">{capFirst(t)}</span>
                  <span className="h-2 min-w-0 flex-1 rounded-full bg-[#eef0f6]"><span className="block h-2 rounded-full" style={{ width: `${(n / maxType) * 100}%`, background: TONE[typeTone(t)].fg, opacity: 0.55 }} /></span>
                  <span className="w-5 text-right font-medium">{n}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        <p className={`mt-6 flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-[14px] leading-snug ${counts.Checked === 0 ? "bg-[var(--wait-soft)] text-[var(--wait-ink)]" : "bg-[var(--ok-soft)] text-[var(--ok-ink)]"}`}>
          <Icon name={counts.Checked === 0 ? "alert" : "check"} size={17} className="shrink-0" />
          {counts.Checked === 0
            ? "None of these has a source yet. Treat them as ideas to check, not facts."
            : `${counts.Checked} of ${total} ${counts.Checked === 1 ? "has" : "have"} a source you can open.`}
        </p>

        {/* Pick what to look at */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-5">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Show a topic">
            {["All", ...types].map((t) => (
              <button key={t} onClick={() => setType(t)} aria-pressed={type === t} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[14px] transition-colors ${type === t ? "border-transparent font-medium" : "border-[var(--line)] bg-white text-muted hover:text-ink"}`} style={type === t ? { background: t === "All" ? "#eef0ff" : TONE[typeTone(t)].bg, color: t === "All" ? "#4338ca" : TONE[typeTone(t)].fg } : undefined}>
                {t !== "All" && <Icon name={typeIcon(t)} size={14} />}
                {t === "All" ? "All" : capFirst(t)}
                <span className="text-[12px] opacity-70">{t === "All" ? total : perType.find((x) => x.t === t)?.n}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-full bg-[#f3f5f9] p-1" role="group" aria-label="Show by label">
            {["All", ...LABELS].map((l) => (
              <button key={l} onClick={() => setLabel(l)} aria-pressed={label === l} className={`rounded-full px-3 py-1 text-[13px] transition-colors ${label === l ? "bg-white font-medium text-ink shadow-[0_1px_2px_rgba(15,27,45,0.1)]" : "text-muted hover:text-ink"}`}>{l}</button>
            ))}
          </div>
        </div>

        {shown.length === 0 ? (
          <p className="note mt-5">Nothing matches this choice. <button onClick={reset} className="underline">Show everything</button></p>
        ) : (
          <ul className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {shown.map((x) => <FindingCard key={x.n} f={x.f} n={x.n} />)}
          </ul>
        )}
      </Section>

      {out.key_insights.length > 0 && (
        <Section title="Key insights" icon="lightbulb" tone="amber" hint="what the findings add up to">
          <ul className="grid gap-3 lg:grid-cols-2">
            {out.key_insights.map((k, i) => {
              const refs = k.based_on.map((b) => b.match(/\d+/)?.[0]).filter((x): x is string => !!x && Number(x) >= 1 && Number(x) <= total);
              const backed = refs.some((x) => out.findings[Number(x) - 1].label === "Checked");
              return (
                <li key={i} className="flex flex-col gap-3 rounded-2xl border border-[var(--line)] bg-white p-4">
                  <div className="flex items-start gap-3">
                    <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: TONE.amber.bg, color: TONE.amber.fg }}><Icon name="lightbulb" size={18} /></span>
                    <p className="pt-1 text-[17px] font-medium leading-snug">{capFirst(k.insight)}</p>
                  </div>
                  <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-3">
                    <span className="text-[13px] text-muted">Based on</span>
                    {refs.map((x) => (
                      <a key={x} href={`#finding-${x}`} onClick={reset} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] px-2.5 py-1 text-[13px] hover:border-[#cdd3e0]">
                        <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: LABEL_COLOUR[out.findings[Number(x) - 1].label] }} />Finding {x}
                      </a>
                    ))}
                    {refs.length > 0 && <span className={`pill ml-auto ${backed ? "pill-ok" : "pill-wait"} !px-2.5 !py-0.5 !text-[12px]`}>{backed ? "Has a source" : "No source yet"}</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      {out.updated_user_profiles.length > 0 && (
        <Section title="User profiles, updated with what I found" icon="users" tone="indigo">
          <ProfileGrid profiles={out.updated_user_profiles} />
        </Section>
      )}

      <Section title="Kit for talking to real users" icon="clipboard" tone="green">
        <div className="grid gap-3 lg:grid-cols-2">
          {out.research_kit.goals.length > 0 && (
            <KitTile title="What we want to learn" icon="target">
              <ul className="space-y-2">
                {out.research_kit.goals.map((g, i) => (
                  <li key={i} className="flex items-start gap-2.5 rounded-xl bg-white px-3 py-2.5 text-[15px] leading-snug"><Icon name="check" size={15} className="mt-0.5 text-[var(--ok)]" />{g}</li>
                ))}
              </ul>
            </KitTile>
          )}
          {out.research_kit.who_to_recruit && (
            <KitTile title="Who to ask" icon="users">
              <p className="rounded-xl bg-white px-3 py-2.5 text-[15px] leading-snug">{out.research_kit.who_to_recruit}</p>
            </KitTile>
          )}
          {out.research_kit.interview_questions.length > 0 && (
            <div className="lg:col-span-2">
              <KitTile title="Interview questions" icon="message"><Numbered items={out.research_kit.interview_questions} /></KitTile>
            </div>
          )}
          {out.research_kit.survey_questions.length > 0 && (
            <div className="lg:col-span-2">
              <KitTile title="Short survey (if useful)" icon="list-checks"><Numbered items={out.research_kit.survey_questions} /></KitTile>
            </div>
          )}
        </div>
      </Section>

      {out.could_not_find.length > 0 && (
        <Section title="What I could not find" icon="help" tone="rose">
          <ul className="grid gap-2 md:grid-cols-2">
            {out.could_not_find.map((t, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl bg-[var(--bad-soft)] px-3 py-2.5 text-[15px] leading-snug text-[var(--bad-ink)]">
                <span aria-hidden="true" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[12px] font-semibold">?</span>{t}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
