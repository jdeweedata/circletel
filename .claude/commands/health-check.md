---
description: Run comprehensive health check on the CircleTel codebase
---

# CircleTel Health Check

Run a comprehensive health check covering context budget, type safety, and database security.

## Steps

### 1. Context Budget Analysis

Run the context analyzer to check token usage:

```bash
python .claude/skills/context-manager/scripts/analyze_tokens.py .
```

Report the following:
- **Budget Zone**: Green (<70%), Yellow (70-85%), or Red (>85%)
- **Estimated tokens** in codebase
- **Top 5 largest files** by token count
- **Recommendations** for optimization

### 2. TypeScript Type Check

Run type checking with memory optimization:

```bash
npm run type-check:memory
```

Report:
- **Pass/Fail** status
- **Error count** if any
- **First 5 errors** with file locations
- **Suggested fixes** for common patterns

### 3. Supabase Security Advisors

Check for security issues:

```
mcp__supabase__get_advisors type="security"
```

Report:
- **Advisory count**
- **Critical issues** (list all)
- **High severity** issues (list all)
- **Remediation URLs** for each issue

### 4. Supabase Performance Advisors

Check for performance issues:

```
mcp__supabase__get_advisors type="performance"
```

Report:
- **Advisory count**
- **High-impact** recommendations
- **Missing indexes** if any
- **Query optimization** suggestions

## Output Format

Present results in this format:

```
╔════════════════════════════════════════════════════════════════╗
║                    CircleTel Health Check                       ║
╚════════════════════════════════════════════════════════════════╝

📊 CONTEXT BUDGET
   Zone: [🟢 GREEN / 🟡 YELLOW / 🔴 RED]
   Usage: XX% (XXX,XXX tokens / 190,000 available)
   Largest Files:
   - file1.ts (X,XXX tokens)
   - file2.tsx (X,XXX tokens)

✅ TYPE CHECK
   Status: [PASSED / FAILED]
   Errors: X
   [First 5 errors if any]

🔒 SECURITY ADVISORS
   Issues: X
   Critical: [List or "None"]
   High: [List or "None"]

⚡ PERFORMANCE ADVISORS
   Issues: X
   High Impact: [List or "None"]
   Missing Indexes: [List or "None"]

═══════════════════════════════════════════════════════════════════
SUMMARY: [Overall status - Ready to deploy / Action needed]
═══════════════════════════════════════════════════════════════════
```

## Quick Actions

Based on results, suggest relevant commands:

- **Type errors**: Show specific file:line references
- **Security issues**: Provide remediation URLs
- **Performance issues**: Suggest index creation or query optimization
- **Context overload**: Recommend files to exclude via `.claudeignore`

## Usage

Simply run:
```
/health-check
```

No arguments needed. Results include actionable recommendations.
