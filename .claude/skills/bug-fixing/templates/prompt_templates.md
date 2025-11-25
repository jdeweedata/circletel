# Bug Fixing Prompt Templates

Ready-to-use prompts for different types of bugs. Copy, fill in the placeholders, and paste to Claude.

## Template 1: Runtime Error Analysis

```
Analyze this runtime error in CircleTel:

**Error Message:**
[Paste exact error message]

**Stack Trace:**
[Paste stack trace]

**File Location:** [file:line]

**Context:**
- What I was doing: [user action that triggered error]
- Environment: [development/staging/production]
- Browser/Node version: [version]

**Questions:**
1. What is the immediate cause of this error?
2. What conditions or timing issues could trigger this?
3. Is this a null reference, type mismatch, or logic error?
4. What's the safest fix that won't introduce side effects?
5. Are there similar patterns elsewhere in the codebase?
```

## Template 2: Infinite Loading/Loop Debug

```
Debug this infinite loading or re-render issue in CircleTel:

**Component:** [component name and path]

**Symptom:**
[Description: UI stuck on "Loading...", infinite re-renders, etc.]

**Code:**
[Paste relevant useEffect or component code]

**Analyze for:**
1. Missing useEffect dependency array
2. State updates that trigger re-renders
3. Missing finally block in async operations
4. Async callback error handling
5. Stale closures or derived state issues

**Expected behavior:**
[What should happen instead]
```

## Template 3: API/Database Troubleshooting

```
Troubleshoot this API or database issue in CircleTel:

**API Endpoint:** [/api/path]

**Issue:**
[Description of problem: 403 error, empty response, timeout, etc.]

**Request:**
```
json
{
  "example": "request payload"
}
```

**Response/Error:**
```
json
{
  "example": "response or error"
}
```

**Environment:**
- Database: Supabase (agyjovdugmtopasyvlng)
- Authentication: [authenticated user, anonymous, service role]
- Table: [table name if applicable]

**Check for:**
1. RLS policy blocking access (missing service_role policy?)
2. Missing or invalid authentication token
3. Incorrect query parameters or payload structure
4. Foreign key constraint violations
5. Missing indexes causing slow queries
6. Type mismatches in request/response
```

## Template 4: TypeScript Type Error Fix

```
Fix this TypeScript error in CircleTel:

**Error:**
[Paste exact TypeScript error message]

**File:** [file:line]

**Code:**
```
typescript
[Paste relevant code section]
```

**Questions:**
1. What type is expected vs what's being provided?
2. Is this a Next.js 15 async params issue? (should use `await context.params`)
3. Is this a missing type definition or import?
4. Is this related to Supabase client types?
5. What's the minimal fix without changing too much code?

**Additional Context:**
- Recently upgraded to Next.js 15: [yes/no]
- This worked before: [yes/no, when did it break?]
```

## Template 5: Performance Issue Investigation

```
Analyze this performance issue in CircleTel:

**Symptom:**
[slow page load, high memory, lag, etc.]

**Context:**
- Page/Component: [name and path]
- Load time: [X seconds]
- Memory usage: [X MB]
- User action: [what triggers the slowness]

**Metrics (if available):**
- Initial load: [time]
- Time to interactive: [time]
- Largest contentful paint: [time]

**Investigate:**
1. Unnecessary React re-renders (check React DevTools)
2. Large data sets loaded without pagination
3. Missing React.memo or useMemo optimization
4. Inefficient database queries (N+1 queries?)
5. Missing database indexes on filtered columns
6. Large bundle size or unoptimized imports
7. Memory leaks (event listeners, timers not cleaned up)

**Expected performance:**
[Target load time or acceptable range]
```

## Template 6: Build/Deploy Failure Debug

```
Debug this build or deployment failure in CircleTel:

**Error Type:** [TypeScript error, build error, deployment error]

**Error Output:**
```
[Paste build/deploy logs]
```

**Environment:**
- Local build: [works/fails]
- Staging build: [works/fails]
- Production build: [works/fails]

**Recent Changes:**
[What was changed recently? Git diff or PR number]

**Check for:**
1. TypeScript compilation errors
2. Missing environment variables
3. Heap overflow (need to use npm run build:memory?)
4. Failed database migrations
5. Dependency version conflicts
6. Next.js 15 compatibility issues

**Commands tried:**
```
bash
npm run type-check
npm run build:memory
# [list other commands]
```
```

## Template 7: Authentication/Authorization Bug

