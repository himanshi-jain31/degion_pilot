import { readFileSync } from "fs";
import path from "path";

// Reads a setting from .env.local every time, so a key pasted while the app is running works straight away
// (no restart). If the file has no value, the computer's own settings are used.
export function envValue(name: string): string {
  try {
    const file = readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
    const line = file.split(/\r?\n/).find((l) => l.startsWith(`${name}=`));
    const value = line?.slice(name.length + 1).trim().replace(/^["']|["']$/g, "");
    if (value) return value;
  } catch {
    // no file, fall through
  }
  return process.env[name]?.trim() ?? "";
}
