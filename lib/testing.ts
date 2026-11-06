import type { TestingOutput } from "@/lib/storage";

export const PREPARE_RULES = `

IMPORTANT FOR THIS RUN: this is Part A only (before testing). Do NOT include results_analysis.
Base the expert check on the prototype html you were given, and say plainly what you could and could not see in it.
In the script, do not write the 10 SUS questions. The app adds the standard ones at the end of the test kit.
Do not claim anything has been tested with real people. Label every expert check item as your own review.`;

export const ANALYSE_RULES = `

IMPORTANT FOR THIS RUN: this is Part B only (after testing). The designer's test notes are the ONLY evidence.
Do not repeat test_plan, script, expert_check, cannot_check_automatically or not_tested. The app keeps them.
Fill results_analysis from the notes: for each task, how many succeeded and where people got stuck; then every issue with how_many (use the numbers in the notes, or say "not stated" if they are not there), severity (High, Medium or Low) and a fix.
Never invent numbers, quotes or participants. If the notes do not say, write "not stated".
For "things_i_guessed", return one entry for EVERY guess id you were given, as {"id": "...", "guess": "...", "status": "Confirmed|Wrong|Open", "evidence": "..."}. "evidence" is a short quote or number from the notes. Use "Confirmed" or "Wrong" only when the notes clearly show it. Otherwise use "Open" with an empty evidence.
In results_analysis.recommendation use exactly one of: "fix in wireframes", "fix in visual design", "no fixes needed".`;

// The standard System Usability Scale statements (Brooke, 1996)
export const SUS = [
  "I think that I would like to use this system frequently.",
  "I found the system unnecessarily complex.",
  "I thought the system was easy to use.",
  "I think that I would need the support of a technical person to be able to use this system.",
  "I found the various functions in this system were well integrated.",
  "I thought there was too much inconsistency in this system.",
  "I would imagine that most people would learn to use this system very quickly.",
  "I found the system very cumbersome to use.",
  "I felt very confident using the system.",
  "I needed to learn a lot of things before I could get going with this system.",
];

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const list = (items: string[], tag = "ul") => (items.length ? `<${tag}>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</${tag}>` : "<p><em>Nothing.</em></p>");

// One printable page with everything needed to run the sessions
export function testKitHtml(title: string, o: TestingOutput): string {
  const tasks = o.test_plan.tasks;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Test kit: ${esc(title)}</title>
<style>body{font-family:system-ui,sans-serif;max-width:800px;margin:24px auto;padding:0 16px;color:#222;line-height:1.5}h1{font-size:26px}h2{margin-top:32px;border-bottom:2px solid #ddd;padding-bottom:4px}
table{border-collapse:collapse;width:100%;margin:8px 0}td,th{border:1px solid #999;padding:8px;text-align:left;vertical-align:top}.sev{font-weight:700}@media print{h2{break-after:avoid}table{break-inside:avoid}}</style></head><body>
<h1>Test kit: ${esc(title)}</h1>
<p>Open this page in your browser and print it, or save it as a PDF.</p>
<h2>1. Test plan</h2><h3>Goals</h3>${list(o.test_plan.goals)}
<h3>Tasks</h3><table><tr><th>#</th><th>Task</th><th>Success looks like</th><th>Tests</th></tr>${tasks.map((t, i) => `<tr><td>${i + 1}</td><td>${esc(t.task)}</td><td>${esc(t.success)}</td><td>${esc(t.tests.join(", "))}</td></tr>`).join("")}</table>
<h2>2. Script</h2>${list(o.script, "ol")}
<h2>3. System Usability Scale (ask at the end)</h2><p>Ask each person to rate every statement from 1 (strongly disagree) to 5 (strongly agree).</p>
<table><tr><th>#</th><th>Statement</th><th>1 to 5</th></tr>${SUS.map((q, i) => `<tr><td>${i + 1}</td><td>${q}</td><td></td></tr>`).join("")}</table>
<h2>4. Expert check (my own review, not a test with people)</h2>
<table><tr><th>How serious</th><th>Issue</th><th>Where</th></tr>${o.expert_check.map((e) => `<tr><td class="sev">${e.severity}</td><td>${esc(e.issue)}</td><td>${esc(e.where)}</td></tr>`).join("")}</table>
<h3>What automatic checks cannot catch</h3>${list(o.cannot_check_automatically)}
<h3>What this plan does not test</h3>${list(o.not_tested)}
<h2>5. Notes sheet</h2><p>One row per person and task. Upload your notes (text, Word or Excel) back into DesignPilot when you are done.</p>
<table><tr><th>Person</th><th>Task</th><th>Done? (yes / with help / no)</th><th>Where they got stuck</th><th>What they said</th></tr>${tasks.map((t, i) => `<tr><td>&nbsp;</td><td>${i + 1}. ${esc(t.task)}</td><td></td><td></td><td></td></tr>`).join("")}</table>
</body></html>`;
}
