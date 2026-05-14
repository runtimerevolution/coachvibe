import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { ok, err, unauthorized } from "@/lib/api-response";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const coachId = requireAuth(req);
  if (!coachId) return unauthorized();

  try {
    const { service, connected } = await req.json();
    if (!service) return err("service is required");

    await prisma.integration.upsert({
      where: { coachId_service: { coachId, service } },
      update: { connected },
      create: { coachId, service, connected },
    });

    await logActivity(
      coachId,
      connected ? "integration.connected" : "integration.disconnected",
      connected ? `${service} connected` : `${service} disconnected`,
      { service }
    );

    return ok({ connected });
  } catch (error) {
    console.error("Integration toggle failed:", error);
    return err("Toggle failed", 500);
  }
}
