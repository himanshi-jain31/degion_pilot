import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { MAX_FILE_BYTES, extractText } from "@/lib/extract";
import { cleanStyle } from "@/lib/styles";
import { UPLOADS_DIR, loadProject, saveProject } from "@/lib/storage";

const OK = [".pdf", ".png", ".jpg", ".jpeg", ".gif", ".webp"];

// Saves a brand guide PDF or screenshots for the design style
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const project = await loadProject(id);
  if (!project) return NextResponse.json({ error: "I can't find this project." }, { status: 404 });
  const form = await request.formData().catch(() => null);
  const uploads = (form?.getAll("files") ?? []).filter((f): f is File => f instanceof File && f.size > 0);
  if (uploads.length === 0) return NextResponse.json({ error: "Please choose a PDF or some screenshots first." }, { status: 400 });

  const style = project.designStyle ?? cleanStyle({}, []);
  const skipped: string[] = [];
  for (const file of uploads) {
    const ext = path.extname(file.name).toLowerCase();
    if (!OK.includes(ext)) { skipped.push(`${file.name} (please use a PDF or a picture)`); continue; }
    if (file.size > MAX_FILE_BYTES) { skipped.push(`${file.name} (bigger than 25 MB)`); continue; }
    const buffer = Buffer.from(await file.arrayBuffer());
    const extracted = await extractText(file.name, buffer);
    const savedAs = `style-${Date.now()}-${path.basename(file.name).replace(/[^\w.\- ]/g, "_")}`;
    await fs.mkdir(path.join(UPLOADS_DIR, id), { recursive: true });
    await fs.writeFile(path.join(UPLOADS_DIR, id, savedAs), buffer);
    style.files.push({ name: file.name, savedAs, kind: extracted.kind, text: extracted.text, note: extracted.note });
  }
  project.designStyle = style;
  await saveProject(project);
  return NextResponse.json({ ok: true, skipped });
}
