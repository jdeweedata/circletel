---
name: Prompt Optimizer
description: Transforms user input prompts into structured, context-aware prompts optimized for CircleTel project workflows
version: 1.0.0
dependencies: none
---

# Prompt Optimizer Skill

A specialized skill for optimizing user input prompts into structured, actionable prompts tailored for the CircleTel codebase. Ensures prompts are clear, specific, and aligned with CircleTel's architecture, coding standards, and best practices.

## When This Skill Activates

This skill automatically activates when you:
- Receive vague or ambiguous user requests
- Need to clarify requirements before implementation
- Want to structure a complex multi-step task
- Need to optimize a prompt for better Claude Code performance
- Receive requests that could benefit from CircleTel-specific context

**Keywords**: optimize prompt, clarify, structure, refine, better prompt, clearer, what do you mean, specify, details

## Core Optimization Strategy

### Phase 1: Analyze User Input (1-2 minutes)

#### Step 1.1: Identify Intent

Determine what the user is trying to achieve:
- **Bug Fix**: Fix an error or issue
- **Feature Implementation**: Add new functionality
- **Code Refactor**: Improve existing code
- **Investigation**: Understand how something works
- **Documentation**: Create or update docs
- **Deployment**: Deploy or configure environment
- **Optimization**: Improve performance or efficiency
- **Testing**: Write or fix tests

#### Step 1.2: Extract Key Information

Parse the user input for:
- **Action verbs**: fix, add, update, investigate, optimize
- **Target components**: files, functions, pages, APIs
- **Context clues**: error messages, specific behaviors
- **Constraints**: time, scope, dependencies
- **Success criteria**: what "done" looks like

#### Step 1.3: Identify Missing Information

Common gaps in user prompts:
- [ ] Which specific file/component?
- [ ] What is the expected behavior?
- [ ] What is the current behavior (for bugs)?
- [ ] Any error messages or logs?
- [ ] Scope of changes (minimal vs comprehensive)?
- [ ] Any constraints (performance, compatibility)?
- [ ] Success criteria or acceptance criteria?

### Phase 2: Apply CircleTel Context (2-3 minutes)

#### Step 2.1: Map to CircleTel Architecture

Identify relevant CircleTel systems:
- **Authentication**: Customer, Admin, or Partner auth flow?
- **Database**: Which tables? RLS policies needed?
- **API Routes**: Next.js 15 API routes? Async params?
- **Components**: UI components, providers, hooks?
- **Services**: Coverage, payments, orders, KYC?
- **Integrations**: Supabase, NetCash, MTN, ZOHO, Didit?
- **Deployment**: Vercel, staging vs production?

#### Step 2.2: Reference CircleTel Patterns

Check CLAUDE.md for established patterns:
- **TypeScript Patterns**: Next.js 15 async params, Supabase clients
- **Common Debugging Patterns**: Infinite loading, RLS issues, memory
- **File Organization Rules**: Where should files go?
- **Import Conventions**: Use @ alias, organized imports
- **Brand Guidelines**: Colors, typography, component patterns
- **Memory Management**: Use :memory variants for large operations

#### Step 2.3: Identify Dependencies

What else needs to happen?
- **Database migrations**: Schema changes, RLS policies, indexes?
- **Type definitions**: TypeScript types need updating?
- **API routes**: New endpoints or modifications?
- **Environment variables**: New config needed?
- **Tests**: E2E tests, integration tests?
- **Documentation**: CLAUDE.md, README, docs/?

### Phase 3: Structure the Prompt (3-5 minutes)

#### Step 3.1: Use Standard Template

Transform user input into structured format:

```markdown
## Objective
[Clear one-sentence goal]

## Context
- Current state: [What exists now]
- Desired state: [What should exist after]
- Affected systems: [Which parts of CircleTel]
- Related files: [Key files involved]

## Requirements
1. [Specific requirement 1]
2. [Specific requirement 2]
3. [Specific requirement 3]

## Constraints
- [Technical constraint 1]
- [Business constraint 2]
- [Time/scope constraint 3]

## Acceptance Criteria
- [ ] [Testable criterion 1]
- [ ] [Testable criterion 2]
- [ ] [Testable criterion 3]

## CircleTel Patterns to Follow
- [Reference to CLAUDE.md section]
- [Specific pattern or convention]
- [Integration pattern]

## Suggested Approach
1. [Step 1 with specific file/action]
2. [Step 2 with specific file/action]
3. [Step 3 with specific file/action]
```

