import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { extractColorsDeep } from "@/lib/landing-page/color-extractor";
import { buildGenerationPrompt, parseGenerationResponse } from "@/lib/landing-page/prompt";
import type { CoachProfile, GenerationInput, LandingPageColors, LandingPageData, ProductInfo } from "@/lib/landing-page/types";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { deductCredits } from "@/lib/credits";
import { logActivity } from "@/lib/activity";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function getCoachProfile(coachId: string): Promise<CoachProfile> {
  const coach = await prisma.coach.findUnique({ where: { id: coachId } });
  if (!coach) throw new Error("Coach not found");
  return {
    name: coach.name,
    bio: coach.bio || "An experienced coach helping clients achieve their goals.",
    imageUrl: coach.imageUrl || "https://api.dicebear.com/7.x/personas/svg?seed=" + coachId,
    personality: coach.personality || "warm, direct, and confident",
    websiteUrl: coach.websiteUrl || undefined,
  };
}

async function getProductInfo(productId: string): Promise<ProductInfo> {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Product not found");
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    type: product.type as ProductInfo["type"],
    modules: product.modules,
    embedScript: product.embedScript,
  };
}

async function saveLandingPage(data: LandingPageData): Promise<void> {
  await prisma.landingPage.upsert({
    where: { productId: data.productId },
    update: { slug: data.slug, data: data as object, published: data.published, updatedAt: new Date() },
    create: {
      productId: data.productId,
      coachId: data.coachId,
      slug: data.slug,
      data: data as object,
      published: data.published,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const coachId = requireAuth(req);
    if (!coachId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { productId, targetAudience, websiteUrl, testimonialQuote, testimonialAttribution, manualColors } = body;

    if (!productId || !targetAudience) {
      return NextResponse.json({ success: false, error: "productId and targetAudience are required" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ success: false, error: "Anthropic API key not configured" }, { status: 500 });
    }

    const hasCredits = await deductCredits(coachId, 10, "landing_page.generated");
    if (!hasCredits) {
      return NextResponse.json({ success: false, error: "Insufficient credits" }, { status: 402 });
    }

    const [coach, product] = await Promise.all([getCoachProfile(coachId), getProductInfo(productId)]);

    let colors: LandingPageColors;
    if (websiteUrl) {
      colors = await extractColorsDeep(websiteUrl);
    } else if (manualColors) {
      colors = { primary: manualColors.primary, accent: manualColors.accent, lightBg: "#f6f6f6", textDark: "#000000", textMuted: "#3D4355" };
    } else {
      colors = { primary: "#000000", accent: "#5EC6C3", lightBg: "#f6f6f6", textDark: "#000000", textMuted: "#3D4355" };
    }

    const generationInput: GenerationInput = {
      coach: { ...coach, websiteUrl },
      product, targetAudience, testimonialQuote, testimonialAttribution, colors,
    };

    const prompt = buildGenerationPrompt(generationInput);
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: "You are a JSON generator. Return only valid JSON, no markdown formatting.",
      messages: [{ role: "user", content: prompt }],
    });

    const rawResponse = message.content[0].type === "text" ? message.content[0].text : null;
    if (!rawResponse) {
      return NextResponse.json({ success: false, error: "No response from AI" }, { status: 500 });
    }

    const parsed = parseGenerationResponse(rawResponse, generationInput);
    const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const landingPageData: LandingPageData = {
      ...parsed,
      coachId,
      generatedAt: new Date().toISOString(),
      published: false,
      slug,
    };

    await saveLandingPage(landingPageData);

    await logActivity(coachId, "landing_page.generated", `Landing page generated for ${product.name}`, { productId, slug });

    return NextResponse.json({ success: true, data: landingPageData });
  } catch (error) {
    console.error("Landing page generation failed:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Generation failed" }, { status: 500 });
  }
}
