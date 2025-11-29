# Agentic AI System - Task List

## Overview

This document tracks all implementation tasks for the CircleTel Agentic AI System.

**Total Story Points:** 86
**Completed Story Points:** 0
**Remaining Story Points:** 86
**Implementation Status:** 0% Complete
**Spec Version:** 1.0
**Last Updated:** 2025-11-29

---

## Task Status Legend

- [ ] Not Started
- [x] Complete
- [~] In Progress
- [!] Blocked

---

## Phase 1: PM Agent Development Tool (Week 1)

### Task Group 1.1: Core Agent Infrastructure
**Assigned Implementer:** backend-engineer
**Dependencies:** None
**Priority:** Critical
**Story Points:** 8

- [ ] 1.1.0 Create PM Agent core architecture
  - [ ] 1.1.1 Create `lib/agents/pm/agent.ts`
    - PMAgent class with Anthropic SDK integration
    - Config interface for model selection
    - Methods: generateSpec(), analyzeCodebase(), breakdownTasks()
  - [ ] 1.1.2 Create `lib/agents/pm/context.ts`
    - readSystemContext() function
    - loadRelevantPatterns() from existing specs
    - summarizeDatabaseSchema() helper
  - [ ] 1.1.3 Create `lib/agents/pm/types.ts`
    - SpecOutput interface
    - TaskBreakdown interface
    - AnalysisResult interface
    - PMAgentConfig interface

**Acceptance Criteria:**
- [ ] PMAgent class instantiates with Anthropic SDK
- [ ] Context loading works with existing project structure
- [ ] TypeScript compiles without errors

**Files to Create:**
- `lib/agents/pm/agent.ts`
- `lib/agents/pm/context.ts`
- `lib/agents/pm/types.ts`
- `lib/agents/pm/index.ts`

**Related User Story:** US-1, US-2, US-3

---

### Task Group 1.2: Spec Generation
**Assigned Implementer:** backend-engineer
**Dependencies:** Task Group 1.1
**Priority:** Critical
**Story Points:** 8

- [ ] 1.2.0 Implement spec generation
  - [ ] 1.2.1 Create `lib/agents/pm/generators/spec.ts`
    - SPEC_SYSTEM_PROMPT constant
    - generateSpec() function using Opus 4.5
    - parseSpecResponse() helper
  - [ ] 1.2.2 Create `lib/agents/pm/generators/tasks.ts`
    - TASKS_SYSTEM_PROMPT constant
    - generateTasks() function
    - Story point estimation logic
  - [ ] 1.2.3 Create `lib/agents/pm/storage.ts`
    - saveSpec() - write to agent-os/specs/
    - loadSpec() - read existing spec
    - generateSpecId() - date-based ID generation

**Acceptance Criteria:**
- [ ] Spec generation produces valid markdown
- [ ] Specs follow CircleTel format exactly
- [ ] Files saved to correct location with proper naming

**Files to Create:**
- `lib/agents/pm/generators/spec.ts`
- `lib/agents/pm/generators/tasks.ts`
- `lib/agents/pm/storage.ts`

**Related User Story:** US-1, US-3

---

### Task Group 1.3: Codebase Analysis
**Assigned Implementer:** backend-engineer
**Dependencies:** Task Group 1.1
**Priority:** High
**Story Points:** 5

- [ ] 1.3.0 Implement codebase analysis
  - [ ] 1.3.1 Create `lib/agents/pm/analysis/codebase.ts`
    - analyzeCodebase() function
    - File pattern recognition
    - Integration with context-manager skill
  - [ ] 1.3.2 Create `lib/agents/pm/analysis/patterns.ts`
    - identifyPatterns() - find existing code patterns
    - suggestLocation() - recommend file placement
    - findSimilar() - find similar implementations

**Acceptance Criteria:**
- [ ] Analysis accurately identifies code patterns
- [ ] Recommendations align with project structure
- [ ] Token usage optimized via context-manager

