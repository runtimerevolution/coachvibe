import prisma from "./db";

export async function logActivity(
  coachId: string,
  action: string,
  label: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await prisma.activityLog.create({
    data: { coachId, action, label, metadata },
  });
}
