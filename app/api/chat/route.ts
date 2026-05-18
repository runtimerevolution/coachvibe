import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { deductCredits } from "@/lib/credits";

export const dynamic = "force-dynamic";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a warm, insightful AI coaching assistant for coaches. You help coaches reflect on their practice, prepare for sessions, draft content, and think through challenges.

Your tone is:
- Warm and direct, like a trusted colleague
- Practical, not fluffy
- Curious and thoughtful
- Concise — short paragraphs, no unnecessary filler

You can help with:
- Preparing for coaching sessions
- Reflecting on past sessions
- Drafting content (posts, emails, newsletters)
- Business strategy for coaches
- Thinking through client challenges (anonymised)

Always stay in the coaching professional context. If asked about something unrelated, gently redirect.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        role: "assistant",
        content: "Anthropic API key is not configured. Please add ANTHROPIC_API_KEY to your .env.local file.",
      });
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const replyContent = response.content[0].type === "text" ? response.content[0].text : "";
    const reply = { role: "assistant", content: replyContent };

    const coachId = requireAuth(req);
    if (coachId) {
      await deductCredits(coachId, 1, "chat.message");

      const userMessage = messages[messages.length - 1];
      if (userMessage) {
        await prisma.chatMessage.createMany({
          data: [
            { coachId, role: userMessage.role, content: userMessage.content },
            { coachId, role: "assistant", content: replyContent },
          ],
        });
      }
    }

    return NextResponse.json(reply);
  } catch (err) {
    console.error("Chat route error:", err);
    return NextResponse.json(
      { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      { status: 500 }
    );
  }
}
