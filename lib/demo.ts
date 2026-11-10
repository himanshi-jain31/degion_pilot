/* eslint-disable @typescript-eslint/no-explicit-any */
// ALL sample results live in this one file. Nothing else in the app contains sample content.
// Sample mode is only used when DEMO_MODE=on in .env.local AND no Anthropic key is set (see isDemo in lib/ai.ts).
// The app shows one small "Demo mode" badge in the top bar. The sample content itself reads like a real result.
import { esc } from "@/lib/wireframes";
import type { FigmaFile, Screen } from "@/lib/storage";


export const DEMO_SCREENS: Screen[] = [
  { id: "home", name: "Home", purpose: "See your requests and start a new one", meets: ["R1"], states: ["normal"] },
  { id: "new-request", name: "New request", purpose: "Pick dates and send a request", meets: ["R1"], states: ["normal", "error"] },
  { id: "request-list", name: "My requests", purpose: "See every request and its answer", meets: ["R1", "R2"], states: ["normal"] },
  { id: "manager-inbox", name: "Manager inbox", purpose: "A manager sees requests waiting for an answer", meets: ["R2"], states: ["normal"] },
  { id: "answer-request", name: "Answer a request", purpose: "A manager says yes or no", meets: ["R2"], states: ["normal"] },
  { id: "empty-list", name: "No requests yet", purpose: "Shown when there are no requests", meets: ["R1"], states: ["empty"] },
  { id: "error", name: "Something went wrong", purpose: "Shown when sending fails", meets: ["R1"], states: ["error"] },
  { id: "no-access", name: "No permission", purpose: "Shown when someone may not open a page", meets: ["R2"], states: ["no permission"] },
];

// A fixed sample screen. It is only used in demo mode.
export function demoFragment(s: Screen): string {
  const go = (id: string, text: string, primary = false) => `<button class="btn${primary ? " primary" : ""}" data-go="${id}">${text}</button>`;
  const head = `<div class="bar">${esc(s.name)}</div><p class="title">${esc(s.name)}</p>`;
  switch (s.id) {
    case "home":
      return `${head}<div class="card" data-go="request-list"><p class="sub">Days left</p><p>12 days</p></div><div class="row">${go("new-request", "New request", true)}${go("request-list", "My requests")}${go("manager-inbox", "I am a manager")}${go("empty-list", "See empty state")}${go("error", "See error state")}${go("no-access", "See no-permission state")}</div>`;
    case "new-request":
      return `${head}<form data-go="request-list"><label class="label">From</label><input class="input" value="12 Dec"><label class="label">To</label><input class="input" value="14 Dec"><button class="btn primary">Send request</button></form><div class="row">${go("error", "See what happens if sending fails")}${go("home", "Cancel")}</div>`;
    case "request-list":
      return `${head}<div class="list"><div class="item" data-go="home">12–14 Dec · <span class="badge">Waiting</span></div><div class="item" data-go="home">3 Nov · <span class="badge">Approved</span></div></div>${go("home", "Back to Home")}`;
    case "manager-inbox":
      return `${head}<div class="list"><div class="item" data-go="answer-request">Anna · 12–14 Dec · <span class="badge">Waiting</span></div><div class="item" data-go="answer-request">Ben · 20 Dec · <span class="badge">Waiting</span></div></div>${go("home", "Back to Home")}`;
    case "answer-request":
      return `${head}<div class="box">Anna asks for 12–14 Dec (2 days). She has 12 days left.</div><div class="row">${go("manager-inbox", "Say yes", true)}${go("manager-inbox", "Say no")}</div>`;
    case "error":
      return `${head}<div class="banner error">We could not send your request. Nothing was lost.</div>${go("new-request", "Try again", true)} ${go("home", "Back to Home")}`;
    default:
      return `${head}<div class="empty">nothing to show here yet.</div>${go("home", "Back to Home", true)}`;
  }
}

