import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
  upsertMock: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  requireAuth: mocks.requireAuthMock,
}));

vi.mock("@/lib/db", () => ({
  default: {
    landingPage: {
      upsert: mocks.upsertMock,
    },
    activityLog: {
      create: vi.fn().mockResolvedValue({}),
    },
    notification: {
      create: vi.fn().mockResolvedValue({}),
    },
  },
}));

function jsonRequest(url: string, body: unknown): NextRequest {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAuthMock.mockReturnValue("coach_test_id");
});

describe("/api/landing-page/save", () => {
  it("rejects unauthenticated requests", async () => {
    mocks.requireAuthMock.mockReturnValue(null);

    const response = await POST(jsonRequest("https://example.com", { productId: "prod_1" }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ success: false, error: "Unauthorized" });
  });

  it("upserts landing page data for the authenticated coach", async () => {
    const payload = {
      productId: "prod_1",
      productName: "Reset Sprint",
      productType: "lead_magnet",
      colors: {
        primary: "#112233",
        accent: "#445566",
        lightBg: "#f6f6f6",
        textDark: "#000000",
        textMuted: "#3D4355",
      },
      embedScript: "<script>embed()</script>",
      hero: {
        label: "new",
        headline: "Reset",
        headlineAccent: "Reset",
        hook: "You are stuck",
        solution: "This fixes it",
        ctaText: "Start free",
        socialProofText: "Join 500+ founders",
        coachImageUrl: "https://example.com/maya.jpg",
      },
      testimonial: { quote: "Great", attribution: "Sam", show: true },
      features: { heading: "What you get", items: [{ text: "Step 1" }], ctaText: "Get access" },
      about: { imageUrl: "https://example.com/maya.jpg", bio: "I built this." },
      bottomCta: { headline: "Start now", headlineAccent: "Start", subtext: "Take the next step." },
      generatedAt: "2026-01-01T00:00:00.000Z",
      published: true,
      slug: "reset-sprint",
    };

    mocks.upsertMock.mockResolvedValueOnce(undefined);

    const response = await POST(jsonRequest("https://example.com", payload));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true, data: {} });
    expect(mocks.upsertMock).toHaveBeenCalledWith({
      where: { productId: "prod_1" },
      update: {
        slug: "reset-sprint",
        data: payload,
        published: true,
        updatedAt: expect.any(Date),
      },
      create: {
        productId: "prod_1",
        coachId: "coach_test_id",
        slug: "reset-sprint",
        data: payload,
        published: true,
      },
    });
  });
});
