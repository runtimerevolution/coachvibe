import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { ok, unauthorized } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const coachId = requireAuth(req);
  if (!coachId) return unauthorized();

  const [coach, workflows, integrations, recentActivity, notifications, unreadCount] =
    await Promise.all([
      prisma.coach.findUnique({
        where: { id: coachId },
        select: { id: true, name: true, credits: true },
      }),
      prisma.workflowInstance.findMany({
        where: { coachId },
        include: {
          runs: { orderBy: { startedAt: "desc" }, take: 3 },
        },
      }),
      prisma.integration.findMany({ where: { coachId } }),
      prisma.activityLog.findMany({
        where: { coachId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.notification.findMany({
        where: { coachId, dismissed: false },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.notification.count({
        where: { coachId, read: false, dismissed: false },
      }),
    ]);

  const activeWorkflows = workflows.filter(w => w.active);
  const connectedIntegrations = integrations.filter(i => i.connected);

  return ok({
    coach,
    stats: {
      activeWorkflows: activeWorkflows.length,
      connectedIntegrations: connectedIntegrations.length,
      creditsRemaining: coach?.credits ?? 0,
      unreadNotifications: unreadCount,
    },
    workflows,
    integrations,
    recentActivity,
    notifications,
  });
}
