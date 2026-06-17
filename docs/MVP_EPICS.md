# CoachOS MVP — Epic Breakdown (Bird's-Eye Plan)

## Context

CoachOS is an AI business-management platform for coaches (Next.js 14 App Router, Prisma/Postgres, OpenAI GPT-4o, Nango, Stripe, ElevenLabs). The current branch (`feat/nango-gmail-calendar-workflow`, PR #1) added the first two real integrations (Gmail + Google Calendar via Nango) to a foundation where **most of the product UI and API surface already exists and is wired** — Dashboard, Workflows, Second Brain, Concierge, Notifications, Chat, Onboarding, Auth, and the Landing Page builder/storefront are all built. Stripe checkout, products, token tracking, and Google OAuth are also already in the branch.

The gap between "demo-wired" and "finished MVP" is **deliberate fakes**:
- **Workflows**: only `pre-session-brief` runs for real (Calendar → Gmail draft); the other 7 templates return hardcoded simulated output (`/api/workflow/simulate`, [lib/workflows/runner.ts](../lib/workflows/runner.ts)).
- **Connectors**: only Gmail + Google Calendar use real Nango OAuth ([lib/integrations/registry.ts](../lib/integrations/registry.ts)); the other ~8 (Stripe, HubSpot, Zoom, LinkedIn, Instagram, Fathom, Mailchimp, Xero) are DB-boolean toggles.
- **Billing**: Stripe checkout session creation exists, but the webhook → credit-grant path is unverified and `CreditsTransaction` is an orphaned model (never written/read).
- **No triggers**: workflows only run on manual "Run now" — there is no scheduling.

**Decision (from the user):** finish the MVP by making *everything real* — every workflow executes, every connector gets real OAuth, payments work end-to-end. Add exactly one net-new feature: **scheduled/triggered workflows**. Everything else the MVP needs is already visible in the faked data. Slice the work **by layer/concern**, for a **3-dev team**.

This document defines the epics (the bird's-eye split) and their ordering. Task-level breakdown happens when each epic is picked up.

---

## Slicing approach

Sliced by **layer/concern**, as requested. Seven epics. Because "make everything real" is backend-heavy and the frontend is largely built, the backend concerns are split into focused engines (Integrations, Automation, AI, Billing) rather than one monolithic "backend" epic — this keeps three devs genuinely parallel instead of bottlenecked on one person.

**The one hard dependency to respect:** a workflow template can't execute for real until the connectors it touches are real. So **Epic 1 (Integrations) feeds Epic 2 (Automation)**. Everything else is largely independent and can run in parallel.

---

## The Epics (in execution order)

### Part 1 — Integrations & OAuth Layer  *(foundation — start first)*
**Concern:** every connector becomes a real Nango OAuth integration instead of a DB toggle.
**Why first:** unblocks real workflow execution (Part 2) and real billing-connector flows.
**Scope:**
- For each remaining service (Stripe, HubSpot, Zoom, LinkedIn, Instagram, Fathom, Mailchimp, Xero): configure the provider in Nango, add `lib/integrations/<service>.ts` with action functions, add one registry entry. The connect/callback/disconnect/run routes are already generic over the registry — no new routes needed (see [docs/INTEGRATIONS.md](./INTEGRATIONS.md)).
- Harden the OAuth lifecycle: move connection persistence from the frontend-callback shortcut to **Nango webhooks** ([app/api/integration/[service]/callback/route.ts](../app/api/integration/) notes this gap).
- Token-refresh / connection-health verification surfaced to the UI.
**Key files:** [lib/integrations/](../lib/integrations/) (registry, connection, per-service), [app/api/integration/](../app/api/integration/).
**Done when:** all connectors shown in the Connectors tab complete a real OAuth round-trip, persist via webhook, and report live connection status.

### Part 2 — Automation Engine: real execution + scheduling  *(new feature lives here)*
**Concern:** the workflow runtime — turn all 8 templates into real executions, then add triggers.
**Depends on:** Part 1 (each template's connectors must be real first).
**Scope:**
- Add `REAL_STEPS` + `ACTIONS` dispatch entries in [lib/workflows/runner.ts](../lib/workflows/runner.ts) for the remaining 7 templates (client-onboarding, post-session-intelligence, weekly-outreach, newsletter-draft, ai-conversation-followup, social-media-scheduling, invoice-automation). Reuse the existing pattern: `assertConnections()` before charging credits, record `WorkflowRun` on success/failure.
- Retire `/api/workflow/simulate` (or keep behind a demo flag) once a template is real.
- **New: scheduled/triggered workflows.** Add scheduling metadata to `WorkflowInstance` (e.g. cron/interval), a runner-invocation entrypoint, and a scheduler (Vercel Cron via `vercel.ts` crons → an `/api/cron/run-workflows` route that finds due active instances and runs them). Coordinates with Part 6 for the deploy-level cron config.
**Key files:** [lib/workflows/runner.ts](../lib/workflows/runner.ts), [lib/workflow-templates.ts](../lib/workflow-templates.ts), [app/api/workflow/run/route.ts](../app/api/workflow/run/), new `app/api/cron/`, [prisma/schema.prisma](../prisma/schema.prisma) (`WorkflowInstance` schedule fields + migration).
**Done when:** every active template produces a real side-effect, and an active scheduled workflow fires automatically without a manual click.

### Part 3 — Billing & Monetization Layer
**Concern:** real money in, real credits granted.
**Independent** of Parts 1–2.
**Scope:**
- Complete the Stripe loop: verify/implement the webhook handler ([app/api/billing/webhook/route.ts](../app/api/billing/)) so a completed checkout grants credits to the coach and writes a `CreditsTransaction` row (currently orphaned in [prisma/schema.prisma](../prisma/schema.prisma)).
- Wire `CreditsTransaction` with a proper `coachId` FK + index; make it the audit ledger for purchases alongside [lib/credits.ts](../lib/credits.ts) deductions.
- Add `STRIPE_SECRET_KEY` (+ webhook secret) to env docs ([.env.local.example](../.env.local.example) is missing it).
- Webhook signature verification + idempotency.
**Key files:** [app/api/billing/](../app/api/billing/), [lib/credits.ts](../lib/credits.ts), [prisma/schema.prisma](../prisma/schema.prisma).
**Done when:** a test-mode purchase increments credits exactly once, is verifiable in `CreditsTransaction`, and replaying the webhook is a no-op.

### Part 4 — AI Services Layer (hardening)
**Concern:** every GPT-4o / ElevenLabs endpoint becomes production-grade.
**Independent.**
**Scope:**
- Chat: add **streaming** responses ([app/api/chat/route.ts](../app/api/chat/) currently returns the whole completion); robust error/rate-limit handling; context window management.
- Harden generation endpoints (landing-page, knowledge, concierge) for malformed-JSON / API-failure paths so credits aren't lost on failure.
- TTS ([app/api/tts/route.ts](../app/api/tts/)) error handling + graceful degradation when ElevenLabs keys are absent.
- Consistent token logging via [lib/tokens.ts](../lib/tokens.ts) across all callers.
**Key files:** [app/api/chat/](../app/api/chat/), [app/api/tts/](../app/api/tts/), the three `*/generate/` routes, [lib/landing-page/](../lib/landing-page/), [lib/tokens.ts](../lib/tokens.ts).
**Done when:** chat streams, no AI endpoint charges credits on a failed generation, and all spend is recorded in `TokenUsage`.

### Part 5 — Frontend Integration & UX Polish
**Concern:** the client app consumes all the newly-real backends and feels finished.
**Soft dependency** on Parts 1–4 (can build against stubs; integrates as each lands).
**Scope:**
- New connect-flow UX for every Part-1 connector (drive entirely off the registry — the branch already did this for the real-connect flow; extend it).
- **Scheduling UI** in the Workflows tab (set/edit a schedule on an active workflow) for Part 2.
- Payment/purchase UX polish for Part 3 (success/failure return states from Stripe).
- Streaming chat UI for Part 4.
- Cross-cutting: loading / empty / error / optimistic states, and removing any remaining hardcoded demo affordances (e.g. the "create demo notification" button).
**Key files:** [components/coachos/CoachOS.tsx](../components/coachos/CoachOS.tsx) (the 6-tab shell), [components/landing-page/](../components/landing-page/), [app/chat/page.tsx](../app/chat/page.tsx).
**Done when:** every real backend has a polished UI path; no placeholder/demo-only controls remain in production paths.

### Part 6 — Platform, Infra & DevOps
**Concern:** ship it safely and repeatably.
**Independent** — can start day one.
**Scope:**
- CI: GitHub Actions for lint + `vitest run` + `next build` on every PR (none exists today).
- Deploy: `vercel.ts` config (framework, env, **crons** — needed by Part 2's scheduler), preview/prod pipeline.
- Env/secrets management across environments; document the `.env` vs `.env.local` split (Prisma reads only `.env`).
- Enable/repair ESLint (`next lint` is currently unconfigured).
- Observability: error tracking + structured logging; security hardening (webhook signature verification shared with Part 3, rate limiting on auth + AI routes).
**Key files:** new `.github/workflows/`, new `vercel.ts`, [package.json](../package.json), [next.config.mjs](../next.config.mjs), `.env.local.example`.
**Done when:** PRs are gated by green CI, the app deploys to Vercel with crons running, and errors are observable in production.

### Part 7 — Quality & Testing
**Concern:** close the coverage gaps and add end-to-end confidence.
**Cross-cutting** — runs alongside all epics; each epic ships with its own tests, this epic owns the gaps and E2E.
**Scope:**
- Unit/route tests for the currently-untested areas: Integrations connect/callback/toggle, Billing (checkout + webhook), live Chat POST, TTS, Google OAuth.
- E2E smoke (Playwright or similar) for the critical funnels: sign-up → onboarding → connect a real connector → run a scheduled workflow → buy credits.
- Wire the E2E + full suite into the Part-6 CI pipeline.
**Key files:** co-located `*.spec.ts` across `app/api/` and `lib/`, new E2E suite.
**Done when:** the untested routes are covered and the core funnels pass in CI.

---

## Suggested 3-dev parallelization

Epics are independent except Part 1 → Part 2. A natural assignment:

- **Dev A (Automation track):** Part 1 (Integrations) → Part 2 (Automation engine + scheduling). The critical path.
- **Dev B (Platform track):** Part 6 (Infra/CI/deploy — front-loaded so CI exists early) → Part 3 (Billing).
- **Dev C (Experience track):** Part 4 (AI hardening) → Part 5 (Frontend/UX), integrating other devs' backends as they land.
- **Part 7 (Testing)** is shared: each dev tests their own epic; whoever has slack owns the E2E suite + gap-filling, gated by Dev B's CI.

Ordering rationale: Part 1 unblocks the highest-risk work (Part 2) so it starts immediately; Part 6 is front-loaded so every other epic merges through green CI; Parts 3/4/5 carry no hard blockers and fill the parallel slots.

---

## Definition of done (MVP "finished")

Per-epic "Done when" above, plus one end-to-end demo that exercises every de-faked path:

1. Sign up → onboard → land on Dashboard.
2. Connect **two non-Gmail connectors** via real OAuth (Part 1) and see live status.
3. Activate a previously-simulated workflow, **Run now**, and confirm a real side-effect (Part 2).
4. Set a **schedule** on it and confirm it fires automatically via cron (Part 2 + Part 6).
5. **Buy a credit pack** in Stripe test mode and confirm credits increment once + a `CreditsTransaction` row (Part 3).
6. Open Chat and see a **streaming** reply (Part 4).
7. All of the above reachable through polished UI with proper loading/error states (Part 5), behind **green CI and a live Vercel deploy** (Part 6), covered by tests (Part 7).
