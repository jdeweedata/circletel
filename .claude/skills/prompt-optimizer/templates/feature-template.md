# Feature Request Template

Use this template to structure feature requests for CircleTel.

## Objective
[One clear sentence describing what you want to build]

## Context
- **Current state**: [What exists now in the codebase]
- **Desired state**: [What should exist after this feature is implemented]
- **Affected systems**: [Which parts of CircleTel: Auth, Orders, Payments, Dashboard, etc.]
- **Related files**: [Key files that will be modified or created]
  - `path/to/file1.tsx`
  - `path/to/file2.ts`

## Requirements
1. [Functional requirement 1]
2. [Functional requirement 2]
3. [Functional requirement 3]
4. [Non-functional requirement: performance, security, etc.]

## Constraints
- **Technical**: [Tech stack limitations, compatibility requirements]
- **Business**: [Business rules, compliance requirements]
- **Time/Scope**: [Timeline, MVP vs full implementation]
- **Security**: [Authentication, authorization, data protection]

## Acceptance Criteria
- [ ] [Testable criterion 1 - can be verified]
- [ ] [Testable criterion 2 - measurable outcome]
- [ ] [Testable criterion 3 - observable behavior]
- [ ] Type check passes: `npm run type-check`
- [ ] Build succeeds: `npm run build:memory`
- [ ] Manual testing completed

## CircleTel Patterns to Follow
- [Reference to CLAUDE.md section - e.g., "Next.js 15 API Routes pattern"]
- [Specific architectural pattern - e.g., "Use createClient() with service role"]
- [UI/UX pattern - e.g., "Follow shadcn/ui component patterns"]
- [Integration pattern - e.g., "HMAC-SHA256 webhook verification"]

## Database Changes (if applicable)
- **New tables**: [Table names and purposes]
- **Modified tables**: [Existing tables to modify]
- **RLS policies**: [Row-level security requirements]
- **Indexes**: [Performance optimization indexes]
- **Migrations**: [Migration approach]

## API Routes (if applicable)
- **New endpoints**: [List endpoints to create]
  - `POST /api/feature/action` - [Purpose]
- **Modified endpoints**: [Existing endpoints to update]
- **Authentication**: [Auth requirements per endpoint]
- **Rate limiting**: [If needed]

## UI/UX (if applicable)
- **New pages**: [Pages to create with routes]
- **New components**: [Reusable components]
- **Design system**: [shadcn/ui components to use]
- **Responsive**: [Mobile, tablet, desktop requirements]
- **Accessibility**: [WCAG compliance, keyboard nav]

## Integrations (if applicable)
- **External APIs**: [Supabase, NetCash, MTN, ZOHO, etc.]
- **Webhooks**: [Webhook endpoints to create]
- **Environment variables**: [New config needed]
- **API keys**: [Third-party services]

## Testing Strategy
- **Unit tests**: [What to test at unit level]
- **Integration tests**: [API integration tests]
- **E2E tests**: [User flows to test]
- **Manual testing**: [Test scenarios]

## Suggested Approach
1. [Step 1 with specific file/action]
   - File: `path/to/file.tsx`
   - Action: [What to do]
2. [Step 2 with specific file/action]
   - File: `path/to/file.ts`
   - Action: [What to do]
3. [Step 3 with database changes]
   - Migration: Create `table_name` table
   - RLS: Add policies for user access
4. [Step 4 with testing]
   - Test: Verify feature works end-to-end

## Dependencies
- [ ] [Prerequisite 1 - must be done first]
- [ ] [Prerequisite 2 - blocks this feature]
- [ ] [Related feature - should be considered]

## Risks and Mitigations
- **Risk 1**: [Potential issue]
  - **Mitigation**: [How to address]
- **Risk 2**: [Potential issue]
  - **Mitigation**: [How to address]

## Success Metrics (Optional)
- [Metric 1: e.g., "Reduce checkout time by 30%"]
- [Metric 2: e.g., "Increase conversion rate by 10%"]
- [Metric 3: e.g., "Achieve <500ms API response time"]

---

**Template Version**: 1.0.0
**Use Case**: New feature implementation in CircleTel
