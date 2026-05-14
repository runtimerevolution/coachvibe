import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { GET, POST } from "./route";

const mocks = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
  taskFindManyMock: vi.fn(),
  taskCreateMock: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  requireAuth: mocks.requireAuthMock,
}));

vi.mock("@/lib/db", () => ({
  default: {
    conciergeTask: {
      findMany: mocks.taskFindManyMock,
      create: mocks.taskCreateMock,
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

const getReq = new Request("https://example.com") as unknown as NextRequest;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAuthMock.mockReturnValue("coach_test_id");
});

describe("GET /api/concierge", () => {
  it("returns 401 when unauthenticated", async () => {
    mocks.requireAuthMock.mockReturnValue(null);

    const response = await GET(getReq);
    expect(response.status).toBe(401);
  });

  it("returns tasks for the authenticated coach", async () => {
    const tasks = [
      { id: "task_1", title: "Update welcome email", status: "pending", priority: "high", points: 20, timeMinutes: 30, source: "ai" },
      { id: "task_2", title: "Review Q2 goals", status: "in_progress", priority: "medium", points: 10, timeMinutes: 15, source: "manual" },
    ];
    mocks.taskFindManyMock.mockResolvedValueOnce(tasks);

    const response = await GET(getReq);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.tasks).toHaveLength(2);
    expect(mocks.taskFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { coachId: "coach_test_id" } })
    );
  });

  it("returns an empty array when the coach has no tasks", async () => {
    mocks.taskFindManyMock.mockResolvedValueOnce([]);

    const response = await GET(getReq);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.tasks).toEqual([]);
  });
});

describe("POST /api/concierge", () => {
  it("returns 401 when unauthenticated", async () => {
    mocks.requireAuthMock.mockReturnValue(null);

    const response = await POST(jsonRequest({ title: "New task" }));
    expect(response.status).toBe(401);
  });

  it("creates a task with defaults for optional fields", async () => {
    mocks.taskCreateMock.mockResolvedValueOnce({
      id: "task_new",
      coachId: "coach_test_id",
      title: "Post on LinkedIn",
      status: "pending",
      priority: "medium",
      source: "manual",
      points: 10,
      timeMinutes: 15,
    });

    const response = await POST(jsonRequest({ title: "Post on LinkedIn" }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(mocks.taskCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        coachId: "coach_test_id",
        title: "Post on LinkedIn",
        status: "pending",
        priority: "medium",
        source: "manual",
      }),
    });
  });

  it("creates a task with a specified priority", async () => {
    mocks.taskCreateMock.mockResolvedValueOnce({
      id: "task_new",
      coachId: "coach_test_id",
      title: "Critical task",
      status: "pending",
      priority: "high",
      source: "manual",
      points: 10,
      timeMinutes: 15,
    });

    const response = await POST(jsonRequest({ title: "Critical task", priority: "high" }));

    expect(mocks.taskCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({ priority: "high" }),
    });
  });

  it("returns 400 when title is missing", async () => {
    const response = await POST(jsonRequest({ priority: "high" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });
});
