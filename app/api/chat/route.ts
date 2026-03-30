import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        role: "assistant",
        content: "OpenAI API key is not configured. Please add OPENAI_API_KEY to your .env.local file.",
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const reply = completion.choices[0]?.message;
    return NextResponse.json(reply);
  } catch (err) {
    console.error("Chat route error:", err);
    return NextResponse.json(
      { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      { status: 500 }
    );
  }
}
