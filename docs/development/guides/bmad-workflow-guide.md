# BMAD Workflow Guide for CircleTel

## Overview

This guide explains how to use the BMAD METHOD within the CircleTel development workflow, combining structured planning with our existing development practices.

## BMAD Integration Philosophy

### Hybrid Approach
- **Preserve Existing**: Keep valuable business requirements and product documentation
- **Enhance with BMAD**: Add structured epic/story development
- **Context Engineering**: Rich implementation context in every story
- **Quality Gates**: Systematic quality assurance

### CircleTel-Specific Adaptations
- **6-Day Sprints**: BMAD stories sized for rapid iteration
- **Component Reuse**: Stories reference existing CircleTel components
- **Business Alignment**: Every story connects to business objectives
- **Technical Consistency**: Stories maintain established patterns

## Workflow Stages

### Stage 1: Epic Planning

#### When to Create an Epic
- **Large Features**: Multiple stories, >5 days effort
- **Cross-Component Features**: Touches multiple areas of codebase
- **Business-Critical Features**: High impact on customer experience
- **Integration Projects**: External service integrations

#### Epic Planning Process
1. **Business Context** (Analyst Agent)
   - Review existing business requirements
   - Understand customer journey impact
   - Define success metrics

2. **Technical Architecture** (Architect Agent)
   - Design component structure
   - Plan integration patterns
   - Identify reusable components

3. **Story Breakdown** (Scrum Master Agent)
   - Break epic into implementable stories
   - Define story dependencies
   - Size stories for 6-day sprints

#### Epic Template
```markdown
# Epic: [Feature Name]

**Epic ID**: [XXX-001]
**Priority**: [High/Medium/Low]
**Sprint Target**: [Sprint Number]

## Business Context
- Customer impact
- Success metrics
- Market requirements

## Technical Context
- Current state
- Target architecture
- Integration points

## Story Breakdown
- Story 1: [Brief description] (X days)
- Story 2: [Brief description] (X days)
- ...

## Quality Gates
- Technical requirements
- Business requirements
- Security requirements
```

### Stage 2: Story Development

#### Story Creation Process
1. **Context Engineering**
   - Full business and technical context
   - Reference existing components
   - Define clear acceptance criteria

2. **Implementation Guidance**
   - Specific file paths and patterns
   - Code examples using CircleTel conventions
   - Integration with existing systems

3. **Quality Definition**
   - Testing requirements
   - Performance criteria
   - Security considerations

#### Story Template
```markdown
# Story: [Story Name]

**Story ID**: [XXX-001-01]
**Epic**: [Epic Name]
**Points**: [1-8]

## Context Engineering
### Current Architecture Context
[Existing code and patterns]

### Required Extensions
[What needs to be built]

### Integration Pattern
[How it fits with existing systems]

## Technical Implementation
[Detailed implementation steps]

## Acceptance Criteria
[Clear completion criteria]

## Definition of Done
[Quality checkpoints]
```

#### Story Development Workflow
```
Story Planning → Context Creation → Implementation → Quality Check → Review
```

### Stage 3: Quality Assurance

#### Quality Gate Types
1. **Story Gates**: Individual story completion
2. **Epic Gates**: Feature completion
3. **Sprint Gates**: Sprint readiness
4. **Release Gates**: Production readiness

#### Quality Gate Process
1. **Automated Checks**
   - TypeScript compilation
   - ESLint compliance
   - Build success

2. **Manual Validation**
   - User journey testing
   - Business requirement verification
   - Integration testing

3. **Review Process**
   - Code review
   - Business review
   - Security review

## BMAD Agent Usage

### When to Use Analyst Agent
- **Epic Planning**: Understanding business requirements
- **Market Research**: Competitor analysis and feature validation
- **Customer Journey**: Mapping user experience impact
- **Success Metrics**: Defining measurable outcomes

### When to Use Architect Agent
- **Technical Design**: Component architecture planning
- **Integration Planning**: External service integration
- **Performance Design**: Scalability and optimization
- **Security Architecture**: Data protection and access control

### When to Use Scrum Master Agent
- **Epic Breakdown**: Converting epics into stories
- **Sprint Planning**: Organizing stories for 6-day cycles
- **Dependency Management**: Identifying story dependencies
- **Risk Assessment**: Planning risk mitigation

