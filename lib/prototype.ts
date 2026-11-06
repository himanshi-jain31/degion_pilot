import { FriendlyError, MODEL_PHASE, askForText } from "@/lib/ai";
import { NAV_JS, esc, joinSections, sanitizeFragment } from "@/lib/wireframes";
import type { Screen } from "@/lib/storage";
import type Anthropic from "@anthropic-ai/sdk";

export const DESIGN_RULES = `

IMPORTANT FOR THIS RUN: do NOT include the "html" key. The prototype is built afterwards, one screen at a time from the approved wireframe.
Instead add a key "css": one complete stylesheet that gives the final look to these ready-made classes: .bar, .title, .sub, .muted, .box, .card, .row, .col, .btn, .btn.primary, .input, .label, .list, .item, .tabs, .tab, .badge, .banner, .banner.error, .img, .empty, plus a for links and body text.
Use the CSS variables from the design style (var(--primary), var(--background), var(--text), var(--accent), var(--font-heading), var(--font-body), var(--radius)) instead of typing colours. If a Figma design system is given, use only its colours and fonts (type its exact colours and font names), and list anything else you had to add in off_style_items. If no design style was given, define your own neutral variables at the top of the css.
Buttons and inputs must be at least 44px tall. Do not use @import, external fonts, or url(). The css must work on a phone and a laptop.
Also fill design_checks and cover_note honestly from what you will build. Do not claim anything has been tested with people.`;

// Cleans a stylesheet from the AI: no imports, no outside addresses
export function sanitizeCss(css: string): string {
  return css
    .replace(/```(?:css)?/gi, "")
    .replace(/<\/?style[^>]*>/gi, "")
    .replace(/@import[^;]*;?/gi, "")
    .replace(/url\(\s*(?!["']?data:image)[^)]*\)/gi, "none")
    .replace(/expression\([^)]*\)|behavior\s*:[^;}]*/gi, "")
    .trim();
}

// Pulls each screen's html out of the approved wireframe file
export function wireframeFragments(html: string, screens: Screen[]): string[] {
  return screens.map((s) => {
    const m = html.match(new RegExp(`<section class="screen" id="screen-${s.id}">([\\s\\S]*?)</section>`));
    return m ? m[1] : "";
  });
}

const FRAGMENT_SYSTEM = (ids: string[], css: string, styleText: string) => `You turn ONE approved grey wireframe screen into the final designed screen of a working prototype.
Reply with ONLY the HTML that goes inside the screen. No <html>, <head>, <body>, <section>, <script> or <style> tags. No markdown fences. No external links, fonts or images.
KEEP the approved layout and every data-go attribute exactly. Only these screen ids exist: ${ids.join(", ")}.
Use the ready-made classes. Their stylesheet is below. You may add small inline style attributes, but colours must come from var(--primary), var(--background), var(--text), var(--accent).
Use realistic content, including one very long name and one empty value where it fits. Buttons at least 44px tall. Plain, honest wording: no hidden costs, no guilt-trip wording, no tricky defaults.
Keep every state the wireframe screen shows.

DESIGN STYLE:
${styleText}

STYLESHEET:
${css.slice(0, 12000)}`;

export async function designScreen(opts: {
  screen: Screen;
  screens: Screen[];
  wireframe: string;
  css: string;
  styleText: string;
  summary: string;
  demo: string;
}): Promise<string> {
  const ids = opts.screens.map((s) => s.id);
  const content: Anthropic.ContentBlockParam[] = [
    {
      type: "text",
      text: `PROJECT: ${opts.summary}\n\nSCREEN: id "${opts.screen.id}", name "${opts.screen.name}", purpose: ${opts.screen.purpose}\n\nAPPROVED WIREFRAME HTML FOR THIS SCREEN:\n${opts.wireframe}`,
    },
  ];
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await askForText({ model: MODEL_PHASE, system: FRAGMENT_SYSTEM(ids, opts.css, opts.styleText), content, demo: opts.demo });
    const html = sanitizeFragment(raw);
    if (html.length > 40 && html.includes("<")) return html;
  }
  throw new FriendlyError(`I couldn't design the screen "${opts.screen.name}". Please try again.`);
}

// Structure and safety rules that always apply, whatever the AI's stylesheet says
const BASE = `*{box-sizing:border-box}body{margin:0;font-family:var(--font-body,system-ui,sans-serif);background:var(--background,#fff);color:var(--text,#222);line-height:1.5}
.screen{display:none;max-width:1000px;margin:0 auto;padding:16px}.screen.active{display:block}
.proto-bar{position:sticky;top:0;z-index:50;display:flex;gap:10px;align-items:center;padding:6px 12px;background:#222;color:#fff;font:13px system-ui,sans-serif}
.proto-bar span{flex:1}.proto-bar select{padding:4px;border-radius:6px;max-width:55%}
button,.btn,input,select,textarea{min-height:44px;font:inherit}[data-go]{cursor:pointer}.card[data-go],.item[data-go]{cursor:pointer}
.row>*{min-width:0}img{max-width:100%}`;

export function assemblePrototype(opts: { screens: Screen[]; fragments: string[]; css: string; vars: string }) {
  const { sections, warnings } = joinSections(opts.screens, opts.fragments);
  // the designer's style variables come after the AI's stylesheet, so they always win
  const css = `${sanitizeCss(opts.css)}${opts.vars}${BASE}`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Prototype</title><style>${css}</style></head><body>
<div class="proto-bar"><span>Prototype. Not the final product.</span><select id="jump" aria-label="Jump to a screen">${opts.screens.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join("")}</select></div>
${sections.join("\n")}
<script>${NAV_JS}</script></body></html>`;
  return { html, warnings };
}

// ---------- Demo mode ----------
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
