# Agent-OS: CircleTel Implementation Framework

**Agent-OS** is an automated spec-to-implementation framework for CircleTel Next.js platform. It uses specialized AI agents to implement features from specifications with quality assurance and testing limits.

## Overview

Agent-OS breaks down feature implementation into **specialized roles** (database, backend, API, frontend, testing) and uses **dedicated agents** for each role. Each agent implements their assigned tasks, writes focused tests (2-8 per group), and produces implementation reports. **Verifier agents** then validate the work before production deployment.

---

## Framework Components

### 1. Roles (`agent-os/roles/`)

**`implementers.yml`**: Defines 5 specialized implementer agents
- `database-engineer`: Database migrations, schemas, RLS policies
- `backend-engineer`: Service layers, external API integrations
- `api-engineer`: Next.js 15 API routes, webhook endpoints
- `frontend-engineer`: React components, pages, UI/UX
- `testing-engineer`: E2E tests, integration tests (max 10 additional tests)

**`verifiers.yml`**: Defines 3 verification agents
- `backend-verifier`: Verifies database, backend, API implementations
- `frontend-verifier`: Verifies UI components, styling, responsiveness
- `implementation-verifier`: Final E2E verification before production

### 2. Agent Prompts (`.claude/agents/agent-os/`)

Each agent has a detailed prompt file with:
- Role description and capabilities
- Tech stack and patterns
- Implementation workflow (6 steps)
- Testing guidelines (STRICT: 2-8 tests per group)
- Code examples and best practices
- Quality checklist
- Report templates

**Implementers**:
- `database-engineer.md`
- `backend-engineer.md`
- `api-engineer.md`
- `frontend-engineer.md`
- `testing-engineer.md`

**Verifiers**:
- `backend-verifier.md`
- `frontend-verifier.md`
- `implementation-verifier.md`

### 3. Specifications (`agent-os/specs/`)

Each spec has this structure:
```
agent-os/specs/[spec-id]/
├── spec.md                    # Feature specification (16 sections)
├── tasks.md                   # Task breakdown (15 task groups)
├── README.md                  # Quick reference
├── planning/
│   ├── requirements.md        # User Q&A, explicit features
│   └── task-assignments.yml   # Task → Agent mappings
├── implementation/
│   ├── database/              # Database implementation reports
│   ├── backend/               # Backend implementation reports
│   ├── api/                   # API implementation reports
│   ├── frontend/              # Frontend implementation reports
│   └── testing/               # Testing implementation reports
└── verification/
    ├── backend-verification.md
    ├── frontend-verification.md
    └── final-verification.md
```

---

## Implementation Workflow

### Phase 1: Spec Creation (Manual or Agent-Assisted)

Create spec using `/agent-os:create-spec` or manually:
1. Write `spec.md` (comprehensive feature specification)
2. Write `tasks.md` (task breakdown with 15 task groups)
3. Write `planning/requirements.md` (user Q&A, explicit features)
4. Run `spec-verifier` to ensure quality (score ≥85/100)

### Phase 2: Implementation (`/agent-os:implement-spec`)

Automated delegation to specialized agents:

**Step 1: Create Task Assignments**
- Read `tasks.md` and `implementers.yml`
- Create `planning/task-assignments.yml` mapping tasks to agents

**Step 2: Delegate to Implementers**
- Loop through each task group in `tasks.md`
- Delegate to assigned agent (database-engineer, backend-engineer, etc.)
- Each agent:
  1. Writes 2-8 focused tests
  2. Implements the task
  3. Runs tests (ONLY their 2-8 tests)
  4. Updates `tasks.md` (checks off completed tasks)
  5. Creates implementation report in `implementation/[role]/`

**Step 3: Verification**
- Collect verifier roles from `implementers.yml` (verified_by field)
- Delegate to backend-verifier (verifies database, backend, API)
- Delegate to frontend-verifier (verifies UI, styling)
- Each verifier:
  1. Runs implementer tests
  2. Tests with valid/invalid inputs
  3. Scores 0-100 (functional, quality, tests, security, performance)
  4. Creates verification report
  5. Passing score: ≥80/100

**Step 4: Final Verification**
- Delegate to implementation-verifier for E2E verification
- Tests complete workflows (Quote → KYC → Contract → Payment → Activation)
- Verifies all success criteria met
- Scores 0-100 (passing: ≥85/100)
- Creates final verification report
- Approves for production or returns to implementers

---

## Testing Philosophy (CRITICAL)

### Strict Testing Limits

**Goal**: Prevent over-engineering with 100+ comprehensive test suites.

**Limits**:
- Each task group: **2-8 focused tests maximum**
- Testing-engineer: **Maximum 10 additional tests** (fills gaps, not rewrites)
- **Total per spec**: Target 45-62 tests (NOT 100+)

