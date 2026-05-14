import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { ok, err, unauthorized } from "@/lib/api-response";
import { deductCredits } from "@/lib/credits";
import { logActivity } from "@/lib/activity";
import { getTemplate } from "@/lib/workflow-templates";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const coachId = requireAuth(req);
  if (!coachId) return unauthorized();

  const body = await req.json();
  const { templateId } = body;

  if (!templateId) return err("templateId is required");

  const instance = await prisma.workflowInstance.findFirst({
    where: { coachId, templateId, active: true },
  });
  if (!instance) return err("Workflow not found or not active");

  const template = getTemplate(templateId);
  const creditCost = template?.creditCost ?? 1;

  const hasCredits = await deductCredits(coachId, creditCost, "workflow.run");
  if (!hasCredits) return err("Insufficient credits", 402);

  const run = await prisma.workflowRun.create({
    data: {
      workflowId: instance.id,
      status: "completed",
      creditCost,
      output: {
        simulatedAt: new Date().toISOString(),
        result: getSimulatedOutput(templateId) as Record<string, string | boolean | number | null>,
      } as object,
      startedAt: new Date(),
      completedAt: new Date(),
    },
  });

  await logActivity(coachId, "workflow.run", `${template?.name ?? templateId} ran successfully`, { templateId });

  return ok({ run });
}

function getSimulatedOutput(templateId: string): Record<string, unknown> {
  const outputs: Record<string, Record<string, unknown>> = {
    "client-onboarding": { emailDraftCreated: true, crmRecordCreated: true, calendarEventId: "cal_sim_001" },
    "post-session-intelligence": { notesGenerated: "3 key themes identified", followUpDraftReady: true },
    "pre-session-brief": { briefGenerated: true, focusAreas: ["Review action items", "Explore new challenge"] },
    "weekly-outreach": { contactsFound: 10, draftsCreated: 10 },
    "newsletter-draft": { wordCount: 480, draftSaved: true },
    "ai-conversation-followup": { contactsAdded: 1, sequenceDrafted: true },
    "social-media-scheduling": { linkedInPostScheduled: true, instagramPostScheduled: true },
    "invoice-automation": { invoiceGenerated: true },
  };
  return outputs[templateId] ?? { completed: true };
}
