import { NextResponse } from "next/server";
import { FriendlyError, MODEL_QUICK, askForJson, buildProjectContent, readRecipe } from "@/lib/ai";
import { QuickQuestions, loadProject, saveProject } from "@/lib/storage";

function validate(data: unknown): QuickQuestions {
  const d = data as Partial<QuickQuestions>;
  if (!d || !Array.isArray(d.questions) || d.questions.length === 0) throw new Error("questions list is missing");
  const questions = d.questions.slice(0, 5).map((q, i) => {
    if (!q || typeof q.question !== "string" || !Array.isArray(q.options) || q.options.length < 2)
      throw new Error(`question ${i + 1} needs text and at least 2 options`);
    return {
      id: typeof q.id === "string" && q.id ? q.id : `q${i + 1}`,
      question: q.question,
      why_it_matters: typeof q.why_it_matters === "string" ? q.why_it_matters : undefined,
      options: q.options.slice(0, 4).map(String),
    };
  });
  return {
    request_summary: typeof d.request_summary === "string" ? d.request_summary : "",
    suggested_depth: typeof d.suggested_depth === "string" ? d.suggested_depth : "Standard",
    questions,
  };
}

// Returns saved questions, or asks the AI for them (add ?again=1 to ask again)
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const project = await loadProject(id);
  if (!project) return NextResponse.json({ error: "I can't find this project." }, { status: 404 });

  const again = new URL(request.url).searchParams.get("again") === "1";
  if (project.quickQuestions && !again) return NextResponse.json({ ...project.quickQuestions, answers: project.answers });

  try {
    const result = await askForJson({
      model: MODEL_QUICK,
      recipe: await readRecipe("0-quick-questions.md"),
      content: await buildProjectContent(project),
      validate,
      demo: {
        seconds: 2,
        data: {
          request_summary: "You want a simpler way for staff to ask for time off and for managers to answer.",
          suggested_depth: "Light",
          questions: [
            { id: "q1", question: "Where will people mostly use this?", why_it_matters: "Changes the layout", options: ["Phone", "Laptop", "Both"] },
            { id: "q2", question: "Who will use it most?", why_it_matters: "Changes the words and steps", options: ["Staff", "Customers", "Managers"] },
            { id: "q3", question: "How soon do you need it?", options: ["This week", "This month", "No rush"] },
          ],
        },
      },
    });
    project.quickQuestions = result;
    project.answers = {};
    project.thingsIGuessed = project.thingsIGuessed.filter((g) => g.from !== "quick-questions");
    await saveProject(project);
    return NextResponse.json({ ...result, answers: {} });
  } catch (e) {
    const message = e instanceof FriendlyError ? e.message : "Something went wrong. Please try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