```
Debug this authentication or authorization issue in CircleTel:

**Issue:**
[User can't log in, sees wrong data, gets 403, etc.]

**User Type:**
- Role: [customer, admin, partner]
- Auth method: [email/password, OAuth, etc.]
- Session: [new user, existing user]

**Error/Behavior:**
[Exact error message or unexpected behavior]

**Expected:**
[What should happen]

**Check:**
1. Auth provider exclusions (CustomerAuthProvider.tsx:64-76)
2. RLS policies on the table
3. JWT token claims and role
4. Session expiration
5. Competing auth systems (admin vs customer vs partner)
6. Service role policy for API routes

**Relevant Code:**
```
typescript
[Paste auth-related code if applicable]
```
```

## Template 8: Regression Bug (Worked Before)

```
Debug this regression in CircleTel:

**Issue:**
[What broke]

**When it broke:**
- Last working commit/PR: [hash or PR number]
- First broken commit: [hash if known]
- Time period: [approximately when]

**Recent Changes:**
```
bash
git log --oneline --since="[date]" --grep="[relevant keywords]"
```

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Observe bug]

**Used to work:**
[Describe the previous correct behavior]

**Now happens:**
[Describe the current broken behavior]

**Analyze:**
1. Review git diff between working and broken
2. Check for dependency upgrades
3. Look for database schema changes
4. Check for environment variable changes
5. Identify side effects of recent features
```

## Template 9: Intermittent/Flaky Bug

```
Debug this intermittent or flaky bug in CircleTel:

**Issue:**
[What happens sometimes]

**Frequency:**
- Happens: [X% of the time, randomly, under certain conditions]
- Pattern: [time of day, specific users, load-related, etc.]

**When it occurs:**
[Describe any patterns observed]

**When it doesn't occur:**
[Describe when it works correctly]

**Possible Causes to Investigate:**
1. Race conditions (async timing issues)
2. State inconsistency (stale closures)
3. Network timeouts or retries
4. Cache-related issues
5. Database connection pool exhaustion
6. Memory pressure
7. External API failures

**Logs:**
[Paste any relevant logs when bug occurs]

**Reproduction attempts:**
- Tried [X] times
- Succeeded [Y] times
```

## Template 10: UI/UX Bug

```
Debug this UI or UX issue in CircleTel:

**Issue:**
[Visual bug, layout problem, interaction not working]

**Screenshot/Video:**
[Describe or attach]

**Browser/Device:**
- Browser: [Chrome, Firefox, Safari, etc.]
- Version: [version]
- Device: [Desktop, Mobile, specific phone]
- Screen size: [width x height]

**Steps to Reproduce:**
1. Navigate to [page]
2. [Action]
3. [Observe incorrect behavior]

**Expected vs Actual:**
- Expected: [correct behavior/appearance]
- Actual: [what actually happens]

**Check for:**
1. CSS conflicts or specificity issues
2. Responsive design breakpoints
3. Missing Tailwind classes
4. Z-index stacking issues
5. Overflow or scrolling problems
6. Missing hover/focus states
7. Accessibility issues (keyboard nav, screen readers)

**Relevant Code:**
```
typescript
[Component code]
```
```

## Using These Templates

### Quick Start

1. **Identify bug type** from the list above
2. **Copy the template** that best matches
3. **Fill in ALL placeholders** with actual information
4. **Paste to Claude** and get analysis
5. **Follow up** with additional context if needed

### Tips for Better Results

- **Be specific**: Exact error messages are better than "it doesn't work"
- **Provide context**: Recent changes, environment, user actions
- **Include code**: Paste relevant code snippets
- **Add logs**: Console logs, stack traces, network requests
- **Show what you tried**: List debugging steps already attempted

### Example Usage

**Bad**:
```
My page is broken, help!
```

**Good**:
```
[Using Template 2]

Debug this infinite loading issue in CircleTel:

Component: app/dashboard/page.tsx

Symptom:
Dashboard page shows "Loading..." spinner indefinitely.
No errors in console. Started after deploying auth changes.

Code:
[Pasted useEffect with auth callback]

Analyze for:
1. Missing finally block? (likely based on recent CustomerAuthProvider fix)
2. Error handling in async callback?
...
```

## Customizing Templates

Feel free to:
- Add CircleTel-specific sections
- Remove irrelevant questions
- Combine templates for complex bugs
- Create new templates for recurring issues

## Feedback

If you discover a common bug pattern not covered here, add a new template to help future debugging!

---

**Version**: 1.0.0
**Last Updated**: 2025-11-08
