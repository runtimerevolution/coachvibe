import { describe, expect, it } from "vitest";
import { normalizeName, parseBooleanCookie, resolveAuthRoute } from "./auth";

describe("auth helpers", () => {
  it("parses cookie booleans consistently", () => {
    expect(parseBooleanCookie("true")).toBe(true);
    expect(parseBooleanCookie("1")).toBe(true);
    expect(parseBooleanCookie("false")).toBe(false);
    expect(parseBooleanCookie(undefined)).toBe(false);
  });

  it("resolves the correct route for each auth state", () => {
    expect(resolveAuthRoute({ loggedIn: false, onboarded: false })).toBe("/sign-in");
    expect(resolveAuthRoute({ loggedIn: true, onboarded: false })).toBe("/onboarding");
    expect(resolveAuthRoute({ loggedIn: true, onboarded: true })).toBe("/dashboard");
  });

  it("falls back to a usable display name", () => {
    expect(normalizeName(" Maya ", "maya@example.com")).toBe("Maya");
    expect(normalizeName("", "maya@example.com")).toBe("maya");
  });
});
