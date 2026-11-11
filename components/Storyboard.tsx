"use client";

import { useEffect, useState } from "react";
import { Icon, type IconName } from "@/components/Icons";
import { tone as avatarTone } from "@/components/ProfileCard";

type Frame = { frame: number; scene: string };

// Each scene gets one big icon, picked from the words in it (first match wins)
const ICONS: [RegExp, IconName][] = [
  [/phone|mobile|app\b|tap|screen/i, "phone"],
  [/email|e-mail|message|chat|text\b|write|writes|wrote/i, "mail"],
  [/wait|no reply|days|late|slow|delay/i, "clock"],
  [/notif|alert|ping|reminder/i, "bell"],
  [/approve|answer|accept|reply|yes|done|confirm|decid|agree|success|happy/i, "check"],
  [/day off|time off|leave|holiday|vacation|calendar|date|plan|trip|away/i, "calendar"],
  [/meeting|team|manager|colleague|group|together/i, "users"],
  [/search|look|find|check|review|see\b|sees/i, "search"],
  [/problem|error|stuck|confus|frustrat|worr|unsure|miss/i, "alert"],
];
const pickIcon = (t: string): IconName => ICONS.find(([re]) => re.test(t))?.[1] ?? "pin";

// Capitalised words that are names of people, not just the start of a sentence
const NOT_NAMES = new Set("The A An She He They It We I When After Then Later Now Today Next At In On Her His Their Our One Every Each Some Staff Managers Manager Admin User Users Meanwhile Finally Before While Once If But And So Soon Back Instead Here There".split(" "));
function people(t: string) {
  const found: string[] = [];
  for (const m of t.matchAll(/\b[A-Z][a-z]{1,}\b/g)) if (!NOT_NAMES.has(m[0]) && !found.includes(m[0])) found.push(m[0]);
  return found.slice(0, 3);
}

// A different soft scene colour for every frame
const SCENES = [
  { from: "#eef0ff", to: "#dfe3ff", fg: "#4338ca" },
  { from: "#ecf6ff", to: "#d5eafc", fg: "#075985" },
  { from: "#ecfdf3", to: "#d3f5e1", fg: "#166534" },
  { from: "#fff7e6", to: "#fdebc4", fg: "#92400e" },
  { from: "#fdf2f8", to: "#fbdcec", fg: "#9d174d" },
  { from: "#ecfeff", to: "#cdf4f9", fg: "#155e75" },
];

export function Storyboard({ frames }: { frames: Frame[] }) {
  const [active, setActive] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setActive((a) => {
        const next = a === null ? 0 : a + 1;
        if (next >= frames.length) {
          setPlaying(false);
          return null;
        }
        return next;
      });
    }, 2200);
    return () => clearInterval(t);
  }, [playing, frames.length]);

  function play() {
    if (playing) {
      setPlaying(false);
      return;
    }
    setActive(0);
    setPlaying(true);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button onClick={play} className="btn btn-secondary !min-h-10 !px-4 !text-[15px]">
          <span aria-hidden="true" className="mr-2">{playing ? "■" : "▶"}</span>
          {playing ? "Stop" : "Play the story"}
        </button>
        <p className="note">{active === null ? "Click a frame to focus on it." : `Frame ${active + 1} of ${frames.length}`}</p>
      </div>

      <ol className="grid items-stretch gap-x-10 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
        {frames.map((f, i) => {
          const sc = SCENES[i % SCENES.length];
          const names = people(f.scene);
          const on = active === i;
          const dim = active !== null && !on;
          return (
            <li key={f.frame} className="relative flex">
              <button
                onClick={() => { setPlaying(false); setActive(on ? null : i); }}
                aria-pressed={on}
                className={`flex w-full flex-col overflow-hidden rounded-2xl border bg-card text-left transition duration-300 ${on ? "scale-[1.02] border-accent shadow-lg" : "border-line hover:-translate-y-0.5 hover:shadow-md"} ${dim ? "opacity-45" : ""}`}
              >
                {/* The picture */}
                <div className="relative flex h-44 items-center justify-center overflow-hidden" style={{ background: `linear-gradient(135deg, ${sc.from}, ${sc.to})` }}>
                  <span aria-hidden="true" className="absolute inset-0 opacity-60" style={{ background: `radial-gradient(circle at 1px 1px, ${sc.fg}33 1px, transparent 0) 0 0/16px 16px` }} />
                  <span aria-hidden="true" className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/50" />
                  <span aria-hidden="true" className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/40" />
                  <span aria-hidden="true" className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-md" style={{ color: sc.fg }}>
                    <Icon name={pickIcon(f.scene)} size={46} />
                  </span>
                  <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[13px] font-semibold shadow-sm" style={{ color: sc.fg }}>Frame {f.frame}</span>
                  {names.length > 0 && (
                    <span className="absolute bottom-3 left-3 flex -space-x-2" aria-hidden="true">
                      {names.map((n) => {
                        const [bg, fg] = avatarTone(n);
                        return <span key={n} title={n} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-[14px] font-semibold" style={{ background: bg, color: fg }}>{n.charAt(0)}</span>;
                      })}
                    </span>
                  )}
                </div>
                {/* The caption, like a comic */}
                <p className="flex-1 border-t border-line px-4 py-3.5 text-[16px] leading-snug">{f.scene}</p>
              </button>
              {i < frames.length - 1 && (i + 1) % 2 !== 0 && (
                <span aria-hidden="true" className="absolute -right-[34px] top-[84px] z-10 hidden h-7 w-7 items-center justify-center rounded-full border border-line bg-white text-[14px] text-muted shadow-sm sm:flex xl:hidden">→</span>
              )}
              {i < frames.length - 1 && (i + 1) % 3 !== 0 && (
                <span aria-hidden="true" className="absolute -right-[34px] top-[84px] z-10 hidden h-7 w-7 items-center justify-center rounded-full border border-line bg-white text-[14px] text-muted shadow-sm xl:flex">→</span>
              )}
            </li>
          );
        })}
      </ol>
      <p className="note mt-4">The pictures are drawn from the words in each scene. They show the idea, not the final screens.</p>
    </div>
  );
}