export const DEMO_CSS = `:root{--primary:#2f5bd8;--background:#ffffff;--text:#1d2433;--accent:#2f5bd8;--radius:8px}
.bar{padding:14px;background:var(--primary);color:var(--background);border-radius:var(--radius);font-weight:700;margin-bottom:12px}
.title{font:700 24px var(--font-heading,system-ui);margin:8px 0}.sub{font:600 17px var(--font-heading,system-ui);margin:8px 0}.muted{opacity:.7;font-size:14px}
.box,.card,.item,.empty{border:1px solid rgba(0,0,0,.15);border-radius:var(--radius);padding:14px;margin:8px 0;background:#fff}
.row{display:flex;gap:12px;flex-wrap:wrap;align-items:center}.row>*{flex:1 1 200px}.col{display:flex;flex-direction:column;gap:8px}
.btn{padding:10px 18px;border:1px solid var(--primary);border-radius:var(--radius);background:var(--background);color:var(--primary);cursor:pointer}
.btn.primary{background:var(--primary);color:var(--background)}.input{display:block;width:100%;padding:10px;border:1px solid #999;border-radius:var(--radius);margin:4px 0 10px}
.label{display:block;font-weight:600;font-size:14px}.list{display:flex;flex-direction:column}.badge{display:inline-block;padding:2px 10px;border-radius:99px;background:var(--accent);color:var(--background);font-size:12px}
.banner{padding:12px;border-radius:var(--radius);background:#eef2ff;margin:8px 0}.banner.error{background:#fde8e8;border:2px solid #b42318}.empty{text-align:center;opacity:.8;padding:28px}
.tabs{display:flex;gap:6px}.tab{padding:8px 14px;border-radius:var(--radius);background:#eef2ff}.img{min-height:90px;background:#e8ecf8;border-radius:var(--radius)}a{color:var(--primary)}`;

export function demoUnderstand(feedback?: string) {
  const T = "Test idea only";
  return {
    plan: {
      will_do: ["write a short brief", "list the people who will use it", "write a few requirements"],
      will_skip: [{ item: "Research", why: "That is the next step, not this one." }],
    },
    brief: { one_line: "Staff can ask for time off and managers can answer.", full: "Staff find it hard to ask for time off and to see how many days they have left. Managers miss requests that are waiting for an answer. A simpler flow should let staff ask in a few taps and let managers answer from one list." },
    another_view: "Maybe the real problem is that managers cannot see who is away.",
    users: [
      { name: "Staff", note: "ask for time off.", label: T },
      { name: "Managers", note: "say yes or no.", label: T },
      { name: "Admin (nobody mentioned)", note: "fixes mistakes and sets the rules.", label: T },
    ],
    user_profiles: [
      { name: "Anna, staff member", goal: "Get time off with little fuss.", situation: "Usually on her phone.", frustrations: ["Slow email replies", "Not sure of her days left"], label: T },
      { name: "Ben, manager", goal: "Answer quickly and avoid gaps.", situation: "Between meetings.", frustrations: ["Cannot see who is away"], label: T },
    ],
    requirements: [
      { id: "R1", story: "As staff, I can ask for time off, so that my manager can answer.", done_checks: ["I can pick dates", "I see my request afterwards"], label: T },
      { id: "R2", story: "As a manager, I can say yes or no, so that staff know quickly.", done_checks: ["I see all waiting requests"], label: T },
    ],
    edge_cases: ["no days left", "dates that overlap", "very long reason text"],
    not_asked_about: [{ topic: "Accessibility", why_it_matters: "everyone must be able to use it, including with screen readers." }],
    success_measures: ["fewer emails about time off"],
    open_questions: ["who approves when the manager is away?"],
    things_i_guessed: [{ guess: "most people use phones.", risk_if_wrong: "The layout may suit the wrong device.", how_to_check: "Ask five users." }],
    what_i_did: ["Read the request and the quick-question answers", feedback ? "Applied your feedback to this step" : "Wrote the brief, users, profiles and requirements"],
    checkin: {
      what_i_made: "A brief, 3 kinds of users, 2 user profiles and 2 requirements.",
      not_sure_about: ["who approves when the manager is away?", "which device people use most"],
      another_view: "maybe the real problem is seeing who is away.",
    },
    what_changed: feedback ? [`Updated using your feedback: "${feedback.slice(0, 120)}"`] : undefined,
  };
}

