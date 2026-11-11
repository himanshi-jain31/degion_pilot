import type { Guess } from "@/lib/storage";
import { Icon } from "@/components/Icons";

// A guess is saved as one sentence. These two patterns are pulled apart so each part has its own place:
//   You asked me to decide: "the question" I will choose what fits best.
//   the guess. (How to check: the way to check.)
function split(text: string) {
  const asked = text.match(/^You asked me to decide:\s*["“](.+?)["”]\s*I will choose what fits best\.?$/i);
  if (asked) return { kind: "decided" as const, main: asked[1], check: "" };
  const m = text.match(/^(.*?)\s*\(How to check:\s*(.+?)\)\s*$/i);
  if (m) return { kind: "guess" as const, main: m[1].replace(/\.$/, ""), check: m[2].replace(/\.$/, "") };
  return { kind: "guess" as const, main: text, check: "" };
}

const LABEL_PILL: Record<string, string> = { Checked: "pill-ok", "My guess": "pill-wait", "Test idea only": "pill-idle" };
const STATUS_PILL: Record<string, string> = { Confirmed: "pill-ok", Wrong: "pill-bad", Open: "pill-idle" };

// One guess as a small card: the two chips always sit in the same row at the top, the words below, how to check at the bottom
export function GuessCard({ g }: { g: Guess }) {
  const { kind, main, check } = split(g.text);
  return (
    <li className="rounded-2xl border border-[#f1e3c4] bg-[#fffaf0] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`pill ${LABEL_PILL[g.label] ?? "pill-wait"} !px-2.5 !py-0.5 !text-[12px]`}>{g.label}</span>
        {g.status && <span className={`pill ${STATUS_PILL[g.status] ?? "pill-idle"} !px-2.5 !py-0.5 !text-[12px]`}>{g.status}</span>}
      </div>
      {kind === "decided" ? (
        <>
          <p className="mt-3 text-[15px] font-medium leading-snug">&ldquo;{main}&rdquo;</p>
          <p className="mt-1.5 text-[13px] leading-snug text-muted">You left this to me, so I will choose what fits best.</p>
        </>
      ) : (
        <p className="mt-3 text-[15px] leading-snug first-letter:uppercase">{main}</p>
      )}
      {check && (
        <p className="mt-3 flex items-start gap-2 border-t border-[#f1e3c4] pt-3 text-[13px] leading-snug text-muted">
          <Icon name="check" size={14} className="mt-0.5 text-[var(--ok)]" />
          <span><span className="font-medium text-ink">To check:</span> {check}</span>
        </p>
      )}
      {g.evidence && <p className="mt-3 border-t border-[#f1e3c4] pt-3 text-[13px] leading-snug text-muted"><span className="font-medium text-ink">From your notes:</span> {g.evidence}</p>}
    </li>
  );
}

export function GuessList({ items }: { items: Guess[] }) {
  return <ul className="space-y-3">{items.map((g) => <GuessCard key={g.id} g={g} />)}</ul>;
}
