import prisma from "./db";
import { createNotification } from "./notifications";
import { logActivity } from "./activity";

export async function deductCredits(
  coachId: string,
  amount: number,
  reason: string
): Promise<boolean> {
  const coach = await prisma.coach.findUnique({
    where: { id: coachId },
    select: { credits: true },
  });

  if (!coach || coach.credits < amount) return false;

  const updated = await prisma.coach.update({
    where: { id: coachId },
    data: { credits: { decrement: amount } },
  });

  await logActivity(coachId, reason, `${amount} credit${amount === 1 ? "" : "s"} used for ${reason}`);

  if (updated.credits < 50) {
    const recent = await prisma.notification.findFirst({
      where: {
        coachId,
        type: "warning",
        title: { contains: "running low" },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });
    if (!recent) {
      await createNotification(coachId, {
        title: "Credits running low",
        body: `You have ${updated.credits} credits remaining.`,
        type: "warning",
      });
    }
  }

  return true;
}
