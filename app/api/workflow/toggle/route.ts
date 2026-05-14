import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { ok, err, unauthorized } from "@/lib/api-response";
import { logActivity } from "@/lib/activity";
import { createNotification } from "@/lib/notifications";
import { getTemplate } from "@/lib/workflow-templates";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const coachId = requireAuth(req);
  if (!coachId) return unauthorized();

  try {
    const { templateId, active } = await req.json();
    if (!templateId) return err("templateId is required");

    const instance = await prisma.workflowInstance.upsert({
      where: { coachId_templateId: { coachId, templateId } },
      update: { active },
      create: { coachId, templateId, active },
    });

    const template = getTemplate(templateId);
    const name = template?.name ?? templateId;

    await logActivity(
      coachId,
      active ? "workflow.activated" : "workflow.deactivated",
      active ? `${name} is now active` : `${name} deactivated`,
      { templateId }
    );

    if (active) {
      await createNotification(coachId, {
        title: `${name} activated`,
        body: `Your workflow is now running and saving you ~${template?.timeSaved ?? "time"} per run.`,
        type: "success",
      });

      // Trigger an immediate simulated run
      if (template) {
        await prisma.workflowRun.create({
          data: {
            workflowId: instance.id,
            status: "completed",
            creditCost: template.creditCost,
            output: {
              simulatedAt: new Date().toISOString(),
              result: getSimulatedOutput(templateId),
            } as object,
            startedAt: new Date(),
            completedAt: new Date(),
          },
        });
      }
    }

    return ok({ active });
  } catch (error) {
    console.error("Workflow toggle failed:", error);
    return err("Toggle failed", 500);
  }
}

function getSimulatedOutput(templateId: string): Record<string, unknown> {
  const outputs: Record<string, Record<string, unknown>> = {
    "client-onboarding": { emailDraftCreated: true, crmRecordCreated: true, calendarEventId: "cal_sim_001" },
    "post-session-intelligence": { notesGenerated: "3 key themes identified", followUpDraftReady: true, themesExtracted: ["goal clarity", "pricing confidence", "time management"] },
    "pre-session-brief": { briefGenerated: true, focusAreas: ["Review last session action items", "Explore new business challenge"] },
    "weekly-outreach": { contactsFound: 10, draftsCreated: 10, estimatedReplies: "2-3" },
    "newsletter-draft": { wordCount: 480, topicsIdentified: 3, draftSaved: true },
    "ai-conversation-followup": { contactsAdded: 1, sequenceDrafted: true, followUpCount: 3 },
    "social-media-scheduling": { linkedInPostScheduled: true, instagramPostScheduled: true },
    "invoice-automation": { invoiceGenerated: true, invoiceNumber: "INV-SIM-001", amount: "£0 (simulated)" },
  };
  return outputs[templateId] ?? { completed: true };
}
