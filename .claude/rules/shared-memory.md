# Shared Agent Memory Protocol

CircleTel uses a two-tier shared memory system so **Hermes Agent** and **Claude Code** never lose context between each other. This file documents the protocol Claude Code MUST follow.

## Two-Tier Architecture

| Tier | Location | Scope |
|------|----------|-------|
| Global | `~/.agent-memory/` | VPS-wide — tools, environment, cross-project patterns |
| Project | `memory-os/` | CircleTel-specific — business context, decisions, tasks |

## Session Start Protocol (MANDATORY)

BEFORE starting any work, read these files in order:

1. `~/.agent-memory/GLOBAL_CONTEXT.md` — VPS overview
2. `~/.agent-memory/long-term/environment.md` — Tools and quirks
3. `~/.agent-memory/long-term/mistakes.md` — Global mistakes — do not repeat
4. `~/.agent-memory/short-term/active-context.md` — Cross-project activity
5. `memory-os/README.md` — Full protocol for this project
6. `memory-os/long-term/mistakes.md` — Project mistakes — do not repeat
7. `memory-os/long-term/agent-context.md` — What Hermes Agent and previous Claude sessions have learned
8. `memory-os/short-term/active-tasks.md` — What's in progress
9. `memory-os/short-term/handoffs/` — Check for recent handoff notes from Hermes Agent

## Session End Protocol (MANDATORY)

Before ending a session or when completing significant work:

1. Update `memory-os/short-term/session-notes.md` with what was done
2. If task state changed → update `memory-os/short-term/active-tasks.md`
3. If you discovered new project facts → update `memory-os/long-term/agent-context.md`
4. If handing off to Hermes Agent → write handoff to `memory-os/short-term/handoffs/YYYY-MM-DD-topic.md`
5. If you made a mistake → add to `memory-os/long-term/mistakes.md`
6. Score the session → `memory-os/self-improvement/scores.md`

## Handoff Format

When Claude Code completes work Hermes Agent should know about:

```markdown
# Handoff: Topic
**From:** Claude Code
**To:** Hermes Agent
**Date:** YYYY-MM-DD

## What Was Done
- Bullet list of completed work

## Key Findings / Decisions
- What Hermes MUST know

## Current State
- Where things stand

## Next Steps
- What Hermes should do next
```

Save to: `memory-os/short-term/handoffs/YYYY-MM-DD-topic.md`

## When to Update agent-context.md

Update `memory-os/long-term/agent-context.md` when:
- You discover file paths, commands, or codebase facts not in CLAUDE.md
- You learn a tool quirk specific to this project
- You complete analysis that future agents need
- You identify a codebase pattern worth documenting

## Relationship to Claude Auto-Memory

Claude Code also maintains auto-memory at `~/.claude/projects/circletel/memory/`. This is separate — it's Claude's own accumulated notes. The shared memory system (`memory-os/`) is the EXPLICIT handoff layer between agents. Use both.

## Global Tier Updates

When you discover something that applies across all projects (new VPS tool, global pattern, cross-project insight), also update `~/.agent-memory/long-term/environment.md` or the appropriate global file.

## Receiving Handoffs

When you find a handoff note from Hermes Agent in `memory-os/short-term/handoffs/`:
1. Read it fully before starting work
2. The "Next Steps" section is your starting point
3. The "Key Findings" section contains context you'd otherwise have to rediscover
4. After completing the handoff's next steps, write a response handoff if needed
