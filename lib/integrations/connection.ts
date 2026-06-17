import prisma from "@/lib/db";
import { getNango } from "@/lib/nango";
import { getIntegrationDef } from "./registry";
import type { IntegrationConnection } from "./types";

/**
 * Build a usable IntegrationConnection for a coach + service, or null if the
 * coach has not completed a real Nango connection for it (i.e. the row is
 * missing, not `connected`, or has no `nangoConnectionId`).
 *
 * This is the single gate the rest of the app uses to decide "is this really
 * connected and ready to call?".
 */
export async function getConnection(
  coachId: string,
  service: string
): Promise<IntegrationConnection | null> {
  const def = getIntegrationDef(service);
  if (!def) return null;

  const row = await prisma.integration.findUnique({
    where: { coachId_service: { coachId, service } },
  });
  if (!row?.connected || !row.nangoConnectionId) return null;

  return {
    nango: getNango(),
    service,
    connectionId: row.nangoConnectionId,
    providerConfigKey: row.nangoProviderConfigKey ?? def.nangoProviderConfigKey,
  };
}
