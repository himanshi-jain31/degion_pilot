import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { FriendlyError } from "@/lib/ai";
import { plainSummary, readFigma } from "@/lib/figma";
import { loadProject, saveProject, withProjectLock } from "@/lib/storage";

// Reads a Figma file (read only) and keeps a summary. The "What is this?" answer comes next.
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!(await loadProject(id))) return NextResponse.json({ error: "I can't find this project." }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as { url?: string };
  if (!body.url?.trim()) return NextResponse.json({ error: "Please paste a Figma link first." }, { status: 400 });

  try {
    const read = await readFigma(body.url);
    const file = { ...read, id: randomUUID(), addedAt: new Date().toISOString() };
    await withProjectLock(id, async () => {
      const p = (await loadProject(id))!;
      // reading the same file again refreshes it and keeps the answer to "What is this?"
      const old = (p.figmaFiles ?? []).find((f) => f.fileKey === file.fileKey);
      p.figmaFiles = [...(p.figmaFiles ?? []).filter((f) => f.fileKey !== file.fileKey), { ...file, role: old?.role }];
      await saveProject(p);
    });
    return NextResponse.json({ ok: true, id: file.id, summary: plainSummary(file.summary) });
  } catch (e) {
    const message = e instanceof FriendlyError ? e.message : "Something went wrong while reading the Figma file. Please try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
