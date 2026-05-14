import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { PATCH } from "./route";

const mocks = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
  notificationFindFirstMock: vi.fn(),
  notificationUpdateMock: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  requireAuth: mocks.requireAuthMock,
}));

vi.mock("@/lib/db", () => ({
  default: {
    notification: {
      findFirst: mocks.notificationFindFirstMock,
      update: mocks.notificationUpdateMock,
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

const routeParams = { params: { id: "notif_1" } };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAuthMock.mockReturnValue("coach_test_id");
});

describe("PATCH /api/notifications/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    mocks.requireAuthMock.mockReturnValue(null);

    const response = await PATCH(patchRequest({ read: true }), routeParams);
    expect(response.status).toBe(401);
  });

  it("marks a notification as read", async () => {
    mocks.notificationFindFirstMock.mockResolvedValueOnce({ id: "notif_1", coachId: "coach_test_id" });
    mocks.notificationUpdateMock.mockResolvedValueOnce({ id: "notif_1", read: true });

    const response = await PATCH(patchRequest({ read: true }), routeParams);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.notificationUpdateMock).toHaveBeenCalledWith({
      where: { id: "notif_1" },
      data: { read: true },
    });
  });

  it("dismisses a notification", async () => {
    mocks.notificationFindFirstMock.mockResolvedValueOnce({ id: "notif_1", coachId: "coach_test_id" });
    mocks.notificationUpdateMock.mockResolvedValueOnce({ id: "notif_1", dismissed: true });

    const response = await PATCH(patchRequest({ dismissed: true }), routeParams);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.notificationUpdateMock).toHaveBeenCalledWith({
      where: { id: "notif_1" },
      data: { dismissed: true },
    });
  });

  it("returns 404 when notification does not belong to the coach", async () => {
    mocks.notificationFindFirstMock.mockResolvedValueOnce(null);

    const response = await PATCH(patchRequest({ read: true }), routeParams);
    expect(response.status).toBe(404);
  });
});
