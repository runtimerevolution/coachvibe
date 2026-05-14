import prisma from "./db";

type NotificationType = "info" | "warning" | "success" | "error";

export async function createNotification(
  coachId: string,
  data: { title: string; body: string; type?: NotificationType }
): Promise<void> {
  await prisma.notification.create({
    data: {
      coachId,
      title: data.title,
      body: data.body,
      type: data.type ?? "info",
      read: false,
      dismissed: false,
    },
  });
}
