import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { templateId, active } = await req.json();
    const coach = await prisma.coach.findFirst();
    if (!coach) return NextResponse.json({ success: false, error: "No coach found" }, { status: 404 });

    await prisma.workflowInstance.upsert({
      where: { coachId_templateId: { coachId: coach.id, templateId } },
      update: { active },
      create: { coachId: coach.id, templateId, active },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Workflow toggle failed:", error);
    return NextResponse.json({ success: false, error: "Toggle failed" }, { status: 500 });
  }
}
