"use client";

import type { DesignOutput } from "@/lib/storage";
import { FramePreview } from "@/components/WireframeView";
import { List, Section } from "@/components/UnderstandView";
import { DesignChecks } from "@/components/DesignChecks";
import { ActionBar, primaryClass } from "@/components/ui";

const urls = (id: string, key: "version" | "final", value = "1") => {
  const q = `${key}=${value}`;
  return { view: `/api/projects/${id}/prototype?${q}`, download: `/api/projects/${id}/prototype?${q}&download=1` };
};

function CoverNote({ out }: { out: DesignOutput }) {
  const n = out.cover_note;
  return (
    <Section title="Cover note" icon="file-text" tone="amber">
      <p>{n.what_was_built}</p>
      {n.what_was_guessed.length > 0 && (
        <>
          <p className="mt-3 text-sm font-medium">What I guessed</p>
          <List items={n.what_was_guessed} />
        </>
      )}
      {n.not_tested_yet.length > 0 && (
        <>
          <p className="mt-3 text-sm font-medium">Not tested yet</p>
          <List items={n.not_tested_yet} />
        </>
      )}
    </Section>
  );
}

// The Work tab for Phase 5
export function PrototypeWork({ out, projectId, versionId }: { out: DesignOutput; projectId: string; versionId: string }) {
  const u = urls(projectId, "version", versionId);
  return (
    <div>
      {!out.style_given && (
        <p className="mt-4 rounded-lg border border-line bg-amber-50 p-3 text-sm">
          No design style was given, so this is a clean neutral look. Not matched to a design system.
        </p>
      )}
      <Section title="Try the prototype" icon="phone" tone="indigo">
        <p className="text-sm text-neutral-600">Click through it like a real product. Use the menu in the dark bar to jump to any screen.</p>
        <div className="mt-3">
          <FramePreview url={u.view} downloadUrl={u.download} title="Prototype preview" />
        </div>
      </Section>
      {out.warnings.length > 0 && (
        <Section title="Things to check in the prototype" icon="alert" tone="amber">
          <List items={out.warnings} />
        </Section>
      )}
      <DesignChecks out={out} projectId={projectId} versionId={versionId} />
      <CoverNote out={out} />
    </div>
  );
}

// The Final result page, shown once Check-in 5 got Go ahead
export function FinalResult({ out, projectId, versionId, testingDone, onNext }: { out: DesignOutput; projectId: string; versionId: string; testingDone: boolean; onNext: () => void }) {
  const u = urls(projectId, "final", "1");
  void versionId;
  return (
    <div>
      <p className="mt-2 rounded-lg border border-line bg-green-50 p-3">
        This is your final design. It works on a phone and a laptop. It is a prototype, not the finished product.
      </p>
      <div className="mt-3 rounded-lg border border-line p-3 text-sm">
        {testingDone ? (
          <p>All six steps are done.</p>
        ) : (
          <>
            <p>Next step: try this design with real people (Testing).</p>
            <button onClick={onNext} className="mt-2 rounded-lg bg-black px-5 py-2 text-white hover:bg-neutral-800">Go to Testing</button>
          </>
        )}
      </div>
      <Section title="Your working prototype" icon="phone" tone="indigo">
        <FramePreview url={u.view} title="Final prototype" />
      </Section>
      <ActionBar>
        <a href={u.download} className={`${primaryClass} button-link`}>
          Download the prototype
        </a>
      </ActionBar>
      <CoverNote out={out} />
      <DesignChecks out={out} projectId={projectId} versionId={versionId} />
    </div>
  );
}
