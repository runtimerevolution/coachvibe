import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { ok, err, unauthorized } from "@/lib/api-response";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const coachId = requireAuth(req);
  if (!coachId) return unauthorized();

  try {
    const body = await req.json();
    if (!body.name?.trim()) return err("name is required");

    const templateId = `custom-${Date.now()}`;

    const workflow = await prisma.workflowInstance.create({
      data: {
        coachId,
        templateId,
        active: false,
        customName: body.name.trim(),
        customDescription: body.description?.trim() || null,
        customSteps: Array.isArray(body.steps) ? body.steps : [],
      },
    });

    await logActivity(coachId, "workflow.created", `Workflow "${workflow.customName}" created`);

    return ok({ workflow });
  } catch (error) {
    console.error("Create workflow failed:", error);
    return err("Failed to create workflow", 500);
  }
}
