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
            return <path key={p.id} d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`} fill="none" stroke={lit ? "#4f46e5" : "#cfd6e2"} strokeWidth={lit ? 2.5 : 1.75} />;
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
                  fill={isRoot ? "#0e1a2b" : on ? "#4f46e5" : top ? "#eef0ff" : "#fff"}
                  stroke={lit && !isRoot ? "#4f46e5" : isRoot ? "#0e1a2b" : top ? "#c9ceff" : "#d5dbe6"} strokeWidth={lit && !isRoot ? 2 : 1.25}
                  tabIndex={0} role="button" aria-pressed={on} aria-label={p.node.page}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelected(on ? null : p.id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(on ? null : p.id); } }}
                />
                <text x={colW[p.depth] / 2} y={NODE_H / 2 + 6} textAnchor="middle" fontSize={17} fontWeight={isRoot || top ? 600 : 500} fill={isRoot || on ? "#fff" : "#0e1a2b"} style={{ pointerEvents: "none" }}>
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
const FACES = ["", "😣", "😕", "😐", "🙂", "😄"];
const face = (s: Stage) => FACES[scoreOf(s).value];
const topPct = (v: number) => 12 + ((5 - v) / 4) * 76; // 5 is high on the chart, 1 is low

// A smooth line through the points. x and y are percentages of the chart.
function smooth(pts: [number, number][]) {
  if (pts.length === 1) return `M${pts[0][0] - 4},${pts[0][1]} L${pts[0][0] + 4},${pts[0][1]}`;
  return pts.reduce((d, [x, y], i) => {
    if (i === 0) return `M${x},${y}`;
    const [px, py] = pts[i - 1];
    const mx = (px + x) / 2;
    return `${d} C${mx},${py} ${mx},${y} ${x},${y}`;
  }, "");
}

// The feeling curve with a face on every stage. It sits in the same columns as the cards, so they line up.
function EmotionCurve({ stages, colour }: { stages: Stage[]; colour: string }) {
  const n = stages.length;
  const pts: [number, number][] = stages.map((s, i) => [((i + 0.5) / n) * 100, topPct(scoreOf(s).value)]);
  const id = `fill-${colour.replace("#", "")}`;
  return (
    <div className="relative h-44 overflow-hidden rounded-xl bg-[#f9fafd]" role="img" aria-label={`How the person feels: ${stages.map((s, i) => `${i + 1}, ${s.feeling}`).join("; ")}`}>
      <div aria-hidden="true" className="absolute inset-x-0 top-[12%] border-t border-dashed border-line" />
      <div aria-hidden="true" className="absolute inset-x-0 top-1/2 border-t border-dashed border-line" />
      <div aria-hidden="true" className="absolute inset-x-0 top-[88%] border-t border-dashed border-line" />
      <span className="absolute left-2 top-0.5 text-[11px] text-muted">Feels good</span>
      <span className="absolute bottom-0.5 left-2 text-[11px] text-muted">Feels bad</span>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={colour} stopOpacity="0.18" /><stop offset="1" stopColor={colour} stopOpacity="0" /></linearGradient>
        </defs>
        {n > 1 && <path d={`${smooth(pts)} L${pts[n - 1][0]},100 L${pts[0][0]},100 Z`} fill={`url(#${id})`} />}
        <path d={smooth(pts)} fill="none" stroke={colour} strokeWidth={3} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      {stages.map((s, i) => (
        <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: `${pts[i][0]}%`, top: `${pts[i][1]}%` }}>
          <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white text-[22px] shadow-sm" style={{ borderColor: colour }}>{face(s)}</span>
        </div>
      ))}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-muted">{children}</p>;
}

