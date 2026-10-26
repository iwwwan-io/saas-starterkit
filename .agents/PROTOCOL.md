# Protocol — how the single-agent office operates

One agent, many modes. This file defines how a mode is activated, how work moves between
modes, how decisions are recorded, and how the office reviews itself. Mode definitions
live in `ROLES.md`.

## 1. Activating a mode

Every reply that does work starts with a single activation line:

```
[mode: backend] — <one-line intent>
```

Rules:

- **One mode per reply.** If a reply needs two modes, do the first, hand off, and switch
  in the next reply. Do not blend.
- `coordinator` opens any new request: read the request, decide the mode sequence, then
  either switch or state the sequence and start.
- Switching mid-conversation is announced on its own line, never hidden inside prose:

```
[mode: frontend → backend] — need a validated `role` field in the members endpoint
```

- Read-only or conversational replies (answering a question, explaining code) may skip
  the line. Anything that edits files, runs tests, or makes a decision must have it.
- The mode line is a claim about what you are allowed to touch. If you find yourself
  editing outside your mode's `Owns` column in `ROLES.md`, stop and hand off.

## 2. Internal handoff format

When a mode finishes and another must continue, end the reply with a handoff block:

```
## Handoff → <mode>
Context:   <what was done, one or two lines>
Artifacts: <files changed / commands run / results>
Needed:    <the concrete thing the next mode must produce>
Risk:      <what could go wrong, or "none identified">
```

The next reply opens with the receiving mode's activation line and a one-line
acknowledgement of what it accepted. If the handoff is ambiguous, the receiver asks one
clarifying question instead of guessing.

**Escalation triggers** (hand off, do not reach across):

- A change would touch auth, webhooks, cron, or account deletion → `security` signs off.
- A change needs a schema column → `data` first, then the requesting mode.
- A change is finished → `qa` verifies, then `review` before merge.
- A request contradicts a rule in `AGENTS.md` → `coordinator` flags it and asks, rather
  than silently breaking the rule.

## 3. Decision Log

Durable decisions go in `.agents/MEMORY.md` under **Decision Log**, not in chat. A
decision belongs there when a future session could plausibly reverse it by accident.

Format (append, newest at the bottom of the section):

```
### D-<n>: <short title>
- Date:     <YYYY-MM-DD>
- Mode:     <mode that decided>
- Decision: <what was chosen>
- Why:      <the reason that will still matter later>
- Rejected: <the alternative and why it lost>
- Guard:    <the invariant or test that protects this decision>
```

Rules:

- One decision per entry. Never rewrite an old entry to hide that it changed — add a new
  entry that supersedes it and say so.
- If a decision is already enforced in code (a test, a guard, a `fails closed` path),
  name that enforcement in `Guard`. A decision with no guard is a hope.
- Trivial choices (naming, formatting) do not get entries.

## 4. Internal review between modes

The office reviews itself; there is no separate reviewer to catch what you skip.

- **Author is not reviewer.** Finish the work in one mode, then switch to `review` (or
  delegate to the `code-reviewer` sub-agent) and read the diff as if someone else wrote
  it.
- `review` is read-only. It reports; the owning mode fixes. A review that ends with the
  reviewer editing files has broken the protocol.
- Review against the invariants, not vibes: the rules in `AGENTS.md`, the `Guard` lines
  in `MEMORY.md`, the ReUI states, and the authorization/deletion guards.
- **Two rounds maximum.** If round two still finds blocking issues, stop and escalate to
  `coordinator` with the disagreement instead of looping.
- Security-sensitive changes are never self-approved by the mode that wrote them.

## 5. Verification contract

A mode may not report "done" while any of these is red or unrun:

| Command | Applies to |
| :--- | :--- |
| `pnpm typecheck` | any change touching `.ts`/`.tsx` |
| `pnpm lint` | any change touching `src/**` |
| `pnpm test` | any change to logic covered by unit tests |
| `pnpm test:integration` | any change to billing, auth, schema, or deletion |
| `pnpm build` | changes to config, env, or routing |

Report the **actual counts** (`pass N` / `fail N`), never "tests pass" from memory. A run
that reports `skipped N` did not verify anything — see `ROLES.md` → `qa`.

## 6. Principles for a single agent

1. **One role at a time.** Sequential clarity beats simultaneous confusion. The value of
   the office is that each mode has one job and one set of rules.
2. **Write state down, not in your head.** The task board (`.agents/TASKS.md`), the
   Decision Log, and `MEMORY.md` are the office's memory. A fresh session reads them and
   continues; a decision kept only in context is lost.
3. **The repository is the source of truth.** When a doc and the code disagree, the code
   wins — then fix the doc.
4. **Stay in your lane, hand off loudly.** Reaching across `Owns` boundaries silently is
   the failure mode this protocol exists to prevent.
5. **Verify, do not assert.** Every claim of "works" is backed by a command and its
   output.
6. **Never break an invariant to make a task green.** If a guard blocks you, the task is
   wrong, not the guard.
7. **Keep the office small.** Prefer editing an existing file over adding a new one;
   prefer one mode over three. Documentation is a tool, not the deliverable.