export function demoResearch(feedback?: string) {
  const T = "Test idea only";
  return {
    plan: { will_do: ["look at similar apps", "check accessibility rules"], will_skip: [{ item: "Numbers from data", why: "No data was uploaded." }] },
    findings: [
      { type: "competitors", finding: "other leave apps show days left on the first screen.", source_title: "Example source page", source_url: "https://example.com/demo-1", label: T, confidence: "Low" },
      { type: "accessibility", finding: "form fields need clear labels.", source_title: "Example source page", source_url: "https://example.com/demo-2", label: T, confidence: "Low" },
      { type: "what people say", finding: "people dislike slow replies.", source_title: "Example source page", source_url: "https://example.com/demo-3", label: T, confidence: "Low" },
    ],
    key_insights: [{ insight: "show days left up front.", based_on: ["1"] }, { insight: "keep forms simple and labelled.", based_on: ["2", "3"] }],
    updated_user_profiles: [{ name: "Anna, staff member", goal: "Get time off with little fuss.", situation: "Mostly on her phone.", frustrations: ["Slow replies"], label: T }],
    research_kit: {
      goals: ["learn how people ask for leave today"],
      interview_questions: ["Tell me about the last time you asked for time off.", "What was hardest about it?"],
      survey_questions: ["How often do you ask for leave?"],
      who_to_recruit: "5 staff and 2 managers.",
    },
    could_not_find: ["Real usage numbers for leave requests"],
    things_i_guessed: [{ guess: "staff prefer phones.", risk_if_wrong: "Wrong device focus.", how_to_check: "Interview 5 people." }],
    what_i_did: ["Looked at similar leave apps and accessibility advice", feedback ? "Applied your feedback and notes to the research" : "Grouped what I found into insights"],
    checkin: {
      what_i_made: "3 findings, 2 insights and a small kit for talking to real users.",
      not_sure_about: ["The sources are few. More research would make the findings stronger."],
      another_view: "maybe the managers matter more than staff.",
    },
    what_changed: feedback ? [`Updated using your feedback: "${feedback.slice(0, 120)}"`] : undefined,
  };
}

export function demoIdeate(feedback?: string) {
  const dir = (id: string, name: string, idea: string, gives: string, effort: string) => ({
    id, name, core_idea: idea, key_screens: ["Home", "New request", "Request list"], good_at: `${name} is quick to learn.`,
    gives_up: gives, effort, risk: "people may expect more.", serves: ["R1", "R2"],
  });
  return {
    plan: { will_do: ["product structure", "flows", "3 directions"], will_skip: [{ item: "Storyboard detail", why: "Not needed for a first pass." }] },
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
    storyboard: [{ frame: 1, scene: "Anna wants a day off." }, { frame: 2, scene: "She sends a request on her phone." }, { frame: 3, scene: "Ben answers between meetings." }],
    directions: [
      dir("A", "Simple form", "One short form and a list.", "Gives up a calendar view.", "Low"),
      dir("B", "Team calendar", "Everything lives on a shared calendar.", "Gives up speed on small phones.", "Medium"),
      dir("C", "Chat helper (flip the constraint)", "Ask for leave by chatting.", "Gives up a clear overview.", "High"),
    ],
    recommendation: { direction: "A", why: "it is the quickest way to the main goal." },
    things_i_guessed: [{ guess: "managers answer on phones too.", risk_if_wrong: "Wrong layout.", how_to_check: "Ask 3 managers." }],
    what_i_did: ["Drew the product structure and the main flows", feedback ? "Applied your feedback to the directions" : "Shaped 3 different directions"],
    checkin: {
      what_i_made: "A product structure, 2 flows and 3 directions (A, B, C).",
      not_sure_about: ["which direction fits best"],
      another_view: "maybe a calendar-first idea fits better.",
    },
    what_changed: feedback ? [`Updated using your feedback: "${feedback.slice(0, 120)}"`] : undefined,
  };
}

