import { NextResponse } from "next/server";
import { FigmaRole, loadProject, saveProject, withProjectLock } from "@/lib/storage";

const ROLES: FigmaRole[] = ["design-system", "current-screens", "inspiration", "reference"];

// Saves the answer to "What is this?"
export async function POST(request: Request, ctx: { params: Promise<{ id: string; fid: string }> }) {
  const { id, fid } = await ctx.params;
  const body = (await request.json().catch(() => ({}))) as { role?: FigmaRole };
  if (!body.role || !ROLES.includes(body.role)) return NextResponse.json({ error: "Please choose what this file is." }, { status: 400 });
  return withProjectLock(id, async () => {
    const p = await loadProject(id);
    const f = p?.figmaFiles?.find((x) => x.id === fid);
    if (!p || !f) return NextResponse.json({ error: "I can't find that file." }, { status: 404 });
    f.role = body.role;
    await saveProject(p);
    return NextResponse.json({ ok: true });
  });
}

// Removes the file from this project only. Nothing in Figma is touched.
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string; fid: string }> }) {
  const { id, fid } = await ctx.params;
  return withProjectLock(id, async () => {
    const p = await loadProject(id);
    if (!p) return NextResponse.json({ error: "I can't find this project." }, { status: 404 });
    p.figmaFiles = (p.figmaFiles ?? []).filter((x) => x.id !== fid);
    await saveProject(p);
    return NextResponse.json({ ok: true });
  });
}
