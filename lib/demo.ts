/* eslint-disable @typescript-eslint/no-explicit-any */
// ALL sample results live in this one file. Nothing else in the app contains sample content.
// Sample mode is only used when DEMO_MODE=on in .env.local AND no Anthropic key is set (see isDemo in lib/ai.ts).
// The app shows one small "Demo mode" badge in the top bar. The sample content itself reads like a real result.
import { esc } from "@/lib/wireframes";
import type { FigmaFile, Screen } from "@/lib/storage";


const EMP = "Employee";
const MGR = "Manager";
const EDGE = "Edge cases and states";

// A sample leave tracker for two kinds of users. The three groups appear as headings in the prototype menu.
export const DEMO_SCREENS: Screen[] = [
  { id: "home", name: "Home", purpose: "Employee: days left by type and the next step", meets: ["R1"], states: ["normal"], group: EMP },
  { id: "request-leave", name: "Request leave", purpose: "Employee: choose a type, pick dates, send", meets: ["R1"], states: ["normal"], group: EMP },
  { id: "sent", name: "Request sent", purpose: "Employee: confirmation after sending", meets: ["R1"], states: ["normal"], group: EMP },
  { id: "my-requests", name: "My requests", purpose: "Employee: every request and its status", meets: ["R1"], states: ["normal"], group: EMP },
  { id: "detail-waiting", name: "Request details (waiting)", purpose: "Employee: one request that is waiting, with cancel", meets: ["R1"], states: ["normal"], group: EMP },
  { id: "detail-approved", name: "Request details (approved)", purpose: "Employee: one approved request", meets: ["R1"], states: ["normal"], group: EMP },
  { id: "detail-declined", name: "Request details (declined)", purpose: "Employee: one declined request with the reason", meets: ["R1"], states: ["normal"], group: EMP },
  { id: "cancel-confirm", name: "Cancel this request?", purpose: "Employee: confirm before cancelling", meets: ["R1"], states: ["normal"], group: EMP },
  { id: "cancelled", name: "Request cancelled", purpose: "Employee: confirmation after cancelling", meets: ["R1"], states: ["normal"], group: EMP },
  { id: "manager-waiting", name: "Requests waiting", purpose: "Manager: requests that need an answer", meets: ["R2"], states: ["normal"], group: MGR },
  { id: "review-anna", name: "Review: Anna", purpose: "Manager: approve or decline Anna's request", meets: ["R2"], states: ["normal"], group: MGR },
  { id: "review-ben", name: "Review: Ben", purpose: "Manager: approve or decline Ben's request", meets: ["R2"], states: ["normal"], group: MGR },
  { id: "approved-done", name: "Request approved", purpose: "Manager: confirmation after approving", meets: ["R2"], states: ["normal"], group: MGR },
  { id: "declined-done", name: "Request declined", purpose: "Manager: confirmation after declining", meets: ["R2"], states: ["normal"], group: MGR },
  { id: "team-calendar", name: "Team calendar", purpose: "Manager: who is away and when", meets: ["R2"], states: ["normal"], group: MGR },
  { id: "no-days-left", name: "No days left", purpose: "The form when a leave type has no days left", meets: ["R1"], states: ["error"], group: EDGE },
  { id: "overlap", name: "Dates overlap", purpose: "The form when dates overlap another request", meets: ["R1"], states: ["error"], group: EDGE },
  { id: "sent-backup", name: "Request sent (manager on leave)", purpose: "Confirmation when the manager is away", meets: ["R1", "R2"], states: ["normal"], group: EDGE },
  { id: "empty-requests", name: "My requests (none yet)", purpose: "Employee list with no requests", meets: ["R1"], states: ["empty"], group: EDGE },
  { id: "manager-empty", name: "Requests waiting (none)", purpose: "Manager list with nothing waiting", meets: ["R2"], states: ["empty"], group: EDGE },
  { id: "send-error", name: "Could not send", purpose: "Sending failed", meets: ["R1"], states: ["error"], group: EDGE },
  { id: "no-permission", name: "No permission", purpose: "An employee opens a manager page", meets: ["R2"], states: ["no permission"], group: EDGE },
];

