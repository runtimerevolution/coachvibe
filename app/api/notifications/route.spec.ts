import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { GET, POST } from "./route";

const mocks = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
  notificationFindManyMock: vi.fn(),
  notificationCountMock: vi.fn(),
  notificationCreateMock: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  requireAuth: mocks.requireAuthMock,
}));

vi.mock("@/lib/db", () => ({
  default: {
    notification: {
      findMany: mocks.notificationFindManyMock,
      count: mocks.notificationCountMock,
      create: mocks.notificationCreateMock,
    },
  },
}));

const getReq = new Request("https://example.com") as unknown as NextRequest;

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
});

describe("GET /api/notifications", () => {
  it("returns 401 when unauthenticated", async () => {
    mocks.requireAuthMock.mockReturnValue(null);
    const response = await GET(getReq);
    expect(response.status).toBe(401);
  });

  it("returns only non-dismissed notifications for the coach", async () => {
    const notifications = [
      { id: "n_1", title: "Welcome!", body: "Ready.", type: "info", read: false, dismissed: false, createdAt: new Date() },
      { id: "n_2", title: "Low credits", body: "30 left.", type: "warning", read: true, dismissed: false, createdAt: new Date() },
    ];
    mocks.notificationFindManyMock.mockResolvedValueOnce(notifications);
    mocks.notificationCountMock.mockResolvedValueOnce(1);

    const response = await GET(getReq);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.notifications).toHaveLength(2);
    expect(body.data.unreadCount).toBe(1);
    expect(mocks.notificationFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { coachId: "coach_test_id", dismissed: false } })
    );
  });

  it("returns empty list when coach has no notifications", async () => {
    mocks.notificationFindManyMock.mockResolvedValueOnce([]);
    mocks.notificationCountMock.mockResolvedValueOnce(0);

    const response = await GET(getReq);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.notifications).toHaveLength(0);
    expect(body.data.unreadCount).toBe(0);
  });
});

describe("POST /api/notifications", () => {
  it("returns 401 when unauthenticated", async () => {
    mocks.requireAuthMock.mockReturnValue(null);
    const response = await POST(jsonRequest({}));
    expect(response.status).toBe(401);
  });

  it("creates a notification with a random demo title when no title provided", async () => {
    const created = { id: "n_new", title: "New client inquiry received", body: "This is a demo notification created for testing purposes.", type: "info", read: false, dismissed: false, createdAt: new Date() };
    mocks.notificationCreateMock.mockResolvedValueOnce(created);

    const response = await POST(jsonRequest({}));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.notification.id).toBe("n_new");
    expect(mocks.notificationCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        coachId: "coach_test_id",
        read: false,
        dismissed: false,
      }),
    });
  });

  it("creates a notification with the provided title and body", async () => {
    const created = { id: "n_custom", title: "Custom title", body: "Custom body", type: "success", read: false, dismissed: false, createdAt: new Date() };
    mocks.notificationCreateMock.mockResolvedValueOnce(created);

    const response = await POST(jsonRequest({ title: "Custom title", body: "Custom body", type: "success" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.notificationCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        coachId: "coach_test_id",
        title: "Custom title",
        body: "Custom body",
        type: "success",
      }),
    });
  });
});
