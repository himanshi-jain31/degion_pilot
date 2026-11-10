import { promises as fs } from "fs";
import path from "path";

export const PROJECTS_DIR = path.join(process.cwd(), "data", "projects");
export const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads");

export type PhaseStatus =
  | "Not started"
  | "Working on it"
  | "Ready for you"
  | "Changes asked"
  | "Approved";

export type ProjectFile = {
  name: string;
  savedAs: string;
  kind: string;
  size: number;
  text: string;
  note: string; // plain-words note about how the text was read
};

export type Question = {
  id: string;
  question: string;
  why_it_matters?: string;
  options: string[];
};

export type QuickQuestions = {
  request_summary: string;
  suggested_depth: string;
  project_name?: string; // a short name (2 to 4 words) for the project
  questions: Question[];
};

// label follows the honesty rule: Checked, My guess, or Test idea only
export type Guess = {
  id: string;
  text: string;
  label: "Checked" | "My guess" | "Test idea only";
  from: string;
  status?: "Confirmed" | "Wrong" | "Open"; // set by Phase 6 once real test notes exist
  evidence?: string; // the words from the test notes behind the status
};

// One run of one phase. Every run is kept, nothing is overwritten.
export type PhaseVersion = {
  id: string;
  phase: number; // 1 to 6
  version: number; // 1, 2, 3 ... for this phase
  createdAt: string;
  finishedAt?: string;
  status: "working" | "done" | "failed";
  feedback?: string; // what the designer asked to change ("Not yet" note)
  progressChars: number;
  output?: AnyOutput;
  error?: string;
  approved?: boolean;
  approvedAt?: string;
  approvalNote?: string; // note typed with "Go ahead"
  waitingForNotes?: boolean; // Phase 2: designer chose to talk to real users first
  chosenDirection?: string; // Phase 3: A, B or C
  progressNote?: string; // plain words about what is being worked on now
  part?: "prepare" | "analyse"; // Phase 6 only: before testing, or after the notes are uploaded
  demo?: boolean; // made-up result from demo mode, not from the AI
};

type Label = "Checked" | "My guess" | "Test idea only";

// Parts every phase returns
export type PhaseOutput = {
  plan: { will_do: string[]; will_skip: { item: string; why: string }[] };
  things_i_guessed: { guess: string; risk_if_wrong: string; how_to_check: string }[];
  what_i_did: string[];
  checkin: { what_i_made: string; not_sure_about: string[]; another_view: string };
  what_changed?: string[]; // added by the app on a redo
};

export type Profile = { name: string; goal: string; situation: string; frustrations: string[]; label: Label };

// What recipes/1-understand.md asks the AI to return
export type UnderstandOutput = PhaseOutput & {
  brief: { one_line: string; full: string };
  another_view: string;
  users: { name: string; note: string; label: Label }[];
  user_profiles: Profile[];
  requirements: { id: string; story: string; done_checks: string[]; label: Label }[];
  edge_cases: string[];
  not_asked_about: { topic: string; why_it_matters: string }[];
  success_measures: string[];
  open_questions: string[];
};

// recipes/2-research.md
export type Finding = {
  type: string;
  finding: string;
  source_title: string;
  source_url: string;
  label: Label;
  confidence: "High" | "Medium" | "Low";
  check_note?: string; // added by the app when a "Checked" link could not be matched
};
export type ResearchOutput = PhaseOutput & {
  findings: Finding[];
  key_insights: { insight: string; based_on: string[] }[];
  updated_user_profiles: Profile[];
  research_kit: { goals: string[]; interview_questions: string[]; survey_questions: string[]; who_to_recruit: string };
  could_not_find: string[];
};

// recipes/3-ideate.md
export type StructureNode = { page: string; children?: StructureNode[] };
export type Direction = {
  id: string; name: string; core_idea: string; key_screens: string[]; good_at: string;
  gives_up: string; effort: string; risk: string; serves: string[];
};
export type IdeateOutput = PhaseOutput & {
  product_structure: StructureNode[];
  user_flows: { name: string; type: string; steps: string[] }[];
  journeys: {
    today: { stage?: string; step: string; thought?: string; feeling: string; score?: number; pain: string; opportunity?: string }[];
    future: { stage?: string; step: string; thought?: string; feeling: string; score?: number; improves?: string }[];
  };
  storyboard: { frame: number; scene: string }[];
  directions: Direction[];
  recommendation: { direction: string; why: string };
};

// recipes/4-wireframes.md. The html is built screen by screen and joined, so it is not part of the first AI answer.
export type Screen = {
  id: string;
  name: string;
  purpose: string;
  meets: string[];
  states: string[];
  group?: string; // menu group, for example "Employee", "Manager" or "Edge cases and states"
};
export type WireframeOutput = PhaseOutput & {
  screens: Screen[];
  user_coverage: { user: string; screens: string[] }[]; // which screens each user profile gets
  wording: { screen: string; text: string; where: string }[];
  accessibility_notes: string[];
  html: string;
  warnings: string[]; // things the app found when checking the buttons
};

