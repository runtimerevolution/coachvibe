import { afterEach, describe, expect, it, vi } from "vitest";
import { extractColorsDeep, extractColorsFromUrl } from "./color-extractor";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("color extractor", () => {
  it("extracts colors from inline CSS variables and theme-color metadata", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => `
          <html>
            <head>
              <meta name="theme-color" content="#ABCDEF" />
              <style>
                :root {
                  --primary-color: #112233;
                  --accent-color: #445566;
                }
              </style>
            </head>
            <body>
              <div style="color:#112233;background:#445566"></div>
            </body>
          </html>
        `,
      })
    );

    const colors = await extractColorsFromUrl("https://example.com");

    expect(colors).toEqual({
      primary: "#112233",
      accent: "#445566",
      lightBg: "#f6f6f6",
      textDark: "#000000",
      textMuted: "#3D4355",
    });
  });

  it("falls back to external CSS when the first pass finds no colors", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "<html><head></head><body>No colors here</body></html>",
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => `
          <html>
            <head>
              <link rel="stylesheet" href="/assets/main.css" />
            </head>
          </html>
        `,
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => `
          :root {
            --primary-color: #1a2b3c;
            --accent-color: #d97706;
          }
        `,
      });

    vi.stubGlobal("fetch", fetchMock);

    const colors = await extractColorsDeep("https://example.com");

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(colors.primary).toBe("#1a2b3c");
    expect(colors.accent).toBe("#d97706");
  });
});
