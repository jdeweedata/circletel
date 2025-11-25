# Debugging Checklists

Quick checklists for systematic debugging. Print this out or keep it handy when fixing bugs.

## Universal Debugging Checklist

Use this for any bug:

- [ ] **Can you reproduce it?**
  - [ ] Consistent reproduction steps documented
  - [ ] Reproduction frequency known (always, sometimes, rarely)
  - [ ] Works in development? Staging? Production?

- [ ] **What changed recently?**
  - [ ] Check git log for recent commits
  - [ ] Review recent deployments
  - [ ] Check dependency updates
  - [ ] Database schema changes?

- [ ] **Error messages collected?**
  - [ ] Full error message copied
  - [ ] Stack trace captured
  - [ ] Console logs exported
  - [ ] Network errors noted

- [ ] **Environment verified?**
  - [ ] Browser/Node version
  - [ ] Operating system
  - [ ] Development vs Production
  - [ ] Authentication state

- [ ] **Hypothesis formed?**
  - [ ] Top 3 possible causes identified
  - [ ] Ranked by likelihood
  - [ ] Testable predictions made

## Frontend Bug Checklist

For React/Next.js UI issues:

### Investigation
- [ ] Open browser DevTools
- [ ] Check Console for errors
- [ ] Check Network tab for failed requests
- [ ] Inspect component in React DevTools
- [ ] Note component props and state
- [ ] Check re-render count (profiler)

### Common Causes
- [ ] Missing useEffect dependency?
- [ ] Infinite re-render loop?
- [ ] Stale closure capturing old state?
- [ ] Missing null/undefined check?
- [ ] Incorrect prop types?
- [ ] CSS layout issue?
- [ ] Missing key prop in list?

### Testing
- [ ] Test in different browsers
- [ ] Test different screen sizes
- [ ] Test with React StrictMode
- [ ] Test with slow network
- [ ] Test error scenarios

## API Route Bug Checklist

For Next.js API route issues:

### Investigation
- [ ] Check API response status code
- [ ] Review response body/error message
- [ ] Test with curl or Postman
- [ ] Check server logs
- [ ] Verify request payload format

### Authentication
- [ ] Token present in headers?
- [ ] Token valid and not expired?
- [ ] Correct auth method used?
- [ ] RLS policies checked?

### Database
- [ ] Query syntax correct?
- [ ] Service role client used?
- [ ] Table/column names correct?
- [ ] Foreign key constraints met?
- [ ] RLS policies allow access?

### Common Causes
- [ ] Missing service role policy?
- [ ] Wrong Supabase client import?
- [ ] Async params not awaited? (Next.js 15)
- [ ] Request body not parsed?
- [ ] CORS issues?
- [ ] Timeout on long query?

## Database Bug Checklist

For Supabase/PostgreSQL issues:

### RLS Policies
- [ ] Service role policy exists?
- [ ] Customer/user policy correct?
- [ ] Admin policy present?
- [ ] Policies use correct auth.uid()?

### Queries
- [ ] Syntax valid?
- [ ] Table names correct?
- [ ] Column names exist?
- [ ] Joins properly structured?
- [ ] Filters use indexed columns?

### Performance
- [ ] Indexes on foreign keys?
- [ ] Indexes on filtered columns?
- [ ] Query plan checked (EXPLAIN)?
- [ ] N+1 query problem?
- [ ] Large result set paginated?

### Data Integrity
- [ ] Foreign key constraints valid?
- [ ] NOT NULL constraints met?
- [ ] CHECK constraints satisfied?
- [ ] Unique constraints not violated?
- [ ] Trigger logic correct?

## Build/Deploy Bug Checklist

For compilation and deployment issues:

### TypeScript
- [ ] `npm run type-check` passes?
- [ ] All imports resolved?
- [ ] Type definitions exist?
- [ ] Next.js 15 patterns used?
- [ ] Async params awaited?

### Build
- [ ] `npm run build:memory` succeeds?
- [ ] No heap overflow errors?
- [ ] Environment variables set?
- [ ] Dependencies installed?
- [ ] Node version correct?

