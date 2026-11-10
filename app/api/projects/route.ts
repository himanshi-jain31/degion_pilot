import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { isDemo } from "@/lib/ai";
import { ALLOWED_EXTENSIONS, MAX_FILE_BYTES, extractText } from "@/lib/extract";
import { PHASE_NAMES, Project, ProjectFile, UPLOADS_DIR, listProjects, saveProject } from "@/lib/storage";

export async function GET() {
  const projects = await listProjects();
  return NextResponse.json(
    projects.map((p) => ({
      id: p.id,
      title: p.title,
      createdAt: p.createdAt,
      fileCount: p.files.length,
      madeInDemo: !!p.madeInDemo,
    }))
  );
}

export async function POST(request: Request) {
  const form = await request.formData();
  const requirement = String(form.get("requirement") ?? "").trim();
  const uploads = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

  if (!requirement && uploads.length === 0) {
    return NextResponse.json({ error: "Please type what you need, or add a document." }, { status: 400 });
  }

  const id = randomUUID();
  const files: ProjectFile[] = [];
  const skipped: string[] = [];

  for (const [i, file] of uploads.entries()) {
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      skipped.push(`${file.name} (this kind of file is not supported)`);
      continue;
    }
    if (file.size > MAX_FILE_BYTES) {
      skipped.push(`${file.name} (bigger than 25 MB)`);
      continue;
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = path.basename(file.name).replace(/[^\w.\- ]/g, "_");
    const savedAs = `${i + 1}-${safeName}`;
    const dir = path.join(UPLOADS_DIR, id);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, savedAs), buffer);
    const extracted = await extractText(file.name, buffer);
    files.push({ name: file.name, savedAs, size: file.size, ...extracted });
  }

  // A short title: the first sentence, cut at a whole word if it is long
  const firstLine = (requirement.split("\n")[0] || files[0]?.name || "New project").trim();
  const sentence = (firstLine.match(/^.+?[.!?](\s|$)/)?.[0] ?? firstLine).trim();
  const title = sentence.length > 60 ? sentence.slice(0, 60).replace(/\s+\S*$/, "") + "…" : sentence;
  const project: Project = {
    id,
    title,
    requirement,
    createdAt: new Date().toISOString(),
    madeInDemo: isDemo() || undefined,
    files,
    answers: {},
    phases: Object.fromEntries(PHASE_NAMES.map((n) => [n, "Not started"])),
    versions: [],
    thingsIGuessed: [],
  };
  await saveProject(project);

  return NextResponse.json({
    id,
    skipped,
    files: files.map((f) => ({ name: f.name, kind: f.kind, note: f.note, characters: f.text.length })),
  });
}
