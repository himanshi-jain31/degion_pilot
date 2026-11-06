import { randomUUID } from "crypto";
import { FriendlyError, MODEL_PHASE, askForJson, buildProjectContent, isDemo, readRecipe } from "@/lib/ai";
import { checkSources, demoTestingAnalyse, demoTestingPrepare, demos, validateTesting, validators } from "@/lib/phaseDefs";
import { phaseByNumber } from "@/lib/phases";
import { PhaseVersion, Project, DesignOutput, ResearchOutput, TestingOutput, WireframeOutput, loadProject, saveProject, withProjectLock } from "@/lib/storage";
import { DEMO_SCREENS, PLAN_RULES, assemble, demoFragment, drawScreen } from "@/lib/wireframes";
import { DESIGN_RULES, assemblePrototype, sanitizeCss, designScreen, wireframeFragments } from "@/lib/prototype";
import { figmaText, figmaPalette, offStyleColours } from "@/lib/figma";
import { computedChecks, hasStyle, rootVars, styleBlocks, styleSummary } from "@/lib/styles";
import { ANALYSE_RULES, PREPARE_RULES } from "@/lib/testing";
import type Anthropic from "@anthropic-ai/sdk";

// Runs that are really going on right now (kept across code reloads while testing)
const g = globalThis as unknown as { __activeRuns?: Set<string> };
const activeRuns = (g.__activeRuns ??= new Set<string>());

export function isRunning(versionId: string) {
  return activeRuns.has(versionId);
}

// Everything CLAUDE.md says a phase must receive, added after the requirement and file text
function extraContext(project: Project, phase: number, feedback: string | undefined, previous: PhaseVersion | undefined) {
  let t = "";
  const qs = project.quickQuestions?.questions ?? [];
  if (qs.length) {
    t += "QUICK-QUESTION ANSWERS:\n";
    for (const q of qs) t += `- ${q.question} -> ${project.answers[q.id] ?? "(not answered)"}\n`;
  }
  // only the newest approved version of each earlier phase (fixes from testing can approve a phase twice)
  const approved = [1, 2, 3, 4, 5, 6]
    .filter((n) => n < phase)
    .map((n) => project.versions.filter((v) => v.phase === n && v.approved && v.output).at(-1))
    .filter((v): v is PhaseVersion => !!v);
  if (approved.length) {
    t += "\nAPPROVED OUTPUTS FROM EARLIER PHASES:\n";
    for (const v of approved) {
      t += `Phase ${v.phase} (${phaseByNumber(v.phase)?.name}): ${JSON.stringify(v.output, (k, x) => (k === "html" ? "(html left out to save space)" : x))}\n`;
      if (v.approvalNote) t += `Designer's note when approving: ${v.approvalNote}\n`;
      if (v.chosenDirection) t += `THE DESIGNER CHOSE DIRECTION ${v.chosenDirection}. Build on that direction only.\n`;
    }
  }
  // Interview notes the designer uploaded after talking to real users (Phase 2 only)
  if (phase === 2 && project.interviewNotes?.length) {
    t += "\nINTERVIEW NOTES FROM REAL USERS (from the designer; label findings from these as Checked and name the note file as the source_title, e.g. \"Your interview notes: <file name>\"):\n";
    for (const n of project.interviewNotes) t += `--- ${n.name} ---\n${n.text.slice(0, 40000)}\n`;
  }
  // Figma files the designer shared. A design system is used in Phase 5; the others are background for every phase.
  const figmaOthers = (project.figmaFiles ?? []).filter((f) => f.role && (phase !== 5 || f.role !== "design-system"));
  if (figmaOthers.length) {
    t += "\nFIGMA FILES THE DESIGNER SHARED (read only; do not copy them, use them as background):\n";
    for (const f of figmaOthers) t += `[${f.role}] ${figmaText(f, false)}\n`;
  }
  if (feedback && previous?.output) {
    t += `\nYOUR PREVIOUS ATTEMPT (version ${previous.version}):\n${JSON.stringify(previous.output, (k, v) => (k === "html" ? "(html left out to save space)" : v))}\n`;
    t += `\nDESIGNER FEEDBACK (apply it):\n${feedback}\n`;
    t += `\nBecause this is a redo, also add a key "what_changed": a list of short plain sentences saying what you changed compared with the previous attempt.\n`;
  }
  return t;
}

