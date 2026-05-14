import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { GET } from "./route";

const mocks = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
  workflowFindManyMock: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  requireAuth: mocks.requireAuthMock,
}));

vi.mock("@/lib/db", () => ({
  default: {
    workflowInstance: {
      findMany: mocks.workflowFindManyMock,
    },
  },
}));

const req = new Request("https://example.com") as unknown as NextRequest;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAuthMock.mockReturnValue("coach_test_id");
});

describe("GET /api/workflow/runs", () => {
  it("returns 401 when unauthenticated", async () => {
    mocks.requireAuthMock.mockReturnValue(null);

    const response = await GET(req);
    expect(response.status).toBe(401);
  });

  it("returns workflow instances with nested runs", async () => {
    const workflows = [
      {
        id: "wf_1",
        templateId: "client-onboarding",
        active: true,
        runs: [
          { id: "run_1", status: "completed", creditCost: 5, startedAt: new Date(), completedAt: new Date() },
        ],
      },
      {
        id: "wf_2",
        templateId: "post-session-intelligence",
        active: false,
        runs: [],
      },
    ];
    mocks.workflowFindManyMock.mockResolvedValueOnce(workflows);

    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.workflows).toHaveLength(2);
    expect(body.data.workflows[0].runs).toHaveLength(1);
    expect(body.data.workflows[1].runs).toHaveLength(0);
    expect(mocks.workflowFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { coachId: "coach_test_id" },
        include: expect.objectContaining({ runs: expect.anything() }),
      })
    );
  });

  it("returns an empty array when coach has no workflows", async () => {
    mocks.workflowFindManyMock.mockResolvedValueOnce([]);

    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.workflows).toEqual([]);
  });
});
