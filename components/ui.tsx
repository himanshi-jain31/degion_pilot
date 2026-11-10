"use client";

import Link from "next/link";
import { ReactNode, useCallback, useEffect, useState } from "react";

// ---- Shared pieces that make every screen work the same way ----

// The one place for the main action: bottom right, on every screen. Quieter choices sit to its left.
export function ActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-500 bg-white px-5 py-3">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-end gap-3">{children}</div>
    </div>
  );
}

export const primaryClass =
  "inline-flex items-center rounded-lg bg-black px-6 py-3 font-medium text-white hover:bg-neutral-800 disabled:opacity-50";
export const quietClass = "inline-flex items-center rounded-lg px-4 py-3 text-neutral-800 underline hover:bg-neutral-100 disabled:opacity-50";

// A small keyboard hint, for example "Enter" next to Go ahead
export function Kbd({ children, onDark = false }: { children: ReactNode; onDark?: boolean }) {
  return (
    <kbd
      aria-hidden="true"
      className={`ml-2 rounded border px-1.5 text-xs font-normal ${onDark ? "border-white/60 text-white" : "border-neutral-500 text-neutral-700"}`}
    >
      {children}
    </kbd>
  );
}

// One friendly sentence and one action, for empty and error states
export function Notice({ tone = "info", children, action }: { tone?: "info" | "error"; children: ReactNode; action?: ReactNode }) {
  const colours = tone === "error" ? "border-red-300 bg-red-50 text-red-900" : "border-neutral-300 bg-neutral-50 text-neutral-800";
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-lg border p-4 ${colours}`}>
      <p>{children}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

// A loading sentence. If it takes long, one action appears.
export function Loading({ children, onReload }: { children: ReactNode; onReload: () => void }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 6000);
    return () => clearTimeout(t);
  }, []);
  return (
    <Notice action={slow ? <button onClick={onReload} className={quietClass}>Taking long? Try again</button> : undefined}>{children}</Notice>
  );
}

// True when the key press happens while the person is typing or on a button
export function isTypingTarget(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null;
  if (!t) return false;
  return ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(t.tagName) || t.isContentEditable;
}

export function useKey(handler: (e: KeyboardEvent) => void) {
  const stable = useCallback(handler, [handler]);
  useEffect(() => {
    window.addEventListener("keydown", stable);
    return () => window.removeEventListener("keydown", stable);
  }, [stable]);
}

// Keeps what you typed, so a refresh or a wrong click never loses it
export function useDraft(key: string): [string, (v: string) => void] {
  const [value, setValue] = useState("");
  useEffect(() => {
    try {
      setValue(localStorage.getItem(key) ?? "");
    } catch {
      // storage not available
    }
  }, [key]);
  const set = useCallback(
    (v: string) => {
      setValue(v);
      try {
        if (v) localStorage.setItem(key, v);
        else localStorage.removeItem(key);
      } catch {
        // storage not available
      }
    },
    [key]
  );
  return [value, set];
}

export function BackLink({ href = "/", children = "Back to Home" }: { href?: string; children?: ReactNode }) {
  return (
    <Link href={href} className="text-sm text-neutral-700 underline">
      {children}
    </Link>
  );
}
