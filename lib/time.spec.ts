import { describe, expect, it } from "vitest";
import { timeAgo } from "./time";

function secondsAgo(n: number): Date {
  return new Date(Date.now() - n * 1000);
}

describe("timeAgo", () => {
  it("returns 'just now' for timestamps under 60 seconds ago", () => {
    expect(timeAgo(secondsAgo(0))).toBe("just now");
    expect(timeAgo(secondsAgo(45))).toBe("just now");
  });

  it("returns minutes for timestamps 1–59 minutes ago", () => {
    expect(timeAgo(secondsAgo(60))).toBe("1 min ago");
    expect(timeAgo(secondsAgo(5 * 60))).toBe("5 min ago");
    expect(timeAgo(secondsAgo(59 * 60))).toBe("59 min ago");
  });

  it("returns hours for timestamps 1–23 hours ago", () => {
    expect(timeAgo(secondsAgo(60 * 60))).toBe("1 hr ago");
    expect(timeAgo(secondsAgo(2 * 60 * 60))).toBe("2 hrs ago");
    expect(timeAgo(secondsAgo(23 * 60 * 60))).toBe("23 hrs ago");
  });

  it("returns days for timestamps 1+ days ago", () => {
    expect(timeAgo(secondsAgo(24 * 60 * 60))).toBe("1 day ago");
    expect(timeAgo(secondsAgo(3 * 24 * 60 * 60))).toBe("3 days ago");
  });
});
