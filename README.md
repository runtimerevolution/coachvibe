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

- Node.js 20+
- PostgreSQL database
- OpenAI API key
- ElevenLabs API key (optional, for voice)

### Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Create a `.env` file in the project root:

   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/coachos"
   OPENAI_API_KEY="sk-..."
   ELEVENLABS_API_KEY="..."        # optional
   ELEVENLABS_VOICE_ID="..."       # optional
   ```

3. **Set up the database**

   ```bash
   npm run db:migrate
   npm run db:generate
   ```

4. **Seed demo data** (optional)

   ```bash
   npx prisma db seed
   ```

   This creates a fully populated demo account:
   - **Email:** `demo@demo.com`
   - **Password:** `demo`

5. **Start the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev           # Start dev server
npm test              # Run all tests once
npm run test:watch    # Watch mode
npm run build         # Production build
npm start             # Start production server
npm run lint          # Lint

npm run db:migrate    # Run Prisma migrations
npm run db:generate   # Regenerate Prisma client
npm run db:studio     # Open Prisma Studio GUI
npx prisma db seed    # Seed demo data
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

## What Is Not Implemented

- Real OAuth for Gmail, Stripe, HubSpot, Zoom, LinkedIn — integrations are a DB toggle only
- Real workflow execution — runs produce simulated output
- Payment or credits purchase flow
- Push notifications (browser/mobile)
- Admin or analytics pages
