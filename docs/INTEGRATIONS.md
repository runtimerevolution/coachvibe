# Integrations (Nango) + manual workflows

This adds a **reusable integration layer** built on [Nango](https://nango.dev) and makes
two placeholder connectors real — **Gmail** and **Google Calendar** — plus one
**manually-triggered workflow** that reads your next Calendar event and creates a
Gmail draft (draft-only, safe). It maps to the existing `pre-session-brief` template.

The goal is reusability: adding integration #3 is "add a registry entry + a small
actions module" — no new API routes.

---

## 1. One-time Nango + Google setup

**Nango (free Cloud plan):**

1. Sign up at nango.dev, open the **DEV** environment.
2. Create two integrations: provider **`google-mail`** and **`google-calendar`**.
3. Copy the **Environment Secret Key** → `NANGO_SECRET_KEY` in `.env.local` (and
   `NANGO_HOST` if you self-host Nango — see `.env.local.example`).

**Google Cloud Console:**

1. New project → enable **Gmail API** + **Google Calendar API**.
2. OAuth consent screen → External, **Testing**; add your Google account under **Test users**.
3. Scopes: `gmail.compose` and `calendar.events.readonly`.
4. Create an **OAuth Web client**; set its redirect URI to the callback Nango shows
   for each integration. Paste the Client ID/Secret into both Nango integrations.

> Restricted/sensitive scopes show an "unverified app" warning and cap at 100 test
> users while the app is in Testing — fine for development. Production with these
> scopes requires Google's annual security assessment.

## 2. How it works

| File                                     | Role                                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------------------- |
| `lib/nango.ts`                           | Lazy server Nango client (`getNango()`); never throws at import.                      |
| `lib/integrations/registry.ts`           | **Source of truth.** service id → `{ nangoProviderConfigKey, displayName, scopes }`.  |
| `lib/integrations/types.ts`              | `IntegrationConnection`, `IntegrationDef`.                                            |
| `lib/integrations/gmail.ts`              | `createDraft(conn, {subject, body, to?})`.                                            |
| `lib/integrations/google-calendar.ts`    | `getNextEvent(conn)`.                                                                 |
| `lib/integrations/connection.ts`         | `getConnection(coachId, service)` — the "is it really connected?" gate.               |
| `app/api/integration/[service]/connect`  | Creates a Nango connect session (generic).                                            |
| `app/api/integration/[service]/callback` | Persists the returned `connectionId` (generic).                                       |
| `app/api/integration/toggle`             | Disconnect (revokes at Nango) + legacy boolean toggle for placeholder connectors.     |
| `lib/workflows/runner.ts`                | `REAL_STEPS` per template + `ACTIONS` dispatch + `runWorkflow` / `assertConnections`. |
| `app/api/workflow/run`                   | Manual real run: guard → charge → run → record (mirrors `simulate`).                  |

**Connect flow:** Connect button → `POST /connect` (session token) → Nango Connect UI →
on success the browser posts the `connectionId` to `/callback` → stored on the
`Integration` row (`nangoConnectionId`). Provider API calls go through the **Nango
Proxy** (`nango.get/post`), which injects and refreshes the OAuth token.

## 3. Add another integration

1. Configure the provider integration (+ scopes + OAuth app) in the Nango dashboard.
2. Add `lib/integrations/<service>.ts` with action functions `(conn, …) => conn.nango.get/post(...)`.
3. Add one entry to `INTEGRATIONS` in `lib/integrations/registry.ts`. The Connectors UI
   picks up the real connect flow from this automatically (via `isNangoService`).
4. If the connector is brand new, add a `connectorsList` card in `components/coachos/CoachOS.tsx`
   for its display metadata (icon, colour, description).
5. To run it in a workflow: add a `REAL_STEPS` entry + any new `ACTIONS` in `lib/workflows/runner.ts`.

The connect/callback/disconnect/run routes are generic over the registry — no new routes.

## 4. Verify

- Connectors tab → **Connect** Gmail and Google Calendar (real OAuth via Nango).
- Workflows tab → activate **Pre-session brief** → **Run now (real)** → a draft appears
  in Gmail; `WorkflowRun.output` has real `calendarEventId` / `gmailDraftId`.
- Disconnect one → Run now → "Connect … to run this workflow" and **no credit charged**.
- `npm test` covers the route (guard/credits/failure) and the runner (dispatch/skip/failure).

## Known issues / notes

- **`next lint` is not configured** in the repo (prompts to set up ESLint). Type safety is
  covered by `tsc --noEmit` and the test suite.
- **Webhook backstop (optional):** connections are persisted via the frontend callback.
  Adding `app/api/integration/webhook` (verify with `nango.verifyIncomingWebhookRequest`)
  makes it robust if a user closes the tab mid-OAuth.
- **Connection ownership check** in the callback is best-effort; harden before production.
- **Charge/run atomicity:** `/api/workflow/run` deducts the credit, then writes the
  `WorkflowRun`. These are two separate writes, so the "a charge always has a recorded
  run" guarantee breaks in the rare case where the `WorkflowRun` insert fails after the
  deduction succeeds. Acceptable for the demo (same DB, back-to-back writes); the
  production fix is a transaction or a refund-on-failure path.
- **Free plan:** 10 connections (~5 coaches × 2 services) — ample for a demo.
