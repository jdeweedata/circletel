# Claude Code Context Management

## Claude Code Architecture

Claude Code runs in a stateful session where:
- Context persists across commands
- Files stay loaded until explicitly removed
- Tool outputs accumulate in context
- Token budget is shared across all operations

## Token Budget Breakdown

**Total: ~190,000 tokens**

Typical distribution:
- System prompts: ~30,000 tokens (16%)
- Skills (metadata + loaded): ~10,000-40,000 tokens (5-21%)
- Conversation history: ~20,000-60,000 tokens (10-32%)
- File contents: Variable (remaining budget)
- Tool outputs: ~5,000-15,000 tokens (3-8%)

## Effective Query Patterns

### Pattern: Minimal Initial Context
```bash
# Good: Focused query
"Fix the authentication bug in user login"

# Bad: Open-ended query
"Help me with this codebase"
```

### Pattern: Progressive Disclosure
```bash
# Step 1: Overview
"What are the main components of this project?"

# Step 2: Targeted
"Show me the database module"

# Step 3: Specific
"Update the connection pool size in db/config.py"
```

### Pattern: Explicit File Requests
```bash
# Good: Explicit
"Load src/auth.py and src/utils.py"

# Bad: Implicit
"I need to work on authentication"
```

## View Tool Best Practices

### Full File View
```python
# When file is small (<500 lines)
view("src/config.py", "Check configuration settings")
```

### Partial View with Line Ranges
```python
# When file is large
view("src/api.py", "Check login handler", view_range=[100, 150])
view("src/database.py", "See connection logic", view_range=[1, 50])
```

### Directory Structure
```python
# Get overview without loading contents
view("src/", "Understand project structure")
```

## File Creation Strategies

### Small Files (Direct Creation)
For files under 100 lines, create directly:
```python
create_file(
    "Create new utility function",
    "src/utils/helper.py",
    """def helper_function():
    pass"""
)
```

### Large Files (Iterative Building)
For files over 100 lines, build iteratively:
1. Create with structure/outline
2. Fill in sections using str_replace
3. Test incrementally

## String Replace Best Practices

### Precise Replacements
```python
# Good: Unique string match
str_replace(
    "Update timeout value",
    "src/config.py",
    old_str="TIMEOUT = 10",
    new_str="TIMEOUT = 30"
)

# Bad: Ambiguous match
str_replace(
    "Update timeout",
    "src/config.py",
    old_str="10",  # May match multiple places
    new_str="30"
)
```

### Multi-line Replacements
Include enough context to make the match unique:
```python
str_replace(
    "Update function signature",
    "src/api.py",
    old_str="""def login(username, password):
    # Basic login
    return authenticate(username, password)""",
    new_str="""def login(username: str, password: str, remember_me: bool = False):
    # Enhanced login with type hints
    return authenticate(username, password, remember_me)"""
)
```

## Bash Tool Context Impact

### Commands Generate Output
Every bash command output is added to context:
```bash
# Heavy output commands
ls -R /project  # Generates large directory listing
cat large_file.txt  # Loads entire file into context
find . -type f  # Lists all files

# Lighter alternatives
ls /project  # Just top level
head large_file.txt  # First 10 lines
find . -type f -maxdepth 2  # Limited depth
```

### Use Output Redirection
```bash
# Bad: Large output in context
npm install  # Verbose package installation output

# Good: Suppress unnecessary output
npm install > /dev/null 2>&1
npm install --silent
```

### Pipe to Essential Information
```bash
# Instead of full output
git log

# Get summary
git log --oneline -10

# Count only
git log --oneline | wc -l
```

## Managing Long Sessions

### Symptoms of Context Overflow
- Claude asks to see files already loaded
- Responses become generic or incomplete
- Claude mentions being near limits
- Performance degradation

### Recovery Strategies

**Option 1: Context Reset**
Start a new session, loading only essential context.

**Option 2: Explicit Cleanup**
Request Claude to forget specific information:
```bash
"You can forget the test files we looked at earlier, I only need the main source files now"
```

**Option 3: Summarize and Continue**
```bash
"Summarize what we've accomplished, then let's start fresh focusing just on the API layer"
```

## Project-Specific Context Files

### Create a .claudecontext File
Document key information for Claude:

