import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/session";
import { ok, unauthorized } from "@/lib/api-response";
import { getTokenStats } from "@/lib/tokens";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const coachId = requireAuth(req);
  if (!coachId) return unauthorized();

  const stats = await getTokenStats(coachId);
  return ok(stats);
}
