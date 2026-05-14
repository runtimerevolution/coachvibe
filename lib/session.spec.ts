import { describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";
import { requireAuth } from "./session";

function makeRequest(coachId?: string): NextRequest {
  const req = new Request("https://example.com") as unknown as NextRequest;
  Object.defineProperty(req, "cookies", {
    value: {
      get: (name: string) =>
        coachId && name === "coachvibe_session" ? { value: coachId } : undefined,
    },
  });
  return req;
}

describe("requireAuth", () => {
  it("returns coachId when session cookie is present", () => {
    const coachId = requireAuth(makeRequest("coach_abc123"));
    expect(coachId).toBe("coach_abc123");
  });

  it("returns null when session cookie is missing", () => {
    const coachId = requireAuth(makeRequest());
    expect(coachId).toBeNull();
  });

  it("returns null when cookie value is an empty string", () => {
    const coachId = requireAuth(makeRequest(""));
    expect(coachId).toBeNull();
  });
});
