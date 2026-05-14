import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { GET, PATCH } from "./route";

const mocks = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
  coachFindUniqueMock: vi.fn(),
  coachUpdateMock: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  requireAuth: mocks.requireAuthMock,
}));

vi.mock("@/lib/db", () => ({
  default: {
    coach: {
      findUnique: mocks.coachFindUniqueMock,
      update: mocks.coachUpdateMock,
    },
  },
}));

function jsonRequest(url: string, body: unknown): NextRequest {
  return new Request(url, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

const getReq = new Request("https://example.com") as unknown as NextRequest;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAuthMock.mockReturnValue("coach_test_id");
});

describe("/api/coach", () => {
  describe("GET", () => {
    it("returns 401 when unauthenticated", async () => {
      mocks.requireAuthMock.mockReturnValue(null);

      const response = await GET(getReq);
      expect(response.status).toBe(401);
    });

    it("returns the authenticated coach's profile", async () => {
      mocks.coachFindUniqueMock.mockResolvedValueOnce({
        id: "coach_test_id",
        name: "Demo Coach",
        email: "demo@demo.com",
        bio: "I help ambitious coaches build thriving businesses.",
        imageUrl: "https://api.dicebear.com/7.x/personas/svg?seed=coach",
        personality: "warm, direct, and confident",
        credits: 500,
      });

      const response = await GET(getReq);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(mocks.coachFindUniqueMock).toHaveBeenCalledWith({
        where: { id: "coach_test_id" },
      });
      expect(body.data.coach.email).toBe("demo@demo.com");
    });

    it("returns 404 when the coach record does not exist", async () => {
      mocks.coachFindUniqueMock.mockResolvedValueOnce(null);

      const response = await GET(getReq);
      expect(response.status).toBe(404);
    });
  });

  describe("PATCH", () => {
    it("returns 401 when unauthenticated", async () => {
      mocks.requireAuthMock.mockReturnValue(null);

      const response = await PATCH(jsonRequest("https://example.com", { name: "New Name" }));
      expect(response.status).toBe(401);
    });

    it("updates the authenticated coach's profile", async () => {
      mocks.coachUpdateMock.mockResolvedValueOnce({
        id: "coach_test_id",
        name: "Updated Coach",
        bio: "Updated bio",
        imageUrl: "https://example.com/updated.jpg",
        websiteUrl: "https://coach.example",
        personality: "direct",
      });

      const response = await PATCH(
        jsonRequest("https://example.com", {
          name: "Updated Coach",
          bio: "Updated bio",
          imageUrl: "https://example.com/updated.jpg",
          websiteUrl: "https://coach.example",
          personality: "direct",
        })
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(mocks.coachUpdateMock).toHaveBeenCalledWith({
        where: { id: "coach_test_id" },
        data: {
          name: "Updated Coach",
          bio: "Updated bio",
          imageUrl: "https://example.com/updated.jpg",
          websiteUrl: "https://coach.example",
          personality: "direct",
        },
      });
      expect(body).toEqual({
        success: true,
        data: {
          coach: {
            id: "coach_test_id",
            name: "Updated Coach",
            bio: "Updated bio",
            imageUrl: "https://example.com/updated.jpg",
            websiteUrl: "https://coach.example",
            personality: "direct",
          },
        },
      });
    });
  });
});
