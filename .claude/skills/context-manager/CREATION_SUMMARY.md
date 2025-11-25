# Context Manager Skill - Creation Summary

## What Was Created

I've built a comprehensive skill for managing context and token usage in Claude Code. This addresses a common challenge when working with large codebases: efficiently managing the ~190,000 token context budget.

## Skill Components

### 📄 Main Skill File (SKILL.md)
- Overview of context management principles
- Quick start guide for analyzing token usage
- Progressive file loading patterns
- Best practices for queries and file organization
- Troubleshooting common issues
- Integration with development workflows

### 🔧 Scripts (scripts/)

**analyze_tokens.py**
- Estimates token usage for files and directories
- Provides budget utilization statistics
- Identifies largest files by token count
- Gives optimization recommendations
- Supports JSON output for automation
- Includes exclude patterns for node_modules, venv, etc.

Key features:
- Recursive directory analysis
- Character-based token estimation (~4 chars per token)
- Top 10 largest files report
- Usage percentage and remaining tokens
- Warning thresholds (>70%, >85%)

### 📚 Reference Documentation (references/)

**optimization_strategies.md** (1,566 tokens)
- Deep dive into context optimization techniques
- File loading best practices
- Directory structure optimization
- Managing large codebases
- Context-aware development workflows
- Real-time monitoring strategies
- File splitting techniques
- Advanced optimization methods

**claude_code_specifics.md** (2,237 tokens)
- Claude Code architecture and token distribution
- Effective query patterns
- View tool best practices
- File creation strategies
- String replace best practices
- Bash command optimization
- Long session management
- Project-specific context files
- Skill usage optimization
- Memory vs context usage

**quick_reference.md** (1,387 tokens)
- Token budget at a glance
- File size quick guide
- Essential commands cheat sheet
- Query patterns (do's and don'ts)
- Context budget rules of thumb
- Quick optimization checklist
- Common file patterns
- Context reset indicators
- File organization tips
- One-liner strategies
- Emergency recovery procedures

### 🎨 Assets (assets/)

**claudeignore-template.txt**
- Template file for excluding context-heavy directories
- Pre-configured patterns for:
  - Dependencies (node_modules, venv, vendor)
  - Build outputs (dist, build, .next)
  - Version control (.git, .svn)
  - Logs and cache files
  - IDE and editor files
  - Media and data files
  - Compiled assets
- Easy to customize for project-specific needs

## Key Features

### 1. Token Analysis
- Automated script to estimate token usage
- Identifies context-heavy files
- Provides actionable recommendations
- Supports custom budgets and filtering

### 2. Best Practices
- Progressive file loading patterns
- Targeted query strategies
- Line range usage for large files
- Context-efficient bash commands

### 3. Comprehensive Documentation
- Quick reference for common scenarios
- Detailed strategies for optimization
- Claude Code-specific techniques
- Troubleshooting guides

### 4. Project Setup Templates
- .claudeignore template for exclusions
- Context notes guidelines
- File organization recommendations

## How It Solves Problems

### Problem 1: Context Overflow
**Before:** Loading entire directories, hitting limits frequently
**After:** Strategic loading with token analysis, rare overflows

### Problem 2: Unclear Token Usage
**Before:** No visibility into what's consuming tokens
**After:** Clear reports showing token usage by file

### Problem 3: Inefficient Queries
**Before:** "Help me with this project" → loads everything
**After:** "Update timeout in config.py line 45" → targeted

### Problem 4: Large File Management
**Before:** Loading 2000-line files entirely
**After:** Using line ranges to load 50-100 lines at a time

### Problem 5: Session Management
**Before:** Unclear when to reset sessions
**After:** Clear guidelines based on usage zones (Green/Yellow/Red)

## Usage Workflow

### Initial Setup (One-time)
1. Install skill: `claude code skills add context-manager.skill`
2. Copy .claudeignore template to project
3. Customize exclusions for project
4. Optional: Create .context-notes.md

