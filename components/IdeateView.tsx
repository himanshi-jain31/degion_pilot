import type { IdeateOutput } from "@/lib/storage";
import { FlowDiagram, JourneyMap, StructureMap } from "@/components/Diagrams";
import { Section } from "@/components/UnderstandView";

// One direction as a card (used in the Work tab and in the Check-in)
export function DirectionCard({ d, recommended }: { d: IdeateOutput["directions"][number]; recommended?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${recommended ? "border-black" : "border-neutral-200"}`}>
      <p className="text-xs uppercase tracking-wide text-neutral-600">
        Direction {d.id}
        {recommended && <span className="pill pill-info ml-2 !text-[13px]">My pick</span>}
      </p>
      <h4 className="mt-1 text-lg font-medium">{d.name}</h4>
      <p className="mt-2 text-sm">{d.core_idea}</p>
      <p className="mt-3 text-sm"><strong>Key screens:</strong> {d.key_screens.join(", ")}</p>
      <p className="mt-2 text-sm"><strong>Good at:</strong> {d.good_at}</p>
      <p className="mt-2 text-sm"><strong>What it gives up:</strong> {d.gives_up}</p>
      <p className="mt-2 text-sm"><strong>Effort:</strong> {d.effort}</p>
      <p className="mt-2 text-sm"><strong>Risk:</strong> {d.risk}</p>
      {d.serves.length > 0 && <p className="mt-2 text-sm text-neutral-600">Serves: {d.serves.join(", ")}</p>}
    </div>
  );
}

// The Work tab for Phase 3
export function IdeateWork({ out, onMakeJourneysFuller }: { out: IdeateOutput; onMakeJourneysFuller?: () => void }) {
  return (
    <div>
      <Section title="Product structure">
        <StructureMap nodes={out.product_structure} />
      </Section>

      <Section title="User flows">
        <div className="space-y-3">
          {out.user_flows.map((f, i) => (
            <FlowDiagram key={i} flow={f} />
          ))}
        </div>
      </Section>

      {(out.journeys.today.length > 0 || out.journeys.future.length > 0) && (
        <Section title="User journeys">
          <JourneyMap journeys={out.journeys} onMakeFuller={onMakeJourneysFuller} />
        </Section>
      )}

      {out.storyboard.length > 0 && (
        <Section title="Storyboard">
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

      <Section title="Directions">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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

