# Shared Memory OS Template Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a shared Memory OS template at `/root/.claude/templates/memory-os/` and an init script so any VPS project can instantly get the same "wake up smarter each session" system that CircleTel uses.

**Architecture:** Template files live in `/root/.claude/templates/memory-os/` (global Claude config, always available). An init script copies them into `$PWD/memory-os/` and wires up `.gitignore`. The global `CLAUDE.md` is updated so the Memory OS protocol fires on every project, not just CircleTel. Finally the 5 active VPS projects are initialized in one pass.

**Tech Stack:** Bash, Markdown, global Claude Code config (`/root/.claude/`)

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Create | `/root/.claude/templates/memory-os/long-term/decisions.md` | Architecture & business decisions template |
| Create | `/root/.claude/templates/memory-os/long-term/patterns.md` | Proven patterns template |
| Create | `/root/.claude/templates/memory-os/long-term/mistakes.md` | Mistakes log template |
| Create | `/root/.claude/templates/memory-os/long-term/client-context.md` | Business/client context template |
| Create | `/root/.claude/templates/memory-os/short-term/active-tasks.md` | In-progress tasks template |
| Create | `/root/.claude/templates/memory-os/short-term/blockers.md` | Current blockers template |
| Create | `/root/.claude/templates/memory-os/short-term/session-notes.md` | Session notes template |
| Create | `/root/.claude/templates/memory-os/self-improvement/scores.md` | Output quality scores template |
| Create | `/root/.claude/templates/memory-os/self-improvement/feedback-log.md` | User corrections template |
| Create | `/root/.claude/templates/memory-os/self-improvement/improvement-plan.md` | Improvement actions template |
| Create | `/root/.claude/scripts/init-memory-os.sh` | Init script — copies template into any project |
| Modify | `/root/.claude/CLAUDE.md` | Add Memory OS protocol for all projects |
| Execute | `/home/entrsphere/`, `/home/entrsphere-website/`, `/home/frontend-design/`, `/home/receipt2claim/`, `/home/skills-playbook/` | Apply template to all active VPS projects |

---

## Task 1: Create template directory structure

**Files:**
- Create: `/root/.claude/templates/memory-os/` (full tree)

- [ ] **Step 1: Create all template directories**

```bash
mkdir -p /root/.claude/templates/memory-os/long-term
mkdir -p /root/.claude/templates/memory-os/short-term
mkdir -p /root/.claude/templates/memory-os/self-improvement
mkdir -p /root/.claude/scripts
```

- [ ] **Step 2: Verify structure**

```bash
find /root/.claude/templates/memory-os -type d
```

Expected output:
```
/root/.claude/templates/memory-os
/root/.claude/templates/memory-os/long-term
/root/.claude/templates/memory-os/short-term
/root/.claude/templates/memory-os/self-improvement
```

---

## Task 2: Write long-term memory template files

**Files:**
- Create: `/root/.claude/templates/memory-os/long-term/decisions.md`
- Create: `/root/.claude/templates/memory-os/long-term/patterns.md`
- Create: `/root/.claude/templates/memory-os/long-term/mistakes.md`
- Create: `/root/.claude/templates/memory-os/long-term/client-context.md`

- [ ] **Step 1: Write decisions.md**

```bash
cat > /root/.claude/templates/memory-os/long-term/decisions.md << 'EOF'
# Architecture & Business Decisions

> Long-term memory: Key decisions made in this project with reasoning. Never reverse without understanding why.

## Format
[YYYY-MM-DD] Decision Title
Decision: What was decided
Why: The reasoning / constraint / tradeoff
Alternatives considered: What was rejected and why
Impact: What this affects going forward

---

<!-- Add decisions below -->
EOF
```

- [ ] **Step 2: Write patterns.md**

```bash
cat > /root/.claude/templates/memory-os/long-term/patterns.md << 'EOF'
# Proven Patterns

> Long-term memory: Patterns that work in this codebase. Follow these instead of reinventing.

## Dev Environment
<!-- Add dev environment patterns here -->

## Architecture Patterns
<!-- Add architecture patterns here -->

## Common Gotchas
<!-- Add project-specific gotchas here -->

---

> **Rule**: When you discover a new pattern that works, add it here. When a pattern breaks, move it to mistakes.md with explanation.
EOF
```