// ---- small building blocks for the sample screens ----
const btn = (go: string, text: string, kind = "") => `<button type="button" class="btn${kind ? " " + kind : ""}" data-go="${go}">${text}</button>`;
const status = (k: "waiting" | "approved" | "declined") => `<span class="status ${k}">${k === "waiting" ? "● Waiting" : k === "approved" ? "✓ Approved" : "✕ Declined"}</span>`;
const empNav = (cur: string) =>
  `<nav class="appnav" aria-label="Main"><span class="brand">Leave</span>${[["home", "Home"], ["request-leave", "Request leave"], ["my-requests", "My requests"]]
    .map(([id, t]) => `<button type="button" class="navitem" data-go="${id}"${id === cur ? ' aria-current="page"' : ""}>${t}</button>`).join("")}</nav>`;
const mgrNav = (cur: string) =>
  `<nav class="appnav" aria-label="Main"><span class="brand">Leave</span>${[["manager-waiting", "Waiting"], ["team-calendar", "Team calendar"]]
    .map(([id, t]) => `<button type="button" class="navitem" data-go="${id}"${id === cur ? ' aria-current="page"' : ""}>${t}</button>`).join("")}</nav>`;
const item = (go: string, left: string, right: string) => `<div class="item" data-go="${go}" role="link" tabindex="0"><span>${left}</span>${right}</div>`;

// The leave form. Used for the normal form and for the two "problem" versions of it.
function leaveForm(opts: { banner?: string; days?: string; disabled?: boolean; type?: string; from?: string; to?: string }) {
  const sel = (v: string) => (opts.type === v ? " selected" : "");
  return `${empNav("request-leave")}<h1 class="title">Request leave</h1>${opts.banner ?? ""}
<form data-go="sent"><label class="label" for="lt">Leave type</label>
<select class="input" id="lt"><option${sel("Annual leave")}>Annual leave (12 days left)</option><option${sel("Sick leave")}>Sick leave (5 days left)</option><option${sel("Personal leave")}>Personal leave (0 days left)</option></select>
<div class="row"><div><label class="label" for="from">From</label><input class="input" id="from" type="date" value="${opts.from ?? "2026-12-12"}"></div>
<div><label class="label" for="to">To</label><input class="input" id="to" type="date" value="${opts.to ?? "2026-12-14"}"></div></div>
<p class="muted">${opts.days ?? "3 days. Priya will reply within 2 days."}</p>
<label class="label" for="note">Note for Priya (optional)</label><textarea class="input" id="note" rows="3"></textarea>
<button class="btn primary"${opts.disabled ? " disabled" : ""}>Send request</button></form>`;
}

