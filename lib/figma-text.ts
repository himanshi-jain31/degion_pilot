import type { FigmaSummary } from "@/lib/storage";

// The plain sentence shown to the designer
export function plainSummary(s: FigmaSummary): string {
  const colours = `${s.colourCount} colours${s.namedColourCount ? ` (${s.namedColourCount} saved with a name)` : ""}`;
  const text = `${s.textStyleCount} text styles${s.textStylesNamed ? "" : " (looks used in the file, none saved with a name)"}`;
  return `I found ${colours}, ${text} and ${s.componentCount} ready-made parts.`;
}

