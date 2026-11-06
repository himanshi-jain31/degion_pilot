import { envValue } from "@/lib/env";
import { FigmaFile, FigmaSummary } from "@/lib/storage";
import { FriendlyError, isDemo } from "@/lib/ai";

// READ ONLY. This is the only place that talks to Figma. It can only send GET requests,
// and only to Figma's own address, so it can never change a Figma file or send the token anywhere else.
const FIGMA_API = "https://api.figma.com/v1";

// Reads the token each time, so a newly pasted token works without restarting the app
export async function figmaToken(): Promise<string> {
  return envValue("FIGMA_ACCESS_TOKEN");
}

export async function figmaTokenSet() {
  return isDemo() || !!(await figmaToken());
}

export function parseFigmaUrl(raw: string): { fileKey: string; nodeId?: string } {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    throw new FriendlyError("That doesn't look like a link. Please paste the whole link from Figma's address bar.");
  }
  const host = u.hostname.toLowerCase();
  if (u.protocol !== "https:" || (host !== "figma.com" && host !== "www.figma.com"))
    throw new FriendlyError("That link is not from figma.com. Please copy it from your Figma file.");
  const m = u.pathname.match(/^\/(?:file|design|proto)\/([A-Za-z0-9]+)/);
  if (!m) throw new FriendlyError("I can read Figma design files. This link looks like something else, such as FigJam or a profile page.");
  const node = u.searchParams.get("node-id");
  return { fileKey: m[1], nodeId: node ? node.replace("-", ":") : undefined };
}

async function figmaGet(pathAndQuery: string, token: string): Promise<any> {
  let res: Response;
  try {
    res = await fetch(`${FIGMA_API}${pathAndQuery}`, { method: "GET", headers: { "X-Figma-Token": token }, signal: AbortSignal.timeout(90_000) });
  } catch {
    throw new FriendlyError("I couldn't reach Figma. Check your internet and try again. Big files can take a minute.");
  }
  if (res.status === 403 || res.status === 401)
    throw new FriendlyError("Figma did not accept the token, or it can't open this file. Check that the token is new, has the read-only \"File content\" permission, and that your Figma account can open the file.");
  if (res.status === 404) throw new FriendlyError("Figma could not find that file. Check the link.");
  if (res.status === 429) throw new FriendlyError("Figma is asking us to slow down. Wait a minute and try again.");
  if (!res.ok) throw new FriendlyError("Figma gave an error. Please try again in a moment.");
  return res.json();
}

const hex2 = (n: number) => Math.round(Math.max(0, Math.min(1, n)) * 255).toString(16).padStart(2, "0");
const toHex = (c: { r: number; g: number; b: number }) => `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}`;

type Node = Record<string, any>;

// Walks the file once and counts colours, text looks, and named styles
export function summarise(root: Node, styles: Record<string, { name?: string; styleType?: string }>, components: Record<string, { name?: string; description?: string }>, componentSets: Record<string, { name?: string; description?: string }>): FigmaSummary {
  const colourUses = new Map<string, number>();
  const styleColour = new Map<string, string>(); // fill style id -> hex
  const textLooks = new Map<string, { fontFamily: string; fontSize: number; fontWeight: number; lineHeight?: number; uses: number }>();
  const styleText = new Map<string, { fontFamily: string; fontSize: number; fontWeight: number; lineHeight?: number }>(); // text style id -> look

  const stack: Node[] = [root];
  let seen = 0;
  while (stack.length && seen++ < 500_000) {
    const n = stack.pop()!;
    for (const key of ["fills", "strokes"] as const) {
      for (const p of Array.isArray(n[key]) ? n[key] : []) {
        if (p?.type === "SOLID" && p.visible !== false && p.color) {
          const h = toHex(p.color);
          colourUses.set(h, (colourUses.get(h) ?? 0) + 1);
          if (key === "fills" && n.styles?.fill && !styleColour.has(n.styles.fill)) styleColour.set(n.styles.fill, h);
        }
      }
    }
    if (n.type === "TEXT" && n.style?.fontFamily) {
      const look = { fontFamily: String(n.style.fontFamily), fontSize: Number(n.style.fontSize) || 0, fontWeight: Number(n.style.fontWeight) || 400, lineHeight: n.style.lineHeightPx ? Math.round(n.style.lineHeightPx) : undefined };
      const k = `${look.fontFamily}|${look.fontSize}|${look.fontWeight}|${look.lineHeight ?? ""}`;
      const have = textLooks.get(k);
      textLooks.set(k, { ...look, uses: (have?.uses ?? 0) + 1 });
      if (n.styles?.text && !styleText.has(n.styles.text)) styleText.set(n.styles.text, look);
    }
    for (const c of Array.isArray(n.children) ? n.children : []) stack.push(c);
  }

  // named colours
  const names = new Map<string, string>(); // hex -> style name
  for (const [id, hex] of styleColour) {
    const st = styles[id];
    if (st?.styleType === "FILL" && st.name && !names.has(hex)) names.set(hex, st.name);
  }
  const colours = [...colourUses.entries()]
    .map(([hex, uses]) => ({ hex, uses, name: names.get(hex) }))
    .sort((a, b) => Number(!!b.name) - Number(!!a.name) || b.uses - a.uses);

  // text styles: named ones if the file has them, otherwise the distinct looks that are used
  const namedText = [...styleText.entries()]
    .map(([id, look]) => ({ name: styles[id]?.name, ...look }))
    .filter((t) => t.name);
  const textStylesNamed = namedText.length > 0;
  const textStyles = textStylesNamed
    ? namedText
    : [...textLooks.values()].sort((a, b) => b.uses - a.uses).map(({ uses: _u, ...look }) => look);

  const comps = [
    ...Object.values(componentSets).map((c) => ({ name: String(c.name ?? ""), description: c.description || undefined })),
    ...Object.values(components).map((c) => ({ name: String(c.name ?? ""), description: c.description || undefined })),
  ].filter((c) => c.name);

  return {
    colours: colours.slice(0, 60),
    colourCount: colours.length,
    namedColourCount: colours.filter((c) => c.name).length,
    textStyles: textStyles.slice(0, 40),
    textStyleCount: textStyles.length,
    textStylesNamed,
    components: comps.slice(0, 60),
    componentCount: comps.length,
  };
}

