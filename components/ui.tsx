"use client";

import Link from "next/link";
import { ReactNode, useCallback, useEffect, useState } from "react";

// ---- Shared pieces that make every screen work the same way ----

// The one place for the main action: bottom right, on every screen. Quieter choices sit to its left.
export function ActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-white/85 px-4 py-4 backdrop-blur max-sm:bottom-[62px] sm:left-[72px] lg:px-6">
      <div className="mx-auto flex max-w-[2200px] flex-wrap items-center justify-end gap-3">{children}</div>
    </div>
  );
}

export const primaryClass = "btn btn-primary";
export const secondaryClass = "btn btn-secondary";
export const quietClass = "btn btn-quiet";

// A small keyboard hint, for example "Enter" next to Go ahead
export function Kbd({ children }: { children: ReactNode; onDark?: boolean }) {
  return (
    <kbd aria-hidden="true" className="kbd max-sm:hidden">
      {children}
    </kbd>
  );
}

// One friendly sentence and one action, for empty and error states
export function Notice({ tone = "info", children, action }: { tone?: "info" | "error"; children: ReactNode; action?: ReactNode }) {
  const colours = tone === "error" ? "border-[#f3c7c7] bg-[var(--bad-soft)] text-[var(--bad-ink)]" : "border-line bg-card text-ink";
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-2xl border p-6 ${colours}`}>
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
    <Link href={href} className="text-sm text-muted underline underline-offset-4 hover:text-ink">
      {children}
    </Link>
  );
}