### Deployment
- [ ] Staging deployment works?
- [ ] Environment vars in Vercel?
- [ ] Database migrations applied?
- [ ] Build logs reviewed?
- [ ] Health check passes?

### Rollback Plan
- [ ] Can revert to previous version?
- [ ] Rollback tested in staging?
- [ ] Database rollback possible?
- [ ] Team notified of issues?

## Performance Bug Checklist

For slow loading or high resource usage:

### Measurement
- [ ] Baseline performance measured
- [ ] Specific slow operation identified
- [ ] Metrics collected (time, memory, CPU)
- [ ] Comparison to expected performance

### React Performance
- [ ] Unnecessary re-renders identified?
- [ ] React.memo or useMemo needed?
- [ ] Large lists virtualized?
- [ ] useCallback for callbacks?
- [ ] Components split appropriately?

### Database Performance
- [ ] Query execution time measured?
- [ ] Indexes on filtered columns?
- [ ] EXPLAIN ANALYZE run?
- [ ] N+1 queries eliminated?
- [ ] Connection pooling working?

### Network Performance
- [ ] Payload size optimized?
- [ ] Images compressed?
- [ ] Code splitting used?
- [ ] CDN for static assets?
- [ ] Lazy loading implemented?

## Authentication Bug Checklist

For login/auth issues:

### Login Flow
- [ ] Credentials correct?
- [ ] Form validation passes?
- [ ] API call succeeds?
- [ ] Token stored correctly?
- [ ] Redirect works?

### Session
- [ ] Token in localStorage/cookies?
- [ ] Token not expired?
- [ ] Refresh token working?
- [ ] Session persists across reload?

### Authorization
- [ ] User has required role?
- [ ] RLS policies allow access?
- [ ] JWT claims correct?
- [ ] Admin users in admin_users table?

### Common Issues
- [ ] Competing auth providers? (CustomerAuthProvider skips admin pages?)
- [ ] Auth state not synced?
- [ ] Token in wrong format?
- [ ] CORS blocking auth requests?

## Regression Bug Checklist

For features that used to work:

### Identification
- [ ] Last working commit identified?
- [ ] First broken commit found?
- [ ] Git bisect run?
- [ ] Changes between commits reviewed?

### Analysis
- [ ] Code changes examined?
- [ ] Dependency updates checked?
- [ ] Database schema changes?
- [ ] Environment changes?
- [ ] Configuration changes?

### Validation
- [ ] Fix tested with old behavior?
- [ ] No new bugs introduced?
- [ ] All related features work?
- [ ] Tests updated if needed?

## Quick Reference: First 5 Things to Check

### When Something Breaks:

1. **Check the Console**
   ```
   F12 → Console tab → Look for red errors
   ```

2. **Try to Reproduce**
   ```
   Can you make it happen again? Document the steps.
   ```

3. **Check Recent Changes**
   ```
   git log --oneline -10
   ```

4. **Look for Patterns**
   ```
   Does it happen always? Sometimes? Specific users?
   ```

5. **Read the Error Message**
   ```
   Don't skip the error - it usually tells you exactly what's wrong
   ```

## CircleTel-Specific Quick Checks

### Infinite Loading?
```typescript
// Check for missing finally block
finally {
  setLoading(false) // ← Add this
}
```

### 403 API Error?
```sql
-- Check for missing service role policy
SELECT * FROM pg_policies WHERE tablename = 'your_table';
```

### Type Error in API Route?
```typescript
// Next.js 15: Await params
const { id } = await context.params
```

### Heap Overflow?
```bash
# Use memory variant
npm run build:memory
```

### Dashboard Not Loading?
```typescript
// Check auth provider exclusions
if (isAdminPage || isPartnerPage) {
  setLoading(false)
  return
}
```

---

**Pro Tip**: Print this checklist and keep it at your desk. Check off items as you debug!

**Version**: 1.0.0
**Last Updated**: 2025-11-08