- [ ] **Step 3: Write mistakes.md**

```bash
cat > /root/.claude/templates/memory-os/long-term/mistakes.md << 'EOF'
# Mistakes & Pitfalls — Never Repeat These

> Long-term memory: Every mistake costs time. Log them here so future sessions don't repeat them.

## Format
[YYYY-MM-DD] Mistake Title
What happened: Description
Root cause: Why it happened
Fix: How it was resolved
Prevention: How to avoid this forever

---

<!-- Add mistakes below -->

> **Rule**: Every correction from the user goes here immediately. This is the most important file in Memory OS.
EOF
```

- [ ] **Step 4: Write client-context.md**

```bash
cat > /root/.claude/templates/memory-os/long-term/client-context.md << 'EOF'
# Client & Business Context

> Long-term memory: Business context, pricing logic, market specifics. Claude needs this to make good product decisions.

## Project Overview
- **Project**: <!-- Name -->
- **Type**: <!-- B2B / B2C / internal tool / etc -->
- **Stack**: <!-- Key technologies -->
- **Production URL**: <!-- URL -->

## Business Rules
<!-- Key business rules Claude must know -->

## Key Stakeholders
<!-- Who owns what decisions -->

## Market Context
<!-- Relevant market / industry context -->

---

> **Rule**: Update this when business rules change. Stale context causes bad suggestions.
EOF
```

- [ ] **Step 5: Verify long-term files**

```bash
ls -la /root/.claude/templates/memory-os/long-term/
```

Expected: 4 files (decisions.md, patterns.md, mistakes.md, client-context.md)

---

## Task 3: Write short-term and self-improvement template files

**Files:**
- Create: `/root/.claude/templates/memory-os/short-term/active-tasks.md`
- Create: `/root/.claude/templates/memory-os/short-term/blockers.md`
- Create: `/root/.claude/templates/memory-os/short-term/session-notes.md`
- Create: `/root/.claude/templates/memory-os/self-improvement/scores.md`
- Create: `/root/.claude/templates/memory-os/self-improvement/feedback-log.md`
- Create: `/root/.claude/templates/memory-os/self-improvement/improvement-plan.md`

- [ ] **Step 1: Write active-tasks.md**

```bash
cat > /root/.claude/templates/memory-os/short-term/active-tasks.md << 'EOF'
# Active Tasks — Current Sprint

> Short-term memory: What is in progress right now. Clear this at the end of each sprint.

## In Progress
<!-- Tasks currently being worked on -->

## Up Next
<!-- Tasks queued but not started -->

## Recently Completed
<!-- Done this sprint — for context -->

---

> **Rule**: Read this at session start for continuity. Update it at session end.
EOF
```

- [ ] **Step 2: Write blockers.md**

```bash
cat > /root/.claude/templates/memory-os/short-term/blockers.md << 'EOF'
# Current Blockers & Unknowns

> Short-term memory: What is blocking progress. Resolve and remove entries when unblocked.

## Active Blockers

<!-- Format:
### [YYYY-MM-DD] Blocker Title
**Blocking**: What task/feature is blocked
**Why**: Root cause of block
**Waiting on**: Who/what can unblock this
**Workaround**: Temporary workaround if any
-->

## Resolved (keep for 1 sprint)
<!-- Recently resolved blockers — remove after next sprint -->

---

> **Rule**: A blocker with no owner is a blocker forever. Every entry needs a "Waiting on".
EOF
```

- [ ] **Step 3: Write session-notes.md**

```bash
cat > /root/.claude/templates/memory-os/short-term/session-notes.md << 'EOF'
# Session Notes

> Short-term memory: What happened this working session. Cleared each session start.

## [YYYY-MM-DD] Session

### What Was Done
<!-- Summary of work completed -->

### Decisions Made
<!-- Any decisions made this session — move important ones to long-term/decisions.md -->

### Handoff Notes
<!-- What the next session needs to know to pick up cleanly -->

---
EOF
```

