"use client";

import { useState } from "react";
import type { UnderstandOutput } from "@/lib/storage";
import { Icon, type IconName } from "@/components/Icons";
import { Pill, TONE, type Tone } from "@/components/UnderstandView";
import { tone as avatarTone } from "@/components/ProfileCard";

// "As staff, I can ask for time off, so that my manager can answer." becomes who, what and why.
// If a story is written another way, it is shown as it is.
function parseStory(story: string) {
  const m = story.trim().match(/^as (?:a |an |the )?(.+?),?\s+i (?:can|want to|need to|should be able to)\s+(.+?)(?:,?\s+so (?:that )?(.+?))?\.?$/i);
  return m ? { who: m[1], what: m[2], why: m[3] } : null;
}

export function Tile({ title, icon, tone, hint, className = "", children }: { title: string; icon: IconName; tone: Tone; hint?: string; className?: string; children: React.ReactNode }) {
  const t = TONE[tone];
  return (
    <section className={`rounded-2xl border bg-card p-5 sm:p-6 ${className}`} style={{ borderColor: t.edge }} aria-label={title}>
      <h3 className="mb-4 flex items-center gap-3 text-[17px] font-medium">
        <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: t.bg, color: t.fg }}><Icon name={icon} size={19} /></span>
        {title}
        {hint && <span className="note ml-auto font-normal">{hint}</span>}
      </h3>
      {children}
    </section>
  );
}

// A little "ghost" tile for what is still to come, so the board never looks empty
function Waiting({ title, icon, tone, className = "" }: { title: string; icon: IconName; tone: Tone; className?: string }) {
  return (
    <section className={`flex min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#d5dbe6] bg-[#f9fafd] p-5 text-center ${className}`} aria-label={title}>
      <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: TONE[tone].bg, color: TONE[tone].fg }}><Icon name={icon} size={19} /></span>
      <p className="font-medium">{title}</p>
      <p className="note">Appears when Understand has finished.</p>
    </section>
  );
}

