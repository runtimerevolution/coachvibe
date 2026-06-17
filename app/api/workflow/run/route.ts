import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { ok, err, unauthorized } from "@/lib/api-response";
import { deductCredits } from "@/lib/credits";
import { logActivity } from "@/lib/activity";
import { getTemplate } from "@/lib/workflow-templates";
import { runWorkflow, assertConnections, isRunnable, type RunResult } from "@/lib/workflows/runner";

export const dynamic = "force-dynamic";

/**
 * Manually trigger a REAL workflow run. Unlike /api/workflow/simulate (which
 * returns mock output), this calls live integrations via Nango.
 *
 * Contract mirrors simulate (auth → active instance → credits → run → activity)
 * with two improvements: connections are checked BEFORE charging, and a failed
 * run is still recorded so a deducted credit always has a WorkflowRun.
 */
export async function POST(req: NextRequest) {
  const coachId = requireAuth(req);
  if (!coachId) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const { templateId } = body as { templateId?: string };
  if (!templateId) return err("templateId is required");

  const template = getTemplate(templateId);
  if (!template) return err("Unknown template");
  if (!isRunnable(templateId)) {
    return err("This workflow does not support real execution yet");
  }

  const instance = await prisma.workflowInstance.findFirst({
    where: { coachId, templateId, active: true },
  });
  if (!instance) return err("Workflow not found or not active");

  // Guard BEFORE charging: require every integration the workflow needs.
  const check = await assertConnections(coachId, templateId);
  if (!check.ok) {
    return err(`Connect ${check.missing.join(" and ")} to run this workflow`);
  }

  const creditCost = template.creditCost ?? 1;
  const hasCredits = await deductCredits(coachId, creditCost, "workflow.run");
  if (!hasCredits) return err("Insufficient credits", 402);

  // The runner does not throw for step-level failures, but guard the unexpected
  // so a deducted credit always ends up with a recorded run.
  let result: RunResult;
  try {
    result = await runWorkflow({ coachId, templateId });
  } catch (e) {
    result = {
      status: "failed",
      output: { error: e instanceof Error ? e.message : "Unexpected error" },
      steps: [],
    };
  }

  const run = await prisma.workflowRun.create({
    data: {
      workflowId: instance.id,
      status: result.status,
      creditCost,
      output: { ranAt: new Date().toISOString(), ...result.output } as object,
      startedAt: new Date(),
      completedAt: new Date(),
    },
  });

  await logActivity(coachId, "workflow.run", `${template.name} ran (${result.status})`, {
    templateId,
    runId: run.id,
    status: result.status,
  });

  return ok({ run });
}
