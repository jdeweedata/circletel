# Claude.md Guardian Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a two-component system that audits CLAUDE.md compliance and currency — a full on-demand skill plus a lightweight session-end hook.

**Architecture:** `claude-md-guardian` skill reads two check definition files (compliance patterns + currency drift patterns), runs bash/grep commands against the last 5 commits and the codebase, generates a structured report, and steps through fixes with user permission. A separate PowerShell Stop hook runs 3 fast signal checks at session end and nudges the user if issues are detected.

**Tech Stack:** Claude Code skills (markdown), PowerShell 7 (hook), Bash (git commands inside skill), `.claude/settings.json` (hook registration)

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Create | `.claude/skills/claude-md-guardian/SKILL.md` | Main orchestration — what Claude reads and follows |
| Create | `.claude/skills/claude-md-guardian/checks/compliance.md` | One grep assertion per rule file |
| Create | `.claude/skills/claude-md-guardian/checks/currency.md` | Drift detection patterns |
| Create | `.claude/skills/claude-md-guardian/templates/report.md` | Report format template |
| Create | `.claude/skills/claude-md-guardian/accepted-debt.md` | Log of permanently skipped issues |
| Create | `.claude/hooks/session-end-check.ps1` | Lightweight 3-signal hook |
| Modify | `.claude/settings.json` | Register Stop hook |
| Modify | `.claude/skills/compound-learnings/SKILL.md` | Add optional session-end invocation as final step |

---

## Task 1: Scaffold Directory Structure

**Files:**
- Create: `.claude/skills/claude-md-guardian/` (directory)
- Create: `.claude/skills/claude-md-guardian/checks/` (directory)
- Create: `.claude/skills/claude-md-guardian/templates/` (directory)
- Create: `.claude/skills/claude-md-guardian/accepted-debt.md`

- [ ] **Step 1: Create directories and empty accepted-debt log**

```bash
mkdir -p /home/circletel/.claude/skills/claude-md-guardian/checks
mkdir -p /home/circletel/.claude/skills/claude-md-guardian/templates
```

- [ ] **Step 2: Create accepted-debt.md**

Write to `.claude/skills/claude-md-guardian/accepted-debt.md`:
```markdown
# Accepted Debt

Issues permanently skipped by the guardian. Format: `- [YYYY-MM-DD] [description]`

<!-- Empty — no accepted debt yet -->
```

- [ ] **Step 3: Commit scaffold**

```bash
git add .claude/skills/claude-md-guardian/
git commit -m "feat(guardian): scaffold claude-md-guardian skill directory"
```

---

## Task 2: Write Compliance Check Definitions

**Files:**
- Create: `.claude/skills/claude-md-guardian/checks/compliance.md`

- [ ] **Step 1: Write compliance.md**

Write to `.claude/skills/claude-md-guardian/checks/compliance.md`:

