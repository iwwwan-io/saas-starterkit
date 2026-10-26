# Task Board

The office's working state. `coordinator` owns this file; under autopilot,
`delivery-lead` may also move items here as part of a run. Keep it honest: a task in
**Done** must have met the verification contract in `PROTOCOL.md`.

Legend: `[ ]` open · `[~]` in progress · `[x]` done. Tag the owning mode in brackets.

## Sekarang (Current)

- `[x]` **[docs + architecture + security]** Autopilot delivery pipeline: `delivery-lead`
  mode + sub-agent, the autonomy policy (proceed / abort, no third category), the merge
  gate, and `permission_mode: never_confirm` on the writing sub-agents. See D-6.
  Next: register the cron automation (Step 9) and decide cadence.

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

## Done

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
