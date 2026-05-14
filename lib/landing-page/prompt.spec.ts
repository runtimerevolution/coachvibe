import { describe, expect, it } from "vitest";
import { buildGenerationPrompt, parseGenerationResponse } from "./prompt";
import type { GenerationInput } from "./types";

describe("landing page prompt helpers", () => {
  const baseInput: GenerationInput = {
    coach: {
      name: "Maya Stone",
      bio: "I help burned-out founders rebuild energy and focus.",
      imageUrl: "https://example.com/maya.jpg",
      personality: "warm, direct, and confident",
    },
    product: {
      id: "prod_1",
      name: "Reset Sprint",
      description: "A focused 7-day reset for overwhelmed founders.",
      price: 0,
      type: "lead_magnet",
      modules: ["Day 1", "Day 2"],
      embedScript: "<script>embed()</script>",
    },
    targetAudience: "Overwhelmed founders",
    testimonialQuote: "I finally got my evenings back.",
    testimonialAttribution: "Sam, founder",
    colors: {
      primary: "#112233",
      accent: "#445566",
      lightBg: "#f6f6f6",
      textDark: "#000000",
      textMuted: "#3D4355",
    },
  };

  it("builds a prompt with the correct pricing and testimonial guidance", () => {
    const prompt = buildGenerationPrompt(baseInput);

    expect(prompt).toContain('This is free. The CTA should emphasise that there is no cost.');
    expect(prompt).toContain('Use language like "Watch it free"');
    expect(prompt).toContain("The product contains these modules/sections: Day 1, Day 2.");
    expect(prompt).toContain('The coach provided this testimonial: "I finally got my evenings back."');
    expect(prompt).toContain("Use this testimonial as-is. Do not rewrite it.");
  });

  it("parses generated JSON and attaches coach image metadata", () => {
    const parsed = parseGenerationResponse(
      '```json\n{"hero":{"label":"new","headline":"Reset","headlineAccent":"Reset","hook":"You are stuck","solution":"This fixes it","ctaText":"Start free","socialProofText":"Join 500+ founders"},"testimonial":{"quote":"Great","attribution":"Sam","show":true},"features":{"heading":"What you get","items":[{"text":"Step 1"},{"text":"Step 2"},{"text":"Step 3"},{"text":"Step 4"},{"text":"Step 5"},{"text":"Step 6"}],"ctaText":"Get access"},"about":{"bio":"I built this after years of coaching."},"bottomCta":{"headline":"Start now","headlineAccent":"Start","subtext":"Take the next step."}}\n```',
      baseInput
    );

    expect(parsed).toEqual({
      productId: "prod_1",
      coachId: "",
      productName: "Reset Sprint",
      productType: "lead_magnet",
      colors: baseInput.colors,
      embedScript: "<script>embed()</script>",
      hero: {
        label: "new",
        headline: "Reset",
        headlineAccent: "Reset",
        hook: "You are stuck",
        solution: "This fixes it",
        ctaText: "Start free",
        socialProofText: "Join 500+ founders",
        coachImageUrl: "https://example.com/maya.jpg",
      },
      testimonial: {
        quote: "Great",
        attribution: "Sam",
        show: true,
      },
      features: {
        heading: "What you get",
        items: [
          { text: "Step 1" },
          { text: "Step 2" },
          { text: "Step 3" },
          { text: "Step 4" },
          { text: "Step 5" },
          { text: "Step 6" },
        ],
        ctaText: "Get access",
      },
      about: {
        imageUrl: "https://example.com/maya.jpg",
        bio: "I built this after years of coaching.",
      },
      bottomCta: {
        headline: "Start now",
        headlineAccent: "Start",
        subtext: "Take the next step.",
      },
    });
  });
});
