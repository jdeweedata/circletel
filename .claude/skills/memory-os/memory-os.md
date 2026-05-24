---
name: memory-os
description: Persistent memory system. Auto-triggers on session start, session end, mistakes, feedback, decisions, and new patterns. Wraps around the Superpowers Pipeline. Two-tier: global (~/.agent-memory/) + project (memory-os/). Shares context with Hermes Agent via handoffs.
triggers:
  - session_start
  - session_end  
  - user_correction
  - new_decision
  - new_pattern
  - bug_found
  - task_complete
---

# Memory OS Skill

## Purpose
Automatic persistent memory across Claude Code sessions. No manual prompts needed. Two-tier architecture shared with Hermes Agent.

## TWO-TIER ARCHITECTURE

| Tier | Location | Scope |
|------|----------|-------|
| Global | `~/.agent-memory/` | VPS-wide — tools, environment, cross-project patterns |
| Project | `memory-os/` | Project-specific — business context, decisions, tasks |

Both Claude Code and Hermes Agent read and write to these tiers. Check for handoffs from Hermes at `memory-os/short-term/handoffs/`.

## AUTO-TRIGGER RULES

### 🟢 SESSION START (triggers on EVERY new conversation)
When a new session begins or first message is received:
1. Read `~/.agent-memory/GLOBAL_CONTEXT.md` — VPS environment overview
2. Read `~/.agent-memory/long-term/environment.md` — tools and quirks
3. Read `~/.agent-memory/long-term/mistakes.md` — global mistakes to avoid
4. Read `memory-os/self-improvement/improvement-plan.md` — apply active improvements
5. Read `memory-os/short-term/active-tasks.md` — pick up where we left off
6. Read `memory-os/long-term/mistakes.md` — never repeat these
7. Read `memory-os/long-term/agent-context.md` — what Hermes and previous sessions learned
8. Check `memory-os/short-term/handoffs/` — any handoff notes from Hermes Agent?
9. Read `memory-os/self-improvement/feedback-log.md` — respect user preferences
10. Silently apply context. Do NOT narrate what you read. Just use it.

### 🔴 SESSION END (triggers when user says "done", "that's all", "wrap up", "end session", "let's stop", "save progress")
When session is ending:
1. Update `memory-os/short-term/session-notes.md` with what was done
2. Update `memory-os/short-term/active-tasks.md` with current status
3. If new project facts discovered → update `memory-os/long-term/agent-context.md`
4. If handing off to Hermes Agent → write to `memory-os/short-term/handoffs/YYYY-MM-DD-topic.md`
5. Score the session (1-10) → append to `memory-os/self-improvement/scores.md`
6. If score < 7, add improvement to `memory-os/self-improvement/improvement-plan.md`
7. If cross-project discovery → update `~/.agent-memory/long-term/environment.md` or relevant global file
8. Briefly confirm: "Session logged. Memory updated."

### 🔵 USER CORRECTION (triggers when user corrects Claude's work)
Keywords: "no", "wrong", "that's not right", "actually", "I said", "not what I asked", "fix this", "you missed", "incorrect"
1. Log correction to `memory-os/self-improvement/feedback-log.md`
2. If it's a repeatable mistake → add to `memory-os/long-term/mistakes.md`
3. Apply the correction immediately
4. Do NOT narrate the logging. Just do it silently.

### 🟡 NEW DECISION (triggers when an architecture or business decision is made)
Keywords: "let's go with", "we'll use", "decision:", "I've decided", "the approach is", "we're going with", "approved", "let's do it this way"
1. Log to `memory-os/long-term/decisions.md` using the standard format
2. Briefly confirm: "Decision logged to memory."

### 🟣 NEW PATTERN (triggers when a working solution is found)
Keywords: "this works", "good pattern", "keep doing this", "remember this approach", "this is how we", "that fixed it"
1. Log to `memory-os/long-term/patterns.md`
2. Silently. No narration needed.

### 🔶 BUG FOUND (triggers alongside systematic-debugging skill)
When any bug, error, or unexpected behavior is encountered:
1. After fix is confirmed, log to `memory-os/long-term/mistakes.md`
2. Include root cause and prevention steps
3. This works WITH `superpowers:systematic-debugging`, not instead of it

### ✅ TASK COMPLETE (triggers alongside verification-before-completion skill)
When any significant task is finished:
1. Score the output (1-10) → append to `memory-os/self-improvement/scores.md`
2. If a new pattern was found → add to `memory-os/long-term/patterns.md`
3. Update `memory-os/short-term/active-tasks.md` to reflect completion
4. This works WITH `superpowers:verification-before-completion`, not instead of it

## SILENT BY DEFAULT

Memory OS operates silently. It reads and writes memory files in the background without narrating what it's doing. The only times it speaks up:
- Session end: "Session logged. Memory updated."
- New decision: "Decision logged to memory."
- When asked: "What's in memory?" → summarize relevant files

## INTEGRATION WITH EXISTING SKILLS

Memory OS is NOT a replacement for any existing skill. It's a WRAPPER:
- Fires BEFORE Stage 1 (session start reads)
- Fires AFTER Stage 6 (compound learnings feed into memory)
- Fires ALONGSIDE debugging, verification, and completion skills

## FILE LOCATIONS

### Global Tier (~/.agent-memory/)
```
~/.agent-memory/
├── GLOBAL_CONTEXT.md
├── README.md
├── long-term/
│   ├── environment.md
│   ├── decisions.md
│   ├── patterns.md
│   ├── mistakes.md
│   └── learning.md
├── short-term/
│   ├── active-context.md
│   └── handoffs/
└── self-improvement/
    ├── scores.md
    └── improvement-plan.md
```

### Project Tier (memory-os/)
```
memory-os/
├── README.md                       ← Protocol for both agents
├── long-term/
│   ├── decisions.md
│   ├── patterns.md
│   ├── mistakes.md
│   ├── client-context.md
│   └── agent-context.md            ← What agents have learned
├── short-term/
│   ├── active-tasks.md
│   ├── blockers.md
│   ├── session-notes.md
│   └── handoffs/                   ← Agent-to-agent handoffs
│       └── YYYY-MM-DD-topic.md
└── self-improvement/
    ├── scores.md
    ├── feedback-log.md
    └── improvement-plan.md
```

## HANDOFF FORMAT (when writing to Hermes Agent)

```markdown
# Handoff: Topic
**From:** Claude Code
**To:** Hermes Agent
**Date:** YYYY-MM-DD

## What Was Done
## Key Findings / Decisions
## Current State
## Next Steps
```

Save to: `memory-os/short-term/handoffs/YYYY-MM-DD-topic.md`