#### Step 3.2: Add Specific File References

Include exact file paths when known:
- `app/dashboard/page.tsx` (not "the dashboard page")
- `lib/coverage/aggregation-service.ts` (not "the coverage service")
- `components/providers/CustomerAuthProvider.tsx` (not "the auth provider")

Use line numbers for large files:
- `components/providers/CustomerAuthProvider.tsx:64-76` (specific section)

#### Step 3.3: Include Error Context

For bug fixes, add:
- **Error message**: Full text of error
- **Stack trace**: If available
- **Reproduction steps**: Exact sequence to trigger bug
- **Environment**: Browser, Node version, deployment
- **Logs**: Console logs, API logs, database logs

### Phase 4: Validate and Refine (1-2 minutes)

#### Step 4.1: SMART Check

Ensure prompt is:
- **Specific**: Exact files, functions, behaviors
- **Measurable**: Clear success criteria
- **Achievable**: Realistic scope
- **Relevant**: Aligned with CircleTel goals
- **Time-bound**: Clear scope boundaries

#### Step 4.2: Completeness Check

Verify prompt includes:
- [ ] Clear objective
- [ ] Sufficient context
- [ ] Specific requirements
- [ ] Constraints and limitations
- [ ] Acceptance criteria
- [ ] CircleTel-specific patterns
- [ ] Suggested approach (if complex)

#### Step 4.3: Clarify Ambiguities

If still unclear, ask targeted questions:

**For Features**:
- "Should this use the existing [component] or create a new one?"
- "Which authentication context: customer, admin, or partner?"
- "Should this include database migrations or just frontend?"

**For Bugs**:
- "Can you provide the full error message?"
- "What were you trying to do when this occurred?"
- "Does this happen on all pages or just [specific page]?"

**For Refactors**:
- "What is the primary goal: performance, readability, or maintainability?"
- "Should this maintain backward compatibility?"
- "Are there specific files you want refactored or the entire feature?"

## Prompt Optimization Templates

### Template 1: Feature Request

**User Input (Vague)**:
```
"Add a search feature to the admin panel"
```

**Optimized Prompt**:
```markdown
## Objective
Add a global search feature to the admin panel that allows admins to search across orders, customers, and partners.

## Context
- Current state: Admin panel has separate pages for orders, customers, partners with no unified search
- Desired state: Search bar in admin header that searches all entities and shows results in a unified view
- Affected systems: Admin UI, API routes, database queries
- Related files:
  - `app/admin/layout.tsx` (for search bar placement)
  - `app/api/admin/search/route.ts` (new API endpoint)
  - `components/admin/GlobalSearch.tsx` (new component)

## Requirements
1. Search input in admin panel header (always visible)
2. Real-time search across orders, customers, partners
3. Debounced API calls (300ms)
4. Results grouped by entity type
5. Click result to navigate to detail page
6. Keyboard navigation (arrow keys, Enter)

## Constraints
- Must respect RBAC permissions (user only sees entities they have access to)
- Search query must be performant (<500ms response time)
- UI must match existing admin panel design (Tailwind, shadcn/ui)
- Must work on mobile (responsive)

## Acceptance Criteria
- [ ] Search bar visible in admin header on all admin pages
- [ ] Typing in search triggers API call after 300ms delay
- [ ] Results show grouped by: Orders, Customers, Partners
- [ ] Clicking result navigates to detail page
- [ ] No results state displays helpful message
- [ ] RBAC filtering applied to results
- [ ] Type check passes: `npm run type-check`
- [ ] Mobile responsive (tested on 375px width)

## CircleTel Patterns to Follow
- Use `createClient()` with service role for API route
- Apply RBAC filtering using `lib/rbac/permissions.ts`
- Use shadcn/ui Command component for search UI
- Follow Next.js 15 async params pattern for API route
- Add to admin sidebar navigation

## Suggested Approach
1. Create `components/admin/GlobalSearch.tsx` with shadcn/ui Command
2. Add search input to `app/admin/layout.tsx` header
3. Create API route `app/api/admin/search/route.ts`
4. Implement RBAC filtering for search results
5. Add keyboard navigation (Ctrl+K to open)
6. Test with different RBAC roles
```

