# Prompt Optimizer Skill

Transform vague user requests into structured, actionable prompts optimized for CircleTel development workflows.

## What This Skill Does

The Prompt Optimizer skill helps you turn ambiguous user input into clear, comprehensive, and CircleTel-aligned prompts that:
- **Clarify intent** - Understand what the user really wants
- **Add context** - Include relevant CircleTel architecture and patterns
- **Structure requirements** - Organize into clear objectives, constraints, and acceptance criteria
- **Reference patterns** - Point to established CircleTel conventions in CLAUDE.md
- **Suggest approach** - Provide concrete implementation steps
- **Ensure completeness** - Include testing requirements and validation

## Installation

The skill is already installed in the `.claude/skills/prompt-optimizer` directory.

## How to Use

### Automatic Activation

The skill automatically activates when it detects:
- Vague or ambiguous requests
- Prompts that could benefit from structure
- Keywords: "optimize prompt", "clarify", "structure", "refine"

### Manual Activation

You can manually invoke the skill using:

```
/skill prompt-optimizer

User input: [paste vague prompt here]
```

### Example Usage

**Before (Vague)**:
```
"Fix the dashboard"
```

**After (Optimized)**:
```markdown
## Objective
Fix the customer dashboard infinite loading state that occurs after login.

## Context
- Current state: User logs in successfully but dashboard shows "Loading..." indefinitely
- Affected systems: Customer authentication, dashboard data fetching
- Related files:
  - app/dashboard/page.tsx
  - components/providers/CustomerAuthProvider.tsx

## Requirements
1. Identify root cause of infinite loading
2. Fix loading state management
3. Ensure error handling is comprehensive

## CircleTel Patterns to Follow
- Pattern: Infinite Loading Fix (CLAUDE.md Common Debugging Patterns)
- Reference: components/providers/CustomerAuthProvider.tsx:64-76

## Acceptance Criteria
- [ ] Dashboard loads successfully after login
- [ ] Type check passes: npm run type-check
- [ ] Manual test: Login → Dashboard loads within 3 seconds
```

## When to Use This Skill

### Perfect For:
- **Vague Feature Requests** - "Add a search feature" → Structured feature spec
- **Unclear Bug Reports** - "It's broken" → Detailed debugging task
- **General Investigations** - "How does X work?" → Focused exploration
- **Broad Refactors** - "Clean up the code" → Scoped refactor plan

### Not Needed For:
- **Already Clear Prompts** - "Update line 45 in config.ts to set timeout to 30 seconds"
- **Simple Commands** - "Run type check"
- **Specific File Requests** - "Show me the login function in auth.ts"

## Prompt Quality Framework

The skill optimizes prompts to be **SMART**:

- **Specific**: Exact files, functions, and behaviors
- **Measurable**: Clear success criteria and acceptance tests
- **Achievable**: Realistic scope given CircleTel architecture
- **Relevant**: Aligned with CircleTel patterns and conventions
- **Time-bound**: Clear scope boundaries

## Optimization Templates

The skill includes templates for common scenarios:

### 1. Feature Request Template
Transforms vague feature ideas into structured specifications with:
- Clear objective
- Requirements and constraints
- Acceptance criteria
- CircleTel-specific patterns to follow
- Suggested implementation approach

### 2. Bug Fix Template
Converts "it's broken" into actionable debugging tasks with:
- Error details and reproduction steps
- Affected systems and files
- Debugging approach
- CircleTel debugging patterns
- Validation checklist

### 3. Investigation Template
Structures open-ended questions into focused explorations with:
- Investigation scope
- Files to review
- Key concepts to understand
- Documentation approach

### 4. Refactor Template
Scopes broad "clean up" requests into targeted improvements with:
- Refactor goals and scope
- Files in scope
- Constraints (backward compatibility, etc.)
- Testing requirements

## CircleTel-Specific Optimizations

The skill automatically adds CircleTel context:

### File Path Mapping
- ❌ "the dashboard" → ✅ `app/dashboard/page.tsx`
- ❌ "the auth provider" → ✅ `components/providers/CustomerAuthProvider.tsx`
- ❌ "the API" → ✅ `app/api/dashboard/summary/route.ts`

### Pattern References
- Automatically references CLAUDE.md sections
- Points to established CircleTel conventions
- Includes line numbers for large files

### System Mapping
Identifies which CircleTel subsystem is affected:
- **Authentication**: Customer, Admin, or Partner
- **Orders**: Consumer orders or B2B contracts
- **Payments**: NetCash inline or redirect flow
- **Coverage**: MTN WMS, Consumer API, or provider APIs
- **Dashboard**: Customer dashboard or admin panel

