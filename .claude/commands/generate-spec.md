---
description: Generate an Agent-OS specification from a feature description using the PM Agent
arguments:
  - name: description
    description: Natural language description of the feature to build
    required: true
  - name: priority
    description: Priority level (low, medium, high, critical)
    required: false
    default: medium
---

# Generate Agent-OS Specification

You are generating a comprehensive Agent-OS specification using the PM Agent for the following feature:

**Feature Description**: $ARGUMENTS.description
**Priority**: $ARGUMENTS.priority

## Step 1: Analyze Codebase

First, analyze the codebase to understand the project structure:

```bash
echo "Analyzing codebase structure..."
```

Read the existing PM Agent implementation to understand its capabilities:

1. Review `lib/agents/pm/agent.ts` for the PMAgent class
2. Review `lib/agents/pm/types.ts` for type definitions
3. Review existing specs in `agent-os/specs/` for format reference

## Step 2: Generate Spec ID

Create a spec ID using the format `YYYYMMDD-feature-name`:
- Use today's date
- Convert feature description to kebab-case
- Keep it concise (3-5 words max)

## Step 3: Create Spec Directory

```bash
# Create the spec directory structure
$specId = "$(Get-Date -Format 'yyyyMMdd')-feature-name"
mkdir -p "agent-os/specs/$specId"
```

## Step 4: Generate Spec Files

Generate the following files for the spec:

### 4.1 README.md
Quick overview with:
- Spec ID and title
- Description summary
- Total story points
- Key files to create/modify
- Quick start commands

### 4.2 SPEC.md
Complete specification with:
- Overview (description, goals, non-goals)
- User Stories (US-1, US-2, etc. with acceptance criteria)
- Technical Specification (file changes, database schema, API endpoints)
- Architecture (data flow diagram, component diagram)
- Risk Assessment (risk level, factors, mitigations)
- Success Criteria
- Testing Strategy

### 4.3 TASKS.md
Task breakdown with:
- Task groups by agent role (database-engineer, backend-engineer, frontend-engineer, testing-engineer, ops-engineer)
- Fibonacci story points (1, 2, 3, 5, 8, 13)
- Dependencies between groups
- Subtasks with checkboxes
- Files to create per group

### 4.4 PROGRESS.md
Progress tracking template with:
- Overview metrics table
- Task group status sections
- Session log template
- Blocker tracking

### 4.5 architecture.md
Technical architecture with:
- ASCII data flow diagram
- ASCII component diagram
- Integration points
- Workflow stages

## Step 5: Analyze Impact

Based on the feature description, identify:

1. **Files to Create**: New files needed (components, API routes, services, types)
2. **Files to Modify**: Existing files that need changes
3. **Database Changes**: New tables, columns, indexes, RLS policies
4. **API Endpoints**: New or modified endpoints
5. **Dependencies**: New npm packages needed
6. **Risk Factors**: Potential issues and mitigations

## Step 6: Estimate Story Points

Use Fibonacci scale based on complexity:
- **1 point**: Trivial (config change, typo fix)
- **2 points**: Simple (single file, straightforward)
- **3 points**: Moderate (2-3 files, some complexity)
- **5 points**: Complex (multiple files, integration work)
- **8 points**: Very Complex (many files, significant changes)
- **13 points**: Epic (should be broken down)

## Output Format

After generating the spec, provide a summary:

```
SPEC GENERATED SUCCESSFULLY

Spec ID: YYYYMMDD-feature-name
Location: agent-os/specs/YYYYMMDD-feature-name/

Files Created:
  - README.md (overview)
  - SPEC.md (full specification)
  - TASKS.md (task breakdown)
  - PROGRESS.md (tracking)
  - architecture.md (technical docs)

Impact Analysis:
  - Files to create: X
  - Files to modify: Y
  - Database tables: Z
  - API endpoints: N

Estimation:
  - Total story points: XX
  - Task groups: Y
  - Risk level: low/medium/high

Next Steps:
1. Review generated spec in agent-os/specs/YYYYMMDD-feature-name/
2. Adjust story points and priorities as needed
3. Begin implementation with Task Group 1
```

## Important Notes

- Follow existing patterns in the CircleTel codebase
- Use TypeScript strict mode
- Include Supabase RLS policies for new tables
- Follow the Admin-Zoho sync pattern for CRM integration
- Reference `docs/architecture/SYSTEM_OVERVIEW.md` for context
- Ensure specs align with existing Agent-OS format