```yaml
# .claudecontext
project: MyApp
description: E-commerce platform with microservices

key_files:
  - src/api/routes.py: Main API routes
  - src/models/: Database models
  - src/services/: Business logic

context_strategy:
  - Load routes.py for API changes
  - Load specific model files as needed
  - Avoid loading entire services/ at once

exclude_patterns:
  - node_modules
  - dist
  - coverage
  - "*.log"
```

### Project README for Context
Include a context section in README:

```markdown
## Claude Code Usage

### Key Entry Points
- `src/api/app.py` - Main application
- `src/routes/` - API endpoints
- `src/models/` - Data models

### Large Files (Use Line Ranges)
- `src/legacy/old_api.py` (2000+ lines)
- `src/utils/helpers.py` (1500+ lines)

### Context Budget Tips
- Work on one module at a time
- Use view ranges for files >500 lines
- Exclude test fixtures from initial load
```

## Skill Usage Optimization

### Skills Add to Context
When skills are triggered:
- Skill metadata is always in context (~100 words each)
- Skill body loads when triggered (~2-5K tokens)
- Skill references load when needed (~5-20K tokens)

### Optimize Skill Usage
```bash
# Good: Specific skill trigger
"Create a Word document with the analysis"  # Loads docx skill

# Bad: Vague request loading unnecessary skills
"Help me with this project"  # May load multiple skills
```

## Working with Multiple Files

### Sequential Processing
```bash
# Process files one at a time
1. "Update auth.py to add new validation"
2. "Now update api.py to use the new validation"
3. "Finally update tests.py with new test cases"
```

### Batch Processing (When Needed)
```bash
# Load multiple related files for coordinated changes
"Load auth.py, api.py, and models.py - I need to refactor the authentication flow across these files"
```

### Coordinate Changes Reference
If coordination is needed:
1. Create a plan first (minimal context)
2. Load files in order of dependency
3. Make changes incrementally
4. Verify each step before proceeding

## Memory vs Context

### Claude's Memory System
- Remembers facts across conversations
- Does not count against context budget
- Updates periodically

### Use Memory For
- User preferences
- Project conventions
- Recurring patterns
- Personal context

### Use Active Context For
- Current file contents
- Active task details
- Immediate work

## Performance Optimization Tips

### Tip 1: Front-Load Structure
```bash
# Start with structure
"Show me the directory structure and explain the architecture"

# Then work specifically
"Now update the authentication module"
```

### Tip 2: Use Code Comments
Add context in code rather than conversation:
```python
# CONTEXT: This function is called by the auth middleware
# and validates JWT tokens from the Authorization header
def validate_token(token: str) -> bool:
    pass
```

### Tip 3: Leverage External Tools
```bash
# Instead of asking Claude to analyze
"What's the complexity of this function?"

# Use external tools when appropriate
pip install radon
radon cc src/ -a
```

### Tip 4: Cache-Friendly Queries
Repeat queries exactly for cached responses:
```bash
# First query (processes and caches)
"Show me the structure of src/"

# Later (may use cache)
"Show me the structure of src/"
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: The Full Dump
```bash
❌ "Load all the Python files and tell me what this project does"
✅ "What does this project do based on the README and main.py?"
```

### Anti-Pattern 2: Recursive Exploration
```bash
❌ "Show me file X. Now show me what it imports. Now show me what those import..."
✅ "Trace the dependency chain from X to Y and show me only the relevant functions"
```

### Anti-Pattern 3: Redundant Loading
```bash
❌ Asking about the same file multiple times in different ways
✅ "I know we loaded auth.py earlier, I need to update the login function specifically"
```

### Anti-Pattern 4: Context Pollution
```bash
❌ Running verbose commands without output control
✅ Using --quiet, > /dev/null, or specific formatters
```

## Emergency Context Management

### When You Hit Limits
1. **Acknowledge**: "I'm near the context limit"
2. **Prioritize**: Identify essential files only
3. **Reset**: Start new session if needed
4. **Document**: Save progress before resetting

### Starting Fresh
```bash
# Summarize current state
"Summarize our progress on the authentication feature"

# Start new session
# Load only essential context
"I'm working on authentication. I need auth.py and api.py loaded"
```
