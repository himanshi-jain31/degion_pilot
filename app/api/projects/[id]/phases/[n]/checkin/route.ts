import { NextResponse } from "next/server";
import { startPhase } from "@/lib/engine";
import { phaseByNumber } from "@/lib/phases";
import { IdeateOutput, TestingOutput, loadProject, saveProject } from "@/lib/storage";

// Go ahead = approve the latest version. Not yet = redo the phase using the feedback.
// Phase 2 also takes talkToUsers ("yes" waits for interview notes). Phase 3 also takes direction (A, B, C or Mix).
export async function POST(request: Request, ctx: { params: Promise<{ id: string; n: string }> }) {
  const { id, n } = await ctx.params;
  const phase = Number(n);
  const info = phaseByNumber(phase);
  const project = await loadProject(id);
  if (!project || !info) return NextResponse.json({ error: "I can't find this project." }, { status: 404 });

  const body = (await request.json()) as { decision?: string; note?: string; talkToUsers?: string; direction?: string; fix?: string };
  const note = (body.note ?? "").trim().slice(0, 4000);
  const latest = [...project.versions].reverse().find((v) => v.phase === phase);
  if (!latest || latest.status !== "done") return NextResponse.json({ error: "There is nothing ready to check yet." }, { status: 409 });
  if (latest.approved) return NextResponse.json({ error: "This step is already approved." }, { status: 409 });

  if (body.decision === "go") {
    // Check-in 2: the designer may want to talk to real users first
    if (phase === 2 && body.talkToUsers === "yes") {
      latest.waitingForNotes = true;
      if (note) latest.approvalNote = note;
      project.phases[info.name] = "Changes asked";
      await saveProject(project);
      return NextResponse.json({ ok: true, waiting: true });
    }

    // Check-in 3: pick a direction
    if (phase === 3) {
      const directions = (latest.output as IdeateOutput).directions;
      const pick = body.direction;
      if (!pick) return NextResponse.json({ error: "Please pick a direction, or Mix, first." }, { status: 400 });
      if (pick === "Mix") {
        if (!note) return NextResponse.json({ error: "For a mix, please tell me which parts you want from each direction." }, { status: 400 });
        project.phases[info.name] = "Changes asked";
        await saveProject(project);
        await startPhase(id, phase, `Mix the directions. The designer wants this: ${note}. Offer the result as a new combined direction and keep the other directions short.`);
        return NextResponse.json({ ok: true, mixing: true });
      }
      if (!directions.some((d) => d.id === pick)) return NextResponse.json({ error: "I can't find that direction." }, { status: 400 });
      latest.chosenDirection = pick;
    }

    // Check-in 5: the approved design becomes the final result
    if (phase === 5) project.finalDesignVersionId = latest.id;
    // Check-in 6: send fixes back to an earlier phase, or finish
    if (phase === 6) {
      const results = (latest.output as TestingOutput).results_analysis;
      if (!results) return NextResponse.json({ error: "Please upload your test notes and let me analyse them first." }, { status: 409 });
      if (project.fixLoop) return NextResponse.json({ error: "Fixes are already being made." }, { status: 409 });
      if (body.fix !== "wireframes" && body.fix !== "design" && body.fix !== "none")
        return NextResponse.json({ error: "Please choose what should happen next." }, { status: 400 });
      if (body.fix !== "none") {
        const issues = results.issues.map((i) => `${i.issue} (${i.severity}; ${i.how_many}). Suggested fix: ${i.fix}`);
        if (note) issues.push(`The designer's note: ${note}`);
        if (issues.length === 0) return NextResponse.json({ error: "There are no issues to send. Choose No fixes needed." }, { status: 400 });
        const target = body.fix === "wireframes" ? 4 : 5;
        if (note) latest.approvalNote = note;
        project.fixLoop = { target: body.fix, issues };
        project.testRound = (project.testRound ?? 1) + 1;
        project.phases[info.name] = "Changes asked";
        await saveProject(project);
        await startPhase(id, target, "Fix these issues found in testing:\n" + issues.map((i) => `- ${i}`).join("\n"));
        return NextResponse.json({ ok: true, goTo: target });
      }
    }

    latest.approved = true;
    latest.approvedAt = new Date().toISOString();
    latest.waitingForNotes = false;
    if (note) latest.approvalNote = note;
    project.phases[info.name] = "Approved";

    // A phase reopened after testing: when it is approved again, go on to the next fix, or back to Testing
    let goTo: number | undefined;
    const fl = project.fixLoop;
    if (fl && phase === 4 && fl.target === "wireframes") {
      fl.needsDesign = true; // the design was made from the old wireframe, so it has to be redone
      project.phases["Visual design"] = "Changes asked";
      goTo = 5;
    } else if (fl && phase === 5) {
      project.fixLoop = undefined;
      goTo = 6;
    }
    await saveProject(project);
    return NextResponse.json({ ok: true, goTo });
  }

  if (body.decision === "not_yet") {
    if (!note) return NextResponse.json({ error: "Please tell me what to change in the box first." }, { status: 400 });
    project.phases[info.name] = "Changes asked";
    await saveProject(project);
    await startPhase(id, phase, note, phase === 6 ? latest.part : undefined);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Please choose Go ahead or Not yet." }, { status: 400 });
}
