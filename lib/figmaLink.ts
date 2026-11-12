// Checks a Figma file link typed by the designer. Safe to use in the browser.
export type FigmaLinkCheck = { ok: true; url: string; fileKey: string } | { ok: false; message: string };

export function checkFigmaFileLink(raw: string): FigmaLinkCheck {
  const text = raw.trim();
  if (!text) return { ok: false, message: "Paste the link of your Figma file." };
  let u: URL;
  try {
    u = new URL(text);
  } catch {
    return { ok: false, message: "That does not look like a link. Copy the whole link from Figma's address bar." };
  }
  const host = u.hostname.toLowerCase();
  if (u.protocol !== "https:" || (host !== "figma.com" && host !== "www.figma.com"))
    return { ok: false, message: "That link is not from figma.com. Copy it from your Figma file." };
  const m = u.pathname.match(/^\/(?:file|design|board|proto|make)\/([A-Za-z0-9]+)/);
  if (!m) return { ok: false, message: "That looks like another kind of Figma page. Open your design file and copy its link." };
  return { ok: true, url: `https://www.figma.com${u.pathname}`, fileKey: m[1] };
}
