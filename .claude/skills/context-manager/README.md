# Context Manager Skill for Claude Code

A comprehensive skill for managing context window and token usage in Claude Code sessions.

## What This Skill Does

The Context Manager skill helps you:
- **Analyze token usage** across your codebase with an automated script
- **Optimize file loading** with proven patterns and strategies
- **Manage context budget** effectively to avoid hitting limits
- **Work efficiently** with large codebases in Claude Code
- **Follow best practices** for query optimization and file organization

## Installation

1. Download the `context-manager.skill` file
2. In Claude Code, run:
   ```bash
   claude code skills add context-manager.skill
   ```
3. The skill will be available in your Claude Code sessions

## Quick Start

### Check Your Token Usage

After installation, navigate to any project directory and run:

```bash
python ~/.claude/skills/context-manager/scripts/analyze_tokens.py .
```

This will show you:
- Total estimated tokens in your codebase
- Budget usage percentage
- Largest files (by token count)
- Optimization recommendations

### Use Better Query Patterns

Instead of:
```
"Help me with this project"
"Load all the code"
```

Use targeted queries:
```
"Update the timeout in config.py line 45 to 30 seconds"
"Show me the login function in auth.py"
"Load auth.py and show me lines 100-150"
```

### Set Up Your Project

1. **Copy the .claudeignore template:**
   ```bash
   cp ~/.claude/skills/context-manager/assets/claudeignore-template.txt .claudeignore
   ```
   Edit this file to add project-specific exclusions.

2. **Create context notes** (optional but recommended):
   Create a `.context-notes.md` in your project root with:
   - List of large files (use line ranges)
   - Context-heavy directories to exclude
   - Loading strategy for your project

## What's Included

### 📊 Token Analysis Script
- `scripts/analyze_tokens.py` - Estimates token usage and provides recommendations

### 📚 Comprehensive References
- `references/optimization_strategies.md` - Deep dive into context optimization
- `references/claude_code_specifics.md` - Claude Code-specific best practices
- `references/quick_reference.md` - Quick reference cheat sheet

### 🛠️ Templates
- `assets/claudeignore-template.txt` - Template for excluding files from context

## Key Concepts

### Token Budget
Claude Code has ~190,000 tokens available. This includes:
- System prompts & skills: ~40K tokens
- Conversation history: ~30K tokens
- Your files: ~120K tokens available

### File Size Guidelines
- **Small (<1K tokens)**: Load freely
- **Medium (1-5K tokens)**: Load when needed
- **Large (5-20K tokens)**: Use line ranges
- **Very Large (>20K tokens)**: Split or load sections

### Budget Zones
- **Green (<70%)**: Normal operation
- **Yellow (70-85%)**: Be selective
- **Red (>85%)**: Load essentials only

## Common Use Cases

### Working with Large Codebases
```bash
# Analyze the codebase first
python scripts/analyze_tokens.py .

# Then work on one module at a time
"Show me files in the auth module"
"Load auth.py and show me the login function"
```

### Refactoring Large Files
```bash
# Use line ranges to work in sections
"Show me lines 1-100 of api.py"
"Update lines 45-50 to use the new pattern"
"Now show me lines 100-200"
```

### Debugging Issues
```bash
# Load only relevant files
"What file contains the user validation logic?"
"Show me just the validate_user function"
"Update line 67 to fix the validation bug"
```

## When Claude Will Use This Skill

The skill is automatically triggered when:
- Working with large codebases
- Context management is needed
- You mention token usage or context limits
- File organization or query optimization is relevant

You can also explicitly trigger it:
```
"Use the context manager skill to analyze my project"
"Show me best practices for context management"
```

## Tips for Success

1. **Run token analysis regularly** - Especially when starting work on a new codebase
2. **Use targeted queries** - Be specific about what files and lines you need
3. **Load files progressively** - Don't load everything at once
4. **Use line ranges** - For any file over 500 lines
5. **Start fresh when needed** - If context feels heavy, start a new session
6. **Organize your code** - Structure projects for selective loading
7. **Exclude appropriately** - Use .claudeignore for vendor code and large files

## Troubleshooting

### "I'm hitting context limits"
1. Run the token analysis script
2. Use line ranges for large files
3. Load fewer files at once
4. Start a new session if needed

### "Claude is asking for files I already loaded"
This indicates context overflow. Start a new session with only essential files.

### "The analysis script isn't working"
Make sure you're running it from a directory with files, and that you have Python 3 installed.

## Learn More

After installation, the skill will be available to Claude Code. You can:
- Ask Claude to explain any concept from the skill
- Request specific optimization strategies
- Get help with context management for your specific project

The skill includes extensive documentation in the `references/` directory that Claude can access as needed.

## Example Session

```bash
# 1. Analyze your project
python ~/.claude/skills/context-manager/scripts/analyze_tokens.py .

# 2. Work efficiently
"Show me the structure of src/"
"Load src/api.py and show me lines 100-150"
"Update line 120 to add error handling"

# 3. Check usage periodically
python ~/.claude/skills/context-manager/scripts/analyze_tokens.py .
```

## Support

For issues or questions:
- Ask Claude directly - it has full access to the skill documentation
- Check the reference files for detailed information
- Review the troubleshooting section in SKILL.md

---

**Version**: 1.0  
**Created for**: Claude Code context and token management  
**License**: See LICENSE.txt in the skill package
