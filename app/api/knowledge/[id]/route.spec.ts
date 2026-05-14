import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { DELETE, PATCH } from "./route";

const mocks = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
  entryFindFirstMock: vi.fn(),
  entryUpdateMock: vi.fn(),
  entryDeleteMock: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  requireAuth: mocks.requireAuthMock,
}));

vi.mock("@/lib/db", () => ({
  default: {
    knowledgeEntry: {
      findFirst: mocks.entryFindFirstMock,
      update: mocks.entryUpdateMock,
      delete: mocks.entryDeleteMock,
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
const routeParams = { params: { id: "ke_1" } };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAuthMock.mockReturnValue("coach_test_id");
});

describe("PATCH /api/knowledge/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    mocks.requireAuthMock.mockReturnValue(null);

    const response = await PATCH(patchRequest({ title: "New title" }), routeParams);
    expect(response.status).toBe(401);
  });

  it("returns 404 when entry does not belong to the coach", async () => {
    mocks.entryFindFirstMock.mockResolvedValueOnce(null);

    const response = await PATCH(patchRequest({ title: "New title" }), routeParams);
    expect(response.status).toBe(404);
  });

  it("updates content and tags", async () => {
    mocks.entryFindFirstMock.mockResolvedValueOnce({ id: "ke_1", coachId: "coach_test_id" });
    mocks.entryUpdateMock.mockResolvedValueOnce({ id: "ke_1" });

    const response = await PATCH(
      patchRequest({ content: "Updated content", tags: ["updated", "tags"] }),
      routeParams
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.entryUpdateMock).toHaveBeenCalledWith({
      where: { id: "ke_1" },
      data: { content: "Updated content", tags: ["updated", "tags"] },
    });
  });
});

describe("DELETE /api/knowledge/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    mocks.requireAuthMock.mockReturnValue(null);

    const response = await DELETE(deleteReq, routeParams);
    expect(response.status).toBe(401);
  });

  it("returns 404 when entry does not belong to the coach", async () => {
    mocks.entryFindFirstMock.mockResolvedValueOnce(null);

    const response = await DELETE(deleteReq, routeParams);
    expect(response.status).toBe(404);
  });

  it("deletes the entry and returns success", async () => {
    mocks.entryFindFirstMock.mockResolvedValueOnce({ id: "ke_1", coachId: "coach_test_id" });
    mocks.entryDeleteMock.mockResolvedValueOnce({ id: "ke_1" });

    const response = await DELETE(deleteReq, routeParams);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.entryDeleteMock).toHaveBeenCalledWith({ where: { id: "ke_1" } });
  });
});
