import { beforeEach, describe, expect, it, vi } from "vitest";
import { logActivity } from "./activity";

const mocks = vi.hoisted(() => ({
  activityLogCreateMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  default: {
    activityLog: {
      create: mocks.activityLogCreateMock,
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.activityLogCreateMock.mockResolvedValue(undefined);
});

describe("logActivity", () => {
  it("creates an activity log entry with action and label", async () => {
    await logActivity("coach_1", "workflow.activated", "Client Onboarding is now active");

    expect(mocks.activityLogCreateMock).toHaveBeenCalledWith({
      data: {
        coachId: "coach_1",
        action: "workflow.activated",
        label: "Client Onboarding is now active",
        metadata: undefined,
      },
    });
  });

  it("includes metadata when provided", async () => {
    await logActivity("coach_1", "landing_page.published", "Reset Sprint page is live", {
      slug: "reset-sprint",
      productId: "prod_1",
    });

    expect(mocks.activityLogCreateMock).toHaveBeenCalledWith({
      data: {
        coachId: "coach_1",
        action: "landing_page.published",
        label: "Reset Sprint page is live",
        metadata: { slug: "reset-sprint", productId: "prod_1" },
      },
    });
  });

  it("handles all standard action strings", async () => {
    const actions = [
      "workflow.activated",
      "workflow.deactivated",
      "workflow.run",
      "integration.connected",
      "integration.disconnected",
      "landing_page.published",
      "landing_page.generated",
      "onboarding.completed",
      "chat.message",
    ];

    for (const action of actions) {
      await logActivity("coach_1", action, "test label");
      expect(mocks.activityLogCreateMock).toHaveBeenCalledWith({
        data: expect.objectContaining({ action }),
      });
    }
  });
});