function saveRun(projectId: string, versionId: string, change: (v: PhaseVersion, p: Project) => void) {
  return withProjectLock(projectId, async () => {
    const p = await loadProject(projectId);
    const v = p?.versions.find((x) => x.id === versionId);
    if (!p || !v) return;
    change(v, p);
    await saveProject(p);
  });
}

// Starts a new version of a phase. Returns straight away; the work goes on in the background.
export function startPhase(projectId: string, phase: number, feedback?: string, part?: "prepare" | "analyse"): Promise<PhaseVersion> {
  return withProjectLock(projectId, () => startPhaseNow(projectId, phase, feedback, part));
}

async function startPhaseNow(projectId: string, phase: number, feedback?: string, part?: "prepare" | "analyse"): Promise<PhaseVersion> {
  const project = await loadProject(projectId);
  const info = phaseByNumber(phase);
  if (!project || !info) throw new FriendlyError("I can't find this project.");

  const earlier = project.versions.filter((v) => v.phase === phase);
  const previous = [...earlier].reverse().find((v) => v.output);
  const version: PhaseVersion = {
    id: randomUUID(),
    phase,
    version: earlier.length + 1,
    createdAt: new Date().toISOString(),
    status: "working",
    feedback: feedback || undefined,
    progressChars: 0,
    part: phase === 6 ? part ?? "prepare" : undefined,
  };
  project.versions.push(version);
  project.phases[info.name] = "Working on it";
  await saveProject(project);

  activeRuns.add(version.id);
  void work(projectId, version.id, phase, feedback, previous, version.part);
  return version;
}

