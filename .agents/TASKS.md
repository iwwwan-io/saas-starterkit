# Task Board

The office's working state. `coordinator` owns this file and is the only mode that moves
tasks between sections. Keep it honest: a task in **Done** must have met the verification
contract in `PROTOCOL.md`.

Legend: `[ ]` open · `[~]` in progress · `[x]` done. Tag the owning mode in brackets.

## Sekarang (Current)

- `[~]` **[docs]** Finish the virtual office rollout: land `ROLES.md`, `PROTOCOL.md`,
  `MEMORY.md`, `TASKS.md`, `ONBOARDING.md`, and `rooms/`, then point the root `AGENTS.md`
  at `.agents/`.
- `[ ]` **[devops]** Record the Vercel commit-author constraint in `AGENTS.md` so future
  sessions do not rediscover it. See `MEMORY.md` → *Technical notes*.

## Backlog

- `[ ]` **[qa]** Make the integration suite fail loudly when scenarios are skipped.
  Today, running `pnpm test:integration` with only `DATABASE_URL` set produces
  `skipped N` and exit code 0 — a broken suite looks green. Either assert a minimum
  executed count or document it at the point of failure.
- `[ ]` **[devops]** Add a `CRON_SECRET` and `MIDTRANS_*` presence check to CI so a
  misconfigured deploy fails at build time rather than at the first webhook.
- `[ ]` **[security]** Audit every `onDelete` on billing foreign keys against the
  deletion-guard invariant (D-3). One careless cascade can destroy a shared workspace's
  payment history.
- `[ ]` **[data]** Add an index on `subscription.orderId` if webhook idempotency lookups
  grow; confirm with `EXPLAIN` before adding it.
- `[ ]` **[frontend]** Audit each data region for the three required states (empty with
  action, `Skeleton` loading, error with Retry) — required by the ReUI rules.
- `[ ]` **[docs]** Add a short "choosing a mode" example to `ONBOARDING.md` once the
  office has been used on a real request.

## Done

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
