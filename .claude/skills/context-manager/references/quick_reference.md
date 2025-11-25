# Context Management Quick Reference

## Token Budget at a Glance

```
Total Budget: ~190,000 tokens
├── System/Skills: ~40,000 tokens (21%)
├── Conversation: ~30,000 tokens (16%)
└── Available: ~120,000 tokens (63%)
```

## File Size Quick Guide

| Size | Lines | Tokens | Action |
|------|-------|--------|--------|
| Small | <200 | <1.5K | Load freely |
| Medium | 200-500 | 1.5-4K | Load when needed |
| Large | 500-1000 | 4-8K | Use line ranges |
| Very Large | >1000 | >8K | Split or summarize |

## Essential Commands

### Analyze Token Usage
```bash
python scripts/analyze_tokens.py .
python scripts/analyze_tokens.py /path/to/project
python scripts/analyze_tokens.py file.py --json
```

### View Files Efficiently
```python
# Full file (small files only)
view("config.py")

# With line range (large files)
view("api.py", view_range=[100, 200])

# Directory structure
view("src/")
```

## Query Patterns Cheat Sheet

### ✅ DO: Targeted Queries
```
"Update the timeout in config.py line 45"
"Show me the login function in auth.py"
"Fix the validation bug in user.py lines 120-135"
```

### ❌ DON'T: Vague Queries
```
"Help me with this project"
"Load everything and tell me what it does"
"Show me all the code"
```

## Context Budget Rules of Thumb

### Green Zone (<70% usage)
- Normal operation
- Load files as needed
- Multi-file coordination OK

### Yellow Zone (70-85% usage)
- Be selective with file loading
- Use line ranges for large files
- Consider starting fresh for new features

### Red Zone (>85% usage)
- Load only essential files
- Use view ranges extensively
- Start new session for complex tasks

## Quick Optimization Checklist

- [ ] Exclude node_modules, .venv, .git
- [ ] Use line ranges for files >500 lines
- [ ] Load files one at a time when possible
- [ ] Avoid verbose bash command output
- [ ] Split files >1000 lines if frequently used
- [ ] Request specific functions, not entire files
- [ ] Start new session when context feels "heavy"

## Common File Patterns

### Configuration Files
```bash
✅ "Update timeout in config.py to 30"
❌ "Load config.py and let me see everything"
```

### Large API Files
```bash
✅ "Show me the login route handler in api.py"
❌ "Load the entire api.py file"
```

### Test Files
```bash
✅ "Update the authentication test to handle new validation"
❌ "Load all test files so I can understand the test coverage"
```

## Context Reset Indicators

Start a new session when:
- Claude asks for previously loaded files
- Responses become generic
- Performance noticeably degrades
- You're switching to a new feature/module
- Token budget >85% for >5 messages

## File Organization Tips

### Good Structure (Context-Friendly)
```
src/
├── core/          # Core logic (500 lines total)
│   ├── auth.py    # 150 lines
│   ├── user.py    # 200 lines
│   └── db.py      # 150 lines
├── api/           # Routes (300 lines total)
└── utils/         # Helpers (200 lines total)
```

### Poor Structure (Context-Heavy)
```
src/
├── main.py        # 3000 lines (everything)
└── utils.py       # 2000 lines (all helpers)
```

## One-Liner Strategies

| Situation | Strategy |
|-----------|----------|
| Bug fix | "Fix bug in file.py line X" |
| Feature add | "Add function to module.py following existing patterns" |
| Refactor | "Refactor function X in file.py to use Y pattern" |
| Review | "Review file.py for potential issues" |
| Documentation | "Add docstrings to file.py" |

## Bash Output Management

```bash
# Heavy Output ❌
npm install
pip install package
git log

# Light Output ✅
npm install --silent
pip install package -q
git log --oneline -10
```

## Progressive Loading Pattern

```
1. Structure: "Show me the project structure"
2. Module: "Show me the auth module files"
3. Specific: "Load auth.py"
4. Targeted: "Show me lines 100-150 where the bug is"
5. Fix: "Update line 120 to fix the validation"
```

## Emergency Recovery

### Context Overflow Recovery
```bash
# Step 1: Acknowledge
"I'm near context limit, let's start fresh"

# Step 2: Summarize
"What have we accomplished so far?"

# Step 3: New Session
"I need to continue working on [feature]. Load only [file1, file2]"
```

## Skills Impact

| Skill Type | Token Cost | Usage Tip |
|------------|------------|-----------|
| Simple | ~2-5K | Use freely |
| Medium | ~5-15K | Use when needed |
| Complex | ~15-30K | Use sparingly |

## Memory Aids

Create a project context file:
```yaml
# .context-notes.md
## Context Strategy
- Work on one module at a time
- auth.py is 800 lines - use line ranges
- Exclude test fixtures (large)
- Load models individually, not as directory
```

## Quick Wins

1. **Add to .gitignore-style file**: Create `.claudeignore`
2. **Split large files**: Target >1000 lines
3. **Use view ranges**: For any file >500 lines
4. **Start specific**: Never "help me with this project"
5. **Clean queries**: Suppress verbose output
6. **Regular resets**: New session for new features

## Token Math

```
4 chars = ~1 token (English text)
3 chars = ~1 token (Code)

Example:
- 1000 line file (80 chars/line) = 80,000 chars = ~20,000 tokens
- Uses ~10.5% of total budget!
```

## Best Practices Summary

| Principle | Action |
|-----------|--------|
| **Minimize** | Load only what's needed |
| **Target** | Use specific line ranges |
| **Sequence** | One file/task at a time |
| **Monitor** | Run token analysis regularly |
| **Reset** | Start fresh when heavy |
| **Structure** | Organize for selective loading |
| **Document** | Create context guides |
| **Exclude** | Ignore generated/vendor files |
