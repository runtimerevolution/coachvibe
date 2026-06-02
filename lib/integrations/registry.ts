import type { IntegrationDef } from "./types";

/**
 * Registry of integrations backed by a real Nango connection.
 *
 * To add a new integration:
 *   1. Configure the provider integration (+ OAuth scopes) in the Nango dashboard.
 *   2. Add a `lib/integrations/<service>.ts` module with typed action functions.
 *   3. Add one entry below keyed by the internal service id.
 *
 * The connect/callback/disconnect API routes and the workflow runner are generic
 * over this registry — no new routes are needed per integration. The Connectors
 * UI also routes the real connect flow off `isNangoService`, so a registry entry
 * is all that's required there (plus a `connectorsList` card if the connector is
 * brand new and needs display metadata — icon, colour, description).
 */
export const INTEGRATIONS: Record<string, IntegrationDef> = {
  gmail: {
    service: "gmail",
    nangoProviderConfigKey: "google-mail",
    displayName: "Gmail",
    scopes: ["https://www.googleapis.com/auth/gmail.compose"],
  },
  "google-calendar": {
    service: "google-calendar",
    nangoProviderConfigKey: "google-calendar",
    displayName: "Google Calendar",
    scopes: ["https://www.googleapis.com/auth/calendar.events.readonly"],
  },
};

export function getIntegrationDef(service: string): IntegrationDef | undefined {
  return INTEGRATIONS[service];
}

/** True if the service uses the real Nango connect flow (vs the legacy fake toggle). */
export function isNangoService(service: string): boolean {
  return service in INTEGRATIONS;
}

/** The list of real (Nango-backed) service ids — handy for the UI. */
export const NANGO_SERVICE_IDS = Object.keys(INTEGRATIONS);
