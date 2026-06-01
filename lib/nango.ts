import { Nango } from "@nangohq/node";

/**
 * Server-side Nango client.
 *
 * The secret key authorizes creating connect sessions, reading connections, and
 * proxying provider API calls. It must NEVER be exposed to the browser.
 *
 * Initialized lazily so importing this module never throws when the key is
 * absent — routes can call `isNangoConfigured()` and return a friendly error
 * instead of crashing the app before Nango is set up.
 */
let client: Nango | null = null;

export function isNangoConfigured(): boolean {
  return Boolean(process.env.NANGO_SECRET_KEY);
}

export function getNango(): Nango {
  const secretKey = process.env.NANGO_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "NANGO_SECRET_KEY is not set. Add it to .env.local (see .env.local.example)."
    );
  }
  if (!client) {
    client = new Nango({
      secretKey,
      ...(process.env.NANGO_HOST ? { host: process.env.NANGO_HOST } : {}),
    });
  }
  return client;
}
