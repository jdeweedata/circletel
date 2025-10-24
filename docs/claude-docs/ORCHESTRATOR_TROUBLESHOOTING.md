# Orchestrator Troubleshooting Guide

> **Complete troubleshooting reference** for resolving orchestrator issues

**Version**: 1.0.0
**Last Updated**: 2025-10-20

---

## Table of Contents

1. [Quick Diagnosis](#quick-diagnosis)
2. [Common Issues](#common-issues)
3. [Quality Gate Failures](#quality-gate-failures)
4. [Performance Issues](#performance-issues)
5. [Agent Selection Problems](#agent-selection-problems)
6. [Workflow Execution Issues](#workflow-execution-issues)
7. [Emergency Procedures](#emergency-procedures)

---

## Quick Diagnosis

### Issue Identification Flowchart

```
Issue?
├─ Wrong agent selected
│  → Section 5: Agent Selection Problems
│
├─ Workflow stuck/slow
│  → Section 6: Workflow Execution Issues
│
├─ Quality gate failing
│  → Section 3: Quality Gate Failures
│
├─ Task not triggering orchestrator
│  → Section 2.1: Orchestrator Not Triggering
│
└─ Workflow takes too long
   → Section 4: Performance Issues
```

---

## Common Issues

### Issue 1: Orchestrator Not Triggering

**Symptom**: Manual agent selection instead of automatic orchestration

**Diagnosis**:
```
User: "Update dashboard"
Result: No orchestrator invocation
```

**Cause**: Missing trigger keywords

**Solution**:
```
Use explicit trigger words:
✅ "Implement dashboard updates"
✅ "Build new dashboard feature"
✅ "Create dashboard analytics"
```

**Trigger Words List**:
- `implement`, `build`, `create feature`, `add feature`
- `integrate`, `connect`, `setup`
- `fix bug`, `debug`, `resolve issue`
- `refactor`, `optimize`, `improve`

**Verification**:
```
After fix:
User: "Implement dashboard updates"
Result: ✅ Orchestrator triggered
```

---

### Issue 2: Ambiguous Task Analysis

**Symptom**: Low confidence score (<70%)

**Diagnosis**:
```
Task: "Improve the system"
Analysis:
  Confidence: 40%
  Warning: Ambiguous request
```

**Cause**: Generic/vague description

**Solution**:
Add specificity:
```
Before: "Improve the system"
After: "Optimize database queries in orders module to reduce load time from 8s to 2s"

Result:
  Confidence: 95%
  Intent: performance_optimization
  Agent: performance-optimizer
```

**Clarifying Questions Checklist**:
- [ ] What specific component/module?
- [ ] What type of improvement? (feature/performance/quality)
- [ ] Who are the users? (admin/customer/both)
- [ ] What's the business goal?

---

### Issue 3: Workflow Estimate Inaccurate

**Symptom**: Task takes 2x longer than estimated

**Diagnosis**:
```
Estimated: 60 min
Actual: 120 min
Reason: Unexpected complexity
```

**Causes**:
1. Incomplete requirements discovered mid-workflow
2. Dependencies not mentioned
3. Integration issues
4. Quality gate failures

**Solution**:

**Prevention**:
```
Provide complete context upfront:
✅ "Implement customer invoice download:
    - PDF generation with company branding
    - Email delivery option
    - Admin bulk download capability
    - S3 storage for archives
    - RBAC: Only account owners can download
    - Integration with existing billing system"
```

**During Execution**:
1. Check orchestrator dashboard
2. Identify bottleneck phase
3. Review error logs
4. Adjust expectations or request help

---

### Issue 4: Too Many Agents Selected

**Symptom**: 5+ agents assigned to seemingly simple task

**Diagnosis**:
```
Task: "Create comprehensive enterprise customer system"
Agents: 7 selected
```

**Cause**: Task implies high complexity

**Solution**:

**Break into phases**:
```
Phase 1: "Create basic customer CRUD interface"
  Agents: 2 (full-stack-dev, testing-agent)
  Time: 60 min

Phase 2: "Add customer analytics dashboard"
  Agents: 2 (frontend-specialist, testing-agent)
  Time: 45 min

Phase 3: "Integrate Zoho CRM sync"
  Agents: 2 (integration-specialist, testing-agent)
  Time: 85 min
```

**Result**: Clearer scope, better estimates, phased delivery

---

### Issue 5: Quality Gate Won't Pass

**Symptom**: Same gate fails repeatedly (3+ times)

**Diagnosis**:
```
Gate: TypeScript Validation
Status: Failed
Attempts: 4
Error: Type errors in components/admin/orders.tsx
```

**Cause**: Underlying code issue not being fixed

**Solution**:

**Immediate Actions**:
1. Run local validation: `npm run type-check`
2. Review exact errors
3. Fix root cause (not symptoms)
4. Verify fix: `npm run type-check` again
5. Retry gate

**If Still Failing**:
```
1. Check for circular dependencies
2. Verify type definitions exist
3. Clear node_modules and rebuild: `npm ci`
4. Check tsconfig.json for correct paths
```

---

## Quality Gate Failures

### Gate 1: TypeScript Validation Failed

**Error Message**:
```
❌ TypeScript Validation Failed
Errors: 12
Files: components/admin/orders.tsx, lib/types/orders.ts
```

**Diagnosis Steps**:

1. **Run Type Check**:
```bash
npm run type-check
```

2. **Common Error Types**:

**Type 1: Missing Type Definitions**
```typescript
// Error: Cannot find module 'xlsx' or its corresponding type declarations
// Fix: Install types
npm install --save-dev @types/xlsx
```

**Type 2: Incorrect Types**
```typescript
// Error: Type 'string | undefined' is not assignable to type 'string'
// Fix: Add type guard
const email = user?.email ?? '';
```

**Type 3: Missing Imports**
```typescript
// Error: Cannot find name 'Order'
// Fix: Add import
import { Order } from '@/lib/types/orders';
```

3. **Fix and Verify**:
```bash
# After fixes
npm run type-check
# Should show: 0 errors
```

**Prevention**:
- Always run `npm run type-check` before committing
- Use strict TypeScript mode
- Add type definitions for all functions

---

### Gate 2: Tests Failing

**Error Message**:
```
❌ Tests Failing
Failed: 3/25 tests
Coverage: 72% (target: 80%)
```

**Diagnosis Steps**:

1. **Run Tests**:
```bash
npm test
```

2. **Common Failure Types**:

**Type 1: Test Data Issues**
```javascript
// Error: Cannot read property 'id' of undefined
// Fix: Add test data
const mockOrder = { id: '1', status: 'pending', ... };
```

**Type 2: Async Timing**
```javascript
// Error: Timeout exceeded
// Fix: Use waitFor
await waitFor(() => expect(screen.getByText('Order')).toBeInTheDocument());
```

**Type 3: Coverage Too Low**
```
Coverage: 72%
Uncovered: lib/coverage/aggregation-service.ts (40%)

// Fix: Add tests for uncovered functions
test('aggregates coverage from multiple providers', async () => {
  // ...
});
```

3. **Fix and Verify**:
```bash
npm test
# Should show: All tests passed, coverage >80%
```

**Prevention**:
- Write tests during implementation (not after)
- Aim for >85% coverage for buffer
- Test edge cases and error scenarios

---

### Gate 3: RBAC Permissions Missing

**Error Message**:
```
❌ RBAC Validation Failed
Missing permission gates: 3
Files: app/admin/orders/page.tsx, app/admin/customers/page.tsx
```

**Diagnosis Steps**:

1. **Check for Permission Gates**:
```typescript
// Missing gate
export default function OrdersPage() {
  return <OrdersList />;
}

// Fixed with gate
import { PermissionGate } from '@/components/rbac/PermissionGate';
import { PERMISSIONS } from '@/lib/rbac/permissions';

export default function OrdersPage() {
  return (
    <PermissionGate permissions={[PERMISSIONS.ORDERS.VIEW]}>
      <OrdersList />
    </PermissionGate>
  );
}
```

2. **Check Hook Usage**:
```typescript
// Missing permission check
const handleDelete = () => deleteOrder(id);

// Fixed with check
const { hasPermission } = usePermissions();
const handleDelete = () => {
  if (!hasPermission(PERMISSIONS.ORDERS.DELETE)) {
    toast.error('Permission denied');
    return;
  }
  deleteOrder(id);
};
```

3. **Verify**:
- All admin pages have permission gates
- All sensitive actions check permissions
- RBAC hooks used correctly

**Prevention**:
- Use `<PermissionGate>` for all admin features
- Use `usePermissions()` hook for dynamic checks
- Follow RBAC patterns from existing code

---

### Gate 4: Documentation Incomplete

**Error Message**:
```
⚠️ Documentation Validation Warning
Missing: User guide, API documentation
Files needed: docs/features/[FEATURE].md
```

**Note**: This is a **warning**, not blocking

**Fix**:
```markdown
# [Feature Name]

## Overview
[Brief description]

## User Guide
### For Administrators
1. [Step 1]
2. [Step 2]

### For Customers
1. [Step 1]
2. [Step 2]

## API Documentation
### Endpoints
- `GET /api/[resource]` - [Description]
- `POST /api/[resource]` - [Description]

### Request/Response Examples
[Examples]

## Configuration
[Settings, environment variables]

## Troubleshooting
[Common issues and solutions]
```

**Prevention**:
- Document as you build
- Use templates for consistency
- Include examples and screenshots

---

### Gate 5: Deployment Validation Failed

**Error Message**:
```
❌ Deployment Check Failed
Issues: Build failed, environment variables missing
```

**Diagnosis Steps**:

1. **Run Deployment Check**:
```bash
npm run build
```

2. **Common Issues**:

**Issue 1: Build Errors**
```
Error: Module not found: Can't resolve '@/components/ui/new-component'
Fix: Verify file exists at correct path
```

**Issue 2: Environment Variables**
```
Warning: NEXT_PUBLIC_STRIPE_KEY is not defined
Fix: Add to .env.local and Vercel
```

**Issue 3: Type Errors During Build**
```
Type error in app/admin/page.tsx
Fix: Run npm run type-check and fix errors
```

3. **Verify**:
```bash
npm run build
# Should complete without errors
```

**Prevention**:
- Run `npm run build` locally before pushing
- Use deployment-check skill before production
- Verify environment variables in all environments

---

## Performance Issues

### Issue 1: Workflow Execution Slow

**Symptom**: Workflow takes >2x estimated time

**Diagnosis**:

1. **Check Dashboard**:
```
Orchestrator Dashboard → Active Workflows
- Which phase is slow?
- Any agents stuck?
- Quality gates failing repeatedly?
```

2. **Common Bottlenecks**:

**Bottleneck 1: Implementation Phase**
```
Normal: 60 min
Actual: 120 min

Causes:
- Complex requirements discovered
- Integration issues
- Database migration problems

Fix:
- Review requirements
- Check for blockers
- Provide additional context
```

**Bottleneck 2: Quality Phase**
```
Normal: 30 min
Actual: 90 min

Causes:
- Test failures
- TypeScript errors
- Coverage too low

Fix:
- Check test output
- Run type-check locally
- Review code quality
```

**Bottleneck 3: Validation Phase**
```
Normal: 10 min
Actual: 45 min

Causes:
- Build failures
- Environment issues
- Missing dependencies

Fix:
- Run build locally
- Check environment variables
- Verify dependencies installed
```

---

### Issue 2: Agent Response Slow

**Symptom**: Agent takes >5 min to respond

**Diagnosis**:

**Check Agent Utilization**:
```
Orchestrator Dashboard → Agent Utilization
- Is agent overloaded?
- Are there queued tasks?
```

**Possible Causes**:
1. Multiple workflows running
2. Large codebase analysis
3. External API delays
4. System resource constraints

**Solutions**:
1. Wait for current tasks to complete
2. Reduce parallel workflow count
3. Increase timeout limits
4. Check system resources

---

## Agent Selection Problems

### Issue 1: Wrong Agent Selected

**Symptom**: Suboptimal agent choice for task

**Examples**:

**Example 1: Frontend Task → Full-Stack Dev**
```
Task: "Add loading spinner"
Expected: frontend-specialist
Actual: full-stack-dev

Cause: Ambiguous description
Fix: "Add loading spinner to dashboard (UI only)"
```

**Example 2: B2B Feature → Frontend Specialist**
```
Task: "Create team management interface"
Expected: full-stack-dev (B2B = always full-stack)
Actual: frontend-specialist

Cause: Missing "B2B" keyword
Fix: "Create B2B team management interface"
```

**Example 3: Performance → Bug Hunter**
```
Task: "Dashboard is slow"
Expected: performance-optimizer
Actual: bug-hunter-agent

Cause: Vague description
Fix: "Optimize dashboard performance - reduce load time from 8s to 2s"
```

**Solution Pattern**:
```
Add specific keywords:
- B2B features: Include "B2B", "enterprise", "multi-user"
- Performance: Include "slow", "optimize performance", "speed up"
- Frontend: Include "UI", "component", "styling"
- Backend: Include "API", "endpoint", "server logic"
```

---

### Issue 2: Too Few Agents (Underestimation)

**Symptom**: Complex feature gets single agent

**Example**:
```
Task: "Implement payment system"
Selected: integration-specialist only
Missing: backend (database), frontend (UI), testing

Cause: Generic description
Fix: "Implement complete Stripe payment system:
      - Backend: Stripe API integration, webhook handling
      - Database: Payment transactions, customer payment methods
      - Frontend: Payment form, transaction history
      - Admin: Payment management, refunds
      - Testing: Integration tests, webhook tests"
```

---

## Workflow Execution Issues

### Issue 1: Workflow Stuck at Checkpoint

**Symptom**: Workflow not progressing past specific checkpoint

**Diagnosis**:

**Checkpoint 1: Planning Complete**
```
Status: Waiting for approval

Action: Review user stories and approve to proceed
```

**Checkpoint 2: Implementation Complete**
```
Status: Blocked

Possible Issues:
- Code not compiling
- Dependencies missing
- API integration failing

Fix: Check error logs, resolve blocking issues
```

**Checkpoint 3: Quality Checks Complete**
```
Status: Quality gate failing

Fix: See "Quality Gate Failures" section above
```

**Checkpoint 4: Staging Validation**
```
Status: Deployment failed

Fix: Check build logs, environment variables
```

---

### Issue 2: Parallel Execution Not Working

**Symptom**: Tasks running sequentially instead of parallel

**Diagnosis**:

**Check Workflow Plan**:
```yaml
# Expected (parallel)
Phase 3:
  - testing-agent (parallel_group: quality)
  - code-reviewer (parallel_group: quality)
  - documentation-agent (parallel_group: quality)

# Actual (sequential)
Phase 3:
  - testing-agent
Phase 4:
  - code-reviewer
Phase 5:
  - documentation-agent
```

**Cause**: Dependencies incorrectly set

**Fix**: Dependencies should reference same parent step
```yaml
testing-agent:
  dependencies: [2]  # Depends on step 2
  parallel_group: quality

code-reviewer:
  dependencies: [2]  # Same dependency
  parallel_group: quality
```

---

## Emergency Procedures

### Emergency 1: Abort Workflow

**When**: Critical issue requires immediate stop

**Steps**:
1. Open orchestrator dashboard
2. Locate active workflow
3. Click "Abort Workflow" button
4. Confirm abort action
5. Review partial changes
6. Roll back if needed

**Rollback Procedure**:
```bash
# Rollback database migrations
npm run db:rollback

# Rollback code changes
git reset --hard HEAD~1

# Verify system state
npm run type-check
npm test
```

---

### Emergency 2: Quality Gate Override

**When**: Non-critical gate blocking urgent deployment

**WARNING**: Use sparingly, document reason

**Steps**:
1. Document why override is needed
2. Create override exception ticket
3. Skip gate with approval
4. Schedule fix for skipped gate
5. Monitor production closely

**Example**:
```
Gate: Documentation (warning only)
Reason: Urgent production bug fix
Approval: Tech Lead approved
Plan: Add documentation in next deployment
Ticket: #1234
```

---

### Emergency 3: Workflow Recovery

**When**: Workflow crashed mid-execution

**Steps**:
1. Identify crash point (check logs)
2. Determine recovery strategy:
   - **Restart from beginning**: Small workflows
   - **Resume from checkpoint**: Large workflows
3. Fix underlying issue
4. Resume or restart workflow
5. Monitor closely

**Resume from Checkpoint**:
```
Crashed at: Phase 3 (Quality)
Completed: Phase 1 (Planning), Phase 2 (Implementation)

Recovery:
1. Keep completed work
2. Resume from Phase 3
3. Re-run quality checks
4. Continue to completion
```

---

## Getting Help

### Diagnostic Information to Collect

When reporting issues:

1. **Task Description**: Exact text provided
2. **Expected Behavior**: What should happen
3. **Actual Behavior**: What actually happened
4. **Orchestrator Response**: Analysis, agent selection, workflow plan
5. **Error Messages**: Complete error output
6. **Dashboard Screenshot**: Current workflow status
7. **Environment**: Development/staging/production
8. **Recent Changes**: Any related changes made

### Support Resources

1. **Documentation**:
   - [Usage Guide](./ORCHESTRATOR_USAGE_GUIDE.md)
   - [Best Practices](./ORCHESTRATOR_BEST_PRACTICES.md)
   - [Quick Reference](./ORCHESTRATOR_QUICK_REFERENCE.md)

2. **Dashboard**: `/admin/orchestrator` (when integrated)

3. **Skills**:
   - agent-selector
   - workflow-orchestrator

---

## Appendix: Error Code Reference

| Code | Meaning | Action |
|------|---------|--------|
| ORG-001 | Task analysis failed | Provide more context |
| ORG-002 | Low confidence score | Be more specific |
| ORG-003 | No suitable agent | Check task description |
| ORG-004 | Workflow planning failed | Review dependencies |
| ORG-005 | Quality gate blocked | Fix underlying issue |
| ORG-006 | Checkpoint timeout | Review workflow progress |
| ORG-007 | Agent unavailable | Wait or retry later |
| ORG-008 | Deployment failed | Check build and environment |

---

**Document Version**: 1.0.0
**Created**: 2025-10-20
**Status**: ✅ Complete
**Maintained By**: CircleTel Development Team
