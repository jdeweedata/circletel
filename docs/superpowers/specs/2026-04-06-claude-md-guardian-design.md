# Claude.md Guardian — Design Spec

**Date**: 2026-04-06
**Status**: Approved
**Scope**: Custom Claude Code skill for auditing rule compliance and keeping CLAUDE.md current

---

## Problem

The CircleTel project has a mature rules system (CLAUDE.md v8.1, 17 rule files, Superpowers Pipeline). Two failure modes exist:

1. **Compliance drift** — Claude skips mandatory pipeline gates, commits anti-patterns, or violates specific rules (wrong auth client, hardcoded contacts, etc.)
2. **Currency drift** — rules fall out of date as the codebase evolves (e.g., Vercel → Coolify migration left stale rules), and corrections from compound-learnings don't always get extracted into rules

---

## Solution: Option C — Guardian skill + lightweight session hook

A two-component system:

- **`claude-md-guardian`** — full on-demand audit (compliance + currency), run with `/claude-md-guardian`
- **Session-end hook** — lightweight automatic signal check, nudges user to run guardian when issues detected

---

## Architecture

```
.claude/
├── skills/
│   └── claude-md-guardian/
│       ├── SKILL.md              ← main skill Claude reads
│       ├── checks/
│       │   ├── compliance.md     ← violation patterns and assertions
│       │   └── currency.md       ← drift detection patterns
│       └── templates/
│           └── report.md         ← structured report format
├── hooks/
│   └── session-end-check.md      ← lightweight hook instructions
└── settings.json                 ← hook registration (PostToolUse or Stop)
```

---

## Component 1: `claude-md-guardian` Skill

### Trigger
- Slash command: `/claude-md-guardian`
- Invoked by: user on demand

### Pass 1 — Compliance Audit

Scans three sources: recent git commits (`git diff HEAD~5`), session context, and codebase.

**Pipeline gate compliance:**
- New feature/page started without `brainstorming`
- Bug/error encountered without `systematic-debugging`
- Multi-file change (2+ files) without `writing-plans`
- Feature completed without `verification-before-completion`
- Feature completed without `requesting-code-review`

**Anti-pattern detection (git diff HEAD~5):**
- Placeholder, stub, or TODO code committed
- Hardcoded contact strings (`wa.me`, `082 487`, email addresses) outside `lib/constants/contact.ts`
- Markdown or documentation files created in project root
- Commits touching 3+ files with no confirmation gate evidence

**Rule-specific assertions:**
| Rule File | Assertion |
|-----------|-----------|
| `auth-patterns.md` | `createClient()` not used where `getUser()` is called — must use `createClientWithSession()` |
| `verify-schema-first.md` | Known wrong column names (`active`, `admin_user_id`, `Amount=`) not present in new code |
| `coding-standards.md` | `context.params` awaited in Next.js 15 API routes |
| `contact-details.md` | No hardcoded contact values outside constants file |
| `file-organization.md` | No source files created in project root |
| `admin-shared-components.md` | `StatusBadge` uses `status=` prop, `StatCard` icon is JSX element not component ref |

Each violation flagged with: file, line number, rule violated, suggested fix.

### Pass 2 — Currency Check

**Code drift detection:**
- New directories/modules with no corresponding `.claude/rules/` coverage
- Rule files referencing tools, services, or patterns no longer in the codebase
- Code patterns repeated 3+ times in recent commits not documented in any rule
- Environment variables in `.env.example` not listed in `CLAUDE.md`

**Uncaptured corrections:**
- `compound-learnings/corrections/` entries older than 7 days with no matching rule file
- `compound-learnings/learnings/` entries marked as reusable with no corresponding rule

**CLAUDE.md freshness:**
- "Updated" date in header vs date of most recent rule file change
- Rule table in CLAUDE.md vs actual files present in `.claude/rules/` (missing or extra entries)

Severity levels:
- 🔴 **stale** — rule contradicts current reality (must fix)
- 🟡 **missing** — pattern exists in code, no rule covers it
- 🟢 **minor** — metadata out of date

### Report Format

```
## Claude.md Guardian — Audit Report
Generated: YYYY-MM-DD | Commits scanned: last 5 | Rules checked: 17

### Compliance Audit
❌ [rule]: [description]
   → [file]:[line]
⚠️  [rule]: [description]
✅ [rule]: no violations found

### Currency Check
🔴 stale: [rule file] — [description]
🟡 missing: [description]
🟡 pending: [N] compound-learnings corrections not yet extracted to rules
🟢 minor: [description]

### Summary
[N] violations | [N] warnings | [N] gaps ([N] stale, [N] missing) | [N] minor
```

### Fix Flow

After the report, steps through each non-✅ item:

```
Fix [X/N]: [description of fix]? (y/n/skip)
```

- **y** — makes the edit, shows diff, commits with descriptive message
- **n** — skips permanently (appends to `.claude/skills/claude-md-guardian/accepted-debt.md` so it's not re-surfaced)
- **skip** — skips this run only

Commits use format: `fix(claude-md): [short description]`

---

## Component 2: Session-End Hook

### Trigger
- Registered in `.claude/settings.json` as a `Stop` hook (fires when Claude session ends)
- `compound-learnings` skill optionally invokes it as a final step (not a hook — an explicit call)

### What It Checks (fast, no git scan)
1. Were any Superpowers Pipeline gates skipped in this session?
2. Are there corrections in compound-learnings not yet extracted to rules?
3. Has `/claude-md-guardian` been run in the last 7 days?

### Output
If any signal detected:
```
⚡ Session check: [signal summary]
   Run /claude-md-guardian for full audit.
```

If clean: silent (no output).

---

## Keeping the Skill Current

The guardian skill is itself subject to drift. To prevent this:

- `currency.md` includes a self-check: does each rule assertion in `compliance.md` still match the corresponding rule file?
- When a new rule is added to `.claude/rules/`, the guardian surfaces a nudge: "New rule detected — add a compliance assertion to claude-md-guardian/checks/compliance.md"
- Version-pinned to CLAUDE.md version in the skill frontmatter

---

## Implementation Files

| File | Purpose |
|------|---------|
| `.claude/skills/claude-md-guardian/SKILL.md` | Main skill — what Claude reads and follows |
| `.claude/skills/claude-md-guardian/checks/compliance.md` | Compliance check patterns (one assertion per rule) |
| `.claude/skills/claude-md-guardian/checks/currency.md` | Currency check patterns (drift detection logic) |
| `.claude/skills/claude-md-guardian/templates/report.md` | Report format template |
| `.claude/hooks/session-end-check.md` | Session-end hook instructions |
| `.claude/settings.json` | Hook registration update |

---

## Success Criteria

- `/claude-md-guardian` runs end-to-end in under 2 minutes
- Compliance check catches at least the 6 rule-specific assertions reliably
- Currency check surfaces stale Coolify/Vercel rule gap on first run
- Session-end hook is silent when nothing needs attention
- Each accepted fix results in a clean, committed change

---

## Out of Scope

- Real-time violation detection (mid-task)
- Automated rule generation from scratch (human reviews all new rules)
- Integration with external tools (Linear, Slack, etc.)
