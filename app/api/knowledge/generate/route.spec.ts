import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
  entryCreateMock: vi.fn(),
  deductCreditsMock: vi.fn(),
  createCompletionMock: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  requireAuth: mocks.requireAuthMock,
}));

vi.mock("@/lib/db", () => ({
  default: {
    knowledgeEntry: {
      create: mocks.entryCreateMock,
    },
  },
}));

vi.mock("@/lib/credits", () => ({
  deductCredits: mocks.deductCreditsMock,
}));

vi.mock("openai", () => ({
  default: class OpenAI {
    chat = { completions: { create: mocks.createCompletionMock } };
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
  mocks.deductCreditsMock.mockResolvedValue(true);
  process.env.OPENAI_API_KEY = "test-key";
});

describe("POST /api/knowledge/generate", () => {
  it("returns 401 when unauthenticated", async () => {
    mocks.requireAuthMock.mockReturnValue(null);

    const response = await POST(jsonRequest({ prompt: "How to onboard clients" }));
    expect(response.status).toBe(401);
  });

  it("returns 400 when prompt is missing", async () => {
    const response = await POST(jsonRequest({}));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it("returns 402 when the coach has insufficient credits", async () => {
    mocks.deductCreditsMock.mockResolvedValueOnce(false);

    const response = await POST(jsonRequest({ prompt: "How to onboard clients" }));
    const body = await response.json();

    expect(response.status).toBe(402);
    expect(body.error).toMatch(/credits/i);
    expect(mocks.createCompletionMock).not.toHaveBeenCalled();
  });

  it("calls GPT-4o, creates a knowledge entry with source=ai, and returns it", async () => {
    mocks.createCompletionMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              title: "How to Onboard Clients",
              content: "The best way to onboard clients is to...",
              tags: ["onboarding", "clients", "process"],
            }),
          },
        },
      ],
    });
    mocks.entryCreateMock.mockResolvedValueOnce({
      id: "ke_new",
      coachId: "coach_test_id",
      title: "How to Onboard Clients",
      content: "The best way to onboard clients is to...",
      tags: ["onboarding", "clients", "process"],
      source: "ai",
    });

    const response = await POST(jsonRequest({ prompt: "How to onboard clients" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.entry.source).toBe("ai");
    expect(body.data.entry.title).toBe("How to Onboard Clients");
    expect(mocks.createCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gpt-4o" })
    );
    expect(mocks.entryCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        coachId: "coach_test_id",
        source: "ai",
      }),
    });
  });

  it("deducts 3 credits for AI knowledge generation", async () => {
    mocks.createCompletionMock.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify({ title: "T", content: "C", tags: [] }) } }],
    });
    mocks.entryCreateMock.mockResolvedValueOnce({ id: "ke_1", source: "ai" });

    await POST(jsonRequest({ prompt: "Something" }));

    expect(mocks.deductCreditsMock).toHaveBeenCalledWith("coach_test_id", 3, expect.any(String));
  });
});
