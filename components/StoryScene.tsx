import { ICON_PATHS, type IconName } from "@/components/Icons";

// ---------- What happens in a scene, worked out from its words ----------

const NOT_NAMES = new Set("The A An She He They It We I When After Then Later Now Today Next At In On Her His Their Our One Every Each Some Staff Managers Manager Admin User Users Meanwhile Finally Before While Once If But And So Soon Back Instead Here There Someone".split(" "));
export function namesIn(t: string) {
  const found: string[] = [];
  for (const m of t.matchAll(/\b[A-Z][a-z]{1,}\b/g)) if (!NOT_NAMES.has(m[0]) && !found.includes(m[0])) found.push(m[0]);
  return found.slice(0, 2);
}

export type Plan = {
  who: string[]; // up to two people; "" is a person who is not named
  thinks?: IconName; // a thought bubble with this icon
  device?: "phone" | "laptop";
  screen: "calendar" | "mail" | "check" | "lines";
  sends: boolean; // a message flies to the other person
  says?: "yes" | "no" | "dots" | "question";
  waits: boolean;
  table: boolean;
  mood: "happy" | "worried" | "calm";
};

const has = (t: string, re: RegExp) => re.test(t);

export function planScene(scene: string, carry: string[]): Plan {
  const t = scene.toLowerCase();
  const named = namesIn(scene);
  // "She sends a request" has no name, so it is the person from the frame before
  const who = named.length ? named : carry.length ? carry.slice(0, has(t, /\bthey\b/) ? 2 : 1) : [""];
  const wants = has(t, /want|need|plan|decid|think|wonder|hope|would like/);
  const sends = has(t, /send|sends|submit|request|ask|writ|book|pick|fill|type|post|create|apply/);
  const answers = has(t.replace(/no (reply|answer|response)/g, ""), /answer|approv|repl|accept|confirm|declin|reject|respond|say yes|say no/);
  const waits = has(t, /wait|no reply|no answer|days|hours|still no|delay|slow/);
  const sees = has(t, /see\b|sees|check|review|look|read|notice|notif|find/);
  const leave = has(t, /day off|time off|leave|holiday|vacation|calendar|date|trip|away|off\b/);
  const mail = has(t, /email|e-mail|message|request|letter/);
  const phone = has(t, /phone|mobile|app\b|tap/);
  const laptop = has(t, /laptop|computer|desktop|screen|pc\b/);
  const negative = has(t, /wait|no reply|stuck|confus|frustrat|worr|unsure|miss|problem|error|slow|angry|late|lost/);
  const positive = has(t, /approv|accept|happy|easy|quick|done|success|glad|relief|confirm|yes\b|calm/);
  const declined = has(t, /declin|reject|say no|\bno\b(?! reply| answer)/);

  const device = phone ? "phone" : laptop ? "laptop" : sends || sees || answers ? "phone" : undefined;
  return {
    who: who.slice(0, 2),
    thinks: wants ? (leave ? "calendar" : "lightbulb") : undefined,
    device,
    screen: leave && !answers ? "calendar" : answers ? "check" : mail || sends ? "mail" : "lines",
    sends: sends && !answers,
    says: answers ? (declined ? "no" : "yes") : has(t, /\?|unsure|wonder/) ? "question" : !wants && !waits && !sends && !sees ? "dots" : undefined,
    waits,
    table: has(t, /meeting|call|desk|office|team|together/),
    mood: negative && !positive ? "worried" : positive ? "happy" : "calm",
  };
}

// ---------- The drawing ----------

const SKIN = ["#f2c9a5", "#d9a074", "#8d5a3b", "#f6d7b8", "#b9784d"];
const HAIR = ["#2b2b33", "#5b3a29", "#8a5a2b", "#0e1a2b", "#a0522d"];
const SHIRT = ["#4f46e5", "#0ea5e9", "#16a34a", "#d97706", "#db2777", "#0891b2"];
function hash(s: string) {
  let h = 7;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

function Ico({ name, x, y, size, color = "currentColor", sw = 1.8 }: { name: IconName; x: number; y: number; size: number; color?: string; sw?: number }) {
  return (
    <svg x={x} y={y} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {ICON_PATHS[name]}
    </svg>
  );
}

function Screen({ kind, x, y, w, h, accent }: { kind: Plan["screen"]; x: number; y: number; w: number; h: number; accent: string }) {
  const cx = x + w / 2, cy = y + h / 2;
  if (kind === "calendar")
    return (
      <g>
        <rect x={x + 3} y={y + 4} width={w - 6} height={5} rx={1.5} fill={accent} />
        {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={x + 4 + c * ((w - 8) / 3)} y={y + 13 + r * 6} width={(w - 8) / 3 - 2} height={4} rx={1} fill={r === 1 && c === 1 ? accent : "#e5e9f1"} />))}
      </g>
    );
  if (kind === "mail")
    return (
      <g>
        <rect x={x + 4} y={cy - 7} width={w - 8} height={14} rx={2} fill="#eef0ff" stroke={accent} strokeWidth={1} />
        <path d={`M${x + 4},${cy - 6} L${cx},${cy + 2} L${x + w - 4},${cy - 6}`} fill="none" stroke={accent} strokeWidth={1} />
      </g>
    );
  if (kind === "check")
    return (
      <g>
        <circle cx={cx} cy={cy} r={Math.min(w, h) / 3} fill="#16a34a" />
        <path d={`M${cx - 4},${cy} l3,3 l5,-6`} fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  return (
    <g>
      {[0, 1, 2].map((i) => <rect key={i} x={x + 4} y={y + 7 + i * 7} width={i === 2 ? w * 0.4 : w - 8} height={3} rx={1.5} fill="#d5dbe6" />)}
    </g>
  );
}

