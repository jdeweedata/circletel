# CircleTel Orchestrator Agent Specification

> **Purpose**: Intelligent task routing, multi-agent coordination, and workflow orchestration for CircleTel's AI acceleration system.

**Date**: 2025-10-20
**Status**: Critical Addition to Master Plan
**Version**: 1.0

---

## 🎯 The Missing Piece

### Problem Identified
The current plan has:
- ✅ 20+ specialized skills (single-purpose automation)
- ✅ 12 sub-agents (autonomous execution)
- ✅ 15 plugins (specialized tools)
- ❌ **No orchestrator** to intelligently delegate and coordinate

**Without an orchestrator**:
- Users must manually choose the right sub-agent
- No automatic task decomposition
- No multi-agent workflow coordination
- No load balancing or prioritization

**With an orchestrator**:
- ✅ Intelligent task analysis and routing
- ✅ Automatic sub-agent selection
- ✅ Multi-agent collaboration
- ✅ Workflow optimization

---

## 🧠 Orchestrator Agent Architecture

### Core Capabilities

```
User Request
    ↓
┌─────────────────────────────────────┐
│   Orchestrator Agent                │
│                                     │
│  1. Task Analysis                   │
│     - Parse user intent            │
│     - Identify complexity          │
│     - Detect multi-step needs      │
│                                     │
│  2. Agent Selection                 │
│     - Match task to capabilities   │
│     - Consider agent availability  │
│     - Prioritize by expertise      │
│                                     │
│  3. Workflow Planning               │
│     - Decompose complex tasks      │
│     - Sequence dependencies        │
│     - Plan parallelization         │
│                                     │
│  4. Execution Coordination          │
│     - Delegate to sub-agents       │
│     - Monitor progress             │
│     - Handle errors/retries        │
│                                     │
│  5. Quality Assurance               │
│     - Validate outputs             │
│     - Run quality checks           │
│     - Enforce standards            │
│                                     │
│  6. Result Synthesis                │
│     - Aggregate sub-agent outputs  │
│     - Generate unified report      │
│     - Provide actionable summary   │
└─────────────────────────────────────┘
    ↓
Sub-Agents Execute → Results Returned
```

---

## 📋 Orchestrator Configuration

### Agent Definition

**File**: `.claude/agents/orchestrator.yml`

```yaml
name: orchestrator
description: Intelligent task routing and multi-agent coordination system
version: 1.0.0
priority: critical
proactive: true

# Orchestrator is ALWAYS invoked for complex/ambiguous tasks
auto_invoke:
  - "implement"
  - "build"
  - "create feature"
  - "add functionality"
  - "fix and improve"
  - "complete workflow"
  - "end-to-end"

capabilities:
  - task_analysis
  - agent_selection
  - workflow_planning
  - execution_coordination
  - quality_assurance
  - result_synthesis

tools:
  - Read
  - Write
  - Task (can invoke other sub-agents)
  - TodoWrite (workflow tracking)

sub_agents_registry:
  development:
    - full-stack-dev
    - frontend-specialist
    - backend-specialist
    - integration-specialist

  quality:
    - refactoring-agent
    - testing-agent
    - bug-hunter-agent
    - performance-optimizer

  operations:
    - product-manager-agent
    - data-analyst-agent
    - devops-agent
    - documentation-agent

decision_matrix:
  # How orchestrator chooses sub-agents
  feature_implementation:
    simple_ui_only: frontend-specialist
    simple_api_only: backend-specialist
    full_stack: full-stack-dev
    third_party_api: integration-specialist

  code_quality:
    refactor_needed: refactoring-agent
    tests_missing: testing-agent
    bugs_found: bug-hunter-agent
    slow_performance: performance-optimizer

  business_tasks:
    requirements: product-manager-agent
    analytics: data-analyst-agent
    deployment: devops-agent
    documentation: documentation-agent

workflow_templates:
  complete_feature:
    - product-manager-agent  # Generate user stories
    - full-stack-dev         # Implement feature
    - testing-agent          # Generate tests
    - code-reviewer (skill)  # Review code
    - deployment-check (skill) # Validate
    - devops-agent           # Deploy

  bug_fix_workflow:
    - bug-hunter-agent       # Identify root cause
    - refactoring-agent      # Fix code
    - testing-agent          # Add regression test
    - deployment-check (skill) # Validate

  new_integration:
    - integration-specialist # Build integration
    - testing-agent          # Test integration
    - documentation-agent    # Document API
    - devops-agent           # Deploy

quality_gates:
  - typescript_validation_required: true
  - tests_must_pass: true
  - rbac_permissions_required: true
  - documentation_required: true
  - deployment_check_required: true
```