export function demoWireframes(feedback?: string) {
  return {
    plan: { will_do: ["list the screens", "draw each one in grey and join them"], will_skip: [{ item: "Loading screens", why: "Not needed for a first pass." }] },
    screens: DEMO_SCREENS,
    user_coverage: [
      { user: "Anna, staff member", screens: ["home", "new-request", "request-list", "empty-list", "error"] },
      { user: "Ben, manager", screens: ["manager-inbox", "answer-request", "no-access"] },
    ],
    wording: [{ screen: "home", text: "New request", where: "button" }],
    accessibility_notes: ["every button has a clear label", "contrast between text and background is high"],
    things_i_guessed: [{ guess: "people start from Home.", risk_if_wrong: "The first screen may be wrong.", how_to_check: "Watch 3 people use it." }],
    what_i_did: ["Listed the screens for staff and for managers", feedback ? "Applied your feedback to the screens" : "Drew each screen in grey and joined them"],
    checkin: {
      what_i_made: "A clickable wireframe with 8 screens, including the manager flow and the empty, error and no-permission screens.",
      not_sure_about: ["the order of the screens"],
      another_view: "maybe the list should be the first screen.",
    },
    what_changed: feedback ? [`Updated using your feedback: "${feedback.slice(0, 120)}"`] : undefined,
  };
}

export function demoDesign(feedback?: string) {
  return {
    plan: { will_do: ["apply the design style to every screen", "check contrast and button sizes"], will_skip: [{ item: "Animations", why: "Not needed for a first prototype." }] },
    css: DEMO_CSS,
    design_checks: {
      contrast: "text and buttons use strong contrast.",
      tap_sizes: "buttons are at least 44px tall.",
      manipulative_design: "no hidden costs or pushy wording found.",
      style_match: "Matches your design style: about 90% (my own estimate)",
      off_style_items: ["a light blue tint used for banners was added"],
    },
    cover_note: {
      what_was_built: "A clickable prototype with the same 8 screens as the wireframe, for staff and for managers.",
      what_was_guessed: ["The names, dates and day counts shown are sample content"],
      not_tested_yet: ["not tested with real people", "not tested with a screen reader"],
    },
    things_i_guessed: [{ guess: "the main colour suits the brand.", risk_if_wrong: "The look may feel off.", how_to_check: "Show it to the brand owner." }],
    what_i_did: ["Applied the design style to every screen", feedback ? "Applied your feedback to the look" : "Checked contrast and button sizes"],
    checkin: {
      what_i_made: "A styled, working prototype with 8 screens.",
      not_sure_about: ["how well it matches your brand"],
      another_view: "maybe a calmer colour would feel safer.",
    },
    what_changed: feedback ? [`Updated using your feedback: "${feedback.slice(0, 120)}"`] : undefined,
  };
}

