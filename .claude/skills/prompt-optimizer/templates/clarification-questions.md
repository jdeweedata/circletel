# Clarification Questions Template

When user input is vague or incomplete, use these question templates to gather more information before optimizing the prompt.

## For Feature Requests

### Scope Questions
```
Before I can structure this feature request, I need to clarify the scope:

1. **MVP vs Full Implementation**:
   - Should this be a minimal viable version or a comprehensive feature?
   - What's the priority: ship fast or ship complete?

2. **Affected Areas**:
   - Is this a frontend-only change, or does it require backend/database changes?
   - Which parts of CircleTel are affected? (Orders, Payments, Dashboard, etc.)

3. **User Context**:
   - Is this for customers, admins, or partners?
   - Which authentication context should this use?
```

### Technical Questions
```
To structure the technical requirements, I need to know:

1. **Database**:
   - Will this require new database tables or modifications to existing ones?
   - Are there any RLS (Row Level Security) requirements?

2. **API Integrations**:
   - Does this integrate with any external APIs? (MTN, NetCash, ZOHO, etc.)
   - Are webhooks involved?

3. **UI/UX**:
   - Should this match existing CircleTel design patterns?
   - Any specific shadcn/ui components you want to use?
   - Responsive design requirements? (mobile, tablet, desktop)
```

### Priority Questions
```
To prioritize this work, I need to understand:

1. **Urgency**:
   - Is this blocking other work?
   - What's the timeline? (Urgent, This week, This month, Future)

2. **Dependencies**:
   - Does anything else need to be done first?
   - Are there related features that should be considered?

3. **Testing**:
   - What level of testing is expected? (Manual only, E2E tests, Full test coverage)
   - Do you have specific test scenarios in mind?
```

## For Bug Reports

### Error Details Questions
```
To effectively debug this issue, I need more details:

1. **Error Information**:
   - Can you provide the full error message text?
   - Is there a stack trace? (If so, please paste it)
   - What is the error code or HTTP status? (e.g., 500, 403, 404)

2. **Console Output**:
   - Are there any errors in the browser console?
   - Any warnings or debug logs?
   - Any failed network requests in the Network tab?

3. **Visual Evidence**:
   - Can you provide a screenshot of the error?
   - Can you record a short video showing the bug?
```

### Reproduction Questions
```
To reproduce and fix this bug, I need to know:

1. **Reproduction Steps**:
   - What exact steps trigger this bug?
   - Can you provide a numbered list of actions?
   - Does it happen every time or only sometimes?

2. **Environment**:
   - Which browser and version? (Chrome 120, Firefox 119, etc.)
   - Which environment? (Local dev, Staging, Production)
   - Mobile or desktop? (If mobile, which device?)

3. **User Context**:
   - Were you logged in? (Customer, Admin, Partner)
   - What page were you on?
   - Were you performing a specific action? (Checkout, dashboard, etc.)
```

### Impact Questions
```
To assess the priority and severity:

1. **Impact Scope**:
   - How many users are affected?
   - Is this happening to all users or specific users?
   - Is this blocking critical functionality?

2. **Frequency**:
   - Does this happen every time or intermittently?
   - When did this start happening?
   - Was anything deployed or changed recently?

3. **Workaround**:
   - Is there a workaround users can use?
   - Is this completely blocking or just annoying?
```

## For Investigations

### Scope Questions
```
To focus this investigation, I need to clarify:

1. **Investigation Goal**:
   - Are you trying to understand how it currently works?
   - Are you planning to modify or refactor it?
   - Are you troubleshooting an issue?

2. **Depth of Investigation**:
   - Do you need a high-level overview or deep dive?
   - Should I explain the architecture or focus on specific code?
   - Are there specific files or functions you want to understand?

3. **Output Format**:
   - Do you want a written explanation?
   - Should I create a diagram or flowchart?
   - Do you need code examples or documentation?
```

### Focus Questions
```
To target the investigation effectively:

1. **Specific Areas**:
   - Which subsystem are you interested in? (Auth, Orders, Payments, etc.)
   - Frontend, backend, database, or all three?
   - Any specific integration? (Supabase, NetCash, MTN, ZOHO)

2. **Technical Level**:
   - How familiar are you with this codebase? (New, Intermediate, Expert)
   - Should I explain basic concepts or focus on advanced details?
   - Any specific CircleTel patterns you want to understand?

3. **Use Case**:
   - What will you do with this information?
   - Is this for onboarding, debugging, or planning a feature?
```

