# Task Board

The office's working state. `coordinator` owns this file; under autopilot,
`delivery-lead` may also move items here as part of a run. Keep it honest: a task in
**Done** must have met the verification contract in `PROTOCOL.md`.

Legend: `[ ]` open · `[~]` in progress · `[x]` done. Tag the owning mode in brackets.

## Sekarang (Current)

- `[x]` **[docs + architecture + security]** Autopilot delivery pipeline: `delivery-lead`
  mode + sub-agent, the autonomy policy (proceed / abort, no third category), the merge
  gate, and `permission_mode: never_confirm` on the writing sub-agents. See D-6.
  Branch pushed, PR #4 open, CI green; merge held on the commit-author/Vercel blocker.
  Next: register the cron automation (Step 9) and decide cadence.

## Backlog

- `[x]` **[devops]** Add a `CRON_SECRET` and `MIDTRANS_*` presence check to CI so a
  misconfigured deploy fails at build time rather than at the first webhook. Delivered:
  `pnpm check:deploy-env` runs before `next build`, and `src/env.ts` now validates
  `CRON_SECRET`. See D-9. Delivered in PR #7.
- `[x]` **[qa + devops]** Both integration files migrated the same database in `before()`
  and raced on a fresh one (`Failed query: CREATE TABLE "account"`). Fixed: they now
  migrate under a PostgreSQL advisory lock (`tests/integration/migrate-safely.ts`), and CI
  runs the suites against a never-migrated database. See D-7. Delivered in PR #5.
- `[x]` **[security]** Audit every `onDelete` on billing foreign keys against the
  deletion-guard invariant (D-3). Audited all 12 FKs, confirmed against `pg_constraint` on
  a migrated database. Found and fixed one hole: the guard only saw organizations reached
  through `member` rows, so a payer removed from the organization could still cascade its
  plan away. See D-8. Delivered in PR #6.
- `[x]` **[data]** Add an index on `subscription.orderId` if webhook idempotency lookups
  grow; confirm with `EXPLAIN` before adding it. Confirmed with `EXPLAIN (ANALYZE, BUFFERS)`:
  the column is `.unique()`, so `subscription_order_id_unique` already serves the lookup
  (Index Scan, 0.07 ms vs 2.37 ms seq scan on 20k rows). No new index added. See D-10;
  guarded by integration scenario K.
- `[x]` **[frontend]** Audit each data region for the three required states (empty with
  action, `Skeleton` loading, error with Retry) — required by the ReUI rules. Five regions
  audited; the Organizations workspaces list was missing an error state and loaded behind
  a bare spinner, and both its empty state and the members-grid no-results state lacked an
  action. Fixed, and locked by `tests/data-region-states.test.ts` (verified against three
  negative controls). See D-11.

## Done

- `[x]` **[qa]** Integration suite fails loudly when scenarios are skipped. A missing
  database used to produce `skipped 19` and exit 0, so a broken suite looked green.
  `pnpm test:integration` now asserts the executed-scenario count and exits non-zero;
  verified `pass 0 / fail 19 / skipped 0` with no database, and `pass 19 / fail 0 /
  skipped 0` against a real PostgreSQL. `pnpm test:integration:optional` keeps the
  skip-only behaviour. Spawned a follow-up for the migration race found while verifying.
- `[x]` **[devops]** Record the Vercel commit-author constraint in the root `AGENTS.md`
  (and correct the stale `pass 10` integration figure to `pass 19`).
- `[x]` **[docs + architecture + security]** Autopilot delivery pipeline (D-6):
  `delivery-lead` mode and sub-agent, the autonomy policy, the merge gate, and
  `permission_mode: never_confirm` on the writing sub-agents. Supersedes the old
  "choosing a mode example" backlog item — the flow is documented in `ONBOARDING.md`
  under *How the office delivers work*.
- `[x]` **[docs]** Virtual office rollout: `ROLES.md`, `PROTOCOL.md`, `MEMORY.md`,
  `TASKS.md`, `ONBOARDING.md`, `rooms/`, and the `AGENTS.md` pointer (`e19437a`).
- `[x]` **[backend + frontend + security]** Self-serve account deletion with a
  shared-workspace guard, plus the escape route: owners can change roles and remove
  members on the Organizations page so a blocked sole owner can unblock themselves.
  Merged in PR #3 (`cbfe560`). Guarded by `tests/account-deletion-guard.test.ts`,
  `tests/integration/account-deletion-guard.test.ts`, and
  `tests/organization-member-management.test.ts`.
- `[x]` **[backend]** Reject unsupported plan/interval pairs at checkout and centralise
  pricing in `plans.ts` (D-2).
- `[x]` **[security]** Cron endpoint fails closed without `CRON_SECRET` (D-5).
- `[x]` **[docs]** Developer sub-agent team under `.agents/agents/` (PR #2).