export function demoTestingPrepare(feedback?: string) {
  return {
    plan: { will_do: ["write a test plan and script", "review the prototype"], will_skip: [{ item: "Automatic accessibility scan", why: "Not available here." }] },
    test_plan: {
      goals: ["see if people can ask for time off without help"],
      tasks: [
        { task: "Ask for 2 days off next month", success: "Sends the request in under 2 minutes", tests: ["R1"] },
        { task: "Find the answer to your last request", success: "Finds it in 2 taps", tests: ["R2"] },
      ],
    },
    script: ["Welcome: thank you for helping. We test the design, not you.", "Task 1: Ask for 2 days off next month.", "Task 2: Find the answer to your last request.", "Follow-up: What was easiest? What was confusing?"],
    expert_check: [
      { issue: "the date fields are small on phones", where: "New request", severity: "Medium" },
      { issue: "error message does not say what to do next", where: "Something went wrong", severity: "High" },
    ],
    cannot_check_automatically: ["whether the words make sense to real people", "how it feels with a screen reader"],
    not_tested: ["R3 (not covered by any task)"],
    things_i_guessed: [{ guess: "5 people are enough for a first round.", risk_if_wrong: "Missed problems.", how_to_check: "Run a second round." }],
    what_i_did: ["Wrote a test plan and script", feedback ? "Applied your feedback to the plan" : "Reviewed the prototype for problems"],
    checkin: { what_i_made: "a test plan with 2 tasks, a script and an expert check.", not_sure_about: ["the right number of testers"], another_view: "maybe test the manager side first." },
  };
}

export function demoTestingAnalyse(notes: string, guesses: { id: string; text: string }[]) {
  const lines = notes.split(/\n+/).map((l) => l.trim()).filter((l) => l.length > 8 && !l.startsWith("---")).slice(0, 4);
  const sev = ["High", "Medium", "Medium", "Low"];
  const statuses = ["Confirmed", "Wrong", "Open"] as const;
  return {
    plan: { will_do: ["read the notes", "rank the problems"], will_skip: [] },
    results_analysis: {
      task_results: [{ task: "task 1", succeeded: "see your notes", stuck_at: "see your notes" }],
      issues: lines.map((l, i) => ({ issue: `${l}`, how_many: "as written in your notes", severity: sev[i], fix: "make this easier to find" })),
      recommendation: "fix in wireframes",
    },
    things_i_guessed: guesses.map((g, i) => ({ id: g.id, guess: g.text, status: statuses[i % 3], evidence: statuses[i % 3] === "Open" ? "" : `"${lines[0] ?? "your notes"}"` })),
    what_i_did: ["Read your test notes and ranked the problems"],
    checkin: { what_i_made: `${lines.length} issues, most important first.`, not_sure_about: ["small number of testers"], another_view: "maybe some problems are one person's habit." },
  };
}

// A redo says it used your feedback (so the whole "Not yet" loop can be tried)
function reacts(make: (feedback?: string) => any) {
  return (feedback?: string) => {
    const out = make(feedback);
    if (feedback) out.checkin.what_i_made += "\nThis version is updated using your feedback.";
    return out;
  };
}

export const demos: Record<number, (feedback?: string) => unknown> = {
  1: reacts(demoUnderstand),
  2: reacts(demoResearch),
  3: reacts(demoIdeate),
  4: reacts(demoWireframes),
  5: reacts(demoDesign),
};

export function demoFigma(url: string, fileKey: string): Omit<FigmaFile, "id" | "addedAt"> {
  return {
      url, fileKey, name: "Example design system", lastModified: new Date().toISOString(),
      summary: {
        colours: [
          { hex: "#0b6b3a", name: "Brand/Green", uses: 40 }, { hex: "#ffffff", name: "Neutral/White", uses: 90 },
          { hex: "#1a1a1a", name: "Neutral/Ink", uses: 70 }, { hex: "#e0702b", name: "Accent/Orange", uses: 12 }, { hex: "#f4f4f2", uses: 8 },
        ],
        colourCount: 5, namedColourCount: 4,
        textStyles: [
          { name: "Heading/Large", fontFamily: "Georgia", fontSize: 32, fontWeight: 700, lineHeight: 40 },
          { name: "Body/Regular", fontFamily: "Inter", fontSize: 16, fontWeight: 400, lineHeight: 24 },
        ],
        textStyleCount: 2, textStylesNamed: true,
        components: [{ name: "Button/Primary" }, { name: "Input/Text" }, { name: "Card" }],
        componentCount: 3,
      },
    };
}
