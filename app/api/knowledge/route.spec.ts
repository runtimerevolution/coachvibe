import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { GET, POST } from "./route";

const mocks = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
  entryFindManyMock: vi.fn(),
  entryCreateMock: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  requireAuth: mocks.requireAuthMock,
}));

vi.mock("@/lib/db", () => ({
  default: {
    knowledgeEntry: {
      findMany: mocks.entryFindManyMock,
      create: mocks.entryCreateMock,
    },
  },
}));

function makeGetRequest(search?: string, tags?: string): NextRequest {
  const url = new URL("https://example.com/api/knowledge");
  if (search) url.searchParams.set("q", search);
  if (tags) url.searchParams.set("tags", tags);
  return new Request(url.toString()) as unknown as NextRequest;
}

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

describe("GET /api/knowledge", () => {
  it("returns 401 when unauthenticated", async () => {
    mocks.requireAuthMock.mockReturnValue(null);

    const response = await GET(makeGetRequest());
    expect(response.status).toBe(401);
  });

  it("returns all knowledge entries for the coach", async () => {
    const entries = [
      { id: "ke_1", title: "Onboarding Framework", content: "Here is the framework...", tags: ["onboarding", "clients"], source: "manual" },
      { id: "ke_2", title: "Imposter Syndrome Guide", content: "When you feel like a fraud...", tags: ["mindset"], source: "ai" },
    ];
    mocks.entryFindManyMock.mockResolvedValueOnce(entries);

    const response = await GET(makeGetRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.entries).toHaveLength(2);
    expect(mocks.entryFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ coachId: "coach_test_id" }) })
    );
  });

  it("filters entries by search query using title and content", async () => {
    mocks.entryFindManyMock.mockResolvedValueOnce([]);

    await GET(makeGetRequest("onboarding"));

    expect(mocks.entryFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ title: expect.objectContaining({ contains: "onboarding" }) }),
            expect.objectContaining({ content: expect.objectContaining({ contains: "onboarding" }) }),
          ]),
        }),
      })
    );
  });

  it("filters entries by tags", async () => {
    mocks.entryFindManyMock.mockResolvedValueOnce([]);

    await GET(makeGetRequest(undefined, "mindset,clients"));

    expect(mocks.entryFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tags: expect.objectContaining({ hasSome: ["mindset", "clients"] }),
        }),
      })
    );
  });
});

describe("POST /api/knowledge", () => {
  it("returns 401 when unauthenticated", async () => {
    mocks.requireAuthMock.mockReturnValue(null);

    const response = await POST(jsonRequest({ title: "Test", content: "Content" }));
    expect(response.status).toBe(401);
  });

  it("creates a knowledge entry with the authenticated coachId", async () => {
    mocks.entryCreateMock.mockResolvedValueOnce({
      id: "ke_new",
      coachId: "coach_test_id",
      title: "My Framework",
      content: "Here is how I work...",
      tags: ["framework", "process"],
      source: "manual",
    });

    const response = await POST(
      jsonRequest({ title: "My Framework", content: "Here is how I work...", tags: ["framework", "process"] })
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(mocks.entryCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        coachId: "coach_test_id",
        title: "My Framework",
        source: "manual",
      }),
    });
  });

  it("returns 400 when title or content is missing", async () => {
    const response = await POST(jsonRequest({ title: "No content" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });
});