---

## 🔀 Orchestrator Decision Logic

### 1. Task Analysis Phase

```typescript
interface TaskAnalysis {
  intent: string;              // What user wants
  complexity: 'simple' | 'medium' | 'complex';
  layers: ('frontend' | 'backend' | 'database' | 'integration')[];
  scope: 'single' | 'multiple';
  timeEstimate: number;        // Minutes
  requiresMultipleAgents: boolean;
}

function analyzeTask(userRequest: string): TaskAnalysis {
  // Example: "Implement customer referral program"

  return {
    intent: 'feature_implementation',
    complexity: 'complex',
    layers: ['database', 'backend', 'frontend'],
    scope: 'multiple',
    timeEstimate: 120,
    requiresMultipleAgents: true
  };
}
```

### 2. Agent Selection Phase

```typescript
interface AgentSelection {
  primary: SubAgent;
  supporting: SubAgent[];
  skills: Skill[];
}

function selectAgents(analysis: TaskAnalysis): AgentSelection {
  if (analysis.complexity === 'simple' && analysis.layers.length === 1) {
    // Single specialized agent
    if (analysis.layers.includes('frontend')) {
      return {
        primary: 'frontend-specialist',
        supporting: [],
        skills: ['test-generator']
      };
    }
  }

  if (analysis.complexity === 'complex' && analysis.requiresMultipleAgents) {
    // Multi-agent workflow
    return {
      primary: 'full-stack-dev',
      supporting: ['testing-agent', 'documentation-agent'],
      skills: ['deployment-check']
    };
  }

  // Default to full-stack for ambiguous tasks
  return {
    primary: 'full-stack-dev',
    supporting: ['testing-agent'],
    skills: ['deployment-check']
  };
}
```

### 3. Workflow Planning Phase

```typescript
interface WorkflowStep {
  agent: string;              // Sub-agent or skill name
  type: 'sub-agent' | 'skill';
  task: string;
  dependencies: string[];
  parallel: boolean;
}

interface Workflow {
  steps: WorkflowStep[];
  estimatedDuration: number;
  checkpoints: string[];
}

function planWorkflow(request: string, analysis: TaskAnalysis): Workflow {
  // Example: "Implement customer referral program"

  return {
    steps: [
      {
        agent: 'product-manager-agent',
        type: 'sub-agent',
        task: 'Generate user stories for referral program',
        dependencies: [],
        parallel: false
      },
      {
        agent: 'full-stack-dev',
        type: 'sub-agent',
        task: 'Implement referral program (DB + API + UI)',
        dependencies: ['product-manager-agent'],
        parallel: false
      },
      {
        agent: 'testing-agent',
        type: 'sub-agent',
        task: 'Generate comprehensive tests',
        dependencies: ['full-stack-dev'],
        parallel: false
      },
      {
        agent: 'code-reviewer',
        type: 'skill',
        task: 'Review code quality',
        dependencies: ['full-stack-dev'],
        parallel: true  // Can run parallel with testing-agent
      },
      {
        agent: 'documentation-agent',
        type: 'sub-agent',
        task: 'Generate user and technical docs',
        dependencies: ['full-stack-dev'],
        parallel: true  // Can run parallel with testing
      },
      {
        agent: 'deployment-check',
        type: 'skill',
        task: 'Validate deployment readiness',
        dependencies: ['testing-agent', 'code-reviewer', 'documentation-agent'],
        parallel: false
      },
      {
        agent: 'devops-agent',
        type: 'sub-agent',
        task: 'Deploy to production',
        dependencies: ['deployment-check'],
        parallel: false
      }
    ],
    estimatedDuration: 120, // minutes
    checkpoints: [
      'User stories complete',
      'Implementation complete',
      'Tests passing',
      'Code review passed',
      'Deployment successful'
    ]
  };
}
```

