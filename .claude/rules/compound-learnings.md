Rule: compound-learnings
Loaded by: CLAUDE.md
Scope: Continuous learning capture, RSI (Recursive Self-Improvement), pattern extraction

---

## LEARN Stage (Stage 6 of Pipeline)

After SHIP, capture learnings to accelerate future work. This is MANDATORY when triggers are met.

## Mandatory Triggers

Invoke `/compound` or `compound:compound` skill when ANY of these apply:

| Trigger | Why |
|---------|-----|
| Task took >30 minutes | Likely has friction points worth documenting |
| Discovered reusable pattern | Save 30+ minutes on future similar work |
| Debugged tricky issue | Prevent repeating the same investigation |
| Got corrected by user | RSI — update rules to prevent same mistake |
| Multi-file change completed | Capture architectural decisions |
| New integration added | Document gotchas and parameter formats |

## Quick Commands

```bash
/compound                          # Capture session learnings
/compound "topic"                  # Focused capture
/correction                        # After being corrected by user
/correction "specific learning"    # With context
```

## What to Capture

### DO Capture
- Solutions that took >30 min to find
- Patterns used 2+ times
- CircleTel-specific gotchas
- API parameter formats (especially Wrong vs Correct)
- Architectural decisions and rationale

### DON'T Capture
- Obvious things in external docs
- One-off fixes unlikely to recur
- Temporary workarounds (capture proper fix instead)

## File Structure

```
.claude/skills/compound-learnings/
├── learnings/
│   ├── YYYY-MM-DD_topic.md        # Session learnings
│   └── patterns/                   # Reusable patterns
├── corrections/                    # RSI corrections
├── extracted-rules/                # Rules from corrections
└── templates/                      # Templates for entries
```

## RSI: Learning from Corrections

When user corrects you:

1. **Detect** — Watch for "No, actually...", "That's wrong", "Instead..."
2. **Capture** — Use `/correction` to document
3. **Extract rule** — Synthesize actionable rule
4. **Update skill/rule** — Apply to prevent recurrence

## Integration with Memory

After capturing learnings, key insights go to:
- `MEMORY.md` — Cross-session quick reference
- `.claude/rules/*.md` — If pattern becomes a rule
- `extracted-rules/` — If derived from correction

## Verification

Before ending a significant session, check:

- [ ] Any friction points worth documenting?
- [ ] Any patterns I'll use again?
- [ ] Any corrections received this session?
- [ ] Any API/schema gotchas discovered?

If yes to any, run `/compound`.

---

**Philosophy**: Don't just ship code — ship knowledge. Every task is an investment in future velocity.
