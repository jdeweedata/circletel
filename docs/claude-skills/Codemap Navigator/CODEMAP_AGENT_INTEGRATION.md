# Codemap Navigator - Agent Integration Guide

This document explains how CircleTel's 14 specialized agents use Windsurf Codemaps to enhance their workflows.

## Overview

Codemaps provide visual architecture understanding that complements each agent's specialized expertise. By integrating Codemaps into agent workflows, we achieve:

- **Faster onboarding** - Visual codebase understanding
- **Better decisions** - Full context before changes
- **Fewer bugs** - Understanding dependencies
- **Team alignment** - Shared architectural knowledge

## Agent-Specific Codemap Usage

### 1. Analyst Agent

**Primary Use**: Understanding how business requirements map to technical implementation

**Codemap Types**:
- Customer journey flows (landing → checkout → confirmation)
- Feature implementation paths
- Integration touchpoints

**Workflow**:
```
Business Requirement → Create Codemap → Identify implementation gaps → Recommend solutions
```

**Example**:
```
User: "Analyze how commission tracking would fit into our system"
Analyst: Creates "sales-partner-flow" Codemap → Identifies integration points → Recommends approach
```

---

### 2. Architect Agent

**Primary Use**: System design and architectural decisions

**Codemap Types**:
- Multi-layer architecture maps (UI → API → Service → Database)
- Integration patterns
- Data flow diagrams
- Scalability bottlenecks

**Workflow**:
```
Design Request → Review existing Codemaps → Identify patterns → Design new components → Update Codemaps
```

**Example**:
```
User: "Design a notification system"
Architect: Reviews "auth-flow" and "order-flow" Codemaps → Designs pub/sub pattern → Creates "notification-architecture" Codemap
```

---

### 3. Scrum Master Agent

**Primary Use**: Feature breakdown and dependency identification

**Codemap Types**:
- Feature dependency maps
- Module interaction diagrams
- Integration complexity visualizations

**Workflow**:
```
Epic → Create Codemap of affected systems → Identify dependencies → Break into stories → Sequence tasks
```

**Example**:
```
Epic: "Multi-currency support"
Scrum Master: Creates "payment-flow" Codemap → Identifies 5 affected modules → Creates 12 sequenced stories
```

---

### 4. Developer Agent (Full-Stack)

**Primary Use**: Complete feature implementation with full context

**Codemap Types**:
- End-to-end feature flows
- Database → Backend → Frontend chains
- State management patterns

**Workflow**:
```
Feature Request → Load relevant Codemap → Navigate to files → Implement → Update Codemap
```

**Example**:
```
User: "Add SMS notifications for order status"
Developer: @order-flow-map → Identifies notification points → Implements across 3 layers → Updates Codemap
```

---

### 5. Frontend Specialist Agent

**Primary Use**: Component hierarchy and UI flow understanding

**Codemap Types**:
- Component tree structures
- State management flows (Zustand, React Query)
- UI event chains

**Workflow**:
```
UI Task → Create component Codemap → Understand props flow → Implement → Test
```

**Example**:
```
User: "Refactor checkout form"
Frontend: Creates "checkout-component-hierarchy" Codemap → Identifies reusable components → Refactors
```

---

### 6. Backend Specialist Agent

**Primary Use**: API and service layer architecture

**Codemap Types**:
- API route structures
- Service layer dependencies
- Database query patterns
- Edge function flows

**Workflow**:
```
API Request → Map existing endpoints → Design new endpoint → Implement → Document in Codemap
```

**Example**:
```
User: "Add bulk product import API"
Backend: Reviews "admin-api-structure" Codemap → Designs endpoint → Implements with proper auth
```

---

### 7. Integration Specialist Agent

**Primary Use**: Third-party API integration visualization

**Codemap Types**:
- Provider integration flows (MTN, DFA, Zoho)
- Webhook processing chains
- Data transformation pipelines
- MCP server connections

**Workflow**:
```
Integration Request → Map existing integrations → Design new integration → Implement → Create Codemap
```

**Example**:
```
User: "Integrate Vodacom coverage API"
Integration: Reviews "mtn-integration" Codemap → Follows provider pattern → Implements Vodacom client
```

---

### 8. Bug Hunter Agent

**Primary Use**: Execution flow tracing for debugging

**Codemap Types**:
- Error propagation paths
- State mutation chains
- Authentication flow maps
- Data validation sequences

