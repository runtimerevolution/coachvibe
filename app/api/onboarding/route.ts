import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { ok, err, unauthorized } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const coachId = requireAuth(req);
  if (!coachId) return unauthorized();

  try {
    const body = await req.json();
    const { goals, hoursPerWeek } = body;

    await prisma.coach.update({
      where: { id: coachId },
      data: {
        goals: Array.isArray(goals) ? goals : [],
        hoursPerWeek: typeof hoursPerWeek === "number" ? hoursPerWeek : 5,
      },
    });

    return ok({});
  } catch (error) {
    console.error("Save goals failed:", error);
    return err("Save failed", 500);
  }
}
