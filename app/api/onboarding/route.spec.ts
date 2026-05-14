import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
  coachUpdateMock: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  requireAuth: mocks.requireAuthMock,
}));

vi.mock("@/lib/db", () => ({
  default: {
    coach: {
      update: mocks.coachUpdateMock,
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
  mocks.coachUpdateMock.mockResolvedValue({ id: "coach_test_id" });
});

describe("POST /api/onboarding/goals", () => {
  it("returns 401 when unauthenticated", async () => {
    mocks.requireAuthMock.mockReturnValue(null);

    const response = await POST(jsonRequest({ goals: ["grow_revenue"], hoursPerWeek: 5 }));
    expect(response.status).toBe(401);
  });

  it("updates coach goals and hoursPerWeek", async () => {
    const response = await POST(
      jsonRequest({ goals: ["grow_revenue", "automate_workflows"], hoursPerWeek: 10 })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.coachUpdateMock).toHaveBeenCalledWith({
      where: { id: "coach_test_id" },
      data: {
        goals: ["grow_revenue", "automate_workflows"],
        hoursPerWeek: 10,
      },
    });
  });

  it("accepts an empty goals array", async () => {
    const response = await POST(jsonRequest({ goals: [], hoursPerWeek: 5 }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.coachUpdateMock).toHaveBeenCalledWith({
      where: { id: "coach_test_id" },
      data: { goals: [], hoursPerWeek: 5 },
    });
  });
});
