import type { IdeateOutput, StructureNode } from "@/lib/storage";
import { Section } from "@/components/UnderstandView";

function Tree({ nodes }: { nodes: StructureNode[] }) {
  return (
    <ul className="ml-5 list-disc space-y-1">
      {nodes.map((n, i) => (
        <li key={i}>
          {n.page}
          {n.children && n.children.length > 0 && <Tree nodes={n.children} />}
        </li>
      ))}
    </ul>
  );
}

// One direction as a card (used in the Work tab and in the Check-in)
export function DirectionCard({ d, recommended }: { d: IdeateOutput["directions"][number]; recommended?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${recommended ? "border-black" : "border-neutral-200"}`}>
      <p className="text-xs uppercase tracking-wide text-neutral-600">
        Direction {d.id}
        {recommended && <span className="ml-2 rounded-full bg-black px-2 py-0.5 text-white">My pick</span>}
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
export function IdeateWork({ out }: { out: IdeateOutput }) {
  return (
    <div>
      <Section title="Product structure">
        <Tree nodes={out.product_structure} />
      </Section>

      <Section title="User flows">
        <div className="space-y-3">
          {out.user_flows.map((f, i) => (
            <div key={i} className="rounded-lg border border-neutral-200 p-3">
              <p className="font-medium">
                {f.name} <span className="ml-1 text-xs font-normal text-neutral-600">({f.type})</span>
              </p>
              <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">
                {f.steps.map((s, j) => (
                  <li key={j}>{s}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </Section>

      {(out.journeys.today.length > 0 || out.journeys.future.length > 0) && (
        <Section title="User journeys">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-neutral-200 p-3">
              <p className="font-medium">Today</p>
              <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">
                {out.journeys.today.map((j, i) => (
                  <li key={i}>
                    {j.step} <span className="text-neutral-600">· feels {j.feeling}{j.pain && ` · problem: ${j.pain}`}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-lg border border-neutral-200 p-3">
              <p className="font-medium">In the future</p>
              <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">
                {out.journeys.future.map((j, i) => (
                  <li key={i}>
                    {j.step} <span className="text-neutral-600">· feels {j.feeling}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
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

