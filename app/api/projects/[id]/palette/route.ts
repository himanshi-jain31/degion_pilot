import { NextResponse } from "next/server";
import { contrastRatio, readableOn } from "@/lib/styles";
import { DesignOutput, loadProject } from "@/lib/storage";

const six = (h: string) => "#" + (h.length === 3 ? h.split("").map((c) => c + c).join("") : h).toLowerCase();

// The colours, fonts and contrast that are really inside a finished prototype (read from its own styles, not guessed)
export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const project = await loadProject(id);
  const wanted = new URL(request.url).searchParams.get("version");
  const version = project?.versions.filter((v) => v.phase === 5 && v.status === "done" && (!wanted || v.id === wanted)).at(-1);
  const html = version ? (version.output as DesignOutput).html : "";
  if (!html) return NextResponse.json({ error: "This prototype is not ready yet." }, { status: 404 });

  // every colour code in the styles, and how many times it is used
  const counts = new Map<string, number>();
  for (const m of html.matchAll(/[:(,\s]#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![\w-])/g)) {
    const hex = six(m[1]);
    counts.set(hex, (counts.get(hex) ?? 0) + 1);
  }
  // the named colours the app gives every prototype
  const roles: Record<string, string> = {};
  for (const m of html.matchAll(/--(primary|background|text|accent)\s*:\s*(#[0-9a-fA-F]{3,6})\b/g)) roles[m[1]] = six(m[2].slice(1));
  const fonts: Record<string, string> = {};
  for (const m of html.matchAll(/--font-(heading|body)\s*:\s*([^;}]+)/g)) fonts[m[1]] = m[2].trim().replace(/["']/g, "").split(",")[0].trim();

  const roleOf = (hex: string) => Object.entries(roles).find(([, v]) => v === hex)?.[0];
  const label = { primary: "Main", background: "Background", text: "Text", accent: "Accent" } as Record<string, string>;
  const colours = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([hex, uses]) => ({ hex, uses, role: roleOf(hex) ? label[roleOf(hex)!] : undefined, on: readableOn(hex) }));
  // named colours that are used only through the variable still belong in the palette
  for (const [r, hex] of Object.entries(roles))
    if (!colours.some((c) => c.hex === hex)) colours.unshift({ hex, uses: counts.get(hex) ?? 0, role: label[r], on: readableOn(hex) });

  const pair = (name: string, fg?: string, bg?: string, need = 4.5) =>
    fg && bg ? [{ name, fg, bg, ratio: Math.round(contrastRatio(fg, bg) * 10) / 10, need }] : [];
  const pairs = [
    ...pair("Text on background", roles.text, roles.background, 4.5),
    ...pair("Button label on main colour", roles.background, roles.primary, 4.5),
    ...pair("Main colour on background", roles.primary, roles.background, 3),
    ...pair("Accent on background", roles.accent, roles.background, 3),
  ];
  return NextResponse.json({ colours: colours.slice(0, 12), pairs, fonts });
}
