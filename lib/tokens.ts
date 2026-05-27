import prisma from "./db";

interface OpenAIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export async function logTokenUsage(
  coachId: string,
  action: string,
  usage: OpenAIUsage,
  creditsCharged: number
): Promise<void> {
  await prisma.tokenUsage.create({
    data: {
      coachId,
      action,
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      creditsCharged,
    },
  });
}

export async function getTokenStats(coachId: string) {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const rows = await prisma.tokenUsage.findMany({
    where: { coachId, createdAt: { gte: since } },
    select: { action: true, totalTokens: true, creditsCharged: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const totalTokens = rows.reduce((s, r) => s + r.totalTokens, 0);
  const totalCredits = rows.reduce((s, r) => s + r.creditsCharged, 0);

  const byAction: Record<string, { tokens: number; credits: number; calls: number }> = {};
  for (const row of rows) {
    if (!byAction[row.action]) byAction[row.action] = { tokens: 0, credits: 0, calls: 0 };
    byAction[row.action].tokens += row.totalTokens;
    byAction[row.action].credits += row.creditsCharged;
    byAction[row.action].calls += 1;
  }

  return { totalTokens, totalCredits, byAction, recentRows: rows.slice(0, 10) };
}
