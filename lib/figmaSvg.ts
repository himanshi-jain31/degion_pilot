// Turns the measured screens into one SVG. When you paste an SVG into Figma, every box and every piece of text
// becomes its own editable layer, and each screen is a group named after the screen.
export type XNode =
  | { t: "rect"; n: string; x: number; y: number; w: number; h: number; r: number; fill: string | null; fo: number; stroke: string | null; sw: number }
  | { t: "text"; x: number; y: number; h: number; text: string; size: number; weight: string; family: string; fill: string; fo: number };
export type XScreen = { id: string; name: string; group: string; width: number; height: number; nodes: XNode[] };

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const num = (n: number) => Math.round(n * 100) / 100;

function screenSvg(s: XScreen, x: number, y: number, bg: string): string {
  const parts: string[] = [`<g id="${esc(s.name)}" transform="translate(${num(x)} ${num(y)})">`, `<rect id="Background" width="${num(s.width)}" height="${num(s.height)}" fill="${bg}"/>`];
  s.nodes.forEach((n) => {
    if (n.t === "rect") {
      if (n.w < 0.5 || n.h < 0.5) return;
      const fill = n.fill ? ` fill="${n.fill}"${n.fo < 1 ? ` fill-opacity="${num(n.fo)}"` : ""}` : ' fill="none"';
      const stroke = n.stroke && n.sw > 0 ? ` stroke="${n.stroke}" stroke-width="${num(n.sw)}"` : "";
      // a border is drawn inside the box, like on the screen
      const inset = n.stroke && n.sw > 0 ? n.sw / 2 : 0;
      parts.push(`<rect id="${esc(n.n)}" x="${num(n.x + inset)}" y="${num(n.y + inset)}" width="${num(n.w - inset * 2)}" height="${num(n.h - inset * 2)}"${n.r > 0 ? ` rx="${num(Math.max(0, n.r - inset))}"` : ""}${fill}${stroke}/>`);
    } else {
      // the text sits on a baseline about 0.8 of its size below the top of the line
      const baseline = n.y + (n.h - n.size) / 2 + n.size * 0.8;
      parts.push(`<text x="${num(n.x)}" y="${num(baseline)}" font-family="${esc(n.family)}" font-size="${num(n.size)}" font-weight="${esc(String(n.weight))}" fill="${n.fill}"${n.fo < 1 ? ` fill-opacity="${num(n.fo)}"` : ""} xml:space="preserve">${esc(n.text)}</text>`);
    }
  });
  parts.push("</g>");
  return parts.join("");
}

// Screens in rows, one row group per menu group (Employee, Manager, ...), with the group name above
export function buildSvg(screens: XScreen[], bg: string): string {
  const GAP = 80;
  const COLUMNS = 5;
  const groups: string[] = [];
  screens.forEach((s) => {
    const g = s.group || "Screens";
    if (!groups.includes(g)) groups.push(g);
  });
  const body: string[] = [];
  let y = 0;
  let maxRight = 0;
  groups.forEach((g) => {
    const mine = screens.filter((s) => (s.group || "Screens") === g);
    body.push(`<text id="${esc(g)}" x="0" y="${num(y + 30)}" font-family="Inter" font-size="30" font-weight="600" fill="#1c1c1e">${esc(g)}</text>`);
    y += 70;
    for (let i = 0; i < mine.length; i += COLUMNS) {
      const row = mine.slice(i, i + COLUMNS);
      let x = 0;
      row.forEach((s) => {
        body.push(screenSvg(s, x, y, bg));
        x += s.width + GAP;
      });
      maxRight = Math.max(maxRight, x - GAP);
      y += Math.max(...row.map((s) => s.height)) + GAP;
    }
    y += 40;
  });
  const w = Math.max(maxRight, 100);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${num(w)}" height="${num(y)}" viewBox="0 0 ${num(w)} ${num(y)}">${body.join("")}</svg>`;
}
