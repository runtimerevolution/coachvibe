import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { ok, unauthorized } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const coachId = requireAuth(req);
  if (!coachId) return unauthorized();

  const messages = await prisma.chatMessage.findMany({
    where: { coachId },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  return ok({ messages });
}
