import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import type { LandingPageData } from "@/lib/landing-page/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const coachId = req.headers.get("x-coach-id");
    if (!coachId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const data: LandingPageData = await req.json();

    await prisma.landingPage.upsert({
      where: { productId: data.productId },
      update: { slug: data.slug, data: data as object, published: data.published, updatedAt: new Date() },
      create: { productId: data.productId, coachId, slug: data.slug, data: data as object, published: data.published },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save landing page failed:", error);
    return NextResponse.json({ success: false, error: "Save failed" }, { status: 500 });
  }
}