### Template 2: Bug Fix

**User Input (Vague)**:
```
"Dashboard not loading"
```

**Optimized Prompt**:
```markdown
## Objective
Fix the customer dashboard infinite loading state that occurs after login.

## Context
- Current state: User logs in successfully but dashboard shows "Loading..." indefinitely
- Error: No console errors, just infinite loading spinner
- Affected systems: Customer authentication, dashboard data fetching
- Related files:
  - `app/dashboard/page.tsx`
  - `components/providers/CustomerAuthProvider.tsx`
  - `app/api/dashboard/summary/route.ts`

## Error Details
- **Symptom**: Dashboard stuck on loading spinner
- **Reproduction**:
  1. Navigate to /auth/login
  2. Enter credentials: jeffrey.de.wee@circletel.co.za / password
  3. After successful login, redirected to /dashboard
  4. Loading spinner shows indefinitely, no data appears
- **Environment**:
  - Browser: Chrome 120
  - Local: npm run dev:memory
  - Network: No failed requests in Network tab
- **Console**: No errors or warnings

## Requirements
1. Identify root cause of infinite loading
2. Fix loading state management
3. Ensure error handling is comprehensive
4. Add proper finally block for loading state
5. Test both success and error scenarios

## Constraints
- Must not break existing authentication flow
- Should maintain current UI/UX when working
- Fix should follow CircleTel patterns (see CLAUDE.md)
- No changes to database schema

## Acceptance Criteria
- [ ] Dashboard loads successfully after login
- [ ] Loading spinner disappears after data fetch
- [ ] Error states show appropriate messages
- [ ] No infinite loops or re-renders
- [ ] Console shows no errors or warnings
- [ ] Type check passes: `npm run type-check`
- [ ] Manual test: Login → Dashboard loads within 3 seconds

## CircleTel Patterns to Follow
- Pattern: Infinite Loading Fix (CLAUDE.md Common Debugging Patterns)
- Reference: `components/providers/CustomerAuthProvider.tsx:64-76`
- Always use finally block to set loading=false
- Add try/catch for error handling

## Suggested Approach
1. Check `app/dashboard/page.tsx` for missing finally block
2. Verify `CustomerAuthProvider` has proper error handling
3. Add console.log to track loading state changes
4. Test API route `/api/dashboard/summary` response
5. Ensure loading state is set to false in all code paths
```

### Template 3: Investigation

**User Input (Vague)**:
```
"How does the payment system work?"
```

**Optimized Prompt**:
```markdown
## Objective
Provide a comprehensive overview of the CircleTel payment system architecture, focusing on NetCash Pay Now integration and payment flow.

## Context
- CircleTel uses NetCash Pay Now gateway for payments
- Supports 20+ payment methods (cards, EFT, Instant EFT, etc.)
- Two payment flows: inline form and redirect
- Related to order creation, invoicing, and billing

## Investigation Scope
1. **Payment Gateway Integration**
   - NetCash Pay Now setup and configuration
   - Supported payment methods
   - API endpoints and webhooks

2. **Payment Flows**
   - Inline payment form (`InlinePaymentForm.tsx`)
   - Redirect flow (`PaymentStage.tsx`)
   - Demo page functionality

3. **Backend Processing**
   - Payment webhook handling
   - Order creation after payment
   - Invoice generation

4. **Database Schema**
   - Payment-related tables
   - Payment status tracking
   - Transaction records

## Files to Review
- `components/checkout/InlinePaymentForm.tsx` - Modern inline payment UI
- `components/order/stages/PaymentStage.tsx` - Existing redirect flow
- `app/order/payment/demo/page.tsx` - Payment method showcase
- `lib/payments/payment-processor.ts` - Backend payment processing
- `app/api/payments/webhook/route.ts` - NetCash webhook handler
- Database tables: `payment_transactions`, `invoices`

## Acceptance Criteria
- [ ] Understand NetCash Pay Now integration
- [ ] Know the difference between inline and redirect flows
- [ ] Understand webhook signature verification (HMAC-SHA256)
- [ ] Know which payment methods are supported
- [ ] Understand order creation after successful payment
- [ ] Can explain payment status tracking

## Suggested Approach
1. Read `InlinePaymentForm.tsx` to understand modern payment UI
2. Review NetCash integration in `payment-processor.ts`
3. Examine webhook handling in `/api/payments/webhook/route.ts`
4. Check database schema for payment-related tables
5. Summarize payment flow from user perspective
6. Document any unclear or missing implementations
```

