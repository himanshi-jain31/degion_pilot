"use client";

import { useState } from "react";
import type { WireframeOutput } from "@/lib/storage";
import { List, Section } from "@/components/UnderstandView";

// A sandboxed frame with phone and laptop sizes, "Open in new tab" and (optionally) "Download"
export function FramePreview({ url, downloadUrl, title }: { url: string; downloadUrl?: string; title: string }) {
  const [size, setSize] = useState<"phone" | "laptop">("phone");
  const linkClass = "rounded-lg border border-neutral-500 px-4 py-2 text-sm hover:bg-neutral-100";
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {(["phone", "laptop"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSize(s)}
            aria-pressed={size === s}
            className={`rounded-lg border px-4 py-2 text-sm ${size === s ? "border-black bg-black text-white" : "border-neutral-500 hover:bg-neutral-100"}`}
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
      <div className="mt-3 overflow-x-auto rounded-lg border border-neutral-500 bg-neutral-200 p-3">
        <iframe
          title={title}
          src={url}
          sandbox="allow-scripts"
          style={{ width: size === "phone" ? 390 : "100%", maxWidth: "100%", height: 640 }}
          className="mx-auto block rounded-md border border-neutral-500 bg-white"
        />
      </div>
    </div>
  );
}

// The Work tab for Phase 4: screen list, then the wireframe in a frame
export function WireframeWork({ out, projectId, versionId }: { out: WireframeOutput; projectId: string; versionId: string }) {
  const url = `/api/projects/${projectId}/wireframe?version=${versionId}`;

  return (
    <div>
      <Section title="Try the wireframe">
        <p className="text-sm text-neutral-600">Click the buttons inside it, or use the menu at the top of the frame to jump to any screen.</p>
        <div className="mt-3">
          <FramePreview url={url} title="Wireframe preview" />
        </div>
      </Section>

      {out.warnings.length > 0 && (
        <Section title="Things to check in the wireframe">
          <List items={out.warnings} />
        </Section>
      )}

      <Section title={`Screens (${out.screens.length})`}>
        <ul className="space-y-2">
          {out.screens.map((s, i) => (
            <li key={s.id} className="rounded-lg border border-neutral-200 p-3">
              <p>
                <strong>
                  {i + 1}. {s.name}
                </strong>
                {s.states.length > 0 && <span className="ml-2 text-xs text-neutral-600">shows: {s.states.join(", ")}</span>}
              </p>
              <p className="text-sm">{s.purpose}</p>
              {s.meets.length > 0 && <p className="text-xs text-neutral-600">Meets: {s.meets.join(", ")}</p>}
            </li>
          ))}
        </ul>
      </Section>

      {out.user_coverage.length > 0 && (
        <Section title="Who each user gets screens for">
          <ul className="space-y-1 text-sm">
            {out.user_coverage.map((c, i) => (
              <li key={i}>
                <strong>{c.user}:</strong>{" "}
                {c.screens.map((id) => out.screens.find((s) => s.id === id)?.name ?? id).join(", ") || "no screens"}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {out.accessibility_notes.length > 0 && (
        <Section title="Accessibility notes">
          <List items={out.accessibility_notes} />
        </Section>
      )}

      {out.wording.length > 0 && (
        <Section title="Words used on the screens">
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
