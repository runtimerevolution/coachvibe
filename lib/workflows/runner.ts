import { getConnection } from "@/lib/integrations/connection";
import { getIntegrationDef } from "@/lib/integrations/registry";
import type { IntegrationConnection } from "@/lib/integrations/types";
import { getNextEvent } from "@/lib/integrations/google-calendar";
import { createDraft } from "@/lib/integrations/gmail";

export interface RunContext {
  coachId: string;
  templateId: string;
}

interface RealStep {
  /** A registered (Nango-backed) service id. */
  connector: string;
  /** The action to invoke on that connector. */
  intent: string;
}

export interface StepResult {
  connector: string;
  intent: string;
  status: "completed" | "skipped" | "failed";
  data?: Record<string, unknown>;
  error?: string;
}

export interface RunResult {
  status: "completed" | "failed";
  output: Record<string, unknown>;
  steps: StepResult[];
}

/**
 * Per-template list of the REAL, runnable steps (the in-scope subset of a
 * template's full step list). To make another template runnable for real, add
 * an entry here — the rest of the runner is generic.
 */
const REAL_STEPS: Record<string, RealStep[]> = {
  "pre-session-brief": [
    { connector: "google-calendar", intent: "getNextEvent" },
    { connector: "gmail", intent: "createDraft" },
  ],
};

type ActionFn = (
  conn: IntegrationConnection,
  ctx: RunContext,
  prev: Record<string, StepResult>
) => Promise<Record<string, unknown>>;

/**
 * Dispatch table: connector -> intent -> action. Reused across templates.
 * A later step can read an earlier step's output via `prev["<connector>:<intent>"]`.
 */
const ACTIONS: Record<string, Record<string, ActionFn>> = {
  "google-calendar": {
    getNextEvent: async (conn) => {
      const event = await getNextEvent(conn);
      if (!event) {
        return { calendarEventId: null, eventSummary: null, eventStart: null, noUpcomingEvent: true };
      }
      return { calendarEventId: event.id, eventSummary: event.summary, eventStart: event.start };
    },
  },
  gmail: {
    createDraft: async (conn, _ctx, prev) => {
      const ev = (prev["google-calendar:getNextEvent"]?.data ?? {}) as {
        eventSummary?: string | null;
        eventStart?: string | null;
      };
      const { subject, body } = buildPrepEmail(ev);
      const draft = await createDraft(conn, { subject, body });
      return { gmailDraftId: draft.id };
    },
  },
};

/** Build a simple, deterministic prep email (no AI — cheap and test-friendly). */
function buildPrepEmail(ev: { eventSummary?: string | null; eventStart?: string | null }): {
  subject: string;
  body: string;
} {
  const title = ev.eventSummary || "your next session";
  const when = ev.eventStart ? new Date(ev.eventStart).toLocaleString() : "soon";
  return {
    subject: `Prep: ${title}`,
    body: [
      `Quick prep for "${title}" (${when}):`,
      "",
      "• Review your last session notes and action items",
      "• Confirm the client's current focus area",
      "• Prepare 2-3 questions to open the session",
      "",
      "— Drafted automatically by CoachOS",
    ].join("\n"),
  };
}

/** The distinct services a template's real steps require. */
export function requiredServicesFor(templateId: string): string[] {
  const steps = REAL_STEPS[templateId] ?? [];
  return Array.from(new Set(steps.map((s) => s.connector)));
}

/** True if the template has real, runnable steps defined. */
export function isRunnable(templateId: string): boolean {
  return (REAL_STEPS[templateId] ?? []).length > 0;
}

export interface ConnectionCheck {
  ok: boolean;
  /** Display names of integrations that still need connecting. */
  missing: string[];
}

/** Verify the coach has connected every integration the template requires. */
export async function assertConnections(
  coachId: string,
  templateId: string
): Promise<ConnectionCheck> {
  const missing: string[] = [];
  for (const service of requiredServicesFor(templateId)) {
    const conn = await getConnection(coachId, service);
    if (!conn) {
      missing.push(getIntegrationDef(service)?.displayName ?? service);
    }
  }
  return { ok: missing.length === 0, missing };
}

/**
 * Execute a template's real steps in order, dispatching each to its integration
 * action. Never throws for step-level failures — it records them and stops the
 * chain (later steps depend on earlier output), returning a structured result.
 */
export async function runWorkflow(ctx: RunContext): Promise<RunResult> {
  const { coachId, templateId } = ctx;
  const steps = REAL_STEPS[templateId] ?? [];

  if (steps.length === 0) {
    return { status: "failed", output: { error: "No real steps defined for this template" }, steps: [] };
  }

  const results: StepResult[] = [];
  const byKey: Record<string, StepResult> = {};

  for (const step of steps) {
    const key = `${step.connector}:${step.intent}`;
    const action = ACTIONS[step.connector]?.[step.intent];

    // Unsupported connector/intent → skip (don't abort the chain).
    if (!action) {
      const r: StepResult = { connector: step.connector, intent: step.intent, status: "skipped" };
      results.push(r);
      byKey[key] = r;
      continue;
    }

    const conn = await getConnection(coachId, step.connector);
    if (!conn) {
      const r: StepResult = {
        connector: step.connector,
        intent: step.intent,
        status: "failed",
        error: `${step.connector} is not connected`,
      };
      results.push(r);
      byKey[key] = r;
      break;
    }

    try {
      const data = await action(conn, ctx, byKey);
      const r: StepResult = { connector: step.connector, intent: step.intent, status: "completed", data };
      results.push(r);
      byKey[key] = r;
    } catch (e) {
      const r: StepResult = {
        connector: step.connector,
        intent: step.intent,
        status: "failed",
        error: e instanceof Error ? e.message : String(e),
      };
      results.push(r);
      byKey[key] = r;
      break;
    }
  }

  const failed = results.some((r) => r.status === "failed");

  // Flatten each step's data onto the top-level output for easy display.
  const output: Record<string, unknown> = { templateId, steps: results };
  for (const r of results) {
    if (r.data) Object.assign(output, r.data);
  }
  if (failed) {
    output.error = results.find((r) => r.status === "failed")?.error;
  }

  return { status: failed ? "failed" : "completed", output, steps: results };
}