### Template 4: Refactor

**User Input (Vague)**:
```
"Clean up the admin code"
```

**Optimized Prompt**:
```markdown
## Objective
Refactor admin panel codebase to improve code organization, reduce duplication, and follow CircleTel patterns consistently.

## Context
- Admin panel has grown organically
- Some components duplicate logic (table filtering, pagination)
- Inconsistent use of RBAC permission checks
- Mix of old and new patterns (some components not using shadcn/ui)
- Goal: Make admin panel more maintainable

## Refactor Scope
1. **Component Consolidation**
   - Create shared table components (reusable filters, sorting, pagination)
   - Standardize admin page layouts
   - Extract common RBAC permission checks

2. **Code Organization**
   - Ensure all files follow CLAUDE.md File Organization Rules
   - Standardize import patterns (@ alias, organized by category)
   - Remove unused imports and dead code

3. **Pattern Consistency**
   - All API routes use Next.js 15 async params pattern
   - All Supabase queries use service role client correctly
   - All forms use shadcn/ui components

## Files in Scope
- `app/admin/**/*.tsx` - All admin pages
- `components/admin/**/*.tsx` - All admin components
- `app/api/admin/**/*.ts` - All admin API routes
- `hooks/useAdminAuth.ts` - Admin auth hook

## Constraints
- Must not break existing functionality
- All changes must pass type check
- Maintain backward compatibility with existing data
- No database schema changes
- Must preserve RBAC behavior

## Acceptance Criteria
- [ ] All admin pages follow consistent layout pattern
- [ ] Table components use shared reusable components
- [ ] RBAC checks use `useAdminAuth()` hook consistently
- [ ] All imports use @ alias (no relative imports)
- [ ] All API routes use Next.js 15 async params
- [ ] Type check passes: `npm run type-check`
- [ ] Build succeeds: `npm run build:memory`
- [ ] Manual test: All admin features still work

## CircleTel Patterns to Follow
- File Organization Rules (CLAUDE.md)
- Import Conventions (CLAUDE.md)
- Next.js 15 API Routes pattern (CLAUDE.md TypeScript Patterns)
- RBAC Permission System (lib/rbac/permissions.ts)

## Suggested Approach
1. Audit admin codebase for common patterns
2. Create shared components:
   - `AdminTableFilter.tsx` - Reusable filter component
   - `AdminPagination.tsx` - Reusable pagination
   - `AdminLayout.tsx` - Standard page layout
3. Update all admin pages to use shared components
4. Refactor API routes to Next.js 15 pattern
5. Standardize RBAC checks using `useAdminAuth()`
6. Run type check and fix any errors
7. Test each admin page manually
```

## CircleTel-Specific Optimization Patterns

### Pattern 1: Add CircleTel Context Automatically

When optimizing prompts, always reference:
- **CLAUDE.md sections**: TypeScript patterns, debugging patterns, file organization
- **Architecture**: Multi-layer coverage, order state, payment system, RBAC
- **Recent updates**: Check `docs/RECENT_CHANGES.md` for latest features
- **Agent-OS specs**: Reference relevant specs in `agent-os/specs/`

### Pattern 2: Specify File Paths

Replace vague references with exact paths:
- ❌ "the dashboard" → ✅ `app/dashboard/page.tsx`
- ❌ "the auth provider" → ✅ `components/providers/CustomerAuthProvider.tsx`
- ❌ "the API" → ✅ `app/api/dashboard/summary/route.ts`

### Pattern 3: Include Line References

For large files, specify line ranges:
- ✅ `components/providers/CustomerAuthProvider.tsx:64-76`
- ✅ `lib/coverage/aggregation-service.ts:150-200`

