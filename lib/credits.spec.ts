import { beforeEach, describe, expect, it, vi } from "vitest";
import { deductCredits } from "./credits";

const mocks = vi.hoisted(() => ({
  coachFindUniqueMock: vi.fn(),
  coachUpdateMock: vi.fn(),
  notificationFindFirstMock: vi.fn(),
  notificationCreateMock: vi.fn(),
  activityLogCreateMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  default: {
    coach: {
      findUnique: mocks.coachFindUniqueMock,
      update: mocks.coachUpdateMock,
    },
    notification: {
      findFirst: mocks.notificationFindFirstMock,
      create: mocks.notificationCreateMock,
    },
    activityLog: {
      create: mocks.activityLogCreateMock,
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.activityLogCreateMock.mockResolvedValue(undefined);
  mocks.notificationCreateMock.mockResolvedValue(undefined);
  mocks.notificationFindFirstMock.mockResolvedValue(null);
});

describe("deductCredits", () => {
  it("decrements credits and returns true on success", async () => {
    mocks.coachFindUniqueMock.mockResolvedValueOnce({ credits: 500 });
    mocks.coachUpdateMock.mockResolvedValueOnce({ id: "coach_1", credits: 499 });

    const result = await deductCredits("coach_1", 1, "chat.message");

    expect(result).toBe(true);
    expect(mocks.coachUpdateMock).toHaveBeenCalledWith({
      where: { id: "coach_1" },
      data: { credits: { decrement: 1 } },
    });
  });

  it("returns false and does not deduct when credits are insufficient", async () => {
    mocks.coachFindUniqueMock.mockResolvedValueOnce({ credits: 5 });

    const result = await deductCredits("coach_1", 10, "landing_page.generated");

    expect(result).toBe(false);
    expect(mocks.coachUpdateMock).not.toHaveBeenCalled();
  });

  it("returns false when credits are zero", async () => {
    mocks.coachFindUniqueMock.mockResolvedValueOnce({ credits: 0 });

    const result = await deductCredits("coach_1", 1, "chat.message");

    expect(result).toBe(false);
  });

  it("creates a low-credits warning notification when credits drop below 50", async () => {
    mocks.coachFindUniqueMock.mockResolvedValueOnce({ credits: 51 });
    mocks.coachUpdateMock.mockResolvedValueOnce({ id: "coach_1", credits: 49 });

    await deductCredits("coach_1", 2, "tts");

    expect(mocks.notificationCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        coachId: "coach_1",
        type: "warning",
        title: expect.stringContaining("low"),
      }),
    });
  });

  it("does not create a duplicate warning notification within 24 hours", async () => {
    mocks.coachFindUniqueMock.mockResolvedValueOnce({ credits: 51 });
    mocks.coachUpdateMock.mockResolvedValueOnce({ id: "coach_1", credits: 49 });
    mocks.notificationFindFirstMock.mockResolvedValueOnce({
      id: "notif_existing",
      createdAt: new Date(),
    });

    await deductCredits("coach_1", 2, "tts");

    expect(mocks.notificationCreateMock).not.toHaveBeenCalled();
  });

  it("does not create a warning notification when credits remain at or above 50", async () => {
    mocks.coachFindUniqueMock.mockResolvedValueOnce({ credits: 100 });
    mocks.coachUpdateMock.mockResolvedValueOnce({ id: "coach_1", credits: 99 });

    await deductCredits("coach_1", 1, "chat.message");

    expect(mocks.notificationCreateMock).not.toHaveBeenCalled();
  });

  it("logs an activity entry after successful deduction", async () => {
    mocks.coachFindUniqueMock.mockResolvedValueOnce({ credits: 500 });
    mocks.coachUpdateMock.mockResolvedValueOnce({ id: "coach_1", credits: 490 });

    await deductCredits("coach_1", 10, "landing_page.generated");

    expect(mocks.activityLogCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        coachId: "coach_1",
        action: "landing_page.generated",
      }),
    });
  });
});
