"use client";

import { useEffect, useState } from "react";
import { StoryScene, planScene } from "@/components/StoryScene";

type Frame = { frame: number; scene: string };

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

  // work out each scene once. A frame with no name ("She sends...") is about the person from the frame before.
  const plans: ReturnType<typeof planScene>[] = [];
  let carry: string[] = [];
  for (const f of frames) {
    const p = planScene(f.scene, carry);
    plans.push(p);
    if (p.who.some(Boolean)) carry = p.who.filter(Boolean);
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
                <div className="relative aspect-[320/182] w-full overflow-hidden">
                  <StoryScene plan={plans[i]} scheme={sc} />
                  <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[13px] font-semibold shadow-sm" style={{ color: sc.fg }}>Frame {f.frame}</span>
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
      <p className="note mt-4">The pictures are drawn from the words in each scene: who is in it, what they hold or send, and how they feel. They show the idea, not the final screens.</p>
    </div>
  );
}
