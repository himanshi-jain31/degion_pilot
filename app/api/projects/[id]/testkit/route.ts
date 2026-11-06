import { testKitHtml } from "@/lib/testing";
import { TestingOutput, loadProject } from "@/lib/storage";

// The test kit as one printable page, downloaded as a file
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const project = await loadProject(id);
  const v = project?.versions.filter((x) => x.phase === 6 && x.status === "done" && x.output).at(-1);
  if (!project || !v) return new Response("The test kit is not ready yet.", { status: 404 });
  return new Response(testKitHtml(project.title, v.output as TestingOutput), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": 'attachment; filename="designpilot-test-kit.html"',
      "Cache-Control": "no-store",
    },
  });
}
