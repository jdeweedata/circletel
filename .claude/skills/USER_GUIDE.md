# Claude Code v2.0.64 Skills - User Guide

Complete guide for using the new Claude Code skills in the CircleTel project.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Skills Overview](#skills-overview)
3. [Session Manager](#1-session-manager)
4. [Async Runner](#2-async-runner)
5. [Rules Organizer](#3-rules-organizer)
6. [Stats Tracker](#4-stats-tracker)
7. [Screenshot Analyzer](#5-screenshot-analyzer)
8. [Daily Workflows](#daily-workflows)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 5-Minute Setup

```bash
# Skills are already installed! Just restart Claude Code:
claude

# Verify skills are loaded
/skills  # Should show all 5 new skills
```

### Essential Commands Cheat Sheet

```
┌─────────────────────────────────────────────────────────────────┐
│  SESSIONS                                                       │
├─────────────────────────────────────────────────────────────────┤
│  /rename <name>        Name current session                     │
│  /resume <name>        Resume named session                     │
│  /resume               Show session picker (P=preview, R=rename)│
│  claude --resume name  Resume from terminal                     │
├─────────────────────────────────────────────────────────────────┤
│  BACKGROUND TASKS                                               │
├─────────────────────────────────────────────────────────────────┤
│  Ctrl+B               Run command in background                 │
│  /tasks               List running background tasks             │
│  command &            Run with & suffix                         │
├─────────────────────────────────────────────────────────────────┤
│  STATS & MONITORING                                             │
├─────────────────────────────────────────────────────────────────┤
│  /stats               View usage stats and streak               │
│  /usage               View token limits                         │
│  /context             View context window usage                 │
│  /cost                View session cost                         │
├─────────────────────────────────────────────────────────────────┤
│  RULES                                                          │
├─────────────────────────────────────────────────────────────────┤
│  .claude/rules/       Project rules directory                   │
│  ~/.claude/rules/     Personal rules (all projects)             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Skills Overview

| Skill | Purpose | Key Feature |
|-------|---------|-------------|
| **session-manager** | Track multi-day work | `/rename`, `/resume` |
| **async-runner** | Parallel background tasks | `Ctrl+B`, agents |
| **rules-organizer** | Modular coding standards | `.claude/rules/` |
| **stats-tracker** | Monitor productivity | `/stats`, streaks |
| **screenshot-analyzer** | UI debugging | Accurate coordinates |

### How Skills Activate

Skills activate automatically based on your conversation:

```
You: "I need to resume my billing work"
→ session-manager activates

You: "Run tests in parallel while I code"
→ async-runner activates

You: "Set up coding standards for the team"
→ rules-organizer activates

You: "How much have I used Claude this week?"
→ stats-tracker activates

You: [Paste screenshot] "What's wrong with this button?"
→ screenshot-analyzer activates
```

---

## 1. Session Manager

**Purpose**: Name, organize, and resume Claude Code sessions.

### Quick Start

```bash
# Starting new work
claude
/rename feature-customer-billing

# Next day, resume exactly where you left off
claude --resume feature-customer-billing
```

### Naming Conventions

```
Feature work:     dashboard-billing-history
                  admin-orders-export
                  payment-netcash-fix

Bug fixes:        BUG-1234-auth-timeout
                  HOTFIX-payment-fail

Sprints:          sprint-23-kyc-workflow
                  week-49-cleanup
```

### Common Workflows

#### Workflow A: Feature Development
```bash
# Day 1
git checkout -b feature/billing
claude
/rename feature-billing
# Work on feature...

# Day 2
claude --resume feature-billing
# Continue seamlessly with full context
```

#### Workflow B: Emergency Bug Fix
```bash
# Save current work
/rename paused-billing-work

# Start bug fix
claude
/rename HOTFIX-critical-bug
# Fix the bug...
git commit -m "fix: critical bug"

# Return to original work
claude --resume paused-billing-work
```

#### Workflow C: Parallel Work (Two Terminals)
```bash
# Terminal 1
claude --resume dashboard-work

# Terminal 2
claude --resume admin-work
```

### Session Picker Shortcuts

When you run `/resume` without a name:

| Key | Action |
|-----|--------|
| `P` | Preview session content |
| `R` | Rename session |
| `Enter` | Select and resume |
| `j/k` | Navigate list |
| `Esc` | Cancel |

---

## 2. Async Runner

**Purpose**: Run tasks in background without blocking your work.

### Quick Start

```bash
# Start dev server (never blocks)
npm run dev:memory &

# Or use Ctrl+B for any command
[Ctrl+B] npm run build:memory
```

### Background Commands

#### Always Run in Background
```bash
npm run dev:memory &          # Dev server
npm run build:memory &        # Production build
npx supabase logs --follow &  # Log watching
npm run test:watch &          # Test watcher
```

#### Parallel Execution
Ask Claude to run multiple things:

```
"Run in parallel:
1. Type check
2. Build
3. All tests"
```

Claude spawns:
```bash
npm run type-check:memory &
npm run build:memory &
npm test &
```

### Background Agents

#### Parallel Research
```
"Spawn Explore agents to research:
1. How auth works in /app/dashboard
2. Payment flow in /components/checkout
3. Coverage API in /lib/coverage"
```

Three Haiku-powered agents search concurrently, results aggregated.

#### Multi-File Analysis
```
"Analyze these files in parallel for security issues:
- app/api/payment/route.ts
- lib/payment/netcash.ts
- app/api/webhooks/netcash/route.ts"
```

### Task Management

```bash
# View running tasks
/tasks

# Kill specific task
"Kill the dev server"

# Check task output
"Show output from background build"
```

### Best Practices

| Do | Don't |
|----|-------|
| Background dev servers | Background git operations |
| Parallel independent tests | Parallel dependent tasks |
| Background long builds | Background quick commands |
| Spawn research agents | Block on single file reads |

---

## 3. Rules Organizer

**Purpose**: Organize coding standards into modular rule files.

### Quick Start

```bash
# Create rules directory
mkdir -p .claude/rules/backend

# Create a rule file
touch .claude/rules/backend/api-routes.md
```

### Directory Structure

```
.claude/rules/
├── general/
│   ├── code-style.md
│   └── error-handling.md
├── frontend/
│   ├── react-patterns.md
│   └── tailwind.md
├── backend/
│   ├── api-routes.md
│   └── supabase.md
└── domain/
    ├── payments.md
    └── coverage.md
```

### Rule File Format

```markdown
# API Route Conventions

## Next.js 15 Async Params

Always await params:

```typescript
// CORRECT
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
}
```

## Error Response Format

```typescript
return NextResponse.json(
  { error: 'Message', code: 'ERROR_CODE' },
  { status: 400 }
)
```
```

### CircleTel Recommended Rules

Create these rule files for CircleTel:

#### `.claude/rules/backend/api-routes.md`
- Next.js 15 async params pattern
- Supabase client selection
- Authentication header check
- Error response format

#### `.claude/rules/backend/supabase.md`
- Server vs client imports
- RLS policy requirements
- Service role usage
- Query patterns

#### `.claude/rules/domain/payments.md`
- NetCash webhook verification
- Payment status handling
- eMandate flow
- Error handling

#### `.claude/rules/frontend/react-patterns.md`
- Loading state pattern (try/catch/finally)
- Component organization
- Custom hooks
- Error boundaries

### Sharing Rules

#### Across Projects (Symlinks)
```bash
# Create shared directory
mkdir ~/shared-claude-rules

# Create shared rule
echo "# Security Rules" > ~/shared-claude-rules/security.md

# Link to projects
ln -s ~/shared-claude-rules/security.md .claude/rules/security.md
```

#### Personal Rules (All Projects)
```bash
# Create personal rules
mkdir -p ~/.claude/rules
touch ~/.claude/rules/preferences.md
```

---

## 4. Stats Tracker

**Purpose**: Monitor Claude Code usage and productivity.

### Quick Start

```bash
# View your stats
/stats

# View usage limits
/usage

# View current context
/context
```

### Understanding /stats

```
/stats

📊 Your Claude Code Stats
────────────────────────────
🏆 Favorite Model: Sonnet 4 (78% of sessions)
🔥 Current Streak: 12 days
📈 This Week: 847K tokens across 23 sessions
📉 Usage Graph: [▁▃▅▇█▆▄▂] (last 7 days)
```

### Model Selection Guide

| Task | Model | Why |
|------|-------|-----|
| General coding | Sonnet | Best balance |
| Complex architecture | Opus | Deep reasoning |
| Quick fixes | Haiku | Fast |
| Code exploration | Haiku (Explore) | Efficient |
| Documentation | Sonnet | Good writing |

### Daily Workflow

```bash
# Morning
/stats                    # Check streak
/usage                    # Plan day's work
/rename todays-feature    # Name session

# During work
/context                  # Monitor context

# End of day
/stats                    # Review productivity
/cost                     # Check costs
```

### Weekly Review

Every Friday:
```
1. /stats              # Review week
2. /usage              # Budget check
3. Note completions    # Track progress
4. Plan next week      # Allocate models
```

### Efficiency Tips

| High Usage | Low Usage |
|------------|-----------|
| Use Haiku for exploration | Already efficient |
| Spawn Explore agents | Keep current approach |
| More specific queries | Consider Opus for complex |
| Background for builds | Track what works |

---

## 5. Screenshot Analyzer

**Purpose**: Analyze UI screenshots with accurate coordinate mapping.

### Quick Start

```
# Paste screenshot and ask
[Paste image]
"What's wrong with this layout?"

# Or for specific coordinates
[Paste image]
"Where exactly is the submit button?"
```

### Coordinate System

```
(0,0) ────────────────────► X (width)
  │
  │    (100, 50) = 100px right, 50px down
  │
  ▼
  Y (height)
```

### Common Use Cases

#### UI Bug Debugging
```
You: [Screenshot] "The button isn't clickable"

Claude: "Screenshot: 1920x1080
        Button at (960, 750)
        Overlay covering (0, 700) to (1920, 800)
        The overlay is blocking the button.
        Fix: Adjust overlay z-index or position"
```

#### Playwright Test Generation
```
You: [Screenshot] "Generate test for this form"

Claude: "Elements detected:
        - Email: (720, 200)
        - Password: (720, 280)
        - Submit: (720, 360)

        ```typescript
        test('login', async ({ page }) => {
          await page.fill('[data-testid="email"]', 'user@test.com')
          await page.fill('[data-testid="password"]', 'pass123')
          await page.click('[data-testid="submit"]')
        })
        ```"
```

#### Responsive Issues
```
You: [Mobile screenshot] "Menu is cut off"

Claude: "Screenshot: 375x667 (iPhone SE)
        Menu icon at x=360, viewport width=375
        Only 15px from edge - too close for touch.

        Fix: Move to x=335 (40px from edge)"
```

### Common Screen Sizes

| Device | Size |
|--------|------|
| iPhone SE | 375x667 |
| iPhone 14 | 390x844 |
| iPad | 768x1024 |
| Laptop | 1366x768 |
| Desktop | 1920x1080 |

### Best Practices

1. **Full resolution** - Don't crop screenshots
2. **100% zoom** - Browser should be at 100%
3. **Prefer selectors** - Use data-testid over coordinates
4. **Document coordinates** - Comment why coordinates used

---

## Daily Workflows

### Morning Startup

```bash
# 1. Check stats and streak
/stats

# 2. Run context analyzer
powershell -File .claude/skills/context-manager/run-context-analyzer.ps1

# 3. Name session for today's work
/rename dashboard-billing-day1

# 4. Start dev server in background
npm run dev:memory &

# 5. Begin coding
```

### Feature Development

```bash
# Start
/rename feature-customer-services
git checkout -b feature/customer-services

# During development - parallel operations
"Run type check and tests in background while I continue"

# Check progress
/stats
/context

# End of day
git commit -m "wip: customer services progress"
# Session auto-saves, resume tomorrow with:
# claude --resume feature-customer-services
```

### Bug Fix Session

```bash
# Create dedicated session
/rename BUG-1234-payment-timeout

# Investigate with parallel agents
"Spawn agents to check:
1. API route error handling
2. Database query performance
3. Frontend retry logic"

# Fix and verify
# ...

# Close session
git commit -m "fix: payment timeout issue"
/stats  # See how much this fix cost
```

### Code Review

```bash
# Review session
/rename code-review-pr-456

# Use screenshots for UI review
[Paste screenshots]
"Check these UI changes for issues"

# Parallel checks
"Run lint, type-check, and tests in parallel"

# Generate review comments
"Summarize issues found"
```

---

## Best Practices

### Session Management
- Name sessions immediately
- Match git branch names
- Use consistent prefixes (FEAT-, BUG-, HOTFIX-)
- Resume next day instead of starting fresh

### Background Tasks
- Always background dev servers
- Parallel for independent tasks
- Use Explore agents for research
- Monitor with /tasks

### Rules Organization
- One topic per rule file
- Include code examples
- Show good AND bad patterns
- Update rules as patterns evolve

### Stats Monitoring
- Check /stats daily
- Match model to task complexity
- Track by feature using named sessions
- Weekly review for optimization

### Screenshots
- Use full resolution
- Note viewport dimensions
- Prefer data-testid selectors
- Document coordinate usage

---

## Troubleshooting

### Sessions

**Can't find session**
```bash
/resume  # Use picker to search
```

**Session context lost**
```bash
/context  # Check if near limit
# May need new session, reference old one
```

### Background Tasks

**Task not starting**
```bash
# Test command first
npm run dev:memory  # Without &

# Then background
npm run dev:memory &
```

**Can't see output**
```
"Show output from [task name]"
```

### Rules

**Rules not loading**
- Ensure .md extension
- Check file path
- Restart Claude Code

### Stats

**Stats seem wrong**
```bash
/cost  # Check current session
/usage # Check period usage
```

### Screenshots

**Coordinates off**
- Verify 100% browser zoom
- Check viewport dimensions
- Ensure no cropping

---

## Quick Reference Card

```
╔══════════════════════════════════════════════════════════════╗
║  CLAUDE CODE v2.0.64 SKILLS - QUICK REFERENCE                ║
╠══════════════════════════════════════════════════════════════╣
║  SESSIONS                                                    ║
║  /rename <name>     Name session                             ║
║  /resume <name>     Resume session                           ║
║  /resume            Session picker                           ║
║  P / R              Preview / Rename in picker               ║
╠══════════════════════════════════════════════════════════════╣
║  BACKGROUND                                                  ║
║  Ctrl+B             Background any command                   ║
║  command &          Run in background                        ║
║  /tasks             List background tasks                    ║
╠══════════════════════════════════════════════════════════════╣
║  STATS                                                       ║
║  /stats             Usage stats + streak                     ║
║  /usage             Token limits                             ║
║  /context           Context window                           ║
║  /cost              Session cost                             ║
╠══════════════════════════════════════════════════════════════╣
║  RULES                                                       ║
║  .claude/rules/     Project rules                            ║
║  ~/.claude/rules/   Personal rules                           ║
╠══════════════════════════════════════════════════════════════╣
║  MODELS                                                      ║
║  Sonnet             General coding (default)                 ║
║  Opus               Complex tasks                            ║
║  Haiku              Quick tasks, Explore agent               ║
╚══════════════════════════════════════════════════════════════╝
```

---

**Version**: 1.0.0
**Last Updated**: 2025-12-10
**For**: Claude Code v2.0.64+
**Project**: CircleTel
