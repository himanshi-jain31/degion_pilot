"use client";

import { useMemo, useState } from "react";
import type { IdeateOutput, StructureNode } from "@/lib/storage";

// ---------- Product structure map ----------

type Placed = { node: StructureNode; id: string; depth: number; y: number; parent?: string; kids: number };

const NODE_H = 52;
const GAP_X = 72;
const GAP_Y = 18;
const CHAR_W = 9; // roughly how wide one letter is at the text size used
const PAD = 16;

// Lays every page out left to right. Pages with children sit in the middle of them.
function layout(roots: StructureNode[]) {
  const placed: Placed[] = [];
  let row = 0;
  function walk(n: StructureNode, depth: number, id: string, parent: string) {
    const kids = n.children ?? [];
    const me: Placed = { node: n, id, depth, y: 0, parent, kids: kids.length };
    placed.push(me);
    if (kids.length === 0) {
      me.y = row;
      row += 1;
    } else {
      const start = row;
      kids.forEach((k, i) => walk(k, depth + 1, `${id}.${i}`, id));
      me.y = (start + row - 1) / 2;
    }
  }
  roots.forEach((r, i) => walk(r, 1, String(i), "root"));
  const root: Placed = { node: { page: "Your product" }, id: "root", depth: 0, y: Math.max(0, (row - 1) / 2), kids: roots.length };
  return { placed: [root, ...placed], rows: Math.max(row, 1) };
}

