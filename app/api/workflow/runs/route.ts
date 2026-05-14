import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { ok, unauthorized } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const coachId = requireAuth(req);
  if (!coachId) return unauthorized();

  const workflows = await prisma.workflowInstance.findMany({
    where: { coachId },
    include: {
      runs: { orderBy: { startedAt: "desc" }, take: 5 },
    },
  });

  return ok({ workflows });
}
