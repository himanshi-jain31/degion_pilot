import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { ALLOWED_EXTENSIONS, MAX_FILE_BYTES, extractText } from "@/lib/extract";
import { UPLOADS_DIR, loadProject, saveProject } from "@/lib/storage";

// Saves interview notes (text, Word, Excel, PDF) and pulls the text out of them
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const project = await loadProject(id);
  if (!project) return NextResponse.json({ error: "I can't find this project." }, { status: 404 });

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Please choose at least one file with your notes." }, { status: 400 });
  const uploads = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (uploads.length === 0) return NextResponse.json({ error: "Please choose at least one file with your notes." }, { status: 400 });

  const kind = form.get("kind") === "test" ? "test" : "interview";
  const round = project.testRound ?? 1;
  project.interviewNotes ??= [];
  project.testNotes ??= [];
  const skipped: string[] = [];
  for (const file of uploads) {
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext) || [".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext)) {
      skipped.push(`${file.name} (please use text, Word, Excel or PDF)`);
      continue;
    }
    if (file.size > MAX_FILE_BYTES) {
      skipped.push(`${file.name} (bigger than 25 MB)`);
      continue;
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const extracted = await extractText(file.name, buffer);
    if (!extracted.text) {
      skipped.push(`${file.name} (${extracted.note})`);
      continue;
    }
    const savedAs = `notes-${Date.now()}-${path.basename(file.name).replace(/[^\w.\- ]/g, "_")}`;
    await fs.mkdir(path.join(UPLOADS_DIR, id), { recursive: true });
    await fs.writeFile(path.join(UPLOADS_DIR, id, savedAs), buffer);
    const entry = { name: file.name, savedAs, text: extracted.text, note: extracted.note, uploadedAt: new Date().toISOString() };
    if (kind === "test") project.testNotes.push({ ...entry, round });
    else project.interviewNotes.push(entry);
  }
  await saveProject(project);
  return NextResponse.json({ ok: true, skipped });
}