export function StructureMap({ nodes }: { nodes: StructureNode[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const { placed, rows } = useMemo(() => layout(nodes), [nodes]);
  const byId = new Map(placed.map((p) => [p.id, p]));
  const maxDepth = Math.max(...placed.map((p) => p.depth));

  // each column is as wide as its longest page name, so no name is ever cut off
  const colW: number[] = [];
  for (let d = 0; d <= maxDepth; d++) {
    const longest = Math.max(...placed.filter((p) => p.depth === d).map((p) => p.node.page.length));
    colW[d] = Math.max(130, longest * CHAR_W + 36);
  }
  const colX = colW.map((_, d) => PAD + colW.slice(0, d).reduce((a, w) => a + w + GAP_X, 0));
  const width = colX[maxDepth] + colW[maxDepth] + PAD;
  const height = rows * (NODE_H + GAP_Y) - GAP_Y + PAD * 2;
  const px = (p: Placed) => colX[p.depth];
  const py = (p: Placed) => PAD + p.y * (NODE_H + GAP_Y);

  // the chain from the chosen page back to the top lights up
  const trail = new Set<string>();
  for (let c = selected ? byId.get(selected) : undefined; c; c = c.parent ? byId.get(c.parent) : undefined) trail.add(c.id);
  const sel = selected ? byId.get(selected) : undefined;
  const pathNames: string[] = [];
  for (let c = sel; c && c.id !== "root"; c = c.parent ? byId.get(c.parent) : undefined) pathNames.unshift(c.node.page);

  return (
    <div>
      <div className="rounded-2xl border border-line bg-card p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: "100%", maxWidth: width * 1.3, height: "auto", display: "block", margin: "0 auto" }}
          role="group"
          aria-label="Product structure map"
        >
          {placed.filter((p) => p.parent).map((p) => {
            const a = byId.get(p.parent!)!;
            const x1 = px(a) + colW[a.depth], y1 = py(a) + NODE_H / 2, x2 = px(p), y2 = py(p) + NODE_H / 2, mx = (x1 + x2) / 2;
            const lit = trail.has(p.id);
            return <path key={p.id} d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`} fill="none" stroke={lit ? "#4f46e5" : "#cfcfc8"} strokeWidth={lit ? 2.5 : 1.75} />;
          })}
          {placed.map((p) => {
            const on = selected === p.id;
            const lit = trail.has(p.id);
            const isRoot = p.id === "root";
            const top = p.depth === 1;
            return (
              <g key={p.id} transform={`translate(${px(p)},${py(p)})`}>
                <rect
                  width={colW[p.depth]} height={NODE_H} rx={14}
                  fill={isRoot ? "#1c1c1e" : on ? "#4f46e5" : top ? "#eef0ff" : "#fff"}
                  stroke={lit && !isRoot ? "#4f46e5" : isRoot ? "#1c1c1e" : top ? "#c9ceff" : "#d6d6cf"} strokeWidth={lit && !isRoot ? 2 : 1.25}
                  tabIndex={0} role="button" aria-pressed={on} aria-label={p.node.page}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelected(on ? null : p.id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(on ? null : p.id); } }}
                />
                <text x={colW[p.depth] / 2} y={NODE_H / 2 + 6} textAnchor="middle" fontSize={17} fontWeight={isRoot || top ? 600 : 500} fill={isRoot || on ? "#fff" : "#1c1c1e"} style={{ pointerEvents: "none" }}>
                  {p.node.page}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-3 rounded-xl border border-line bg-card p-4 text-[15px]" role="status">
        {sel && sel.id !== "root" ? (
          <>
            <p className="note">{["Your product", ...pathNames].join("  ›  ")}</p>
            <p className="mt-1">
              <strong className="font-medium">{sel.node.page}</strong>
              {sel.depth === 1 ? " is in the main menu" : ` sits ${sel.depth - 1} level${sel.depth - 1 === 1 ? "" : "s"} down`}
              {sel.kids > 0 ? `, and has ${sel.kids} page${sel.kids === 1 ? "" : "s"} under it.` : ", and has no pages under it."}
            </p>
          </>
        ) : (
          <p className="note">The whole product is shown above. Click any page to see where it sits.</p>
        )}
      </div>
    </div>
  );
}

// ---------- User flows ----------

const FLOW_TONE: Record<string, string> = {
  main: "border-[var(--accent)] bg-accent-soft",
  error: "border-[var(--bad)] bg-[var(--bad-soft)]",
  empty: "border-[var(--wait)] bg-[var(--wait-soft)]",
  "no permission": "border-[var(--wait)] bg-[var(--wait-soft)]",
  other: "border-line bg-card",
};

export function FlowDiagram({ flow }: { flow: IdeateOutput["user_flows"][number] }) {
  const [picked, setPicked] = useState<number | null>(null);
  const tone = FLOW_TONE[flow.type.toLowerCase()] ?? FLOW_TONE.other;
  const steps = flow.steps;
  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <p className="font-medium">
        {flow.name} <span className="pill pill-idle ml-1 !text-[13px]">{flow.type}</span>
      </p>
      <ol className="mt-3 flex flex-wrap items-center gap-y-3">
        <li className="rounded-full bg-ink px-3 py-1 text-[13px] text-white">Start</li>
        {steps.map((s, i) => {
          const question = s.trim().endsWith("?");
          const on = picked === i;
          return (
            <li key={i} className="flex items-center">
              <span aria-hidden="true" className="px-2 text-muted">→</span>
              <button
                onClick={() => setPicked(on ? null : i)}
                aria-pressed={on}
                className={`max-w-[220px] border px-3 py-2 text-left text-[14px] leading-snug ${question ? "rounded-[999px] border-dashed" : "rounded-lg"} ${tone} ${on ? "ring-2 ring-[var(--accent)]" : ""}`}
              >
                {s}
              </button>
            </li>
          );
        })}
        <li className="flex items-center">
          <span aria-hidden="true" className="px-2 text-muted">→</span>
          <span className="rounded-full bg-ink px-3 py-1 text-[13px] text-white">End</span>
        </li>
      </ol>
      {picked !== null && (
        <p className="note mt-3" role="status">
          Step {picked + 1} of {steps.length} in &quot;{flow.name}&quot;.
          {steps[picked].trim().endsWith("?") && " This is a question the person has to answer. The other way it can go is not drawn, because I was not given it."}
        </p>
      )}
    </div>
  );
}

// ---------- User journeys ----------

const GOOD = ["happy", "calm", "confident", "relieved", "pleased", "satisfied", "reassured", "delighted", "in control", "easy", "clear", "good", "relaxed", "positive", "comfortable", "sure", "trust", "fine", "great"];
const BAD = ["frustrat", "confus", "anxious", "worried", "annoy", "unsure", "stuck", "stress", "uncertain", "lost", "angry", "overwhelm", "nervous", "doubt", "tired", "bored", "upset", "uneasy", "hesitant", "irritat"];

type Stage = { stage?: string; step: string; thought?: string; feeling: string; score?: number; pain?: string; improves?: string; opportunity?: string };

// The feeling score (1 to 5). Older results have none, so a rough one is worked out from the words.
function scoreOf(s: Stage) {
  if (s.score) return { value: s.score, guessed: false };
  const f = s.feeling.toLowerCase();
  const bad = BAD.some((w) => f.includes(w)) || /\bnot (sure|clear|confident|happy)/.test(f);
  return { value: bad ? 2 : GOOD.some((w) => f.includes(w)) ? 4 : 3, guessed: true };
}
const topPct = (v: number) => 10 + ((5 - v) / 4) * 80; // 5 is high on the chart, 1 is low

// The feeling curve: positions are percentages so it always fills the width and never scrolls
function Curve({ lines }: { lines: { stages: Stage[]; colour: string; name: string }[] }) {
  const n = Math.max(...lines.map((l) => l.stages.length));
  const xPct = (i: number, len: number) => ((i + 0.5) / len) * 100;
  return (
    <div className="relative h-36 rounded-xl bg-[#fafaf7]" role="img" aria-label={lines.map((l) => `${l.name}: ${l.stages.map((s) => `${s.stage ?? s.step} ${s.feeling}`).join(", ")}`).join(". ")}>
      <span className="absolute left-2 top-1 text-[12px] text-muted">Good</span>
      <span className="absolute bottom-1 left-2 text-[12px] text-muted">Low</span>
      <div aria-hidden="true" className="absolute inset-x-0 top-1/2 border-t border-dashed border-line" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {lines.map((l) => (
          <polyline key={l.name} points={l.stages.map((s, i) => `${xPct(i, l.stages.length)},${topPct(scoreOf(s).value)}`).join(" ")} fill="none" stroke={l.colour} strokeWidth={2.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        ))}
      </svg>
      {lines.map((l) =>
        l.stages.map((s, i) => (
          <span key={l.name + i} aria-hidden="true" className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white" style={{ left: `${xPct(i, l.stages.length)}%`, top: `${topPct(scoreOf(s).value)}%`, borderColor: l.colour }} />
        ))
      )}
      <span className="sr-only">{n} stages</span>
    </div>
  );
}

function Row({ label, cols, children }: { label: string; cols: number; children: (i: number) => React.ReactNode }) {
  return (
    <div className="grid items-start gap-3 border-t border-line py-3" style={{ gridTemplateColumns: `76px repeat(${cols}, minmax(0, 1fr))` }}>
      <p className="label-small pt-0.5 !text-[13px]">{label}</p>
      {Array.from({ length: cols }, (_, i) => <div key={i} className="min-w-0 text-[14px] leading-snug">{children(i)}</div>)}
    </div>
  );
}

function JourneyGrid({ title, stages, future, colour }: { title: string; stages: Stage[]; future?: boolean; colour: string }) {
  const n = stages.length;
  return (
    <section className="rounded-2xl border border-line bg-card p-4 sm:p-5" aria-label={title}>
      <div className="mb-3 flex items-center gap-2">
        <span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ background: colour }} />
        <h4 className="text-[17px] font-medium">{title}</h4>
      </div>
      <div className="grid gap-3 pb-3" style={{ gridTemplateColumns: `76px repeat(${n}, minmax(0, 1fr))` }}>
        <span />
        {stages.map((s, i) => (
          <div key={i} className="min-w-0 rounded-lg px-2 py-1.5 text-center text-[13px] font-medium leading-tight" style={{ background: future ? "#eef0ff" : "#f4f4f0", color: future ? "#4338ca" : "#1c1c1e" }}>
            <span className="block text-[11px] font-normal opacity-70">{i + 1}</span>{s.stage || `Step ${i + 1}`}
          </div>
        ))}
      </div>
      <Row label="Does" cols={n}>{(i) => stages[i].step}</Row>
      {stages.some((s) => s.thought) && <Row label="Thinks" cols={n}>{(i) => stages[i].thought ? <span className="italic text-muted">&ldquo;{stages[i].thought}&rdquo;</span> : null}</Row>}
      <Row label="Feels" cols={n}>
        {(i) => <span className={`pill ${scoreOf(stages[i]).value >= 4 ? "pill-ok" : scoreOf(stages[i]).value <= 2 ? "pill-bad" : "pill-idle"} !text-[13px]`}>{stages[i].feeling}</span>}
      </Row>
      {future ? (
        stages.some((s) => s.improves) && <Row label="Fixes" cols={n}>{(i) => stages[i].improves ? <span className="rounded-lg bg-[var(--ok-soft)] px-2 py-1 text-[13px] text-[var(--ok-ink)]">{stages[i].improves}</span> : null}</Row>
      ) : (
        <>
          <Row label="Problem" cols={n}>{(i) => stages[i].pain ? <span className="block rounded-lg bg-[var(--bad-soft)] px-2 py-1 text-[13px] text-[var(--bad-ink)]">{stages[i].pain}</span> : <span className="text-muted">·</span>}</Row>
          {stages.some((s) => s.opportunity) && <Row label="Chance" cols={n}>{(i) => stages[i].opportunity ? <span className="text-[13px]">💡 {stages[i].opportunity}</span> : null}</Row>}
        </>
      )}
    </section>
  );
}

export function JourneyMap({ journeys }: { journeys: IdeateOutput["journeys"] }) {
  const { today, future } = journeys;
  const guessed = [...today, ...future].some((s) => scoreOf(s).guessed);
  const thin = (today.length > 0 && today.length < 3) || (future.length > 0 && future.length < 3);
  return (
    <div className="space-y-5">
      {thin && (
        <p className="rounded-xl border border-[var(--wait)]/40 bg-[var(--wait-soft)] p-4 text-[15px] text-[var(--wait-ink)]" role="status">
          This journey only has {Math.min(today.length || 99, future.length || 99)} step. It was made before I was asked for a full journey. Choose <strong>Not yet</strong> in the Check-in and write &ldquo;Make the journeys longer, 5 to 7 stages&rdquo; to get a complete one.
        </p>
      )}
      {today.length > 0 && future.length > 0 && (
        <div className="rounded-2xl border border-line bg-card p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1">
            <h4 className="text-[17px] font-medium">How it feels: today and in the future</h4>
            <span className="flex items-center gap-1.5 text-[14px] text-muted"><span aria-hidden="true" className="h-0.5 w-5 bg-[#6b6b70]" />Today</span>
            <span className="flex items-center gap-1.5 text-[14px] text-muted"><span aria-hidden="true" className="h-0.5 w-5 bg-[#4f46e5]" />In the future</span>
          </div>
          <div className="grid gap-3" style={{ gridTemplateColumns: "76px 1fr" }}>
            <span />
            <Curve lines={[{ stages: today, colour: "#6b6b70", name: "Today" }, { stages: future, colour: "#4f46e5", name: "In the future" }]} />
          </div>
        </div>
      )}
      {today.length > 0 && <JourneyGrid title="Today" stages={today} colour="#6b6b70" />}
      {future.length > 0 && <JourneyGrid title="In the future" stages={future} colour="#4f46e5" future />}
      {guessed && <p className="note">Some feeling scores are my rough reading of the feeling words, because none were given.</p>}
    </div>
  );
}