export function UnderstoodCanvas({ requirement, files, shortVersion, u, hideNote }: { requirement: string; files: { name: string }[]; shortVersion?: string; u?: UnderstandOutput; hideNote?: boolean }) {
  const [person, setPerson] = useState(0);
  const statement = u?.brief.one_line || shortVersion || "";
  const showShort = !!shortVersion && !!u?.brief.one_line && shortVersion.trim() !== u.brief.one_line.trim();

  return (
    <div className="space-y-4">
      {/* You said, then I understood */}
      <div className="grid overflow-hidden rounded-2xl border border-line bg-card md:grid-cols-[minmax(0,2fr)_auto_minmax(0,3fr)]">
        <div className="relative bg-[#f5f7fb] p-6 sm:p-8">
          <span aria-hidden="true" className="absolute left-4 top-1 select-none font-serif text-[88px] leading-none text-[#dbe0ea]">&ldquo;</span>
          <p className="relative mt-8 text-[12px] font-medium uppercase tracking-wide text-muted">You said</p>
          <p className="relative mt-2 whitespace-pre-wrap text-[19px] leading-snug">{requirement}</p>
          {files.length > 0 && (
            <ul className="relative mt-4 flex flex-wrap gap-1.5" aria-label="Documents">
              {files.map((f) => (
                <li key={f.name} className="flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1 text-[13px]"><Icon name="file-text" size={14} />{f.name}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="relative z-10 flex items-center justify-center bg-gradient-to-b from-[#f5f7fb] to-[#eef0ff] md:bg-gradient-to-r">
          <span aria-hidden="true" className="-my-5 flex h-10 w-10 rotate-90 items-center justify-center rounded-full bg-accent text-[18px] text-white shadow-md md:-mx-5 md:my-0 md:rotate-0">→</span>
        </div>

        <div className="relative p-6 pt-10 sm:p-8 md:pl-12" style={{ background: "radial-gradient(circle at 1px 1px, rgba(79,70,229,0.16) 1px, transparent 0) 0 0/18px 18px, linear-gradient(135deg, #eef0ff 0%, #ffffff 75%)" }}>
          <p className="text-[12px] font-medium uppercase tracking-wide text-[var(--accent-ink)]">What I understood</p>
          {statement ? (
            <p className="mt-2 text-[26px] font-medium leading-tight tracking-tight sm:text-[30px]">{statement}</p>
          ) : (
            <p className="mt-2 text-[20px] text-muted">I&apos;m still reading your request.</p>
          )}
          {showShort && <p className="mt-3 max-w-2xl text-[16px] leading-snug text-muted">{shortVersion}</p>}
          {u?.brief.full && (
            <details className="group mt-4">
              <summary className="inline-flex cursor-pointer select-none list-none items-center gap-1.5 text-[15px] font-medium text-[var(--accent-ink)] [&::-webkit-details-marker]:hidden">
                <span className="group-open:hidden">Read the full brief</span>
                <span className="hidden group-open:inline">Hide the full brief</span>
                <span aria-hidden="true" className="transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <p className="mt-3 max-w-3xl leading-relaxed">{u.brief.full}</p>
            </details>
          )}
        </div>
      </div>

      {!u ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Waiting title="Who it is for" icon="users" tone="sky" />
          <Waiting title="What it needs to do" icon="list-checks" tone="green" />
          <Waiting title="How we will know it worked" icon="target" tone="amber" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-12">
          {/* People */}
          {u.users.length > 0 && (
            <Tile title="Who it is for" icon="users" tone="sky" hint={`${u.users.length} ${u.users.length === 1 ? "person" : "people"}`} className="lg:col-span-5">
              <div className="mb-4 flex -space-x-2" aria-hidden="true">
                {u.users.map((x, i) => {
                  const [bg, fg] = avatarTone(x.name);
                  return <span key={i} className={`flex h-11 w-11 items-center justify-center rounded-full text-[17px] font-semibold ring-2 transition ${i === person ? "ring-accent" : "ring-white"}`} style={{ background: bg, color: fg }}>{x.name.trim().charAt(0).toUpperCase()}</span>;
                })}
              </div>
              <ul className="space-y-2">
                {u.users.map((x, i) => {
                  const [bg, fg] = avatarTone(x.name);
                  const open = person === i;
                  return (
                    <li key={i} className={`rounded-2xl border transition-colors ${open ? "border-[#c8e3f8] bg-[#f4faff]" : "border-line hover:border-[#c8e3f8]"}`}>
                      <button onClick={() => setPerson(open ? -1 : i)} aria-expanded={open} className="flex w-full items-center gap-3 p-3 text-left">
                        <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold" style={{ background: bg, color: fg }}>{x.name.trim().charAt(0).toUpperCase()}</span>
                        <span className="min-w-0 flex-1 font-medium leading-snug">{x.name}<Pill label={x.label} /></span>
                        <span aria-hidden="true" className={`text-muted transition-transform ${open ? "rotate-90" : ""}`}>›</span>
                      </button>
                      {open && <p className="px-3 pb-3 pl-[60px] text-[15px] leading-snug text-muted">{x.note}</p>}
                    </li>
                  );
                })}
              </ul>
            </Tile>
          )}

          {/* Needs */}
          {u.requirements.length > 0 && (
            <Tile title="What it needs to do" icon="list-checks" tone="green" hint={`${u.requirements.length} must-haves`} className={u.users.length > 0 ? "lg:col-span-7" : "lg:col-span-12"}>
              <ul className="space-y-3">
                {u.requirements.map((r) => {
                  const s = parseStory(r.story);
                  const [bg, fg] = avatarTone(s?.who ?? r.id);
                  return (
                    <li key={r.id} className="rounded-2xl border border-[#c7efd6] p-4 transition hover:shadow-md">
                      <div className="flex items-start gap-3">
                        <span className="rounded-lg px-2 py-1 text-[13px] font-semibold" style={{ background: TONE.green.bg, color: TONE.green.fg }}>{r.id}</span>
                        <div className="min-w-0 flex-1">
                          {s ? (
                            <>
                              <p className="flex flex-wrap items-center gap-2 text-[17px] leading-snug">
                                <span className="rounded-full px-2.5 py-0.5 text-[13px] font-medium" style={{ background: bg, color: fg }}>{s.who}</span>
                                <span className="font-medium">{s.what}</span>
                              </p>
                              {s.why && <p className="mt-1.5 flex items-start gap-1.5 text-[15px] leading-snug text-muted"><span aria-hidden="true">↳</span><span>so that {s.why}</span></p>}
                            </>
                          ) : (
                            <p className="text-[16px] leading-snug">{r.story}</p>
                          )}
                        </div>
                        <Pill label={r.label} />
                      </div>
                      {r.done_checks.length > 0 && (
                        <div className="mt-3 pl-11">
                          <p className="mb-1.5 text-[12px] font-medium uppercase tracking-wide" style={{ color: TONE.green.fg }}>Done when</p>
                          <ul className="space-y-1.5">
                            {r.done_checks.map((c, i) => (
                              <li key={i} className="flex items-start gap-2 rounded-lg px-2.5 py-1.5 text-[14px] leading-snug" style={{ background: TONE.green.bg, color: TONE.green.fg }}><Icon name="check" size={15} className="mt-0.5" />{c}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Tile>
          )}

          {/* Success */}
          {u.success_measures.length > 0 && (
            <Tile title="How we will know it worked" icon="target" tone="amber" className="lg:col-span-12">
              <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {u.success_measures.map((m, i) => (
                  <li key={i} className="flex items-center gap-4 rounded-2xl p-4 transition hover:-translate-y-0.5 hover:shadow-md" style={{ background: "linear-gradient(135deg, #fff7e6, #ffffff)", border: `1px solid ${TONE.amber.edge}` }}>
                    <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[20px] font-semibold" style={{ background: TONE.amber.bg, color: TONE.amber.fg }}>{i + 1}</span>
                    <p className="text-[17px] font-medium leading-snug">{m}</p>
                  </li>
                ))}
              </ul>
            </Tile>
          )}
        </div>
      )}
      {!hideNote && <p className="note px-1">To change something, open Understand and use the Check-in. Your note there is applied when I redo the step.</p>}
    </div>
  );
}
