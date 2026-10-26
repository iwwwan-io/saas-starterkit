# Shared Memory

Durable knowledge for every mode. This is the office's long-term memory: architecture,
decisions, and the traps that are expensive to rediscover. Keep it short and true — a
stale memory is worse than none.

Sources of truth, in order: **the code** → `AGENTS.md` → this file. When they disagree,
fix this file.

## Core architecture

**What this is.** A reusable SaaS starter kit: a production-ready GitHub template for
launching multi-tenant SaaS on Next.js 16, Better Auth, Drizzle, and Midtrans (Indonesian
payments). It is a **modular monolith** — one deployable, but with enforced domain
boundaries so the domains do not tangle.

**Stack.** Next.js 16.4.2 (App Router, RSC, Server Actions, Route Handlers) · TypeScript 5
strict · React 19 · Tailwind CSS v4 · shadcn/ui + ReUI · PostgreSQL + Drizzle ORM/Kit ·
Better Auth 1.7 (email+password, session cookies, organizations plugin) · Midtrans (Snap +
SHA-512 webhooks) · Zod 4 · pnpm 12.14.0 · Node 22.23.1.

**Layering.** Data flows in one direction:

```text
src/app/**        routes, layouts, client components  (no domain logic)
   ↓
src/modules/**    domain logic: billing, account, organization
   ↓
src/server/db/**  Drizzle schema + client + migrations
```

Cross-cutting: `src/env.ts` (Zod-validated env), `src/lib/**` (client auth hooks, `cn`),
`src/server/auth/**` (Better Auth config + org auth helpers).

**Domain modules.**

| Module | Files | Responsibility |
| :--- | :--- | :--- |
| billing | `midtrans-client.ts`, `plans.ts`, `service.ts`, `date-utils.ts`, `types.ts` | pricing, checkout, webhook processing |
| account | `deletion-guard.ts` | blocks unsafe self-serve account deletion |
| organization | `member-management.ts` | role/removal rules mirroring the org plugin |

**Tenancy model.** Every user gets a personal workspace by default; organizations are
optional and multi-tenant. A subscription can belong to **either** a user or an
organization — this is why the deletion guard exists (see invariants below).

## Decision Log

Decisions a future session must not silently reverse. Append new entries; never rewrite
an old one to hide a change.

### D-1: Modular monolith with `src/modules/**` as the domain layer
- Date: 2026-10-26
- Mode: architecture
- Decision: Keep one deployable, but put domain logic in `src/modules/**`, never in route
  handlers or components.
- Why: The repo is a *template* others will build on; boundary drift is the main way such
  templates rot. Route handlers stay thin so the billing/account/org logic stays testable
  without HTTP.
- Rejected: A full monorepo with separate packages — too much ceremony for a starter kit.
- Guard: Unit tests target `src/modules/**` directly (e.g. `tests/billing-lifecycle.test.ts`).

### D-2: `plans.ts` is the single source of truth for price and interval
- Date: 2026-10-26
- Mode: architecture
- Decision: `getPlanAmount` / `isSupportedInterval` / `getPlanDisplay` in
  `src/modules/billing/plans.ts` are the only place a charge is computed.
- Why: A lifetime period sold at the monthly price was a real escalation bug. Pricing UI
  and the charged amount had drifted apart.
- Rejected: Computing the amount inline in the checkout route or the pricing component.
- Guard: `tests/plan-interval-validation.test.ts`, `tests/gross-amount-validation.test.ts`;
  `createCheckoutSession` also validates, covering non-HTTP callers.

### D-3: Account deletion is guarded, and a sole-member org cascades
- Date: 2026-10-26
- Mode: security
- Decision: `beforeDelete` calls `findDeletionBlockers`. Deletion is blocked only while
  the user is a **sole owner with other members remaining**, or the **payer of a live
  plan**. An org whose only member is the deleting user is deleted explicitly and allowed
  to cascade away.
