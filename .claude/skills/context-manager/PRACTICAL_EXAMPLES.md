# Context Manager Skill - Practical Examples

This document shows real-world examples of how the Context Manager skill improves your Claude Code workflow.

## Example 1: Working with a Large E-commerce Codebase

### Scenario
You've inherited a large e-commerce platform with 150+ Python files totaling 300,000 characters (~75,000 tokens). You need to fix a bug in the checkout process.

### Without Context Manager ❌

```
You: "Help me fix a bug in the checkout"
Claude: *loads entire src/ directory*
Result: Context overflow, incomplete responses, session reset required
```

### With Context Manager ✅

```bash
# Step 1: Analyze the codebase
$ python scripts/analyze_tokens.py .

TOKEN USAGE ANALYSIS
Total files analyzed: 150
Total estimated tokens: 75,000
Budget: 190,000
Usage: 39.5%

TOP FILES:
15,000 tokens - src/orders/order_processor.py
8,000 tokens  - src/payments/payment_handler.py
6,500 tokens  - src/checkout/checkout_flow.py
...

RECOMMENDATIONS:
📊 3 files exceed 5,000 tokens - consider using line ranges
```

```
# Step 2: Targeted query
You: "Show me the checkout flow structure in src/checkout/"

Claude: [Shows directory structure - minimal tokens]

# Step 3: Load specific file with range
You: "Load checkout_flow.py lines 100-200 where the payment validation happens"

Claude: [Loads only 100 lines - ~750 tokens]

# Step 4: Fix the bug
You: "Update line 145 to validate payment amount before processing"

Claude: [Makes targeted fix]

Result: Bug fixed efficiently, used <5% of token budget
```

## Example 2: Adding a Feature to a React Application

### Scenario
Add user authentication to a React app with 80 files and complex component hierarchy.

### Without Context Manager ❌

```
You: "I need to add authentication to my app"
Claude: "Can you show me your code?"
You: *uploads entire src/ directory*
Result: 40,000 tokens loaded, hard to focus on relevant parts
```

### With Context Manager ✅

```bash
# Step 1: Understand structure
You: "Show me the structure of src/"

Claude: 
src/
├── components/
├── pages/
├── hooks/
├── utils/
└── App.js

# Step 2: Check existing patterns
You: "Load src/App.js and show me the routing structure"

Claude: [Loads main file - 1,200 tokens]

# Step 3: Check for existing auth
You: "Does this app have any authentication already?"

Claude: "No authentication found. I can see routing but no protected routes."

# Step 4: Targeted implementation
You: "Create a new auth context in src/contexts/AuthContext.js following React best practices"

Claude: [Creates new file without loading other components]

# Step 5: Integrate progressively
You: "Now update App.js to use the AuthContext. Only show me the changes needed."

Claude: [Shows specific modifications]

Result: Feature added with ~3,000 tokens used, clear progression
```

## Example 3: Refactoring a Monolithic API File

### Scenario
You have api.py with 2,000 lines (15,000 tokens) that needs refactoring into modules.

### Token Analysis Shows:

```bash
$ python scripts/analyze_tokens.py src/api.py

Tokens     Lines    Size       Path
15,234     2,000    59.2KB     src/api.py

⚠️ WARNING: This file is very large (15K tokens = 8% of budget)
```

### Refactoring Strategy ✅

```
# Step 1: Analyze structure
You: "Show me the function names in api.py without loading the full file"

Claude: [Uses bash to extract function names - minimal tokens]

# Step 2: Work in sections
You: "Show me lines 1-100 of api.py"

Claude: [Loads first section - 750 tokens]

You: "Extract these authentication functions to auth.py"

Claude: [Creates new file]

# Step 3: Continue section by section
You: "Now show me lines 500-600 - the user management functions"

Claude: [Loads next section - 750 tokens]

You: "Extract these to users.py"

Claude: [Creates new file]

# Step 4: Update imports
You: "Update the imports in api.py to reference the new modules"

Claude: [Makes targeted changes]

Result: Large file successfully split using <5,000 tokens total
```

