import { NextRequest } from "next/server";
import OpenAI from "openai";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { ok, err, unauthorized } from "@/lib/api-response";
import { deductCredits } from "@/lib/credits";

export const dynamic = "force-dynamic";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const coachId = requireAuth(req);
  if (!coachId) return unauthorized();

  const hasCredits = await deductCredits(coachId, 2, "concierge.generate");
  if (!hasCredits) return err("Insufficient credits", 402);

  try {
    const coach = await prisma.coach.findUnique({
      where: { id: coachId },
      select: { name: true, bio: true, goals: true, hoursPerWeek: true },
    });

    const prompt = `You are helping a business coach named ${coach?.name ?? "Coach"} build their task list.

Coach bio: ${coach?.bio ?? "An experienced coach helping clients succeed."}
Goals: ${coach?.goals?.join(", ") || "Grow their coaching business"}
Available hours per week: ${coach?.hoursPerWeek ?? 5}

Generate exactly 5 actionable tasks for this coach to do this week. Each task should be specific, practical, and achievable within 15-60 minutes.

Return a JSON array with this exact structure:
[{"title": "...", "description": "...", "priority": "high|medium|low", "timeMinutes": number, "points": number}]

Points should be between 5 and 30, proportional to impact. timeMinutes should be realistic (15-60).`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a JSON generator. Return only a valid JSON array, no markdown." },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return err("No response from AI", 500);

    const parsed = JSON.parse(content);
    const rawTasks: Array<{ title: string; description?: string; priority?: string; timeMinutes?: number; points?: number }> =
      Array.isArray(parsed) ? parsed : parsed.tasks ?? [];

    if (!rawTasks.length) return err("AI returned no tasks", 500);

    await prisma.conciergeTask.createMany({
      data: rawTasks.map(t => ({
        coachId,
        title: t.title,
        description: t.description ?? null,
        status: "pending",
        priority: t.priority ?? "medium",
        source: "ai",
        points: t.points ?? 10,
        timeMinutes: t.timeMinutes ?? 15,
      })),
    });

    const tasks = await prisma.conciergeTask.findMany({
      where: { coachId, source: "ai" },
      orderBy: { createdAt: "desc" },
      take: rawTasks.length,
    });

    return ok({ tasks });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Generate tasks failed:", msg);
    return err(`Generation failed: ${msg}`, 500);
  }
}
