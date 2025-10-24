# Prompt-Based Multi-Agent Orchestration System

**Status**: ✅ Complete and Production-Ready
**Approach**: Prompt-Based (Claude Code Native)
**API Key Required**: ❌ No (Works with Claude Max subscription)
**Last Updated**: 2025-10-24

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Getting Started](#getting-started)
4. [Usage](#usage)
5. [Workers](#workers)
6. [Quality Gates](#quality-gates)
7. [Examples](#examples)
8. [Troubleshooting](#troubleshooting)
9. [API Reference](#api-reference)

---

## Overview

The **CircleTel Multi-Agent Orchestration System** uses **Claude Sonnet 4.5** as a strategic orchestrator to break down complex development tasks into multi-step execution plans, then coordinates specialized workers to implement complete features across all layers.

### Key Features

- **✅ No API Key Required**: Works with Claude Code + Claude Max subscription
- **🧠 Intelligent Task Analysis**: Analyzes intent, complexity, and required layers
- **📊 DAG-Based Planning**: Creates dependency graphs with topological sort
- **🎯 Specialized Workers**: 5 domain-specific workers (database, API, UI, test, user-stories)
- **🔍 Quality Gates**: TypeScript, RBAC, standards, build, test validation
- **📈 Progress Tracking**: Real-time progress updates during execution
- **🔄 Sequential Execution**: Workers run one after another in dependency order

### What's Different from Original Plan

| Aspect | Original (Haiku Workers) | Current (Prompt-Based) |
|--------|-------------------------|------------------------|
| **API Key** | Required (Anthropic) | ❌ Not needed |
| **Cost** | ~$0.12 per feature | ✅ Included in Claude Max |
| **Speed** | 30 min (parallel) | 60-90 min (sequential) |
| **Complexity** | Higher (API integration) | ✅ Lower (prompts only) |
| **Model** | Haiku 4.5 (fast/cheap) | Sonnet (current session) |
| **Execution** | Parallel (3 workers) | Sequential (one by one) |

**Recommendation**: Perfect for Claude Max users who prioritize simplicity over speed.

---

## Architecture

### System Diagram

```
User Request
    ↓
┌─────────────────────────────────────┐
│   Sonnet Orchestrator (TypeScript)  │
│   - Analyze task complexity         │
│   - Decompose into subtasks         │
│   - Build execution DAG             │
│   - Define quality gates            │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│     Workflow Engine (Sequential)    │
│   - Load worker prompts             │
│   - Execute in topological order    │
│   - Track progress                  │
│   - Run quality gates               │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│   Specialized Workers (5 types)     │
│   ├─ user-stories (product)         │
│   ├─ database (schema, RLS)         │
│   ├─ api (Next.js routes)           │
│   ├─ ui (React components)          │
│   └─ test (unit, integration, E2E)  │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│      Quality Gates (Validation)     │
│   ├─ TypeScript (type check)        │
│   ├─ RBAC (permission gates)        │
│   ├─ Standards (CircleTel patterns) │
│   ├─ Build (Next.js build)          │
│   └─ Tests (coverage)               │
└─────────────────────────────────────┘
    ↓
Complete Feature Implementation
```

### File Structure

```
lib/agents/
├── core/
│   ├── types.ts                    # TypeScript interfaces (553 lines)
│   ├── claude-client.ts            # Prompt generation (335 lines)
│   ├── sonnet-orchestrator.ts      # Strategic planner (413 lines)
│   ├── context-manager.ts          # Domain memory loader (234 lines)
│   ├── workflow-engine.ts          # Sequential executor (400+ lines)
│   └── auto-detector.ts            # Auto-trigger detection (300+ lines)
│
└── workers/
    ├── base-worker.ts              # Abstract base class (398 lines)
    ├── user-stories-worker.ts      # Product analysis (~80 lines)
    ├── database-worker.ts          # Schema & migrations (~160 lines)
    ├── api-worker.ts               # Backend routes (~130 lines)
    ├── ui-worker.ts                # React components (~180 lines)
    └── test-worker.ts              # Test generation (~160 lines)

.claude/commands/
└── orchestrate.md                  # Slash command definition

scripts/
└── run-orchestrator.ts             # CLI runner script

__tests__/orchestrator/
└── orchestrator.test.ts            # Integration tests (400+ lines)
```

**Total**: ~3,500 lines of production-ready TypeScript

---

## Getting Started

### Prerequisites

- Node.js 18+
- TypeScript project (CircleTel codebase)
- Claude Code with Claude Max subscription
- Domain memory files in `.claude/memory/`

### Installation

```bash
# Install dependencies (no Anthropic SDK needed!)
npm install

# No API key configuration needed!
# Works with your Claude Max subscription
```

### Verify Installation

```bash
# Check TypeScript compilation
npm run type-check

# Run tests
npm test __tests__/orchestrator/
```

---

## Usage

### Method 1: Slash Command (Recommended)

```bash
/orchestrate implement customer referral program with tracking and rewards
```

### Method 2: Manual Script

```bash
npm run orchestrate -- "implement customer referral program with tracking and rewards"
```

### Method 3: Auto-Detection

Just type your request naturally, and the system will recommend orchestration if appropriate:

```
You: "I want to build a complete admin analytics dashboard with charts, filters, and exports"

Claude: 🤖 Orchestration Auto-Detection
Recommendation: ✅ Use Orchestrator
Confidence: 85%
Complexity: complex
Detected Layers: product, database, backend, frontend
```

---

## Workers

### 1. User Stories Worker

**Domain**: Product
**Temperature**: 0.7 (higher creativity)
**Responsibilities**:
- Analyze feature requirements
- Generate user stories (As a... I want... So that...)
- Define acceptance criteria
- Identify edge cases
- Define success metrics

**Output**: 3-7 user stories in markdown format

---

### 2. Database Worker

**Domain**: Database
**Temperature**: 0.5 (medium creativity)
**Responsibilities**:
- Design database schemas
- Generate SQL migrations (timestamped)
- Create RLS (Row Level Security) policies
- Add indexes and constraints
- Follow CircleTel database standards

**Standards Enforced**:
- Always enable RLS on new tables
- Use UUID for IDs (not integers)
- Use TIMESTAMPTZ for timestamps
- Use JSONB (not JSON)
- Add indexes on foreign keys
- Include audit columns (created_at, updated_at)

**Output**: Migration files in `/supabase/migrations/`

---

### 3. API Worker

**Domain**: Backend
**Temperature**: 0.4 (lower for consistency)
**Responsibilities**:
- Generate Next.js 15 API routes
- Add request validation (Zod schemas)
- Implement error handling
- Add RBAC permission checks
- Follow RESTful conventions

**Pattern Enforced**:
```typescript
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const validated = requestSchema.parse(body); // Zod

    // RBAC check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Business logic...

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: ... }, { status: 500 });
  }
}
```

**Output**: API route files in `/app/api/[endpoint]/route.ts`

---

### 4. UI Worker

**Domain**: Frontend
**Temperature**: 0.6 (medium-high creativity)
**Responsibilities**:
- Generate React components
- Use shadcn/ui component library
- Implement CircleTel design system
- Add responsive design (mobile-first)
- Follow accessibility best practices

**Design System**:
- Colors: `circleTel-orange`, `circleTel-darkNeutral`, `circleTel-lightNeutral`
- Components: shadcn/ui (Button, Card, Input, etc.)
- Typography: Arial, Helvetica, sans-serif
- Spacing: Tailwind spacing scale

**Output**: Component files in `/components/[domain]/[Component].tsx`

---

### 5. Test Worker

**Domain**: Testing
**Temperature**: 0.3 (lower for consistency)
**Responsibilities**:
- Generate unit tests (Jest/Vitest)
- Generate integration tests (API testing)
- Generate E2E tests (Playwright via MCP)
- Add test coverage
- Test edge cases and error states

**Coverage Requirements**:
- Unit tests for all business logic
- Integration tests for all API endpoints
- E2E tests for critical user flows
- Test RBAC gates for admin features

**Output**: Test files in `__tests__/` or `docs/testing/`

---

## Quality Gates

### 1. TypeScript Validation

**Type**: `typescript`
**Purpose**: Ensure no type errors
**Check**: All files use strict TypeScript, no `any` types
**Command**: `npm run type-check`

### 2. RBAC Enforcement

**Type**: `rbac`
**Purpose**: Verify permission gates on admin features
**Check**: API routes have auth checks, UI components use PermissionGate
**Pattern**: `getUser()`, `checkPermission()`, `<PermissionGate>`

### 3. Standards Compliance

**Type**: `standards`
**Purpose**: Enforce CircleTel patterns
**Check**:
- Use `@/` imports (not relative)
- Use CircleTel colors from Tailwind config
- Include try-catch in all API routes
- Enable RLS in all migrations

### 4. Build Verification

**Type**: `build`
**Purpose**: Ensure Next.js build succeeds
**Command**: `npm run build:memory`

### 5. Test Coverage

**Type**: `tests`
**Purpose**: Verify test worker ran successfully
**Check**: Test files generated and executable

---

## Examples

### Example 1: Customer Referral Program

**Request**:
```
/orchestrate implement customer referral program with tracking and rewards
```

**Execution Plan**:
```
Intent: feature_implementation
Complexity: complex
Layers: product, database, backend, frontend, testing
Time Estimate: 75 minutes
Tasks: 5

1. [user-stories] Analyze referral program requirements
2. [database] Design referral tracking schema
3. [api] Build referral tracking endpoints
4. [ui] Create referral dashboard component
5. [test] Generate referral system tests
```

**Generated Files**:
```
✨ supabase/migrations/20251024120000_create_referrals.sql
✨ app/api/referrals/route.ts
✨ app/api/referrals/track/route.ts
✨ components/referrals/ReferralDashboard.tsx
✨ __tests__/referrals/referrals.test.ts
📄 docs/features/REFERRAL_PROGRAM_USER_STORIES.md
```

**Quality Gates**:
```
✅ TypeScript: 0 errors
✅ RBAC: All gates present
✅ Standards: CircleTel patterns followed
✅ Build: Success
✅ Tests: 18 tests generated
```

---

### Example 2: Admin Analytics Dashboard

**Request**:
```
npm run orchestrate -- "create admin analytics dashboard with charts and exports"
```

**Execution Plan**:
```
Intent: feature_implementation
Complexity: complex
Layers: database, backend, frontend
Time Estimate: 60 minutes
Tasks: 4

1. [database] Design analytics data schema
2. [api] Build analytics data endpoints
3. [ui] Create dashboard with charts
4. [test] Generate dashboard tests
```

**Generated Files**:
```
✨ supabase/migrations/20251024120500_create_analytics.sql
✨ app/api/admin/analytics/route.ts
✨ app/api/admin/analytics/export/route.ts
✨ components/admin/analytics/AnalyticsDashboard.tsx
✨ components/admin/analytics/ChartWidget.tsx
✨ __tests__/admin/analytics.test.ts
```

---

### Example 3: Simple Change (No Orchestration)

**Request**:
```
fix typo in header component
```

**Auto-Detection**:
```
🤖 Orchestration Auto-Detection
Recommendation: ❌ Direct Implementation
Confidence: 90%
Complexity: simple
Detected Layers: None

Reasoning: Request appears to be a simple change, bug fix, or research question

💡 Suggestion: Implement directly without orchestration.
```

---

## Troubleshooting

### Issue: "Worker not found"

**Cause**: Worker not initialized in workflow engine
**Fix**: Check that all workers are instantiated in `workflow-engine.ts`

### Issue: "Circular dependency detected"

**Cause**: Invalid task dependencies in DAG
**Fix**: Orchestrator prevents this, but if it occurs, review subtask dependencies

### Issue: "Quality gate failed"

**Cause**: Generated code doesn't meet standards
**Fix**: Review quality gate output, fix issues manually, re-run orchestrator

### Issue: "TypeScript errors"

**Cause**: Generated code has type errors
**Fix**: Run `npm run type-check`, fix errors, update worker prompts if recurring

### Issue: "Execution taking too long"

**Cause**: Sequential execution (not parallel)
**Expected**: Complex features take 60-90 minutes
**Workaround**: Use orchestrator for complex tasks only; simple tasks should be done directly

---

## API Reference

### `SonnetOrchestrator`

```typescript
class SonnetOrchestrator {
  async analyzeAndPlan(request: UserRequest): Promise<ExecutionPlan>
}
```

**Input**:
```typescript
{
  userPrompt: string;
  context: { projectPath: string };
}
```

**Output**:
```typescript
{
  request: UserRequest;
  analysis: TaskAnalysis;
  dag: ExecutionDAG;
  qualityGates: QualityGate[];
  checkpoints: Checkpoint[];
  createdAt: Date;
}
```

---

### `WorkflowEngine`

```typescript
class WorkflowEngine {
  async execute(
    plan: ExecutionPlan,
    options?: {
      onProgress?: ProgressCallback;
      stopOnError?: boolean;
    }
  ): Promise<WorkflowResult>

  getAggregatedFiles(result: WorkflowResult): FileChange[]
  getSummaryMarkdown(result: WorkflowResult): string
}
```

**Input**:
```typescript
{
  plan: ExecutionPlan;
  options: {
    onProgress?: (progress: ProgressUpdate) => void;
    stopOnError?: boolean; // default: true
  };
}
```

**Output**:
```typescript
{
  plan: ExecutionPlan;
  results: WorkerResult[];
  qualityResults: QualityGateResult[];
  summary: {
    totalTasks: number;
    successfulTasks: number;
    failedTasks: number;
    totalDuration: number;
    qualityGatesPassed: number;
    qualityGatesFailed: number;
  };
  status: 'success' | 'failed';
  completedAt: Date;
}
```

---

### `AutoDetector`

```typescript
class AutoDetector {
  detect(userPrompt: string): DetectionResult
  formatRecommendation(result: DetectionResult): string
}
```

**Input**: `string` (user prompt)

**Output**:
```typescript
{
  shouldOrchestrate: boolean;
  confidence: number; // 0-1
  complexity: 'simple' | 'moderate' | 'complex';
  detectedLayers: Layer[];
  matchedKeywords: string[];
  reasoning: string;
}
```

---

### `ContextManager`

```typescript
class ContextManager {
  async loadDomainContext(domain: Layer): Promise<DomainContext>
  async loadMultipleContexts(domains: Layer[]): Promise<DomainContext[]>
  formatContextForPrompt(context: DomainContext): string
  async getRecommendedContext(layers: Layer[]): Promise<string>
  clearCache(): void
  getCacheStats(): { cachedDomains: Layer[]; totalSize: number }
}
```

---

## Best Practices

### When to Use Orchestration

✅ **Use for**:
- Complex features spanning 3+ layers (database + API + UI)
- Features requiring 30+ minutes of work
- Production-ready implementations with quality gates
- Tasks needing consistent patterns across the codebase

❌ **Don't use for**:
- Simple one-file changes
- Quick bug fixes
- Exploration or research tasks
- Documentation-only updates

### Optimizing Performance

1. **Be specific in requests**: "implement X with Y and Z" is better than "add feature"
2. **Use appropriate workers only**: Don't force all 5 workers if you only need 2
3. **Review generated code**: Orchestrator provides scaffolding, you refine
4. **Run quality checks**: Always run `npm run type-check` after execution

### Maintaining Quality

1. **Update worker prompts**: Keep worker expertise current with project standards
2. **Update domain memories**: Keep `.claude/memory/` files in sync with architecture changes
3. **Review quality gates**: Adjust enforcement based on project maturity
4. **Test orchestrator**: Run integration tests regularly

---

## Comparison: Original vs Prompt-Based

| Metric | Original (Haiku Workers) | Current (Prompt-Based) | Winner |
|--------|-------------------------|------------------------|--------|
| **Setup Time** | ~2 hours (API setup) | ~15 min (no config) | ✅ Prompt |
| **Cost per Feature** | ~$0.12 | $0 (Claude Max) | ✅ Prompt |
| **Speed (Complex)** | 30 min (parallel) | 90 min (sequential) | ❌ Prompt |
| **Speed (Simple)** | 10 min | 20 min | ❌ Prompt |
| **Code Quality** | Same | Same | = |
| **Maintenance** | Higher (API changes) | Lower (prompts) | ✅ Prompt |
| **Integration** | Complex (SDK) | Simple (native) | ✅ Prompt |
| **Flexibility** | High (any model) | Medium (session) | ❌ Prompt |

**Verdict**: Prompt-based is **perfect for Claude Max users** who value simplicity and zero cost over speed.

---

## Future Enhancements

### Potential Improvements

1. **Parallel Execution**: If Claude Code adds multi-model support, implement parallel workers
2. **Cost Tracking**: If using API key mode, track token usage per feature
3. **Template System**: Pre-built templates for common features (CRUD, auth, payments)
4. **Learning System**: Analyze past executions to improve future plans
5. **Interactive Mode**: Allow user to approve/modify plan before execution
6. **Rollback System**: Automated rollback on quality gate failures

### Extending the System

**Adding a New Worker**:

1. Create `lib/agents/workers/my-worker.ts`
2. Extend `BaseWorker` class
3. Implement `execute()` method
4. Override `getWorkerSpecificPrompt()`
5. Register in `workflow-engine.ts`
6. Add tests in `__tests__/orchestrator/`

**Adding a New Quality Gate**:

1. Add gate type to `types.ts`
2. Implement check in `workflow-engine.ts`
3. Add to orchestrator's gate definition
4. Document in this guide

---

## References

- **Anthropic Blog**: [Claude Haiku 4.5 Announcement](https://www.anthropic.com/news/claude-haiku-4-5)
- **Engineering Guide**: [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)
- **Implementation Status**: `docs/agents/MULTI_AGENT_IMPLEMENTATION_STATUS.md`
- **Project Documentation**: `.claude/CLAUDE.md`, `.claude/agents/README.md`

---

**Maintained By**: CircleTel Development Team
**Approach**: Prompt-Based (Claude Code Native)
**API Key**: ❌ Not Required
**Works With**: Claude Max Subscription ✅
**Status**: ✅ Production-Ready