```markdown
# Compliance Check Definitions

Each check has an ID, the rule it enforces, the exact bash command to run, and what counts as a violation.
Run every command from the project root. Flag any stdout output as a violation.
Skip any check whose ID appears in `accepted-debt.md`.

---

## C1 — Hardcoded contact strings
**Rule:** `contact-details.md`
**Command:**
```bash
git diff HEAD~5 -- '*.tsx' '*.ts' | grep -E "^\+" | grep -E "(wa\.me|082 487|contactus@circletel)" | grep -v "contact\.ts" | grep -v "^+++"
```
**Violation:** Any output line = hardcoded contact value outside constants file
**Severity:** ❌

---

## C2 — TODO / placeholder code committed
**Rule:** `anti-patterns.md`
**Command:**
```bash
git diff HEAD~5 -- '*.tsx' '*.ts' | grep -E "^\+.*\b(TODO|FIXME|placeholder|stub function|// temp)\b" | grep -v "^+++"
```
**Violation:** Any output line = placeholder committed
**Severity:** ❌

---

## C3 — createClient() used where getUser() is called
**Rule:** `auth-patterns.md`
**Command:**
```bash
git diff HEAD~5 -- 'app/api/**' | grep -E "^\+" | grep "getUser()" | grep -v "^+++"
```
Then for each changed file containing `getUser()`:
```bash
grep -n "createClient()" <file> | grep -v "createClientWithSession"
```
**Violation:** File uses `getUser()` but imports `createClient()` not `createClientWithSession()`
**Severity:** ❌

---

## C4 — context.params not awaited (Next.js 15)
**Rule:** `coding-standards.md`
**Command:**
```bash
git diff HEAD~5 -- 'app/api/**/*.ts' 'app/**/*.tsx' | grep -E "^\+.*context\.params\." | grep -v "await" | grep -v "^+++"
```
**Violation:** Any output = params accessed synchronously
**Severity:** ❌

---

## C5 — Files created in project root
**Rule:** `file-organization.md`
**Command:**
```bash
git diff HEAD~5 --name-only --diff-filter=A | grep -E "^[^/]+\.(md|txt|js|ts|json)$" | grep -vE "^(package\.json|package-lock\.json|tsconfig|next\.config|tailwind\.config|vercel\.json|CLAUDE\.md|README\.md|\.eslintrc|\.prettierrc)"
```
**Violation:** Any output = file created in root that should be in a subdirectory
**Severity:** ❌

---

## C6 — StatusBadge missing status= prop
**Rule:** `admin-shared-components.md`
**Command:**
```bash
git diff HEAD~5 -- 'components/**/*.tsx' | grep -E "^\+.*<StatusBadge" | grep -v 'status=' | grep -v "^+++"
```
**Violation:** StatusBadge used without `status=` prop
**Severity:** ❌

---

## C7 — StatCard icon passed as component ref not JSX element
**Rule:** `admin-shared-components.md`
**Command:**
```bash
git diff HEAD~5 -- 'components/**/*.tsx' | grep -E "^\+.*<StatCard" | grep -E 'icon=\{[A-Z][a-zA-Z]+\}' | grep -v "^+++"
```
**Violation:** StatCard icon is a component reference `{PiXxx}` not a JSX element `{<PiXxx />}`
**Severity:** ❌

---

## C8 — Pipeline gates (session context check — no command)
**Rule:** `workflow.md` / `anti-patterns.md`
**Method:** Reflect on the current session. Ask yourself:
- Did this session begin new feature/page/component work? → Was `brainstorming` invoked?
- Did this session encounter a bug or error? → Was `systematic-debugging` invoked?
- Did this session change 2+ files? → Was `writing-plans` invoked?
- Did this session complete a feature? → Was `verification-before-completion` invoked?
- Did this session complete a feature? → Was `requesting-code-review` invoked?

**Violation:** Any gate that should have been invoked but wasn't
**Severity:** ⚠️
```

- [ ] **Step 2: Verify the file was written correctly**

```bash
wc -l /home/circletel/.claude/skills/claude-md-guardian/checks/compliance.md
# Expected: ~110 lines
```

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/claude-md-guardian/checks/compliance.md
git commit -m "feat(guardian): add compliance check definitions (C1-C8)"
```

---

## Task 3: Write Currency Check Definitions

**Files:**
- Create: `.claude/skills/claude-md-guardian/checks/currency.md`

- [ ] **Step 1: Write currency.md**

Write to `.claude/skills/claude-md-guardian/checks/currency.md`:

```markdown
# Currency Check Definitions

Each check detects drift between the codebase and the rules. Run from project root.
Severity: 🔴 stale | 🟡 missing | 🟢 minor

---

## U1 — Stale Vercel references in rules
**Check:** Rules reference Vercel but project now deploys via Coolify.
**Command:**
```bash
grep -rn "vercel" /home/circletel/.claude/rules/ --include="*.md" -i | grep -v "vercel-deployment.md" | grep -iv "vercel token\|vercel env"
```
**Also check:** Does `vercel-deployment.md` need updating to reflect Coolify as primary?
```bash
grep -c "Coolify" /home/circletel/.claude/rules/vercel-deployment.md
```
If output is `0`, the file is stale.
**Severity:** 🔴 stale

