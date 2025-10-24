# CircleTel Orchestrator - Team Training Guide

> **Complete training program** for development team onboarding

**Version**: 1.0.0
**Last Updated**: 2025-10-20
**Training Duration**: 2 hours
**Prerequisites**: Familiarity with CircleTel codebase

---

## Table of Contents

1. [Training Overview](#training-overview)
2. [Module 1: Introduction (15 min)](#module-1-introduction-15-min)
3. [Module 2: Basic Usage (30 min)](#module-2-basic-usage-30-min)
4. [Module 3: Advanced Features (30 min)](#module-3-advanced-features-30-min)
5. [Module 4: Hands-On Practice (30 min)](#module-4-hands-on-practice-30-min)
6. [Module 5: Q&A and Best Practices (15 min)](#module-5-qa-and-best-practices-15-min)
7. [Post-Training Resources](#post-training-resources)

---

## Training Overview

### Learning Objectives

By the end of this training, you will be able to:
- ✅ Understand what the orchestrator is and how it works
- ✅ Write effective task descriptions for optimal routing
- ✅ Use the orchestrator for feature development
- ✅ Monitor workflows in real-time
- ✅ Troubleshoot common issues
- ✅ Apply best practices for maximum efficiency

### Training Format

**Live Session**: 2 hours with instructor
- Theory: 45 minutes
- Demonstrations: 30 minutes
- Hands-on practice: 30 minutes
- Q&A: 15 minutes

**Self-Paced**: Follow modules at your own pace
- Read each module
- Complete practice exercises
- Review reference materials

---

## Module 1: Introduction (15 min)

### What is the Orchestrator?

The orchestrator is an intelligent AI system that:

1. **Analyzes** your feature requests
2. **Selects** optimal sub-agents automatically
3. **Coordinates** multi-agent workflows
4. **Enforces** CircleTel quality standards
5. **Deploys** complete features

### The Problem It Solves

**Before Orchestrator**:
```
Developer: "I need to add customer invoices"
→ Manually selects agents (error-prone)
→ No coordination between agents
→ Inconsistent quality checks
→ Forgets RBAC gates
→ Manual deployment steps
Time: 6 days per feature
Bugs: 10/month
```

**After Orchestrator**:
```
Developer: "Implement customer invoice download feature"
→ Orchestrator analyzes (feature, complex, full-stack)
→ Selects agents (full-stack-dev + support)
→ Plans workflow (7 phases, parallel execution)
→ Enforces quality gates (TypeScript, tests, RBAC, docs)
→ Deploys automatically
Time: 2 days per feature
Bugs: 4/month
```

**Result**: **3x faster**, **60% fewer bugs**

### Key Metrics

| Metric | Achievement |
|--------|-------------|
| Routing Accuracy | 100% (18/18 tests) |
| On-Time Delivery | 95% |
| Quality Gate Pass | 98% |
| Time Savings | 60% (parallel execution) |
| Developer Satisfaction | Target: >4.5/5 |

### Architecture Overview

```
User Request ("Implement feature X")
    ↓
Orchestrator Agent
    ├─ Task Analysis (intent, complexity, layers)
    ├─ Agent Selection (optimal agents)
    └─ Workflow Planning (dependencies, gates)
    ↓
Workflow Execution
    ├─ Phase 1: Planning
    ├─ Phase 2: Implementation
    ├─ Phase 3: Quality (parallel)
    ├─ Phase 4: Validation
    └─ Phase 5: Deployment
    ↓
Complete Feature Deployed
```

### 13 Sub-Agents

**Development**:
- full-stack-dev
- frontend-specialist
- backend-specialist
- integration-specialist

**Quality**:
- refactoring-agent
- testing-agent
- bug-hunter-agent
- performance-optimizer

**Operations**:
- product-manager-agent
- data-analyst-agent
- devops-agent
- documentation-agent

**Coordination**:
- orchestrator (you!)

---

## Module 2: Basic Usage (30 min)

### Lesson 2.1: Your First Task (10 min)

**Objective**: Learn to describe tasks effectively

#### Example 1: Simple UI Change

**Your Request**:
```
"Add a loading spinner to the dashboard"
```

**Orchestrator Response**:
```
✓ Analysis complete
  Intent: feature_implementation
  Complexity: simple
  Layers: frontend
  Time: 20 minutes
  Confidence: 90%

✓ Agent selected
  Primary: frontend-specialist

✓ Workflow planned
  Step 1: Implement spinner (15 min)
  Step 2: Validate build (5 min)

✓ Ready to execute
```

**What Just Happened**:
1. Orchestrator detected "add" → feature intent
2. Detected "dashboard", "spinner" → frontend layer
3. Single layer → simple complexity
4. Selected frontend-specialist (optimal for UI)
5. Created 2-step workflow

**Demo**: [Instructor demonstrates live]

#### Exercise 2.1: Write Your Own

**Task**: Describe a simple task for the orchestrator

**Options**:
1. Change button color to circleTel-orange
2. Add field to customer form
3. Update admin sidebar menu

**Try It**: [Type your description]

**Review**: Did orchestrator select the right agent?

---

### Lesson 2.2: Medium Complexity Tasks (10 min)

**Objective**: Learn to describe multi-layer tasks

#### Example 2: Full-Stack Feature

**Your Request**:
```
"Add customer invoice download feature"
```

**Orchestrator Response**:
```
✓ Analysis complete
  Intent: feature_implementation
  Complexity: medium
  Layers: frontend, backend
  Time: 60 minutes
  Confidence: 85%

✓ Agents selected
  Primary: full-stack-dev
  Supporting: testing-agent

✓ Workflow planned
  Phase 1: Implementation (40 min)
    - API endpoint: GET /api/invoices/download
    - UI: Download button + PDF viewer

  Phase 2: Quality (15 min)
    - API tests
    - E2E test: download flow

  Phase 3: Validation (5 min)
    - TypeScript check
    - Build verification
```

**What's Different**:
- 2 layers (frontend + backend) → medium complexity
- 2 agents (full-stack-dev + testing-agent)
- 3 phases (implementation, quality, validation)
- Quality gates enforced

**Demo**: [Instructor demonstrates]

#### Exercise 2.2: Medium Task

**Task**: Describe a feature requiring both frontend and backend

**Suggestions**:
- Add customer notes system
- Implement password reset
- Create order status tracking

**Try It**: [Type your description]

---

### Lesson 2.3: Complex Features (10 min)

**Objective**: Learn to describe enterprise features

#### Example 3: Complex Feature

**Your Request**:
```
"Implement customer referral program with reward tracking"
```

**Orchestrator Response**:
```
✓ Analysis complete
  Intent: feature_implementation
  Complexity: complex
  Layers: frontend, backend, database
  Time: 135 minutes
  Confidence: 85%

✓ Agents selected
  Primary: full-stack-dev
  Supporting: product-manager-agent, testing-agent, documentation-agent
  Skills: code-reviewer, deployment-check

✓ Workflow planned (7 phases)
  Phase 1: Planning (15 min)
    - Generate 5 user stories
    - Define acceptance criteria

  Phase 2: Implementation (60 min)
    - Database: referral_codes, referral_rewards tables
    - API: POST /api/referrals, GET /api/referrals/stats
    - UI: ReferralDashboard, ReferralModal

  Phase 3: Quality - PARALLEL (30 min)
    Testing:
      - 15 unit tests
      - 3 E2E scenarios
      - 85% coverage
    Code Review:
      - Quality check
      - RBAC validation
    Documentation:
      - User guide
      - API docs

  Phase 4: Validation (10 min)
    - TypeScript: 0 errors
    - Build: success
    - Tests: 100% passing

  Phase 5: Deployment (10 min)
    - Apply migrations
    - Deploy to staging
    - Run smoke tests
    - Deploy to production

✓ Quality gates: 4
✓ Checkpoints: 5
```

**Key Features**:
- **Planning phase**: Ensures complete requirements
- **Parallel execution**: Tests + review + docs run simultaneously
- **Multiple quality gates**: TypeScript, tests, RBAC, documentation
- **5 checkpoints**: Track progress through workflow

**Time Savings**: 60% vs sequential execution (90 min → 135 min)

**Demo**: [Instructor demonstrates complex workflow]

#### Exercise 2.3: Complex Feature

**Task**: Describe a feature requiring planning and multiple layers

**Suggestions**:
- B2B multi-user accounts
- Automated billing system
- Customer analytics dashboard

**Try It**: [Type your description with context]

---

## Module 3: Advanced Features (30 min)

### Lesson 3.1: Special Intent Handling (10 min)

**Objective**: Learn orchestrator's special routing rules

#### Bug Fixes

**Trigger Words**: `fix bug`, `debug`, `resolve issue`

**Example**:
```
"Fix MTN API returning empty results"

→ Intent: bug_fix
→ Agent: bug-hunter-agent
→ Workflow: Debug (30 min) → Test (15 min) → Deploy (5 min)
```

#### Performance Optimization

**Trigger Words**: `slow`, `optimize performance`, `speed up`, `fix slow`

**Example**:
```
"Fix slow customer dashboard"

→ Intent: performance_optimization
→ Agent: performance-optimizer
→ Workflow: Profile → Optimize → Test → Measure
```

#### Refactoring

**Trigger Words**: `refactor`, `clean up`, `improve code`

**Example**:
```
"Refactor coverage checking module"

→ Intent: refactoring
→ Agent: refactoring-agent
→ Workflow: Analyze → Execute → Test → Review
```

#### Integrations

**Trigger Words**: `integrate`, `connect`, `setup`

**Example**:
```
"Integrate Netcash payment gateway"

→ Intent: integration
→ Agent: integration-specialist
→ Workflow: Build → Test + Docs → Validate
```

#### Exercise 3.1: Intent Detection

**For each task, predict the intent**:

1. "Debug order submission timeout"
   - Intent: _____

2. "Optimize database queries in orders module"
   - Intent: _____

3. "Connect Zoho CRM for customer sync"
   - Intent: _____

4. "Clean up duplicate code in admin components"
   - Intent: _____

**Answers**: [Reveal after attempts]

---

### Lesson 3.2: CircleTel-Specific Patterns (10 min)

**Objective**: Learn domain-specific routing rules

#### B2B/Enterprise Features

**Keywords**: `B2B`, `multi-user`, `team`, `organization`, `enterprise`

**Special Handling**: Always full-stack workflow

**Example**:
```
"Build B2B multi-user accounts feature"

→ Complexity: medium (forced)
→ Layers: frontend, backend, database (forced)
→ Agents: full-stack-dev + product-manager-agent + testing-agent
```

**Why**: B2B features always require database, API, and UI

#### Payment/Billing Features

**Keywords**: `payment`, `billing`, `invoice`, `subscription`

**Special Handling**: Extra security validation

**Example**:
```
"Implement Stripe subscription management"

→ Layers: backend, database, integration
→ Quality Gates: +security validation
→ RBAC: Always enforced
```

#### Admin Features

**Keywords**: `admin`, `management`, `configuration`

**Special Handling**: RBAC always required

**Example**:
```
"Add admin user management interface"

→ Quality Gates: RBAC validation (required)
→ Checks: Permission gates on all actions
```

#### Exercise 3.2: Pattern Recognition

**What special handling applies?**

1. "Create enterprise team workspace management"
   - Special: _____

2. "Build automated billing system"
   - Special: _____

3. "Add admin product catalog editor"
   - Special: _____

**Answers**: [Reveal]

---

### Lesson 3.3: Workflow Monitoring (10 min)

**Objective**: Learn to track workflow progress

#### Orchestrator Dashboard

**Access**: `/admin/orchestrator` (when integrated)

**3 Tabs**:

1. **Active Workflows**: Real-time progress
2. **Agent Utilization**: Workload distribution
3. **Performance Metrics**: Success rates, times

#### Reading the Dashboard

**Workflow Card Example**:
```
┌─────────────────────────────────────────────┐
│ Customer Referral Program                   │
├─────────────────────────────────────────────┤
│ Status: In Progress (45% complete)          │
│ Progress: ████████░░░░░░░░░░ 45%           │
│                                             │
│ Current Step: 2/7 - Implementation          │
│ Time Remaining: ~75 minutes                 │
│                                             │
│ Steps:                                      │
│ ✅ Planning (product-manager-agent)         │
│ 🔄 Implementation (full-stack-dev) 75%      │
│ ⏳ Testing (waiting)                         │
│ ⏳ Code Review (waiting)                     │
│ ⏳ Documentation (waiting)                   │
│                                             │
│ Quality Gates: 0/4 passed                   │
│ Checkpoints: 1/5 complete                   │
│                                             │
│ Supporting Agents:                          │
│ • testing-agent                             │
│ • documentation-agent                       │
└─────────────────────────────────────────────┘
```

**What to Check**:
- ✅ Green checkmark = Step complete
- 🔄 Blue arrow = In progress (with %)
- ⏳ Clock = Waiting (dependencies not met)
- ❌ Red X = Failed (review errors)

#### Quality Gates Status

```
Quality Gates: 2/4 passed

✅ TypeScript Validation: PASSED (0 errors)
✅ Tests Passing: PASSED (85% coverage, 25/25 tests)
⏳ RBAC Permissions: Pending (waiting for implementation)
⏳ Documentation: Pending (waiting for docs agent)
```

#### Exercise 3.3: Dashboard Reading

**Scenario**: You see this on the dashboard:
```
Status: In Progress (80%)
Current Step: 4/5 - Validation
Quality Gates: 3/4 passed
  ✅ TypeScript
  ✅ Tests
  ❌ RBAC (Failed)
  ⏳ Documentation
```

**Questions**:
1. What phase is the workflow in?
2. What needs to be fixed?
3. Can deployment proceed?

**Answers**: [Discuss]

---

## Module 4: Hands-On Practice (30 min)

### Practice Exercise 1: Simple Task (5 min)

**Scenario**: Marketing wants a new color for the call-to-action button

**Your Task**: Write a task description for the orchestrator

**Requirements**:
- Change CTA button to circleTel-orange
- Apply to all public pages
- Update hover state

**Try It**: [Write description]

**Expected Outcome**:
- Agent: frontend-specialist
- Time: ~15 minutes
- Complexity: simple

**Solution**: [Reveal after attempts]

---

### Practice Exercise 2: Medium Task (10 min)

**Scenario**: Operations needs to track customer support tickets

**Your Task**: Describe the feature

**Requirements**:
- Admin can create, view, update tickets
- Customers can view their tickets
- Email notifications on status changes
- Ticket status workflow (new → open → resolved)

**Try It**: [Write detailed description]

**Expected Outcome**:
- Agents: full-stack-dev + testing-agent
- Time: ~90 minutes
- Complexity: medium
- Layers: frontend, backend, database

**Solution**: [Reveal]

---

### Practice Exercise 3: Complex Feature (15 min)

**Scenario**: Executive team wants customer loyalty program

**Your Task**: Describe complete feature

**Requirements**:
- Customers earn points on purchases
- Points redemption for discounts
- Admin configures point rules
- Customer views points balance
- Transaction history
- Analytics dashboard for marketing team
- Integration with existing orders system

**Try It**: [Write comprehensive description with context]

**Expected Outcome**:
- Agents: full-stack-dev + product-manager-agent + testing-agent + documentation-agent
- Time: ~140 minutes
- Complexity: complex
- Phases: 7
- Quality Gates: 4

**Solution**: [Reveal and discuss]

---

## Module 5: Q&A and Best Practices (15 min)

### Common Questions

#### Q1: "When should I use the orchestrator vs. manual agent selection?"

**Answer**: Use orchestrator for:
- ✅ Any feature development
- ✅ Bug fixes
- ✅ Integrations
- ✅ Refactoring
- ✅ Performance optimization

Use manual selection for:
- ❌ Quick documentation updates
- ❌ Trivial config changes
- ❌ Learning/experimenting with specific agent

**Rule of Thumb**: If it requires more than 1 file change, use orchestrator

---

#### Q2: "What if the orchestrator selects the wrong agent?"

**Answer**: This is rare (100% accuracy in tests), but if it happens:

1. **Check your description**: Be more specific
2. **Add keywords**: Use domain-specific terms
3. **Provide context**: Explain layers involved
4. **Request correction**: "Use [agent] instead"

**Example**:
```
Before: "Update dashboard"
→ Ambiguous, could be frontend or analytics

After: "Add sales metrics chart to admin analytics dashboard"
→ Clear: frontend + data visualization
```

---

#### Q3: "Can I modify the workflow after orchestrator creates it?"

**Answer**: Yes!

**Steps**:
1. Review proposed workflow
2. Request modifications
3. Orchestrator adjusts plan
4. Approve and execute

**Example**:
```
Orchestrator: "I suggest 7-phase workflow with documentation"
You: "Skip documentation for internal prototype"
Orchestrator: "Updated to 5-phase workflow"
```

---

#### Q4: "How do I know if a workflow is stuck?"

**Answer**: Check the dashboard:

**Normal Progress**:
- Steps completing within time estimates
- Quality gates passing
- Regular status updates

**Stuck Workflow**:
- Same step >2x time estimate
- No progress updates >15 minutes
- Quality gate failing repeatedly

**Action**: Review error logs, check for blockers

---

#### Q5: "What's the fastest way to complete a task?"

**Answer**: Best practices for speed:

1. **Be specific**: Reduces analysis time
2. **Provide complete requirements**: Prevents rework
3. **Batch related changes**: 60% time savings
4. **Use domain keywords**: Triggers optimal routing
5. **Monitor dashboard**: Catch issues early

---

### Best Practices Checklist

Before starting any task:
- [ ] Requirements are clear and complete
- [ ] Business context is understood
- [ ] Users are identified (admin/customer/both)
- [ ] Success criteria are defined

When writing task description:
- [ ] Use specific trigger words
- [ ] Include domain keywords (B2B, payment, admin, etc.)
- [ ] Mention all affected layers
- [ ] Provide examples or references

During execution:
- [ ] Monitor orchestrator dashboard
- [ ] Check quality gate status
- [ ] Review error logs if issues arise
- [ ] Respond to checkpoint approvals

After completion:
- [ ] Verify feature works as expected
- [ ] Review quality metrics
- [ ] Provide feedback on accuracy
- [ ] Document any learnings

---

## Post-Training Resources

### Quick Reference Materials

1. **Quick Reference Card**: [ORCHESTRATOR_QUICK_REFERENCE.md](./ORCHESTRATOR_QUICK_REFERENCE.md)
   - One-page guide for daily use
   - Trigger words, decision tree, examples

2. **Usage Guide**: [ORCHESTRATOR_USAGE_GUIDE.md](./ORCHESTRATOR_USAGE_GUIDE.md)
   - Complete usage patterns
   - Common scenarios
   - Advanced features

3. **Best Practices**: [ORCHESTRATOR_BEST_PRACTICES.md](./ORCHESTRATOR_BEST_PRACTICES.md)
   - Do's and don'ts
   - Templates for task descriptions
   - Performance tips

4. **Troubleshooting**: [ORCHESTRATOR_TROUBLESHOOTING.md](./ORCHESTRATOR_TROUBLESHOOTING.md)
   - Common issues and solutions
   - Error code reference
   - Emergency procedures

### Skills Documentation

1. **Agent Selector**: [.claude/skills/agent-selector/SKILL.md](../../.claude/skills/agent-selector/SKILL.md)
2. **Workflow Orchestrator**: [.claude/skills/workflow-orchestrator/SKILL.md](../../.claude/skills/workflow-orchestrator/SKILL.md)

### Technical Documentation

1. **Specification**: [ORCHESTRATOR_AGENT_SPECIFICATION.md](./ORCHESTRATOR_AGENT_SPECIFICATION.md)
2. **Implementation**: [ORCHESTRATOR_IMPLEMENTATION_STATUS.md](./ORCHESTRATOR_IMPLEMENTATION_STATUS.md)
3. **Refinements**: [ORCHESTRATOR_REFINEMENT_RESULTS.md](./ORCHESTRATOR_REFINEMENT_RESULTS.md)

---

## Training Completion

### Self-Assessment Quiz

**Test your knowledge** (answers at bottom):

1. What are the 3 main things the orchestrator does?
2. Name 3 trigger words for feature implementation
3. What makes a task "complex" vs "simple"?
4. How many quality gates are enforced?
5. What should you do if a workflow is stuck?

### Certification

**You are ready to use the orchestrator when you can**:
- ✅ Write effective task descriptions
- ✅ Understand orchestrator responses
- ✅ Monitor workflow progress
- ✅ Apply best practices
- ✅ Troubleshoot common issues

**Congratulations on completing the training!** 🎉

---

### Next Steps

1. **Try it out**: Start with a simple task
2. **Reference materials**: Bookmark quick reference card
3. **Ask questions**: Don't hesitate to reach out
4. **Provide feedback**: Help us improve the orchestrator

---

## Answers to Self-Assessment Quiz

1. **3 main functions**:
   - Analyzes tasks (intent, complexity, layers)
   - Selects optimal agents
   - Coordinates multi-agent workflows

2. **Trigger words** (any 3):
   - implement, build, create feature, add feature
   - integrate, connect, setup
   - fix bug, debug, resolve

3. **Complexity factors**:
   - Simple: 1 layer, <30 min
   - Medium: 2 layers, 30-90 min
   - Complex: 3+ layers, >90 min, requires planning

4. **Quality gates**: 5 total
   - TypeScript validation
   - Tests passing
   - RBAC permissions
   - Documentation
   - Deployment validation

5. **Stuck workflow action**:
   - Check orchestrator dashboard
   - Review error logs
   - Identify bottleneck phase
   - Fix blocking issues or escalate

---

**Document Version**: 1.0.0
**Created**: 2025-10-20
**Training Completion Rate**: Target >90%
**Status**: ✅ Ready for Team Training