async function work(projectId: string, versionId: string, phase: number, feedback: string | undefined, previous: PhaseVersion | undefined, part?: "prepare" | "analyse") {
  const info = phaseByNumber(phase)!;
  let lastWrite = 0;
  let searched = new Set<string>();
  try {
    const project = (await loadProject(projectId))!;
    const content: Anthropic.ContentBlockParam[] = await buildProjectContent(project);
    content.push({ type: "text", text: extraContext(project, phase, feedback, previous) });

    const setNote = (frac: number, note: string) => {
      void saveRun(projectId, versionId, (v) => { v.progressChars = Math.round(frac * 14000); v.progressNote = note; });
    };
    // Phase 5 builds on the approved wireframe and the design style
    let wireframe: WireframeOutput | undefined;
    if (phase === 5) {
      wireframe = project.versions.filter((v) => v.phase === 4 && v.approved).at(-1)?.output as WireframeOutput | undefined;
      if (!wireframe?.html) throw new FriendlyError("I can't find the approved wireframe. Please finish the Wireframes step first.");
      content.push(...(await styleBlocks(project)));
      content.push({ type: "text", text: `APPROVED WIREFRAME SCREENS (the html is used afterwards, screen by screen):\n${JSON.stringify(wireframe.screens)}` });
    }
    // Phase 6: the expert check needs the prototype; the analysis needs the notes and the guess list
    let prepared: TestingOutput | undefined;
    let guessList: { id: string; text: string }[] = [];
    let notesText = "";
    if (phase === 6) {
      const proto = project.versions.filter((v) => v.phase === 5 && v.approved).at(-1)?.output as DesignOutput | undefined;
      if (!proto?.html) throw new FriendlyError("I can't find the approved prototype. Please finish the Visual design step first.");
      content.push({ type: "text", text: `PROTOTYPE HTML (for the expert check; it is a long file, so it may be cut short):\n${proto.html.slice(0, 80000)}` });
      if (part === "analyse") {
        const round = project.testRound ?? 1;
        const notes = (project.testNotes ?? []).filter((n) => n.round === round);
        notesText = notes.map((n) => `--- ${n.name} ---\n${n.text.slice(0, 40000)}`).join("\n\n");
        if (notesText.trim().length < 20) throw new FriendlyError("I can't find your test notes. Please upload them first.");
        prepared = project.versions.filter((v) => v.phase === 6 && v.part === "prepare" && v.output).at(-1)?.output as TestingOutput | undefined;
        guessList = project.thingsIGuessed.map((g) => ({ id: g.id, text: g.text }));
        content.push({ type: "text", text: `THE TEST PLAN AND SCRIPT YOU PREPARED:\n${JSON.stringify(prepared ? { test_plan: prepared.test_plan, script: prepared.script } : {})}\n\nTEST NOTES FROM THE DESIGNER (the only evidence you may use):\n${notesText}\n\nTHINGS I GUESSED SO FAR (return one entry for every id):\n${guessList.map((g) => `${g.id}: ${g.text}`).join("\n")}` });
      }
    }
    let output = await askForJson({
      model: MODEL_PHASE,
      recipe: (await readRecipe(info.recipe)) + (phase === 4 ? PLAN_RULES : phase === 5 ? DESIGN_RULES : phase === 6 ? (part === "analyse" ? ANALYSE_RULES : PREPARE_RULES) : ""),
      content,
      validate: phase === 6 ? (d) => validateTesting(d, part ?? "prepare") : validators[phase],
      maxTokens: 16000,
      useWebSearch: phase === 2,
      onSearchedUrls: (urls) => { searched = urls; },
      demo: { seconds: phase === 2 ? 10 : 8, data: phase === 6 ? (part === "analyse" ? demoTestingAnalyse(notesText, guessList) : demoTestingPrepare(feedback)) : demos[phase](feedback) },
      onProgress: (chars) => {
        if (Date.now() - lastWrite < 1500) return;
        lastWrite = Date.now();
        void saveRun(projectId, versionId, (v) => { v.progressChars = chars; });
      },
    });
    // Honesty rule: no "Checked" label without a link the search really found
    if (phase === 2) output = checkSources(output as ResearchOutput, searched, isDemo());

    // Phase 4: draw the screens one at a time (3 at once), then join them into one file
    if (phase === 4) {
      const wf = output as WireframeOutput;
      const total = wf.screens.length;
      const fragments: string[] = new Array(total);
      let done = 0;
      let next = 0;
      setNote(0.1, `I listed ${total} screens. Now drawing them.`);
      const demoMode = isDemo();
      await Promise.all(
        [0, 1, 2].map(async () => {
          while (next < total) {
            const i = next++;
            const screen = wf.screens[i];
            fragments[i] = await drawScreen({
              screen, screens: wf.screens, context: content, wording: wf.wording,
              demo: demoMode ? demoFragment(wf.screens.length ? screen : DEMO_SCREENS[0], wf.screens) : "",
            });
            done++;
            setNote(0.1 + 0.85 * (done / total), `Drew screen ${done} of ${total}: ${screen.name}`);
          }
        })
      );
      const joined = assemble(wf.screens, fragments);
      wf.html = joined.html;
      wf.warnings = joined.warnings;
    }

    // Phase 5: restyle each approved wireframe screen, then join them with the stylesheet
    if (phase === 5 && wireframe) {
      const design = output as DesignOutput;
      const screens = wireframe.screens;
      const source = wireframeFragments(wireframe.html, screens);
      const total = screens.length;
      const fragments: string[] = new Array(total);
      const styleText = styleSummary(project.designStyle, project.figmaFiles);
      const summary = project.quickQuestions?.request_summary || project.requirement.slice(0, 300);
      const demoMode = isDemo();
      let done = 0;
      let next = 0;
      setNote(0.1, `Applying the design to ${total} screens.`);
      await Promise.all(
        [0, 1, 2].map(async () => {
          while (next < total) {
            const i = next++;
            fragments[i] = await designScreen({
              screen: screens[i], screens, wireframe: source[i], css: design.css ?? "", styleText, summary,
              demo: demoMode ? source[i] : "",
            });
            done++;
            setNote(0.1 + 0.85 * (done / total), `Designed screen ${done} of ${total}: ${screens[i].name}`);
          }
        })
      );
      const joined = assemblePrototype({ screens, fragments, css: design.css ?? "", vars: rootVars(project.designStyle) });
      design.html = joined.html;
      design.warnings = joined.warnings;
      design.screens = screens;
      design.computed_checks = computedChecks(project.designStyle);
      design.style_given = hasStyle(project.designStyle, project.figmaFiles);
      if (!design.style_given && !/not matched to a design system/i.test(design.design_checks.style_match))
        design.design_checks.style_match = `Not matched to a design system. ${design.design_checks.style_match}`;
      // A real check: colours in the prototype's own styles that are not in the Figma design system
      const palette = figmaPalette(project.figmaFiles);
      if (palette.size > 0) {
        const allowed = new Set([...palette, ...(project.designStyle?.colours ? Object.values(project.designStyle.colours).map((c) => c.toLowerCase()) : [])]);
        const off = offStyleColours(`${sanitizeCss(design.css ?? "")} ${fragments.join(" ")}`, allowed);
        design.computed_checks.push(
          off.length === 0
            ? "Colours: every colour in the prototype is in your Figma design system."
            : `Colours that are not in your Figma design system (${off.length}): ${off.slice(0, 10).join(", ")}${off.length > 10 ? " and more" : ""}.`
        );
      }
      delete design.css;
    }

    // Phase 6 analysis keeps the plan, script and expert check from the "prepare" version
    if (phase === 6 && part === "analyse" && prepared) {
      const t = output as TestingOutput;
      t.test_plan = prepared.test_plan;
      t.script = prepared.script;
      t.expert_check = prepared.expert_check;
      t.cannot_check_automatically = prepared.cannot_check_automatically;
      t.not_tested = prepared.not_tested;
    }

    await saveRun(projectId, versionId, (v, p) => {
      v.status = "done";
      v.output = output;
      v.finishedAt = new Date().toISOString();
      p.phases[info.name] = "Ready for you";
      if (phase === 6 && part === "analyse") {
        // Update the project-wide "Things I guessed" with Confirmed, Wrong or Open
        const updates = new Map((output as TestingOutput).guess_updates?.map((u) => [u.id, u]) ?? []);
        p.thingsIGuessed = p.thingsIGuessed.map((g) => {
          const u = updates.get(g.id);
          return { ...g, status: u?.status ?? "Open", evidence: u?.evidence || undefined };
        });
        return;
      }
      // Project-wide "Things I guessed": replace this phase's old entries with the new ones
      p.thingsIGuessed = p.thingsIGuessed.filter((x) => x.from !== `phase-${phase}`);
      output.things_i_guessed.forEach((t, i) =>
        p.thingsIGuessed.push({
          id: `phase-${phase}-${i}`,
          text: t.guess + (t.how_to_check ? ` (How to check: ${t.how_to_check})` : ""),
          label: "My guess",
          from: `phase-${phase}`,
        })
      );
    });
  } catch (e) {
    const message = e instanceof FriendlyError ? e.message : "Something went wrong while working. Please try again.";
    await saveRun(projectId, versionId, (v, p) => {
      v.status = "failed";
      v.error = message;
      v.finishedAt = new Date().toISOString();
      // A failed first try goes back to "Not started"; a failed redo stays at "Changes asked"
      p.phases[info.name] = v.feedback || previous?.output ? "Changes asked" : "Not started";
    });
  } finally {
    activeRuns.delete(versionId);
  }
}

// If the app was restarted in the middle of a run, mark that run as stopped so it can be retried
export async function settleStuckRuns(project: Project): Promise<Project> {
  if (!project.versions.some((v) => v.status === "working" && !isRunning(v.id))) return project;
  return withProjectLock(project.id, async () => {
    const fresh = (await loadProject(project.id)) ?? project;
    let changed = false;
    for (const v of fresh.versions) {
      if (v.status === "working" && !isRunning(v.id)) {
        v.status = "failed";
        v.error = "The work was stopped because the app was closed. Please try again.";
        const hadOutput = fresh.versions.some((x) => x.phase === v.phase && x.output);
        fresh.phases[phaseByNumber(v.phase)!.name] = v.feedback || hadOutput ? "Changes asked" : "Not started";
        changed = true;
      }
    }
    if (changed) await saveProject(fresh);
    return fresh;
  });
}