---

## U2 — New lib/ directories with no rule coverage
**Check:** A directory exists in `lib/` or `components/` that no rule file mentions.
**Command:**
```bash
ls /home/circletel/lib/ 2>/dev/null
```
For each directory, check if any rule file references it:
```bash
grep -rl "<dirname>" /home/circletel/.claude/rules/ --include="*.md"
```
**Violation:** Directory with no rule coverage and 3+ files inside
**Severity:** 🟡 missing

---

## U3 — Rule table in CLAUDE.md vs actual rule files
**Check:** Every file in `.claude/rules/` should be listed in the CLAUDE.md rules table.
**Command:**
```bash
ls /home/circletel/.claude/rules/*.md | xargs -I{} basename {} .md | sort > /tmp/actual-rules.txt
grep "\.md" /home/circletel/CLAUDE.md | grep -oE "[a-z-]+\.md" | sed 's/\.md//' | sort > /tmp/listed-rules.txt
diff /tmp/actual-rules.txt /tmp/listed-rules.txt
```
**Violation:** Files in diff output (in actual but not listed, or listed but not present)
**Severity:** 🟢 minor (missing from table) or 🔴 stale (listed but file deleted)

---

## U4 — Uncaptured corrections in compound-learnings
**Check:** Corrections older than 7 days with no matching rule file.
**Command:**
```bash
find /home/circletel/.claude/skills/compound-learnings/corrections/ -name "*.md" -mtime +7 2>/dev/null
```
For each file found, check if a rule was extracted:
```bash
# Look for rule file created after the correction date
ls -lt /home/circletel/.claude/rules/*.md | head -5
```
**Violation:** Correction file exists with no corresponding new rule
**Severity:** 🟡 missing

---

## U5 — CLAUDE.md "Updated" date staleness
**Check:** The "Updated" date in CLAUDE.md footer vs the most recently modified rule file.
**Command:**
```bash
grep "Updated" /home/circletel/CLAUDE.md
ls -lt /home/circletel/.claude/rules/*.md | head -1
```
If the most recent rule file is newer than the CLAUDE.md updated date, flag it.
**Severity:** 🟢 minor

---

## U6 — Self-check: guardian assertions vs current rules
**Check:** Every compliance check (C1–C8) should reference a rule file that still exists.
**Command:**
```bash
grep "Rule:\*\*" /home/circletel/.claude/skills/claude-md-guardian/checks/compliance.md | grep -oE "`[a-z-]+\.md`" | tr -d '`' | while read rule; do
  [ -f "/home/circletel/.claude/rules/$rule" ] || echo "MISSING: $rule"
done
```
**Violation:** Any "MISSING" output = compliance check references a deleted rule file
**Severity:** 🔴 stale
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/claude-md-guardian/checks/currency.md
git commit -m "feat(guardian): add currency check definitions (U1-U6)"
```

---

## Task 4: Write Report Template

**Files:**
- Create: `.claude/skills/claude-md-guardian/templates/report.md`

- [ ] **Step 1: Write report.md**

Write to `.claude/skills/claude-md-guardian/templates/report.md`:

```markdown
# Report Format

Output this exact structure. Replace [placeholders] with actual values.

---

## Claude.md Guardian — Audit Report
Generated: [YYYY-MM-DD] | Commits scanned: last 5 | Rules checked: [N]

### Compliance Audit
[One line per check. Format:]
[icon] [check-id] [rule-name]: [finding]
[  → file:line  (only for ❌ violations with a specific location)]

Icons:
- ✅ = no violations found
- ⚠️  = warning (pipeline gate, no specific file location)
- ❌ = violation (specific file + line)

### Currency Check
[One line per check. Format:]
[icon] [check-id]: [description]

Icons:
- 🔴 = stale (rule contradicts current reality)
- 🟡 = missing (pattern exists, no rule covers it)
- 🟢 = minor (metadata out of date)

### Summary
[N] violations | [N] warnings | [N] gaps ([N] stale, [N] missing) | [N] minor

[If all clean:]
✅ All checks passed. No violations or gaps found.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/claude-md-guardian/templates/report.md
git commit -m "feat(guardian): add report format template"
```