### Daily Usage
1. Run token analysis at session start
2. Use targeted queries throughout work
3. Monitor context usage periodically
4. Reset session if entering red zone (>85%)

### Project Optimization
1. Analyze token usage to find bottlenecks
2. Split files >1000 lines if frequently used
3. Structure code for selective loading
4. Document context strategy for team

## Token Efficiency

The skill itself is efficient:
- Total skill content: ~9,651 tokens (~5% of budget)
- Main SKILL.md: 2,545 tokens (always loaded when triggered)
- References: 5,190 tokens (loaded as needed)
- Script: 1,516 tokens (executed, not loaded)
- Asset: 400 tokens (copied, not loaded)

## Technical Highlights

### Smart Token Estimation
Uses character-based heuristic:
- Plain text: ~4 chars/token
- Code: ~3-4 chars/token
- Accounts for different content types

### Flexible Analysis
- Single file or entire directory
- Recursive scanning with exclusions
- JSON output for automation
- Customizable budget comparison

### Progressive Disclosure
Follows skill best practices:
- Lean SKILL.md with overview
- Detailed strategies in references
- Claude loads references as needed
- Minimizes unnecessary context usage

## Files Included

```
context-manager/
├── SKILL.md (2,545 tokens)
├── scripts/
│   └── analyze_tokens.py (1,516 tokens)
├── references/
│   ├── optimization_strategies.md (1,566 tokens)
│   ├── claude_code_specifics.md (2,237 tokens)
│   └── quick_reference.md (1,387 tokens)
└── assets/
    └── claudeignore-template.txt (400 tokens)
```

## Delivery Files

1. **context-manager.skill** - The packaged skill file ready for installation
2. **README.md** - Comprehensive installation and usage guide
3. **QUICK_START.md** - Visual quick start guide with immediate actions

## Installation Instructions

```bash
# Install the skill
claude code skills add context-manager.skill

# Run token analysis on any project
cd your-project
python ~/.claude/skills/context-manager/scripts/analyze_tokens.py .

# Set up exclusions
cp ~/.claude/skills/context-manager/assets/claudeignore-template.txt .claudeignore
```

## Example Output

When running the analysis script:

```
======================================================================
TOKEN USAGE ANALYSIS
======================================================================

Total files analyzed: 47
Total estimated tokens: 45,234
Token budget: 190,000
Usage: 23.8%
Remaining: 144,766 tokens

----------------------------------------------------------------------
TOP 10 LARGEST FILES
----------------------------------------------------------------------
Tokens     Lines    Size       Path
----------------------------------------------------------------------
15,234     2,890    59.2KB     src/api/main.py
8,456      1,234    32.8KB     src/models/user.py
...

----------------------------------------------------------------------
RECOMMENDATIONS
----------------------------------------------------------------------

📊 3 files exceed 5,000 tokens:
   Consider splitting or summarizing these files
   - src/api/main.py (15,234 tokens)
   - src/models/user.py (8,456 tokens)
   - src/legacy/old_api.py (6,789 tokens)

======================================================================
```

## Future Enhancement Ideas

While the skill is comprehensive, here are potential additions:
1. Integration with git to analyze only changed files
2. Historical tracking of token usage over time
3. Team usage reports and sharing
4. IDE integration for real-time token monitoring
5. Auto-generated context strategies based on project structure

## Success Metrics

The skill is successful if it helps you:
- ✅ Spend less time managing context manually
- ✅ Have fewer session resets due to overflow
- ✅ Work more efficiently with large codebases
- ✅ Understand token usage clearly
- ✅ Make better decisions about file loading

## Summary

This skill provides everything needed to master context management in Claude Code:
- Automated analysis tools
- Comprehensive best practices
- Practical examples and patterns
- Templates and references
- Clear guidelines and metrics

It transforms context management from a frustrating limitation into a strategic advantage, allowing you to work more effectively with Claude Code on projects of any size.
