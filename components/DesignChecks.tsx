"use client";

import { useEffect, useState } from "react";
import type { DesignOutput } from "@/lib/storage";
import { Icon, type IconName } from "@/components/Icons";
import { Section, TONE } from "@/components/UnderstandView";

type Palette = {
  colours: { hex: string; uses: number; role?: string; on: string }[];
  pairs: { name: string; fg: string; bg: string; ratio: number; need: number }[];
  fonts: { heading?: string; body?: string };
};

function ColourTile({ c }: { c: Palette["colours"][number] }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(c.hex);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // the browser did not allow copying; the code is still on screen
    }
  }
  return (
    <li>
      <button onClick={copy} aria-label={`${c.role ?? "Colour"} ${c.hex}. Copy the code`} className="group relative flex h-28 w-full flex-col justify-between rounded-2xl border border-black/10 p-3 text-left transition duration-150 hover:-translate-y-0.5 hover:shadow-md" style={{ background: c.hex, color: c.on }}>
        <span className="flex items-start justify-between gap-2">
          {c.role ? <span className="rounded-full px-2 py-0.5 text-[12px] font-medium" style={{ background: c.on === "#ffffff" ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.08)" }}>{c.role}</span> : <span />}
          <span className="text-[12px] opacity-0 transition-opacity group-hover:opacity-80">{copied ? "Copied ✓" : "Copy"}</span>
        </span>
        <span>
          <span className="block font-mono text-[16px] font-semibold uppercase tracking-wide">{copied ? "Copied ✓" : c.hex}</span>
          <span className="block text-[12px] opacity-75">{c.uses > 0 ? `used ${c.uses} time${c.uses === 1 ? "" : "s"}` : "set as a variable"}</span>
        </span>
      </button>
    </li>
  );
}

function Contrast({ p }: { p: Palette["pairs"][number] }) {
  const pass = p.ratio >= p.need;
  const aaa = p.need === 4.5 && p.ratio >= 7;
  return (
    <li className="flex overflow-hidden rounded-2xl border border-line bg-card">
      <div className="flex w-28 shrink-0 flex-col items-center justify-center gap-0.5 p-3" style={{ background: p.bg, color: p.fg }} aria-hidden="true">
        <span className="text-[34px] font-semibold leading-none">Aa</span>
        <span className="text-[12px]">Sample</span>
      </div>
      <div className="min-w-0 flex-1 p-3">
        <p className="text-[14px] font-medium leading-snug">{p.name}</p>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
          <span className="text-[26px] font-semibold leading-none tracking-tight">{p.ratio.toFixed(1)}<span className="text-[16px] text-muted"> : 1</span></span>
          <span className={`pill ${pass ? "pill-ok" : "pill-bad"} !text-[13px]`}>{pass ? (aaa ? "Passes AAA" : "Passes") : `Too low, needs ${p.need}`}</span>
        </p>
        <p className="mt-1.5 flex items-center gap-1.5 font-mono text-[12px] uppercase text-muted">
          <span aria-hidden="true" className="h-3 w-3 rounded-sm border border-black/10" style={{ background: p.fg }} />{p.fg}
          <span aria-hidden="true">on</span>
          <span aria-hidden="true" className="h-3 w-3 rounded-sm border border-black/10" style={{ background: p.bg }} />{p.bg}
        </p>
      </div>
    </li>
  );
}

function Ring({ percent }: { percent: number }) {
  const r = 26, c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, percent));
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" aria-hidden="true" className="shrink-0">
      <circle cx="34" cy="34" r={r} fill="none" stroke="#e7eaf1" strokeWidth="7" />
      <circle cx="34" cy="34" r={r} fill="none" stroke={p >= 80 ? "#16a34a" : p >= 50 ? "#d97706" : "#dc2626"} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(p / 100) * c} ${c}`} transform="rotate(-90 34 34)" />
      <text x="34" y="39" textAnchor="middle" fontSize="15" fontWeight="600" fill="#0e1a2b">{p}%</text>
    </svg>
  );
}

function Quick({ icon, title, text, children }: { icon: IconName; title: string; text: string; children?: React.ReactNode }) {
  return (
    <li className="flex gap-4 rounded-2xl border border-line bg-card p-4">
      {children ?? <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: TONE.slate.bg, color: TONE.slate.fg }}><Icon name={icon} size={22} /></span>}
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-[15px] font-medium">{title}<span className="pill pill-wait !text-[12px]">My guess</span></p>
        <p className="mt-1 text-[14px] leading-snug text-muted">{text || "Nothing reported."}</p>
      </div>
    </li>
  );
}

export function DesignChecks({ out, projectId, versionId }: { out: DesignOutput; projectId: string; versionId: string }) {
  const [palette, setPalette] = useState<Palette | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    fetch(`/api/projects/${projectId}/palette?version=${versionId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => live && setPalette(d))
      .catch(() => live && setFailed(true));
    return () => { live = false; };
  }, [projectId, versionId]);

  const c = out.design_checks;
  const px = c.tap_sizes.match(/(\d{2,3})\s?px/)?.[1];
  const pct = c.style_match.match(/(\d{1,3})\s?%/)?.[1];
  const notes = out.computed_checks.filter((l) => !/ to 1\./.test(l));

  return (
    <>
      <Section title="Colours and fonts" icon="palette" tone="indigo" hint="read from the prototype itself">
        {!palette && !failed && <p className="note">Reading the colours…</p>}
        {failed && <p className="note">I couldn&apos;t read the colours from this prototype.</p>}
        {palette && (
          <div className="space-y-5">
            {palette.colours.length > 0 ? (
              <>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">{palette.colours.map((x) => <ColourTile key={x.hex} c={x} />)}</ul>
                <p className="note">These are the exact codes used. Click a colour to copy its code.</p>
              </>
            ) : <p className="note">No colour codes were found in this prototype.</p>}
            {(palette.fonts.heading || palette.fonts.body) && (
              <ul className="grid gap-3 sm:grid-cols-2">
                {(["heading", "body"] as const).filter((k) => palette.fonts[k]).map((k) => (
                  <li key={k} className="flex items-center gap-4 rounded-2xl border border-line bg-card p-4">
                    <span aria-hidden="true" className="text-[40px] font-semibold leading-none" style={{ fontFamily: palette.fonts[k] }}>Aa</span>
                    <p className="min-w-0 text-[15px]"><span className="block text-[12px] font-medium uppercase tracking-wide text-muted">{k === "heading" ? "Headings" : "Text"}</span>{palette.fonts[k]}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Section>

      <Section title="Can people read it?" icon="eye" tone="green" hint="Checked: worked out by the app">
        {palette && palette.pairs.length > 0 ? (
          <ul className="grid gap-3 lg:grid-cols-2">{palette.pairs.map((p) => <Contrast key={p.name} p={p} />)}</ul>
        ) : out.computed_checks.some((l) => / to 1\./.test(l)) ? (
          <ul className="space-y-1.5 text-[15px]">{out.computed_checks.filter((l) => / to 1\./.test(l)).map((l, i) => <li key={i}>{l}</li>)}</ul>
        ) : (
          <p className="note">No colour pairs to compare.</p>
        )}
        {notes.length > 0 && (
          <ul className="mt-3 space-y-2">{notes.map((l, i) => <li key={i} className="flex gap-2 rounded-xl p-3 text-[14px] leading-snug" style={{ background: TONE.amber.bg, color: TONE.amber.fg }}><Icon name="alert" size={16} className="mt-0.5" />{l}</li>)}</ul>
        )}
      </Section>

      <Section title="Quick checks" icon="check" tone="sky" hint="my own review, not a full audit">
        <ul className="grid gap-3 lg:grid-cols-2">
          <Quick icon="eye" title="Colour contrast" text={c.contrast} />
          <Quick icon="phone" title="Size of buttons" text={c.tap_sizes}>
            {px && <span aria-hidden="true" className="flex h-[68px] w-[68px] shrink-0 flex-col items-center justify-center rounded-2xl bg-[#f3f5f9]"><span className="text-[22px] font-semibold leading-none">{px}</span><span className="text-[12px] text-muted">px tall</span></span>}
          </Quick>
          <Quick icon="alert" title="Pushy or tricky design" text={c.manipulative_design} />
          <Quick icon="palette" title="How well it matches your style" text={c.style_match.replace(/\(?my own estimate\)?/i, "").trim()}>
            {pct && <Ring percent={Number(pct)} />}
          </Quick>
        </ul>
        {c.off_style_items.length > 0 && (
          <div className="mt-4 rounded-2xl p-4" style={{ background: TONE.amber.bg, border: `1px solid ${TONE.amber.edge}` }}>
            <p className="mb-2 flex items-center gap-2 text-[14px] font-medium" style={{ color: TONE.amber.fg }}><Icon name="alert" size={16} />Added, but not in your style</p>
            <ul className="flex flex-wrap gap-2">
              {c.off_style_items.map((t, i) => {
                const hex = t.match(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/)?.[0];
                return (
                  <li key={i} className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[14px] leading-snug">
                    {hex && <span aria-hidden="true" className="h-4 w-4 shrink-0 rounded-full border border-black/10" style={{ background: hex }} />}
                    {t}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </Section>
    </>
  );
}
