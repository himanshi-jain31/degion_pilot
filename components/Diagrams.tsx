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

// A rough score from the feeling words: -1 low, 0 neutral or unknown, 1 high
function mood(feeling: string) {
  const f = feeling.toLowerCase();
  if (BAD.some((w) => f.includes(w))) return -1;
  if (/\bnot (sure|clear|confident|happy)/.test(f)) return -1;
  if (GOOD.some((w) => f.includes(w))) return 1;
  return 0;
}

type Stage = { step: string; feeling: string; pain?: string };

function JourneyRow({ title, stages, tone }: { title: string; stages: Stage[]; tone: string }) {
  const colW = 150;
  const w = stages.length * colW;
  const h = 70;
  const ys = stages.map((s) => h / 2 - mood(s.feeling) * 22);
  const pts = stages.map((_, i) => `${i * colW + colW / 2},${ys[i]}`).join(" ");
  return (
    <div>
      <p className="mb-2 font-medium">{title}</p>
      <div className="overflow-x-auto rounded-xl border border-line bg-card p-3">
        <div style={{ width: w }}>
          <svg width={w} height={h} role="img" aria-label={`How the person feels through ${title.toLowerCase()}: ${stages.map((s) => s.feeling).join(", ")}`}>
            <line x1={0} x2={w} y1={h / 2} y2={h / 2} stroke="#ecece8" strokeDasharray="4 4" />
            <polyline points={pts} fill="none" stroke={tone} strokeWidth={2.5} strokeLinejoin="round" />
            {stages.map((s, i) => (
              <circle key={i} cx={i * colW + colW / 2} cy={ys[i]} r={6} fill={mood(s.feeling) < 0 ? "#dc2626" : mood(s.feeling) > 0 ? "#16a34a" : "#fff"} stroke={tone} strokeWidth={2} />
            ))}
          </svg>
          <ol className="flex">
            {stages.map((s, i) => (
              <li key={i} style={{ width: colW }} className="px-2 text-[14px] leading-snug">
                <p className="text-muted">{i + 1}</p>
                <p>{s.step}</p>
                <p className="mt-2"><span className="pill pill-idle !text-[13px]">{s.feeling}</span></p>
                {s.pain && <p className="mt-2 rounded-lg bg-[var(--bad-soft)] p-2 text-[13px] text-[var(--bad-ink)]">Problem: {s.pain}</p>}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

export function JourneyMap({ journeys }: { journeys: IdeateOutput["journeys"] }) {
  return (
    <div className="space-y-4">
      {journeys.today.length > 0 && <JourneyRow title="Today" stages={journeys.today} tone="#6b6b70" />}
      {journeys.future.length > 0 && <JourneyRow title="In the future" stages={journeys.future} tone="#4f46e5" />}
      <p className="note">
        The line is drawn roughly from the feeling words: higher is more positive, lower is more negative, and words I don&apos;t recognise sit in the middle. It is a guide, not a measurement.
      </p>
    </div>
  );
}
