import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { GET } from "./route";

const mocks = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
  coachFindUniqueMock: vi.fn(),
  workflowFindManyMock: vi.fn(),
  integrationFindManyMock: vi.fn(),
  activityLogFindManyMock: vi.fn(),
  notificationFindManyMock: vi.fn(),
  notificationCountMock: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  requireAuth: mocks.requireAuthMock,
}));

vi.mock("@/lib/db", () => ({
  default: {
    coach: { findUnique: mocks.coachFindUniqueMock },
    workflowInstance: { findMany: mocks.workflowFindManyMock },
    integration: { findMany: mocks.integrationFindManyMock },
    activityLog: { findMany: mocks.activityLogFindManyMock },
    notification: {
      findMany: mocks.notificationFindManyMock,
      count: mocks.notificationCountMock,
    },
  },
}));

const req = new Request("https://example.com") as unknown as NextRequest;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAuthMock.mockReturnValue("coach_test_id");
});

describe("GET /api/dashboard", () => {
  it("returns 401 when unauthenticated", async () => {
    mocks.requireAuthMock.mockReturnValue(null);

    const response = await GET(req);
    expect(response.status).toBe(401);
  });

  it("returns aggregated dashboard data for the authenticated coach", async () => {
    mocks.coachFindUniqueMock.mockResolvedValueOnce({
      id: "coach_test_id",
      name: "Demo Coach",
      credits: 320,
    });
    mocks.workflowFindManyMock.mockResolvedValueOnce([
      { id: "wf_1", templateId: "client-onboarding", active: true, runs: [] },
      { id: "wf_2", templateId: "post-session-intelligence", active: true, runs: [] },
    ]);
    mocks.integrationFindManyMock.mockResolvedValueOnce([
      { service: "gmail", connected: true },
      { service: "stripe", connected: true },
      { service: "hubspot", connected: false },
    ]);
    mocks.activityLogFindManyMock.mockResolvedValueOnce([
      { id: "log_1", action: "workflow.activated", label: "Client Onboarding is now active", createdAt: new Date() },
    ]);
    mocks.notificationFindManyMock.mockResolvedValueOnce([
      { id: "notif_1", title: "Welcome!", body: "Your workspace is ready.", read: false, dismissed: false },
    ]);
    mocks.notificationCountMock.mockResolvedValueOnce(1);

    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.coach).toEqual({ id: "coach_test_id", name: "Demo Coach", credits: 320 });
    expect(body.data.stats.activeWorkflows).toBe(2);
    expect(body.data.stats.connectedIntegrations).toBe(2);
    expect(body.data.stats.creditsRemaining).toBe(320);
    expect(body.data.stats.unreadNotifications).toBe(1);
    expect(body.data.workflows).toHaveLength(2);
    expect(body.data.integrations).toHaveLength(3);
    expect(body.data.recentActivity).toHaveLength(1);
    expect(body.data.notifications).toHaveLength(1);
  });

  it("returns zeros in stats when coach has no data", async () => {
    mocks.coachFindUniqueMock.mockResolvedValueOnce({ id: "coach_test_id", name: "New Coach", credits: 500 });
    mocks.workflowFindManyMock.mockResolvedValueOnce([]);
    mocks.integrationFindManyMock.mockResolvedValueOnce([]);
    mocks.activityLogFindManyMock.mockResolvedValueOnce([]);
    mocks.notificationFindManyMock.mockResolvedValueOnce([]);
    mocks.notificationCountMock.mockResolvedValueOnce(0);

    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.stats.activeWorkflows).toBe(0);
    expect(body.data.stats.connectedIntegrations).toBe(0);
    expect(body.data.stats.unreadNotifications).toBe(0);
  });
});