**Workflow**:
```
Bug Report → Create Codemap of affected flow → Trace execution → Identify root cause → Fix → Verify
```

**Example**:
```
Bug: "Users can't complete checkout"
Bug Hunter: Creates "checkout-error-flow" Codemap → Traces issue to payment validation → Fixes
```

---

### 9. Testing Agent

**Primary Use**: Test coverage analysis and E2E test planning

**Codemap Types**:
- User journey flows for E2E tests
- Critical path identification
- Integration test boundaries

**Workflow**:
```
Feature → Create Codemap → Identify test scenarios → Write Playwright tests → Verify coverage
```

**Example**:
```
User: "Test coverage for order flow"
Testing: Reviews "order-complete-journey" Codemap → Identifies 8 test scenarios → Implements E2E tests
```

---

### 10. Refactoring Agent

**Primary Use**: Safe refactoring with dependency awareness

**Codemap Types**:
- Dependency graphs
- Component usage maps
- Shared utility patterns

**Workflow**:
```
Refactor Request → Create dependency Codemap → Identify all usages → Refactor safely → Verify
```

**Example**:
```
User: "Extract shared coverage logic"
Refactoring: Creates "coverage-usage-map" → Identifies 12 usages → Extracts safely → Updates all
```

---

### 11. Performance Optimizer Agent

**Primary Use**: Bottleneck identification and optimization

**Codemap Types**:
- Request flow timing maps
- Database query chains
- Caching layer visualization
- Bundle dependency graphs

**Workflow**:
```
Performance Issue → Map execution flow → Identify bottlenecks → Optimize → Measure improvement
```

**Example**:
```
Issue: "Coverage check is slow"
Optimizer: Creates "coverage-performance-map" → Identifies N+1 queries → Adds caching → 80% faster
```

---

### 12. Documentation Agent

**Primary Use**: Architecture documentation generation

**Codemap Types**:
- System architecture overviews
- Feature implementation guides
- Integration documentation

**Workflow**:
```
Documentation Request → Create/Reference Codemap → Generate docs → Include Codemap links
```

**Example**:
```
User: "Document the payment flow"
Documentation: Creates "payment-architecture" Codemap → Writes guide → Links Codemap for visual reference
```

---

### 13. Product Manager Agent

**Primary Use**: Technical feasibility assessment

**Codemap Types**:
- Feature impact maps
- Integration complexity visualizations
- User journey implementations

**Workflow**:
```
Feature Request → Review Codemaps → Assess complexity → Estimate effort → Prioritize
```

**Example**:
```
Request: "Add subscription billing"
PM: Reviews "billing-flow" and "payment-integration" Codemaps → Estimates 3 sprints → Prioritizes
```

---

### 14. MCP Manager Agent

**Primary Use**: MCP server configuration and troubleshooting

**Codemap Types**:
- MCP server connection maps
- Integration point visualizations
- Data flow through MCP servers

**Workflow**:
```
MCP Issue → Create integration Codemap → Identify problem → Fix → Verify
```

**Example**:
```
Issue: "Zoho MCP not responding"
MCP Manager: Creates "zoho-mcp-flow" Codemap → Identifies timeout → Adjusts config → Tests
```

---

## Orchestrator Agent Integration

The **Orchestrator Agent** uses Codemaps to coordinate multi-agent workflows:

### Workflow Example

```
User: "Implement commission tracking for sales partners"

Orchestrator Analysis:
1. Creates "sales-partner-architecture" Codemap
2. Identifies affected systems: Auth, Orders, Payments, Admin
3. Assigns agents based on Codemap insights:
   - Architect: Design commission schema
   - Backend: Implement tracking APIs
   - Frontend: Build admin dashboard
   - Testing: Create E2E tests

Result: All agents work with shared architectural understanding
```

### Handoff Protocol

When Orchestrator hands off between agents:

1. **Share Codemap reference**: `@commission-tracking-map`
2. **Highlight relevant sections**: "Focus on payment integration nodes"
3. **Update after completion**: Agent updates Codemap with changes
4. **Next agent receives**: Updated Codemap with new context

---

## Standard Codemap Naming Conventions

To maintain consistency across agent workflows:

### Format

```
{system}-{aspect}-{type}
```

### Examples

- `coverage-multi-provider-flow`
- `auth-rbac-enforcement-map`
- `order-checkout-journey`
- `admin-dashboard-structure`
- `mcp-zoho-integration`
- `payment-netcash-webhook-flow`

### Types

