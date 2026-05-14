import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { GET } from "./route";

const mocks = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
  chatMessageFindManyMock: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  requireAuth: mocks.requireAuthMock,
}));

vi.mock("@/lib/db", () => ({
  default: {
    chatMessage: {
      findMany: mocks.chatMessageFindManyMock,
    },
  },
}));

const req = new Request("https://example.com") as unknown as NextRequest;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAuthMock.mockReturnValue("coach_test_id");
});

describe("GET /api/chat/history", () => {
  it("returns 401 when unauthenticated", async () => {
    mocks.requireAuthMock.mockReturnValue(null);

    const response = await GET(req);
    expect(response.status).toBe(401);
  });

  it("returns chat messages ordered by createdAt ascending", async () => {
    const messages = [
      { id: "msg_1", role: "user", content: "Hello", createdAt: new Date("2026-05-14T09:00:00Z") },
      { id: "msg_2", role: "assistant", content: "Hi there!", createdAt: new Date("2026-05-14T09:00:05Z") },
      { id: "msg_3", role: "user", content: "How are you?", createdAt: new Date("2026-05-14T09:00:10Z") },
    ];
    mocks.chatMessageFindManyMock.mockResolvedValueOnce(messages);

    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.messages).toHaveLength(3);
    expect(body.data.messages[0].role).toBe("user");
    expect(body.data.messages[1].role).toBe("assistant");
    expect(mocks.chatMessageFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { coachId: "coach_test_id" },
        orderBy: { createdAt: "asc" },
        take: 50,
      })
    );
  });

  it("returns an empty array when the coach has no chat history", async () => {
    mocks.chatMessageFindManyMock.mockResolvedValueOnce([]);

    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.messages).toEqual([]);
  });
});
