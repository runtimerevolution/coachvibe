import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { ok, created, err, unauthorized } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const coachId = requireAuth(req);
  if (!coachId) return unauthorized();

  const tasks = await prisma.conciergeTask.findMany({
    where: { coachId },
    orderBy: [
      { status: "asc" },
      { priority: "desc" },
      { createdAt: "desc" },
    ],
  });

  return ok({ tasks });
}

export async function POST(req: NextRequest) {
  const coachId = requireAuth(req);
  if (!coachId) return unauthorized();

  try {
    const body = await req.json();
    if (!body.title) return err("title is required");

    const task = await prisma.conciergeTask.create({
      data: {
        coachId,
        title: body.title,
        description: body.description ?? null,
        status: "pending",
        priority: body.priority ?? "medium",
        source: "manual",
        points: body.points ?? 10,
        timeMinutes: body.timeMinutes ?? 15,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      },
    });

    return created({ task });
  } catch (error) {
    console.error("Create task failed:", error);
    return err("Create failed", 500);
  }
}
