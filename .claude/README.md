# Claude Code Business OS

Complete guide for using agents, commands, skills, hooks, and tools in the CircleTel project.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Directory Structure](#directory-structure)
3. [Agents](#agents)
4. [Commands](#commands)
5. [Skills](#skills)
6. [Hooks](#hooks)
7. [Tools](#tools)
8. [Context & Memory](#context--memory)
9. [Daily Workflows](#daily-workflows)
10. [Installation (Global)](#installation-global)

---

## Quick Start

### Essential Commands Cheat Sheet

```
┌─────────────────────────────────────────────────────────────────────┐
│  PROJECT SYNC & CONTEXT                                             │
├─────────────────────────────────────────────────────────────────────┤
│  check-sync.ps1 -FetchRemote    Check local vs remote alignment     │
│  cat .claude/context/current-task.md   What am I working on?        │
│  cat .claude/memory/gotchas.md         Known issues & fixes         │
├─────────────────────────────────────────────────────────────────────┤
│  COMMANDS (Slash Commands)                                          │
├─────────────────────────────────────────────────────────────────────┤
│  /new-migration <name>          Create Supabase migration           │
│  /health-check                  Run full project diagnostics        │
│  /sync-types                    Generate TS types from Supabase     │
│  /generate-spec <feature>       Create feature specification        │
│  /quick-analysis <feature>      Analyze feature implementation      │
├─────────────────────────────────────────────────────────────────────┤
│  SESSIONS & BACKGROUND                                              │
├─────────────────────────────────────────────────────────────────────┤
│  /rename <name>                 Name current session                │
│  /resume <name>                 Resume named session                │
│  Ctrl+B                         Run command in background           │
│  /tasks                         List running background tasks       │
├─────────────────────────────────────────────────────────────────────┤
│  STATS & MONITORING                                                 │
├─────────────────────────────────────────────────────────────────────┤
│  /stats                         View usage stats and streak         │
│  /cost                          View session cost                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Session Start Workflow

```bash
# 1. Check sync status
powershell -File .claude/skills/project-sync/check-sync.ps1 -FetchRemote

# 2. Review what you were working on
cat .claude/context/current-task.md

# 3. Check known patterns/gotchas
cat .claude/memory/patterns.md | head -50

# 4. Start development
npm run dev:memory
```

---

## Directory Structure

```
.claude/
├── agents/                    # Specialized AI agents
│   ├── api-engineer.md        # API endpoint development
│   ├── api-docs-writer.md     # API documentation
│   └── prompt-optimizer.md    # Prompt engineering
│
├── commands/                  # Slash commands (/command-name)
│   ├── new-migration.md       # Create DB migrations
│   ├── health-check.md        # Project diagnostics
│   ├── sync-types.md          # Generate TS types
│   ├── generate-spec.md       # Feature specifications
│   ├── quick-analysis.md      # Feature analysis
│   └── update-interstellio-docs.md
│
├── context/                   # Session state (gitignored)
│   ├── current-task.md        # What you're working on NOW
│   └── decisions.md           # Key decisions made
│
├── hooks/                     # Event-triggered scripts
│   ├── session-start.ps1      # Runs on session start
│   ├── backup-before-edit.ps1 # Backup before file edits
│   └── log-bash-commands.ps1  # Audit bash commands
│
├── memory/                    # Persistent learnings
│   ├── patterns.md            # Codebase patterns
│   ├── gotchas.md             # Known issues & fixes
│   └── preferences.md         # User preferences
│
├── scratch/                   # Temporary files (gitignored)
│   └── tool-outputs/          # Large command outputs
│
├── skills/                    # Modular capabilities (16 skills)
│   ├── async-runner/          # Background tasks
│   ├── bug-fixing/            # Debugging workflow
│   ├── context-manager/       # Token optimization
│   ├── database-migration/    # Supabase migrations
│   ├── filesystem-context/    # Session continuity
│   ├── mobile-testing/        # Playwright mobile tests
│   ├── pm-agent/              # Product management
│   ├── project-sync/          # Git sync checker
│   ├── prompt-optimizer/      # Prompt engineering
│   ├── refactor/              # Code quality
│   ├── rules-organizer/       # Coding standards
│   ├── screenshot-analyzer/   # UI debugging
│   ├── session-checker/       # Interstellio sessions
│   ├── session-manager/       # Named sessions
│   ├── skill-creator/         # Scaffold new skills
│   └── stats-tracker/         # Usage analytics
│
├── tools/                     # MCP code execution tools
│   ├── supabase-executor.ts   # Database query executor
│   ├── types.ts               # Tool type definitions
│   └── utils.ts               # Shared utilities
│
├── settings.local.json        # Local Claude settings
└── README.md                  # This file
```

---

## Agents

Agents are specialized AI personas for specific tasks. Invoke via the Task tool.

| Agent | Purpose | Trigger |
|-------|---------|---------|
| **api-engineer** | Create/modify API endpoints | "Create an API endpoint for..." |
| **api-docs-writer** | Generate API documentation | After completing API work |
| **prompt-optimizer** | Optimize prompts for Claude | "Help me write a better prompt" |

### Usage Examples

```
User: "Create an API endpoint for customer invoice history"
→ Launches api-engineer agent

User: "Document the payment API endpoints"
→ Launches api-docs-writer agent
```

### Agent Features

- **api-engineer**: Next.js 15 patterns, auth (consumer/partner/admin), Zod validation, tests, OpenAPI docs
- **api-docs-writer**: OpenAPI specs, cURL examples, .http files, frontend integration examples
- **prompt-optimizer**: CircleTel context injection, structured output, best practices

---

## Commands

Slash commands for common operations. Use as `/command-name`.

| Command | Arguments | Purpose |
|---------|-----------|---------|
| `/new-migration` | `<name>` | Create timestamped Supabase migration with template |
| `/health-check` | - | Run type-check + context analyzer + Supabase advisors |
| `/sync-types` | - | Generate TypeScript types from Supabase schema |
| `/generate-spec` | `<feature>` | Create feature specification document |
| `/quick-analysis` | `<feature>` | Analyze feature implementation |
| `/update-interstellio-docs` | - | Update Interstellio API documentation |

### Examples

```bash
# Create a new migration
/new-migration add_customer_notifications

# Run health check before deployment
/health-check

# Generate types after schema changes
/sync-types
```

---

## Skills

Skills are modular capabilities that auto-activate based on keywords.

### Core Skills

| Skill | Purpose | Activation |
|-------|---------|------------|
| **context-manager** | Token optimization | "context budget", "token usage" |
| **bug-fixing** | Debugging workflow | "debug", "error", "fix bug" |
| **database-migration** | Supabase migrations | "migration", "database change" |
| **prompt-optimizer** | Prompt engineering | "optimize prompt", "better prompt" |

### Utility Skills

| Skill | Purpose | Command |
|-------|---------|---------|
| **project-sync** | Git local/remote alignment | `powershell -File .claude/skills/project-sync/check-sync.ps1` |
| **filesystem-context** | Session continuity | Auto-activates on "resume", "continue" |
| **session-checker** | Interstellio PPPoE status | `powershell -File .claude/skills/session-checker/check-sync.ps1` |
| **session-manager** | Named sessions | `/rename`, `/resume` |
| **async-runner** | Background tasks | `Ctrl+B`, `/tasks` |
| **stats-tracker** | Usage analytics | `/stats`, `/usage` |

### Development Skills

| Skill | Purpose | Activation |
|-------|---------|------------|
| **skill-creator** | Scaffold new skills | "create skill", "new skill" |
| **refactor** | Code quality analysis | "refactor", "tech debt" |
| **mobile-testing** | Playwright mobile tests | "mobile test", "responsive" |
| **screenshot-analyzer** | UI debugging | Paste screenshot + ask |
| **rules-organizer** | Coding standards | "coding standards", "rules" |
| **pm-agent** | Product management | Feature specs |

### Using project-sync Skill

```powershell
# Full sync check with remote fetch
powershell -File .claude/skills/project-sync/check-sync.ps1 -FetchRemote

# Quick status
powershell -File .claude/skills/project-sync/check-sync.ps1 -Quick

# JSON output (for scripting)
powershell -File .claude/skills/project-sync/check-sync.ps1 -Json
```

**Output indicators:**
- `[SYNCED]` - Fully synchronized
- `[AHEAD]` - Unpushed commits
- `[BEHIND]` - Unpulled commits
- `[DIVERGED]` - Both have new commits
- `[DIRTY]` - Uncommitted changes

### Using filesystem-context Skill

```bash
# Check current task
cat .claude/context/current-task.md

# Review patterns
cat .claude/memory/patterns.md

# Check known issues
cat .claude/memory/gotchas.md

# Update current task (before ending session)
# Edit .claude/context/current-task.md with what you accomplished
```

---

## Hooks

Hooks are scripts that run automatically on specific events.

| Hook | Trigger | Purpose |
|------|---------|---------|
| **session-start.ps1** | New session | Run context analyzer, show budget |
| **backup-before-edit.ps1** | Before file edit | Backup to `.claude/backups/` |
| **log-bash-commands.ps1** | After bash command | Audit log to `.claude/logs/` |

### Hook Configuration

Hooks are configured in `.claude/settings.local.json`:

```json
{
  "hooks": {
    "PreToolExecution": [...],
    "PostToolExecution": [...],
    "SessionStart": [...]
  }
}
```

---

## Tools

MCP code execution tools for programmatic operations.

| Tool | Purpose | Token Savings |
|------|---------|---------------|
| **supabase-executor** | Execute database queries | ~80% reduction |

### Supabase Executor Usage

```typescript
import { executeQuery, quickSelect, quickFind } from './.claude/tools/supabase-executor';

// Find failed syncs
await executeQuery({
  table: 'customers',
  operation: 'select',
  filters: [{ column: 'zoho_sync_status', operator: 'eq', value: 'failed' }],
  limit: 10
});

// Quick count
const count = await quickCount('customer_services', [
  { column: 'status', operator: 'eq', value: 'active' }
]);

// Find by ID
const customer = await quickFind('customers', 'cust_123');
```

---

## Context & Memory

### Session Context (`.claude/context/`)

**current-task.md** - Track what you're working on:
```markdown
# Current Task

## What I'm Working On
[Description of current task]

## Recent Actions
- Action 1
- Action 2

## Next Steps
1. Next step

## Files Currently Relevant
- path/to/file.ts
```

**decisions.md** - Document key decisions:
```markdown
### Decision: [Title]
- **Date**: YYYY-MM-DD
- **Context**: Why this came up
- **Chosen**: Option selected
- **Rationale**: Why
```

### Persistent Memory (`.claude/memory/`)

**patterns.md** - Codebase patterns that persist across sessions
**gotchas.md** - Known issues and their solutions
**preferences.md** - User preferences and workflow

---

## Daily Workflows

### Morning Start

```bash
# 1. Check project sync
powershell -File .claude/skills/project-sync/check-sync.ps1 -FetchRemote

# 2. Pull if behind
git pull origin main

# 3. Review context
cat .claude/context/current-task.md

# 4. Start dev server
npm run dev:memory
```

### Before Commit

```bash
# 1. Type check
npm run type-check:memory

# 2. Check sync
powershell -File .claude/skills/project-sync/check-sync.ps1 -Quick

# 3. Commit
git add . && git commit -m "feat: description"
```

### End of Day

```bash
# 1. Update current task with progress
# Edit .claude/context/current-task.md

# 2. Add any new patterns/gotchas learned
# Edit .claude/memory/patterns.md or gotchas.md

# 3. Push work
git push origin main
```

---

## Installation (Global)

### Install Skills Globally

```powershell
# Install project-sync globally
powershell -File .claude/skills/project-sync/install-global.ps1

# Install filesystem-context globally
powershell -File .claude/skills/filesystem-context/install-global.ps1
```

### Global Locations

| Type | Location |
|------|----------|
| Skills | `~/.claude/skills/` |
| Context | `~/.claude/context/` |
| Memory | `~/.claude/memory/` |
| Rules | `~/.claude/rules/` |

### Verify Installation

```bash
ls ~/.claude/skills/
# Should show: project-sync, filesystem-context, etc.
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────────┐
│              CLAUDE CODE BUSINESS OS - QUICK REFERENCE              │
├─────────────────────────────────────────────────────────────────────┤
│ SYNC CHECK                                                          │
│   Full:    check-sync.ps1 -FetchRemote                             │
│   Quick:   check-sync.ps1 -Quick                                   │
├─────────────────────────────────────────────────────────────────────┤
│ CONTEXT                                                             │
│   Current: cat .claude/context/current-task.md                     │
│   Patterns: cat .claude/memory/patterns.md                         │
│   Gotchas: cat .claude/memory/gotchas.md                           │
├─────────────────────────────────────────────────────────────────────┤
│ COMMANDS                                                            │
│   /new-migration <name>    Create DB migration                     │
│   /health-check            Full diagnostics                        │
│   /sync-types              Generate TS types                       │
├─────────────────────────────────────────────────────────────────────┤
│ SKILLS                                                              │
│   project-sync             Git alignment check                     │
│   filesystem-context       Session continuity                      │
│   context-manager          Token optimization                      │
│   bug-fixing               Debug workflow                          │
├─────────────────────────────────────────────────────────────────────┤
│ DEVELOPMENT                                                         │
│   Dev:     npm run dev:memory                                      │
│   Types:   npm run type-check:memory                               │
│   Build:   npm run build:memory                                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

**Version**: 1.0.0
**Last Updated**: 2025-01-08
**Maintained By**: CircleTel Development Team