### Pattern 4: Map to CircleTel Systems

Identify which CircleTel subsystem is affected:
- **Authentication**: Customer, Admin, or Partner?
- **Orders**: Consumer orders or B2B contracts?
- **Payments**: NetCash inline or redirect flow?
- **Coverage**: MTN WMS, Consumer API, or provider APIs?
- **Dashboard**: Customer dashboard or admin panel?

### Pattern 5: Reference Established Patterns

Point to CLAUDE.md patterns:
- "Follow the Next.js 15 async params pattern (CLAUDE.md TypeScript Patterns)"
- "Use the infinite loading fix pattern (CLAUDE.md Common Debugging Patterns)"
- "Follow memory management rules (CLAUDE.md Memory Management)"

### Pattern 6: Include Testing Requirements

Always add testing criteria:
- [ ] Type check passes: `npm run type-check`
- [ ] Build succeeds: `npm run build:memory`
- [ ] Manual testing checklist
- [ ] E2E tests pass (if applicable)

## Validation Framework

### Question Templates for Clarification

#### For Features
```
Before I optimize this prompt, I need to clarify a few things:

1. **Scope**: Should this be a minimal implementation or comprehensive feature?
2. **Authentication**: Which auth context: customer, admin, or partner?
3. **Database**: Will this require new tables or modifications to existing schema?
4. **UI**: Should this match existing CircleTel patterns or introduce new design?
5. **Integration**: Does this integrate with external APIs (MTN, NetCash, ZOHO)?
6. **Testing**: What level of testing: manual only, or E2E tests required?
```

#### For Bugs
```
To better structure this debugging task, I need:

1. **Error Message**: Can you provide the full error text?
2. **Reproduction**: What exact steps trigger this bug?
3. **Environment**: Is this local dev, staging, or production?
4. **Frequency**: Does this happen every time or intermittently?
5. **Recent Changes**: Was anything deployed recently before this started?
6. **User Impact**: How many users are affected? Is this blocking?
```

#### For Refactors
```
To scope this refactor properly, I need to understand:

1. **Primary Goal**: Performance, maintainability, readability, or all three?
2. **Scope**: Specific files or entire subsystem?
3. **Breaking Changes**: Is backward compatibility required?
4. **Timeline**: Is this urgent or can we do it incrementally?
5. **Testing**: What level of testing is expected?
6. **Dependencies**: Will this affect other parts of the codebase?
```

## Quick Reference: Prompt Quality Checklist

Before finalizing an optimized prompt, verify:

### Clarity (5/5)
- [ ] Objective is one clear sentence
- [ ] No ambiguous terms or vague references
- [ ] Specific files and components named
- [ ] Technical terms are accurate
- [ ] Success criteria is measurable

### Completeness (5/5)
- [ ] Includes context (current state, desired state)
- [ ] Lists requirements explicitly
- [ ] Specifies constraints
- [ ] Defines acceptance criteria
- [ ] References CircleTel patterns

### CircleTel Alignment (5/5)
- [ ] Maps to CircleTel architecture
- [ ] References CLAUDE.md patterns
- [ ] Specifies correct file locations
- [ ] Follows CircleTel conventions
- [ ] Includes testing requirements

### Actionability (3/3)
- [ ] Suggests concrete approach
- [ ] Includes file paths and line numbers
- [ ] Prioritizes steps logically

## Resources

- **Templates**: See `templates/` for optimization templates
- **Examples**: See `examples/` for before/after prompt examples
- **CLAUDE.md**: CircleTel-specific patterns and conventions

## Best Practices

1. **Always reference CLAUDE.md** - CircleTel has established patterns
2. **Be specific with file paths** - Avoid vague references
3. **Include testing criteria** - Always specify how to validate success
4. **Map to architecture** - Identify which CircleTel subsystem is affected
5. **Ask clarifying questions** - Better to ask than assume
6. **Use templates** - Start with a template and customize
7. **Validate completeness** - Use the checklist before finalizing

---

**Version**: 1.0.0
**Last Updated**: 2025-11-10
**Maintained By**: CircleTel Development Team
**Purpose**: Optimize user prompts for maximum clarity and CircleTel alignment