**Files to Create:**
- `lib/agents/pm/analysis/codebase.ts`
- `lib/agents/pm/analysis/patterns.ts`

**Related User Story:** US-2

---

### Task Group 1.4: Claude Code Integration
**Assigned Implementer:** backend-engineer
**Dependencies:** Task Groups 1.1-1.3
**Priority:** High
**Story Points:** 8

- [ ] 1.4.0 Create Claude Code integration
  - [ ] 1.4.1 Create `.claude/commands/pm.md`
    - Command definition with actions
    - Usage examples
    - Integration documentation
  - [ ] 1.4.2 Create `.claude/skills/pm-agent/prompt.md`
    - Skill triggers
    - Context loading instructions
    - Output format specifications
  - [ ] 1.4.3 Create `.claude/skills/pm-agent/README.md`
    - Skill documentation
    - Usage examples
    - Troubleshooting guide

**Acceptance Criteria:**
- [ ] `/pm generate-spec` works in Claude Code
- [ ] `/pm analyze` provides accurate answers
- [ ] `/pm breakdown-tasks` produces valid task lists
- [ ] Skill auto-triggers on relevant keywords

**Files to Create:**
- `.claude/commands/pm.md`
- `.claude/skills/pm-agent/prompt.md`
- `.claude/skills/pm-agent/README.md`

**Related User Story:** US-4

---

### Task Group 1.5: Testing & Validation
**Assigned Implementer:** testing-engineer
**Dependencies:** Task Groups 1.1-1.4
**Priority:** High
**Story Points:** 5

- [ ] 1.5.0 Create tests for PM Agent
  - [ ] 1.5.1 Unit tests for spec generation
    - Test prompt construction
    - Test response parsing
    - Test file saving
  - [ ] 1.5.2 Unit tests for codebase analysis
    - Test pattern identification
    - Test file location suggestions
  - [ ] 1.5.3 Integration tests
    - End-to-end spec generation
    - Context loading verification
    - Output format validation

**Acceptance Criteria:**
- [ ] >80% code coverage for core functions
- [ ] All edge cases handled
- [ ] Integration tests pass consistently

**Files to Create:**
- `lib/agents/pm/__tests__/agent.test.ts`
- `lib/agents/pm/__tests__/generators.test.ts`
- `lib/agents/pm/__tests__/analysis.test.ts`

**Related User Story:** All Phase 1 stories

---

## Phase 2: PM Agent Production API (Week 2)

### Task Group 2.1: API Endpoint
**Assigned Implementer:** backend-engineer
**Dependencies:** Phase 1 Complete
**Priority:** High
**Story Points:** 5

- [ ] 2.1.0 Create PM Agent API
  - [ ] 2.1.1 Create `app/api/agents/pm/route.ts`
    - POST handler for agent requests
    - Admin authentication via RBAC
    - Request validation
  - [ ] 2.1.2 Create `lib/agents/pm/api/validators.ts`
    - Request schema validation
    - Action type validation
    - Input sanitization

**Acceptance Criteria:**
- [ ] API requires admin authentication
- [ ] All actions return consistent response format
- [ ] Error handling follows project patterns

**Files to Create:**
- `app/api/agents/pm/route.ts`
- `lib/agents/pm/api/validators.ts`

**Related User Story:** US-5

---

### Task Group 2.2: Rate Limiting & Cost Tracking
**Assigned Implementer:** backend-engineer
**Dependencies:** Task Group 2.1
**Priority:** High
**Story Points:** 5

- [ ] 2.2.0 Implement rate limiting
  - [ ] 2.2.1 Create `lib/agents/rate-limiter.ts`
    - Redis-based rate limiting (fallback to Supabase)
    - Per-user limits (20 req/hour)
    - Burst handling
  - [ ] 2.2.2 Create `lib/agents/cost-tracker.ts`
    - Token counting per request
    - Cost calculation (per model)
    - Daily/monthly aggregation
  - [ ] 2.2.3 Create `lib/agents/usage-logger.ts`
    - Log all agent interactions
    - Store in agent_sessions table
    - Track costs per user/team

