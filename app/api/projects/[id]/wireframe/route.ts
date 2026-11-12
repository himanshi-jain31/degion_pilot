import { EXPORT_JS } from "@/lib/exportJs";
import { loadProject, WireframeOutput } from "@/lib/storage";

// Serves a finished wireframe as its own page. The headers lock it in a sandbox:
// it can run its own buttons, but cannot reach the app, the network or any other site.
export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const project = await loadProject(id);
  const wanted = new URL(request.url).searchParams.get("version");
  const version = project?.versions
    .filter((v) => v.phase === 4 && v.status === "done" && (!wanted || v.id === wanted))
    .at(-1);
  let html = version ? (version.output as WireframeOutput).html : "";
  // files made before the "Open in Figma" button get its measuring script added when they are shown
  if (html && !html.includes("dp-export")) html = html.replace("</body>", `<script>${EXPORT_JS}</script></body>`);
  if (!html) return new Response("This wireframe is not ready yet.", { status: 404 });
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": "sandbox allow-scripts; default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