## For Refactors

### Scope Questions
```
To scope this refactor properly:

1. **Refactor Goals**:
   - What's the primary goal? (Performance, Maintainability, Readability)
   - Are there specific pain points you want to address?
   - Is this preventive or fixing a problem?

2. **Scope Boundaries**:
   - Which files or directories should be refactored?
   - Should this be done incrementally or all at once?
   - Are there files that should NOT be touched?

3. **Breaking Changes**:
   - Is backward compatibility required?
   - Can we change external APIs or contracts?
   - Are database schema changes allowed?
```

### Approach Questions
```
To determine the refactor approach:

1. **Strategy**:
   - Should we extract components, consolidate code, or both?
   - Do you want to introduce new patterns or libraries?
   - Should we follow a specific refactoring pattern?

2. **Testing**:
   - How much testing is expected after refactor?
   - Should we write tests before or after refactoring?
   - Are E2E tests required or manual testing sufficient?

3. **Timeline**:
   - Is this urgent or can it be done over time?
   - Should this block other work?
   - Can we do this in multiple PRs?
```

## General Clarification Questions

### When Intent is Unclear
```
I want to make sure I understand what you need. Can you clarify:

1. **Primary Goal**:
   - What are you trying to achieve?
   - What problem are you trying to solve?
   - What would success look like?

2. **Context**:
   - Why is this needed now?
   - Is this related to something specific? (Feature, bug, user request)
   - Any background information I should know?

3. **Expectations**:
   - What output do you expect from me?
   - Should I implement this or just explain it?
   - Do you want a detailed plan or quick summary?
```

### When Requirements are Missing
```
To create a complete plan, I need to know:

1. **Must-Have Requirements**:
   - What absolutely must be included?
   - What can be skipped for MVP?
   - Any hard constraints? (Performance, security, compliance)

2. **Technical Constraints**:
   - Any technology preferences or restrictions?
   - Should this use existing CircleTel patterns or introduce new ones?
   - Any third-party services or APIs to avoid?

3. **Success Criteria**:
   - How will we know this is done?
   - What should I test to verify success?
   - Any metrics or KPIs to track?
```

### When Multiple Interpretations Exist
```
Your request could be interpreted in a few ways. Which did you mean:

**Option A**: [First interpretation]
- This would involve: [What this means]
- Files affected: [Files]
- Effort: [Estimate]

**Option B**: [Second interpretation]
- This would involve: [What this means]
- Files affected: [Files]
- Effort: [Estimate]

**Option C**: Something else entirely?
- Please describe: [Open-ended]
```

## Question Selection Strategy

### Use Fewer Questions When:
- User input is mostly clear, just missing details
- You can make reasonable assumptions
- The task is small and low-risk

### Use More Questions When:
- User input is very vague
- Multiple interpretations are possible
- The task is large or complex
- Changes could affect many systems
- Risk of misunderstanding is high

## Best Practices

1. **Group related questions** - Don't overwhelm with 20 separate questions
2. **Provide context** - Explain why you're asking
3. **Offer examples** - Show what you mean with code or scenarios
4. **Suggest defaults** - "I'll assume X unless you specify otherwise"
5. **Prioritize questions** - Ask critical questions first
6. **Make it easy to answer** - Use yes/no or multiple choice when possible

## Example: Good vs Bad Clarification

### ❌ Bad (Too Many Questions)
```
What do you want?
Where should it go?
What should it look like?
How should it work?
When do you need it?
Who will use it?
Why do we need this?
[...20 more questions]
```

### ✅ Good (Grouped and Focused)
```
To structure this feature request, I need to clarify a few things:

**Scope & Priority**:
- Is this a minimal MVP or comprehensive feature?
- Timeline: Urgent, this week, or future work?

**Technical Details**:
- Which user context? (Customer, Admin, Partner)
- Will this require database changes or frontend only?

**UI/UX**:
- Should this match existing CircleTel patterns? (I'll assume yes)
- Any specific pages or components in mind? (Or should I suggest?)

Please provide as much detail as you can, and I'll fill in reasonable assumptions for anything you don't specify.
```

---

**Template Version**: 1.0.0
**Use Case**: Gathering information to optimize vague prompts