// A fixed sample screen. It is only used in demo mode. Product screens never contain buttons to the edge-case screens.
export function demoFragment(s: Screen): string {
  switch (s.id) {
    case "home":
      return `${empNav("home")}<h1 class="title">Hi Anna</h1><p class="sub">Days left</p>
<div class="row"><div class="card"><p class="muted">Annual leave</p><p class="big">12 days</p></div><div class="card"><p class="muted">Sick leave</p><p class="big">5 days</p></div><div class="card"><p class="muted">Personal leave</p><p class="big">0 days</p></div></div>
<p class="sub">Next request</p>${item("detail-waiting", "12–14 Dec · Annual leave", status("waiting"))}
${btn("request-leave", "Request leave", "primary")}`;
    case "request-leave":
      return leaveForm({});
    case "sent":
      return `${empNav("request-leave")}<h1 class="title">Request sent</h1><div class="banner">Request sent. Priya will reply within 2 days.</div>
<p class="muted">12–14 Dec · Annual leave · 3 days</p><div class="row">${btn("my-requests", "View my requests", "primary")}${btn("home", "Back to Home")}</div>`;
    case "my-requests":
      return `${empNav("my-requests")}<h1 class="title">My requests</h1><div class="list">
${item("detail-waiting", "12–14 Dec · Annual leave", status("waiting"))}${item("detail-approved", "3 Nov · Sick leave", status("approved"))}${item("detail-declined", "20 Oct · Personal leave", status("declined"))}</div>`;
    case "detail-waiting":
      return `${empNav("my-requests")}<h1 class="title">Annual leave</h1><p>${status("waiting")}</p>
<div class="box"><p><strong>Dates:</strong> 12–14 Dec (3 days)</p><p><strong>Sent to:</strong> Priya Shah</p><p><strong>Sent on:</strong> 5 Dec</p></div>
<div class="row">${btn("cancel-confirm", "Cancel request")}${btn("my-requests", "Back to my requests")}</div>`;
    case "detail-approved":
      return `${empNav("my-requests")}<h1 class="title">Sick leave</h1><p>${status("approved")}</p>
<div class="box"><p><strong>Dates:</strong> 3 Nov (1 day)</p><p><strong>Answered by:</strong> Priya Shah</p><p><strong>Note:</strong> Get well soon.</p></div>${btn("my-requests", "Back to my requests")}`;
    case "detail-declined":
      return `${empNav("my-requests")}<h1 class="title">Personal leave</h1><p>${status("declined")}</p>
<div class="box"><p><strong>Dates:</strong> 20 Oct (1 day)</p><p><strong>Answered by:</strong> Priya Shah</p><p><strong>Note:</strong> The team has a deadline that day. Could you move it to the 22nd?</p></div>
<div class="row">${btn("request-leave", "Ask for new dates", "primary")}${btn("my-requests", "Back to my requests")}</div>`;
    case "cancel-confirm":
      return `${empNav("my-requests")}<h1 class="title">Cancel this request?</h1><div class="box">Annual leave, 12–14 Dec. Priya will be told you cancelled it.</div>
<div class="row">${btn("cancelled", "Yes, cancel request", "primary")}${btn("detail-waiting", "Keep my request")}</div>`;
    case "cancelled":
      return `${empNav("my-requests")}<h1 class="title">Request cancelled</h1><div class="banner">Your request for 12–14 Dec was cancelled. Your 3 days are back in your balance.</div>${btn("my-requests", "Back to my requests", "primary")}`;
    case "manager-waiting":
      return `${mgrNav("manager-waiting")}<h1 class="title">Requests waiting</h1><p class="muted">2 people need an answer.</p><div class="list">
${item("review-anna", "Anna · 12–14 Dec · Annual leave", status("waiting"))}${item("review-ben", "Ben · 20 Dec · Personal leave", status("waiting"))}</div>`;
    case "review-anna":
    case "review-ben": {
      const anna = s.id === "review-anna";
      return `${mgrNav("manager-waiting")}<h1 class="title">${anna ? "Anna" : "Ben"} asks for leave</h1><p>${status("waiting")}</p>
<div class="box"><p><strong>Type:</strong> ${anna ? "Annual leave" : "Personal leave"}</p><p><strong>Dates:</strong> ${anna ? "12–14 Dec (3 days)" : "20 Dec (1 day)"}</p><p><strong>Days left after this:</strong> ${anna ? "9" : "0"}</p></div>
<form data-go="approved-done"><label class="label" for="mnote">Note to ${anna ? "Anna" : "Ben"} (optional)</label><textarea class="input" id="mnote" rows="3"></textarea>
<div class="row"><button class="btn primary">Approve</button>${btn("declined-done", "Decline")}</div></form>${btn("manager-waiting", "Back to requests waiting")}`;
    }
    case "approved-done":
      return `${mgrNav("manager-waiting")}<h1 class="title">Request approved</h1><div class="banner">Approved. Anna has been told and her days are booked.</div>${btn("manager-waiting", "Back to requests waiting", "primary")}`;
    case "declined-done":
      return `${mgrNav("manager-waiting")}<h1 class="title">Request declined</h1><div class="banner">Declined. Your note was sent to the employee.</div>${btn("manager-waiting", "Back to requests waiting", "primary")}`;
    case "team-calendar":
      return `${mgrNav("team-calendar")}<h1 class="title">Team calendar</h1><p class="muted">December</p>
<table class="cal"><thead><tr><th>Person</th><th>8–12 Dec</th><th>15–19 Dec</th><th>22–26 Dec</th></tr></thead><tbody>
<tr><th>Anna</th><td data-go="review-anna" role="link" tabindex="0">${status("waiting")} 12–14</td><td></td><td></td></tr>
<tr><th>Ben</th><td></td><td></td><td data-go="review-ben" role="link" tabindex="0">${status("waiting")} 20</td></tr>
<tr><th>Sam</th><td></td><td>${status("approved")} 15–16</td><td></td></tr></tbody></table>`;
    case "no-days-left":
      return leaveForm({ banner: `<div class="banner warn" role="alert">You have no personal leave days left. Choose another leave type, or ask Priya about unpaid leave.</div>`, type: "Personal leave", days: "0 days left for this type.", disabled: true });
    case "overlap":
      return leaveForm({ banner: `<div class="banner warn" role="alert">These dates overlap your request for 12–14 Dec. Pick other dates, or cancel that request first.</div>`, from: "2026-12-13", to: "2026-12-15", days: "3 days. Overlaps another request." });
    case "sent-backup":
      return `${empNav("request-leave")}<h1 class="title">Request sent</h1><div class="banner">Request sent. Priya is on leave, so Marcus Lee will reply within 2 days.</div>
<p class="muted">Marcus is the backup approver while Priya is away.</p><div class="row">${btn("my-requests", "View my requests", "primary")}${btn("home", "Back to Home")}</div>`;
    case "empty-requests":
      return `${empNav("my-requests")}<h1 class="title">My requests</h1><div class="empty"><p class="sub">No requests yet</p><p>When you ask for leave, your requests and their answers will show here.</p>${btn("request-leave", "Request leave", "primary")}</div>`;
    case "manager-empty":
      return `${mgrNav("manager-waiting")}<h1 class="title">Requests waiting</h1><div class="empty"><p class="sub">You are all caught up</p><p>Nobody is waiting for an answer.</p>${btn("team-calendar", "See the team calendar", "primary")}</div>`;
    case "send-error":
      return `${empNav("request-leave")}<h1 class="title">Could not send</h1><div class="banner error" role="alert">We could not send your request. Nothing was lost. Check your connection and try again.</div><div class="row">${btn("sent", "Try again", "primary")}${btn("home", "Back to Home")}</div>`;
    case "no-permission":
      return `${empNav("home")}<h1 class="title">You can't open this page</h1><div class="banner error" role="alert">Only managers can answer requests. If you need access, ask your manager.</div>${btn("home", "Back to Home", "primary")}`;
    default:
      return `<h1 class="title">${esc(s.name)}</h1>${btn("home", "Back to Home", "primary")}`;
  }
}

