"use client";

import { useEffect, useRef, useState } from "react";
import type { DesignStyle } from "@/lib/storage";

type StyleView = (Omit<DesignStyle, "files"> & { files: { name: string; kind: string; note: string }[] }) | null;

const FONTS = [
  ["clean", "Clean (sans-serif)"],
  ["serif", "Classic (serif)"],
  ["friendly", "Friendly (rounded)"],
  ["mono", "Technical (monospace)"],
] as const;

// The "Design style" section: colours, fonts, corners, or a brand guide
export function DesignStylePanel({ projectId, style, onSaved }: { projectId: string; style: StyleView; onSaved: () => Promise<void> }) {
  const [useColours, setUseColours] = useState(!!style?.colours);
  const [primary, setPrimary] = useState(style?.colours?.primary ?? "#2f5bd8");
  const [background, setBackground] = useState(style?.colours?.background ?? "#ffffff");
  const [text, setText] = useState(style?.colours?.text ?? "#1d2433");
  const [accent, setAccent] = useState(style?.colours?.accent ?? "#e0702b");
  const [useAccent, setUseAccent] = useState(!!style?.colours?.accent);
  const [headingFont, setHeadingFont] = useState(style?.headingFont ?? "clean");
  const [bodyFont, setBodyFont] = useState(style?.bodyFont ?? "clean");
  const [otherFont, setOtherFont] = useState(style?.otherFont ?? "");
  const [corners, setCorners] = useState<string>(style?.corners ?? "slight");
  const [notes, setNotes] = useState(style?.notes ?? "");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function call(url: string, init: RequestInit) {
    const res = await fetch(url, init);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Something went wrong.");
    return data;
  }

  // Everything saves by itself a moment after you change it. There is no Save button.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setMsg("Saving...");
    const timer = setTimeout(async () => {
      try {
        await call(`/api/projects/${projectId}/style`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            colours: useColours ? { primary, background, text, ...(useAccent ? { accent } : {}) } : undefined,
            headingFont, bodyFont, otherFont, corners, notes,
          }),
        });
        setMsg("Saved");
        await onSaved();
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "I couldn't save that. Please try again.");
      }
    }, 700);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useColours, primary, background, text, accent, useAccent, headingFont, bodyFont, otherFont, corners, notes]);

  // Brand guide files are saved the moment you choose them
  async function uploadFiles(chosen: File[]) {
    if (chosen.length === 0) return;
    setBusy(true);
    setMsg("Saving...");
    try {
      const form = new FormData();
      chosen.forEach((f) => form.append("files", f));
      const data = await call(`/api/projects/${projectId}/style/files`, { method: "POST", body: form });
      setMsg(data.skipped.length ? `Saved. I skipped: ${data.skipped.join("; ")}` : "Saved");
      await onSaved();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "I couldn't save that. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function clear() {
    setBusy(true);
    try {
      await call(`/api/projects/${projectId}/style`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clear: true }) });
      setUseColours(false);
      setMsg("Cleared. I will use a clean neutral look.");
      await onSaved();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const field = "mt-1 rounded-lg border border-[var(--control-line)] p-2";
  return (
    <div>
      <p className="mt-2 text-neutral-700">
        Tell me how the final design should look. Everything here is optional. If you leave it empty, I use a clean neutral look and say it is not matched to a design system.
        You can change this any time before the Visual design step starts.
      </p>

      <fieldset className="mt-5 rounded-lg border border-line p-4">
        <legend className="px-1 font-medium">Colours</legend>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={useColours} onChange={(e) => setUseColours(e.target.checked)} /> Use my colours
        </label>
        {useColours && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {([["Main colour (buttons)", primary, setPrimary], ["Background", background, setBackground], ["Text", text, setText]] as const).map(([label, v, set]) => (
              <label key={label} className="flex items-center gap-3 text-sm">
                <input type="color" value={v} onChange={(e) => set(e.target.value)} className="h-10 w-14" /> {label} <span className="text-neutral-600">{v}</span>
              </label>
            ))}
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" checked={useAccent} onChange={(e) => setUseAccent(e.target.checked)} />
              <input type="color" value={accent} disabled={!useAccent} onChange={(e) => setAccent(e.target.value)} className="h-10 w-14" /> Extra colour (optional)
            </label>
          </div>
        )}
      </fieldset>

      <fieldset className="mt-4 rounded-lg border border-line p-4">
        <legend className="px-1 font-medium">Fonts</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Headings
            <select value={headingFont} onChange={(e) => setHeadingFont(e.target.value)} className={`${field} block w-full`}>
              {FONTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
          <label className="text-sm">Body text
            <select value={bodyFont} onChange={(e) => setBodyFont(e.target.value)} className={`${field} block w-full`}>
              {FONTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
        </div>
        <label className="mt-3 block text-sm">A font name from your brand (optional)
          <input value={otherFont} onChange={(e) => setOtherFont(e.target.value)} placeholder="For example: Inter" className={`${field} block w-full`} />
        </label>
        <p className="mt-1 text-xs text-neutral-600">The prototype can only show a font that is already on the viewer&apos;s device. If it is missing, the style above is used instead.</p>
      </fieldset>

      <fieldset className="mt-4 rounded-lg border border-line p-4">
        <legend className="px-1 font-medium">Corners</legend>
        {([["sharp", "Sharp"], ["slight", "Slightly round"], ["round", "Very round"]] as const).map(([k, l]) => (
          <label key={k} className="mr-5 inline-flex items-center gap-2">
            <input type="radio" name="corners" checked={corners === k} onChange={() => setCorners(k)} /> {l}
          </label>
        ))}
      </fieldset>

      <fieldset className="mt-4 rounded-lg border border-line p-4">
        <legend className="px-1 font-medium">Brand guide or screenshots</legend>
        <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.gif,.webp" onChange={(e) => { void uploadFiles(Array.from(e.target.files ?? [])); e.target.value = ""; }} className="text-sm" />
        {style && style.files.length > 0 && (
          <ul className="mt-2 list-disc pl-5 text-sm">
            {style.files.map((f, i) => <li key={i}>{f.name} ({f.kind}) saved</li>)}
          </ul>
        )}
        <label className="mt-3 block text-sm">Anything else about your style (optional)
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={`${field} block w-full`} placeholder="For example: calm and trustworthy, lots of white space." />
        </label>
      </fieldset>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button disabled={busy} onClick={clear} className="text-neutral-800 underline">
          Clear my style
        </button>
        <span role="status" aria-live="polite" className="text-sm text-neutral-800">{msg || "Everything saves by itself."}</span>
      </div>
    </div>
  );
}
