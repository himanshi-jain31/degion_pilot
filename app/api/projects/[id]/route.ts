import { NextResponse } from "next/server";
import { isDemo } from "@/lib/ai";
import { settleStuckRuns } from "@/lib/engine";
import { promises as fs } from "fs";
import path from "path";
import { PROJECTS_DIR, UPLOADS_DIR, loadProject, withProjectLock } from "@/lib/storage";

// The project, without the long text of the uploaded files
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const found = await loadProject(id);
  if (!found) return NextResponse.json({ error: "I can't find this project." }, { status: 404 });
  const project = await settleStuckRuns(found);
  return NextResponse.json({
    ...project,
    // the wireframe html is long and is served by its own address
    versions: project.versions.map((v) =>
      (v.phase === 4 || v.phase === 5) && v.output ? { ...v, output: { ...v.output, html: v.output && "html" in v.output && v.output.html ? "ready" : "" } } : v
    ),
    demo: isDemo(),
    files: project.files.map((f) => ({ name: f.name, kind: f.kind, note: f.note })),
    designStyle: project.designStyle ? { ...project.designStyle, files: project.designStyle.files.map((f) => ({ name: f.name, kind: f.kind, note: f.note })) } : null,
    testNotes: (project.testNotes ?? []).map((n) => ({ name: n.name, uploadedAt: n.uploadedAt, round: n.round })),
    interviewNotes: (project.interviewNotes ?? []).map((n) => ({ name: n.name, uploadedAt: n.uploadedAt })),
  });
}

// Deletes a project and the files saved for it. The designer confirms on screen first.
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const project = await loadProject(id);
  if (!project) return NextResponse.json({ error: "I can't find this project." }, { status: 404 });
  if (project.versions.some((v) => v.status === "working"))
    return NextResponse.json({ error: "I am still working on this project. Please wait until I finish, then delete it." }, { status: 409 });
  await withProjectLock(id, async () => {
    await fs.rm(path.join(PROJECTS_DIR, `${id}.json`), { force: true });
    await fs.rm(path.join(UPLOADS_DIR, id), { recursive: true, force: true });
  });
  return NextResponse.json({ ok: true });
}
