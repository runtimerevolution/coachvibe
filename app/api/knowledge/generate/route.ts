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

  try {
    const body = await req.json();
    if (!body.prompt) return err("prompt is required");

    const hasCredits = await deductCredits(coachId, 3, "knowledge.generate");
    if (!hasCredits) return err("Insufficient credits", 402);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a JSON generator. Return only a valid JSON object, no markdown.",
        },
        {
          role: "user",
          content: `You are helping a coach build their knowledge base. Based on this prompt, generate a structured knowledge entry with a clear title, comprehensive content (2-4 paragraphs), and relevant tags.

Return JSON: {"title": "...", "content": "...", "tags": ["...", "..."]}

Prompt: ${body.prompt}`,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return err("No response from AI", 500);

    const parsed = JSON.parse(content);
    if (!parsed.title || !parsed.content) return err("Invalid AI response", 500);

    const entry = await prisma.knowledgeEntry.create({
      data: {
        coachId,
        title: parsed.title,
        content: parsed.content,
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        source: "ai",
      },
    });

    return ok({ entry });
  } catch (error) {
    console.error("Generate knowledge entry failed:", error);
    return err("Generation failed", 500);
  }
}
