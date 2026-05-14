import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { GET } from "./route";

const mocks = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
  activityLogFindManyMock: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  requireAuth: mocks.requireAuthMock,
}));

vi.mock("@/lib/db", () => ({
  default: {
    activityLog: {
      findMany: mocks.activityLogFindManyMock,
    },
  },
}));

const req = new Request("https://example.com") as unknown as NextRequest;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAuthMock.mockReturnValue("coach_test_id");
});

describe("GET /api/activity", () => {
  it("returns 401 when unauthenticated", async () => {
    mocks.requireAuthMock.mockReturnValue(null);

    const response = await GET(req);
    expect(response.status).toBe(401);
  });

  it("returns activity log entries for the coach ordered by createdAt desc", async () => {
    const entries = [
      { id: "log_2", action: "workflow.run", label: "Client Onboarding ran", createdAt: new Date("2026-05-14T10:00:00Z") },
      { id: "log_1", action: "onboarding.completed", label: "Onboarding complete", createdAt: new Date("2026-05-14T09:00:00Z") },
    ];
    mocks.activityLogFindManyMock.mockResolvedValueOnce(entries);

    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.activity).toHaveLength(2);
    expect(body.data.activity[0].id).toBe("log_2");
    expect(mocks.activityLogFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { coachId: "coach_test_id" },
        orderBy: { createdAt: "desc" },
        take: 20,
      })
    );
  });

  it("returns an empty array when the coach has no activity", async () => {
    mocks.activityLogFindManyMock.mockResolvedValueOnce([]);

    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.activity).toEqual([]);
  });
});
