# Context Manager Skill - Quick Start Guide

## 📥 Installation

```bash
claude code skills add context-manager.skill
```

## 🎯 What Problem Does This Solve?

Claude Code has a context budget of **~190,000 tokens**. Loading large codebases or too many files can:
- Cause context overflow
- Lead to incomplete responses  
- Require frequent session resets
- Reduce performance

This skill helps you **work smarter, not harder** by managing context efficiently.

## 🚀 Immediate Actions

### 1. Analyze Your Codebase (2 minutes)

```bash
cd your-project
python ~/.claude/skills/context-manager/scripts/analyze_tokens.py .
```

**You'll see:**
```
Total estimated tokens: 45,000
Token budget: 190,000
Usage: 23.7%
Remaining: 145,000 tokens

TOP 10 LARGEST FILES
Tokens     Lines    Size       Path
----------------------------------------------------------------------
15,234     2,890    59.2KB     src/api/main.py
8,456      1,234    32.8KB     src/models/user.py
...
```

### 2. Set Up Exclusions (1 minute)

```bash
cp ~/.claude/skills/context-manager/assets/claudeignore-template.txt .claudeignore
```

Edit `.claudeignore` to exclude:
- `node_modules/`, `venv/`, `.git/`
- Large data files
- Generated code
- Vendor libraries

### 3. Change How You Query (Immediate)

**❌ Before:**
```
"Help me understand this codebase"
"Load all the Python files"
"Show me everything in src/"
```

**✅ After:**
```
"Show me the structure of src/"
"Load src/api.py and show me lines 100-150"
"Update the timeout in config.py line 45 to 30"
```

## 📊 Token Budget Cheat Sheet

| File Size | Lines | Tokens | What to Do |
|-----------|-------|--------|------------|
| Small | <200 | <1.5K | ✅ Load freely |
| Medium | 200-500 | 1.5-4K | ⚠️ Load when needed |
| Large | 500-1K | 4-8K | ⚠️ Use line ranges |
| Huge | >1K | >8K | 🔴 Split or section-load |

## 🎨 Context Budget Zones

```
Green Zone (<70% usage)
├─ Normal operation
├─ Load files as needed
└─ Multi-file work OK

Yellow Zone (70-85% usage)
├─ Be selective with files
├─ Use line ranges
└─ Consider context impact

Red Zone (>85% usage)
├─ Load essentials only
├─ Use view ranges extensively
└─ Start fresh session soon
```

## 🔥 Top 5 Quick Wins

### 1. Progressive Loading Pattern
```
Step 1: "Show me the project structure"
Step 2: "Show me files in the auth module"
Step 3: "Load auth.py"
Step 4: "Show me lines 100-150 where the bug is"
Step 5: "Update line 120 to fix the validation"
```

### 2. Use Line Ranges for Large Files
```python
# Instead of loading the entire file
view("src/api.py")  # ❌ Loads all 2000 lines

# Load only what you need
view("src/api.py", view_range=[100, 200])  # ✅ 100 lines only
```

### 3. Suppress Verbose Bash Output
```bash
# Heavy output ❌
npm install
git log

# Optimized ✅
npm install --silent
git log --oneline -10
```

### 4. Work on One Module at a Time
```
Session 1: Auth module (auth.py, validators.py)
Session 2: API routes (routes.py, handlers.py)
Session 3: Database layer (models.py, db.py)
```

### 5. Create a .context-notes.md File
```markdown
## Context Strategy

### Large Files (Use Line Ranges)
- `src/api.py` (2000 lines)
- `src/legacy.py` (1500 lines)

### Exclude from Loading
- `data/` - Large datasets
- `tests/fixtures/` - Test data

### Loading Order
1. Load config first
2. Then models
3. Finally API routes
```

## 🎯 Common Scenarios

### Bug Fixing
```
Query: "What file contains the login validation?"
Then: "Show me the validate_login function"
Then: "Update line 89 to add email validation"
```

### Feature Development
```
Query: "Show me an example API route handler"
Then: "Create a new /users endpoint following that pattern"
```

### Refactoring
```
Query: "Load user.py"
Then: "Refactor the User class to use dataclasses"
Then: [Next file] "Load auth.py"
```

### Code Review
```
Query: "Review auth.py for security issues (lines 1-100)"
Then: "Now review lines 100-200"
[Continue in sections]
```

## ⚠️ Warning Signs You're Near Limits

1. Claude asks to see files you already loaded
2. Responses become generic or incomplete
3. Performance noticeably slows down
4. Token analysis shows >85% usage

**Solution:** Start a new session with only essential files.

## 📚 Reference Files (Claude Can Access)

The skill includes comprehensive documentation:

- **optimization_strategies.md** - Deep dive into techniques
- **claude_code_specifics.md** - Claude Code best practices  
- **quick_reference.md** - Command cheat sheet

Ask Claude: "Show me the optimization strategies from context-manager"

## 🔧 Advanced Usage

### Analyze Specific Paths
```bash
python scripts/analyze_tokens.py src/api/
python scripts/analyze_tokens.py src/models/user.py
```

### Custom Token Budget
```bash
python scripts/analyze_tokens.py . --budget 150000
```

### JSON Output for Scripts
```bash
python scripts/analyze_tokens.py . --json > analysis.json
```

### Exclude Additional Patterns
```bash
python scripts/analyze_tokens.py . --exclude build dist temp
```

## 💡 Pro Tips

1. **Run analysis at the start** of each work session
2. **Use explicit file names** in your queries
3. **Split files >1000 lines** if you work on them often
4. **Document your context strategy** in the project
5. **Reset sessions** when switching to new features
6. **Create project-specific** .claudeignore files
7. **Load dependencies** only when actually needed
8. **Use comments in code** for context instead of conversation
9. **Test the script** on your projects to find bottlenecks
10. **Share findings** with your team

## 📈 Measure Your Success

### Before Context Manager
- Random file loading
- Frequent context overflows
- Multiple session resets per task
- Unclear what's using tokens

### After Context Manager  
- Strategic file loading
- Rare context issues
- Longer productive sessions
- Clear token visibility

## 🎓 Learning Path

**Day 1:** Run token analysis, set up .claudeignore
**Day 2:** Practice targeted queries
**Week 1:** Adopt progressive loading pattern
**Week 2:** Optimize project structure
**Month 1:** Master context management

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Context overflow | Run token analysis, start fresh |
| Slow responses | Check usage, reduce loaded files |
| Repeated file requests | Session reset needed |
| Script not found | Check installation path |
| Large file needed | Use line ranges: view(path, [start, end]) |

## 📞 Need Help?

Just ask Claude:
- "Explain the progressive loading pattern"
- "How do I optimize this project for context?"
- "Show me examples of good queries"
- "What's the best way to work with large files?"

Claude has full access to all skill documentation and can help with specific scenarios.

---

**Remember:** Context management is about **precision over volume**. Load less, achieve more! 🎯