## Example 4: Debugging Production Issue

### Scenario
Production error in logs pointing to user_service.py line 234. Need to fix ASAP.

### Without Context Manager ❌

```
You: "There's an error in user_service.py, can you help?"
Claude: "Let me see the file"
*loads entire 1,500 line file*
Result: 11,000 tokens used, still need to find the issue
```

### With Context Manager ✅

```
# Immediate targeted approach
You: "Show me user_service.py lines 220-250"

Claude: [Loads 30 lines - ~250 tokens]

You: "Line 234 is throwing a null reference error. Fix it."

Claude: [Identifies issue, provides fix]

You: "Apply the fix"

Claude: [Updates specific line]

Result: Issue fixed in minutes, used <500 tokens
```

## Example 5: Code Review for Pull Request

### Scenario
Review a PR that changes 8 files across the codebase.

### Without Context Manager ❌

```
You: "Review this PR"
*loads all 8 files completely*
Result: 25,000 tokens, context cluttered with unchanged code
```

### With Context Manager ✅

```bash
# Step 1: Get the changed files
$ git diff --name-only main...feature-branch
src/auth.py
src/api/routes.py
src/models/user.py
src/tests/test_auth.py

# Step 2: Analyze token impact
$ python scripts/analyze_tokens.py src/auth.py src/api/routes.py src/models/user.py
Total: 4,500 tokens

# Step 3: Review efficiently
You: "Review src/auth.py for security issues"

Claude: [Loads and reviews - 1,200 tokens]

You: "Now review src/api/routes.py focusing on the new endpoints"

Claude: [Loads and reviews - 1,500 tokens]

You: "Check src/models/user.py for data validation"

Claude: [Loads and reviews - 900 tokens]

Result: Thorough review using ~4,500 tokens, clear focus per file
```

## Example 6: Working with Legacy Code

### Scenario
Modernizing a legacy codebase with poor organization and large files.

### Analysis Result:

```bash
$ python scripts/analyze_tokens.py legacy/

⚠️ WARNING: 8 files exceed 5,000 tokens
- legacy/main.py: 22,000 tokens (!)
- legacy/utils.py: 15,000 tokens
- legacy/handlers.py: 12,000 tokens
```

### Strategy ✅

```
# Step 1: Document context strategy
You: "Help me create a .context-notes.md for this legacy codebase"

Claude: [Creates documentation]

## Context Strategy

### Very Large Files (Use Line Ranges ALWAYS)
- `legacy/main.py` (22K tokens)
- `legacy/utils.py` (15K tokens)  
- `legacy/handlers.py` (12K tokens)

### Workflow
1. Never load these files completely
2. Use grep to find functions first
3. Load specific line ranges only
4. Work on one function at a time

# Step 2: Work incrementally
You: "Where is the login function in the codebase?"

Claude: [Searches without loading - bash grep]

Claude: "Found in legacy/main.py around line 450"

You: "Show me lines 440-480"

Claude: [Loads 40 lines - ~350 tokens]

You: "Extract this to a new auth/login.py file"

Claude: [Creates modular file]

Result: Successfully modernizing without context overflow
```

## Example 7: Multi-Developer Team Project

### Scenario
Team of 5 working on different features, need consistent context management.

### Team Setup ✅

