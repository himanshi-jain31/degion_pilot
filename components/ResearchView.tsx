"use client";

import type { Finding, ResearchOutput } from "@/lib/storage";
import { Icon, type IconName } from "@/components/Icons";
import { split, tone as avatarTone } from "@/components/ProfileCard";
import { Block, FirstFew, Pill } from "@/components/UnderstandView";
import { capFirst } from "@/lib/names";

const isWebLink = (u: string) => /^https?:\/\//i.test(u);

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

// One row of evidence: what was found, and where it came from
function Evidence({ f, n }: { f: Finding; n: number }) {
  return (
    <li className="flex items-start gap-3 rounded-xl bg-[#f7f9fc] px-4 py-3">
      <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-muted"><Icon name={typeIcon(f.type)} size={15} /></span>
      <div className="min-w-0 flex-1 text-[16px] leading-snug">
        <p><span className="mr-1.5 text-[13px] text-muted">{n}.</span>{capFirst(f.finding)}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
          <span>{capFirst(f.type || "Finding")}</span>
          {isWebLink(f.source_url) ? (
            <a href={f.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 text-[var(--accent-ink)] hover:underline"><span aria-hidden="true">↗</span><span className="truncate">{f.source_title || "Open source"}</span></a>
          ) : (
            <span>{f.source_title || "No source link"}</span>
          )}
          {f.label !== "Test idea only" && <Pill label={f.label} />}
        </p>
        {f.check_note && <p className="mt-1.5 text-[13px] text-[var(--wait-ink)]">{f.check_note}</p>}
      </div>
    </li>
  );
}

// The Work part for Phase 2, in the order a designer thinks: what we learned, the proof, who it means for, what to do next, what is missing
export function ResearchWork({ out }: { out: ResearchOutput }) {
  const total = out.findings.length;
  const checked = out.findings.filter((f) => f.label === "Checked").length;
  const anyTestOnly = out.findings.some((f) => f.label === "Test idea only");
  const kit = out.research_kit;
  const hasKit = kit.goals.length > 0 || !!kit.who_to_recruit || kit.interview_questions.length > 0 || kit.survey_questions.length > 0;

  return (
    <div className="space-y-4">
      {/* How far to trust all of this, said once */}
      <p className={`flex items-center gap-3 rounded-2xl px-5 py-3.5 text-[15px] font-medium leading-snug ${checked === 0 ? "bg-[var(--wait-soft)] text-[var(--wait-ink)]" : "bg-[var(--ok-soft)] text-[var(--ok-ink)]"}`}>
        <Icon name={checked === 0 ? "alert" : "check"} size={19} className="shrink-0" />
        {total === 0
          ? "I found nothing to report yet."
          : checked === 0
          ? `${total} ${total === 1 ? "finding" : "findings"}, none with a source yet. Treat them as ideas to check, not facts.`
          : `${total} ${total === 1 ? "finding" : "findings"}, ${checked} with a source you can open.`}
      </p>

      {out.key_insights.length > 0 && (
        <Block n={1} title="What we learned" purpose="The main points. These shape the ideas in the next step.">
          <ul className="grid gap-3 md:grid-cols-2">
            {out.key_insights.map((k, i) => {
              const refs = k.based_on.map((b) => b.match(/\d+/)?.[0]).filter((x): x is string => !!x && Number(x) >= 1 && Number(x) <= total);
              return (
                <li key={i} className="flex flex-col gap-2 rounded-xl border border-line p-4">
                  <p className="flex items-start gap-3 text-[17px] font-medium leading-snug"><Icon name="lightbulb" size={19} className="mt-0.5 shrink-0 text-[#92400e]" />{capFirst(k.insight)}</p>
                  {refs.length > 0 && <p className="pl-8 text-[13px] text-muted">From {refs.length === 1 ? "finding" : "findings"} {refs.join(", ")} below</p>}
                </li>
              );
            })}
          </ul>
        </Block>
      )}

      {total > 0 && (
        <Block n={2} title="The proof behind it" purpose="What I found, and where each piece came from.">
          <ul className="space-y-2">
            <FirstFew items={out.findings.map((f, i) => ({ f, n: i + 1 }))} noun="findings" n={4} render={(x) => <Evidence key={x.n} f={x.f} n={x.n} />} />
          </ul>
        </Block>
      )}

      {out.updated_user_profiles.length > 0 && (
        <Block n={3} title="Who we are designing for, now" purpose="The same people as before, sharpened by what I found.">
          <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {out.updated_user_profiles.map((p, i) => {
              const { name, role } = split(p.name);
              const [bg, fg] = avatarTone(p.name);
              return (
                <li key={i} className="flex flex-col gap-3 rounded-xl border border-line p-4">
                  <div className="flex items-center gap-3">
                    <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[19px] font-semibold" style={{ background: bg, color: fg }}>{name.charAt(0).toUpperCase()}</span>
                    <p className="min-w-0 leading-tight"><span className="text-[17px] font-medium">{name}</span>{p.label !== "Test idea only" && <Pill label={p.label} />}{role && <span className="block text-[14px] text-muted">{role}</span>}</p>
                  </div>
                  {p.goal && <p className="text-[15px] leading-snug"><span className="label-small mr-1.5">Wants</span>{p.goal}</p>}
                  {p.frustrations.length > 0 && <p className="text-[15px] leading-snug"><span className="label-small mr-1.5">Annoyed by</span>{p.frustrations.slice(0, 2).join(", ")}</p>}
                </li>
              );
            })}
          </ul>
        </Block>
      )}

      {hasKit && (
        <Block n={4} title="Next: talk to real people" purpose="A ready kit for when you meet users. You can do this after this step too.">
          <div className="grid gap-3 md:grid-cols-2">
            {kit.goals.length > 0 && (
              <div className="rounded-xl bg-[#f7f9fc] p-4">
                <p className="label-small mb-2">What to learn</p>
                <ul className="space-y-1.5">
                  {kit.goals.map((g, i) => <li key={i} className="flex items-start gap-2 text-[15px] leading-snug"><Icon name="check" size={15} className="mt-0.5 shrink-0 text-[var(--ok)]" />{g}</li>)}
                </ul>
              </div>
            )}
            {kit.who_to_recruit && (
              <div className="rounded-xl bg-[#f7f9fc] p-4">
                <p className="label-small mb-2">Who to ask</p>
                <p className="text-[15px] leading-snug">{kit.who_to_recruit}</p>
              </div>
            )}
          </div>
          {[["Interview questions", kit.interview_questions], ["Short survey", kit.survey_questions]].map(([title, items]) =>
            (items as string[]).length > 0 ? (
              <details key={title as string} className="group mt-3 rounded-xl border border-line px-4 py-3">
                <summary className="flex cursor-pointer select-none list-none items-center justify-between text-[15px] font-medium [&::-webkit-details-marker]:hidden">
                  <span>{title as string} <span className="font-normal text-muted">({(items as string[]).length})</span></span>
                  <span className="note"><span className="group-open:hidden">Show</span><span className="hidden group-open:inline">Hide</span></span>
                </summary>
                <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[15px] leading-snug">{(items as string[]).map((q, i) => <li key={i}>{q}</li>)}</ol>
              </details>
            ) : null
          )}
        </Block>
      )}

      {out.could_not_find.length > 0 && (
        <Block n={5} title="What I could not find" purpose="Gaps in the evidence. Nothing to answer, but worth knowing.">
          <ul className="space-y-2">
            {out.could_not_find.map((t, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[15px] leading-snug"><Icon name="alert" size={16} className="mt-0.5 shrink-0 text-[#92400e]" />{capFirst(t)}</li>
            ))}
          </ul>
        </Block>
      )}

      {anyTestOnly && <p className="note px-1">Some items here are test ideas only, made up to try the app. They have no tag.</p>}
    </div>
  );
}