---

## 🎬 Orchestrator Workflows

### Workflow 1: Simple Feature (Frontend Only)

```
User: "Add a loading spinner to the dashboard"

Orchestrator Analysis:
- Intent: UI improvement
- Complexity: Simple
- Layers: Frontend only
- Agents needed: 1

Orchestrator Decision:
→ Invoke: frontend-specialist
→ No supporting agents needed
→ Skills: None (trivial change)

Execution:
1. frontend-specialist
   - Adds loading spinner component
   - Applies CircleTel design system
   - Updates dashboard component
   - Tests visually

Result: ✅ Spinner added in 10 minutes
```

---

### Workflow 2: Medium Complexity (API + Frontend)

```
User: "Add customer invoice download feature"

Orchestrator Analysis:
- Intent: Feature addition
- Complexity: Medium
- Layers: Backend, Frontend
- Agents needed: 2-3

Orchestrator Decision:
→ Primary: full-stack-dev
→ Supporting: testing-agent
→ Skills: deployment-check

Execution:
1. full-stack-dev
   - Creates /api/invoices/download endpoint
   - Builds InvoiceDownload component
   - Adds RBAC permission gate

2. testing-agent (parallel with step 3)
   - Generates API tests
   - Generates E2E test (download flow)

3. documentation-agent (parallel with step 2)
   - Documents API endpoint
   - Creates user guide

4. deployment-check (skill)
   - TypeScript validation
   - Build verification

Result: ✅ Feature complete in 45 minutes
```

---

### Workflow 3: Complex Feature (Full Stack + Integration)

```
User: "Implement customer referral program with reward tracking"

Orchestrator Analysis:
- Intent: New feature (complex)
- Complexity: Complex
- Layers: Database, Backend, Frontend, Business Logic
- Agents needed: 5+
- Integration: Reward system (may need payment integration)

Orchestrator Decision:
→ Primary: full-stack-dev
→ Supporting: product-manager-agent, testing-agent, integration-specialist, documentation-agent
→ Skills: deployment-check, code-reviewer, user-story-generator

Workflow Plan:
┌─────────────────────────────────────────────────┐
│ Phase 1: Planning (15 min)                     │
│   - product-manager-agent                       │
│     → Generate user stories                     │
│     → Define acceptance criteria                │
│     → Estimate story points                     │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Phase 2: Implementation (60 min)               │
│   - full-stack-dev                              │
│     → Create DB schema (referral_codes,         │
│       referral_rewards)                         │
│     → Build API routes                          │
│       - POST /api/referrals (create code)       │
│       - GET /api/referrals/stats                │
│       - POST /api/referrals/claim               │
│     → Build UI components                       │
│       - ReferralDashboard                       │
│       - ReferralCodeGenerator                   │
│       - ReferralRewardsTracker                  │
│     → Add RBAC permissions                      │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Phase 3: Quality Assurance (30 min - parallel) │
│   - testing-agent                               │
│     → Generate API tests                        │
│     → Generate E2E tests (referral flow)        │
│                                                 │
│   - code-reviewer (skill)                       │
│     → Check code quality                        │
│     → Validate RBAC usage                       │
│     → Check error handling                      │
│                                                 │
│   - documentation-agent                         │
│     → User guide (how to refer friends)         │
│     → Admin guide (reward configuration)        │
│     → API documentation                         │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Phase 4: Integration (15 min)                  │
│   - integration-specialist                      │
│     → Integrate with reward system              │
│     → Setup payment notifications (if needed)   │
│     → Configure email notifications             │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Phase 5: Deployment (10 min)                   │
│   - deployment-check (skill)                    │
│     → TypeScript validation                     │
│     → Build verification                        │
│     → Test execution                            │
│                                                 │
│   - devops-agent                                │
│     → Apply migrations                          │
│     → Deploy to staging                         │
│     → Run smoke tests                           │
│     → Deploy to production                      │
└─────────────────────────────────────────────────┘

Total Time: 130 minutes
Result: ✅ Complete referral program deployed
```

