import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { DELETE, PATCH } from "./route";

const mocks = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
  taskFindFirstMock: vi.fn(),
  taskUpdateMock: vi.fn(),
  taskDeleteMock: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  requireAuth: mocks.requireAuthMock,
}));

vi.mock("@/lib/db", () => ({
  default: {
    conciergeTask: {
      findFirst: mocks.taskFindFirstMock,
      update: mocks.taskUpdateMock,
      delete: mocks.taskDeleteMock,
    },
  },
}));

function patchRequest(body: unknown): NextRequest {
  return new Request("https://example.com", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

const deleteReq = new Request("https://example.com", { method: "DELETE" }) as unknown as NextRequest;

const routeParams = { params: { id: "task_1" } };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAuthMock.mockReturnValue("coach_test_id");
});

describe("PATCH /api/concierge/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    mocks.requireAuthMock.mockReturnValue(null);

    const response = await PATCH(patchRequest({ status: "done" }), routeParams);
    expect(response.status).toBe(401);
  });

  it("returns 404 when task does not belong to the coach", async () => {
    mocks.taskFindFirstMock.mockResolvedValueOnce(null);

    const response = await PATCH(patchRequest({ status: "done" }), routeParams);
    expect(response.status).toBe(404);
  });

  it("updates task status to done", async () => {
    mocks.taskFindFirstMock.mockResolvedValueOnce({ id: "task_1", coachId: "coach_test_id" });
    mocks.taskUpdateMock.mockResolvedValueOnce({ id: "task_1", status: "done" });

    const response = await PATCH(patchRequest({ status: "done" }), routeParams);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.taskUpdateMock).toHaveBeenCalledWith({
      where: { id: "task_1" },
      data: { status: "done" },
    });
  });

  it("updates title, description, and priority", async () => {
    mocks.taskFindFirstMock.mockResolvedValueOnce({ id: "task_1", coachId: "coach_test_id" });
    mocks.taskUpdateMock.mockResolvedValueOnce({ id: "task_1" });

    await PATCH(
      patchRequest({ title: "Updated title", description: "New desc", priority: "low" }),
      routeParams
    );

    expect(mocks.taskUpdateMock).toHaveBeenCalledWith({
      where: { id: "task_1" },
      data: { title: "Updated title", description: "New desc", priority: "low" },
    });
  });
});

describe("DELETE /api/concierge/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    mocks.requireAuthMock.mockReturnValue(null);

    const response = await DELETE(deleteReq, routeParams);
    expect(response.status).toBe(401);
  });

  it("returns 404 when task does not belong to the coach", async () => {
    mocks.taskFindFirstMock.mockResolvedValueOnce(null);

    const response = await DELETE(deleteReq, routeParams);
    expect(response.status).toBe(404);
  });

  it("deletes the task and returns success", async () => {
    mocks.taskFindFirstMock.mockResolvedValueOnce({ id: "task_1", coachId: "coach_test_id" });
    mocks.taskDeleteMock.mockResolvedValueOnce({ id: "task_1" });

    const response = await DELETE(deleteReq, routeParams);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.taskDeleteMock).toHaveBeenCalledWith({ where: { id: "task_1" } });
  });
});
