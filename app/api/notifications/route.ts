import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { ok, err, unauthorized } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const coachId = requireAuth(req);
  if (!coachId) return unauthorized();

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { coachId, dismissed: false },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.notification.count({
      where: { coachId, read: false, dismissed: false },
    }),
  ]);

  return ok({ notifications, unreadCount });
}

const DEMO_TITLES = [
  "New client inquiry received",
  "Workflow ran successfully",
  "Your landing page got 12 new views",
  "Reminder: follow up with Sarah",
  "Credit usage report is ready",
];

export async function POST(req: NextRequest) {
  const coachId = requireAuth(req);
  if (!coachId) return unauthorized();

  try {
    const body = await req.json().catch(() => ({}));
    const idx = Math.floor(Math.random() * DEMO_TITLES.length);
    const notification = await prisma.notification.create({
      data: {
        coachId,
        title: body.title ?? DEMO_TITLES[idx],
        body: body.body ?? "This is a demo notification created for testing purposes.",
        type: body.type ?? "info",
        read: false,
        dismissed: false,
      },
    });
    return ok({ notification });
  } catch (error) {
    console.error("Create notification failed:", error);
    return err("Failed to create notification", 500);
  }
}
