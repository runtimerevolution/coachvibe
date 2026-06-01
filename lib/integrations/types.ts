import type { Nango } from "@nangohq/node";

/**
 * A coach's live connection to one integration, ready to make API calls.
 * Built by `getConnection()` from the stored Nango connection id.
 */
export interface IntegrationConnection {
  nango: Nango;
  /** Our internal service id, e.g. "gmail". */
  service: string;
  /** The Nango connection id created when the coach connected the service. */
  connectionId: string;
  /** The Nango integration id (provider config key), e.g. "google-mail". */
  providerConfigKey: string;
}

/**
 * Static definition of a supported integration. One entry per integration lives
 * in `registry.ts`. Action functions (the actual API calls) live in the matching
 * `lib/integrations/<service>.ts` module.
 */
export interface IntegrationDef {
  /** Internal service id — matches `connectorsList` and `Integration.service`. */
  service: string;
  /** Nango integration id (provider config key) configured in the Nango dashboard. */
  nangoProviderConfigKey: string;
  /** Human-friendly label used in UI and error messages. */
  displayName: string;
  /**
   * OAuth scopes — for documentation/reference. The authoritative scopes are
   * configured per-integration in the Nango dashboard.
   */
  scopes: string[];
}
