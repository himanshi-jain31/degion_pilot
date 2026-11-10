import { NextResponse } from "next/server";
import { plainSummary } from "@/lib/figma-text";
import { listProjects } from "@/lib/storage";

// Every design file shared in any project (read-only list for the Design files page)
export async function GET() {
  const projects = await listProjects();
  const files = projects.flatMap((p) =>
    (p.figmaFiles ?? []).map((f) => ({
      id: f.id,
      name: f.name,
      role: f.role ?? null,
      summary: plainSummary(f.summary),
      addedAt: f.addedAt,
      projectId: p.id,
      projectTitle: p.title,
    }))
  );
  files.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
  return NextResponse.json(files);
}
