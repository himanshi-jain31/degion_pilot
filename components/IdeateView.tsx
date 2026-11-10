import type { IdeateOutput } from "@/lib/storage";
import { FlowDiagram, JourneyMap, StructureMap } from "@/components/Diagrams";
import { Section } from "@/components/UnderstandView";

// How much effort, as three dots
function EffortDots({ effort }: { effort: string }) {
  const level = /high/i.test(effort) ? 3 : /med/i.test(effort) ? 2 : /low/i.test(effort) ? 1 : 0;
  return (
    <span className="flex items-center gap-2" aria-label={`Effort: ${effort}`}>
      <span aria-hidden="true" className="flex gap-1">
        {[1, 2, 3].map((n) => <span key={n} className={`h-2.5 w-2.5 rounded-full ${n <= level ? "bg-ink" : "bg-line"}`} />)}
      </span>
      {effort}
    </span>
  );
}

// One direction as a card. Every card in a row has the same height, with the choice at the bottom.
export function DirectionCard({ d, recommended, selected, pick }: { d: IdeateOutput["directions"][number]; recommended?: boolean; selected?: boolean; pick?: boolean }) {
  return (
    <div className={`flex min-h-full w-full flex-1 flex-col rounded-2xl border bg-card p-5 transition-shadow ${selected ? "border-accent shadow-[0_0_0_2px_var(--accent)]" : "border-line"} ${recommended && !selected ? "border-[#c9ceff]" : ""}`}>
      <header className="flex items-start gap-3">
        <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-[18px] font-medium text-white">{d.id}</span>
        <h4 className="min-w-0 flex-1 pt-1.5 text-[18px] font-medium leading-snug">{d.name}</h4>
        {recommended && <span className="pill pill-info mt-1 shrink-0 !text-[13px]">My pick</span>}
      </header>
      <p className="mt-3 text-[15px] leading-snug">{d.core_idea}</p>

      {d.key_screens.length > 0 && (
        <div className="mt-4">
          <p className="label-small mb-1.5 !text-[12px] uppercase tracking-wide">Key screens</p>
          <ul className="flex flex-wrap gap-1.5">
            {d.key_screens.map((k) => <li key={k} className="rounded-full bg-[#f4f4f0] px-2.5 py-1 text-[13px] leading-snug">{k}</li>)}
          </ul>
        </div>
      )}

      <div className="mt-4 space-y-2 text-[14px] leading-snug">
        <p className="rounded-xl bg-[var(--ok-soft)] p-3 text-[var(--ok-ink)]"><span className="mb-0.5 block text-[12px] font-medium uppercase tracking-wide">Good at</span>{d.good_at}</p>
        <p className="rounded-xl bg-[var(--wait-soft)] p-3 text-[var(--wait-ink)]"><span className="mb-0.5 block text-[12px] font-medium uppercase tracking-wide">Gives up</span>{d.gives_up}</p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-[14px] leading-snug">
        <div><dt className="label-small !text-[12px] uppercase tracking-wide">Effort</dt><dd className="mt-1"><EffortDots effort={d.effort} /></dd></div>
        <div><dt className="label-small !text-[12px] uppercase tracking-wide">Risk</dt><dd className="mt-1">{d.risk}</dd></div>
      </dl>

      {d.serves.length > 0 && (
        <p className="mt-4 flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
          Serves
          {d.serves.map((r) => <span key={r} className="rounded-md border border-line px-1.5 py-0.5 text-ink">{r}</span>)}
        </p>
      )}

      {pick && (
        <div className="mt-auto pt-5">
          <div className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-[15px] font-medium ${selected ? "border-accent bg-accent text-white" : "border-[var(--control-line)] text-ink"}`}>
            <span aria-hidden="true">{selected ? "✓" : "○"}</span>
            {selected ? "Selected" : `Pick ${d.id}`}
          </div>
        </div>
      )}
    </div>
  );
}

// The Work tab for Phase 3
export function IdeateWork({ out, onMakeJourneysFuller }: { out: IdeateOutput; onMakeJourneysFuller?: () => void }) {
  return (
    <div>
      <Section title="Product structure" icon="network" tone="indigo">
        <StructureMap nodes={out.product_structure} />
      </Section>

      <Section title="User flows" icon="route" tone="sky">
        <div className="space-y-3">
          {out.user_flows.map((f, i) => (
            <FlowDiagram key={i} flow={f} />
          ))}
        </div>
      </Section>

      {(out.journeys.today.length > 0 || out.journeys.future.length > 0) && (
        <Section title="User journeys" icon="activity" tone="green">
          <JourneyMap journeys={out.journeys} onMakeFuller={onMakeJourneysFuller} />
        </Section>
      )}

      {out.storyboard.length > 0 && (
        <Section title="Storyboard" icon="file-text" tone="amber">
          <div className="grid gap-3 sm:grid-cols-3">
            {out.storyboard.map((f) => (
              <div key={f.frame} className="rounded-lg border border-neutral-200 p-3 text-sm">
                <p className="text-xs text-neutral-600">Frame {f.frame}</p>
                <p className="mt-1">{f.scene}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Directions" icon="compass" tone="indigo">
        <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
          {out.directions.map((d) => (
            <DirectionCard key={d.id} d={d} recommended={d.id === out.recommendation.direction} />
          ))}
        </div>
        {out.recommendation.why && (
          <p className="mt-4 text-sm">
            <strong>Why I picked {out.recommendation.direction}:</strong> {out.recommendation.why}
          </p>
        )}
      </Section>
    </div>
  );
}

