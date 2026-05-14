import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
  workflowFindFirstMock: vi.fn(),
  workflowRunCreateMock: vi.fn(),
  deductCreditsMock: vi.fn(),
  logActivityMock: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  requireAuth: mocks.requireAuthMock,
}));

vi.mock("@/lib/db", () => ({
  default: {
    workflowInstance: {
      findFirst: mocks.workflowFindFirstMock,
    },
    workflowRun: {
      create: mocks.workflowRunCreateMock,
    },
  },
}));

vi.mock("@/lib/credits", () => ({
  deductCredits: mocks.deductCreditsMock,
}));

vi.mock("@/lib/activity", () => ({
  logActivity: mocks.logActivityMock,
}));

function jsonRequest(body: unknown): NextRequest {
  return new Request("https://example.com", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAuthMock.mockReturnValue("coach_test_id");
  mocks.deductCreditsMock.mockResolvedValue(true);
  mocks.logActivityMock.mockResolvedValue(undefined);
});

describe("POST /api/workflow/simulate", () => {
  it("returns 401 when unauthenticated", async () => {
    mocks.requireAuthMock.mockReturnValue(null);

    const response = await POST(jsonRequest({ templateId: "client-onboarding" }));
    expect(response.status).toBe(401);
  });

  it("returns 400 when the workflow instance does not exist or is not active", async () => {
    mocks.workflowFindFirstMock.mockResolvedValueOnce(null);

    const response = await POST(jsonRequest({ templateId: "client-onboarding" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it("returns 400 when templateId is missing from the request", async () => {
    const response = await POST(jsonRequest({}));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it("returns 402 when the coach has insufficient credits", async () => {
    mocks.workflowFindFirstMock.mockResolvedValueOnce({
      id: "wf_1",
      coachId: "coach_test_id",
      templateId: "client-onboarding",
      active: true,
    });
    mocks.deductCreditsMock.mockResolvedValueOnce(false);

    const response = await POST(jsonRequest({ templateId: "client-onboarding" }));
    const body = await response.json();

    expect(response.status).toBe(402);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/credits/i);
  });

  it("creates a workflow run with simulated output and returns success", async () => {
    mocks.workflowFindFirstMock.mockResolvedValueOnce({
      id: "wf_1",
      coachId: "coach_test_id",
      templateId: "client-onboarding",
      active: true,
    });
    mocks.workflowRunCreateMock.mockResolvedValueOnce({
      id: "run_1",
      workflowId: "wf_1",
      status: "completed",
      creditCost: 5,
      output: { simulatedAt: "2026-05-14T10:00:00.000Z", result: { emailDraftCreated: true } },
      startedAt: new Date(),
      completedAt: new Date(),
    });

    const response = await POST(jsonRequest({ templateId: "client-onboarding" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.run.status).toBe("completed");
    expect(body.data.run.output).toBeDefined();
    expect(mocks.workflowRunCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          workflowId: "wf_1",
          status: "completed",
        }),
      })
    );
    expect(mocks.logActivityMock).toHaveBeenCalled();
  });
});
