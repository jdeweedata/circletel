# Archived Specs

Completed, abandoned, or superseded specs live here. Active work lives one level up in `agent-os/specs/`.

## Why archive

`agent-os/specs/` accumulates folders fast. Without archiving:

- It's hard to tell at a glance which specs are still in flight
- `/generate-spec` listings get noisy
- New contributors can't find the work that matters

Moving completed specs into `archive/` keeps the active list short and intentional.

## When to archive

Archive a spec when **any** of these is true:

| Trigger | Why |
|---------|-----|
| `PROGRESS.md` shows 100% and final verification passed | Implementation shipped |
| Feature deployed to production and verified | No more work |
| Proposal or design rejected/withdrawn | Won't be built |
| Superseded by a newer spec | Pointer to replacement |
| No activity for 90+ days and no clear owner | Stale; revive from archive if needed |

## How to archive

1. **Update the spec's `PROGRESS.md`** (or `README.md` if no PROGRESS exists) with a closing entry:
   ```markdown
   ## Archived: YYYY-MM-DD
   - **Outcome**: shipped / rejected / superseded / withdrawn
   - **Final verification**: <link to verification report or PR>
   - **Successor** (if superseded): `agent-os/specs/<new-spec-id>/`
   - **Notes**: <one paragraph summarising what was learned>
   ```

2. **Move the folder as-is** under `archive/`:
   ```bash
   git mv agent-os/specs/20251130-invoice-email-reminder \
          agent-os/specs/archive/20251130-invoice-email-reminder
   ```

3. **Do NOT rename** the folder. The spec ID already encodes its creation date — re-prefixing with the archive date is redundant and breaks back-references in commit messages, code comments (`@see agent-os/specs/...`), and PR descriptions.

4. **Update inbound links** (optional): `grep -rn "agent-os/specs/<spec-id>"` to find code/doc references and update them to `agent-os/specs/archive/<spec-id>`. Code-level `@see` references can be left alone — they still point to git history.

5. **Capture learnings** if any (per CLAUDE.md Stage 6):
   - Run `/compound` for reusable patterns
   - Update `memory-os/long-term/patterns.md` if a new pattern emerged

## What lives here

```
agent-os/specs/archive/
├── README.md                          # this file
└── <spec-id>/                          # archived spec, structure preserved
    ├── README.md
    ├── SPEC.md / spec.md
    ├── TASKS.md / tasks.md
    ├── PROGRESS.md                     # closing "Archived: ..." section appended
    ├── architecture.md
    ├── implementation/
    └── verification/
```

Folder layout inside an archived spec is **identical** to active specs — nothing is stripped or compacted. This makes reviving a spec a one-line `git mv` if requirements change.

## Reviving an archived spec

If an archived spec needs to come back to life:

1. `git mv agent-os/specs/archive/<spec-id> agent-os/specs/<spec-id>`
2. Append a new `Revived: YYYY-MM-DD` entry to `PROGRESS.md` explaining why.
3. Update status fields and resume work.

## Status field mapping

If the spec uses `PROPOSAL.md` / `DESIGN.md` from `_templates/`, map their `Status:` line to one of:

- `APPROVED` (still active) — keep in `agent-os/specs/`
- `SUPERSEDED` — move to archive, link to successor
- `WITHDRAWN` — move to archive, no successor needed

## See also

- `agent-os/README.md` — full framework overview
- `agent-os/specs/_templates/README.md` — proposal/design templates
- `.claude/rules/compound-learnings.md` — Stage 6 LEARN gate