**Acceptance Criteria:**
- [ ] Rate limiting enforced correctly
- [ ] Cost tracking accurate to $0.01
- [ ] Usage logged for audit purposes

**Files to Create:**
- `lib/agents/rate-limiter.ts`
- `lib/agents/cost-tracker.ts`
- `lib/agents/usage-logger.ts`

**Related User Story:** US-7

---

### Task Group 2.3: Admin Chat UI
**Assigned Implementer:** frontend-engineer
**Dependencies:** Task Groups 2.1-2.2
**Priority:** High
**Story Points:** 8

- [ ] 2.3.0 Create admin chat interface
  - [ ] 2.3.1 Create `app/admin/agents/pm/page.tsx`
    - Chat UI with message history
    - Quick action buttons
    - Loading states
  - [ ] 2.3.2 Create `components/admin/agents/ChatMessage.tsx`
    - User/assistant message styling
    - Markdown rendering
    - Code block formatting
  - [ ] 2.3.3 Create `components/admin/agents/QuickActions.tsx`
    - New Spec button
    - Analyze Code button
    - Task Breakdown button
  - [ ] 2.3.4 Create `hooks/use-pm-agent.ts`
    - API interaction hook
    - Message state management
    - Loading/error handling

**Acceptance Criteria:**
- [ ] Chat interface matches CircleTel design
- [ ] Messages render markdown correctly
- [ ] Quick actions populate input correctly
- [ ] Loading states clear and informative

**Files to Create:**
- `app/admin/agents/pm/page.tsx`
- `components/admin/agents/ChatMessage.tsx`
- `components/admin/agents/QuickActions.tsx`
- `hooks/use-pm-agent.ts`

**Related User Story:** US-5

---

## Phase 3: Multi-Agent Coordinator (Week 3)

### Task Group 3.1: Coordinator Core
**Assigned Implementer:** backend-engineer
**Dependencies:** Phase 2 Complete
**Priority:** High
**Story Points:** 8

- [ ] 3.1.0 Build coordinator architecture
  - [ ] 3.1.1 Create `lib/agents/coordinator/index.ts`
    - AgentCoordinator class
    - Agent registry
    - Task routing logic
  - [ ] 3.1.2 Create `lib/agents/coordinator/router.ts`
    - Task type → agent mapping
    - Dependency resolution
    - Priority handling
  - [ ] 3.1.3 Create `lib/agents/coordinator/context-store.ts`
    - Agent state persistence
    - Shared context management
    - File lock management

**Acceptance Criteria:**
- [ ] Tasks routed to correct agents
- [ ] Dependencies resolved correctly
- [ ] No file conflicts between agents

**Files to Create:**
- `lib/agents/coordinator/index.ts`
- `lib/agents/coordinator/router.ts`
- `lib/agents/coordinator/context-store.ts`

**Related User Story:** US-8, US-9

---

### Task Group 3.2: Handoff Protocol
**Assigned Implementer:** backend-engineer
**Dependencies:** Task Group 3.1
**Priority:** High
**Story Points:** 5

- [ ] 3.2.0 Implement handoff protocol
  - [ ] 3.2.1 Create `lib/agents/coordinator/handoff.ts`
    - HandoffContext interface
    - handoff() method
    - Context transfer logic
  - [ ] 3.2.2 Create `lib/agents/coordinator/checkpoints.ts`
    - Checkpoint determination logic
    - Notification triggers
    - Approval workflow

**Acceptance Criteria:**
- [ ] Handoffs complete successfully 95%+ of time
- [ ] Context transferred completely
- [ ] Checkpoints trigger correctly

**Files to Create:**
- `lib/agents/coordinator/handoff.ts`
- `lib/agents/coordinator/checkpoints.ts`

