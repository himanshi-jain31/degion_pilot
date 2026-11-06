import { NextResponse } from "next/server";
import { cleanStyle } from "@/lib/styles";
import { loadProject, saveProject } from "@/lib/storage";

// Saves the typed design style (colours, fonts, corners, notes). Uploaded brand files are kept as they are.
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const project = await loadProject(id);
  if (!project) return NextResponse.json({ error: "I can't find this project." }, { status: 404 });
  const body = await request.json().catch(() => null);
  const c = body?.colours;
  if (c && ![c.primary, c.background, c.text].every((x) => /^#[0-9a-fA-F]{6}$/.test(x ?? "")))
    return NextResponse.json({ error: "One of the colours is not valid. Please pick it again." }, { status: 400 });
  if (body?.clear) {
    project.designStyle = undefined;
  } else {
    project.designStyle = cleanStyle(body, project.designStyle?.files ?? []);
  }
  await saveProject(project);
  return NextResponse.json({ ok: true });
}