Orchestrator Execution:
```typescript
orchestrator.execute({
  userRequest: "Implement customer referral program",
  workflow: [
    { phase: 1, agent: 'product-manager-agent', task: 'user stories' },
    { phase: 2, agent: 'full-stack-dev', task: 'implementation' },
    {
      phase: 3,
      parallel: true,
      agents: [
        { agent: 'testing-agent', task: 'tests' },
        { agent: 'code-reviewer', type: 'skill', task: 'review' },
        { agent: 'documentation-agent', task: 'docs' }
      ]
    },
    { phase: 4, agent: 'integration-specialist', task: 'rewards integration' },
    {
      phase: 5,
      sequence: [
        { agent: 'deployment-check', type: 'skill', task: 'validation' },
        { agent: 'devops-agent', task: 'deploy' }
      ]
    }
  ],
  checkpoints: [
    'User stories approved',
    'Implementation complete',
    'Tests passing',
    'Code review passed',
    'Deployment successful'
  ]
});
```

---

## 🧩 Orchestrator Skills Integration

### Skill: Agent Selection

**Purpose**: Automatically select the best sub-agent for a task

```yaml
---
name: agent-selector
description: Analyzes task and selects optimal sub-agent
---

# Agent Selector Skill

## Decision Matrix

### Frontend Tasks
- "UI component" → frontend-specialist
- "styling" → frontend-specialist
- "responsive design" → frontend-specialist
- "accessibility" → frontend-specialist

### Backend Tasks
- "API endpoint" → backend-specialist
- "database schema" → backend-specialist
- "business logic" → backend-specialist

### Full Stack Tasks
- "feature" → full-stack-dev
- "complete implementation" → full-stack-dev
- "end-to-end" → full-stack-dev

### Quality Tasks
- "refactor" → refactoring-agent
- "tests" → testing-agent
- "bug" → bug-hunter-agent
- "performance" → performance-optimizer

### Operations Tasks
- "requirements" → product-manager-agent
- "report" → data-analyst-agent
- "deploy" → devops-agent
- "documentation" → documentation-agent

### Integration Tasks
- "third-party API" → integration-specialist
- "payment gateway" → integration-specialist
- "external service" → integration-specialist
```

---

### Skill: Workflow Orchestration

**Purpose**: Coordinate multi-agent workflows

```yaml
---
name: workflow-orchestrator
description: Manages complex multi-agent workflows with dependencies
---

# Workflow Orchestrator Skill

## Workflow Templates

### Template: Complete Feature
1. Requirements → product-manager-agent
2. Implementation → full-stack-dev
3. Testing (parallel) → testing-agent
4. Code Review (parallel) → code-reviewer skill
5. Documentation (parallel) → documentation-agent
6. Deployment → devops-agent

### Template: Bug Fix
1. Debug → bug-hunter-agent
2. Fix → refactoring-agent
3. Test → testing-agent
4. Deploy → deployment-check skill

### Template: Integration
1. Design → integration-specialist
2. Implement → integration-specialist
3. Test → testing-agent
4. Document → documentation-agent

## Dependency Management
- Tracks which agents have completed
- Unblocks dependent agents
- Handles errors and retries
- Provides progress updates
```

