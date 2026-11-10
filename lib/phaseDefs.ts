/* eslint-disable @typescript-eslint/no-explicit-any */
import { cleanScreens } from "@/lib/wireframes";
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
    user_coverage: arr<any>(d.user_coverage).map((c) => ({ user: str(c?.user), screens: strs(c?.screens) })),
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
