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

  const existing = await prisma.knowledgeEntry.findFirst({
    where: { id: params.id, coachId },
  });
  if (!existing) return notFound("Entry");

  try {
    const body = await req.json();
    const updated = await prisma.knowledgeEntry.update({
      where: { id: params.id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.tags !== undefined && { tags: body.tags }),
      },
    });
    return ok({ entry: updated });
  } catch (error) {
    console.error("Update entry failed:", error);
    return err("Update failed", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const coachId = requireAuth(req);
  if (!coachId) return unauthorized();

  const existing = await prisma.knowledgeEntry.findFirst({
    where: { id: params.id, coachId },
  });
  if (!existing) return notFound("Entry");

  await prisma.knowledgeEntry.delete({ where: { id: params.id } });
  return ok({});
}