- `-flow`: Execution sequence
- `-map`: Architecture overview
- `-structure`: Component hierarchy
- `-integration`: Third-party connections
- `-journey`: User experience path

---

## Codemap Lifecycle Management

### Creation

**When to create:**
- New feature development starts
- Complex bug investigation begins
- Architecture documentation needed
- Onboarding new team member

**Who creates:**
- Architect Agent: System-level maps
- Developer Agent: Feature-level maps
- Integration Specialist: Provider maps
- Documentation Agent: Reference maps

### Maintenance

**Update triggers:**
- Architecture changes
- New integrations added
- Major refactoring completed
- Bug fixes that change flow

**Responsible agents:**
- Agent that made the change updates the Codemap
- Documentation Agent reviews quarterly
- Architect Agent validates accuracy

### Archival

**When to archive:**
- Feature deprecated
- System replaced
- No longer relevant

**Process:**
1. Mark as `[ARCHIVED]` in name
2. Move to `archived-codemaps/` folder
3. Document reason in description
4. Keep for historical reference

---

## Best Practices for Agent Codemap Usage

### Do's ✅

1. **Reference existing Codemaps** before starting work
2. **Create Codemaps** for complex multi-file changes
3. **Update Codemaps** after significant changes
4. **Share Codemaps** in agent handoffs
5. **Use @-mentions** in Cascade conversations
6. **Name consistently** following conventions
7. **Document decisions** in Codemap descriptions

### Don'ts ❌

1. **Don't create** for trivial single-file changes
2. **Don't let Codemaps** become stale
3. **Don't skip** Codemap review before refactoring
4. **Don't forget** to update after changes
5. **Don't create** duplicate Codemaps
6. **Don't use** vague names
7. **Don't work** without checking existing maps

---

## Integration with AGENTS.md Workflows

### Agent Workflow Template

```markdown
### [Agent Name] Workflow with Codemaps

**Before Starting:**
1. Check for relevant Codemaps
2. Review architecture context
3. Identify dependencies

**During Work:**
1. Reference Codemap nodes
2. Navigate using Codemap
3. Note changes needed

**After Completion:**
1. Update affected Codemaps
2. Create new Codemap if needed
3. Document in handoff
```

### Example Integration

```markdown
### Developer Agent Workflow

**Task**: Implement new feature

**Step 1: Context Gathering**
- Load relevant Codemaps: `@feature-area-map`
- Review architecture: Click through nodes
- Identify files to modify: Note from Codemap

**Step 2: Implementation**
- Navigate using Codemap: Click to file locations
- Implement changes: Follow established patterns
- Test integration: Verify flow in Codemap

**Step 3: Documentation**
- Update Codemap: Add new nodes/connections
- Document changes: Update descriptions
- Share with team: Link in PR description
```

---

## Measuring Codemap Effectiveness

### Success Metrics

**Development Speed:**
- Time to understand new feature area
- Time to locate relevant code
- Time to complete implementation

**Code Quality:**
- Fewer bugs from missed dependencies
- Better architectural consistency
- Improved code review quality

**Team Collaboration:**
- Faster onboarding of new developers
- Better knowledge sharing
- Reduced duplicate work

### Tracking Usage

**Per Agent:**
- Codemaps created
- Codemaps referenced
- Codemaps updated

**Per Feature:**
- Codemap usage in development
- Issues prevented by Codemap review
- Time saved vs. manual exploration

---

## Future Enhancements

### Planned Improvements

1. **Automated Codemap Generation**
   - Generate on feature completion
   - Auto-update on file changes
   - Suggest Codemaps for PRs

2. **Codemap Templates**
   - Standard patterns for common flows
   - Quick-start Codemaps for new features
   - Best practice examples

3. **Integration with CI/CD**
   - Validate Codemap accuracy in builds
   - Alert on stale Codemaps
   - Generate coverage reports

4. **Enhanced Collaboration**
   - Real-time Codemap editing
   - Comment threads on nodes
   - Version history tracking

---

## Summary

Windsurf Codemaps are a powerful tool for all 14 CircleTel agents. By providing visual architecture understanding, they enable:

- **Faster development** - Navigate code efficiently
- **Better quality** - Understand dependencies
- **Team alignment** - Shared architectural knowledge
- **Reduced bugs** - Catch issues before they happen

**Key Takeaway**: Every agent should check for relevant Codemaps before starting work and update them after making changes.

---

**Ready to integrate Codemaps into your agent workflows?** Start by creating your first Codemap today! 🗺️
