import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { ok, err, unauthorized } from "@/lib/api-response";
import { getNango } from "@/lib/nango";
import { getIntegrationDef } from "@/lib/integrations/registry";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

/**
 * Persist a Nango connection after the browser completes the Connect UI flow.
 * Body: { connectionId } — the id from the Nango `connect` event.
 *
 * Note: a Nango webhook is the more robust source of truth (it fires even if the
 * user closes the tab). This frontend callback keeps the demo simple; adding a
 * webhook route later is the recommended hardening (see ONBOARDING/PR notes).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { service: string } }
) {
  const coachId = requireAuth(req);
  if (!coachId) return unauthorized();

  const def = getIntegrationDef(params.service);
  if (!def) return err("Unknown or unsupported integration", 404);

  let connectionId: string | undefined;
  try {
    ({ connectionId } = await req.json());
  } catch {
    return err("Invalid request body");
  }
  if (!connectionId) return err("connectionId is required");

  // Defense-in-depth: confirm the connection was created for THIS coach.
  // Best-effort — the browser `connect` event already confirmed success, so a
  // transient read error here should not block a legitimate connection.
  try {
    const conn = await getNango().getConnection(def.nangoProviderConfigKey, connectionId);
    const c = conn as unknown as {
      end_user?: { id?: string };
      endUser?: { id?: string };
    };
    const endUserId = c.end_user?.id ?? c.endUser?.id;
    if (endUserId && endUserId !== coachId) {
      return err("This connection does not belong to your account", 403);
    }
  } catch (error) {
    console.warn("Nango getConnection verification skipped:", error);
  }

  await prisma.integration.upsert({
    where: { coachId_service: { coachId, service: params.service } },
    update: {
      connected: true,
      nangoConnectionId: connectionId,
      nangoProviderConfigKey: def.nangoProviderConfigKey,
    },
    create: {
      coachId,
      service: params.service,
      connected: true,
      nangoConnectionId: connectionId,
      nangoProviderConfigKey: def.nangoProviderConfigKey,
    },
  });

  await logActivity(coachId, "integration.connected", `${def.displayName} connected`, {
    service: params.service,
  });

  return ok({ connected: true, service: params.service });
}
