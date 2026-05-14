import { beforeEach, describe, expect, it, vi } from "vitest";
import { createNotification } from "./notifications";

const mocks = vi.hoisted(() => ({
  notificationCreateMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  default: {
    notification: {
      create: mocks.notificationCreateMock,
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.notificationCreateMock.mockResolvedValue(undefined);
});

describe("createNotification", () => {
  it("creates a notification with the given data", async () => {
    await createNotification("coach_1", {
      title: "Welcome to CoachOS!",
      body: "Your workspace is ready.",
    });

    expect(mocks.notificationCreateMock).toHaveBeenCalledWith({
      data: {
        coachId: "coach_1",
        title: "Welcome to CoachOS!",
        body: "Your workspace is ready.",
        type: "info",
        read: false,
        dismissed: false,
      },
    });
  });

  it("uses the provided type instead of the default", async () => {
    await createNotification("coach_1", {
      title: "Credits running low",
      body: "You have 30 credits remaining.",
      type: "warning",
    });

    expect(mocks.notificationCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: "warning" }),
    });
  });

  it("creates success and error type notifications", async () => {
    await createNotification("coach_1", { title: "Done", body: "All good.", type: "success" });
    expect(mocks.notificationCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: "success" }),
    });

    await createNotification("coach_1", { title: "Failed", body: "Something went wrong.", type: "error" });
    expect(mocks.notificationCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: "error" }),
    });
  });
});