function Person({ cx, name, mood, holding, plan, accent, flip }: { cx: number; name: string; mood: Plan["mood"]; holding: boolean; plan: Plan; accent: string; flip?: boolean }) {
  const h = hash(name || "x");
  const skin = SKIN[h % SKIN.length], hair = HAIR[(h >> 3) % HAIR.length], shirt = SHIRT[(h >> 5) % SHIRT.length], style = (h >> 7) % 3;
  const d = flip ? -1 : 1;
  return (
    <g>
      {style === 1 && <rect x={cx - 23} y={60} width={46} height={36} rx={14} fill={hair} />}
      <path d={`M${cx - 34},182 V130 Q${cx - 34},104 ${cx},104 Q${cx + 34},104 ${cx + 34},130 V182 Z`} fill={shirt} />
      <rect x={cx - 6} y={90} width={12} height={16} rx={4} fill={skin} style={{ filter: "brightness(0.92)" }} />
      <circle cx={cx} cy={72} r={20} fill={skin} />
      {style === 2 && <circle cx={cx} cy={50} r={8} fill={hair} />}
      <path d={`M${cx - 21},72 A21,21 0 0 1 ${cx + 21},72 Q${cx + 8},60 ${cx - 21},72 Z`} fill={hair} />
      <circle cx={cx - 7} cy={74} r={2.3} fill="#0e1a2b" />
      <circle cx={cx + 7} cy={74} r={2.3} fill="#0e1a2b" />
      {mood === "worried" && <path d={`M${cx - 11},67 l7,-2 M${cx + 11},67 l-7,-2`} stroke="#0e1a2b" strokeWidth={1.6} strokeLinecap="round" />}
      <path d={mood === "happy" ? `M${cx - 7},82 Q${cx},90 ${cx + 7},82` : mood === "worried" ? `M${cx - 6},86 Q${cx},80 ${cx + 6},86` : `M${cx - 5},83 Q${cx},86 ${cx + 5},83`} fill="none" stroke="#0e1a2b" strokeWidth={1.8} strokeLinecap="round" />
      {holding && plan.device === "phone" && (
        <g transform={`rotate(${d * -8} ${cx + d * 30} 130)`}>
          <rect x={cx + d * 30 - 12} y={106} width={24} height={40} rx={5} fill="#0e1a2b" />
          <rect x={cx + d * 30 - 10} y={109} width={20} height={34} rx={3} fill="#fff" />
          <Screen kind={plan.screen} x={cx + d * 30 - 10} y={109} w={20} h={34} accent={accent} />
          <circle cx={cx + d * 30 + d * 9} cy={146} r={6} fill={skin} />
        </g>
      )}
      {holding && plan.device === "laptop" && (
        <g>
          <rect x={cx + d * 30 - 22} y={118} width={44} height={28} rx={3} fill="#0e1a2b" />
          <rect x={cx + d * 30 - 20} y={120} width={40} height={24} rx={2} fill="#fff" />
          <Screen kind={plan.screen} x={cx + d * 30 - 20} y={120} w={40} h={24} accent={accent} />
          <rect x={cx + d * 30 - 28} y={146} width={56} height={5} rx={2.5} fill="#9aa3b2" />
        </g>
      )}
      {name && (
        <g>
          <rect x={cx - 26} y={156} width={52} height={17} rx={8.5} fill="#fff" opacity={0.95} />
          <text x={cx} y={168} textAnchor="middle" fontSize={11} fontWeight={600} fill="#0e1a2b">{name}</text>
        </g>
      )}
    </g>
  );
}

