import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/coach — returns the demo coach (first in DB, creating if needed)
export async function GET() {
  try {
    let coach = await prisma.coach.findFirst();
    if (!coach) {
      coach = await prisma.coach.create({
        data: {
          name: "Demo Coach",
          email: "demo@coachvibe.app",
          bio: "I help ambitious coaches build thriving businesses without burning out. I've worked with 200+ coaches over the past 8 years.",
          imageUrl: "https://api.dicebear.com/7.x/personas/svg?seed=coach",
          personality: "warm, direct, and confident",
          credits: 500,
        },
      });
    }
    return NextResponse.json({ success: true, coach });
  } catch (error) {
    console.error("Get coach failed:", error);
    return NextResponse.json({ success: false, error: "Failed to get coach" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const coach = await prisma.coach.findFirst();
    if (!coach) return NextResponse.json({ success: false, error: "No coach found" }, { status: 404 });

    const updated = await prisma.coach.update({
      where: { id: coach.id },
      data: {
        name: body.name ?? coach.name,
        bio: body.bio ?? coach.bio,
        imageUrl: body.imageUrl ?? coach.imageUrl,
        websiteUrl: body.websiteUrl ?? coach.websiteUrl,
        personality: body.personality ?? coach.personality,
      },
    });
    return NextResponse.json({ success: true, coach: updated });
  } catch (error) {
    console.error("Update coach failed:", error);
    return NextResponse.json({ success: false, error: "Update failed" }, { status: 500 });
  }
}
