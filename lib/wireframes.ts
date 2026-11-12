import { FriendlyError, MODEL_PHASE, askForText } from "@/lib/ai";
import { stripDesignerNotes } from "@/lib/checks";
import { EXPORT_JS } from "@/lib/exportJs";
import type { Screen } from "@/lib/storage";
import type Anthropic from "@anthropic-ai/sdk";

const MAX_SCREENS = 24;

// ---------- Screen list (first AI answer) ----------

export const PLAN_RULES = `

IMPORTANT FOR THIS RUN: do NOT include the "html" key. The HTML is drawn afterwards, one screen at a time.
List every screen needed (empty, error, loading and no-permission screens too), at most ${MAX_SCREENS}.
Give each screen a short id using only lowercase letters, numbers and dashes (for example "home" or "request-form").
Put the screen the user sees first at the top of the list.
If the product has more than one kind of user, give each screen an optional "group" (for example "Employee" or "Manager"). Put empty, error, loading and no-permission screens in the group "Edge cases and states": they are opened from the prototype menu, never from buttons in the product screens.`;

export function cleanScreens(raw: unknown): Screen[] {
  const list = Array.isArray(raw) ? raw : [];
  const seen = new Set<string>();
  const screens: Screen[] = [];
  for (const [i, s] of list.entries()) {
    const o = (s ?? {}) as Record<string, unknown>;
    let id = String(o.id ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-+|-+$/g, "") || `screen-${i + 1}`;
    while (seen.has(id)) id += "-2";
    seen.add(id);
    screens.push({
      id,
      name: String(o.name ?? id),
      purpose: String(o.purpose ?? ""),
      meets: Array.isArray(o.meets) ? o.meets.map(String) : [],
      states: Array.isArray(o.states) ? o.states.map(String) : [],
      ...(typeof o.group === "string" && o.group.trim() ? { group: o.group.trim().slice(0, 40) } : {}),
    });
  }
  if (screens.length === 0) throw new Error("screens list is empty");
  return screens.slice(0, MAX_SCREENS);
}

// ---------- One screen at a time ----------

const FRAGMENT_SYSTEM = (ids: string[]) => `You draw ONE screen of a grey, clickable HTML wireframe.
Reply with ONLY the HTML that goes inside the screen. No <html>, <head>, <body>, <section>, <script> or <style> tags. No markdown fences. No external links, fonts or images.
Grey only (#f2f2f2 to #333). Use real labels and realistic sample content. Never write "lorem ipsum".
Use these ready-made classes (they are already styled): .bar (top bar), .title, .sub, .muted, .box (grey block), .card, .row (side by side), .col, .btn, .btn.primary (dark button), .input, .label, .list, .item, .tabs, .tab, .banner, .banner.error, .img (picture placeholder), .badge, .empty (empty-state block).
To move to another screen, put data-go="<screen id>" on a button, link or card. Only use these screen ids: ${ids.join(", ")}.
Every button and link must have a data-go. Never add buttons that jump to empty, error or no-permission screens: those are reached from the prototype menu. Forms: use <form data-go="<screen id>"> for the screen shown after sending.
The details below (purpose, states, requirement numbers) are notes for you. NEVER write them on the screen. Only write what a real user would read.
Show the states this screen must show (for example empty, error, loading) as they would look. Keep it under about 120 lines of HTML. Make it work on a phone and a laptop (it already stacks on narrow screens).`;