function Bubble({ x, y, kind, icon, ink, thought }: { x: number; y: number; kind: "icon" | "text"; icon?: IconName; ink: string; thought?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={58} height={42} rx={16} fill="#fff" stroke={ink} strokeWidth={1.5} />
      {thought ? (
        <>
          <circle cx={x - 6} cy={y + 50} r={5} fill="#fff" stroke={ink} strokeWidth={1.3} />
          <circle cx={x - 14} cy={y + 60} r={3} fill="#fff" stroke={ink} strokeWidth={1.3} />
        </>
      ) : (
        <path d={`M${x + 8},${y + 40} L${x - 4},${y + 56} L${x + 22},${y + 41}`} fill="#fff" stroke={ink} strokeWidth={1.5} strokeLinejoin="round" />
      )}
      {!thought && <rect x={x + 8} y={y + 39} width={13} height={3} fill="#fff" />}
      {kind === "icon" && icon && <Ico name={icon} x={x + 15} y={y + 7} size={28} color={ink} />}
      {kind === "text" && <text x={x + 29} y={y + 29} textAnchor="middle" fontSize={24} fontWeight={700} fill={ink}>…</text>}
    </g>
  );
}

export function StoryScene({ plan, scheme }: { plan: Plan; scheme: { from: string; to: string; fg: string } }) {
  const two = plan.who.length > 1;
  const cx1 = two ? 88 : 108;
  const cx2 = 232;
  const ink = scheme.fg;
  const bubbleX = two ? 128 : cx1 + 30;
  const label = plan.who.filter(Boolean).join(" and ");
  return (
    <svg viewBox="0 0 320 182" className="block h-full w-full" role="img" aria-label={`Scene${label ? ` with ${label}` : ""}`} preserveAspectRatio="xMidYMid slice">
      <rect width="320" height="182" fill={scheme.from} />
      <rect y="132" width="320" height="50" fill={scheme.to} />
      <rect x="236" y="18" width="62" height="50" rx="7" fill="#fff" opacity="0.8" />
      <path d="M267,18 V68 M236,43 H298" stroke={scheme.from} strokeWidth="3" />
      <circle cx="40" cy="30" r="14" fill="#fff" opacity="0.45" />

      <Person cx={cx1} name={plan.who[0] ?? ""} mood={plan.mood} holding={!!plan.device && (plan.says !== "dots" || plan.sends)} plan={plan} accent={ink} />
      {two && <Person cx={cx2} name={plan.who[1]} mood={plan.mood === "worried" ? "calm" : plan.mood} holding={!!plan.device && plan.says === "yes"} plan={{ ...plan, screen: plan.says === "yes" ? "check" : "mail" }} accent={ink} flip />}

      {plan.sends && two && (
        <g>
          <path d={`M${cx1 + 50},118 C150,70 180,70 ${cx2 - 56},118`} fill="none" stroke={ink} strokeWidth={2} strokeDasharray="4 5" strokeLinecap="round" />
          <circle cx="160" cy="84" r="15" fill="#fff" stroke={ink} strokeWidth="1.5" />
          <Ico name="mail" x={150} y={74} size={20} color={ink} />
        </g>
      )}
      {plan.sends && !two && (
        <g>
          <path d={`M${cx1 + 52},112 C170,96 230,80 296,62`} fill="none" stroke={ink} strokeWidth={2} strokeDasharray="4 5" strokeLinecap="round" />
          <circle cx="226" cy="82" r="15" fill="#fff" stroke={ink} strokeWidth="1.5" />
          <Ico name="mail" x={216} y={72} size={20} color={ink} />
        </g>
      )}

      {plan.thinks && <Bubble x={bubbleX + 14} y={16} kind="icon" icon={plan.thinks} ink={ink} thought />}
      {plan.waits && !plan.thinks && <Bubble x={bubbleX + 14} y={16} kind="icon" icon="clock" ink={ink} thought />}
      {plan.says === "yes" && !plan.thinks && <Bubble x={bubbleX + 14} y={16} kind="icon" icon="check" ink="#16a34a" />}
      {plan.says === "no" && !plan.thinks && (
        <g>
          <Bubble x={bubbleX + 14} y={16} kind="icon" icon="alert" ink="#dc2626" />
        </g>
      )}
      {plan.says === "question" && !plan.thinks && !plan.waits && (
        <g>
          <Bubble x={bubbleX + 14} y={16} kind="icon" icon="help" ink={ink} />
        </g>
      )}
      {plan.says === "dots" && <Bubble x={bubbleX + 14} y={16} kind="text" ink={ink} />}

      {plan.table && (
        <g>
          <rect y="146" width="320" height="36" fill="#a5784d" />
          <rect y="146" width="320" height="5" fill="#c79566" />
        </g>
      )}
    </svg>
  );
}
