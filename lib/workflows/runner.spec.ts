import { beforeEach, describe, expect, it, vi } from "vitest";
import { runWorkflow, requiredServicesFor, isRunnable, assertConnections } from "./runner";

const mocks = vi.hoisted(() => ({
  getConnectionMock: vi.fn(),
  getNextEventMock: vi.fn(),
  createDraftMock: vi.fn(),
}));

vi.mock("@/lib/integrations/connection", () => ({ getConnection: mocks.getConnectionMock }));
vi.mock("@/lib/integrations/google-calendar", () => ({ getNextEvent: mocks.getNextEventMock }));
vi.mock("@/lib/integrations/gmail", () => ({ createDraft: mocks.createDraftMock }));
// registry.ts is pure data (display names) — left unmocked.

const CONN = { nango: {}, service: "x", connectionId: "c", providerConfigKey: "p" };
const CTX = { coachId: "coach_1", templateId: "pre-session-brief" };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getConnectionMock.mockResolvedValue(CONN);
  mocks.getNextEventMock.mockResolvedValue({
    id: "evt_1",
    summary: "Call with Jane",
    start: "2026-06-02T15:00:00.000Z",
  });
  mocks.createDraftMock.mockResolvedValue({ id: "draft_123" });
});

describe("workflow runner", () => {
  it("requiredServicesFor / isRunnable reflect the registered real steps", () => {
    expect(requiredServicesFor("pre-session-brief")).toEqual(["google-calendar", "gmail"]);
    expect(isRunnable("pre-session-brief")).toBe(true);
    expect(isRunnable("not-a-template")).toBe(false);
    expect(requiredServicesFor("not-a-template")).toEqual([]);
  });

  it("runs calendar → gmail and returns real output", async () => {
    const result = await runWorkflow(CTX);

    expect(result.status).toBe("completed");
    expect(result.output.calendarEventId).toBe("evt_1");
    expect(result.output.eventSummary).toBe("Call with Jane");
    expect(result.output.gmailDraftId).toBe("draft_123");

    // Calendar feeds Gmail: the draft subject is built from the event summary.
    expect(mocks.getNextEventMock).toHaveBeenCalledTimes(1);
    expect(mocks.createDraftMock).toHaveBeenCalledWith(
      CONN,
      expect.objectContaining({ subject: expect.stringContaining("Call with Jane") })
    );
  });

  it("assertConnections lists missing integrations by display name", async () => {
    mocks.getConnectionMock.mockImplementation(async (_coachId: string, service: string) =>
      service === "gmail" ? null : CONN
    );

    const check = await assertConnections("coach_1", "pre-session-brief");
    expect(check.ok).toBe(false);
    expect(check.missing).toEqual(["Gmail"]);
  });

  it("stops the chain and reports failure when a step throws", async () => {
    mocks.getNextEventMock.mockRejectedValueOnce(new Error("calendar boom"));

    const result = await runWorkflow(CTX);

    expect(result.status).toBe("failed");
    expect(result.output.error).toContain("calendar boom");
    expect(mocks.createDraftMock).not.toHaveBeenCalled();
    expect(result.steps.find((s) => s.connector === "google-calendar")?.status).toBe("failed");
  });
});
