import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { ok, err, unauthorized } from "@/lib/api-response";
import { getNango, isNangoConfigured } from "@/lib/nango";
import { getIntegrationDef } from "@/lib/integrations/registry";

export const dynamic = "force-dynamic";

/**
 * Start a Nango Connect session for the given integration. The browser uses the
 * returned session token to open the Nango Connect UI and complete OAuth.
 * The session is scoped to this coach (`end_user.id`) and to a single provider.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { service: string } }
) {
  const coachId = requireAuth(req);
  if (!coachId) return unauthorized();

  const def = getIntegrationDef(params.service);
  if (!def) return err("Unknown or unsupported integration", 404);

  if (!isNangoConfigured()) {
    return err("Nango is not configured. Set NANGO_SECRET_KEY in .env.local.", 503);
  }

  try {
    const coach = await prisma.coach.findUnique({
      where: { id: coachId },
      select: { email: true, name: true },
    });

    const session = await getNango().createConnectSession({
      end_user: {
        id: coachId,
        email: coach?.email ?? undefined,
        display_name: coach?.name ?? undefined,
      },
      allowed_integrations: [def.nangoProviderConfigKey],
    });

    return ok({ sessionToken: session.data.token });
  } catch (error) {
    console.error("Nango createConnectSession failed:", error);
    return err("Could not start the connection. Please try again.", 502);
  }
}
