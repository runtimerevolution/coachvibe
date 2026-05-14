import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("POST /api/auth/sign-out", () => {
  it("returns 200 with success", async () => {
    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });
  });

  it("sets cookies that expire the session", async () => {
    const response = await POST();

    // Next.js cookies.delete() sets the cookie value to empty with max-age 0
    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("coachvibe_session");
    expect(setCookie).toContain("coachvibe_onboarded");
  });
});
