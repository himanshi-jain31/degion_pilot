"use client";

import { useMemo, useState } from "react";
import type { IdeateOutput, StructureNode } from "@/lib/storage";

// ---------- Product structure map ----------

type Placed = { node: StructureNode; id: string; depth: number; y: number; parent?: string; hasKids: boolean };

const NODE_W = 168;
const NODE_H = 40;
const GAP_X = 56;
const GAP_Y = 14;

// Lays the pages out left to right. Collapsed pages hide what is under them.
function layout(roots: StructureNode[], collapsed: Set<string>) {
  const placed: Placed[] = [];
  let row = 0;
  function walk(n: StructureNode, depth: number, id: string, parent: string) {
    const kids = n.children ?? [];
    const open = kids.length > 0 && !collapsed.has(id);
    const start = row;
    const me: Placed = { node: n, id, depth, y: 0, parent, hasKids: kids.length > 0 };
    placed.push(me);
    if (open) kids.forEach((k, i) => walk(k, depth + 1, `${id}.${i}`, id));
    else row += 1;
    // sit in the middle of the pages under it
    me.y = open ? (start + row - 1) / 2 : start;
  }
  roots.forEach((r, i) => walk(r, 1, String(i), "root"));
  const root: Placed = { node: { page: "Your product" }, id: "root", depth: 0, y: Math.max(0, (row - 1) / 2), hasKids: roots.length > 0 };
  return { placed: [root, ...placed], rows: Math.max(row, 1) };
}

export function StructureMap({ nodes }: { nodes: StructureNode[] }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const { placed, rows } = useMemo(() => layout(nodes, collapsed), [nodes, collapsed]);
  const byId = new Map(placed.map((p) => [p.id, p]));
  const maxDepth = Math.max(...placed.map((p) => p.depth));
  const width = (maxDepth + 1) * (NODE_W + GAP_X) - GAP_X + 8;
  const height = rows * (NODE_H + GAP_Y) + 8;
  const px = (p: Placed) => 4 + p.depth * (NODE_W + GAP_X);
  const py = (p: Placed) => 4 + p.y * (NODE_H + GAP_Y);
  const sel = selected ? byId.get(selected) : undefined;

  const toggle = (id: string) =>
    setCollapsed((c) => {
      const n = new Set(c);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <button className="btn btn-secondary !min-h-9 !px-3" onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(1)))} aria-label="Zoom out">−</button>
        <button className="btn btn-secondary !min-h-9 !px-3" onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.2).toFixed(1)))} aria-label="Zoom in">+</button>
        <button className="btn btn-quiet !min-h-9 !px-3" onClick={() => setCollapsed(new Set())}>Open all</button>
        <span className="note">Click a page to see where it sits. Click the small arrow to fold or open what is under it. Scroll to move around.</span>
      </div>
      <div className="overflow-auto rounded-xl border border-line bg-card p-3" style={{ maxHeight: 520 }}>
        <div style={{ width: width * zoom, height: height * zoom }}>
          <svg width={width * zoom} height={height * zoom} viewBox={`0 0 ${width} ${height}`} role="group" aria-label="Product structure map">
            {placed.filter((p) => p.parent).map((p) => {
              const a = byId.get(p.parent!)!;
              const x1 = px(a) + NODE_W, y1 = py(a) + NODE_H / 2, x2 = px(p), y2 = py(p) + NODE_H / 2, mx = (x1 + x2) / 2;
              return <path key={p.id} d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`} fill="none" stroke="#c9c9c2" strokeWidth={1.5} />;
            })}
            {placed.map((p) => {
              const on = selected === p.id;
              const isRoot = p.id === "root";
              return (
                <g key={p.id} transform={`translate(${px(p)},${py(p)})`}>
                  <rect
                    width={NODE_W} height={NODE_H} rx={10}
                    fill={isRoot ? "#1c1c1e" : on ? "#eef0ff" : "#fff"}
                    stroke={on ? "#4f46e5" : "#d6d6cf"} strokeWidth={on ? 2 : 1}
                    tabIndex={0} role="button" aria-label={`${p.node.page}${p.hasKids ? (collapsed.has(p.id) ? ", folded" : ", open") : ""}`}
                    style={{ cursor: "pointer", outline: "none" }}
                    onClick={() => setSelected(p.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(p.id); } }}
                  />
                  <text x={12} y={NODE_H / 2 + 5} fontSize={14} fill={isRoot ? "#fff" : "#1c1c1e"} style={{ pointerEvents: "none" }}>
                    {p.node.page.length > 20 ? p.node.page.slice(0, 19) + "…" : p.node.page}
                  </text>
                  {p.hasKids && !isRoot && (
                    <g
                      transform={`translate(${NODE_W - 22},${NODE_H / 2 - 9})`} style={{ cursor: "pointer" }} role="button" tabIndex={0}
                      aria-label={collapsed.has(p.id) ? `Open pages under ${p.node.page}` : `Fold pages under ${p.node.page}`}
                      onClick={(e) => { e.stopPropagation(); toggle(p.id); }}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(p.id); } }}
                    >
                      <rect width={18} height={18} rx={5} fill="#f1f1ed" />
                      <text x={9} y={13} fontSize={12} textAnchor="middle" fill="#6b6b70">{collapsed.has(p.id) ? "+" : "−"}</text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
      {sel && sel.id !== "root" && (
        <p className="note mt-2" role="status">
          <strong className="font-medium text-ink">{sel.node.page}</strong>: level {sel.depth} of the product
          {sel.parent && sel.parent !== "root" ? `, under ${byId.get(sel.parent)?.node.page}` : ", in the main menu"}
          {sel.hasKids ? `, with ${sel.node.children!.length} page${sel.node.children!.length === 1 ? "" : "s"} under it.` : ", with nothing under it."}
        </p>
      )}
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