**Related User Story:** US-8, US-10

---

### Task Group 3.3: Parallel Execution
**Assigned Implementer:** backend-engineer
**Dependencies:** Task Groups 3.1-3.2
**Priority:** Medium
**Story Points:** 8

- [ ] 3.3.0 Implement parallel task execution
  - [ ] 3.3.1 Create `lib/agents/coordinator/parallel.ts`
    - Dependency graph builder
    - Parallel execution engine
    - Conflict detection
  - [ ] 3.3.2 Create `lib/agents/coordinator/queue.ts`
    - Task queue management
    - Priority ordering
    - Worker pool management

**Acceptance Criteria:**
- [ ] Independent tasks execute in parallel
- [ ] Dependent tasks wait correctly
- [ ] Conflicts detected and prevented

**Files to Create:**
- `lib/agents/coordinator/parallel.ts`
- `lib/agents/coordinator/queue.ts`

**Related User Story:** US-9

---

## Phase 4: Admin Panel Integration (Week 4)

### Task Group 4.1: Database Schema
**Assigned Implementer:** database-engineer
**Dependencies:** Phase 3 Complete
**Priority:** High
**Story Points:** 3

- [ ] 4.1.0 Create agent tracking tables
  - [ ] 4.1.1 Migration: `agent_sessions` table
    - Columns: id, agent_type, user_id, messages, context, tokens_used, cost_cents, status
    - Indexes: user_id, agent_type, created_at
    - RLS policies: admins only
  - [ ] 4.1.2 Migration: `agent_tasks` table
    - Columns: id, session_id, task_type, input, output, assigned_agent, status
    - Indexes: session_id, assigned_agent, status
    - RLS policies: admins only
  - [ ] 4.1.3 Migration: `agent_metrics` table
    - Columns: id, date, agent_type, total_sessions, total_tokens, total_cost_cents
    - Unique constraint: (date, agent_type)
    - RLS policies: admins only

**Acceptance Criteria:**
- [ ] All tables created with proper constraints
- [ ] RLS policies enforce admin-only access
- [ ] Indexes optimized for dashboard queries

**Files to Create:**
- `supabase/migrations/[timestamp]_create_agent_tracking.sql`

**Related User Story:** US-11, US-12

---

### Task Group 4.2: Agent Dashboard
**Assigned Implementer:** frontend-engineer
**Dependencies:** Task Group 4.1
**Priority:** Medium
**Story Points:** 5

- [ ] 4.2.0 Create agent activity dashboard
  - [ ] 4.2.1 Create `app/admin/agents/page.tsx`
    - Overview with key metrics
    - Agent type breakdown
    - Recent activity list
  - [ ] 4.2.2 Create `components/admin/agents/MetricsCards.tsx`
    - Total sessions card
    - Total cost card
    - Success rate card
    - Avg response time card
  - [ ] 4.2.3 Create `components/admin/agents/ActivityFeed.tsx`
    - Real-time activity updates
    - Filterable by agent type
    - Expandable details

**Acceptance Criteria:**
- [ ] Dashboard loads in <2 seconds
- [ ] Metrics accurate and up-to-date
- [ ] Activity feed updates in real-time

**Files to Create:**
- `app/admin/agents/page.tsx`
- `components/admin/agents/MetricsCards.tsx`
- `components/admin/agents/ActivityFeed.tsx`

**Related User Story:** US-11

---

### Task Group 4.3: Model Configuration
**Assigned Implementer:** frontend-engineer
**Dependencies:** Task Group 4.2
**Priority:** Low
**Story Points:** 5

- [ ] 4.3.0 Create model configuration panel
  - [ ] 4.3.1 Create `app/admin/agents/settings/page.tsx`
    - Model selection per task type
    - Cost threshold configuration
    - Rate limit settings
  - [ ] 4.3.2 Create `components/admin/agents/ModelSelector.tsx`
    - Model dropdown with descriptions
    - Cost per token display
    - Capability comparison
  - [ ] 4.3.3 Create `components/admin/agents/AlertConfig.tsx`
    - Cost alert thresholds
    - Email notification settings
    - Slack webhook config