- [ ] **Step 4: Write scores.md**

```bash
cat > /root/.claude/templates/memory-os/self-improvement/scores.md << 'EOF'
# Output Quality Scores

> Self-improvement: Score each significant session 1-10. Track trends. Improve.

## Scoring Criteria
- Did it pass type-check first try? (+2)
- Was the blast radius correct? (+2)
- Did the user need to correct anything? (-1 per correction)
- Was the approach the simplest possible? (+2)
- Did it work end-to-end without rework? (+2)
- Was context well-managed? (+2)

## Log

| Date | Task | Score | Notes |
|------|------|-------|-------|
| YYYY-MM-DD | Task name | X/10 | Key observation |

---

> **Rule**: Score < 7 → add specific improvement to improvement-plan.md immediately.
EOF
```

- [ ] **Step 5: Write feedback-log.md**

```bash
cat > /root/.claude/templates/memory-os/self-improvement/feedback-log.md << 'EOF'
# User Feedback & Corrections

> Self-improvement: Every correction from the user is logged here and converted to a rule.

## Format
[YYYY-MM-DD] Correction Title
What I did: Description of incorrect action
What user said: Direct quote or paraphrase
Rule extracted: Actionable rule for future sessions
Applied to: Which file was updated (mistakes.md / patterns.md / CLAUDE.md rule)

---

<!-- Add corrections below -->

> **Rule**: A correction not logged is a correction repeated.
EOF
```

- [ ] **Step 6: Write improvement-plan.md**

```bash
cat > /root/.claude/templates/memory-os/self-improvement/improvement-plan.md << 'EOF'
# Improvement Plan

> Self-improvement: Specific things to do differently next session. Read this BEFORE starting work.

## Active Improvements

<!-- Format:
### [YYYY-MM-DD] Improvement Title
**Problem**: What went wrong
**Change**: Specific behaviour to adopt
**How to apply**: When/where this kicks in
**Success metric**: How to know it's working
-->

## Completed Improvements
<!-- Improvements that are now habitual — archive here -->

---

> **Rule**: If improvement-plan.md is empty, you're not learning fast enough.
EOF
```

- [ ] **Step 7: Verify all template files**

```bash
find /root/.claude/templates/memory-os -name "*.md" | sort
```

Expected: 10 files total across 3 subdirectories.

---

## Task 4: Write the init script

**Files:**
- Create: `/root/.claude/scripts/init-memory-os.sh`

- [ ] **Step 1: Write init script**

```bash
cat > /root/.claude/scripts/init-memory-os.sh << 'SCRIPT'
#!/usr/bin/env bash
# init-memory-os.sh — Initialize Memory OS in the current project directory
# Usage: bash /root/.claude/scripts/init-memory-os.sh [project-name]

set -e

TEMPLATE_DIR="/root/.claude/templates/memory-os"
TARGET_DIR="${PWD}/memory-os"
PROJECT_NAME="${1:-$(basename "$PWD")}"

if [ ! -d "$TEMPLATE_DIR" ]; then
  echo "ERROR: Template not found at $TEMPLATE_DIR"
  exit 1
fi

if [ -d "$TARGET_DIR" ]; then
  echo "Memory OS already exists at $TARGET_DIR — skipping."
  exit 0
fi

echo "Initializing Memory OS for: $PROJECT_NAME"
echo "Target: $TARGET_DIR"

# Copy template
cp -r "$TEMPLATE_DIR" "$TARGET_DIR"

# Stamp project name into client-context.md
sed -i "s|<!-- Name -->|$PROJECT_NAME|g" "$TARGET_DIR/long-term/client-context.md"

# Add memory-os to .gitignore if not already there
GITIGNORE="${PWD}/.gitignore"
if [ -f "$GITIGNORE" ]; then
  if ! grep -q "memory-os/short-term" "$GITIGNORE"; then
    echo "" >> "$GITIGNORE"
    echo "# Memory OS — short-term and self-improvement are session-local" >> "$GITIGNORE"
    echo "memory-os/short-term/" >> "$GITIGNORE"
    echo "memory-os/self-improvement/" >> "$GITIGNORE"
  fi
  echo ".gitignore updated."
else
  echo "No .gitignore found — skipping gitignore update."
fi

echo ""
echo "Memory OS initialized at $TARGET_DIR"
echo ""
echo "Structure:"
find "$TARGET_DIR" -name "*.md" | sort | sed "s|$PWD/||"
echo ""
echo "Next steps:"
echo "  1. Edit memory-os/long-term/client-context.md with project details"
echo "  2. Add 'memory-os/' section to your CLAUDE.md Memory OS protocol"
SCRIPT

chmod +x /root/.claude/scripts/init-memory-os.sh
```

