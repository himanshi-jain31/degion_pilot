"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "designpilot-name";

// The name used in "Hello, ..." and for the initials. It stays on this computer only.
export function useName(): [string, (n: string) => void, boolean] {
  const [name, setNameState] = useState("");
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      setNameState(localStorage.getItem(KEY) ?? "");
    } catch {
      // storage not available
    }
    setLoaded(true);
  }, []);
  const setName = useCallback((n: string) => {
    setNameState(n);
    try {
      if (n.trim()) localStorage.setItem(KEY, n);
      else localStorage.removeItem(KEY);
    } catch {
      // storage not available
    }
  }, []);
  return [name, setName, loaded];
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}