### Testing Requirements
Always includes:
- Type check command
- Build command
- Manual testing checklist
- E2E test requirements (when applicable)

## Validation Checklist

Before finalizing an optimized prompt, the skill verifies:

### Clarity (5/5)
- [ ] Objective is one clear sentence
- [ ] No ambiguous terms
- [ ] Specific files named
- [ ] Technical terms accurate
- [ ] Success criteria measurable

### Completeness (5/5)
- [ ] Includes context
- [ ] Lists requirements
- [ ] Specifies constraints
- [ ] Defines acceptance criteria
- [ ] References CircleTel patterns

### CircleTel Alignment (5/5)
- [ ] Maps to CircleTel architecture
- [ ] References CLAUDE.md patterns
- [ ] Correct file locations
- [ ] Follows conventions
- [ ] Includes testing

### Actionability (3/3)
- [ ] Suggests concrete approach
- [ ] Includes file paths
- [ ] Prioritizes steps

## Examples

See the `examples/` directory for:
- `feature-before-after.md` - Feature request optimization examples
- `bug-before-after.md` - Bug fix optimization examples
- `investigation-before-after.md` - Investigation optimization examples
- `refactor-before-after.md` - Refactor optimization examples

## Templates

See the `templates/` directory for:
- `feature-template.md` - Feature request template
- `bug-fix-template.md` - Bug fix template
- `investigation-template.md` - Investigation template
- `refactor-template.md` - Refactor template
- `clarification-questions.md` - Questions to ask when input is unclear

## Best Practices

1. **Start with clarification** - If prompt is very vague, ask questions first
2. **Reference CLAUDE.md** - Always check for established CircleTel patterns
3. **Be specific** - Use exact file paths and line numbers
4. **Include testing** - Always specify validation criteria
5. **Map to architecture** - Identify affected CircleTel subsystems
6. **Suggest approach** - Provide concrete implementation steps
7. **Use templates** - Start with a template and customize

## Common Use Cases

### Use Case 1: Vague Feature Request

**User Input**: "Add notifications"

**Skill Output**: Structured prompt with:
- Objective: Add email notifications for order status changes
- Context: Which notification types? Email, SMS, in-app?
- Requirements: Specific notification triggers
- Integration: Which service? (Resend, Clickatell, etc.)
- Database: New tables needed?

### Use Case 2: Unclear Bug Report

**User Input**: "Login doesn't work"

**Skill Output**: Structured debugging task with:
- Error details: What is the exact error?
- Reproduction: Steps to trigger the bug
- Environment: Local dev, staging, production?
- Auth context: Customer, admin, or partner login?
- Expected vs actual behavior

### Use Case 3: Broad Investigation

**User Input**: "How does the system handle payments?"

**Skill Output**: Focused investigation with:
- Scope: NetCash integration, payment flows, webhooks
- Files to review: Specific payment-related files
- Key concepts: Payment methods, webhook verification
- Documentation approach: What to summarize

### Use Case 4: General Refactor

**User Input**: "Improve the admin code"

**Skill Output**: Scoped refactor plan with:
- Goals: Reduce duplication, improve consistency
- Scope: Specific admin files vs entire subsystem
- Constraints: Backward compatibility required?
- Testing: What needs to be tested after refactor?

## Troubleshooting

### Skill Not Activating?

Check that your prompt includes trigger keywords:
- optimize, clarify, structure, refine
- Or manually invoke: `/skill prompt-optimizer`

### Output Too Generic?

Provide more context in your initial prompt:
- Mention specific files or pages
- Include error messages
- Reference CircleTel systems (auth, payments, orders)

### Need More Clarification?

The skill will ask clarifying questions when input is too vague:
- Answer the questions to get a better optimized prompt
- Or provide more details in your initial request

## Resources

- **Skill.md**: Full skill documentation with templates and patterns
- **examples/**: Before/after optimization examples
- **templates/**: Reusable templates for common scenarios
- **CLAUDE.md**: CircleTel-specific patterns and conventions

## Version

- **Version**: 1.0.0
- **Last Updated**: 2025-11-10
- **Maintained By**: CircleTel Development Team

## Feedback

To improve this skill, create an issue in the CircleTel repository or update the skill files directly.

---

**Quick Start**: Just ask Claude to "optimize this prompt" or "clarify this request" and the skill will automatically activate!
