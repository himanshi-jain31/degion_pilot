"use client";

import { useEffect, useState } from "react";
import type { FigmaFile, FigmaRole } from "@/lib/storage";
import { plainSummary } from "@/lib/figma-text";

const ROLES: { value: FigmaRole; label: string; help: string }[] = [
  { value: "design-system", label: "My design system", help: "I will use its colours and text in the Visual design step." },
  { value: "current-screens", label: "My current screens", help: "I will treat it as what exists today." },
  { value: "inspiration", label: "Inspiration", help: "I will use it as a source of ideas only." },
  { value: "reference", label: "Reference", help: "I will use it as background to check against." },
];

// "Add a Figma file": read only. Nothing here can change a Figma file.
export function FigmaPanel({ projectId, files, onChanged }: { projectId: string; files: FigmaFile[]; onChanged: () => Promise<void> }) {
  const [tokenSet, setTokenSet] = useState<boolean | null>(null);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/figma/status").then((r) => r.json()).then((d) => setTokenSet(d.tokenSet)).catch(() => setTokenSet(null));
  }, []);

  async function read() {
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const res = await fetch(`/api/projects/${projectId}/figma`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUrl("");
      setMsg(data.summary);
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function setRole(fid: string, role: FigmaRole) {
    await fetch(`/api/projects/${projectId}/figma/${fid}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) });
    await onChanged();
  }

  async function remove(fid: string) {
    await fetch(`/api/projects/${projectId}/figma/${fid}`, { method: "DELETE" });
    await onChanged();
  }

  return (
    <div>
      <p className="mt-2 text-neutral-700">
        Share a Figma file and I will read its colours, text styles and ready-made parts. <strong>I only read. I never change your Figma file.</strong>
      </p>

      {tokenSet === false && (
        <section className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <h3 className="font-medium">First, make a Figma access key (once, about 3 minutes)</h3>
          <p className="mt-1 text-sm">An access key lets DesignPilot read your Figma files. Figma calls it a &quot;token&quot;, so you will see that word in Figma. It stays on your laptop.</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
            <li>Open Figma. Click your account name at the top left, then <strong>Settings</strong>.</li>
            <li>Open the <strong>Security</strong> tab. Under <strong>Personal access tokens</strong>, click <strong>Generate new token</strong>.</li>
            <li>Give it a name like &quot;DesignPilot&quot;. Choose how long it lasts.</li>
            <li>Allow <strong>read-only</strong> access to <strong>file content</strong>. Do not give any permission to change things.</li>
            <li>Click <strong>Generate token</strong> and copy it. Figma shows it only once.</li>
            <li>In this project folder, open the file <code>.env.local</code>. Paste the token right after <code>FIGMA_ACCESS_TOKEN=</code> with no spaces or quotes. Save the file.</li>
            <li>Come back here and click <strong>Read this file</strong>. You do not need to restart the app.</li>
          </ol>
          <p className="mt-2 text-sm">
            Keep it safe: never type the token into this page or into a chat, and never share it. The file <code>.env.local</code> is never saved to GitHub. If it leaks, delete the token in Figma and make a new one.
          </p>
        </section>
      )}
      {tokenSet === true && <p className="mt-3 text-sm text-green-800">Your Figma access key is set.</p>}

      <section className="mt-5">
        <label htmlFor="figma-url" className="block font-medium">Figma link</label>
        <input
          id="figma-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.figma.com/design/..."
          className="mt-2 w-full rounded-lg border border-neutral-500 p-3 focus:border-black focus:outline-none"
        />
        <p className="mt-1 text-xs text-neutral-600">In Figma, click Share, then Copy link. A link to one frame works too: I will read only that part.</p>
        <button disabled={busy || !url.trim()} onClick={read} className="mt-3 rounded-lg bg-black px-6 py-3 font-medium text-white hover:bg-neutral-800 disabled:opacity-50">
          {busy ? "Working on it..." : "Read this file"}
        </button>
        {error && <p role="alert" className="mt-3 rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">{error}</p>}
        {msg && <p className="mt-3 rounded-lg border border-green-300 bg-green-50 p-3">{msg} Now tell me what it is, below.</p>}
      </section>

      {files.length > 0 && (
        <section className="mt-8">
          <h3 className="text-lg font-medium">Figma files in this project</h3>
          <ul className="mt-3 space-y-4">
            {files.map((f) => (
              <li key={f.id} className="rounded-lg border border-neutral-200 p-4">
                <p className="font-medium">
                  {f.name}
                </p>
                <p className="text-sm text-neutral-700">{plainSummary(f.summary)}</p>
                <p className="text-xs text-neutral-600">Read from Figma, so these facts are Checked.</p>

                {f.summary.colours.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {f.summary.colours.slice(0, 24).map((c) => (
                      <span key={c.hex} title={`${c.name ?? "No name"} ${c.hex}`} role="img" aria-label={`${c.name ?? "Colour"} ${c.hex}`} className="inline-block h-6 w-6 rounded border border-neutral-500" style={{ background: c.hex }} />
                    ))}
                  </div>
                )}

                <fieldset className="mt-3">
                  <legend className="text-sm font-medium">What is this?</legend>
                  {ROLES.map((r) => (
                    <label key={r.value} className="mt-1 flex items-start gap-2 text-sm">
                      <input type="radio" name={`role-${f.id}`} checked={f.role === r.value} onChange={() => setRole(f.id, r.value)} className="mt-1" />
                      <span>
                        {r.label}
                        <span className="block text-xs text-neutral-600">{r.help}</span>
                      </span>
                    </label>
                  ))}
                  {!f.role && <p className="mt-2 text-sm text-amber-800">Please choose one. Until you do, I will not use this file.</p>}
                </fieldset>

                <button onClick={() => remove(f.id)} className="mt-3 text-sm underline">
                  Remove from this project (Figma is not touched)
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
