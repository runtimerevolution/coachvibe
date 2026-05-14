import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { ok, err, unauthorized, notFound } from "@/lib/api-response";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const coachId = requireAuth(req);
  if (!coachId) return unauthorized();

  const existing = await prisma.workflowInstance.findFirst({
    where: { id: params.id, coachId },
  });
  if (!existing) return notFound("Workflow");

  try {
    await prisma.workflowInstance.delete({ where: { id: params.id } });
    await logActivity(coachId, "workflow.deleted", `Workflow "${existing.customName ?? existing.templateId}" deleted`);
    return ok({});
  } catch (error) {
    console.error("Delete workflow failed:", error);
    return err("Failed to delete workflow", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const coachId = requireAuth(req);
  if (!coachId) return unauthorized();

  const existing = await prisma.workflowInstance.findFirst({
    where: { id: params.id, coachId },
  });
  if (!existing) return notFound("Workflow");

  try {
    const body = await req.json();
    const updated = await prisma.workflowInstance.update({
      where: { id: params.id },
      data: {
        ...(body.customName !== undefined && { customName: body.customName }),
        ...(body.customDescription !== undefined && { customDescription: body.customDescription }),
        ...(body.customSteps !== undefined && { customSteps: body.customSteps }),
        ...(body.active !== undefined && { active: body.active }),
      },
    });
    return ok({ workflow: updated });
  } catch (error) {
    console.error("Update workflow failed:", error);
    return err("Failed to update workflow", 500);
  }
}
