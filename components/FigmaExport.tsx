"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icons";
import { checkFigmaFileLink } from "@/lib/figmaLink";
import { buildSvg, type XScreen } from "@/lib/figmaSvg";
import { Kbd, primaryClass, secondaryClass } from "@/components/ui";

// Asks the page inside the frame to measure all its screens
function measureScreens(frame: HTMLIFrameElement): Promise<{ screens: XScreen[]; bg: string }> {
  return new Promise((resolve, reject) => {
    const win = frame.contentWindow;
    if (!win) return reject(new Error("no frame"));
    const timer = setTimeout(() => {
      window.removeEventListener("message", onMessage);
      reject(new Error("timeout"));
    }, 10000);
    function onMessage(e: MessageEvent) {
      if (e.source !== win || e.data?.type !== "dp-export-result") return;
      clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      if (e.data.ok) resolve({ screens: e.data.screens, bg: e.data.bg });
      else reject(new Error(e.data.error || "failed"));
    }
    window.addEventListener("message", onMessage);
    win.postMessage({ type: "dp-export" }, "*");
  });
}

// "Open in Figma": copies every screen as editable shapes and text, then opens your Figma file so you can paste.
// DesignPilot never writes into your Figma file. You paste, so you stay in charge of your file.
export function OpenInFigma({ getFrame, projectId, size }: { getFrame: () => HTMLIFrameElement | null; projectId: string; size: "phone" | "laptop" }) {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ url: string; count: number; opened: boolean } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const storeKey = `designpilot-figma-link-${projectId}`;

  useEffect(() => {
    if (!open) return;
    try {
      setLink(localStorage.getItem(storeKey) ?? "");
    } catch {
      // storage not available
    }
    setError("");
    setDone(null);
    setTimeout(() => input.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() {
    setOpen(false);
    setTimeout(() => opener.current?.focus(), 0);
  }

  // The link is checked first. Without a link you can still copy and open Figma yourself.
  function readLink(): { url: string } | null {
    if (!link.trim()) return null;
    const c = checkFigmaFileLink(link);
    if (!c.ok) {
      setError(c.message);
      throw new Error("bad link");
    }
    try {
      localStorage.setItem(storeKey, c.url);
    } catch {
      // storage not available
    }
    return { url: c.url };
  }

  async function makeSvg() {
    const frame = getFrame();
    if (!frame) throw new Error("no frame");
    const { screens, bg } = await measureScreens(frame);
    if (screens.length === 0) throw new Error("no screens");
    return { svg: buildSvg(screens, bg), count: screens.length };
  }

  async function copyAndOpen() {
    setError("");
    setDone(null);
    let target: { url: string } | null;
    try {
      target = readLink();
    } catch {
      return;
    }
    setBusy(true);
    try {
      const { svg, count } = await makeSvg();
      await navigator.clipboard.writeText(svg);
      const win = target ? window.open(target.url, "_blank", "noopener") : window.open("https://www.figma.com/files", "_blank", "noopener");
      setDone({ url: target?.url ?? "https://www.figma.com/files", count, opened: !!win });
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      setError(
        m === "timeout" || m === "no frame" || m === "no screens"
          ? "I could not read the screens yet. Wait until the preview has finished loading, then try again."
          : "I could not copy the screens. Use \"Download as a file instead\" below."
      );
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    setError("");
    setBusy(true);
    try {
      const { svg, count } = await makeSvg();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      a.download = "designpilot-screens-for-figma.svg";
      a.click();
      URL.revokeObjectURL(a.href);
      setDone({ url: "", count, opened: false });
    } catch {
      setError("I could not read the screens yet. Wait until the preview has finished loading, then try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button ref={opener} onClick={() => setOpen(true)} aria-haspopup="dialog" className="btn btn-secondary !min-h-10 !px-4 !text-[15px]">
        <Icon name="figma" size={17} />
        Open in Figma
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && close()}>
          <div role="dialog" aria-modal="true" aria-labelledby="figma-dialog-title" className="shell-card fade-in w-full max-w-lg p-6">
            <h2 id="figma-dialog-title" className="section-title">Open this design in Figma</h2>
            <p className="mt-2 text-[15px]">
              I copy every screen as <strong>editable shapes and text</strong>. You paste them into your Figma file and edit by hand. I never change your file myself.
            </p>
            <p className="note mt-1">I will copy the screens at <strong>{size === "phone" ? "phone" : "laptop"} size</strong>. Close this and switch the size first if you want the other one.</p>

            <label htmlFor="figma-file-link" className="mt-5 block font-medium">Your Figma file link</label>
            <input
              id="figma-file-link"
              ref={input}
              value={link}
              onChange={(e) => { setLink(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && !busy && void copyAndOpen()}
              placeholder="https://www.figma.com/design/..."
              className="input mt-2"
              aria-describedby="figma-link-help"
            />
            <p id="figma-link-help" className="note mt-1">In Figma, click Share, then Copy link. You can leave this empty and open Figma yourself.</p>

            {error && <p role="alert" className="mt-3 rounded-xl border border-[#f3c7c7] bg-[var(--bad-soft)] p-3 text-[var(--bad-ink)]">{error}</p>}

            {done && (
              <div role="status" className="mt-4 rounded-xl border border-[#c9ecd6] bg-[var(--ok-soft)] p-4 text-[var(--ok-ink)]">
                <p className="font-medium">{done.url === "" ? `Saved ${done.count} screens as a file.` : `Copied ${done.count} screens.`}</p>
                {done.url === "" ? (
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-[15px]">
                    <li>Open your Figma file.</li>
                    <li>Drag the file <code>designpilot-screens-for-figma.svg</code> onto the empty canvas.</li>
                  </ol>
                ) : (
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-[15px]">
                    <li>{done.opened ? "Figma opened in a new tab." : <>Open Figma: <a href={done.url} target="_blank" rel="noopener noreferrer" className="underline">your file</a>.</>}</li>
                    <li>Click once on the empty canvas.</li>
                    <li>Press <strong>Cmd + V</strong> (Ctrl + V on Windows). Every screen appears, ready to edit.</li>
                  </ol>
                )}
                {done.url !== "" && done.opened && (
                  <p className="mt-2 text-sm">Nothing happened? <a href={done.url} target="_blank" rel="noopener noreferrer" className="underline">Open your file here</a>, then paste.</p>
                )}
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <button onClick={download} disabled={busy} className="btn btn-quiet">Download as a file instead</button>
              <button onClick={close} className={secondaryClass}>Close <Kbd>Esc</Kbd></button>
              <button onClick={copyAndOpen} disabled={busy} className={primaryClass}>
                {busy ? "Working on it..." : "Copy screens and open Figma"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
