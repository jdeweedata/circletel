# Bug Fix Template

Use this template to structure bug reports and debugging tasks for CircleTel.

## Objective
[One clear sentence describing the bug to fix]

## Context
- **Current behavior**: [What happens now - the bug]
- **Expected behavior**: [What should happen instead]
- **Affected systems**: [Which parts of CircleTel are affected]
- **Related files**: [Files likely involved]
  - `path/to/file1.tsx`
  - `path/to/file2.ts`

## Error Details
- **Error message**: [Full error text]
  ```
  [Paste full error message here]
  ```
- **Stack trace**: [If available]
  ```
  [Paste stack trace here]
  ```
- **Error code**: [HTTP status code or error code]
- **Frequency**: [Always happens / Sometimes / Rare]
- **Impact**: [How many users affected? Critical or minor?]

## Reproduction Steps
1. [Step 1 - be specific]
2. [Step 2 - exact actions]
3. [Step 3 - what to observe]
4. **Expected result**: [What should happen]
5. **Actual result**: [What actually happens - the bug]

## Environment
- **Browser**: [Chrome 120, Firefox 119, Safari 17, etc.]
- **OS**: [Windows 11, macOS 14, Ubuntu 22.04, etc.]
- **Device**: [Desktop, Mobile, Tablet]
- **Deployment**: [Local dev, Staging, Production]
- **Node version**: [If relevant - node --version]
- **Next.js version**: [If relevant - 15.x]

## Console Output
- **Console errors**: [Browser console errors]
  ```
  [Paste console errors here]
  ```
- **Console warnings**: [Relevant warnings]
- **Network errors**: [Failed API calls, 404s, 500s]
  ```
  [Network tab errors]
  ```
- **Debug logs**: [Any debug output]

## Recent Changes
- **Recent deployments**: [What was deployed recently?]
- **Recent commits**: [Related commits from git log]
- **Recent PRs**: [Recent pull requests merged]
- **Environment changes**: [Config changes, env var updates]

## Root Cause Analysis (if known)
- **Hypothesis 1**: [Most likely cause]
  - **Evidence**: [Why you think this]
- **Hypothesis 2**: [Second possibility]
  - **Evidence**: [Supporting evidence]
- **Hypothesis 3**: [Least likely but possible]
  - **Evidence**: [Why this might be it]

## Requirements
1. Identify the root cause of the bug
2. Implement a fix that resolves the issue
3. Ensure fix doesn't introduce new bugs
4. Add error handling to prevent recurrence
5. Add tests to prevent regression

## Constraints
- Must not break existing functionality
- Should maintain backward compatibility
- Fix should follow CircleTel patterns (CLAUDE.md)
- No database schema changes (unless absolutely necessary)
- Must be production-ready (error handling, logging)

## Acceptance Criteria
- [ ] Bug no longer reproduces
- [ ] Original functionality still works
- [ ] No new errors in console
- [ ] No new warnings in console
- [ ] Type check passes: `npm run type-check`
- [ ] Build succeeds: `npm run build:memory`
- [ ] Manual test: [Specific test scenario]
- [ ] Related features still work
- [ ] Error handling is comprehensive

## CircleTel Patterns to Follow
- [Reference to CLAUDE.md debugging pattern]
- [Specific fix pattern if known]
- [Example from codebase: file:line]

## Debugging Approach
1. **Reproduce locally**
   - Run: `npm run dev:memory`
   - Navigate to: [Page/route]
   - Perform: [Reproduction steps]
   - Observe: [Bug occurs]

2. **Add instrumentation**
   ```typescript
   console.log('[DEBUG] Before action:', { data })
   console.log('[DEBUG] After action:', { result })
   ```

3. **Isolate the problem**
   - Check: [Specific component/function]
   - Verify: [API response]
   - Test: [Specific scenario]

4. **Identify root cause**
   - Review: [Relevant code]
   - Check: [Common CircleTel bug patterns]
   - Analyze: [Stack trace, logs]

5. **Implement fix**
   - File: `path/to/fix.tsx`
   - Change: [What to modify]
   - Test: [Verify fix works]

## Testing Strategy
- **Reproduce bug**: [Verify bug exists first]
- **Apply fix**: [Implement the fix]
- **Verify fix**: [Confirm bug is gone]
- **Regression test**: [Test related features]
- **Edge cases**: [Test boundary conditions]
- **Error scenarios**: [Test error handling]

## CircleTel-Specific Debugging Checklist

### If Infinite Loading State
- [ ] Check for missing finally block in async callback
- [ ] Verify loading state is set to false in all code paths
- [ ] Add try/catch/finally for error handling
- [ ] Reference: `components/providers/CustomerAuthProvider.tsx:64-76`

### If RLS Policy Error
- [ ] Check RLS policies exist for table
- [ ] Verify service role policy exists
- [ ] Confirm API uses service role client
- [ ] Test query directly in Supabase SQL Editor

### If Next.js 15 Type Error
- [ ] Check if params is awaited: `await context.params`
- [ ] Verify async/await pattern for API routes
- [ ] Reference: CLAUDE.md TypeScript Patterns

### If Memory Heap Overflow
- [ ] Use `:memory` variant commands
- [ ] Run: `npm run dev:memory`
- [ ] Type check: `npm run type-check:memory`
- [ ] Build: `npm run build:memory`

### If Supabase Client Error
- [ ] Verify correct client for context
- [ ] Server-side: `import { createClient } from '@/lib/supabase/server'`
- [ ] Client-side: `import { createClient } from '@/lib/supabase/client'`

## Validation Checklist
After fix is applied:

### Immediate (2 min)
- [ ] Bug no longer reproduces
- [ ] No new console errors
- [ ] Original feature works

### Code Quality (5 min)
- [ ] Type check passes
- [ ] No linting errors
- [ ] Follows CircleTel patterns
- [ ] Error handling added

### Build & Deploy (10 min)
- [ ] Build succeeds
- [ ] No performance regression
- [ ] Staging test passes

### Documentation (5 min)
- [ ] Fix documented in commit
- [ ] Updated CLAUDE.md if pattern is common
- [ ] Team notified if critical

---

**Template Version**: 1.0.0
**Use Case**: Bug fixing and debugging in CircleTel
