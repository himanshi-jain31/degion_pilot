import { EXPORT_JS } from "@/lib/exportJs";
import { DesignOutput, loadProject } from "@/lib/storage";

// Serves the prototype as its own page (sandboxed), or as a download with ?download=1
export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const project = await loadProject(id);
  const q = new URL(request.url).searchParams;
  if (q.get("final") && !project?.finalDesignVersionId) return new Response("There is no final design yet.", { status: 404 });
  const wanted = q.get("version") ?? (q.get("final") ? project?.finalDesignVersionId : undefined);
  const version = project?.versions.filter((v) => v.phase === 5 && v.status === "done" && (!wanted || v.id === wanted)).at(-1);
  let html = version ? (version.output as DesignOutput).html : "";
  // files made before the "Open in Figma" button get its measuring script added when they are shown
  if (html && !html.includes("dp-export")) html = html.replace("</body>", `<script>${EXPORT_JS}</script></body>`);
  if (!html) return new Response("This prototype is not ready yet.", { status: 404 });

  const headers: Record<string, string> = {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
  if (q.get("download")) {
    headers["Content-Disposition"] = `attachment; filename="designpilot-prototype${version?.demo ? "-DEMO" : ""}.html"`;
  } else {
    // Same lock as the wireframe: its buttons work, but it cannot reach the app or the internet
    headers["Content-Security-Policy"] = "sandbox allow-scripts; default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:";
  }
  return new Response(html, { headers });
}
