import type { Profile } from "@/lib/storage";
import { Icon } from "@/components/Icons";
import { Pill } from "@/components/UnderstandView";

// A soft colour for each person, always the same for the same name
const TONES = [
  ["#eef0ff", "#4338ca"],
  ["#ecfdf3", "#166534"],
  ["#fff7e6", "#92400e"],
  ["#fdf2f8", "#9d174d"],
  ["#ecfeff", "#155e75"],
];
export function tone(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length];
}

// "Anna, employee" becomes the name Anna and the role employee
function split(full: string) {
  const [first, ...rest] = full.split(/,| - | – |\(/);
  return { name: first.trim() || full, role: rest.join(" ").replace(/\)$/, "").trim() };
}

function Fact({ icon, label, children }: { icon: "target" | "pin"; label: string; children: string }) {
  return (
    <div className="flex items-start gap-3">
      <span aria-hidden="true" className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f4f4f0] text-ink"><Icon name={icon} size={17} /></span>
      <p className="min-w-0 text-[15px] leading-snug"><span className="block text-[12px] font-medium uppercase tracking-wide text-muted">{label}</span>{children}</p>
    </div>
  );
}

// One user profile: who they are, what they want, where they are, what annoys them
export function ProfileCard({ p, showLabel = true }: { p: Profile; showLabel?: boolean }) {
  const { name, role } = split(p.name);
  const [bg, fg] = tone(p.name);
  return (
    <article className="card flex h-full flex-col gap-4 !p-5">
      <header className="flex items-center gap-3">
        <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[24px] font-semibold" style={{ background: bg, color: fg }}>{name.charAt(0).toUpperCase()}</span>
        <div className="min-w-0">
          <h4 className="text-[18px] font-medium leading-tight">{name}</h4>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {role && <span className="rounded-full px-2.5 py-0.5 text-[13px] font-medium" style={{ background: bg, color: fg }}>{role}</span>}
            {showLabel && <Pill label={p.label} />}
          </div>
        </div>
      </header>
      {p.goal && <Fact icon="target" label="Wants to">{p.goal}</Fact>}
      {p.situation && <Fact icon="pin" label="Usually">{p.situation}</Fact>}
      {p.frustrations.length > 0 && (
        <div className="mt-auto rounded-xl bg-[var(--bad-soft)] p-3">
          <p className="mb-2 flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-wide text-[var(--bad-ink)]"><Icon name="alert" size={14} />Gets annoyed by</p>
          <ul className="flex flex-wrap gap-1.5">
            {p.frustrations.map((f, i) => (
              <li key={i} className="rounded-full bg-white px-2.5 py-1 text-[13px] leading-snug text-[var(--bad-ink)]">{f}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

export function ProfileGrid({ profiles }: { profiles: Profile[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {profiles.map((u, i) => <ProfileCard key={i} p={u} />)}
    </div>
  );
}
