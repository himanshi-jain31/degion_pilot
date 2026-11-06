/* eslint-disable @typescript-eslint/no-explicit-any */
import { DEMO_SCREENS, cleanScreens } from "@/lib/wireframes";
import { DEMO_CSS } from "@/lib/prototype";
import type { Severity, TestingOutput, DesignOutput, AnyOutput, WireframeOutput, Finding, IdeateOutput, PhaseOutput, Profile, ResearchOutput, StructureNode, UnderstandOutput } from "@/lib/storage";

// Checks the AI's answer has what the screen needs, and fills small gaps with empty lists.
// Each checker throws a short plain problem if something important is missing (the AI is then asked once more).
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const str = (v: unknown) => (typeof v === "string" ? v : "");
const strs = (v: unknown) => arr<unknown>(v).map(String);
const label = (v: unknown) => (v === "Checked" || v === "Test idea only" ? v : "My guess");

// Checks the AI's answer has what the screen needs, and fills small gaps with empty lists
export function validateUnderstand(data: unknown): UnderstandOutput {
  const d = data as Record<string, any>;
  if (!d || typeof d !== "object") throw new Error("not an object");
  if (!d.brief?.one_line) throw new Error("brief.one_line is missing");
  return {
    ...common(d),
    brief: { one_line: str(d.brief.one_line), full: str(d.brief.full) },
    another_view: str(d.another_view),
    users: arr<any>(d.users).map((u) => ({ name: str(u?.name), note: str(u?.note), label: label(u?.label) })),
    user_profiles: profiles(d.user_profiles),
    requirements: arr<any>(d.requirements).map((r, i) => ({
      id: str(r?.id) || `R${i + 1}`, story: str(r?.story), done_checks: strs(r?.done_checks), label: label(r?.label),
    })),
    edge_cases: strs(d.edge_cases),
    not_asked_about: arr<any>(d.not_asked_about).map((n) => ({ topic: str(n?.topic), why_it_matters: str(n?.why_it_matters) })),
    success_measures: strs(d.success_measures),
    open_questions: strs(d.open_questions),
  };
}


// The parts every phase returns
function common(d: any): PhaseOutput {
  if (!d.plan) throw new Error("plan is missing");
  if (!d.checkin?.what_i_made) throw new Error("checkin.what_i_made is missing");
  return {
    plan: {
      will_do: strs(d.plan.will_do),
      will_skip: arr<any>(d.plan.will_skip).map((s) => ({ item: str(s?.item), why: str(s?.why) })),
    },
    things_i_guessed: arr<any>(d.things_i_guessed).map((t) => ({
      guess: str(t?.guess), risk_if_wrong: str(t?.risk_if_wrong), how_to_check: str(t?.how_to_check),
    })),
    what_i_did: strs(d.what_i_did),
    checkin: {
      what_i_made: str(d.checkin.what_i_made),
      not_sure_about: strs(d.checkin.not_sure_about).slice(0, 3),
      another_view: str(d.checkin.another_view),
    },
    what_changed: d.what_changed ? strs(d.what_changed) : undefined,
  };
}

const profiles = (v: unknown): Profile[] =>
  arr<any>(v).map((u) => ({
    name: str(u?.name), goal: str(u?.goal), situation: str(u?.situation), frustrations: strs(u?.frustrations), label: label(u?.label),
  }));

export function validateResearch(data: unknown): ResearchOutput {
  const d = data as Record<string, any>;
  if (!d || typeof d !== "object") throw new Error("not an object");
  const findings: Finding[] = arr<any>(d.findings).map((f) => ({
    type: str(f?.type), finding: str(f?.finding), source_title: str(f?.source_title), source_url: str(f?.source_url),
    label: label(f?.label),
    confidence: f?.confidence === "High" || f?.confidence === "Low" ? f.confidence : "Medium",
  }));
  if (findings.length === 0) throw new Error("findings list is empty");
  const kit = d.research_kit ?? {};
  return {
    ...common(d),
    findings,
    key_insights: arr<any>(d.key_insights).map((k) => ({ insight: str(k?.insight), based_on: strs(k?.based_on) })),
    updated_user_profiles: profiles(d.updated_user_profiles),
    research_kit: {
      goals: strs(kit.goals), interview_questions: strs(kit.interview_questions),
      survey_questions: strs(kit.survey_questions), who_to_recruit: str(kit.who_to_recruit),
    },
    could_not_find: strs(d.could_not_find),
  };
}