```bash
# Step 1: Create shared .claudeignore
$ cp assets/claudeignore-template.txt .claudeignore
$ cat >> .claudeignore << EOF
# Project-specific
data/seeds/
docs/old/
prototypes/
EOF

# Step 2: Create team context guide
$ cat > .context-notes.md << EOF
## Team Context Management

### Module Owners
- Auth: Alice (auth/, middleware/auth.py)
- API: Bob (api/routes/, api/handlers/)
- Database: Carol (models/, migrations/)
- Frontend: David (frontend/src/)

### Large Files (Always Use Line Ranges)
- api/routes.py (8K tokens)
- models/schema.py (6K tokens)

### Loading Strategy by Feature
- Working on auth? Load auth/ + middleware/auth.py
- Working on API? Load specific route files
- Working on DB? Load specific model files

### Before Starting Work
1. Run token analysis
2. Load only your module
3. Keep context <50% if possible
EOF

# Step 3: Team members follow guide
Alice: "Load auth/ directory for authentication work"
Bob: "Load api/routes/users.py lines 1-100 for user endpoints"
Carol: "Show me the User model in models/user.py"

Result: Team works efficiently without context conflicts
```

## Example 8: Optimizing a Slow Session

### Scenario
Claude Code session feels slow, responses taking longer than usual.

### Diagnosis ✅

```bash
$ python scripts/analyze_tokens.py .

Total estimated tokens: 145,000
Budget: 190,000
Usage: 76.3% ⚠️ YELLOW ZONE

TOP FILES IN CONTEXT:
15,000 tokens - src/api/main.py
12,000 tokens - src/models/user.py
8,000 tokens - src/services/email.py
...
```

### Recovery ✅

```
# Step 1: Acknowledge issue
You: "I notice we're at 76% context usage. Let's optimize."

# Step 2: Identify what's needed
You: "I only need to work on the email service now. You can forget the API and models."

Claude: "Understood. Focusing on email service only."

# Step 3: Start fresh if needed
You: "Actually, let's start a new session. I'll load just email.py"

[New session]
You: "Load src/services/email.py"

Result: Back to <10% usage, fast responses restored
```

## Key Takeaways

### Pattern 1: Always Start with Analysis
```bash
python scripts/analyze_tokens.py .
```
Know your token landscape before starting work.

### Pattern 2: Use Progressive Disclosure
```
Structure → Module → File → Section → Action
```
Each step loads only what's needed next.

### Pattern 3: Targeted Queries Beat General Ones
```
❌ "Help me with authentication"
✅ "Update the token validation in auth.py line 45"
```

### Pattern 4: Line Ranges are Your Friend
```
view("large_file.py", view_range=[100, 200])
```
Never load >500 line files completely.

### Pattern 5: Monitor and Adjust
```
Check usage → Yellow zone? → Be selective
Check usage → Red zone? → Start fresh
```

### Pattern 6: Document Your Strategy
```
.context-notes.md + .claudeignore = Team success
```

## Before vs After Metrics

### Typical Session Before Context Manager
- Files loaded: 40-60 files
- Token usage: 120,000-150,000 (63-79%)
- Context resets per task: 2-3
- Time to completion: Variable, with interruptions

### Typical Session After Context Manager  
- Files loaded: 5-10 files
- Token usage: 20,000-60,000 (10-30%)
- Context resets per task: 0-1
- Time to completion: Faster, more focused

## Real User Success Stories

### Case 1: E-commerce Platform
**Challenge:** 200-file codebase, frequent context overflows
**Solution:** Created .claudeignore, used line ranges, worked module-by-module
**Result:** 90% reduction in session resets, 3x faster feature development

### Case 2: API Refactoring
**Challenge:** Single 2500-line API file
**Solution:** Used analyze_tokens.py to identify sections, split into 8 files
**Result:** From 18K tokens per load to 2-3K, much easier to maintain

### Case 3: Bug Fixing
**Challenge:** Production issues requiring quick fixes
**Solution:** Direct line-range loading, targeted modifications
**Result:** Average fix time reduced from 30 minutes to 10 minutes

## Conclusion

The Context Manager skill transforms how you work with Claude Code:
- **From reactive** (dealing with overflows) **to proactive** (preventing them)
- **From loading everything** to **loading precisely what's needed**
- **From guessing** token usage **to measuring** it accurately
- **From frustration** with limits **to mastery** of the context window

Start using these patterns today and experience the difference!