---

## 📊 Orchestrator Monitoring Dashboard

### Real-Time Workflow Tracking

```
┌─────────────────────────────────────────────────┐
│ Orchestrator Dashboard                          │
├─────────────────────────────────────────────────┤
│ Active Workflows: 2                             │
│                                                 │
│ Workflow 1: Customer Referral Program          │
│ ├─ ✅ product-manager-agent (completed 5m ago) │
│ ├─ 🔄 full-stack-dev (in progress, 45m)        │
│ ├─ ⏳ testing-agent (waiting)                   │
│ ├─ ⏳ code-reviewer (waiting)                   │
│ └─ ⏳ documentation-agent (waiting)             │
│                                                 │
│ Workflow 2: Invoice Download                   │
│ ├─ ✅ full-stack-dev (completed 10m ago)       │
│ ├─ 🔄 testing-agent (in progress, 15m)         │
│ └─ ⏳ deployment-check (waiting)                │
│                                                 │
│ Agent Utilization:                              │
│ ├─ full-stack-dev: 100% (1 active task)        │
│ ├─ testing-agent: 100% (1 active task)         │
│ ├─ frontend-specialist: 0% (idle)              │
│ └─ backend-specialist: 0% (idle)               │
└─────────────────────────────────────────────────┘
```

---

## 🎯 Orchestrator Success Metrics

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Task Routing Accuracy** | >95% | Correct agent selected |
| **Workflow Completion Rate** | >90% | Workflows completed without errors |
| **Average Routing Time** | <5 seconds | Time to select agents |
| **Multi-Agent Coordination** | >85% efficiency | Parallel vs sequential execution |
| **Quality Gate Pass Rate** | >95% | Workflows passing all quality checks |

---

## 🔧 Implementation Plan

### Phase 1: Orchestrator Core (Week 1)
- [ ] Build task analysis logic
- [ ] Implement agent selection matrix
- [ ] Create workflow planning engine
- [ ] Add basic coordination capabilities

### Phase 2: Advanced Workflows (Week 2)
- [ ] Add multi-agent workflows
- [ ] Implement parallel execution
- [ ] Add checkpoint tracking
- [ ] Build monitoring dashboard

### Phase 3: Intelligence Layer (Week 3)
- [ ] Add learning from past workflows
- [ ] Optimize agent selection based on performance
- [ ] Implement load balancing
- [ ] Add predictive time estimates

### Phase 4: Integration (Week 4)
- [ ] Integrate with all sub-agents
- [ ] Test complex workflows
- [ ] Train team on orchestrator usage
- [ ] Document best practices

---

## 📖 Orchestrator Usage Examples

### Example 1: Automatic Routing (Simple)

```
User: "Add a dark mode toggle to settings"

Orchestrator:
- Analyzes: UI-only change, simple
- Selects: frontend-specialist
- Executes: Single agent workflow
- Result: ✅ Complete in 15 minutes
```

---

### Example 2: Multi-Agent Coordination (Medium)

```
User: "Fix the slow customer dashboard and add caching"

Orchestrator:
- Analyzes: Performance + implementation, medium complexity
- Workflow:
  1. performance-optimizer (identify bottlenecks)
  2. full-stack-dev (implement caching)
  3. testing-agent (validate performance improvement)
- Result: ✅ Complete in 60 minutes
```

---

### Example 3: Complex Multi-Phase Project (Complex)

```
User: "Launch B2B multi-user accounts feature"

Orchestrator:
- Analyzes: Complex, multi-layer, requires planning
- Workflow (7 phases):
  1. product-manager-agent → User stories
  2. full-stack-dev → Core implementation
  3. Parallel:
     - testing-agent → Tests
     - integration-specialist → RBAC integration
     - documentation-agent → Docs
  4. code-reviewer → Quality check
  5. performance-optimizer → Optimize queries
  6. deployment-check → Validation
  7. devops-agent → Deploy

- Result: ✅ Complete in 4 hours (vs 2 weeks manual)
```