// recipes/5-visual-design.md. Like the wireframe, the html is built screen by screen and joined.
export type DesignOutput = PhaseOutput & {
  design_checks: { contrast: string; tap_sizes: string; manipulative_design: string; style_match: string; off_style_items: string[] };
  computed_checks: string[]; // contrast numbers the app worked out itself from the design style colours
  cover_note: { what_was_built: string; what_was_guessed: string[]; not_tested_yet: string[] };
  screens: Screen[];
  html: string;
  warnings: string[];
  style_given: boolean;
  css?: string; // used while building, not kept
};

// recipes/6-testing.md
export type Severity = "High" | "Medium" | "Low";
export type TestingOutput = PhaseOutput & {
  test_plan: { goals: string[]; tasks: { task: string; success: string; tests: string[] }[] };
  script: string[];
  expert_check: { issue: string; where: string; severity: Severity }[];
  cannot_check_automatically: string[];
  not_tested: string[];
  results_analysis?: {
    task_results: { task: string; succeeded: string; stuck_at: string }[];
    issues: { issue: string; how_many: string; severity: Severity; fix: string }[]; // most important first
    recommendation: string;
  };
  guess_updates?: { id: string; guess: string; status: "Confirmed" | "Wrong" | "Open"; evidence: string }[];
};

export type AnyOutput = UnderstandOutput | ResearchOutput | IdeateOutput | WireframeOutput | DesignOutput | TestingOutput;

// Set while fixes from testing are being made in an earlier phase
export type FixLoop = { target: "wireframes" | "design"; issues: string[]; needsDesign?: boolean };

// The team's look: colours, fonts, corners, and optional brand guide files
export type DesignStyle = {
  colours?: { primary: string; background: string; text: string; accent?: string };
  headingFont: string;
  bodyFont: string;
  otherFont?: string;
  corners: "sharp" | "slight" | "round";
  notes?: string;
  files: { name: string; savedAs: string; kind: string; text: string; note: string }[];
};

// A Figma file read through Figma's official API (read only). Only a summary is kept, never the token.
export type FigmaRole = "design-system" | "current-screens" | "inspiration" | "reference";
export type FigmaSummary = {
  colours: { hex: string; name?: string; uses: number }[];
  colourCount: number;
  namedColourCount: number;
  textStyles: { name?: string; fontFamily: string; fontSize: number; fontWeight: number; lineHeight?: number }[];
  textStyleCount: number;
  textStylesNamed: boolean; // true when the file saves them as named text styles
  components: { name: string; description?: string }[];
  componentCount: number;
};
export type FigmaFile = {
  id: string;
  url: string;
  fileKey: string;
  name: string;
  lastModified?: string;
  addedAt: string;
  role?: FigmaRole; // answer to "What is this?"
  summary: FigmaSummary;
  demo?: boolean;
};

export type Project = {
  id: string;
  madeInDemo?: boolean; // true if any part was made in demo mode
  titleEdited?: boolean; // true once the designer renamed the project (then nobody else renames it)
  title: string;
  requirement: string;
  createdAt: string;
  files: ProjectFile[];
  answers: Record<string, string>;
  phases: Record<string, PhaseStatus>;
  versions: PhaseVersion[];
  thingsIGuessed: Guess[];
  quickQuestions?: QuickQuestions;
  testNotes?: { name: string; savedAs: string; text: string; note: string; uploadedAt: string; round: number }[];
  testRound?: number; // 1, then 2 after fixes are sent back
  fixLoop?: FixLoop;
  figmaFiles?: FigmaFile[];
  designStyle?: DesignStyle;
  finalDesignVersionId?: string; // the Phase 5 version marked final at Go ahead
  interviewNotes?: { name: string; savedAs: string; text: string; note: string; uploadedAt: string }[];
};

export const PHASE_NAMES = [
  "Understand",
  "Research",
  "Ideate",
  "Wireframes",
  "Visual design",
  "Testing",
];

// Saves in one safe step: write a temporary file, then swap it in, so a reader never sees half a file
export async function saveProject(project: Project) {
  await fs.mkdir(PROJECTS_DIR, { recursive: true });
  const file = path.join(PROJECTS_DIR, `${project.id}.json`);
  const temp = `${file}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
  await fs.writeFile(temp, JSON.stringify(project, null, 2), "utf8");
  await fs.rename(temp, file);
}

// Changes to the same project happen one after the other, so two saves never overwrite each other
const g = globalThis as unknown as { __projectLocks?: Map<string, Promise<unknown>> };
const locks = (g.__projectLocks ??= new Map());
export function withProjectLock<T>(id: string, fn: () => Promise<T>): Promise<T> {
  const run = (locks.get(id) ?? Promise.resolve()).then(fn, fn);
  locks.set(id, run.catch(() => undefined));
  return run;
}

export async function listProjects(): Promise<Project[]> {
  await fs.mkdir(PROJECTS_DIR, { recursive: true });
  const names = (await fs.readdir(PROJECTS_DIR)).filter((n) => n.endsWith(".json"));
  const projects: Project[] = [];
  for (const n of names) {
    try {
      projects.push(JSON.parse(await fs.readFile(path.join(PROJECTS_DIR, n), "utf8")));
    } catch {
      // skip a file that cannot be read
    }
  }
  return projects.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function loadProject(id: string): Promise<Project | null> {
  if (!/^[\w-]+$/.test(id)) return null;
  try {
    return JSON.parse(await fs.readFile(path.join(PROJECTS_DIR, `${id}.json`), "utf8"));
  } catch {
    return null;
  }
}