---

## Task 5: Write the Main SKILL.md

**Files:**
- Create: `.claude/skills/claude-md-guardian/SKILL.md`

- [ ] **Step 1: Write SKILL.md**

Write to `.claude/skills/claude-md-guardian/SKILL.md`:

```markdown
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
```

- [ ] **Step 2: Verify the skill is readable**

```bash
wc -l /home/circletel/.claude/skills/claude-md-guardian/SKILL.md
# Expected: ~100 lines
head -5 /home/circletel/.claude/skills/claude-md-guardian/SKILL.md
# Expected: frontmatter starting with ---
```

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/claude-md-guardian/SKILL.md
git commit -m "feat(guardian): add main SKILL.md orchestration"
```

---

## Task 6: Write Session-End Hook + Register It

**Files:**
- Create: `.claude/hooks/session-end-check.ps1`
- Modify: `.claude/settings.json`

- [ ] **Step 1: Write the PowerShell hook**

Write to `.claude/hooks/session-end-check.ps1`:

```powershell
# Session-End Check Hook for Claude.md Guardian
# Fires when Claude session stops (Stop hook).
# Runs 3 fast signal checks — no git scan, no file writes.
# If signals detected: nudges user to run /claude-md-guardian.

param(
    [string]$ProjectPath = "/home/circletel"
)

$ErrorActionPreference = "SilentlyContinue"

$signals = @()

# Signal 1: Corrections in compound-learnings older than 7 days with no rule extracted
$correctionsDir = Join-Path $ProjectPath ".claude/skills/compound-learnings/corrections"
if (Test-Path $correctionsDir) {
    $staleCorrections = Get-ChildItem $correctionsDir -Filter "*.md" |
        Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) }
    if ($staleCorrections.Count -gt 0) {
        $signals += "$($staleCorrections.Count) correction(s) not yet extracted to rules"
    }
}

# Signal 2: Last guardian run older than 7 days (check git log for guardian commits)
$lastGuardianCommit = & git -C $ProjectPath log --oneline --all --grep="fix(claude-md)" -1 2>/dev/null
$lastGuardianDate = & git -C $ProjectPath log --format="%ci" --all --grep="fix(claude-md)" -1 2>/dev/null
if ($lastGuardianDate) {
    $daysSince = ((Get-Date) - [DateTime]::Parse($lastGuardianDate)).Days
    if ($daysSince -gt 7) {
        $signals += "guardian last ran $daysSince days ago"
    }
} else {
    $signals += "guardian has never been run"
}

# Signal 3: CLAUDE.md updated date vs most recent rule file change
$claudeMd = Join-Path $ProjectPath "CLAUDE.md"
$rulesDir = Join-Path $ProjectPath ".claude/rules"
if ((Test-Path $claudeMd) -and (Test-Path $rulesDir)) {
    $latestRule = Get-ChildItem $rulesDir -Filter "*.md" |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1
    $claudeMdDate = (Get-Item $claudeMd).LastWriteTime
    if ($latestRule -and $latestRule.LastWriteTime -gt $claudeMdDate) {
        $signals += "rule files updated since CLAUDE.md was last touched"
    }
}