---

## 🚨 Error Handling

### Orchestrator Error Recovery

```typescript
interface ErrorRecovery {
  retry: boolean;
  maxRetries: number;
  fallback?: SubAgent;
  escalate: boolean;
}

function handleAgentFailure(
  agent: SubAgent,
  error: Error
): ErrorRecovery {

  if (error.type === 'timeout') {
    return {
      retry: true,
      maxRetries: 2,
      escalate: false
    };
  }

  if (error.type === 'capability_exceeded') {
    // Agent can't handle complexity
    return {
      retry: false,
      fallback: 'full-stack-dev', // More capable agent
      escalate: false
    };
  }

  if (error.type === 'fatal') {
    return {
      retry: false,
      escalate: true // Notify user
    };
  }
}
```

---

## 🎓 Training: Using the Orchestrator

### For Developers

**You don't need to think about which agent to use!**

Instead of:
```
❌ "Should I use full-stack-dev or frontend-specialist?"
❌ "Do I need testing-agent after this?"
```

Just describe what you want:
```
✅ "Implement customer referral program"
✅ "Fix the slow dashboard"
✅ "Add invoice download feature"
```

**The orchestrator handles**:
- Agent selection
- Workflow planning
- Quality checks
- Deployment validation

---

### For Business Teams

**Natural language requests work!**

```
✅ "I need a sales report for Q1"
   → Orchestrator → data-analyst-agent

✅ "Show me top performing marketing campaigns"
   → Orchestrator → marketing-insights skill

✅ "Generate executive dashboard"
   → Orchestrator → exec-dashboard skill
```

---

## 📝 Updated Master Plan Integration

### Add to MASTER_AI_ACCELERATION_PLAN.md

**Week 1 Addition**:
```markdown
### Week 1: Foundation & Developer Velocity

**Sub-Agents to Configure** (4):  ← Updated from 3
- [ ] orchestrator ⭐ NEW CRITICAL
- [ ] full-stack-dev
- [ ] frontend-specialist
- [ ] backend-specialist
```

**Pillar 2 Update**:
```markdown
### Pillar 2: Sub-Agents (Autonomous Intelligence)

**13 New Sub-Agents**: ← Updated from 12
1. orchestrator ⭐ CRITICAL - Task routing and coordination
2. full-stack-dev - Complete feature implementation
3. frontend-specialist - UI/UX development
... (rest unchanged)
```

---

## ✅ Orchestrator Checklist

### Pre-Implementation
- [ ] Review orchestrator specification
- [ ] Understand decision matrix
- [ ] Plan integration with existing sub-agents

### Week 1 Implementation
- [ ] Create `.claude/agents/orchestrator.yml`
- [ ] Implement task analysis logic
- [ ] Build agent selection matrix
- [ ] Test with simple workflows

### Week 2 Testing
- [ ] Test multi-agent workflows
- [ ] Validate parallel execution
- [ ] Measure routing accuracy
- [ ] Refine decision logic

### Week 3 Optimization
- [ ] Add monitoring dashboard
- [ ] Implement error recovery
- [ ] Optimize workflow planning
- [ ] Document best practices

---

## 🎯 Conclusion

**The Orchestrator is the brain of CircleTel's AI acceleration system.**

Without it:
- ❌ Manual agent selection (error-prone)
- ❌ No workflow coordination
- ❌ Inefficient execution

With it:
- ✅ Intelligent task routing
- ✅ Automatic multi-agent coordination
- ✅ Optimized parallel execution
- ✅ Quality gates enforced
- ✅ 3x faster overall delivery

**Priority**: **CRITICAL** - Implement in Week 1 before other sub-agents

---

**Document Version**: 1.0
**Created**: 2025-10-20
**Status**: ✅ Ready for Implementation
**Integration**: Add to Master AI Acceleration Plan Week 1
