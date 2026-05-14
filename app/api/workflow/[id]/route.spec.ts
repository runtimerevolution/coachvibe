import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { PATCH, DELETE } from "./route";

const mocks = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
  workflowFindFirstMock: vi.fn(),
  workflowUpdateMock: vi.fn(),
  workflowDeleteMock: vi.fn(),
  activityLogCreateMock: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  requireAuth: mocks.requireAuthMock,
}));

vi.mock("@/lib/db", () => ({
  default: {
    workflowInstance: {
      findFirst: mocks.workflowFindFirstMock,
      update: mocks.workflowUpdateMock,
      delete: mocks.workflowDeleteMock,
    },
    activityLog: {
      create: mocks.activityLogCreateMock,
    },
  },
}));

function jsonRequest(body: unknown): NextRequest {
  return new Request("https://example.com", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

const deleteReq = new Request("https://example.com", { method: "DELETE" }) as unknown as NextRequest;
const params = { params: { id: "wf_1" } };

const existingWorkflow = { id: "wf_1", coachId: "coach_test_id", templateId: "custom-123", customName: "My workflow", active: false };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAuthMock.mockReturnValue("coach_test_id");
  mocks.activityLogCreateMock.mockResolvedValue({});
});

describe("PATCH /api/workflow/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    mocks.requireAuthMock.mockReturnValue(null);
    const response = await PATCH(jsonRequest({ active: true }), params);
    expect(response.status).toBe(401);
  });

  it("returns 404 when workflow does not belong to coach", async () => {
    mocks.workflowFindFirstMock.mockResolvedValueOnce(null);
    const response = await PATCH(jsonRequest({ active: true }), params);
    expect(response.status).toBe(404);
  });

  it("updates active state", async () => {
    mocks.workflowFindFirstMock.mockResolvedValueOnce(existingWorkflow);
    mocks.workflowUpdateMock.mockResolvedValueOnce({ ...existingWorkflow, active: true });

    const response = await PATCH(jsonRequest({ active: true }), params);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.workflowUpdateMock).toHaveBeenCalledWith({
      where: { id: "wf_1" },
      data: expect.objectContaining({ active: true }),
    });
  });

  it("updates customName and customDescription", async () => {
    mocks.workflowFindFirstMock.mockResolvedValueOnce(existingWorkflow);
    mocks.workflowUpdateMock.mockResolvedValueOnce({ ...existingWorkflow, customName: "Updated", customDescription: "New desc" });

    const response = await PATCH(jsonRequest({ customName: "Updated", customDescription: "New desc" }), params);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.workflowUpdateMock).toHaveBeenCalledWith({
      where: { id: "wf_1" },
      data: expect.objectContaining({ customName: "Updated", customDescription: "New desc" }),
    });
  });

  it("updates customSteps", async () => {
    const steps = [{ label: "Send email", type: "action" }];
    mocks.workflowFindFirstMock.mockResolvedValueOnce(existingWorkflow);
    mocks.workflowUpdateMock.mockResolvedValueOnce({ ...existingWorkflow, customSteps: steps });

    const response = await PATCH(jsonRequest({ customSteps: steps }), params);

    expect(response.status).toBe(200);
    expect(mocks.workflowUpdateMock).toHaveBeenCalledWith({
      where: { id: "wf_1" },
      data: expect.objectContaining({ customSteps: steps }),
    });
  });
});

describe("DELETE /api/workflow/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    mocks.requireAuthMock.mockReturnValue(null);
    const response = await DELETE(deleteReq, params);
    expect(response.status).toBe(401);
  });

  it("returns 404 when workflow does not belong to coach", async () => {
    mocks.workflowFindFirstMock.mockResolvedValueOnce(null);
    const response = await DELETE(deleteReq, params);
    expect(response.status).toBe(404);
  });

  it("deletes the workflow and logs activity", async () => {
    mocks.workflowFindFirstMock.mockResolvedValueOnce(existingWorkflow);
    mocks.workflowDeleteMock.mockResolvedValueOnce({});

    const response = await DELETE(deleteReq, params);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.workflowDeleteMock).toHaveBeenCalledWith({ where: { id: "wf_1" } });
    expect(mocks.activityLogCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        coachId: "coach_test_id",
        action: "workflow.deleted",
      }),
    });
  });
});
