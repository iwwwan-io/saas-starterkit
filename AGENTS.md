<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:reui-agent-rules -->
## ReUI design rules (every UI edit, follow-ups included)

This project uses an existing design system: ReUI on shadcn/ui. Keep its look. Generic frontend advice (vary fonts or themes, gradients, page-load or staggered reveals, "2-3 intentional motions", Framer Motion) does not apply here, and other design skills lose where they disagree.

1. Use installed components first (`components/ui`, `components/reui`): tables `data-grid`, filtering `filters`, boards `kanban`, modals `Dialog` or `AlertDialog`, toasts `sonner`. Never set height, radius, padding, shadow or motion on them; use `size`, `variant`, `spacing`.
2. Color: semantic tokens. State: `<Badge variant="success-light">` from `@/components/reui/badge` at default size, or Alert variants. Raw palette only for categorical identity, with its `dark:` pair.
3. Spacing: `gap-*` on the parent: `gap-1` to `gap-2` in a row, `gap-3` to `gap-4` between groups, `gap-6` to `gap-8` between sections. Type: `text-sm` body, `text-xs` meta, nothing smaller; never resize FrameTitle or CardTitle.
4. Motion: installed parts already animate; never retime them. Yours: hover `transition-colors`; reveal `duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]`; transform and opacity only; never `transition-all`, bounce, or a stagger on table rows or lists of 20+; at most 1 entrance per view; `MotionConfig reducedMotion="user"` plus `motion-reduce:`.
5. Every data region: empty state with an action, `Skeleton` loading, inline error with Retry.
6. Before UI code, write the plan from `.agents/skills/reui/SKILL.md` in your reply. Before you finish, run its self-check on the files you changed and fix every hit (2 rounds at most). Full rules: `.agents/skills/reui/SKILL.md`. If that folder is missing, call the `reui` MCP tool `get_agent_skill`.

Managed by the ReUI installer. Edits between the markers are replaced on the next run.
<!-- END:reui-agent-rules -->

## Developer sub-agents (`.agents/agents/`)

Project-level OpenHands file-based agents. They are scanned at conversation start; use
a new conversation for changes to take effect. Delegate with the `task` tool.

| Agent | Owns | Never touches |
| :--- | :--- | :--- |
| `backend-developer` | `src/app/api/**`, `src/modules/**`, `src/server/auth/**` | db schema/migrations |
| `frontend-developer` | `src/app/**`, `src/components/**` (ReUI design system) | `src/components/reui/**` internals |
| `database-migration-engineer` | `src/server/db/schema/**`, `src/server/db/migrations/**`, `drizzle.config.ts` | service/route logic |
| `code-reviewer` | Read-only review of any change | writes anything |
| `qa-test-engineer` | `tests/**` | production source (except minimal bug fixes) |

Build/verify commands: `pnpm typecheck`, `pnpm lint`, `pnpm test`,
`pnpm test:integration` (needs a disposable `INTEGRATION_TEST_DATABASE_URL`).

Integration test environment gotchas (learned the hard way):

- `pnpm test:integration` reads `INTEGRATION_TEST_DATABASE_URL`, **not** `DATABASE_URL`.
  With only `DATABASE_URL` set, every scenario silently `t.skip`s (exit code 0), so a
  broken integration suite can look green. Always export the right variable and confirm
  the run reports `pass 10` / `fail 0`, never `skipped 10`.
- The webhook scenarios sign payloads with a hardcoded key
  (`SB-Mid-server-test-integration-key-32chars`) while `BillingService` verifies with
  `MIDTRANS_SERVER_KEY`. Both must match or every webhook test fails with
  `WebhookValidationError: Invalid signature`.
- `INTEGRATION_TEST_DATABASE_URL` fails closed: the DB name must contain `test`,
  `disposable`, or `scratch`, and the host must be local/container.

Full local run:

```sh
export INTEGRATION_TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/saas_starterkit_test"
export MIDTRANS_SERVER_KEY="SB-Mid-server-test-integration-key-32chars"
pnpm test:integration
```

`pnpm build` needs the CI env vars present (`NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`,
`MIDTRANS_SERVER_KEY`, `BETTER_AUTH_SECRET`, `DATABASE_URL`).

Billing invariants worth knowing before touching pricing:

- `src/modules/billing/plans.ts` is the single source of truth for what a plan costs and
  which intervals it may be sold on (`getPlanAmount`, `isSupportedInterval`). Never
  recompute a charge inline; a lifetime period bought at the monthly price was a real
  escalation bug.
- Pricing UI reads `getPlanDisplay(plan, interval)` for the amount and suffix, so the
  landing page and the dashboard billing page cannot drift from the charged amount.
  Both the landing pricing section (`src/components/pricing-section.tsx`) and the
  billing page share it; add new pricing surfaces on top of it, not around it.
- Checkout rejects invalid plan/interval pairs with `CheckoutValidationError` → HTTP 400.
  `createCheckoutSession` also validates, so non-HTTP callers are covered too.

Operational invariants:

- `/api/billing/cron/sync-expired` fails closed: with no `CRON_SECRET` it returns HTTP
  500 and runs nothing, and it compares the bearer token in constant time. Never
  restore the old "only check when the secret happens to be set" behaviour.
- Migrations are not applied by `pnpm build`. Run `pnpm db:migrate` against the target
  database as a release step; CI proves they apply to a clean database first.
- `trustedOrigins` in `src/server/auth/index.ts` is built from env only. Do not add a
  literal deployment hostname back to that list.
- Account deletion (`user.deleteUser`) is enabled and guarded by `beforeDelete`, which
  calls `findDeletionBlockers` (`src/modules/account/deletion-guard.ts`). `order.userId`
  and `subscription.userId` cascade on user delete, so without that guard a member who
  paid for a shared workspace's plan would silently delete the plan and its payment
  history out from under the other members. Keep the guard, and keep the cascade
  behaviour in mind before changing any `onDelete` on a billing foreign key.
- An organization whose only member is the deleting user is intentionally allowed to
  cascade away with the account: `beforeDelete` deletes it explicitly, because no
  foreign key links `user` to `organization` (only `member.userId` cascades). Without
  that step, deleting a sole member would strand an organization row with no members
  that still holds its unique slug. The guard only blocks while other members remain.
- The deletion guard has a self-serve escape route, and the Organizations page must keep
  it working: an owner blocked as a sole owner promotes another member to owner (or
  removes the other members), then deletes. `src/modules/organization/member-management.ts`
  mirrors better-auth's organization-plugin guards so the members grid only offers actions
  the server accepts (owner and admin may update/remove members; only an owner may grant
  the owner role; the last owner can never be demoted or removed). Keep that module in
  sync with the plugin's `member` permission rules rather than inventing UI-only rules.