- [ ] **Step 2: Test the script runs without error (dry run check)**

```bash
bash -n /root/.claude/scripts/init-memory-os.sh && echo "syntax OK"
```

Expected: `syntax OK`

---

## Task 5: Update global CLAUDE.md

**Files:**
- Modify: `/root/.claude/CLAUDE.md`

- [ ] **Step 1: Read current Memory & Learnings section**

```bash
grep -n "Memory\|memory-os\|compound" /root/.claude/CLAUDE.md | head -20
```

- [ ] **Step 2: Add Memory OS protocol to global CLAUDE.md**

In `/root/.claude/CLAUDE.md`, find the `## Memory & Learnings` section and replace/extend it with:

```markdown
## Memory OS (All Projects)

Every project on this VPS uses the Memory OS system. At session start:

1. Read `memory-os/short-term/active-tasks.md` for continuity
2. Read `memory-os/long-term/mistakes.md` to avoid repeats
3. Check `memory-os/self-improvement/improvement-plan.md` before coding

At session end:
1. Update `memory-os/short-term/session-notes.md`
2. Add new mistakes → `memory-os/long-term/mistakes.md`
3. Add new patterns → `memory-os/long-term/patterns.md`
4. Score output → `memory-os/self-improvement/scores.md`

**Init a new project:**
```bash
cd /home/my-project && bash /root/.claude/scripts/init-memory-os.sh
```
```

- [ ] **Step 3: Verify CLAUDE.md still parses (no broken markdown)**

```bash
wc -l /root/.claude/CLAUDE.md
```

---

## Task 6: Initialize all active VPS projects

**Target projects** (have `.git` and files):
- `/home/entrsphere`
- `/home/entrsphere-website`
- `/home/frontend-design`
- `/home/receipt2claim`
- `/home/skills-playbook`

- [ ] **Step 1: Run init script in each active project**

```bash
for project in /home/entrsphere /home/entrsphere-website /home/frontend-design /home/receipt2claim /home/skills-playbook; do
  echo "=== Initializing: $project ==="
  cd "$project"
  bash /root/.claude/scripts/init-memory-os.sh "$(basename $project)"
  echo ""
done
```

- [ ] **Step 2: Verify Memory OS exists in each project**

```bash
for project in /home/entrsphere /home/entrsphere-website /home/frontend-design /home/receipt2claim /home/skills-playbook; do
  count=$(find "$project/memory-os" -name "*.md" 2>/dev/null | wc -l)
  echo "$project: $count files"
done
```

Expected: each project shows `10 files`

- [ ] **Step 3: Verify .gitignore updated in projects that have one**

```bash
for project in /home/entrsphere /home/entrsphere-website /home/frontend-design /home/receipt2claim /home/skills-playbook; do
  if grep -q "memory-os/short-term" "$project/.gitignore" 2>/dev/null; then
    echo "$project: gitignore ✓"
  else
    echo "$project: gitignore — no .gitignore or entry missing"
  fi
done
```

---

## Self-Review

**Spec coverage:**
- [x] Template directory with all 10 Memory OS files
- [x] Init script that works for any project
- [x] Global CLAUDE.md updated so protocol fires on all projects
- [x] All 5 active VPS projects initialized

**Placeholder scan:** No TBDs or stubs — all template files have real content and real headings.

**Type consistency:** N/A (bash/markdown only).
