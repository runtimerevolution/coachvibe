import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
  createCompletionMock: vi.fn(),
  coachFindUniqueMock: vi.fn(),
  coachUpdateMock: vi.fn(),
  productFindUniqueMock: vi.fn(),
  landingPageUpsertMock: vi.fn(),
  buildGenerationPromptMock: vi.fn(),
  parseGenerationResponseMock: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  requireAuth: mocks.requireAuthMock,
}));

vi.mock("openai", () => ({
  default: class OpenAI {
    chat = {
      completions: {
        create: mocks.createCompletionMock,
      },
    };
  },
}));

vi.mock("@/lib/db", () => ({
  default: {
    coach: {
      findUnique: mocks.coachFindUniqueMock,
      update: mocks.coachUpdateMock,
    },
    product: {
      findUnique: mocks.productFindUniqueMock,
    },
    landingPage: {
      upsert: mocks.landingPageUpsertMock,
    },
    activityLog: {
      create: vi.fn().mockResolvedValue({}),
    },
    notification: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
    },
  },
}));

vi.mock("@/lib/landing-page/color-extractor", () => ({
  extractColorsDeep: vi.fn(),
}));

vi.mock("@/lib/landing-page/prompt", () => ({
  buildGenerationPrompt: mocks.buildGenerationPromptMock,
  parseGenerationResponse: mocks.parseGenerationResponseMock,
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
  mocks.requireAuthMock.mockReturnValue("coach_1");
  process.env.OPENAI_API_KEY = "test-key";
});

describe("/api/landing-page/generate", () => {
  it("rejects unauthenticated requests", async () => {
    mocks.requireAuthMock.mockReturnValue(null);

    const response = await POST(jsonRequest("https://example.com", {}));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ success: false, error: "Unauthorized" });
  });

  it("generates, parses, and persists a landing page", async () => {
    mocks.coachFindUniqueMock.mockImplementation(async (args: { select?: { credits?: boolean } }) => {
      if (args?.select?.credits) return { credits: 100 };
      return {
        id: "coach_1",
        name: "Maya Stone",
        bio: "I help burned-out founders rebuild energy and focus.",
        imageUrl: "https://example.com/maya.jpg",
        personality: "warm, direct, and confident",
        websiteUrl: "https://coach.example",
      };
    });
    mocks.coachUpdateMock.mockResolvedValueOnce({ id: "coach_1" });
    mocks.productFindUniqueMock.mockResolvedValueOnce({
      id: "prod_1",
      name: "Reset Sprint",
      description: "A focused 7-day reset for overwhelmed founders.",
      price: 0,
      type: "lead_magnet",
      modules: ["Day 1", "Day 2"],
      embedScript: "<script>embed()</script>",
    });
    mocks.buildGenerationPromptMock.mockReturnValueOnce("prompt");
    mocks.createCompletionMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content:
              '{"hero":{"headline":"Reset","headlineAccent":"Reset","label":"new","hook":"You are stuck","solution":"This fixes it","ctaText":"Start free","socialProofText":"Join 500+ founders"},"testimonial":{"quote":"Great","attribution":"Sam","show":true},"features":{"heading":"What you get","items":[{"text":"Step 1"},{"text":"Step 2"},{"text":"Step 3"},{"text":"Step 4"},{"text":"Step 5"},{"text":"Step 6"}],"ctaText":"Get access"},"about":{"bio":"I built this after years of coaching."},"bottomCta":{"headline":"Start now","headlineAccent":"Start","subtext":"Take the next step."}}',
          },
        },
      ],
    });
    mocks.parseGenerationResponseMock.mockReturnValueOnce({
      productId: "prod_1",
      coachId: "",
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
      about: { imageUrl: "https://example.com/maya.jpg", bio: "I built this after years of coaching." },
      bottomCta: { headline: "Start now", headlineAccent: "Start", subtext: "Take the next step." },
    });
    mocks.landingPageUpsertMock.mockResolvedValueOnce(undefined);

    const response = await POST(
      jsonRequest("https://example.com", {
        productId: "prod_1",
        targetAudience: "Overwhelmed founders",
        manualColors: {
          primary: "#112233",
          accent: "#445566",
        },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.createCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-4o",
        response_format: { type: "json_object" },
      })
    );
    expect(mocks.buildGenerationPromptMock).toHaveBeenCalledWith(
      expect.objectContaining({
        coach: expect.objectContaining({ name: "Maya Stone" }),
        product: expect.objectContaining({ name: "Reset Sprint" }),
        targetAudience: "Overwhelmed founders",
      })
    );
    expect(mocks.landingPageUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { productId: "prod_1" },
        create: expect.objectContaining({
          productId: "prod_1",
          coachId: "coach_1",
          slug: "reset-sprint",
          published: false,
        }),
      })
    );
    expect(body.success).toBe(true);
    expect(body.data.slug).toBe("reset-sprint");
  });
});