- Why: `order.userId` and `subscription.userId` cascade on user delete, so an unguarded
  delete by a paying member would silently destroy a shared workspace's plan and payment
  history. But no FK links `user` to `organization` (only `member.userId` cascades), so
  without the explicit delete a sole member would strand an org row holding a unique slug.
- Rejected: (a) no guard — data loss; (b) blocking all deletions by owners — traps users
  with no self-serve way out.
- Guard: `tests/account-deletion-guard.test.ts`,
  `tests/integration/account-deletion-guard.test.ts` (cascade safety, 10 scenarios).

### D-4: The deletion guard has a self-serve escape route on the Organizations page
- Date: 2026-10-26
- Mode: backend + frontend
- Decision: A blocked sole owner promotes another member to owner (or removes the others)
  from the members grid, then deletes. `src/modules/organization/member-management.ts`
  mirrors better-auth's organization-plugin guards so the UI only offers actions the
  server accepts.
- Why: The guard's message told users to promote someone, but the page had no role or
  removal actions — a dead end.
- Rejected: UI-only permission rules — they drift from the plugin and offer actions that
  then fail server-side.
- Guard: `tests/organization-member-management.test.ts`,
  `tests/organization-authorization.test.ts`. Keep the module in sync with the plugin.

### D-5: Security-sensitive endpoints fail closed
- Date: 2026-10-26
- Mode: security
- Decision: `/api/billing/cron/sync-expired` returns HTTP 500 and runs nothing when
  `CRON_SECRET` is absent, comparing the bearer token in constant time. `trustedOrigins`
  is built from env only, with no literal hostnames.
- Why: The old "only check when the secret happens to be set" behaviour meant a missing
  env var silently exposed an unauthenticated endpoint.
- Rejected: Warning-and-continue on missing config.
- Guard: `tests/cron-auth.test.ts`.

### D-6: The office runs in autopilot with an abort-and-report policy
- Date: 2026-10-26
- Mode: architecture + security
- Decision: One work item is driven end to end by `delivery-lead` (mode + sub-agent) and
  run under `autopilot`, which collapses the office's per-step handoffs into a single
  Delivery Report. The office never stops to ask: every decision is either *proceed
  silently* (including branch, PR, and merge on a green gate) or *abort the item and
  report*. Autonomy was raised by setting `permission_mode: never_confirm` on the four
  writing sub-agents.
- Why: The roles are what keep this template from rotting (D-1); the problem was the
  per-reply stop and the `confirm_risky` prompt, not the boundaries. Replacing "ask the
  human" with "abort and report" removes the halt without removing the safety property —
  a rail the pipeline never crosses needs no prompt.
- Rejected: (a) a single monolithic agent with no modes — loses the boundaries; (b)
  auto-merge gated on CI alone — CI does not check design-system conformance or invariant
  safety, so the `review` verdict is a second required gate; (c) a third "ask" category —
  it reintroduces the stop this change exists to remove.
- Guard: `.agents/PROTOCOL.md` → autonomy policy (the two lists) and merge gate (the seven
  conditions); `.agents/agents/delivery-lead.md`. The abort list is the only thing standing
  where the confirmation prompt used to be — do not shorten it.

### D-7: Integration suites migrate under an advisory lock, and CI proves it
- Date: 2026-10-26
- Mode: qa + devops
- Decision: Both integration files apply migrations through
  `migrateUnderLock()` (`tests/integration/migrate-safely.ts`), which holds
  `pg_advisory_lock` on a dedicated single-connection client so concurrent files
  serialize. CI runs the suites against a **never-migrated** database and moves the
  `db:migrate` CLI check to a separate database.
- Why: The two files ran `migrate()` concurrently against the same disposable database and
  raced on a fresh one, so the documented `pnpm test:integration` failed for a new
  contributor. CI pre-migrated the database first, which hid the race and would have let
  the fix regress unnoticed.
- Rejected: (a) serializing by `--test-concurrency=1` — it changes runner behaviour for
  the whole suite and still leaves the documented command fragile; (b) dropping the
  `db:migrate` CLI check — it verifies the release path, so it moved rather than went.