**Acceptance Criteria:**
- [ ] Settings persist correctly
- [ ] Model changes take effect immediately
- [ ] Alerts trigger at correct thresholds

**Files to Create:**
- `app/admin/agents/settings/page.tsx`
- `components/admin/agents/ModelSelector.tsx`
- `components/admin/agents/AlertConfig.tsx`

**Related User Story:** US-12

---

## Summary by Phase

| Phase | Story Points | Status | Target Completion |
|-------|-------------|--------|-------------------|
| Phase 1: PM Agent Dev Tool | 34 | Not Started | Week 1 |
| Phase 2: PM Agent API | 18 | Not Started | Week 2 |
| Phase 3: Multi-Agent Coordinator | 21 | Not Started | Week 3 |
| Phase 4: Admin Integration | 13 | Not Started | Week 4 |
| **Total** | **86** | **0%** | **4 Weeks** |

---

## Task Dependencies Graph

```
Phase 1 (Foundation)
├── 1.1 Core Infrastructure
│   ├── 1.2 Spec Generation
│   │   └── 1.4 Claude Code Integration
│   └── 1.3 Codebase Analysis
│       └── 1.4 Claude Code Integration
└── 1.5 Testing (depends on all above)

Phase 2 (API Layer)
├── 2.1 API Endpoint (depends on Phase 1)
│   └── 2.2 Rate Limiting
│       └── 2.3 Admin Chat UI
└── (all Phase 2 tasks parallel after 2.1)

Phase 3 (Coordinator)
├── 3.1 Coordinator Core (depends on Phase 2)
│   └── 3.2 Handoff Protocol
│       └── 3.3 Parallel Execution
└── (sequential dependency chain)

Phase 4 (Integration)
├── 4.1 Database Schema (depends on Phase 3)
│   ├── 4.2 Agent Dashboard
│   └── 4.3 Model Configuration
└── (4.2 and 4.3 can be parallel)
```

---

## Implementation Notes

### Development Mode vs Production Mode

**Development Mode (Phase 1)**:
- Runs entirely in Claude Code terminal
- Uses Claude Max subscription (no additional cost)
- Invoked via `/pm` command or skill triggers
- Output: Markdown files in `agent-os/specs/`

**Production Mode (Phase 2+)**:
- API endpoint at `/api/agents/pm`
- Requires Anthropic API key
- Accessible from admin panel
- Costs tracked and billed separately

### Model Selection Logic

```typescript
function selectModel(taskType: string, complexity: 'low' | 'medium' | 'high'): Model {
  // Complex planning always uses Opus
  if (taskType === 'spec-generation' || taskType === 'codebase-analysis') {
    return 'claude-opus-4-5-20250929';
  }

  // Simple queries can use cheaper models
  if (complexity === 'low' && taskType === 'simple-query') {
    return process.env.AGENT_FALLBACK_MODEL || 'gemini-3-pro';
  }

  // Default to Opus for reliability
  return 'claude-opus-4-5-20250929';
}
```

### Cost Estimation

| Operation | Est. Tokens | Est. Cost |
|-----------|-------------|-----------|
| Spec Generation | 15,000 | $0.45 |
| Codebase Analysis | 8,000 | $0.24 |
| Task Breakdown | 5,000 | $0.15 |
| Simple Query | 2,000 | $0.06 |

*Based on Claude Opus 4.5 pricing: $0.015/1K input, $0.075/1K output*

### Security Considerations

1. **API Access**: Admin RBAC permission required
2. **Rate Limiting**: 20 requests/hour per user
3. **Cost Caps**: Daily budget with automatic cutoff
4. **Audit Logging**: All agent interactions logged
5. **No PII in Prompts**: Sanitize user input before sending to API
