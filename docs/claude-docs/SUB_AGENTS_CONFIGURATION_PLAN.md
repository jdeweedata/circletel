# CircleTel Sub-Agents Configuration Plan

> **Purpose**: Configure specialized Claude Code sub-agents for autonomous, multi-step task execution across CircleTel's development workflow.

**Date**: 2025-10-20
**Status**: Planning Phase
**Based On**: [Claude Code Sub-Agents Documentation](https://docs.claude.com/en/docs/claude-code/sub-agents)

---

## What Are Sub-Agents?

**Sub-agents** are specialized AI agents that can autonomously handle complex, multi-step tasks without human intervention. Unlike skills (which are procedural workflows), sub-agents make intelligent decisions, adapt to changing conditions, and complete entire features independently.

### Key Differences: Skills vs Sub-Agents

| Feature | Skills | Sub-Agents |
|---------|--------|------------|
| **Execution** | Scripted workflow | Autonomous decision-making |
| **Complexity** | Simple, linear tasks | Complex, multi-step features |
| **Adaptability** | Fixed steps | Adapts to errors/changes |
| **Duration** | Minutes | Hours to days |
| **Human Input** | Frequent checkpoints | Minimal (start/end only) |

**When to Use**:
- **Skills**: Deployments, migrations, reports, data imports
- **Sub-Agents**: Full feature implementation, refactoring, complex debugging, architecture changes

---

## CircleTel Sub-Agent Architecture

### Proposed Sub-Agents (12 Total)

```
CircleTel Sub-Agents System
│
├── 🚀 Feature Development (4 agents)
│   ├── full-stack-dev              ⭐ NEW - Complete feature implementation
│   ├── frontend-specialist         ⭐ NEW - UI/UX focused development
│   ├── backend-specialist          ⭐ NEW - API/database focused development
│   └── integration-specialist      ⭐ NEW - Third-party integrations
│
├── 🎯 Code Quality & Refactoring (3 agents)
│   ├── refactoring-agent           ⭐ NEW - Safe, automated refactoring
│   ├── testing-agent               ⭐ NEW - Comprehensive test generation
│   └── performance-optimizer       ⭐ NEW - Performance profiling and optimization
│
├── 📊 Business & Operations (3 agents)
│   ├── product-manager-agent       ⭐ NEW - Requirements → user stories
│   ├── data-analyst-agent          ⭐ NEW - Analytics and reporting
│   └── devops-agent                ⭐ NEW - Deployment and infrastructure
│
└── 🛠️ Maintenance & Support (2 agents)
    ├── bug-hunter-agent            ⭐ NEW - Debugging and bug fixes
    └── documentation-agent         ⭐ NEW - Auto-documentation generation
```

---

## Sub-Agent Configurations

### 1. full-stack-dev ⭐ NEW

**Purpose**: Autonomous implementation of complete features from specification to deployment

**Configuration**:
```yaml
name: full-stack-dev
description: Implements complete features (frontend + backend + database) autonomously
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task (for sub-tasks)
proactive: true
auto_invoke:
  - "implement feature"
  - "build complete feature"
  - "create new feature"
```

**Capabilities**:
1. **Requirements Analysis**
   - Parse feature specification
   - Identify frontend, backend, database needs
   - Plan implementation steps

2. **Database Layer**
   - Generate migrations with rollbacks
   - Update TypeScript types
   - Validate schema changes

3. **Backend Layer**
   - Create API routes with validation
   - Add error handling
   - Generate API tests

4. **Frontend Layer**
   - Build React components
   - Apply CircleTel design system
   - Add RBAC permission gates
   - Create E2E tests

5. **Integration**
   - Connect all layers
   - Test end-to-end flow
   - Generate documentation
   - Create pull request

**Example Workflow**:
```
User: "Implement customer referral program feature"

Sub-Agent Actions:
1. ✅ Analyze requirement → Identify: referral codes, tracking, rewards
2. ✅ Generate migration: referral_codes table, referral_rewards table
3. ✅ Create API routes: POST /api/referrals, GET /api/referrals/stats
4. ✅ Build UI: Referral dashboard component, code sharing modal
5. ✅ Add RBAC: customer:view_referrals permission
6. ✅ Generate tests: API tests, E2E Playwright test
7. ✅ Run deployment-check skill
8. ✅ Create PR with documentation
9. ✅ Report completion with testing instructions
```

**Success Criteria**:
- ✅ All layers implemented correctly
- ✅ TypeScript validation passes
- ✅ Tests included and passing
- ✅ RBAC permissions configured
- ✅ Documentation complete
- ✅ Deployment-ready PR created

---

### 2. frontend-specialist ⭐ NEW

**Purpose**: UI/UX focused development with CircleTel design system expertise

**Configuration**:
```yaml
name: frontend-specialist
description: Builds UI components, pages, and user experiences following CircleTel design system
tools:
  - Read
  - Write
  - Edit
  - mcp__playwright__* (browser automation)
  - mcp__ide__getDiagnostics
proactive: true
auto_invoke:
  - "create UI"
  - "build component"
  - "frontend implementation"
  - "user interface"
```

**Specializations**:
1. **Component Development**
   - shadcn/ui integration
   - Tailwind CSS styling
   - Accessibility compliance (WCAG 2.1 AA)
   - Responsive design (mobile-first)

2. **State Management**
   - React Query for server state
   - Zustand for client state
   - Form handling with react-hook-form + Zod

3. **Design System Enforcement**
   - CircleTel color palette
   - Typography standards
   - Spacing and layout consistency
   - Component reusability

4. **Testing**
   - Visual regression testing
   - Accessibility testing
   - Cross-browser compatibility
   - Responsive design validation

**Example Workflow**:
```
User: "Create a mobile-responsive customer dashboard"

Sub-Agent Actions:
1. ✅ Analyze dashboard requirements
2. ✅ Design component hierarchy
3. ✅ Build reusable components (cards, charts, stats)
4. ✅ Implement responsive layout (mobile/tablet/desktop)
5. ✅ Add accessibility attributes (ARIA labels, keyboard nav)
6. ✅ Apply CircleTel design system
7. ✅ Test with Playwright (mobile/desktop viewports)
8. ✅ Validate with screen reader
9. ✅ Generate Storybook stories
10. ✅ Create usage documentation
```

---

### 3. backend-specialist ⭐ NEW

**Purpose**: API development, database design, and server-side logic

**Configuration**:
```yaml
name: backend-specialist
description: Builds APIs, database schemas, and server-side business logic
tools:
  - Read
  - Write
  - Edit
  - Bash
  - mcp__supabase__* (database operations)
proactive: true
auto_invoke:
  - "create API"
  - "database schema"
  - "backend implementation"
  - "server-side logic"
```

**Specializations**:
1. **Database Design**
   - Schema normalization
   - Index optimization
   - RLS policy creation
   - Migration generation

2. **API Development**
   - RESTful design
   - Input validation (Zod schemas)
   - Error handling
   - Rate limiting

3. **Business Logic**
   - Service layer patterns
   - Transaction management
   - Caching strategies
   - Background jobs

4. **Security**
   - Authentication (Supabase Auth)
   - Authorization (RBAC)
   - Input sanitization
   - SQL injection prevention

**Example Workflow**:
```
User: "Create order management API with inventory tracking"

Sub-Agent Actions:
1. ✅ Design database schema (orders, order_items, inventory)
2. ✅ Generate migrations with constraints
3. ✅ Create RLS policies (customers see own orders, admins see all)
4. ✅ Build API routes:
   - POST /api/orders (create order)
   - GET /api/orders/:id (fetch order)
   - PATCH /api/orders/:id (update status)
   - GET /api/orders (list with pagination)
5. ✅ Add inventory tracking logic
6. ✅ Implement error handling (out of stock, invalid items)
7. ✅ Generate API tests (happy path + edge cases)
8. ✅ Add API documentation (OpenAPI/Swagger)
9. ✅ Performance test (load testing)
```

---

### 4. integration-specialist ⭐ NEW

**Purpose**: Third-party API integrations (MTN, Zoho, Strapi, Google Maps, Netcash)

**Configuration**:
```yaml
name: integration-specialist
description: Handles third-party API integrations with error handling and fallbacks
tools:
  - Read
  - Write
  - Edit
  - WebFetch
  - mcp__zoho__* (Zoho integration)
proactive: true
auto_invoke:
  - "integrate API"
  - "third-party integration"
  - "external service"
```

**Specializations**:
1. **API Client Development**
   - HTTP client configuration
   - Authentication (OAuth, API keys)
   - Request/response typing
   - Retry logic with exponential backoff

2. **Error Handling**
   - Graceful degradation
   - Fallback strategies
   - Circuit breaker pattern
   - Error logging and monitoring

3. **Testing**
   - Mock API responses
   - Integration tests
   - Sandbox environment testing
   - Performance monitoring

4. **Documentation**
   - API integration guides
   - Error troubleshooting
   - Rate limit handling
   - Webhook setup

**Example Workflow**:
```
User: "Integrate Netcash payment gateway"

Sub-Agent Actions:
1. ✅ Research Netcash API documentation
2. ✅ Create payment client (/lib/payments/netcash-client.ts)
3. ✅ Add TypeScript types for API responses
4. ✅ Implement payment flow:
   - Initialize payment
   - Handle redirect
   - Process callback
   - Verify transaction
5. ✅ Add error handling (timeout, invalid card, etc.)
6. ✅ Create database tables (payment_transactions)
7. ✅ Build admin UI (payment tracking dashboard)
8. ✅ Test with sandbox environment
9. ✅ Add monitoring (payment success rate, response times)
10. ✅ Generate integration documentation
```

---

### 5. refactoring-agent ⭐ NEW

**Purpose**: Safe, automated code refactoring with comprehensive testing

**Configuration**:
```yaml
name: refactoring-agent
description: Identifies and executes safe refactoring operations
tools:
  - Read
  - Edit
  - Bash
  - Glob
  - Grep
  - mcp__ide__getDiagnostics
proactive: true
auto_invoke:
  - "refactor"
  - "clean up code"
  - "improve code quality"
  - "technical debt"
```

**Refactoring Patterns**:
1. **Code Smells Detection**
   - Duplicated code (DRY violations)
   - Long functions (>50 lines)
   - Complex conditionals (cyclomatic complexity >10)
   - God objects (classes doing too much)

2. **Safe Refactoring Operations**
   - Extract function/component
   - Extract hook (React)
   - Rename variable/function (global search-replace)
   - Simplify conditionals (early returns)
   - Type improvements (remove `any`)

3. **Validation**
   - Run TypeScript validation
   - Run tests before/after
   - Verify no functionality changes
   - Check performance impact

**Example Workflow**:
```
User: "Refactor the coverage checking module"

Sub-Agent Actions:
1. ✅ Analyze coverage module (identify duplicates, complexity)
2. ✅ Create refactoring plan:
   - Extract shared parsing logic → parser-utils.ts
   - Simplify MTN client conditionals
   - Extract hooks from components
3. ✅ Run tests (baseline)
4. ✅ Execute refactoring (step-by-step)
5. ✅ Run TypeScript validation after each step
6. ✅ Run tests again (verify no regressions)
7. ✅ Measure performance (before/after)
8. ✅ Generate refactoring report
```

---

### 6. testing-agent ⭐ NEW

**Purpose**: Comprehensive test generation and coverage improvement

**Configuration**:
```yaml
name: testing-agent
description: Generates unit, integration, and E2E tests to improve coverage
tools:
  - Read
  - Write
  - Edit
  - Bash
  - mcp__playwright__* (E2E testing)
proactive: true
auto_invoke:
  - "generate tests"
  - "improve test coverage"
  - "add tests"
```

**Test Types**:
1. **Unit Tests** (React Testing Library)
   - Component rendering
   - Props validation
   - Event handlers
   - Hooks testing

2. **Integration Tests**
   - API route testing
   - Database operations
   - Service layer testing

3. **E2E Tests** (Playwright)
   - User flows (coverage check → order)
   - Form submissions
   - Authentication flows
   - Payment processing

4. **Coverage Analysis**
   - Line coverage >80%
   - Branch coverage >75%
   - Critical paths 100%

**Example Workflow**:
```
User: "Add tests for customer account page"

Sub-Agent Actions:
1. ✅ Analyze account page code
2. ✅ Identify test scenarios:
   - Renders user info
   - Edits profile
   - Changes password
   - Views billing history
3. ✅ Generate unit tests (component)
4. ✅ Generate API tests (account endpoints)
5. ✅ Generate E2E test (full account management flow)
6. ✅ Run tests and verify pass
7. ✅ Generate coverage report (target: >80%)
8. ✅ Identify untested paths
9. ✅ Add additional tests for gaps
```

---

### 7. product-manager-agent ⭐ NEW

**Purpose**: Transform business requirements into detailed user stories and specifications

**Configuration**:
```yaml
name: product-manager-agent
description: Analyzes requirements and creates user stories with acceptance criteria
tools:
  - Read
  - Write
  - WebFetch (research)
proactive: true
auto_invoke:
  - "create user stories"
  - "requirements analysis"
  - "feature planning"
```

**Capabilities**:
1. **Requirements Gathering**
   - Stakeholder interview questions
   - Competitive analysis
   - User persona identification

2. **User Story Generation**
   - Standard format (As a... I want... So that...)
   - Acceptance criteria (Given/When/Then)
   - Story point estimation
   - Dependency mapping

3. **Specification Creation**
   - Database schema design
   - API endpoint definition
   - UI wireframes (text descriptions)
   - Security requirements

4. **Sprint Planning**
   - Story prioritization (MoSCoW method)
   - Sprint capacity planning
   - Dependency sequencing

**Example Workflow**:
```
User: "Plan B2B multi-user accounts feature"

Sub-Agent Actions:
1. ✅ Analyze requirement (B2B needs: team management, role assignment)
2. ✅ Identify personas (account owner, admin, user)
3. ✅ Generate epic and user stories:
   - Epic: B2B Multi-User Accounts
   - Story 1: Account owner can invite team members
   - Story 2: Admin can assign roles (viewer, editor, admin)
   - Story 3: Users see only permitted data (RBAC)
4. ✅ Add acceptance criteria for each story
5. ✅ Estimate story points
6. ✅ Create technical specification:
   - Database: team_accounts, team_members, team_roles
   - API: POST /api/teams/invite, PATCH /api/teams/members/:id/role
   - Frontend: Team management page, invite modal, role selector
7. ✅ Prioritize stories (P0: invite, P1: roles, P2: bulk operations)
8. ✅ Generate implementation roadmap (3 sprints)
```

---

### 8. data-analyst-agent ⭐ NEW

**Purpose**: Business analytics, reporting, and data visualization

**Configuration**:
```yaml
name: data-analyst-agent
description: Analyzes data, generates reports, and creates dashboards
tools:
  - Read
  - Write
  - Bash
  - mcp__supabase__* (database queries)
proactive: true
auto_invoke:
  - "generate report"
  - "analyze data"
  - "create dashboard"
```

**Capabilities**:
1. **Data Analysis**
   - SQL query generation
   - Statistical analysis
   - Trend identification
   - Anomaly detection

2. **Report Generation**
   - Marketing analytics
   - Sales performance
   - Financial reports
   - Executive summaries

3. **Visualization**
   - Chart selection (bar, line, pie, scatter)
   - Dashboard design
   - KPI cards
   - Export to PDF/Excel

4. **Insights**
   - Actionable recommendations
   - Forecast projections
   - A/B test analysis
   - Segmentation analysis

**Example Workflow**:
```
User: "Analyze Q1 sales performance and identify growth opportunities"

Sub-Agent Actions:
1. ✅ Query sales data (Q1 2025)
2. ✅ Calculate metrics:
   - Total revenue: $X
   - Customer growth: +Y%
   - Average deal size: $Z
   - Top products
3. ✅ Identify trends:
   - Product A sales increased 40% (opportunity)
   - Churn rate increased in Region B (risk)
4. ✅ Generate visualizations:
   - Revenue by month (line chart)
   - Product distribution (pie chart)
   - Regional performance (bar chart)
5. ✅ Create insights report:
   - Recommendation: Focus marketing on Product A
   - Action: Investigate Region B churn causes
6. ✅ Build interactive dashboard (Recharts)
7. ✅ Export to PDF for exec team
```

---

### 9. devops-agent ⭐ NEW

**Purpose**: Deployment automation, infrastructure management, and monitoring

**Configuration**:
```yaml
name: devops-agent
description: Handles deployments, environment configuration, and system monitoring
tools:
  - Bash
  - Read
  - Write
  - mcp__netlify__* (deployment)
  - mcp__supabase__* (database)
proactive: true
auto_invoke:
  - "deploy"
  - "configure environment"
  - "setup infrastructure"
```

**Capabilities**:
1. **Deployment Management**
   - Pre-deployment validation (deployment-check skill)
   - Environment variable management
   - Database migrations
   - Rollback procedures

2. **Infrastructure**
   - Vercel/Netlify configuration
   - Supabase setup
   - CDN optimization
   - SSL/TLS management

3. **Monitoring**
   - Performance metrics (API response times)
   - Error tracking
   - Uptime monitoring
   - Alert configuration

4. **Security**
   - Secrets management
   - Access control (IAM)
   - Security audits
   - Vulnerability scanning

**Example Workflow**:
```
User: "Deploy new payment feature to production"

Sub-Agent Actions:
1. ✅ Run deployment-check skill (TypeScript, build, tests)
2. ✅ Verify environment variables:
   - NETCASH_API_KEY set in Vercel
   - SUPABASE_SERVICE_ROLE_KEY configured
3. ✅ Apply database migrations (payment_transactions table)
4. ✅ Deploy to staging (Netlify preview)
5. ✅ Run E2E tests on staging
6. ✅ Deploy to production (Vercel)
7. ✅ Monitor deployment:
   - Check build logs
   - Verify API health
   - Monitor error rates
8. ✅ Setup alerts (payment failure rate >5%)
9. ✅ Update deployment documentation
```

---

### 10. bug-hunter-agent ⭐ NEW

**Purpose**: Autonomous debugging and bug fix implementation

**Configuration**:
```yaml
name: bug-hunter-agent
description: Investigates bugs, identifies root causes, and implements fixes
tools:
  - Read
  - Edit
  - Bash
  - Grep
  - Glob
  - mcp__ide__getDiagnostics
proactive: true
auto_invoke:
  - "fix bug"
  - "debug issue"
  - "investigate error"
```

**Debugging Process**:
1. **Bug Analysis**
   - Reproduce bug (steps to reproduce)
   - Check error logs
   - Review recent changes (git blame)
   - Identify affected components

2. **Root Cause Investigation**
   - Trace execution flow
   - Check data state
   - Review edge cases
   - Analyze dependencies

3. **Fix Implementation**
   - Implement minimal fix
   - Add error handling
   - Update tests
   - Verify no regressions

4. **Prevention**
   - Add validation
   - Improve error messages
   - Update documentation
   - Add monitoring

**Example Workflow**:
```
User: "Fix: Coverage checker shows 'No packages found' for valid addresses"

Sub-Agent Actions:
1. ✅ Reproduce bug (test with Fish Eagle Cres address)
2. ✅ Check logs (MTN API returning empty results)
3. ✅ Investigate MTN client:
   - Found: Headers missing User-Agent
   - Root cause: Anti-bot protection
4. ✅ Review git history (recent MTN client changes)
5. ✅ Implement fix:
   - Add enhanced headers (User-Agent, Accept-Language)
   - Update MTN client configuration
6. ✅ Test fix (verify packages now returned)
7. ✅ Add regression test (Playwright E2E)
8. ✅ Update MTN client documentation
9. ✅ Add monitoring (alert if MTN API success rate <80%)
10. ✅ Create PR with bug report reference
```

---

### 11. documentation-agent ⭐ NEW

**Purpose**: Automated documentation generation from code and features

**Configuration**:
```yaml
name: documentation-agent
description: Generates and maintains project documentation
tools:
  - Read
  - Write
  - Glob
  - Grep
proactive: true
auto_invoke:
  - "document feature"
  - "generate docs"
  - "update documentation"
```

**Documentation Types**:
1. **Code Documentation**
   - JSDoc comments
   - README files
   - API reference (OpenAPI)
   - Type definitions

2. **Feature Documentation**
   - User guides
   - Admin guides
   - Integration guides
   - Troubleshooting guides

3. **Architecture Documentation**
   - System diagrams
   - Data flow diagrams
   - Deployment architecture
   - Security documentation

4. **Maintenance**
   - Keep docs up-to-date
   - Fix broken links
   - Update screenshots
   - Archive old docs

**Example Workflow**:
```
User: "Document the new referral program feature"

Sub-Agent Actions:
1. ✅ Analyze referral program code:
   - Database schema (referral_codes, referral_rewards)
   - API routes (/api/referrals)
   - UI components (ReferralDashboard, ReferralModal)
2. ✅ Generate user guide:
   - How to generate referral code
   - How to share referral link
   - How to track referrals
   - How to claim rewards
3. ✅ Generate admin guide:
   - How to configure referral rewards
   - How to view referral analytics
   - How to manage fraud
4. ✅ Generate API documentation (OpenAPI):
   - POST /api/referrals (create code)
   - GET /api/referrals/stats (fetch stats)
5. ✅ Add JSDoc comments to code
6. ✅ Create architecture diagram (referral flow)
7. ✅ Add to main documentation index
8. ✅ Generate screenshots (Playwright)
```

---

### 12. performance-optimizer ⭐ NEW

**Purpose**: Performance profiling and optimization

**Configuration**:
```yaml
name: performance-optimizer
description: Profiles application performance and implements optimizations
tools:
  - Read
  - Edit
  - Bash
  - mcp__playwright__* (performance testing)
proactive: false  # Manual invocation for complex optimization
auto_invoke:
  - "optimize performance"
  - "improve speed"
  - "profile performance"
```

**Optimization Areas**:
1. **Frontend Performance**
   - React component optimization (memo, useMemo, useCallback)
   - Bundle size reduction (code splitting)
   - Image optimization (lazy loading)
   - CSS optimization (purge unused)

2. **Backend Performance**
   - Database query optimization (indexes, N+1 queries)
   - API response time reduction (caching)
   - Background job optimization
   - Rate limiting

3. **Infrastructure**
   - CDN configuration
   - Compression (gzip, brotli)
   - Service worker caching
   - Database connection pooling

4. **Profiling**
   - Lighthouse audits
   - React Profiler
   - Database query analysis
   - API response time tracking

**Example Workflow**:
```
User: "Optimize admin dashboard performance"

Sub-Agent Actions:
1. ✅ Run performance audit (Lighthouse)
   - Current score: 65/100
   - Issues: Large bundle, slow API calls, no caching
2. ✅ Analyze bundle size (webpack-bundle-analyzer)
   - Found: Recharts library too large
   - Solution: Dynamic import
3. ✅ Profile React components (React Profiler)
   - Found: Analytics component re-renders unnecessarily
   - Solution: useMemo for chart data
4. ✅ Analyze API calls
   - Found: Dashboard calls 10 APIs sequentially
   - Solution: Parallel requests + caching
5. ✅ Implement optimizations:
   - Code splitting (dynamic imports)
   - Component memoization
   - API request batching
   - Service worker caching
6. ✅ Run performance audit again
   - New score: 92/100 (+27 improvement)
7. ✅ Document optimizations
8. ✅ Setup performance monitoring (alert if score <85)
```

---

## Sub-Agent Invocation Strategies

### Proactive Invocation (Automatic)
Sub-agents with `proactive: true` auto-trigger based on keywords:

```typescript
// User message analysis
if (message.includes("implement feature")) {
  invoke(full-stack-dev)
} else if (message.includes("refactor")) {
  invoke(refactoring-agent)
} else if (message.includes("fix bug")) {
  invoke(bug-hunter-agent)
}
```

### Manual Invocation (Explicit)
```bash
# Invoke specific sub-agent
/agent full-stack-dev
/agent refactoring-agent
/agent testing-agent
```

### Conditional Invocation (Context-Based)
```typescript
// After code change
if (hasLowTestCoverage()) {
  invoke(testing-agent)
}

// Before deployment
if (aboutToDeploy()) {
  invoke(devops-agent)
}

// Complex feature request
if (requiresMultipleLayers()) {
  invoke(full-stack-dev)
}
```

---

## Sub-Agent Collaboration

### Multi-Agent Workflows

**Example**: Implementing a complete feature with quality assurance

```
User: "Implement and deploy customer loyalty program"

Orchestration:
1. product-manager-agent
   - Creates user stories
   - Defines acceptance criteria
   - Generates specification

2. full-stack-dev
   - Implements feature (DB + API + UI)
   - Uses specification from product-manager-agent

3. testing-agent
   - Generates comprehensive tests
   - Ensures >80% coverage

4. refactoring-agent
   - Cleans up implementation
   - Optimizes code quality

5. documentation-agent
   - Generates user guide
   - Creates API documentation

6. devops-agent
   - Runs deployment-check
   - Deploys to production
   - Monitors post-deployment

7. performance-optimizer
   - Profiles new feature
   - Optimizes if needed

Result: Feature goes from idea → production with full quality assurance
```

---

## Implementation Roadmap

### Phase 1: Core Development Agents (Week 1)
- [ ] Configure **full-stack-dev** agent
- [ ] Configure **frontend-specialist** agent
- [ ] Configure **backend-specialist** agent
- [ ] Test with real feature implementation

### Phase 2: Quality & Testing Agents (Week 2)
- [ ] Configure **refactoring-agent**
- [ ] Configure **testing-agent**
- [ ] Configure **bug-hunter-agent**
- [ ] Test with existing codebase

### Phase 3: Business & Operations Agents (Week 3)
- [ ] Configure **product-manager-agent**
- [ ] Configure **data-analyst-agent**
- [ ] Configure **devops-agent**
- [ ] Test with business team

### Phase 4: Specialized Agents (Week 4)
- [ ] Configure **integration-specialist**
- [ ] Configure **performance-optimizer**
- [ ] Configure **documentation-agent**
- [ ] Full system integration testing

---

## Configuration Files

### `.claude/agents/full-stack-dev.yml`
```yaml
name: full-stack-dev
description: Implements complete features autonomously (frontend + backend + database)
version: 1.0.0

tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task

proactive: true
auto_invoke:
  - "implement feature"
  - "build feature"
  - "create feature"

capabilities:
  - database_migrations
  - api_development
  - ui_components
  - testing
  - documentation

guardrails:
  - always_run_type_check
  - enforce_rbac
  - generate_tests
  - validate_before_commit

success_criteria:
  - typescript_validation_passes
  - tests_included_and_passing
  - rbac_configured
  - documentation_complete
```

---

## Best Practices

### 1. Clear Task Definition
Give sub-agents clear, specific tasks:

**Good**:
```
"Implement customer invoice download feature:
- Allow customers to download PDF invoices
- Include invoice date, items, totals
- Restrict to customers' own invoices (RBAC)"
```

**Bad**:
```
"Make invoices better"
```

### 2. Success Criteria
Define what "done" looks like:
```
Success Criteria:
✅ Customer can download invoices as PDF
✅ PDF contains correct data (date, items, total)
✅ RBAC enforced (customers see only own invoices)
✅ Tests included (E2E + API)
✅ Works on mobile and desktop
```

### 3. Checkpoints
For long-running tasks, add checkpoints:
```
"Implement referral program:
Checkpoint 1: Database schema and migrations
Checkpoint 2: API routes with tests
Checkpoint 3: UI components
Checkpoint 4: E2E testing
Checkpoint 5: Deployment"
```

### 4. Error Recovery
Sub-agents should handle errors gracefully:
- Retry failed operations (with backoff)
- Report errors with context
- Suggest alternative approaches
- Ask for clarification when needed

---

## Monitoring & Metrics

### Sub-Agent Performance Tracking

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Task Completion Rate** | >90% | Successful completions / total tasks |
| **Average Execution Time** | Feature-dependent | Start to finish duration |
| **Code Quality** | >85% | TypeScript validation, test coverage |
| **User Satisfaction** | >4.5/5 | User feedback rating |
| **Rework Rate** | <10% | Changes needed after completion |

### Logging
All sub-agent actions logged:
```json
{
  "agent": "full-stack-dev",
  "task": "Implement referral program",
  "start_time": "2025-10-20T10:00:00Z",
  "end_time": "2025-10-20T11:30:00Z",
  "duration_minutes": 90,
  "status": "completed",
  "files_created": 12,
  "files_modified": 5,
  "tests_added": 8,
  "type_errors": 0,
  "deployment_ready": true
}
```

---

## Security & Safety

### Code Review Guardrails
All sub-agent code changes:
1. ✅ Run TypeScript validation
2. ✅ Run existing tests
3. ✅ Check for security issues (no secrets, SQL injection, XSS)
4. ✅ Enforce RBAC on admin features
5. ✅ Validate API inputs (Zod schemas)

### Restricted Operations
Sub-agents CANNOT:
- Delete production data without confirmation
- Modify RBAC role definitions (requires manual approval)
- Change environment variables in production
- Deploy without running deployment-check skill

---

## Next Steps

### Week 1: Setup & Configuration
1. ✅ Create `.claude/agents/` directory
2. ✅ Configure first 3 agents (full-stack-dev, frontend-specialist, backend-specialist)
3. ✅ Test with simple feature
4. ✅ Document learnings

### Week 2-4: Expansion
1. Configure remaining 9 agents
2. Test multi-agent workflows
3. Train development team
4. Measure performance metrics

### Ongoing: Optimization
1. Refine agent prompts based on results
2. Add new capabilities as needed
3. Share best practices with team
4. Update documentation

---

**Document Version**: 1.0
**Last Updated**: 2025-10-20
**Next Review**: 2025-11-03
