# CircleTel Memory OS — Protocol

This is the **project-level** memory tier for all AI agents working on CircleTel. Both Hermes Agent and Claude Code MUST follow this protocol.

## Relationship to Global Memory

The global tier at `~/.agent-memory/` contains VPS-wide knowledge (tools, environment, cross-project patterns). This project tier contains CircleTel-specific knowledge. Both agents read both tiers.

## Session Protocol

### Start (every session)
1. Read `~/.agent-memory/GLOBAL_CONTEXT.md` and `~/.agent-memory/long-term/environment.md`
2. Read `~/.agent-memory/long-term/mistakes.md` (global mistakes)
3. Read `memory-os/long-term/mistakes.md` (project mistakes — do not repeat)
4. Read `memory-os/short-term/active-tasks.md` (what's in progress)
5. Read `memory-os/long-term/agent-context.md` (what agents have learned)
6. Read `memory-os/long-term/client-context.md` (business reality — mandatory before recommendations)
7. Check `memory-os/short-term/handoffs/` for any recent handoff notes from the other agent

### During Session
- When a decision is made → update `memory-os/long-term/decisions.md`
- When a new pattern is discovered → update `memory-os/long-term/patterns.md`
- When you make a mistake → update `memory-os/long-term/mistakes.md`
- When you learn something about the project that future agents need → update `memory-os/long-term/agent-context.md`
- When you complete significant work the other agent should know about → write handoff to `memory-os/short-term/handoffs/YYYY-MM-DD-topic.md`

### End (every session)
- Update `memory-os/short-term/session-notes.md` with what was done
- Update `memory-os/short-term/active-tasks.md` if task state changed
- If handing off → write a handoff note
- Score the session → `memory-os/self-improvement/scores.md`

## File Purposes

| File | What It Holds | Written By |
|------|---------------|------------|
| `README.md` | This protocol | Both |
| `long-term/decisions.md` | Architecture & business decisions with reasoning | Both |
| `long-term/patterns.md` | Proven patterns specific to CircleTel | Both |
| `long-term/mistakes.md` | Mistakes + how they were fixed | Both |
| `long-term/client-context.md` | Cash, burn, runway, team, pricing | Human + Agents |
| `long-term/agent-context.md` | What agents know — file paths, tool quirks, codebase facts | Agents |
| `short-term/active-tasks.md` | What's in progress right now | Both |
| `short-term/blockers.md` | Current blockers and unknowns | Both |
| `short-term/session-notes.md` | Notes from working sessions | Both |
| `short-term/handoffs/` | Explicit agent-to-agent handoffs | Both |
| `self-improvement/scores.md` | Quality scores 1-10 with reasoning | Both |
| `self-improvement/feedback-log.md` | User corrections and preferences | Both |
| `self-improvement/improvement-plan.md` | Concrete improvements for next session | Both |

## Agent Handoff Format

When handing off work between Hermes and Claude Code, write to `short-term/handoffs/YYYY-MM-DD-topic.md`:

```markdown
# Handoff: Topic
**From:** [Hermes Agent | Claude Code]
**To:** [Hermes Agent | Claude Code]  
**Date:** YYYY-MM-DD

## What Was Done
- Bullet list of completed work

## Key Findings / Decisions
- What the receiving agent MUST know

## Current State
- Where things stand now

## Next Steps
- What the receiving agent should do
```

## Notes
- Hermes reads these files via `read_file` tool
- Claude Code loads via CLAUDE.md directives and `.claude/rules/shared-memory.md`
- Both agents can write to these files
- The `agent-context.md` file is specifically for knowledge that doesn't fit in the other categories — think of it as "what I've learned about working in this codebase"
