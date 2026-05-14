import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
  workflowCreateMock: vi.fn(),
  activityLogCreateMock: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  requireAuth: mocks.requireAuthMock,
}));

vi.mock("@/lib/db", () => ({
  default: {
    workflowInstance: {
      create: mocks.workflowCreateMock,
    },
    activityLog: {
      create: mocks.activityLogCreateMock,
    },
  },
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
  mocks.activityLogCreateMock.mockResolvedValue({});
});

describe("POST /api/workflow", () => {
  it("returns 401 when unauthenticated", async () => {
    mocks.requireAuthMock.mockReturnValue(null);
    const response = await POST(jsonRequest({ name: "My workflow" }));
    expect(response.status).toBe(401);
  });

  it("returns 400 when name is missing", async () => {
    const response = await POST(jsonRequest({}));
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toMatch(/name/i);
  });

  it("creates a custom workflow with name, description and steps", async () => {
    const created = {
      id: "wf_custom_1",
      coachId: "coach_test_id",
      templateId: "custom-1234567890",
      active: false,
      customName: "Weekly check-in",
      customDescription: "Send a weekly email to clients",
      customSteps: [{ label: "Send email", type: "action" }],
    };
    mocks.workflowCreateMock.mockResolvedValueOnce(created);

    const response = await POST(jsonRequest({
      name: "Weekly check-in",
      description: "Send a weekly email to clients",
      steps: [{ label: "Send email", type: "action" }],
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.workflow.customName).toBe("Weekly check-in");
    expect(mocks.workflowCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        coachId: "coach_test_id",
        active: false,
        customName: "Weekly check-in",
        customDescription: "Send a weekly email to clients",
        customSteps: [{ label: "Send email", type: "action" }],
      }),
    });
  });

  it("creates a workflow with empty steps when none provided", async () => {
    const created = { id: "wf_2", coachId: "coach_test_id", templateId: "custom-9999", active: false, customName: "Simple", customDescription: null, customSteps: [] };
    mocks.workflowCreateMock.mockResolvedValueOnce(created);

    const response = await POST(jsonRequest({ name: "Simple" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.workflowCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({ customSteps: [] }),
    });
  });

  it("logs activity after creation", async () => {
    mocks.workflowCreateMock.mockResolvedValueOnce({ id: "wf_3", customName: "Test workflow", templateId: "custom-1" });

    await POST(jsonRequest({ name: "Test workflow" }));

    expect(mocks.activityLogCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        coachId: "coach_test_id",
        action: "workflow.created",
      }),
    });
  });
});