export function sanitizeFragment(input: string): string {
  let h = input.replace(/```(?:html)?/gi, "");
  h = h.replace(/<!doctype[^>]*>/gi, "");
  h = h.replace(/<(script|style|iframe|object|embed)\b[\s\S]*?<\/\1>/gi, "");
  h = h.replace(/<\/?(script|style|iframe|object|embed|link|meta|base)\b[^>]*>/gi, "");
  h = h.replace(/<\/?(html|head|body|section|title)\b[^>]*>/gi, "");
  h = h.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, ""); // inline event handlers
  h = h.replace(/\s(href|src|action|formaction|srcset|poster)\s*=\s*("\s*(?:https?:)?\/\/[^"]*"|'\s*(?:https?:)?\/\/[^']*'|"\s*javascript:[^"]*"|'\s*javascript:[^']*')/gi, ' $1="#"');
  h = h.replace(/\ssrc\s*=\s*("(?!data:image)[^"]*"|'(?!data:image)[^']*')/gi, "");
  return h.trim();
}

export async function drawScreen(opts: {
  screen: Screen;
  screens: Screen[];
  context: Anthropic.ContentBlockParam[];
  wording: { screen: string; text: string; where: string }[];
  demo: string;
}): Promise<string> {
  const ids = opts.screens.map((s) => s.id);
  const mine = opts.wording.filter((w) => w.screen === opts.screen.id || w.screen === opts.screen.name);
  const brief =
    `ALL SCREENS:\n${opts.screens.map((s) => `- ${s.id}: ${s.name} (${s.purpose})`).join("\n")}\n\n` +
    `DRAW THIS SCREEN NOW: id "${opts.screen.id}", name "${opts.screen.name}".\nPurpose: ${opts.screen.purpose}\n` +
    `Requirements it meets: ${opts.screen.meets.join(", ") || "n/a"}\nStates to show: ${opts.screen.states.join(", ") || "normal"}\n` +
    (mine.length ? `Wording to use:\n${mine.map((w) => `- ${w.where}: ${w.text}`).join("\n")}\n` : "");
  const content: Anthropic.ContentBlockParam[] = [...opts.context, { type: "text", text: brief }];

  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await askForText({ model: MODEL_PHASE, system: FRAGMENT_SYSTEM(ids), content, demo: opts.demo });
    const html = stripDesignerNotes(sanitizeFragment(raw), opts.screen);
    if (html.length > 40 && html.includes("<")) return html;
  }
  throw new FriendlyError(`I couldn't draw the screen "${opts.screen.name}". Please try again.`);
}

// ---------- Joining the screens ----------

export const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

// Navigation that works on both sizes: tabs along the bottom on a phone, a side bar on a laptop
export const NAV_LAYOUT_CSS = `.appnav{position:fixed;z-index:30;left:0;right:0;bottom:0;display:flex;justify-content:space-around;background:var(--nav-bg,#fff);border-top:1px solid #bbb}
.appnav .brand{display:none}.appnav .navitem{flex:1;min-height:56px;border:0;background:transparent;font:inherit;color:inherit;cursor:pointer;padding:8px 4px}
.appnav .navitem[aria-current="page"]{font-weight:700;box-shadow:inset 0 3px 0 currentColor}
.screen:has(.appnav){padding-bottom:88px}
@media (min-width:760px){.appnav{top:60px;right:auto;bottom:0;width:200px;flex-direction:column;justify-content:flex-start;gap:4px;padding:12px 8px;border-top:0;border-right:1px solid #bbb}
.appnav .brand{display:block;font-weight:700;padding:8px 12px 16px}.appnav .navitem{flex:none;text-align:left;padding:10px 12px;border-radius:8px}
.appnav .navitem[aria-current="page"]{box-shadow:none;background:rgba(0,0,0,.08)}
.screen:has(.appnav){margin:0 0 0 200px;max-width:none;padding:24px 32px}.screen:has(.appnav)>*{max-width:760px}}`;

const CSS = `*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#f2f2f2;color:#333;line-height:1.4}
.menu{position:sticky;top:0;z-index:5;display:flex;gap:10px;align-items:center;padding:8px 12px;background:#333;color:#f2f2f2;font-size:14px}
.menu select{flex:1;min-width:0;padding:6px;border-radius:6px;border:1px solid #888;background:#f2f2f2;color:#333}
.screen{display:none;max-width:1000px;margin:0 auto;padding:16px}.screen.active{display:block}
.bar{padding:12px 14px;background:#d9d9d9;border:1px solid #aaa;border-radius:8px;font-weight:600;margin-bottom:12px}
.title{font-size:22px;font-weight:700;margin:8px 0}.sub{font-size:16px;font-weight:600;margin:8px 0}.muted{color:#777;font-size:14px}
.box,.card,.item,.empty{background:#fff;border:1px solid #bbb;border-radius:8px;padding:12px;margin:8px 0}
.card[data-go],.item[data-go],[data-go]{cursor:pointer}
.row{display:flex;gap:12px;flex-wrap:wrap;align-items:center}.row>*{flex:1 1 200px}.col{display:flex;flex-direction:column;gap:8px}
.btn{display:inline-block;padding:10px 16px;border:1px solid #666;border-radius:8px;background:#e6e6e6;color:#333;font:inherit;text-decoration:none;cursor:pointer}
.btn.primary{background:#333;color:#f2f2f2;border-color:#333}.btn:hover{filter:brightness(.95)}
.input{display:block;width:100%;padding:10px;border:1px solid #999;border-radius:6px;background:#fff;font:inherit;margin:4px 0 10px}
.label{display:block;font-size:14px;font-weight:600}.list{display:flex;flex-direction:column}.tabs{display:flex;gap:6px;margin:8px 0}
.tab{padding:8px 14px;border:1px solid #aaa;border-radius:8px 8px 0 0;background:#e6e6e6}
.banner{padding:10px 12px;border:1px solid #999;border-radius:8px;background:#e0e0e0;margin:8px 0}.banner.error{background:#ddd;border:2px solid #555}
.img{min-height:90px;background:repeating-linear-gradient(45deg,#e4e4e4,#e4e4e4 10px,#d6d6d6 10px,#d6d6d6 20px);border:1px solid #bbb;border-radius:8px}
.badge{display:inline-block;padding:2px 8px;border-radius:99px;background:#ccc;font-size:12px}.empty{text-align:center;color:#666;padding:28px}
a{color:#333}.big{font-size:28px;font-weight:700}.status{display:inline-block;white-space:nowrap;padding:2px 10px;border:1px solid #666;border-radius:99px;font-size:13px;background:#eee}
.cal{border-collapse:collapse;width:100%;font-size:14px}.cal th,.cal td{border:1px solid #bbb;padding:6px;text-align:left;vertical-align:top}.banner.warn{background:#e6e6e6;border:1px dashed #666}
textarea.input{min-height:90px}${NAV_LAYOUT_CSS}`;

const JS = `(function(){var sel=document.getElementById('jump');var screens=[].slice.call(document.querySelectorAll('.screen'));
function show(id){var f=false;screens.forEach(function(s){var on=s.id==='screen-'+id;if(on)f=true;s.classList.toggle('active',on)});
if(!f)return;sel.value=id;window.scrollTo(0,0);try{history.replaceState(null,'','#'+id)}catch(e){}}
document.addEventListener('click',function(e){var t=e.target.closest('[data-go]');if(t&&t.tagName!=='FORM'){e.preventDefault();show(t.getAttribute('data-go'))}});
document.addEventListener('submit',function(e){e.preventDefault();var g=e.target.getAttribute('data-go');if(g)show(g)});
sel.addEventListener('change',function(){show(sel.value)});
document.addEventListener('keydown',function(e){if(e.key!=='Enter'&&e.key!==' ')return;var t=e.target;if(t&&t.hasAttribute&&t.hasAttribute('data-go')&&t.hasAttribute('tabindex')&&t.tagName!=='BUTTON'){e.preventDefault();show(t.getAttribute('data-go'))}});
var start=(location.hash||'').slice(1);show(screens.some(function(s){return s.id==='screen-'+start})?start:screens[0].id.replace('screen-',''));})();`;

// Fixes buttons that point nowhere and reports screens that cannot be reached by a button
export function joinSections(screens: Screen[], fragments: string[]): { sections: string[]; warnings: string[] } {
  const warnings: string[] = [];
  const ids = new Set(screens.map((s) => s.id));
  const targeted = new Set<string>();

  const sections = screens.map((s, i) => {
    const fixed = fragments[i].replace(/data-go\s*=\s*"([^"]*)"/gi, (_m, target: string) => {
      if (ids.has(target)) {
        if (target !== s.id) targeted.add(target);
        return `data-go="${target}"`;
      }
      warnings.push(`A button on "${s.name}" pointed to a screen that does not exist, so I sent it to "${screens[0].name}".`);
      targeted.add(screens[0].id);
      return `data-go="${screens[0].id}"`;
    });
    if (!/data-go=/.test(fixed)) warnings.push(`"${s.name}" has no buttons that go anywhere.`);
    return `<section class="screen" id="screen-${s.id}">${fixed}</section>`;
  });

  for (const s of screens.slice(1)) {
    if (s.group === "Edge cases and states") continue; // reached from the menu on purpose
    if (!targeted.has(s.id)) warnings.push(`No button leads to "${s.name}". You can only reach it from the screen menu at the top.`);
  }
  return { sections, warnings };
}

export const NAV_JS = JS;

// The screen menu in the top bar. Screens with a group are listed under that group's name.
export function menuOptions(screens: Screen[]): string {
  const opt = (s: Screen) => `<option value="${s.id}">${esc(s.name)}</option>`;
  if (!screens.some((s) => s.group)) return screens.map(opt).join("");
  const order: string[] = [];
  for (const s of screens) if (!order.includes(s.group ?? "Screens")) order.push(s.group ?? "Screens");
  return order.map((g) => `<optgroup label="${esc(g)}">${screens.filter((s) => (s.group ?? "Screens") === g).map(opt).join("")}</optgroup>`).join("");
}

export function assemble(screens: Screen[], fragments: string[]): { html: string; warnings: string[] } {
  const { sections, warnings } = joinSections(screens, fragments);
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Wireframe</title><style>${CSS}</style></head><body>
<div class="menu"><strong>Wireframe</strong><select id="jump" aria-label="Jump to a screen">${menuOptions(screens)}</select></div>
${sections.join("\n")}
<script>${JS}${EXPORT_JS}</script></body></html>`;
  return { html, warnings };
}