// The sample look: plain white, one blue accent, status colours that always come with a word
export const DEMO_CSS = `:root{--primary:#2f5bd8;--background:#ffffff;--text:#1d2433;--accent:#2f5bd8;--radius:8px;--nav-bg:#f7f8fb}
body{font-size:16px}.title{font:700 26px var(--font-heading,system-ui);margin:4px 0 12px}.sub{font:600 17px var(--font-heading,system-ui);margin:16px 0 8px}.muted{color:#4b5563;font-size:14px}
.box,.card,.item,.empty{border:1px solid #d7dbe5;border-radius:var(--radius);padding:14px;margin:8px 0;background:#fff}
.item{display:flex;justify-content:space-between;align-items:center;gap:12px;cursor:pointer}.item:hover,.item:focus-visible{background:#f2f5ff}
.row{display:flex;gap:12px;flex-wrap:wrap;align-items:flex-start}.row>*{flex:1 1 180px}.col{display:flex;flex-direction:column;gap:8px}
.btn{padding:10px 18px;border:1px solid var(--primary);border-radius:var(--radius);background:#fff;color:var(--primary);cursor:pointer;font-weight:600}
.btn.primary{background:var(--primary);color:#fff}.btn:disabled{opacity:.5;cursor:not-allowed}
.input{display:block;width:100%;padding:10px;border:1px solid #6b7280;border-radius:var(--radius);margin:4px 0 12px;background:#fff;color:var(--text)}
.label{display:block;font-weight:600;font-size:14px}.list{display:flex;flex-direction:column}.big{font-size:30px;font-weight:700;margin:2px 0}
.status{display:inline-block;white-space:nowrap;padding:2px 10px;border-radius:99px;font-size:13px;font-weight:700}
.status.waiting{background:#fff1cc;color:#6b4200}.status.approved{background:#d9f5e1;color:#10502a}.status.declined{background:#fde3e3;color:#7d1414}
.banner{padding:12px 14px;border-radius:var(--radius);background:#eaf0ff;margin:8px 0}.banner.warn{background:#fff1cc;color:#6b4200}.banner.error{background:#fde3e3;color:#7d1414;border:1px solid #c53030}
.empty{text-align:center;padding:28px}.cal{border-collapse:collapse;width:100%;font-size:14px}.cal th,.cal td{border:1px solid #d7dbe5;padding:8px;text-align:left;vertical-align:top}.cal td[data-go]{cursor:pointer}
.appnav{box-shadow:0 -1px 0 #d7dbe5}.appnav .navitem{color:#374151}.appnav .navitem[aria-current="page"]{color:var(--primary)}a{color:var(--primary)}`;

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
      { name: "Anna, employee", goal: "Get time off with little fuss.", situation: "Usually on her phone.", frustrations: ["Slow email replies", "Not sure of her days left"], label: T },
      { name: "Priya, manager", goal: "Answer quickly and avoid gaps.", situation: "Between meetings.", frustrations: ["Cannot see who is away"], label: T },
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
    updated_user_profiles: [{ name: "Anna, employee", goal: "Get time off with little fuss.", situation: "Mostly on her phone.", frustrations: ["Slow replies"], label: T }],
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
      { user: "Anna, employee", screens: ["home", "request-leave", "sent", "my-requests", "detail-waiting", "cancel-confirm", "no-days-left"] },
      { user: "Priya, manager", screens: ["manager-waiting", "review-anna", "approved-done", "team-calendar"] },
    ],
    wording: [{ screen: "home", text: "New request", where: "button" }],
    accessibility_notes: ["every button has a clear label", "contrast between text and background is high"],
    things_i_guessed: [{ guess: "people start from Home.", risk_if_wrong: "The first screen may be wrong.", how_to_check: "Watch 3 people use it." }],
    what_i_did: ["Listed the screens for employees and for managers", feedback ? "Applied your feedback to the screens" : "Drew each screen in grey and joined them"],
    checkin: {
      what_i_made: "A clickable wireframe with 22 screens: the employee flow, the manager flow, and the empty, error, overlap and no-permission screens.",
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
      what_was_built: "A clickable prototype with the same 22 screens as the wireframe, for employees and for managers.",
      what_was_guessed: ["The names, dates and day counts shown are sample content"],
      not_tested_yet: ["not tested with real people", "not tested with a screen reader"],
    },
    things_i_guessed: [{ guess: "the main colour suits the brand.", risk_if_wrong: "The look may feel off.", how_to_check: "Show it to the brand owner." }],
    what_i_did: ["Applied the design style to every screen", feedback ? "Applied your feedback to the look" : "Checked contrast and button sizes"],
    checkin: {
      what_i_made: "A styled, working prototype with 22 screens.",
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