**Enforcement**:
- Implementer agents have testing limits in their prompts
- Verifiers check test counts and fail if exceeded
- Implementation reports document exact test counts

**Philosophy**:
> "Test the critical path, not every edge case. Ship fast, iterate based on production feedback."

### What to Test

**Implementers** (2-8 tests per task group):
- Database: Table creation, foreign keys, RLS policies, triggers
- Backend: API client auth, session creation, webhook signature verification
- API: Valid/invalid inputs, error handling, async params pattern
- Frontend: Component rendering, props validation, brand colors, responsive design

**Testing-Engineer** (max 10 additional tests):
- E2E workflows (Quote → Contract → Payment)
- Cross-component integration (database → API → frontend)
- External API interactions (Didit webhook, ZOHO Sign)
- Performance (PDF <2s, API <500ms)

---

## Code Reuse Policy (CRITICAL)

**Goal**: Aggressive code reuse to maximize efficiency.

**Rules**:
1. Check spec Section 7 "Reusable Components" before writing new code
2. Extend existing code rather than duplicating logic
3. Document reuse opportunities in implementation reports
4. New components must justify why existing code cannot be extended

**CircleTel Reusable Assets** (from existing codebase):
- **Quote PDF Generator**: `lib/quotes/pdf-generator-v2.ts` (421 lines)
  - Reuse for: Contract PDFs, Invoice PDFs (extend with KYC badge)
- **NetCash Service**: `lib/payments/netcash-service.ts`
  - Reuse for: Payment initiation, webhook processing (extend with invoice tracking)
- **Notification Framework**: `lib/notifications/quote-notifications.ts`
  - Reuse for: KYC reminders, contract notifications (extend with new templates)
- **RBAC System**: `lib/rbac/permissions.ts`, `lib/rbac/role-templates.ts`
  - Reuse for: New permissions (add to existing permission categories)

---

## Quality Standards

### Code Quality
- TypeScript: **Zero errors** (`npm run type-check` must pass)
- **No `any` types** (strict typing enforced)
- CircleTel patterns followed (Supabase, shadcn/ui, Next.js 15)
- Environment variables documented (.env.example)

### Security
- RLS policies on all tables (customer SELECT own, admin ALL)
- Webhook signature verification (HMAC-SHA256, timing-safe comparison)
- Input validation (prevent SQL injection, XSS)
- Auth checks on admin routes

### Performance
- PDF generation: <2 seconds
- API responses: <500ms
- KYC session creation: <3 minutes
- Database queries: <100ms average

### Documentation
- All implementation reports created
- tasks.md 100% checked off
- API endpoints documented
- Environment variables documented

---

## Verification Scoring

### Backend Verifier (database, backend, API)
- Functional Correctness: 30 points
- Code Quality: 20 points
- Test Coverage: 15 points
- Security: 15 points
- Performance: 10 points
- Code Reuse: 10 points
- **Passing**: ≥80/100

### Frontend Verifier (UI, styling, UX)
- Functional Correctness: 30 points
- Code Quality: 20 points
- Test Coverage: 15 points
- Brand Styling: 15 points
- Responsive Design: 10 points
- Accessibility: 10 points
- **Passing**: ≥80/100

### Implementation Verifier (final E2E)
- Functional Correctness: 30 points
- Code Quality: 20 points
- Test Coverage: 15 points
- Security: 15 points
- Performance: 10 points
- Documentation: 10 points
- **Passing**: ≥85/100

---

## Commands

### Create Spec
```bash
/agent-os:create-spec [workflow-doc.md] [user-stories.md]
```

Creates comprehensive specification with:
- spec.md (16 sections)
- tasks.md (15 task groups)
- planning/requirements.md (user Q&A)
- Runs spec-verifier (must score ≥85/100)

### Implement Spec
```bash
/agent-os:implement-spec agent-os/specs/[spec-id]/spec.md
```

Automates implementation:
1. Creates task-assignments.yml
2. Delegates to implementer agents (database, backend, API, frontend, testing)
3. Runs verifier agents (backend-verifier, frontend-verifier)
4. Runs implementation-verifier for final E2E check
5. Produces final verification report (ready/not ready for production)

---

## Example: B2B Quote-to-Contract Implementation

### Spec
- **ID**: `20251101-b2b-quote-to-contract-kyc`
- **Feature**: Complete automation from quote generation through service activation with Didit KYC compliance
- **Story Points**: 61
- **Timeline**: 10 business days (2 weeks, 1 dedicated developer)
- **Task Groups**: 15

