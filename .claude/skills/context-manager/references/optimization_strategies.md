# Context Optimization Strategies

## Understanding Context Budget

Claude Code has a context window of approximately 190,000 tokens. This includes:
- System prompts and instructions
- Skills metadata and loaded skill content
- Conversation history
- File contents loaded into context
- Tool outputs and responses

## Token Estimation Guidelines

- **Plain text**: ~4 characters per token
- **Code**: ~3-4 characters per token (varies by language)
- **JSON/YAML**: ~4-5 characters per token
- **Minified code**: More tokens per character

## File Loading Best Practices

### Strategic File Loading

**DO:**
- Load only the files needed for the current task
- Use targeted queries to load specific files
- Preview file structure with `view` before loading entire files
- Use line ranges when viewing large files: `view(path, [start, end])`

**DON'T:**
- Load entire directories without filtering
- Load large dependencies or generated files
- Keep unnecessary files in context
- Load the same file multiple times

### File Size Guidelines

- **Small (<1K tokens)**: Safe to load freely
- **Medium (1-5K tokens)**: Load when needed, consider partial viewing
- **Large (5-20K tokens)**: Use line ranges, load sections as needed
- **Very large (>20K tokens)**: Strongly consider splitting or summarizing

## Context-Efficient Query Patterns

### Pattern 1: Focused Loading
```
"Show me the authentication logic in auth.py, specifically the login function"
```
Better than: "Load all the code" or "Show me auth.py"

### Pattern 2: Incremental Investigation
```
1. "What files handle user authentication?"
2. "Show me the main authentication function in auth.py"
3. "Now show me the token validation part"
```
Better than: "Load everything related to authentication"

### Pattern 3: Targeted Changes
```
"Update the timeout value in config.py line 45 to 30 seconds"
```
Better than: "Load and update config.py"

## Directory Structure Optimization

### Exclude Patterns
Always exclude these from context:
- `node_modules/`, `.venv/`, `venv/`
- `.git/`, `.next/`, `dist/`, `build/`
- `__pycache__/`, `.pytest_cache/`
- Generated files, minified assets
- Large data files, logs

### Organize for Selectivity
```
src/
├── core/           # Core business logic (load selectively)
├── api/            # API routes (load on demand)
├── utils/          # Utilities (load specific files)
└── config/         # Config (load when needed)
```

Better than a flat structure where all files are equally likely to be loaded.

## Managing Large Codebases

### Strategy 1: Component-Based Loading
Work on one component at a time:
1. Identify the component
2. Load only relevant files for that component
3. Complete the work
4. Move to next component

### Strategy 2: Summary-First Approach
For large files:
1. Request a summary of the file structure
2. Identify relevant sections
3. Load only those sections with line ranges

### Strategy 3: Reference Documentation
Instead of loading large reference files:
- Create concise documentation
- Link to external docs
- Use comments for complex logic

## Context-Aware Development Workflows

### Workflow 1: Bug Fixing
```
1. "What file contains the login function?" (minimal context)
2. "Show me lines 100-150 of auth.py" (targeted view)
3. "Update line 120 to fix the validation" (precise change)
```

### Workflow 2: Feature Addition
```
1. "What's the structure of the API routes?" (overview)
2. "Show me an example route handler" (reference)
3. "Create a new route following that pattern" (implementation)
```

### Workflow 3: Refactoring
```
1. Identify files to refactor (list only)
2. Load one file at a time
3. Refactor and test each file
4. Move to next file
```

## Real-Time Monitoring

### Check Token Usage
Run the analysis script periodically:
```bash
python scripts/analyze_tokens.py /path/to/project
```

### Warning Signs
- Response times increasing
- Claude mentioning context limits
- Incomplete or truncated responses
- Need to repeat information

### Recovery Actions
1. Start a new conversation
2. Load only essential files
3. Use more targeted queries
4. Split large tasks into smaller ones

## File Splitting Strategies

### When to Split a File

Split when:
- File exceeds 500 lines
- Multiple unrelated concerns
- Large sections rarely accessed together
- File causes context budget issues

### How to Split Effectively

**Example: Large API file**
```
Before:
api.py (2000 lines, 15K tokens)

After:
api/
├── routes.py (300 lines, ~2K tokens)
├── handlers.py (400 lines, ~3K tokens)
├── validation.py (200 lines, ~1.5K tokens)
└── utils.py (100 lines, ~750 tokens)
```

### Split Patterns

**By functionality:**
- Separate concerns (auth, users, posts)
- Group related operations

**By access frequency:**
- Hot path (frequently modified)
- Stable code (rarely changed)

**By dependency:**
- Core logic (no dependencies)
- Integration code (external deps)

## Advanced Techniques

### Technique 1: Lazy Loading
Don't preload files. Let Claude ask for them when needed.

### Technique 2: Context Checkpoints
For long tasks, periodically summarize progress and start fresh with minimal context.

### Technique 3: External References
Store large reference material externally:
- API documentation → Link to docs
- Data schemas → Separate schema files
- Configuration → Environment variables

### Technique 4: Code Generation Templates
Instead of loading examples, create templates:
```python
# Template stored in minimal form
def api_route_template():
    """
    Standard API route pattern.
    Customize: route, method, handler logic
    """
    pass
```

## Collaboration Best Practices

### For Team Projects
- Document context-heavy files
- Create loading guidelines in README
- Use consistent directory structures
- Share context optimization scripts

### For Open Source
- Provide architecture overview
- Document entry points
- Create contribution guides
- Maintain up-to-date file maps

## Measuring Success

### Key Metrics
- Average tokens per task
- Number of context resets needed
- Query specificity (how targeted)
- Time to complete tasks

### Optimization Goals
- Stay under 70% budget for routine tasks
- Reserve 30% for unexpected needs
- Minimize redundant file loading
- Reduce conversation length