// Reads a file (or one part of it, if the link points to one). Never writes anything to Figma.
export async function readFigma(url: string): Promise<Omit<FigmaFile, "id" | "addedAt">> {
  const { fileKey, nodeId } = parseFigmaUrl(url);

  if (isDemo()) {
    return {
      url, fileKey, name: "DEMO: Example design system", lastModified: new Date().toISOString(), demo: true,
      summary: {
        colours: [
          { hex: "#0b6b3a", name: "Brand/Green", uses: 40 }, { hex: "#ffffff", name: "Neutral/White", uses: 90 },
          { hex: "#1a1a1a", name: "Neutral/Ink", uses: 70 }, { hex: "#e0702b", name: "Accent/Orange", uses: 12 }, { hex: "#f4f4f2", uses: 8 },
        ],
        colourCount: 5, namedColourCount: 4,
        textStyles: [
          { name: "Heading/Large", fontFamily: "Georgia", fontSize: 32, fontWeight: 700, lineHeight: 40 },
          { name: "Body/Regular", fontFamily: "Inter", fontSize: 16, fontWeight: 400, lineHeight: 24 },
        ],
        textStyleCount: 2, textStylesNamed: true,
        components: [{ name: "Button/Primary" }, { name: "Input/Text" }, { name: "Card" }],
        componentCount: 3,
      },
    };
  }

  const token = await figmaToken();
  if (!token)
    throw new FriendlyError("I need your Figma token first. Open the file .env.local, paste the token after FIGMA_ACCESS_TOKEN=, and save it. The steps are on this page.");

  const json = nodeId
    ? await figmaGet(`/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`, token)
    : await figmaGet(`/files/${fileKey}`, token);

  let root: Node;
  let styles: Record<string, any> = {};
  let components: Record<string, any> = {};
  let componentSets: Record<string, any> = {};
  if (nodeId) {
    const entry = json.nodes?.[nodeId];
    if (!entry?.document) throw new FriendlyError("I couldn't find that part of the file. Try the link to the whole file.");
    root = entry.document;
    styles = entry.styles ?? {};
    components = entry.components ?? {};
    componentSets = entry.componentSets ?? {};
  } else {
    root = json.document;
    styles = json.styles ?? {};
    components = json.components ?? {};
    componentSets = json.componentSets ?? {};
  }
  if (!root) throw new FriendlyError("Figma sent back something I could not read. Please try again.");

  return { url, fileKey, nodeId: undefined, name: String(json.name ?? "Figma file"), lastModified: json.lastModified, summary: summarise(root, styles, components, componentSets) } as Omit<FigmaFile, "id" | "addedAt">;
}

export { plainSummary } from "@/lib/figma-text";
import { plainSummary } from "@/lib/figma-text";

// Text for the AI
export function figmaText(f: FigmaFile, full: boolean): string {
  const s = f.summary;
  let t = `FIGMA FILE "${f.name}" (read from Figma, so these facts are Checked)\n${plainSummary(s)}\n`;
  const limit = full ? 60 : 12;
  t += `Colours: ${s.colours.slice(0, limit).map((c) => `${c.name ? c.name + " " : ""}${c.hex}`).join(", ")}\n`;
  t += `Text styles: ${s.textStyles.slice(0, full ? 40 : 8).map((x) => `${x.name ? x.name + ": " : ""}${x.fontFamily} ${x.fontSize}px weight ${x.fontWeight}${x.lineHeight ? ` line ${x.lineHeight}px` : ""}`).join("; ")}\n`;
  t += `Ready-made parts: ${s.components.slice(0, full ? 60 : 15).map((c) => c.name).join(", ")}\n`;
  return t;
}

// All colours of the designer's design-system files, for checking the finished prototype
export function figmaPalette(files: FigmaFile[] | undefined): Set<string> {
  const set = new Set<string>();
  for (const f of files ?? []) if (f.role === "design-system") for (const c of f.summary.colours) set.add(c.hex.toLowerCase());
  return set;
}

// Colours used in the prototype's own styles that are not in the design system (a real check, not a guess)
export function offStyleColours(code: string, allowed: Set<string>): string[] {
  const found = new Set<string>();
  for (const m of code.matchAll(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g)) {
    let h = m[1].toLowerCase();
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    if (!allowed.has(`#${h}`)) found.add(`#${h}`);
  }
  return [...found];
}
