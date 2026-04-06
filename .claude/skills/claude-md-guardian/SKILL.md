---
name: claude-md-guardian
description: Audit CLAUDE.md compliance and currency. Run /claude-md-guardian to check for rule violations in recent commits and detect stale/missing rules. Reports findings and fixes with user permission.
claude_md_version: "8.1"
---

# Claude.md Guardian

Two-pass audit: compliance (did we follow the rules?) then currency (are the rules still accurate?).

## Trigger
Invoked by slash command: `/claude-md-guardian`

## Instructions

Follow these steps exactly in order. Do not skip steps.

### Step 1: Load context

Read these three files before doing anything else:
- `.claude/skills/claude-md-guardian/checks/compliance.md`
- `.claude/skills/claude-md-guardian/checks/currency.md`
- `.claude/skills/claude-md-guardian/accepted-debt.md`

Tell the user: "Running Claude.md Guardian audit..."

### Step 2: Pass 1 — Compliance Audit

Work through checks C1–C8 from `compliance.md`.

For C1–C7: Run each bash command exactly as written. Capture any stdout as a violation.
For C8: Reflect on the current session context and self-assess pipeline gate compliance.

Skip any check whose ID (e.g. "C3") appears in `accepted-debt.md`.

Record results as: `{ id, status (✅/⚠️/❌), description, file, line }`.

### Step 3: Pass 2 — Currency Check

Work through checks U1–U6 from `currency.md`.

For each: Run the bash commands exactly as written. Capture any output that indicates a violation.

Skip any check whose ID appears in `accepted-debt.md`.

Record results as: `{ id, status (🔴/🟡/🟢), description }`.

### Step 4: Generate Report

Using the format in `templates/report.md`, output the full audit report to the user.

Count totals for the summary line.

### Step 5: Fix Flow

If the summary shows 0 violations, 0 warnings, and 0 gaps: stop here. Report success.

Otherwise, work through each non-✅ non-🟢 item in severity order:
1. ❌ violations first
2. 🔴 stale rules second
3. ⚠️  warnings third
4. 🟡 missing rules fourth
5. 🟢 minor items last (offer to batch-fix all at once)

For each item, ask:
```
Fix [X/N]: [one-sentence description of the fix]? (y/n/skip)
```

Wait for the user's response:

**y** → Make the edit. Show the diff. Commit:
```bash
git add <changed files>
git commit -m "fix(claude-md): <short description>"
```

**n** → Append to `.claude/skills/claude-md-guardian/accepted-debt.md`:
```
- [YYYY-MM-DD] [check-id]: [description]
```
Do NOT fix. Move to next item.

**skip** → Move to next item without recording.

### Step 6: Final summary

After all items processed, output:
```
Guardian complete. [N] fixed | [N] skipped | [N] accepted as debt.
```

If new rules were added or CLAUDE.md was updated, remind the user:
```
⚡ New rule added — update claude-md-guardian/checks/compliance.md with an assertion for it.
```
