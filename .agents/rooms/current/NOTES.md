# Room: virtual office rollout

**Owner mode:** `docs` · **Opened:** 2026-10-26 · **Status:** in progress

Live example of a room. This one tracks the work that created the office itself.

## Goal

Give the repository a single-agent multi-role office: modes (`ROLES.md`), the rules for
switching between them (`PROTOCOL.md`), shared memory (`MEMORY.md`), a task board
(`TASKS.md`), and onboarding (`ONBOARDING.md`), all specific to this project.

## Findings

- The repo already had `AGENTS.md` (rich, with two tool-managed blocks) and
  `.agents/agents/*.md` (five file-based sub-agents). The office must sit **alongside**
  them, not replace them: modes are how the single agent works in-conversation,
  sub-agents are who it delegates bounded jobs to.
- `.agents/skills/` already holds the ReUI and other skills — left untouched.
- No `CLAUDE.md` and no `.agents/rooms/` existed, so nothing had to be merged or migrated.
- Authoritative facts were read from the code, not assumed: module layout under
  `src/modules/**`, the two CI jobs in `.github/workflows/ci.yml`, and the integration
  env traps now recorded in `MEMORY.md`.

## Decisions made in-room

- Keep `AGENTS.md`'s existing content intact and **add** a pointer section; never edit
  inside the `nextjs-agent-rules` / `reui-agent-rules` markers.
- Modes mirror the existing sub-agent ownership boundaries so the two layers cannot
  contradict each other.
- Record only decisions already enforced by code or tests in the Decision Log, each with
  a `Guard` line. No aspirational entries.

## Dead ends

- Considered one file per mode under `.agents/modes/`. Rejected: ten small files are
  harder to keep consistent than one `ROLES.md`, and the ownership table gives the same
  information at a glance.

## Next

- Point root `AGENTS.md` at `.agents/` and commit.
