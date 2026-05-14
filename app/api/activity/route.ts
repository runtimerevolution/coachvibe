import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { ok, unauthorized } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const coachId = requireAuth(req);
  if (!coachId) return unauthorized();

  const activity = await prisma.activityLog.findMany({
    where: { coachId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return ok({ activity });
}
