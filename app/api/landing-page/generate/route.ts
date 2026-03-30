import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { extractColorsDeep } from "@/lib/landing-page/color-extractor";
import { buildGenerationPrompt, parseGenerationResponse } from "@/lib/landing-page/prompt";
import type { CoachProfile, GenerationInput, LandingPageColors, LandingPageData, ProductInfo } from "@/lib/landing-page/types";
import prisma from "@/lib/db";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Fetch coach profile from DB
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

// Fetch product info from DB
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

// Save landing page to DB
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

// Deduct credits
async function deductCredits(coachId: string): Promise<boolean> {
  const coach = await prisma.coach.findUnique({ where: { id: coachId }, select: { credits: true } });
  if (!coach || coach.credits < 1) return false;
  await prisma.coach.update({ where: { id: coachId }, data: { credits: { decrement: 1 } } });
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const coachId = req.headers.get("x-coach-id");
    if (!coachId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { productId, targetAudience, websiteUrl, testimonialQuote, testimonialAttribution, manualColors } = body;

    if (!productId || !targetAudience) {
      return NextResponse.json({ success: false, error: "productId and targetAudience are required" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ success: false, error: "OpenAI API key not configured" }, { status: 500 });
    }

    const hasCredits = await deductCredits(coachId);
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
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a JSON generator. Return only valid JSON, no markdown formatting." },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const rawResponse = completion.choices[0]?.message?.content;
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

    return NextResponse.json({ success: true, data: landingPageData });
  } catch (error) {
    console.error("Landing page generation failed:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Generation failed" }, { status: 500 });
  }
}
