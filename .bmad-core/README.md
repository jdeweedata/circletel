# BMAD Core Configuration for CircleTel

## Overview

This directory contains the BMAD METHOD configuration for the CircleTel Digital Service Provider platform. BMAD METHOD provides structured, AI-assisted development with context-rich stories and quality gates.

## Directory Structure

```
.bmad-core/
├── README.md              # This file
├── core-config.yaml       # Main BMAD configuration
├── agents/                # Agent configurations
│   └── team-circletel.txt # CircleTel agent team setup
├── data/                  # Project context data
│   └── technical-preferences.md
├── tasks/                 # Reserved for task management
└── templates/             # Reserved for story templates
```

## Configuration Files

### core-config.yaml
Main configuration defining:
- Project context and objectives
- Technical stack preferences (Next.js 15, TypeScript, Tailwind, Supabase)
- Team roles and workflow (6-day sprints)
- Agent configurations
- Quality gate definitions
- Documentation structure

### agents/team-circletel.txt
Agent team configuration with:
- **Analyst Agent**: Business requirements and market analysis
- **Architect Agent**: Technical architecture and system design
- **Scrum Master Agent**: Feature breakdown and story creation
- **Developer Agent**: Implementation guidance and code patterns
- **QA Agent**: Quality assurance and testing strategy

### data/technical-preferences.md
CircleTel-specific technical patterns:
- Component architecture standards
- Styling and design system usage
- Data management patterns
- File organization conventions
- Integration preferences

## Integration with CircleTel

### Existing Documentation Preserved
- Business requirements in `docs/business-requirements/`
- Product specifications in `docs/products/`
- Technical documentation in `docs/technical/`
- User journeys in `docs/user-journey/`

### BMAD Enhancements Added
- Epic planning in `docs/development/epics/`
- Context-rich stories in `docs/development/stories/`
- Quality gates in `docs/development/qa/`

### Hybrid Development Approach
```
Traditional Planning → BMAD Epic Planning → Context-Rich Stories → Quality Gates → Implementation
```

## Current Epics

### Zoho Billing Integration (ZBI-001)
**Status**: Planning
**Priority**: High
**Target**: Sprint 42 (October 2025)

**Stories**:
- ZBI-001-01: Extend Zoho MCP with billing actions (3 days)
- ZBI-001-02: Create billing TypeScript types and hooks (1 day)
- ZBI-001-03: Build admin invoice management interface (2 days)
- ZBI-001-04: Implement customer billing portal (2 days)
- ZBI-001-05: Set up payment status webhooks (1 day)
- ZBI-001-06: Invoice auto-generation from orders (2 days)
- ZBI-001-07: Billing dashboard analytics (1 day)

**Quality Gate**: `docs/development/qa/gates/zbi-001-epic-quality-gate.yml`

## Usage Guidelines

### Creating New Epics
1. Review business requirements and user impact
2. Design technical architecture using existing patterns
3. Break into stories with full context
4. Define quality gates and success criteria
5. Follow naming convention: `[AREA]-[###]` (e.g., `ZBI-001`)

### Writing Stories
1. Use story template from BMAD workflow guide
2. Include full context engineering section
3. Reference existing CircleTel components
4. Define clear acceptance criteria
5. Follow naming: `[EPIC-ID]-[##]-[description]`

### Quality Gates
1. Define technical, business, and security requirements
2. Set automated validation where possible
3. Include manual testing procedures
4. Specify review and approval process

## Agent Interaction

### For Business Planning
Use **Analyst Agent** for:
- Market research and competitor analysis
- Customer journey mapping
- Business requirement validation
- Success metric definition

### For Technical Design
Use **Architect Agent** for:
- Component architecture planning
- Integration pattern design
- Performance and scalability planning
- Security architecture decisions

### For Feature Breakdown
Use **Scrum Master Agent** for:
- Epic to story breakdown
- Sprint planning and sizing
- Dependency identification
- Risk assessment and mitigation

### For Implementation
Use **Developer Agent** for:
- Code pattern guidance
- Component implementation advice
- Integration with existing systems
- Testing strategy development

### For Quality Assurance
Use **QA Agent** for:
- Testing strategy definition
- Quality gate creation
- User acceptance criteria
- Performance and security validation

## CircleTel-Specific Patterns

### Component Integration
Stories should leverage existing CircleTel components:
- Form components: `/components/forms/`
- Layout components: `/components/layout/`
- UI components: `/components/ui/` (shadcn/ui)
- Admin components: `/components/admin/`

### State Management
Follow established patterns:
- React Query for server state
- Zustand for client state
- Supabase for real-time data
- Local storage for user preferences

### Styling Consistency
Use CircleTel design system:
- Brand colors: `circleTel-orange`, `circleTel-darkNeutral`
- Typography: Inter font family
- Component styling: Tailwind classes
- Responsive design: Mobile-first

## Success Metrics

### Development Efficiency
- **Context Retention**: Reduced "what was I building?" moments
- **Pattern Consistency**: Reuse of existing components
- **Quality First-Pass**: Stories pass quality gates initially

### Business Alignment
- **Feature Success**: Features meet business objectives
- **Customer Impact**: Positive user experience metrics
- **Technical Quality**: Maintainable, scalable code

### Team Collaboration
- **Clear Handoffs**: Smooth transitions between planning and development
- **Shared Understanding**: Team alignment on feature scope
- **Quality Culture**: Built-in quality considerations

## Getting Started

1. **Read the Workflow Guide**: `docs/development/guides/bmad-workflow-guide.md`
2. **Review Current Epic**: `docs/development/epics/zoho-billing-integration.md`
3. **Examine Story Example**: `docs/development/stories/zbi-001-01-extend-zoho-mcp-billing.md`
4. **Understand Quality Gates**: `docs/development/qa/gates/zbi-001-epic-quality-gate.yml`

## Support

For questions about BMAD METHOD usage:
- Review existing epics and stories for patterns
- Check the workflow guide for process clarification
- Follow established CircleTel development conventions
- Maintain consistency with existing codebase

---

**Configuration Version**: 1.0
**Last Updated**: September 27, 2025
**Next Review**: After first epic completion