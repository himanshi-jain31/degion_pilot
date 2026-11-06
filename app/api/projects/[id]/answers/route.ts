import { NextResponse } from "next/server";
import { loadProject, saveProject } from "@/lib/storage";

// Saves one answer. "youDecide" true means the designer let me choose, so it goes in Things I guessed.
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const project = await loadProject(id);
  if (!project?.quickQuestions) return NextResponse.json({ error: "I can't find this project." }, { status: 404 });

  const body = (await request.json()) as { questionId?: string; answer?: string; youDecide?: boolean };
  const question = project.quickQuestions.questions.find((q) => q.id === body.questionId);
  if (!question) return NextResponse.json({ error: "I can't find that question." }, { status: 400 });

  const guessId = `quick-${question.id}`;
  project.thingsIGuessed = project.thingsIGuessed.filter((g) => g.id !== guessId);

  if (body.youDecide) {
    project.answers[question.id] = "You decide";
    project.thingsIGuessed.push({
      id: guessId,
      text: `You asked me to decide: "${question.question}" I will choose what fits best.`,
      label: "My guess",
      from: "quick-questions",
    });
  } else if (typeof body.answer === "string" && body.answer.trim()) {
    project.answers[question.id] = body.answer.trim().slice(0, 500);
  } else {
    return NextResponse.json({ error: "Please pick an answer." }, { status: 400 });
  }

  await saveProject(project);
  return NextResponse.json({ ok: true });
}
