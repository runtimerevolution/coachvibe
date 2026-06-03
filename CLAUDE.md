# CoachOS — CLAUDE.md

## What This Project Is

CoachOS is an AI-powered business management platform for coaches. It gives coaches a central workspace for managing automations (workflows), client intelligence (second brain), task management (concierge), and a landing page builder — all powered by GPT-4o.

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14.2 (App Router) |
| Language | TypeScript 5.6 |
| Frontend | React 18 — mix of Server and Client components |
| Styling | Inline styles only — no CSS framework, no Tailwind |
| Database | PostgreSQL via Prisma 5 ORM |
| AI | OpenAI GPT-4o (`openai` SDK) |
| TTS | ElevenLabs (REST calls) |
| Integrations | Nango — managed OAuth + API proxy (real Gmail & Google Calendar) |
| Auth | Custom cookie-based — session cookie stores `coachId` |
| Testing | Vitest 4 — unit + API route tests, node environment |

## Project Structure

```
app/
  actions.ts              # Server Actions: signIn, signUp, signOut, completeOnboarding
  api/                    # Route Handlers (REST API)
  dashboard/page.tsx
  sign-in/page.tsx
  sign-up/page.tsx
  onboarding/page.tsx
  chat/page.tsx
  landing-page/page.tsx
  shop/[slug]/page.tsx    # Public published landing page
components/
  auth/OnboardingWizard.tsx
  coachos/CoachOS.tsx     # Main dashboard shell — all 6 tabs live here
  landing-page/
  voice/
lib/
  auth.ts                 # Cookie helpers, readAuthState(), getCoachIdFromCookie()
  session.ts              # requireAuth() for API routes
  db.ts                   # Prisma client singleton
  credits.ts              # deductCredits() helper
  notifications.ts        # createNotification() helper
  activity.ts             # logActivity() helper
  time.ts                 # timeAgo() relative time helper
  api-response.ts         # ok(), err(), unauthorized() response helpers
  workflow-templates.ts   # Hardcoded workflow template definitions (never in DB)
  workflows/runner.ts     # Real workflow execution — REAL_STEPS, ACTIONS, assertConnections()
  nango.ts                # Server-side Nango client (lazy init; never throws at import)
  integrations/           # Registry (source of truth) + per-service actions: gmail, google-calendar
  landing-page/           # Prompt builders and color extractor
prisma/
  schema.prisma
  seed.ts                 # Demo user: demo@demo.com / demo
```

## Auth Model

- Session is stored in an `httpOnly` cookie named `coachvibe_session`
- Cookie value is the `coachId` (Prisma cuid) — not the email
- `lib/auth.ts` → `getCoachIdFromCookie()` reads the cookie in Server Components and Actions
- `lib/session.ts` → `requireAuth(req)` reads the cookie in API Route Handlers; returns `coachId` string or throws a 401 `NextResponse`
- Every API route calls `requireAuth(req)` at the top — never `prisma.coach.findFirst()`
- Passwords are hashed with `bcryptjs` (not `bcrypt` — pure JS, no native bindings)

## Database Conventions

- All models use `cuid()` as primary key
- Cascading deletes on all Coach → child relations
- Never query by `findFirst()` without a `where` clause — always scope to `coachId`
- `WorkflowTemplate` data lives in `lib/workflow-templates.ts` as a TypeScript constant, never in the DB

## API Route Conventions

Every route handler follows this shape:

```typescript
import { requireAuth } from "@/lib/session"
import { ok, err, unauthorized } from "@/lib/api-response"

export async function GET(req: NextRequest) {
  const coachId = await requireAuth(req)   // throws 401 if unauthenticated
  // ...
  return ok({ ... })
}
```

- All responses use `ok()`, `err()`, or `unauthorized()` from `lib/api-response.ts`
- Return shape is always `{ success: true, data }` or `{ success: false, error: string }`
- No `x-coach-id` headers — auth always comes from the session cookie

## Testing Conventions