# Output
if ($signals.Count -gt 0) {
    Write-Host ""
    Write-Host "⚡ Session check: $($signals -join ' + ')" -ForegroundColor Yellow
    Write-Host "   Run /claude-md-guardian for full audit." -ForegroundColor DarkYellow
    Write-Host ""
}
# If no signals: silent exit
```

- [ ] **Step 2: Register the Stop hook in settings.json**

Read `.claude/settings.json` first (currently contains `{"enabledPlugins": {...}}`), then write:

```json
{
  "enabledPlugins": {
    "supabase@claude-plugins-official": true
  },
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "pwsh -NonInteractive -File /home/circletel/.claude/hooks/session-end-check.ps1 -ProjectPath /home/circletel"
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 3: Verify the hook script is valid PowerShell**

```bash
pwsh -NonInteractive -Command "& { Get-Content '/home/circletel/.claude/hooks/session-end-check.ps1' | Out-Null; Write-Host 'Syntax OK' }"
# Expected: Syntax OK (or no output — just no error)
```

- [ ] **Step 4: Commit**

```bash
git add .claude/hooks/session-end-check.ps1 .claude/settings.json
git commit -m "feat(guardian): add session-end Stop hook + register in settings.json"
```

---

## Task 7: Wire Compound-Learnings to Optionally Invoke Session-End Check

**Files:**
- Modify: `.claude/skills/compound-learnings/SKILL.md`

- [ ] **Step 1: Read the current end of compound-learnings SKILL.md**

```bash
tail -20 /home/circletel/.claude/skills/compound-learnings/SKILL.md
```

- [ ] **Step 2: Append the session-end invocation section**

At the very end of `.claude/skills/compound-learnings/SKILL.md`, append:

```markdown

---

## Final Step: Session Signal Check

After completing the compound-learnings capture, run a quick signal check:

```bash
pwsh -NonInteractive -File /home/circletel/.claude/hooks/session-end-check.ps1 -ProjectPath /home/circletel
```

If signals are displayed, mention them to the user:
> "Signal check detected: [signals]. Run `/claude-md-guardian` when ready for a full audit."

If no output: continue silently.
```

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/compound-learnings/SKILL.md
git commit -m "feat(guardian): wire compound-learnings to invoke session-end signal check"
```

---

## Task 8: Integration Test

**Goal:** Verify the guardian catches the known stale Vercel/Coolify gap on first run.

- [ ] **Step 1: Verify the skill is discoverable**

```bash
ls /home/circletel/.claude/skills/claude-md-guardian/
# Expected: SKILL.md  accepted-debt.md  checks/  templates/
ls /home/circletel/.claude/skills/claude-md-guardian/checks/
# Expected: compliance.md  currency.md
ls /home/circletel/.claude/skills/claude-md-guardian/templates/
# Expected: report.md
```

- [ ] **Step 2: Check U1 manually (stale Vercel references)**

```bash
grep -c "Coolify" /home/circletel/.claude/rules/vercel-deployment.md
# Expected: 0 (confirms U1 will flag this as 🔴 stale)
```

- [ ] **Step 3: Check U3 manually (rule table vs actual files)**

```bash
ls /home/circletel/.claude/rules/*.md | xargs -I{} basename {} .md | sort
# Then compare against rules table in CLAUDE.md
grep "\.md" /home/circletel/CLAUDE.md | grep -oE "[a-z-]+\.md"
```

- [ ] **Step 4: Run the guardian skill**

Invoke `/claude-md-guardian` and verify:
- Report is generated with the correct format
- U1 appears as 🔴 stale (vercel-deployment.md has 0 Coolify references)
- U3 flags any rule files not in the CLAUDE.md table
- Fix flow offers to update `vercel-deployment.md`

- [ ] **Step 5: Accept the U1 fix (update vercel-deployment.md)**

When prompted: respond `y` to update the stale rule file.
Verify the commit is created: `git log --oneline -3`

- [ ] **Step 6: Run the session-end hook manually**

```bash
pwsh -NonInteractive -File /home/circletel/.claude/hooks/session-end-check.ps1 -ProjectPath /home/circletel
# Expected: silent (no signals) OR a nudge if signals exist
```

- [ ] **Step 7: Final commit**

```bash
git log --oneline -8
# Verify 7 commits exist for this feature (Tasks 1-7)
```