function JourneyBlock({ title, subtitle, stages, future, colour }: { title: string; subtitle: string; stages: Stage[]; future?: boolean; colour: string }) {
  const n = stages.length;
  const cols = { "--n": n } as React.CSSProperties;
  return (
    <section className="rounded-2xl border border-line bg-card p-4 sm:p-6" aria-label={title}>
      <div className="mb-4 flex flex-wrap items-baseline gap-x-3">
        <h4 className="text-[19px] font-medium" style={{ color: colour }}>{title}</h4>
        <p className="note">{subtitle}</p>
      </div>

      {/* Stages as a row of arrows (wide screens) */}
      <ol className="hidden gap-2 sm:grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }} aria-hidden="true">
        {stages.map((s, i) => (
          <li key={i} className="flex min-h-12 items-center justify-center px-5 py-2 text-center text-[14px] font-medium leading-tight text-white" style={{ background: colour, clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%, 14px 50%)", paddingLeft: i === 0 ? 14 : undefined }}>
            {s.stage || `Step ${i + 1}`}
          </li>
        ))}
      </ol>

      <div className="mt-4 hidden sm:block"><EmotionCurve stages={stages} colour={colour} /></div>

      {/* One card per stage. On a phone they stack. */}
      <ol className="mt-4 grid grid-cols-1 gap-2 sm:[grid-template-columns:repeat(var(--n),minmax(0,1fr))]" style={cols}>
        {stages.map((s, i) => (
          <li key={i} className="flex min-w-0 flex-col gap-3 rounded-xl border border-line p-3 text-[14px] leading-snug">
            <div className="flex items-center gap-2 sm:hidden">
              <span className="text-[24px]" aria-hidden="true">{face(s)}</span>
              <span className="font-medium">{i + 1}. {s.stage || `Step ${i + 1}`}</span>
            </div>
            <div><Label>Does</Label><p>{s.step}</p></div>
            {s.thought && <div><Label>Thinks</Label><p className="rounded-lg bg-[#f5f7fb] px-2.5 py-2 italic">&ldquo;{s.thought}&rdquo;</p></div>}
            <div><Label>Feels</Label><p className="font-medium">{face(s)} {s.feeling}</p></div>
            {!future && s.pain && <div className="rounded-lg bg-[var(--bad-soft)] px-2.5 py-2 text-[var(--bad-ink)]"><Label>Problem</Label><p>{s.pain}</p></div>}
            {future && s.improves && <div className="rounded-lg bg-[var(--ok-soft)] px-2.5 py-2 text-[var(--ok-ink)]"><Label>Fixes</Label><p>{s.improves}</p></div>}
            {!future && s.opportunity && <div className="mt-auto rounded-lg bg-accent-soft px-2.5 py-2 text-[var(--accent-ink)]"><Label>Chance</Label><p>{s.opportunity}</p></div>}
          </li>
        ))}
      </ol>
    </section>
  );
}

// Today and the future, stage by stage, as one quick row of faces
function Compare({ today, future }: { today: Stage[]; future: Stage[] }) {
  const n = today.length;
  return (
    <section className="rounded-2xl border border-line bg-card p-4 sm:p-6" aria-label="What changes">
      <h4 className="text-[19px] font-medium">What changes for the person</h4>
      <p className="note mb-4">Each stage: how it feels today, and how it should feel with the new product.</p>
      <ol className="grid gap-2" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {today.map((t, i) => {
          const f = future[i];
          const up = scoreOf(f).value - scoreOf(t).value;
          return (
            <li key={i} className="min-w-0 rounded-xl bg-[#f5f7fb] p-2 text-center sm:p-3">
              <p className="mb-2 truncate text-[12px] font-medium text-muted sm:text-[13px]">{t.stage || `Step ${i + 1}`}</p>
              <p className="text-[22px] leading-none sm:text-[26px]" aria-label={`Today ${t.feeling}, future ${f.feeling}`}>{face(t)}<span aria-hidden="true" className="mx-0.5 text-[14px] text-muted">→</span>{face(f)}</p>
              <p className={`mt-2 text-[12px] font-medium ${up > 0 ? "text-[var(--ok-ink)]" : up < 0 ? "text-[var(--bad-ink)]" : "text-muted"}`}>{up > 0 ? "Better" : up < 0 ? "Worse" : "Same"}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function JourneyMap({ journeys, onMakeFuller }: { journeys: IdeateOutput["journeys"]; onMakeFuller?: () => void }) {
  const { today, future } = journeys;
  const guessed = [...today, ...future].some((s) => scoreOf(s).guessed);
  const thin = (today.length > 0 && today.length < 3) || (future.length > 0 && future.length < 3);
  return (
    <div className="space-y-5">
      {thin && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--wait)]/40 bg-[var(--wait-soft)] p-4 text-[15px] text-[var(--wait-ink)]" role="status">
          <p className="max-w-xl">This journey is too short to be useful. It was made before I was asked for a full one (5 to 7 stages).</p>
          {onMakeFuller && <button onClick={onMakeFuller} className="btn btn-primary">Make the journeys fuller</button>}
        </div>
      )}
      {today.length > 0 && <JourneyBlock title="Today" subtitle="How the person gets this done now" stages={today} colour="#5d6a7c" />}
      {today.length > 0 && today.length === future.length && <Compare today={today} future={future} />}
      {future.length > 0 && <JourneyBlock title="In the future" subtitle="The same stages with the new product" stages={future} colour="#4f46e5" future />}
      {guessed && <p className="note">Some faces are my rough reading of the feeling words, because no score was given.</p>}
    </div>
  );
}
