import { promises as fs } from "fs";
import path from "path";
import type Anthropic from "@anthropic-ai/sdk";
import { figmaText } from "@/lib/figma";
import { DesignStyle, FigmaFile, Project, UPLOADS_DIR } from "@/lib/storage";

export const FONT_CHOICES: Record<string, { label: string; stack: string }> = {
  clean: { label: "Clean (sans-serif)", stack: 'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  serif: { label: "Classic (serif)", stack: 'Georgia, "Times New Roman", serif' },
  friendly: { label: "Friendly (rounded)", stack: '"Trebuchet MS", "Segoe UI", system-ui, sans-serif' },
  mono: { label: "Technical (monospace)", stack: 'ui-monospace, Menlo, Consolas, monospace' },
};

export const CORNER_RADIUS = { sharp: "0px", slight: "6px", round: "16px" } as const;

const HEX = /^#[0-9a-fA-F]{6}$/;

// Checks what the designer typed and keeps only safe values
export function cleanStyle(body: unknown, files: DesignStyle["files"]): DesignStyle {
  const b = (body ?? {}) as Record<string, any>;
  const c = b.colours;
  const colours =
    c && HEX.test(c.primary) && HEX.test(c.background) && HEX.test(c.text)
      ? { primary: c.primary, background: c.background, text: c.text, ...(HEX.test(c.accent ?? "") ? { accent: c.accent } : {}) }
      : undefined;
  return {
    colours,
    headingFont: b.headingFont in FONT_CHOICES ? b.headingFont : "clean",
    bodyFont: b.bodyFont in FONT_CHOICES ? b.bodyFont : "clean",
    otherFont: typeof b.otherFont === "string" ? b.otherFont.replace(/[^A-Za-z0-9 \-]/g, "").trim().slice(0, 40) || undefined : undefined,
    corners: b.corners === "sharp" || b.corners === "round" ? b.corners : "slight",
    notes: typeof b.notes === "string" ? b.notes.trim().slice(0, 1000) || undefined : undefined,
    files,
  };
}

const designSystems = (figma?: FigmaFile[]) => (figma ?? []).filter((f) => f.role === "design-system");

export function hasStyle(s?: DesignStyle, figma?: FigmaFile[]) {
  return designSystems(figma).length > 0 || (!!s && (!!s.colours || s.files.length > 0 || !!s.notes || !!s.otherFont));
}

// CSS variables that every prototype screen must use
export function rootVars(s?: DesignStyle): string {
  if (!s) return "";
  const h = FONT_CHOICES[s.headingFont].stack;
  const bd = FONT_CHOICES[s.bodyFont].stack;
  const other = s.otherFont ? `"${s.otherFont}", ` : "";
  let v = `--font-heading:${other}${h};--font-body:${other}${bd};--radius:${CORNER_RADIUS[s.corners]};`;
  if (s.colours) {
    v += `--primary:${s.colours.primary};--background:${s.colours.background};--text:${s.colours.text};--accent:${s.colours.accent ?? s.colours.primary};`;
  }
  return `:root{${v}}`;
}

export function styleSummary(s?: DesignStyle, figma?: FigmaFile[]): string {
  const ds = designSystems(figma);
  const figmaPart = ds.length
    ? `\nThe designer's FIGMA DESIGN SYSTEM is the source of truth. Use ONLY its colours and fonts, and name anything you had to add in off_style_items.\n${ds.map((f) => figmaText(f, true)).join("\n")}`
    : "";
  if (!hasStyle(s, figma)) return "No design style was given. Use a clean neutral style and say \"Not matched to a design system\".";
  const st = s ?? { headingFont: "clean", bodyFont: "clean", corners: "slight" as const, files: [] };
  const lines = [];
  if (st.colours) lines.push(`Colours: main ${st.colours.primary}, background ${st.colours.background}, text ${st.colours.text}${st.colours.accent ? `, accent ${st.colours.accent}` : ""}`);
  lines.push(`Heading font: ${st.otherFont ?? FONT_CHOICES[st.headingFont].label}; body font: ${st.otherFont ?? FONT_CHOICES[st.bodyFont].label}`);
  lines.push(`Corners: ${st.corners} (radius ${CORNER_RADIUS[st.corners]})`);
  if (st.notes) lines.push(`Designer's notes: ${st.notes}`);
  lines.push(`CSS variables available: --primary, --background, --text, --accent, --font-heading, --font-body, --radius`);
  return lines.join("\n") + figmaPart;
}

// Brand guide text and screenshots, for the AI
export async function styleBlocks(project: Project): Promise<Anthropic.ContentBlockParam[]> {
  const st = project.designStyle;
  const blocks: Anthropic.ContentBlockParam[] = [{ type: "text", text: `DESIGN STYLE:\n${styleSummary(st, project.figmaFiles)}` }];
  for (const f of st?.files ?? []) {
    if (f.text) blocks.push({ type: "text", text: `--- BRAND GUIDE FILE: ${f.name} ---\n${f.text.slice(0, 30000)}` });
    const ext = path.extname(f.name).toLowerCase();
    const media = ({ ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp" } as const)[ext as ".png"];
    if (media) {
      try {
        const data = await fs.readFile(path.join(UPLOADS_DIR, project.id, f.savedAs));
        blocks.push({ type: "text", text: `Style screenshot: ${f.name}` });
        blocks.push({ type: "image", source: { type: "base64", media_type: media, data: data.toString("base64") } });
      } catch {
        // missing file, carry on
      }
    }
  }
  return blocks;
}

// ---- Contrast, worked out by the app (not guessed by the AI) ----
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrastRatio(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function computedChecks(s?: DesignStyle): string[] {
  const c = s?.colours;
  if (!c) return [];
  const row = (label: string, ratio: number, need: number) =>
    `${label}: ${ratio.toFixed(1)} to 1. ${ratio >= need ? `Passes (needs ${need} to 1).` : `Too low (needs ${need} to 1).`}`;
  const out = [
    row("Text on background", contrastRatio(c.text, c.background), 4.5),
    row("Background colour on your main colour (button text)", contrastRatio(c.background, c.primary), 4.5),
    row("Main colour on background (so buttons and links stand out)", contrastRatio(c.primary, c.background), 3),
  ];
  if (c.accent) out.push(row("Accent colour on background", contrastRatio(c.accent, c.background), 3));
  return out;
}
