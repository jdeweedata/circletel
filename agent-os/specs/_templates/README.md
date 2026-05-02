# Spec Templates

Optional starter templates for new specs in `agent-os/specs/`.

## When to use what

| Situation | Recommended files |
|-----------|-------------------|
| Small change (1-3 task groups, low risk) | `SPEC.md` + `TASKS.md` |
| Standard feature (4-10 task groups) | `SPEC.md` + `TASKS.md` + `PROGRESS.md` + `architecture.md` |
| Large initiative needing stakeholder alignment **before** engineering effort | Start with `PROPOSAL.md`, then `DESIGN.md`, then full spec |
| Cross-team / multi-quarter work | `PROPOSAL.md` + `DESIGN.md` + everything else |

The `PROPOSAL.md` and `DESIGN.md` templates are **additive** — they don't replace `SPEC.md`/`TASKS.md`. They're for cases where it pays to align on the *why* and *how* before committing to a fully-detailed spec.

## Lifecycle of a large spec

```
PROPOSAL.md  →  approved?  →  DESIGN.md  →  approved?  →  SPEC.md + TASKS.md  →  implement  →  archive/
   (why)                       (how)                        (what + when)
```

For small/medium specs, skip straight to `SPEC.md` + `TASKS.md` as before. The PM-Agent and `/generate-spec` command continue to scaffold those directly.

## Files in this folder

| File | Purpose |
|------|---------|
| `PROPOSAL.md` | Lightweight problem statement + proposed direction. Goal: get a yes/no before deeper design work. |
| `DESIGN.md` | Technical approach, trade-offs, rollout. Goal: surface architecture decisions before coding. |

## How to use

```bash
# Copy templates into a new spec folder
mkdir -p agent-os/specs/$(date +%Y%m%d)-my-feature
cp agent-os/specs/_templates/PROPOSAL.md agent-os/specs/$(date +%Y%m%d)-my-feature/
cp agent-os/specs/_templates/DESIGN.md   agent-os/specs/$(date +%Y%m%d)-my-feature/
```

Then fill them in, get sign-off, and proceed to `SPEC.md`/`TASKS.md` when ready.

## Status field

Both templates carry a `Status:` line. Valid values:

- `DRAFT` — being written
- `IN REVIEW` — awaiting feedback
- `APPROVED` — ready to advance to the next stage
- `SUPERSEDED` — replaced by a newer proposal/design (link the replacement)
- `WITHDRAWN` — abandoned without replacement

Update the status as the document moves through review.

## See also

- `agent-os/README.md` — full framework overview
- `agent-os/specs/archive/README.md` — archive convention
- `.claude/commands/generate-spec.md` — `/generate-spec` slash command
