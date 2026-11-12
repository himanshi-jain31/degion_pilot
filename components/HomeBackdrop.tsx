// The soft picture behind the Home page: glowing colour clouds and thin flowing lines that suggest a design flow.
// It is only decoration (hidden from screen readers), it never gets in the way of clicks, and it fades out in the middle
// so the text on top stays easy to read. It drifts very slowly, and stays still if the computer is set to reduce motion.

// Parallel flowing lines, each one a little lower and a little different, like paths that gather and part
const LINES = Array.from({ length: 18 }, (_, i) => {
  const o = i * 20;
  return `M -240 ${640 + o} C 160 ${360 + o * 0.7}, 560 ${900 + o * 0.35}, 940 ${560 + o * 0.7} S 1420 ${200 + o * 0.45}, 1860 ${330 + o * 0.95}`;
});

export function HomeBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden sm:left-[72px]">
      {/* Colour clouds */}
      <div
        className="backdrop-drift absolute inset-0"
        style={{
          // the clouds fade out around the middle of the page, where the text sits
          WebkitMaskImage: "radial-gradient(ellipse 62% 52% at 50% 36%, transparent 0%, transparent 42%, #000 100%)",
          maskImage: "radial-gradient(ellipse 62% 52% at 50% 36%, transparent 0%, transparent 42%, #000 100%)",
        }}
      >
        <div className="absolute -right-72 -top-52 h-[min(760px,80vw)] w-[min(760px,80vw)] rounded-full" style={{ background: "radial-gradient(circle at 40% 40%, rgba(129,140,248,0.28), rgba(129,140,248,0) 66%)" }} />
        <div className="absolute -right-24 top-[38%] h-[min(640px,70vw)] w-[min(640px,70vw)] rounded-full" style={{ background: "radial-gradient(circle at 50% 50%, rgba(125,200,255,0.38), rgba(125,200,255,0) 66%)" }} />
        <div className="absolute -left-48 bottom-[-18%] h-[min(640px,70vw)] w-[min(640px,70vw)] rounded-full" style={{ background: "radial-gradient(circle at 50% 50%, rgba(196,181,253,0.34), rgba(196,181,253,0) 66%)" }} />
        <div className="absolute bottom-[-12%] right-[18%] h-[420px] w-[520px] rounded-full" style={{ background: "radial-gradient(circle at 50% 50%, rgba(253,214,180,0.34), rgba(253,214,180,0) 68%)" }} />
      </div>

      {/* Flowing lines and two soft silk shapes */}
      <svg className="backdrop-drift-slow absolute inset-0 h-full w-full" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" fill="none">
        <defs>
          <linearGradient id="bd-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#a5b4fc" stopOpacity="0" />
            <stop offset="0.35" stopColor="#818cf8" stopOpacity="0.55" />
            <stop offset="0.7" stopColor="#7dc8ff" stopOpacity="0.5" />
            <stop offset="1" stopColor="#c4b5fd" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="bd-silk-a" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#818cf8" stopOpacity="0.15" />
            <stop offset="1" stopColor="#7dc8ff" stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id="bd-silk-b" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c4b5fd" stopOpacity="0.24" />
            <stop offset="1" stopColor="#fdd6b4" stopOpacity="0.05" />
          </linearGradient>
          {/* keeps the middle calm: the lines fade out where the text sits */}
          <radialGradient id="bd-calm" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#000" stopOpacity="0.96" />
            <stop offset="0.7" stopColor="#000" stopOpacity="0.55" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <mask id="bd-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1600" height="1000">
            <rect width="1600" height="1000" fill="#fff" />
            <ellipse cx="800" cy="470" rx="620" ry="430" fill="url(#bd-calm)" />
          </mask>
        </defs>
        <g mask="url(#bd-mask)">
          <path d="M 1000 -40 C 1180 160, 1060 330, 1280 470 S 1500 760, 1680 700 L 1680 -40 Z" fill="url(#bd-silk-a)" />
          <path d="M -80 560 C 120 480, 260 640, 460 720 S 760 900, 900 1060 L -80 1060 Z" fill="url(#bd-silk-b)" />
          {LINES.map((d, i) => (
            <path key={i} d={d} stroke="url(#bd-line)" strokeWidth={i % 5 === 0 ? 1.6 : 1} opacity={0.5 + (i % 4) * 0.08} />
          ))}
        </g>
      </svg>
    </div>
  );
}
