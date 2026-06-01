import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
  workflowFindFirstMock: vi.fn(),
  workflowRunCreateMock: vi.fn(),
  deductCreditsMock: vi.fn(),
  logActivityMock: vi.fn(),
  runWorkflowMock: vi.fn(),
  assertConnectionsMock: vi.fn(),
  isRunnableMock: vi.fn(),
}));

vi.mock("@/lib/session", () => ({ requireAuth: mocks.requireAuthMock }));

vi.mock("@/lib/db", () => ({
  default: {
    workflowInstance: { findFirst: mocks.workflowFindFirstMock },
    workflowRun: { create: mocks.workflowRunCreateMock },
  },
}));

vi.mock("@/lib/credits", () => ({ deductCredits: mocks.deductCreditsMock }));
vi.mock("@/lib/activity", () => ({ logActivity: mocks.logActivityMock }));
vi.mock("@/lib/workflows/runner", () => ({
  runWorkflow: mocks.runWorkflowMock,
  assertConnections: mocks.assertConnectionsMock,
  isRunnable: mocks.isRunnableMock,
}));

function jsonRequest(body: unknown): NextRequest {
  return new Request("https://example.com", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

const TEMPLATE = "pre-session-brief"; // real template, creditCost = 3

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAuthMock.mockReturnValue("coach_test_id");
  mocks.deductCreditsMock.mockResolvedValue(true);
  mocks.logActivityMock.mockResolvedValue(undefined);
  mocks.isRunnableMock.mockReturnValue(true);
  mocks.assertConnectionsMock.mockResolvedValue({ ok: true, missing: [] });
  mocks.workflowFindFirstMock.mockResolvedValue({
    id: "wf_1",
    coachId: "coach_test_id",
    templateId: TEMPLATE,
    active: true,
  });
  // Echo the created row back (so body.data.run.output is the output we built).
  mocks.workflowRunCreateMock.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
    id: "run_1",
    ...data,
  }));
  mocks.runWorkflowMock.mockResolvedValue({
    status: "completed",
    output: {
      templateId: TEMPLATE,
      calendarEventId: "evt_1",
      eventSummary: "Call with Jane",
      gmailDraftId: "draft_123",
      steps: [],
    },
    steps: [],
  });
});

describe("POST /api/workflow/run", () => {
  it("returns 401 when unauthenticated", async () => {
    mocks.requireAuthMock.mockReturnValue(null);
    const res = await POST(jsonRequest({ templateId: TEMPLATE }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when templateId is missing", async () => {
    const res = await POST(jsonRequest({}));
    expect(res.status).toBe(400);
    expect((await res.json()).success).toBe(false);
  });

  it("returns 400 for an unknown template", async () => {
    const res = await POST(jsonRequest({ templateId: "does-not-exist" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when the template is not runnable for real", async () => {
    mocks.isRunnableMock.mockReturnValue(false);
    const res = await POST(jsonRequest({ templateId: "client-onboarding" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/real execution/i);
  });

  it("returns 400 when the workflow instance is missing or inactive", async () => {
    mocks.workflowFindFirstMock.mockResolvedValueOnce(null);
    const res = await POST(jsonRequest({ templateId: TEMPLATE }));
    expect(res.status).toBe(400);
  });

  it("blocks on missing connections WITHOUT charging credits or creating a run", async () => {
    mocks.assertConnectionsMock.mockResolvedValueOnce({ ok: false, missing: ["Google Calendar"] });
    const res = await POST(jsonRequest({ templateId: TEMPLATE }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/google calendar/i);
    expect(mocks.deductCreditsMock).not.toHaveBeenCalled();
    expect(mocks.workflowRunCreateMock).not.toHaveBeenCalled();
    expect(mocks.runWorkflowMock).not.toHaveBeenCalled();
  });

  it("returns 402 on insufficient credits and never runs the workflow", async () => {
    mocks.deductCreditsMock.mockResolvedValueOnce(false);
    const res = await POST(jsonRequest({ templateId: TEMPLATE }));
    const body = await res.json();

    expect(res.status).toBe(402);
    expect(body.error).toMatch(/credits/i);
    expect(mocks.runWorkflowMock).not.toHaveBeenCalled();
  });

  it("runs the workflow, records a completed run, charges the template cost", async () => {
    const res = await POST(jsonRequest({ templateId: TEMPLATE }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.run.status).toBe("completed");
    expect(body.data.run.output.gmailDraftId).toBe("draft_123");
    expect(body.data.run.output.eventSummary).toBe("Call with Jane");

    expect(mocks.deductCreditsMock).toHaveBeenCalledWith("coach_test_id", 3, "workflow.run");
    expect(mocks.workflowRunCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ workflowId: "wf_1", status: "completed" }),
      })
    );
    expect(mocks.logActivityMock).toHaveBeenCalled();
  });

  it("records a FAILED run (still charged once) when a step fails", async () => {
    mocks.runWorkflowMock.mockResolvedValueOnce({
      status: "failed",
      output: { templateId: TEMPLATE, calendarEventId: "evt_1", error: "gmail boom", steps: [] },
      steps: [],
    });

    const res = await POST(jsonRequest({ templateId: TEMPLATE }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.run.status).toBe("failed");
    expect(body.data.run.output.error).toBe("gmail boom");
    expect(mocks.deductCreditsMock).toHaveBeenCalledTimes(1);
    expect(mocks.workflowRunCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "failed" }) })
    );
  });
});
