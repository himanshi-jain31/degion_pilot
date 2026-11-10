import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { isDemo } from "@/lib/ai";
import { ALLOWED_EXTENSIONS, MAX_FILE_BYTES, extractText } from "@/lib/extract";
import { PHASES } from "@/lib/phases";
import { PHASE_NAMES, Project, ProjectFile, UPLOADS_DIR, listProjects, saveProject } from "@/lib/storage";

// Where a project is up to, in plain words, for the Home cards and list
function whereItIsUpTo(p: Project) {
  const phase = PHASES.find((ph) => p.phases[ph.name] !== "Approved");
  const failed = p.versions.some((v, i, all) => v.status === "failed" && all.filter((x) => x.phase === v.phase).at(-1) === v);
  if (!phase) return { text: "All six steps are done", tone: "done" as const, phase: "Testing", status: "Approved", step: "All six steps are done. Open the final result." };
  const status = p.phases[phase.name] ?? "Not started";
  const questionsDone = !!p.quickQuestions && p.quickQuestions.questions.every((q) => p.answers[q.id]);
  if (failed) return { text: `${phase.name}: needs another try`, tone: "waiting" as const, phase: phase.name, status, step: "That did not work. Open it to try again." };
  if (status === "Working on it") return { text: `${phase.name}: working on it`, tone: "working" as const, phase: phase.name, status, step: "I am working on it. You can leave and come back." };
  if (status === "Ready for you") return { text: `${phase.name}: ready for you to check`, tone: "waiting" as const, phase: phase.name, status, step: "Check what I made, then say Go ahead." };
  if (status === "Changes asked") return { text: `${phase.name}: changes asked`, tone: "waiting" as const, phase: phase.name, status, step: "Open it to see where I am with your changes." };
  if (!questionsDone) return { text: "Quick questions to answer", tone: "idle" as const, phase: phase.name, status, step: "Answer a few quick questions to begin." };
  return { text: `Next: ${phase.name}`, tone: "idle" as const, phase: phase.name, status, step: `Open it to start ${phase.name}.` };
}

export async function GET() {
  const projects = await listProjects();
  const rows = projects.map((p) => ({
    id: p.id,
    title: p.title,
    createdAt: p.createdAt,
    updatedAt: [p.createdAt, ...p.versions.flatMap((v) => [v.createdAt, v.finishedAt ?? ""])].sort().at(-1),
    fileCount: p.files.length,
    madeInDemo: !!p.madeInDemo,
    phases: p.phases,
    next: whereItIsUpTo(p),
  }));
  // newest activity first
  rows.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  return NextResponse.json(rows);
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