### When to Use Developer Agent
- **Implementation Guidance**: Code patterns and examples
- **Component Design**: UI/UX implementation
- **Integration Code**: API integration patterns
- **Testing Strategy**: Unit and integration testing

### When to Use QA Agent
- **Quality Planning**: Defining testing approaches
- **User Acceptance**: End-to-end user journey validation
- **Performance Testing**: Load and performance validation
- **Security Testing**: Vulnerability assessment

## CircleTel-Specific Patterns

### Component Integration
```typescript
// Stories should reference existing patterns
import { FormLayout } from '@/components/forms/common/FormLayout';
import { useZohoMCP } from '@/hooks/use-zoho-mcp';

// Follow established CircleTel conventions
```

### State Management
```typescript
// Use existing patterns
const { data, isLoading, error } = useQuery({
  queryKey: ['feature-data'],
  queryFn: fetchFeatureData,
});
```

### Styling Consistency
```typescript
// Follow CircleTel design system
className="bg-circleTel-orange text-circleTel-white"
```

## File Organization

### BMAD Structure
```
docs/development/
├── epics/                  # Feature epics
│   ├── zoho-billing-integration.md
│   ├── order-system.md
│   └── customer-portal.md
├── stories/                # Implementation stories
│   ├── zbi-001-01-extend-zoho-mcp-billing.md
│   ├── zbi-001-02-billing-types-hooks.md
│   └── ...
└── qa/                     # Quality gates
    ├── assessments/        # Story completion assessments
    └── gates/              # Epic and release gates
```

### Integration with Existing Docs
```
docs/
├── business-requirements/  # ✅ Keep existing
├── products/              # ✅ Keep existing
├── technical/             # ✅ Keep existing
├── integrations/          # ✅ Keep existing
└── development/           # 🆕 Enhanced with BMAD
    ├── architecture/      # ✅ Keep + enhance
    ├── features/          # ✅ Keep existing
    ├── guides/            # ✅ Keep + enhance
    ├── standards/         # ✅ Keep + enhance
    ├── epics/             # 🆕 BMAD epics
    ├── stories/           # 🆕 BMAD stories
    └── qa/                # 🆕 BMAD quality gates
```

## Best Practices

### Epic Planning
- **Business First**: Start with customer impact
- **Technical Reality**: Use existing architecture
- **Scope Control**: Keep epics to 2 sprints max
- **Quality Focus**: Define clear success criteria

### Story Writing
- **Context Rich**: Include full implementation context
- **Pattern Aware**: Reference existing CircleTel components
- **Testable**: Clear acceptance criteria
- **Independent**: Stories can be developed independently

### Quality Gates
- **Automated First**: Automate what can be automated
- **Business Validation**: Test real user journeys
- **Security Minded**: Consider data protection
- **Performance Aware**: Monitor impact on app performance

## Common Workflows

### New Feature Development
1. **Analyze**: Business requirements and user impact
2. **Design**: Technical architecture using existing patterns
3. **Plan**: Break into stories with rich context
4. **Implement**: Develop using CircleTel conventions
5. **Validate**: Quality gates and user testing
6. **Deploy**: Production deployment with monitoring

### Integration Projects
1. **Research**: Understand external service capabilities
2. **Architect**: Design integration with existing systems
3. **Prototype**: Proof of concept with core functionality
4. **Extend**: Full integration with error handling
5. **Test**: End-to-end integration testing
6. **Monitor**: Production monitoring and alerting

### Bug Fixes and Enhancements
- **Small Changes**: Skip epic, create single story
- **Medium Changes**: Mini-epic with 2-3 stories
- **Large Changes**: Full epic with quality gates

## Success Metrics

### Development Velocity
- **Story Completion**: Stories completed per sprint
- **Quality Rate**: Stories passing quality gates first time
- **Context Retention**: Reduced "what was I building?" moments

### Code Quality
- **Consistency**: Code follows established patterns
- **Reusability**: Components reused across features
- **Maintainability**: Clear code with good documentation

### Business Alignment
- **Feature Success**: Features meet business objectives
- **Customer Impact**: Positive customer experience metrics
- **Technical Debt**: Minimal technical debt accumulation

---

*This guide evolves with CircleTel's development practices. Update as we learn and improve our BMAD integration.*