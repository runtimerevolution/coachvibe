import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { service, connected } = await req.json();
    const coach = await prisma.coach.findFirst();
    if (!coach) return NextResponse.json({ success: false, error: "No coach found" }, { status: 404 });

    await prisma.integration.upsert({
      where: { coachId_service: { coachId: coach.id, service } },
      update: { connected },
      create: { coachId: coach.id, service, connected },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Integration toggle failed:", error);
    return NextResponse.json({ success: false, error: "Toggle failed" }, { status: 500 });
  }
}
