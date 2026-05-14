import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { ok, err, unauthorized, notFound } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const coachId = requireAuth(req);
  if (!coachId) return unauthorized();

  const existing = await prisma.conciergeTask.findFirst({
    where: { id: params.id, coachId },
  });
  if (!existing) return notFound("Task");

  try {
    const body = await req.json();
    const updated = await prisma.conciergeTask.update({
      where: { id: params.id },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
      },
    });
    return ok({ task: updated });
  } catch (error) {
    console.error("Update task failed:", error);
    return err("Update failed", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const coachId = requireAuth(req);
  if (!coachId) return unauthorized();

  const existing = await prisma.conciergeTask.findFirst({
    where: { id: params.id, coachId },
  });
  if (!existing) return notFound("Task");

  await prisma.conciergeTask.delete({ where: { id: params.id } });
  return ok({});
}
