import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { ok, err, unauthorized } from "@/lib/api-response";
import { logActivity } from "@/lib/activity";
import { getNango } from "@/lib/nango";
import { getIntegrationDef, isNangoService } from "@/lib/integrations/registry";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const coachId = requireAuth(req);
  if (!coachId) return unauthorized();

  try {
    const { service, connected } = await req.json();
    if (!service) return err("service is required");

    // Real (Nango-backed) services authorize via the dedicated connect flow
    // (/api/integration/[service]/connect + /callback). Here we only handle
    // their DISCONNECT: revoke at Nango, then clear the row. A connect attempt
    // through this legacy endpoint is rejected so we never fake a real connection.
    if (isNangoService(service)) {
      if (connected) {
        return err("Use the Connect button to authorize this integration.");
      }
      const def = getIntegrationDef(service)!;
      const row = await prisma.integration.findUnique({
        where: { coachId_service: { coachId, service } },
      });
      if (row?.nangoConnectionId) {
        try {
          await getNango().deleteConnection(def.nangoProviderConfigKey, row.nangoConnectionId);
        } catch (error) {
          // Clear locally even if the remote revoke fails (e.g. already gone).
          console.error("Nango deleteConnection failed:", error);
        }
      }
      await prisma.integration.upsert({
        where: { coachId_service: { coachId, service } },
        update: { connected: false, nangoConnectionId: null, nangoProviderConfigKey: null },
        create: { coachId, service, connected: false },
      });
      await logActivity(coachId, "integration.disconnected", `${def.displayName} disconnected`, {
        service,
      });
      return ok({ connected: false });
    }

    // Legacy placeholder services (the other connectors): simple boolean toggle.
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
