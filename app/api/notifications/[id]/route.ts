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

  const existing = await prisma.notification.findFirst({
    where: { id: params.id, coachId },
  });
  if (!existing) return notFound("Notification");

  try {
    const body = await req.json();
    const updated = await prisma.notification.update({
      where: { id: params.id },
      data: {
        ...(body.read !== undefined && { read: body.read }),
        ...(body.dismissed !== undefined && { dismissed: body.dismissed }),
      },
    });
    return ok({ notification: updated });
  } catch (error) {
    console.error("Notification update failed:", error);
    return err("Update failed", 500);
  }
}