- Guard: `pnpm test:integration` green on an empty database (verified 3/3 runs); CI's
  `saas_starterkit_test` is created but never pre-migrated, so the concurrent path runs
  every CI run. The lock is session-scoped and released on connection close, so a crashed
  run cannot deadlock the next.

## Technical notes that are easy to forget

- **`pnpm test:integration` reads `INTEGRATION_TEST_DATABASE_URL`, not `DATABASE_URL`.**
  With only `DATABASE_URL` set, every scenario silently `t.skip`s and the suite exits 0 —
  a broken suite looks green. Confirm `pass 19` / `fail 0` / `skipped 0`.
- The two integration files migrate the same database; they serialize on a PostgreSQL
  advisory lock (`tests/integration/migrate-safely.ts`), so no pre-migration step is
  needed. CI deliberately leaves its test database unmigrated to exercise this path.
- The DB name must contain `test`, `disposable`, or `scratch`, and the host must be
  local/container — the harness fails closed. Do not point it at a dev database.
- Webhook tests sign with a hardcoded key `SB-Mid-server-test-integration-key-32chars`
  while `BillingService` verifies with `MIDTRANS_SERVER_KEY`. Set both to the same value
  or every webhook scenario fails with `WebhookValidationError: Invalid signature`.
- `pnpm build` needs `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`, `MIDTRANS_SERVER_KEY`,
  `BETTER_AUTH_SECRET`, and `DATABASE_URL` present, or the build fails.
- Migrations are **not** applied by `pnpm build`. Run `pnpm db:migrate` as a release step;
  migrations are additive and tracked in `src/server/db/migrations/meta`.
- `pnpm db:push` is for local prototyping only — it skips migration history and drifts.
- **Vercel rejects deploys whose commit author is not a Vercel team member** ("Git author
  must have access to the project"). Commits authored as `openhands <openhands@all-hands.dev>`
  fail the Vercel check with no build logs; the code is fine. Author commits as a team
  member when the deployment check must pass.
- `src/components/reui/**` is excluded from ESLint. Do not "fix" lint there.
- The dashboard layout is a client component that guards the session; page content arrives
  as children. Mobile has a fixed bottom nav — new UI needs `pb-20` clearance.
- Next.js 16 differs from older versions. Read `node_modules/next/dist/docs/` before
  writing framework code.
- `AGENTS.md` contains two tool-managed blocks (`nextjs-agent-rules`, `reui-agent-rules`).
  Never hand-edit inside those markers.
- **`.agents/agents/*.md` are scanned at conversation start, not hot-reloaded.** Editing an
  agent file (including its `permission_mode`) has no effect until a new conversation
  starts. `name` must equal the filename, and the description needs ≥2 `<example>` tags.
- Valid `permission_mode` values are exactly `always_confirm`, `never_confirm`, and
  `confirm_risky`. All six agents here use `never_confirm`; `confirm_risky` would need a
  security analyzer configured, and it is what used to halt the pipeline.
- The autopilot guardrail is the **abort list** in `PROTOCOL.md`, not a confirmation
  prompt. If you ever add a `permission_mode: always_confirm` agent, you have reintroduced
  the halt that D-6 removed.

## Environment map

| Variable | Needed by |
| :--- | :--- |
| `DATABASE_URL` | runtime, `db:*`, `build` |
| `INTEGRATION_TEST_DATABASE_URL` | `pnpm test:integration` only |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | auth, `build` |
| `MIDTRANS_SERVER_KEY` | webhook verification, Snap, `build` |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | Snap client, `build` |
| `MIDTRANS_IS_PRODUCTION`, `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION` | Midtrans mode |
| `CRON_SECRET` | `/api/billing/cron/sync-expired` (fails closed without it) |
| `NEXT_PUBLIC_APP_URL` | client-side absolute URLs |

## Open questions / to be filled later

- _(none yet — add as they appear, with the mode that raised them)_
