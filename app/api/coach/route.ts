import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { ok, err, unauthorized, notFound } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const coachId = requireAuth(req);
  if (!coachId) return unauthorized();

  try {
    const coach = await prisma.coach.findUnique({ where: { id: coachId } });
    if (!coach) return notFound("Coach");
    return ok({ coach });
  } catch (error) {
    console.error("Get coach failed:", error);
    return err("Failed to get coach", 500);
  }
}

export async function PATCH(req: NextRequest) {
  const coachId = requireAuth(req);
  if (!coachId) return unauthorized();

  try {
    const body = await req.json();
    const updated = await prisma.coach.update({
      where: { id: coachId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.bio !== undefined && { bio: body.bio }),
        ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
        ...(body.websiteUrl !== undefined && { websiteUrl: body.websiteUrl }),
        ...(body.personality !== undefined && { personality: body.personality }),
        ...(body.goals !== undefined && { goals: body.goals }),
        ...(body.hoursPerWeek !== undefined && { hoursPerWeek: body.hoursPerWeek }),
      },
    });
    return ok({
      coach: {
        id: updated.id,
        name: updated.name,
        bio: updated.bio,
        imageUrl: updated.imageUrl,
        websiteUrl: updated.websiteUrl,
        personality: updated.personality,
      },
    });
  } catch (error) {
    console.error("Update coach failed:", error);
    return err("Update failed", 500);
  }
}
