import { NextResponse } from "next/server";
import { startPhase } from "@/lib/engine";
import { BUILT_PHASES, phaseByNumber } from "@/lib/phases";
import { PhaseVersion, loadProject } from "@/lib/storage";

export async function POST(request: Request, ctx: { params: Promise<{ id: string; n: string }> }) {
  const { id, n } = await ctx.params;
  const phase = Number(n);
  const project = await loadProject(id);
  if (!project || !phaseByNumber(phase)) return NextResponse.json({ error: "I can't find this project." }, { status: 404 });
  if (!BUILT_PHASES.includes(phase)) return NextResponse.json({ error: "This step is not built yet." }, { status: 400 });
  // Each phase starts only after the previous one got Go ahead
  if (phase > 1 && !project.versions.some((v) => v.phase === phase - 1 && v.approved))
    return NextResponse.json({ error: "Please say Go ahead on the step before this one first." }, { status: 409 });
  if (project.versions.some((v) => v.phase === phase && v.status === "working"))
    return NextResponse.json({ error: "I am already working on this step." }, { status: 409 });
  // After testing, a finished phase may be reopened with the fix list
  const fl = project.fixLoop;
  const latestOf = (n: number) => project.versions.filter((v) => v.phase === n).at(-1);
  const reopenAllowed =
    !!fl &&
    ((phase === 4 && fl.target === "wireframes" && !fl.needsDesign && !!latestOf(4)?.approved) ||
      (phase === 5 && (fl.target === "design" || fl.needsDesign) && !!latestOf(5)?.approved));
  if (!reopenAllowed && project.versions.some((v) => v.phase === phase && v.approved))
    return NextResponse.json({ error: "This step is already approved." }, { status: 409 });

  const body = (await request.json().catch(() => ({}))) as { feedback?: string; part?: string };
  let feedback = body.feedback?.trim().slice(0, 4000) || undefined;
  if (reopenAllowed && !feedback && fl) {
    feedback = (phase === 5 && fl.needsDesign ? "The wireframe changed after testing. Rebuild the design from the updated wireframe. Also fix:\n" : "Fix these issues found in testing:\n") + fl.issues.map((i) => `- ${i}`).join("\n");
  }

  // Phase 6 has two parts: "prepare" (plan, script, expert check) and "analyse" (after the notes are uploaded)
  let part: "prepare" | "analyse" | undefined;
  if (phase === 6) {
    part = body.part === "analyse" ? "analyse" : "prepare";
    if (project.fixLoop) return NextResponse.json({ error: "Fixes are still being made. Finish them first." }, { status: 409 });
    const six = project.versions.filter((v) => v.phase === 6);
    const lastPrepare = six.map((v, i) => [v, i] as [PhaseVersion, number]).filter(([v]) => v.part === "prepare").at(-1);
    if (part === "prepare") {
      const round = project.testRound ?? 1;
      if (six.filter((v) => v.part === "prepare" && v.status !== "failed").length >= round)
        return NextResponse.json({ error: "The test kit for this round is already made." }, { status: 409 });
    } else {
      if (!lastPrepare || lastPrepare[0].status !== "done")
        return NextResponse.json({ error: "Please make the test kit first." }, { status: 409 });
      if (six.slice(lastPrepare[1] + 1).some((v) => v.part === "analyse" && v.status === "done"))
        return NextResponse.json({ error: "This round is already analysed." }, { status: 409 });
      const round = project.testRound ?? 1;
      if (!(project.testNotes ?? []).some((n) => n.round === round))
        return NextResponse.json({ error: "Please upload your test notes first." }, { status: 400 });
    }
  }
  const version = await startPhase(id, phase, feedback, part);
  return NextResponse.json({ versionId: version.id });
}
