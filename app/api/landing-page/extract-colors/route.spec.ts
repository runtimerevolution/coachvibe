import { describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST } from "./route";

vi.mock("@/lib/landing-page/color-extractor", () => ({
  extractColorsDeep: vi.fn(),
}));

import { extractColorsDeep } from "@/lib/landing-page/color-extractor";

function jsonRequest(url: string, body: unknown): NextRequest {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

describe("/api/landing-page/extract-colors", () => {
  it("rejects invalid URLs", async () => {
    const response = await POST(jsonRequest("https://example.com", { url: "ftp://example.com" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ success: false, error: "Valid URL required" });
  });

  it("returns extracted colors for valid URLs", async () => {
    vi.mocked(extractColorsDeep).mockResolvedValue({
      primary: "#112233",
      accent: "#445566",
      lightBg: "#f6f6f6",
      textDark: "#000000",
      textMuted: "#3D4355",
    });

    const response = await POST(jsonRequest("https://example.com", { url: "https://coach.example" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(extractColorsDeep).toHaveBeenCalledWith("https://coach.example");
    expect(body).toEqual({
      success: true,
      colors: {
        primary: "#112233",
        accent: "#445566",
        lightBg: "#f6f6f6",
        textDark: "#000000",
        textMuted: "#3D4355",
      },
    });
  });
});
