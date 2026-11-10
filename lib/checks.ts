import type { Screen, UnderstandOutput } from "@/lib/storage";

// ---- Does every kind of user have screens? (the AI names the screens, the app checks they exist) ----

// The user profiles from the approved Understand step (for example "Anna, employee" and "Ben, manager")
export function profileNames(understand?: UnderstandOutput): string[] {
  return [...new Set((understand?.user_profiles ?? []).map((u) => u.name.trim()).filter(Boolean))];
}

const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

// Profiles with no screens: either the AI did not list them, or none of the screens it listed exist
export function missingUsers(expected: string[], coverage: { user: string; screens: string[] }[], screens: Pick<Screen, "id">[]): string[] {
  const ids = new Set(screens.map((s) => s.id));
  return expected.filter((name) => {
    const n = norm(name);
    const entry = coverage.find((c) => {
      const u = norm(c.user);
      return u && (u === n || u.includes(n) || n.includes(u));
    });
    return !entry || !entry.screens.some((id) => ids.has(id));
  });
}

// ---- Keep designer notes off the screen ----

const escapeRe = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// The AI is given each screen's purpose, states and requirement numbers as notes for itself.
// If it prints them on the screen, remove them.
export function stripDesignerNotes(html: string, screen: Pick<Screen, "purpose">): string {
  let h = html;
  const purpose = screen.purpose.trim().replace(/\.$/, "");
  if (purpose.length > 8) {
    h = h.replace(new RegExp(`<(p|div|span|small|em|i|h[1-6]|li)\\b[^>]*>\\s*${escapeRe(purpose)}\\.?\\s*</\\1>`, "gi"), "");
  }
  h = h.replace(/<(p|div|span|small|em|i|li)\b[^>]*>\s*(?:purpose|states?|meets|requirements? met|designer note|note to designer)\s*:[^<]*<\/\1>/gi, "");
  h = h.replace(/<(p|div|span|small)\b[^>]*>\s*R\d+(?:\s*,\s*R\d+)*\s*<\/\1>/g, "");
  return h.trim();
}
