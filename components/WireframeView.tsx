"use client";

import { useState } from "react";
import type { WireframeOutput } from "@/lib/storage";
import { List, Section } from "@/components/UnderstandView";

// A sandboxed frame with phone and laptop sizes, "Open in new tab" and (optionally) "Download"
export function FramePreview({ url, downloadUrl, title }: { url: string; downloadUrl?: string; title: string }) {
  const [size, setSize] = useState<"phone" | "laptop">("phone");
  const linkClass = "btn btn-secondary !min-h-10 !px-4 !text-[15px]";
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {(["phone", "laptop"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSize(s)}
            aria-pressed={size === s}
            className={`btn !min-h-10 !px-4 !text-[15px] ${size === s ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-ink)]" : "btn-secondary"}`}
          >
            {s === "phone" ? "Phone size" : "Laptop size"}
          </button>
        ))}
        <a href={url} target="_blank" rel="noopener noreferrer" className={linkClass}>
          Open in new tab
        </a>
        {downloadUrl && (
          <a href={downloadUrl} className={linkClass}>
            Download
          </a>
        )}
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-[#efefe9] p-4">
        <iframe
          title={title}
          src={url}
          sandbox="allow-scripts"
          style={{ width: size === "phone" ? 390 : "100%", maxWidth: "100%", height: 640 }}
          className="mx-auto block rounded-xl border border-line bg-white shadow-[0_4px_16px_rgba(28,28,30,0.06)]"
        />
      </div>
    </div>
  );
}

// All screens as small tiles, grouped by menu group. Pick a user to light up the screens they get.
function ScreenMap({ out }: { out: WireframeOutput }) {
  const [user, setUser] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const groups = [...new Set(out.screens.map((s) => s.group || "Screens"))];
  const mine = new Set(user ? out.user_coverage.find((c) => c.user === user)?.screens ?? [] : []);
  const chosen = out.screens.find((x) => x.id === open);
  return (
    <div>
      {out.user_coverage.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label="Show screens for a user">
          <span className="note">Show screens for:</span>
          {out.user_coverage.map((c) => (
            <button key={c.user} onClick={() => setUser(user === c.user ? null : c.user)} aria-pressed={user === c.user} className={`rounded-full border px-3 py-1 text-[14px] ${user === c.user ? "border-[var(--accent)] bg-accent-soft text-[var(--accent-ink)]" : "border-line bg-card text-muted hover:text-ink"}`}>
              {c.user}
            </button>
          ))}
        </div>
      )}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((g) => (
          <div key={g}>
            <p className="label-small mb-2">{g}</p>
            <ul className="space-y-2">
              {out.screens.map((x, i) => ({ x, i })).filter(({ x }) => (x.group || "Screens") === g).map(({ x, i }) => {
                const dim = user && !mine.has(x.id);
                return (
                  <li key={x.id}>
                    <button onClick={() => setOpen(open === x.id ? null : x.id)} aria-pressed={open === x.id} className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-opacity ${open === x.id ? "border-[var(--accent)] bg-accent-soft" : "border-line bg-card"} ${dim ? "opacity-40" : ""}`}>
                      <span aria-hidden="true" className="mt-0.5 flex h-14 w-10 shrink-0 flex-col gap-1 rounded-md border border-[#d5dbe6] bg-[#f3f3ee] p-1"><span className="h-1.5 rounded-sm bg-[#d5dbe6]" /><span className="h-3 rounded-sm bg-[#e5e9f1]" /><span className="h-1.5 w-2/3 rounded-sm bg-[#d5dbe6]" /></span>
                      <span className="min-w-0 text-[15px]">
                        <span className="block font-medium">{i + 1}. {x.name}</span>
                        {x.states.length > 0 && <span className="mt-1 flex flex-wrap gap-1">{x.states.map((st) => <span key={st} className="pill pill-idle !text-[12px]">{st}</span>)}</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      {chosen && (
        <div className="mt-4 rounded-xl border border-line bg-card p-4" role="status">
          <p className="font-medium">{chosen.name}</p>
          <p className="mt-1 text-[15px]">{chosen.purpose}</p>
          {chosen.meets.length > 0 && <p className="note mt-1">Meets: {chosen.meets.join(", ")}</p>}
        </div>
      )}
      <p className="note mt-3">Use the wireframe above to click from screen to screen. The arrows between screens are not drawn here because I am not given which screen leads to which.</p>
    </div>
  );
}

// The Work tab for Phase 4: screen list, then the wireframe in a frame
export function WireframeWork({ out, projectId, versionId }: { out: WireframeOutput; projectId: string; versionId: string }) {
  const url = `/api/projects/${projectId}/wireframe?version=${versionId}`;

  return (
    <div>
      <Section title="Try the wireframe" icon="layout" tone="indigo">
        <p className="text-sm text-neutral-600">Click the buttons inside it, or use the menu at the top of the frame to jump to any screen.</p>
        <div className="mt-3">
          <FramePreview url={url} title="Wireframe preview" />
        </div>
      </Section>

      {out.warnings.length > 0 && (
        <Section title="Things to check in the wireframe" icon="alert" tone="amber">
          <List items={out.warnings} />
        </Section>
      )}

      <Section title="Screen map" icon="layout" tone="indigo" hint={`${out.screens.length} screens`}>
        <ScreenMap out={out} />
      </Section>

      {out.accessibility_notes.length > 0 && (
        <Section title="Accessibility notes" icon="eye" tone="sky">
          <List items={out.accessibility_notes} />
        </Section>
      )}

      {out.wording.length > 0 && (
        <Section title="Words used on the screens" icon="message" tone="green">
          <ul className="space-y-1 text-sm">
            {out.wording.map((w, i) => (
              <li key={i}>
                <strong>{w.screen}</strong> ({w.where}): {w.text}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