- Test runner: `vitest run` (or `npm test`)
- All test files: `*.spec.ts` co-located next to the file they test
- Environment: `node` (no jsdom)
- Mocking pattern: `vi.hoisted()` for mock factories, `vi.mock("@/lib/db", ...)` for Prisma
- Mock `lib/session.ts` to return a fixed `coachId` in API route tests — don't test auth in feature tests
- Tests do NOT hit a real database — all Prisma calls are mocked via `vi.mock("@/lib/db")`
- `lib/` helpers (pure logic, no DB) are tested without mocks where possible

### Running tests

```bash
npm test          # run all specs once
npm run test:watch  # watch mode
```

## Key Scripts

```bash
npm run dev          # start dev server
npm test             # run all specs
npm run db:migrate   # prisma migrate dev
npm run db:generate  # prisma generate (after schema changes)
npm run db:studio    # prisma studio GUI
npx prisma db seed   # seed demo user (demo@demo.com / demo)
```

## Credits System

- Each `Coach` starts with 500 credits
- Deductions happen in `lib/credits.ts` via `deductCredits(coachId, amount, reason)`
- Credit costs: chat message = 1, TTS = 2, landing page generation = 10, workflow run = template's `creditCost`
- When credits drop below 50, a warning `Notification` is created (max once per 24h)
- Credits are never negative — `deductCredits` returns `false` if insufficient

## Workflow Templates

- Defined in `lib/workflow-templates.ts` — 8 pre-built templates
- Templates are never stored in the DB (they're product-defined constants)
- `WorkflowInstance` in DB links a coach to a `templateId` string and tracks `active` state
- `WorkflowRun` records executions — `/api/workflow/simulate` writes fake output; `/api/workflow/run` writes real output for templates that have `REAL_STEPS` in `lib/workflows/runner.ts` (currently `pre-session-brief`)

## Integrations

- Real integrations run through **Nango** (managed OAuth, token storage/refresh, and an API proxy). The secret key (`NANGO_SECRET_KEY`) is server-side only; the browser uses `@nangohq/frontend` with a short-lived connect session token.
- `lib/integrations/registry.ts` is the **single source of truth** for which services are real — `isNangoService(id)`. Both the API routes and the Connectors UI key off it; never hardcode the real-service list.
- Add an integration: (1) configure the provider in Nango, (2) add `lib/integrations/<service>.ts` with action functions, (3) add one entry to the registry. The connect/callback/disconnect/run routes are generic over the registry — no new routes needed.
- Gmail is **draft-only** — it creates drafts via the Gmail API and never sends.
- The connect/callback/toggle routes live under `app/api/integration/`; connections are verified (`assertConnections`) **before** credits are charged in `/api/workflow/run`.
- Connectors other than Gmail and Google Calendar are still fake DB toggles (see "What Is Intentionally Not Implemented"). Full setup: `docs/INTEGRATIONS.md`.

## Notifications + Activity Log

- `lib/notifications.ts` → `createNotification(coachId, { title, body, type })`
- `lib/activity.ts` → `logActivity(coachId, action, label, metadata?)`
- Standard `action` strings: `workflow.activated`, `workflow.deactivated`, `workflow.run`, `integration.connected`, `integration.disconnected`, `landing_page.published`, `landing_page.generated`, `onboarding.completed`, `chat.message`
- Call these helpers from API routes after mutations — never inline Prisma calls for notifications/activity

## Seed Data

Demo credentials: **email:** `demo@demo.com` | **password:** `demo`

Run: `npx prisma db seed`

The seed creates a fully populated coach with workflows, integrations, concierge tasks, knowledge entries, activity logs, notifications, and a landing page — enough to demo every feature without any manual setup.

## What Is Intentionally Not Implemented

- Real OAuth for connectors **other than** Gmail and Google Calendar (Stripe, HubSpot, Zoom, LinkedIn, etc.) — those remain fake DB toggles. Gmail and Google Calendar are real (Nango OAuth) — see the **Integrations** section.
- Real execution for most workflows — only templates with `REAL_STEPS` (currently `pre-session-brief`) run for real via `/api/workflow/run`; `/api/workflow/simulate` still returns fake output and other templates have no real steps yet.
- Payment/credits purchase flow
- Push notifications (browser/mobile)
- Admin or analytics pages