### Task Assignments
```yaml
task_assignments:
  - task_group: "Task Group 1: Database Layer - KYC & RICA Tables"
    assigned_subagent: "database-engineer"

  - task_group: "Task Group 2: Didit KYC Integration - Session Management"
    assigned_subagent: "backend-engineer"

  - task_group: "Task Group 3: KYC API Routes"
    assigned_subagent: "api-engineer"

  - task_group: "Task Group 4: KYC Frontend Components"
    assigned_subagent: "frontend-engineer"

  # ... 11 more task groups
```

### Implementation Flow
1. **database-engineer** implements Task Group 1 (3 story points)
   - Writes 6 tests
   - Creates migration `20251101000001_create_kyc_system.sql`
   - Creates implementation report

2. **backend-engineer** implements Task Group 2 (8 story points)
   - Writes 6 tests
   - Creates Didit API client, session manager, webhook handler
   - Creates implementation report

3. **api-engineer** implements Task Group 3 (5 story points)
   - Writes 5 tests
   - Creates 4 API routes (create-kyc-session, webhook, status, retry)
   - Creates implementation report

4. **frontend-engineer** implements Task Group 4 (5 story points)
   - Writes 5 tests
   - Creates LightKYCSession, KYCStatusBadge components, KYC page
   - Creates implementation report

... (continues for all 15 task groups)

### Verification
1. **backend-verifier** verifies Task Groups 1, 2, 3, 5, 6, 7, 8, 9, 10, 12
   - Runs all implementer tests (total ~40 tests)
   - Tests API endpoints
   - Verifies RLS policies
   - Scores: 92/100 ✅ PASSED

2. **frontend-verifier** verifies Task Groups 4, 11, 13, 14
   - Runs component tests (total ~18 tests)
   - Tests responsive design
   - Verifies CircleTel branding
   - Scores: 90/100 ✅ PASSED

3. **implementation-verifier** final E2E verification
   - Runs all E2E tests (8 tests)
   - Tests complete Quote → KYC → Contract → Payment → Activation workflow
   - Tests all external integrations (Didit, ZOHO, NetCash, RICA)
   - Measures performance (PDF 1.8s, API 320ms, KYC 2.5min)
   - Verifies all success criteria met
   - **Total tests**: 52 (within 45-62 target)
   - Scores: 92/100 ✅ **APPROVED FOR PRODUCTION**

---

## Benefits

### For Developers
- **Focused Work**: Specialists work on their area (database, backend, frontend)
- **Quality Gates**: Automated verification before production
- **Test Limits**: No over-engineering (strict 2-8 test limit)
- **Code Reuse**: Framework enforces extending existing code

### For Project Managers
- **Predictable Timelines**: Story points per task group
- **Quality Scores**: Objective 0-100 scoring
- **Traceability**: Every task linked to implementation report
- **Documentation**: Comprehensive reports at every stage

### For QA Teams
- **Automated Verification**: Verifier agents run tests automatically
- **Consistent Standards**: Same quality checklist every time
- **Performance Testing**: Automated performance measurements
- **Security Checks**: RLS policies, webhook signatures verified

---

## Directory Structure

```
circletel-nextjs/
├── agent-os/
│   ├── README.md (this file)
│   ├── roles/
│   │   ├── implementers.yml       # 5 implementer agents
│   │   └── verifiers.yml          # 3 verifier agents
│   └── specs/
│       └── 20251101-b2b-quote-to-contract-kyc/
│           ├── spec.md
│           ├── tasks.md
│           ├── README.md
│           ├── planning/
│           │   ├── requirements.md
│           │   └── task-assignments.yml
│           ├── implementation/
│           │   ├── database/
│           │   ├── backend/
│           │   ├── api/
│           │   ├── frontend/
│           │   └── testing/
│           └── verification/
│               ├── backend-verification.md
│               ├── frontend-verification.md
│               └── final-verification.md
└── .claude/
    └── agents/
        └── agent-os/
            ├── database-engineer.md
            ├── backend-engineer.md
            ├── api-engineer.md
            ├── frontend-engineer.md
            ├── testing-engineer.md
            ├── backend-verifier.md
            ├── frontend-verifier.md
            └── implementation-verifier.md
```

---

## Next Steps

1. **Review Framework**: Understand roles, agents, and workflow
2. **Run Implementation**: `/ agent-os:implement-spec agent-os/specs/20251101-b2b-quote-to-contract-kyc/spec.md`
3. **Monitor Progress**: Check implementation reports as they're created
4. **Review Verification**: Read final-verification.md for production readiness
5. **Deploy**: Follow deployment steps from final verification report

---

**Framework Version**: 1.0
**Created**: 2025-11-01
**Maintained By**: Development Team + Claude Code