const normUrl = (u: string) => u.trim().replace(/#.*$/, "").replace(/\/+$/, "").toLowerCase();

// Honesty check: a finding may only stay "Checked" if its link is one the web search really returned
// (or it says it comes from the designer's own notes or files).
export function checkSources(out: ResearchOutput, searched: Set<string>, demo: boolean): ResearchOutput {
  if (demo) return out;
  const real = new Set([...searched].map(normUrl));
  out.findings = out.findings.map((f) => {
    const fromDesigner = /interview notes|your notes|your files|uploaded|your answers/i.test(f.source_title);
    if (f.label === "Checked" && !fromDesigner && !(f.source_url && real.has(normUrl(f.source_url)))) {
      return { ...f, label: "My guess", confidence: "Low", check_note: "I could not match this link to my search, so I changed the label to My guess." };
    }
    return f;
  });
  return out;
}

function structure(v: unknown, depth = 0): StructureNode[] {
  if (depth > 5) return [];
  return arr<any>(v).map((n) => ({ page: str(n?.page), children: structure(n?.children, depth + 1) }));
}

export function validateIdeate(data: unknown): IdeateOutput {
  const d = data as Record<string, any>;
  if (!d || typeof d !== "object") throw new Error("not an object");
  const directions = arr<any>(d.directions).map((x, i) => ({
    id: str(x?.id) || String.fromCharCode(65 + i), name: str(x?.name), core_idea: str(x?.core_idea),
    key_screens: strs(x?.key_screens), good_at: str(x?.good_at), gives_up: str(x?.gives_up),
    effort: str(x?.effort), risk: str(x?.risk), serves: strs(x?.serves),
  }));
  if (directions.length < 2) throw new Error("at least 2 directions are needed");
  // Rule from the recipe: a direction without "what it gives up" is not allowed
  if (directions.some((x) => !x.gives_up.trim())) throw new Error('every direction needs "gives_up"');
  const structureTree = structure(d.product_structure);
  if (structureTree.length === 0) throw new Error("product_structure is empty");
  return {
    ...common(d),
    product_structure: structureTree,
    user_flows: arr<any>(d.user_flows).map((f) => ({ name: str(f?.name), type: str(f?.type), steps: strs(f?.steps) })),
    journeys: {
      today: arr<any>(d.journeys?.today).map((j) => ({ step: str(j?.step), feeling: str(j?.feeling), pain: str(j?.pain) })),
      future: arr<any>(d.journeys?.future).map((j) => ({ step: str(j?.step), feeling: str(j?.feeling) })),
    },
    storyboard: arr<any>(d.storyboard).map((f, i) => ({ frame: Number(f?.frame) || i + 1, scene: str(f?.scene) })),
    directions,
    recommendation: { direction: str(d.recommendation?.direction), why: str(d.recommendation?.why) },
  };
}

// Phase 4: the first AI answer has the screen list and notes; the html is added after the screens are drawn
export function validateWireframePlan(data: unknown): WireframeOutput {
  const d = data as Record<string, any>;
  if (!d || typeof d !== "object") throw new Error("not an object");
  return {
    ...common(d),
    screens: cleanScreens(d.screens),
    wording: arr<any>(d.wording).map((w) => ({ screen: str(w?.screen), text: str(w?.text), where: str(w?.where) })),
    accessibility_notes: strs(d.accessibility_notes),
    html: "",
    warnings: [],
  };
}

// Phase 5: the first AI answer has the checks, cover note and stylesheet; the html is added after the screens are designed
export function validateDesignPlan(data: unknown): DesignOutput {
  const d = data as Record<string, any>;
  if (!d || typeof d !== "object") throw new Error("not an object");
  if (typeof d.css !== "string" || d.css.trim().length < 50) throw new Error("css (the stylesheet) is missing");
  const c = d.design_checks ?? {};
  const n = d.cover_note ?? {};
  return {
    ...common(d),
    design_checks: {
      contrast: str(c.contrast), tap_sizes: str(c.tap_sizes), manipulative_design: str(c.manipulative_design),
      style_match: str(c.style_match), off_style_items: strs(c.off_style_items),
    },
    computed_checks: [],
    cover_note: { what_was_built: str(n.what_was_built), what_was_guessed: strs(n.what_was_guessed), not_tested_yet: strs(n.not_tested_yet) },
    screens: [],
    html: "",
    warnings: [],
    style_given: false,
    css: d.css,
  };
}

const severity = (v: unknown): Severity => (v === "High" || v === "Low" ? v : "Medium");
const RANK = { High: 0, Medium: 1, Low: 2 } as const;
// "3 of 5" counts as 3. Used to put the most common issue first when severity is equal.
const howMany = (t: string) => Number(t.match(/\d+/)?.[0] ?? 0);

// Phase 6. A "prepare" answer has no results; an "analyse" answer must have results.
export function validateTesting(data: unknown, part: "prepare" | "analyse"): TestingOutput {
  const d = data as Record<string, any>;
  if (!d || typeof d !== "object") throw new Error("not an object");
  const base = common(d);
  const out: TestingOutput = {
    ...base,
    test_plan: {
      goals: strs(d.test_plan?.goals),
      tasks: arr<any>(d.test_plan?.tasks).map((t) => ({ task: str(t?.task), success: str(t?.success), tests: strs(t?.tests) })),
    },
    script: strs(d.script),
    expert_check: arr<any>(d.expert_check)
      .map((e) => ({ issue: str(e?.issue), where: str(e?.where), severity: severity(e?.severity) }))
      .sort((a, b) => RANK[a.severity] - RANK[b.severity]),
    cannot_check_automatically: strs(d.cannot_check_automatically),
    not_tested: strs(d.not_tested),
  };
  if (part === "prepare") {
    if (out.test_plan.tasks.length === 0) throw new Error("test_plan.tasks is empty");
    if (out.script.length === 0) throw new Error("script is empty");
    return out;
  }
  const r = d.results_analysis;
  if (!r || !Array.isArray(r.issues)) throw new Error("results_analysis.issues is missing");
  out.results_analysis = {
    task_results: arr<any>(r.task_results).map((t) => ({ task: str(t?.task), succeeded: str(t?.succeeded), stuck_at: str(t?.stuck_at) })),
    // most serious first, then the one that hit most people
    issues: arr<any>(r.issues)
      .map((i) => ({ issue: str(i?.issue), how_many: str(i?.how_many), severity: severity(i?.severity), fix: str(i?.fix) }))
      .sort((a, b) => RANK[a.severity] - RANK[b.severity] || howMany(b.how_many) - howMany(a.how_many)),
    recommendation: str(r.recommendation),
  };
  // Honesty rule: "Confirmed" or "Wrong" must come with words from the notes, otherwise it stays "Open"
  out.guess_updates = arr<any>(d.things_i_guessed).map((g) => {
    const status = g?.status === "Confirmed" || g?.status === "Wrong" ? g.status : "Open";
    const evidence = str(g?.evidence).trim();
    return { id: str(g?.id), guess: str(g?.guess), status: status !== "Open" && !evidence ? "Open" : status, evidence };
  });
  out.things_i_guessed = [];
  return out;
}

export const validators: Record<number, (d: unknown) => AnyOutput> = {
  1: validateUnderstand,
  2: validateResearch,
  3: validateIdeate,
  4: validateWireframePlan,
  5: validateDesignPlan,
  6: (d) => validateTesting(d, "prepare"),
};

// Made-up Phase 1 result for demo mode. Everything is marked "Test idea only".
export function demoUnderstand(feedback?: string) {
  const T = "Test idea only";
  return {
    plan: {
      will_do: ["DEMO: write a short brief", "DEMO: list the people who will use it", "DEMO: write a few requirements"],
      will_skip: [{ item: "Research", why: "That is the next step, not this one." }],
    },
    brief: { one_line: "DEMO: Staff can ask for time off and managers can answer.", full: "This is made-up text so you can see how the screen looks. Nothing here came from your request." },
    another_view: "DEMO: Maybe the real problem is that managers cannot see who is away.",
    users: [
      { name: "Staff", note: "DEMO: ask for time off.", label: T },
      { name: "Managers", note: "DEMO: say yes or no.", label: T },
      { name: "Admin (nobody mentioned)", note: "DEMO: fixes mistakes and sets the rules.", label: T },
    ],
    user_profiles: [
      { name: "Anna, staff member", goal: "Get time off with little fuss.", situation: "Usually on her phone.", frustrations: ["Slow email replies", "Not sure of her days left"], label: T },
      { name: "Ben, manager", goal: "Answer quickly and avoid gaps.", situation: "Between meetings.", frustrations: ["Cannot see who is away"], label: T },
    ],
    requirements: [
      { id: "R1", story: "As staff, I can ask for time off, so that my manager can answer.", done_checks: ["I can pick dates", "I see my request afterwards"], label: T },
      { id: "R2", story: "As a manager, I can say yes or no, so that staff know quickly.", done_checks: ["I see all waiting requests"], label: T },
    ],
    edge_cases: ["DEMO: no days left", "DEMO: dates that overlap", "DEMO: very long reason text"],
    not_asked_about: [{ topic: "Accessibility", why_it_matters: "DEMO: everyone must be able to use it, including with screen readers." }],
    success_measures: ["DEMO: fewer emails about time off"],
    open_questions: ["DEMO: who approves when the manager is away?"],
    things_i_guessed: [{ guess: "DEMO: most people use phones.", risk_if_wrong: "The layout may suit the wrong device.", how_to_check: "Ask five users." }],
    what_i_did: ["DEMO: made up a result to show the screens", feedback ? "DEMO: noted your feedback" : "DEMO: no AI was used"],
    checkin: {
      what_i_made: "DEMO: a made-up brief, 3 users, 2 profiles and 2 requirements.\nNone of it is real. It only shows how the screens work.",
      not_sure_about: ["DEMO: who approves when the manager is away?", "DEMO: which device people use most"],
      another_view: "DEMO: maybe the real problem is seeing who is away.",
    },
    what_changed: feedback ? [`DEMO: pretend change based on your note: "${feedback.slice(0, 120)}"`] : undefined,
  };
}

export function demoResearch(feedback?: string) {
  const T = "Test idea only";
  return {
    plan: { will_do: ["DEMO: look at similar apps", "DEMO: check accessibility rules"], will_skip: [{ item: "Numbers from data", why: "No data was uploaded." }] },
    findings: [
      { type: "competitors", finding: "DEMO: other leave apps show days left on the first screen.", source_title: "Example page (made up)", source_url: "https://example.com/demo-1", label: T, confidence: "Low" },
      { type: "accessibility", finding: "DEMO: form fields need clear labels.", source_title: "Example page (made up)", source_url: "https://example.com/demo-2", label: T, confidence: "Low" },
      { type: "what people say", finding: "DEMO: people dislike slow replies.", source_title: "Example page (made up)", source_url: "https://example.com/demo-3", label: T, confidence: "Low" },
    ],
    key_insights: [{ insight: "DEMO: show days left up front.", based_on: ["1"] }, { insight: "DEMO: keep forms simple and labelled.", based_on: ["2", "3"] }],
    updated_user_profiles: [{ name: "Anna, staff member", goal: "Get time off with little fuss.", situation: "Mostly on her phone.", frustrations: ["Slow replies"], label: T }],
    research_kit: {
      goals: ["DEMO: learn how people ask for leave today"],
      interview_questions: ["DEMO: Tell me about the last time you asked for time off.", "DEMO: What was hardest about it?"],
      survey_questions: ["DEMO: How often do you ask for leave?"],
      who_to_recruit: "DEMO: 5 staff and 2 managers.",
    },
    could_not_find: ["DEMO: no real numbers (this is a demo)"],
    things_i_guessed: [{ guess: "DEMO: staff prefer phones.", risk_if_wrong: "Wrong device focus.", how_to_check: "Interview 5 people." }],
    what_i_did: ["DEMO: made up research results", feedback ? "DEMO: noted your feedback and notes" : "DEMO: no web search was used"],
    checkin: {
      what_i_made: "DEMO: 3 made-up findings, 2 insights and a small research kit.\nNone of it is real.",
      not_sure_about: ["DEMO: all sources are made up"],
      another_view: "DEMO: maybe the managers matter more than staff.",
    },
    what_changed: feedback ? [`DEMO: pretend change based on your note: "${feedback.slice(0, 120)}"`] : undefined,
  };
}

export function demoIdeate(feedback?: string) {
  const dir = (id: string, name: string, idea: string, gives: string, effort: string) => ({
    id, name, core_idea: idea, key_screens: ["Home", "New request", "Request list"], good_at: `DEMO: ${name} is quick to learn.`,
    gives_up: gives, effort, risk: "DEMO: people may expect more.", serves: ["R1", "R2"],
  });
  return {
    plan: { will_do: ["DEMO: product structure", "DEMO: flows", "DEMO: 3 directions"], will_skip: [{ item: "Storyboard detail", why: "Kept short for the demo." }] },
    product_structure: [
      { page: "Home", children: [{ page: "My requests", children: [{ page: "Request details" }] }, { page: "New request" }] },
      { page: "Manager inbox", children: [{ page: "Answer a request" }] },
    ],
    user_flows: [
      { name: "Ask for time off", type: "main", steps: ["Open Home", "Tap New request", "Pick dates", "Send"] },
      { name: "No days left", type: "error", steps: ["Pick dates", "See a clear message", "Choose other dates"] },
    ],
    journeys: {
      today: [{ step: "Writes an email", feeling: "Unsure", pain: "No reply for days" }],
      future: [{ step: "Sends a request in the app", feeling: "Calm" }],
    },
    storyboard: [{ frame: 1, scene: "DEMO: Anna wants a day off." }, { frame: 2, scene: "DEMO: She sends a request on her phone." }, { frame: 3, scene: "DEMO: Ben answers between meetings." }],
    directions: [
      dir("A", "Simple form", "One short form and a list.", "Gives up a calendar view.", "Low"),
      dir("B", "Team calendar", "Everything lives on a shared calendar.", "Gives up speed on small phones.", "Medium"),
      dir("C", "Chat helper (flip the constraint)", "Ask for leave by chatting.", "Gives up a clear overview.", "High"),
    ],
    recommendation: { direction: "A", why: "DEMO: it is the quickest way to the main goal." },
    things_i_guessed: [{ guess: "DEMO: managers answer on phones too.", risk_if_wrong: "Wrong layout.", how_to_check: "Ask 3 managers." }],
    what_i_did: ["DEMO: made up a structure, flows and 3 directions", feedback ? "DEMO: noted your feedback" : "DEMO: no AI was used"],
    checkin: {
      what_i_made: "DEMO: a made-up structure, 2 flows and 3 directions (A, B, C).\nNone of it is real.",
      not_sure_about: ["DEMO: which direction fits best"],
      another_view: "DEMO: maybe a calendar-first idea fits better.",
    },
    what_changed: feedback ? [`DEMO: pretend change based on your note: "${feedback.slice(0, 120)}"`] : undefined,
  };
}

export function demoWireframes(feedback?: string) {
  return {
    plan: { will_do: ["DEMO: list the screens", "DEMO: draw each one in grey and join them"], will_skip: [{ item: "Loading screens", why: "Kept short for the demo." }] },
    screens: DEMO_SCREENS,
    wording: [{ screen: "home", text: "New request", where: "button" }],
    accessibility_notes: ["DEMO: every button has a clear label", "DEMO: contrast between text and background is high"],
    things_i_guessed: [{ guess: "DEMO: people start from Home.", risk_if_wrong: "The first screen may be wrong.", how_to_check: "Watch 3 people use it." }],
    what_i_did: ["DEMO: made up 6 screens", feedback ? "DEMO: noted your feedback" : "DEMO: no AI was used"],
    checkin: {
      what_i_made: "DEMO: a made-up clickable wireframe with 6 screens, including empty, error and no-permission.\nNone of it is real.",
      not_sure_about: ["DEMO: the order of the screens"],
      another_view: "DEMO: maybe the list should be the first screen.",
    },
    what_changed: feedback ? [`DEMO: pretend change based on your note: "${feedback.slice(0, 120)}"`] : undefined,
  };
}

export function demoDesign(feedback?: string) {
  return {
    plan: { will_do: ["DEMO: apply the design style to every screen", "DEMO: check contrast and button sizes"], will_skip: [{ item: "Animations", why: "Not needed for a first prototype." }] },
    css: DEMO_CSS,
    design_checks: {
      contrast: "DEMO: text and buttons use strong contrast.",
      tap_sizes: "DEMO: buttons are at least 44px tall.",
      manipulative_design: "DEMO: no hidden costs or pushy wording found.",
      style_match: "DEMO: Matches your design style: about 90% (my own estimate)",
      off_style_items: ["DEMO: a light blue tint used for banners was added"],
    },
    cover_note: {
      what_was_built: "DEMO: a made-up clickable prototype with the same 6 screens as the wireframe.",
      what_was_guessed: ["DEMO: sample names and dates are made up"],
      not_tested_yet: ["DEMO: not tested with real people", "DEMO: not tested with a screen reader"],
    },
    things_i_guessed: [{ guess: "DEMO: the main colour suits the brand.", risk_if_wrong: "The look may feel off.", how_to_check: "Show it to the brand owner." }],
    what_i_did: ["DEMO: made up a styled prototype", feedback ? "DEMO: noted your feedback" : "DEMO: no AI was used"],
    checkin: {
      what_i_made: "DEMO: a made-up styled prototype with 6 screens.\nNone of it is real.",
      not_sure_about: ["DEMO: how well it matches your brand"],
      another_view: "DEMO: maybe a calmer colour would feel safer.",
    },
    what_changed: feedback ? [`DEMO: pretend change based on your note: "${feedback.slice(0, 120)}"`] : undefined,
  };
}

export function demoTestingPrepare(feedback?: string) {
  return {
    plan: { will_do: ["DEMO: write a test plan and script", "DEMO: review the prototype"], will_skip: [{ item: "Automatic accessibility scan", why: "Not available in the demo." }] },
    test_plan: {
      goals: ["DEMO: see if people can ask for time off without help"],
      tasks: [
        { task: "Ask for 2 days off next month", success: "Sends the request in under 2 minutes", tests: ["R1"] },
        { task: "Find the answer to your last request", success: "Finds it in 2 taps", tests: ["R2"] },
      ],
    },
    script: ["Welcome: thank you for helping. We test the design, not you.", "Task 1: Ask for 2 days off next month.", "Task 2: Find the answer to your last request.", "Follow-up: What was easiest? What was confusing?"],
    expert_check: [
      { issue: "DEMO: the date fields are small on phones", where: "New request", severity: "Medium" },
      { issue: "DEMO: error message does not say what to do next", where: "Something went wrong", severity: "High" },
    ],
    cannot_check_automatically: ["DEMO: whether the words make sense to real people", "DEMO: how it feels with a screen reader"],
    not_tested: ["DEMO: R3 (not covered by any task)"],
    things_i_guessed: [{ guess: "DEMO: 5 people are enough for a first round.", risk_if_wrong: "Missed problems.", how_to_check: "Run a second round." }],
    what_i_did: ["DEMO: made up a test plan", feedback ? "DEMO: noted your feedback" : "DEMO: no AI was used"],
    checkin: { what_i_made: "DEMO: a test plan with 2 tasks, a script and an expert check.", not_sure_about: ["DEMO: the right number of testers"], another_view: "DEMO: maybe test the manager side first." },
  };
}

export function demoTestingAnalyse(notes: string, guesses: { id: string; text: string }[]) {
  const lines = notes.split(/\n+/).map((l) => l.trim()).filter((l) => l.length > 8 && !l.startsWith("---")).slice(0, 4);
  const sev = ["High", "Medium", "Medium", "Low"];
  const statuses = ["Confirmed", "Wrong", "Open"] as const;
  return {
    plan: { will_do: ["DEMO: read the notes", "DEMO: rank the problems"], will_skip: [] },
    results_analysis: {
      task_results: [{ task: "DEMO: task 1", succeeded: "DEMO: see your notes", stuck_at: "DEMO: see your notes" }],
      issues: lines.map((l, i) => ({ issue: `DEMO: ${l}`, how_many: "DEMO: as written in your notes", severity: sev[i], fix: "DEMO: make this easier to find" })),
      recommendation: "fix in wireframes",
    },
    things_i_guessed: guesses.map((g, i) => ({ id: g.id, guess: g.text, status: statuses[i % 3], evidence: statuses[i % 3] === "Open" ? "" : `DEMO: "${lines[0] ?? "your notes"}"` })),
    what_i_did: ["DEMO: made up an analysis from your notes"],
    checkin: { what_i_made: `DEMO: ${lines.length} issues, most important first.`, not_sure_about: ["DEMO: small number of testers"], another_view: "DEMO: maybe some problems are one person's habit." },
  };
}

export const demos: Record<number, (feedback?: string) => unknown> = {
  1: demoUnderstand,
  2: demoResearch,
  3: demoIdeate,
  4: demoWireframes,
  5: demoDesign,
};
