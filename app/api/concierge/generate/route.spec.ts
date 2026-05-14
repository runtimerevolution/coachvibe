import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
  coachFindUniqueMock: vi.fn(),
  taskCreateManyMock: vi.fn(),
  taskFindManyMock: vi.fn(),
  deductCreditsMock: vi.fn(),
  createCompletionMock: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  requireAuth: mocks.requireAuthMock,
}));

vi.mock("@/lib/db", () => ({
  default: {
    coach: { findUnique: mocks.coachFindUniqueMock },
    conciergeTask: { createMany: mocks.taskCreateManyMock, findMany: mocks.taskFindManyMock },
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

const req = new Request("https://example.com", { method: "POST" }) as unknown as NextRequest;

const generatedTasks = [
  { title: "Update your LinkedIn headline", description: "Refresh your profile", priority: "high", timeMinutes: 15, points: 20 },
  { title: "Send a re-engagement email", description: "Reach out to past clients", priority: "medium", timeMinutes: 30, points: 15 },
  { title: "Record a short intro video", description: "Post on social media", priority: "medium", timeMinutes: 45, points: 25 },
  { title: "Review pricing page", description: "Check for clarity", priority: "low", timeMinutes: 20, points: 10 },
  { title: "Draft Q3 content plan", description: "Plan ahead for content", priority: "low", timeMinutes: 60, points: 30 },
];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAuthMock.mockReturnValue("coach_test_id");
  mocks.deductCreditsMock.mockResolvedValue(true);
  mocks.taskCreateManyMock.mockResolvedValue({ count: 5 });
  mocks.taskFindManyMock.mockResolvedValue(generatedTasks.map((t, i) => ({ id: `task_${i}`, coachId: "coach_test_id", source: "ai", status: "pending", ...t })));
  process.env.OPENAI_API_KEY = "test-key";
});

describe("POST /api/concierge/generate", () => {
  it("returns 401 when unauthenticated", async () => {
    mocks.requireAuthMock.mockReturnValue(null);

    const response = await POST(req);
    expect(response.status).toBe(401);
  });

  it("returns 402 when the coach has insufficient credits", async () => {
    mocks.deductCreditsMock.mockResolvedValueOnce(false);

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(402);
    expect(body.error).toMatch(/credits/i);
    expect(mocks.createCompletionMock).not.toHaveBeenCalled();
  });

  it("calls GPT-4o, creates 5 tasks with source=ai, and returns them", async () => {
    mocks.coachFindUniqueMock.mockResolvedValueOnce({
      id: "coach_test_id",
      name: "Demo Coach",
      bio: "Helping founders.",
      goals: ["grow_revenue", "automate_workflows"],
    });
    mocks.createCompletionMock.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(generatedTasks) } }],
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.createCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gpt-4o" })
    );
    expect(mocks.taskCreateManyMock).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ coachId: "coach_test_id", source: "ai" }),
      ]),
    });
    expect(body.data.tasks).toHaveLength(5);
  });

  it("deducts 2 credits for AI generation", async () => {
    mocks.coachFindUniqueMock.mockResolvedValueOnce({ id: "coach_test_id", name: "Demo Coach", bio: "", goals: [] });
    mocks.createCompletionMock.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(generatedTasks) } }],
    });

    await POST(req);

    expect(mocks.deductCreditsMock).toHaveBeenCalledWith("coach_test_id", 2, expect.any(String));
  });
});
