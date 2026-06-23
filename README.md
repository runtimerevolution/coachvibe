# CoachOS

An AI-powered business management platform for coaches. CoachOS provides a central workspace for automating client workflows, managing knowledge, organizing tasks, and publishing landing pages — all powered by GPT-4o.

## Features

| Tab | Description |
|-----|-------------|
| **Dashboard** | Stats overview, recent activity, notifications, and credits balance |
| **Workflows** | 8 pre-built automation templates (client onboarding, session follow-ups, outreach, etc.) |
| **Second Brain** | AI-assisted knowledge base for coaching content and client insights |
| **Concierge** | Task management with priority, points, and AI-generated task suggestions |
| **Landing Page** | AI-assisted landing page builder with publishing and public shop URLs |
| **Chat** | GPT-4o assistant with optional ElevenLabs voice responses |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14.2 (App Router) |
| Language | TypeScript 5.6 |
| Frontend | React 18 — Server and Client components |
| Styling | Inline styles only (no CSS framework) |
| Database | PostgreSQL via Prisma 5 ORM |
| AI | OpenAI GPT-4o |
| TTS | ElevenLabs (REST) |
| Auth | Custom httpOnly cookie session |
| Testing | Vitest 4 |

## Getting Started

### Prerequisites

- **Node.js 20+**
- **Docker** (Docker Desktop or Engine + Compose v2) — runs the local PostgreSQL database
- **OpenAI API key** — only needed for the Chat and Landing Page AI features
- _Optional:_ ElevenLabs API key (voice), Nango secret key (real Gmail / Google Calendar integrations)

> You do **not** need a system PostgreSQL install — the database runs in Docker (see step 3).

### Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

   The `postinstall` hook runs `prisma generate` automatically.

2. **Create the environment files**

   A fresh clone has no env files — create both from the committed templates:

   ```bash
   cp .env.example .env             # database connection (Prisma CLI reads this)
   cp .env.local.example .env.local # app secrets (Next.js reads this)
   ```

   Why two files? The Prisma CLI (`migrate`, `seed`, `studio`) only auto-loads `.env`,
   so `DATABASE_URL` must live there. Next.js reads both.

   - **`.env`** works as-is — its `DATABASE_URL` already matches the Docker database in step 3:

     ```env
     DATABASE_URL="postgresql://coachos:coachos@localhost:5432/coachos"
     ```

   - **`.env.local`** — fill in the secrets you need (all optional for first boot except OpenAI,
     which the Chat and Landing Page features call):

     ```env
     OPENAI_API_KEY=sk-...           # required for Chat + Landing Page AI
     ELEVENLABS_API_KEY=...          # optional — voice responses
     ELEVENLABS_VOICE_ID=...         # optional
     NANGO_SECRET_KEY=...            # optional — real Gmail / Google Calendar
     NANGO_HOST=https://api.nango.dev
     NANGO_GOOGLE_CLIENT_ID=...      # optional — your Google OAuth app, for Nango's developer-app config
     NANGO_GOOGLE_CLIENT_SECRET=...  # optional — (reference only; not read by the app at runtime)
     ```

3. **Start the database**

   ```bash
   docker compose up -d
   ```

   This starts PostgreSQL 16 on `localhost:5432` (user / password / db all `coachos`),
   matching the `DATABASE_URL` above. Data persists in the `coachos-pgdata` Docker volume.

   ```bash
   docker compose down        # stop (keeps data)
   docker compose down -v     # stop AND wipe data — use to start completely fresh
   ```

4. **Apply migrations**

   ```bash
   npx prisma migrate deploy   # applies all existing migrations to a clean DB
   ```

   When changing the schema during development, use `npm run db:migrate` instead
   (creates a new migration interactively).

5. **Seed demo data** (recommended)

   ```bash
   npm run db:seed
   ```

   This creates a fully populated demo account:
   - **Email:** `demo@demo.com`
   - **Password:** `demo`

6. **Start the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) and sign in with the demo credentials.

### From-scratch database reset

To rebuild the database completely (drop all data, re-apply migrations, re-seed):

```bash
docker compose down -v
docker compose up -d
npx prisma migrate deploy
npm run db:seed
```

## Scripts

```bash
npm run dev           # Start dev server
npm test              # Run all tests once
npm run test:watch    # Watch mode
npm run build         # Production build
npm start             # Start production server
npm run lint          # Lint

npm run db:migrate    # Create + apply a migration (interactive, for dev)
npm run db:generate   # Regenerate Prisma client
npm run db:studio     # Open Prisma Studio GUI
npm run db:seed       # Seed demo data

docker compose up -d  # Start the local Postgres database
docker compose down   # Stop the database (keeps data)
docker compose down -v # Stop the database and wipe all data
```

## Project Structure

```
app/
  actions.ts              # Server Actions: signIn, signUp, signOut, completeOnboarding
  api/                    # Route handlers
  dashboard/              # Main dashboard page
  chat/                   # AI chat page
  landing-page/           # Landing page builder page
  shop/[slug]/            # Public landing page (unauthenticated)
  sign-in/ sign-up/ onboarding/
components/
  auth/                   # OnboardingWizard, AuthShell
  coachos/CoachOS.tsx     # Dashboard shell — all 6 tabs
  landing-page/           # Builder, renderer, editable text
  voice/                  # TTS toggle and voice bubble
lib/
  auth.ts                 # Cookie helpers
  session.ts              # requireAuth() for API routes
  db.ts                   # Prisma client singleton
  credits.ts              # deductCredits() helper
  notifications.ts        # createNotification() helper
  activity.ts             # logActivity() helper
  api-response.ts         # ok(), err(), unauthorized()
  workflow-templates.ts   # 8 hardcoded workflow template definitions
prisma/
  schema.prisma
  seed.ts
```

## Authentication

Sessions use an `httpOnly` cookie (`coachvibe_session`) that stores the coach's `coachId`. There is no JWT — the cookie value is the Prisma `cuid` for the `Coach` row.

- Server Components/Actions: `getCoachIdFromCookie()` from `lib/auth.ts`
- API Route Handlers: `requireAuth(req)` from `lib/session.ts` — returns `coachId` or throws a 401

## Credits System

Each coach starts with 500 credits. Operations deduct credits via `deductCredits()`:

| Action | Cost |
|--------|------|
| Chat message | 1 credit |
| TTS voice message | 2 credits |
| Landing page generation | 10 credits |
| Workflow run | 3–8 credits (template-defined) |

Credits cannot go negative. A warning notification fires when the balance drops below 50 (at most once per 24 hours).

## Testing

Tests live as `*.spec.ts` files alongside the code they test. The database is fully mocked — no real PostgreSQL connection is needed to run tests.

```bash
npm test
```

All API route tests mock `lib/session.ts` to return a fixed `coachId`. Pure logic in `lib/` is tested without mocks.

## Integrations

Real integrations run through **Nango** (managed OAuth, token storage/refresh, and an API
proxy). **Gmail** (draft-only) and **Google Calendar** are real; set `NANGO_SECRET_KEY` in
`.env.local` to use them. The registry in `lib/integrations/registry.ts` is the single source
of truth for which services are real. See `docs/INTEGRATIONS.md` for full setup.

## What Is Not Implemented

- Real OAuth for connectors **other than** Gmail and Google Calendar (Stripe, HubSpot, Zoom, LinkedIn) — those remain fake DB toggles
- Real execution for most workflows — only `pre-session-brief` runs for real via `/api/workflow/run`; other templates produce simulated output
- Payment or credits purchase flow
- Push notifications (browser/mobile)
- Admin or analytics pages
