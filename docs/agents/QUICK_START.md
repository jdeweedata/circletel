# Development Assistant Quick Start

Get started with the AI-powered Development Assistant in 5 minutes.

## Setup

### 1. Install Dependencies

Already done! The Claude Agent SDK is installed:

```bash
npm install @anthropic-ai/claude-agent-sdk
```

### 2. Configure API Key

Add your Anthropic API key to `.env.local`:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
```

Get your API key from: https://console.anthropic.com/

### 3. Access the Interface

Start the development server:

```bash
npm run dev
```

Navigate to: http://localhost:3006/admin/dev-assistant

## Quick Examples

### Example 1: Code Review

**What to do:**
1. Select "Code Review" from the dropdown
2. Enter description:
   ```
   Review the coverage checking API for security vulnerabilities and performance issues
   ```
3. Add files (optional):
   ```
   app/api/coverage/check/route.ts
   lib/coverage/aggregation-service.ts
   ```
4. Click "Submit Request"

**What you'll get:**
- Critical security issues flagged
- Performance bottlenecks identified
- Type safety improvements suggested
- RBAC compliance verification

### Example 2: Generate Migration

**What to do:**
1. Select "Migration Generation"
2. Enter description:
   ```
   Create a table for storing user notification preferences with:
   - user_id (FK to admin_users)
   - email_notifications (boolean)
   - sms_notifications (boolean)
   - notification_types (text array)
   Add RLS so users can only access their own preferences
   ```
3. Click "Submit Request"

**What you'll get:**
- Complete SQL migration file
- Proper naming convention
- RLS policies included
- Related code changes suggested

### Example 3: General Help

**What to do:**
1. Select "General Help"
2. Enter question:
   ```
   How do I add a new admin page with RBAC permission gates?
   What files do I need to create?
   ```
3. Click "Submit Request"

**What you'll get:**
- Step-by-step implementation guide
- Code examples specific to CircleTel
- File structure recommendations
- Best practices explained

## Use via API

### Code Review Request

```typescript
const response = await fetch('/api/agents/dev-assistant', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'code_review',
    input: 'Review authentication logic for security issues',
    files: ['app/admin/login/page.tsx', 'hooks/useAdminAuth.ts']
  })
});

const data = await response.json();
console.log(data.response);
```

### Migration Generation Request

```typescript
const response = await fetch('/api/agents/dev-assistant', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'migration_generation',
    input: 'Add email_verified column to admin_users (boolean, default false)',
  })
});

const data = await response.json();
console.log(data.response);
```

## What the Agent Knows

The Development Assistant has deep knowledge of:

✅ **CircleTel Codebase**: Full context from CLAUDE.md
✅ **Next.js 15**: App Router, Server Components, streaming
✅ **TypeScript**: Strict mode, type safety patterns
✅ **Supabase**: Migrations, RLS, database design
✅ **RBAC System**: Permissions, role templates, gates
✅ **UI Components**: shadcn/ui, Tailwind patterns
✅ **Testing**: Playwright, type checking workflow

## Best Practices

### For Code Reviews

- ✅ Be specific about what to check (security, performance, types)
- ✅ Include relevant files for context
- ✅ Ask follow-up questions to refine suggestions
- ✅ Run `npm run type-check` after applying fixes

### For Migrations

- ✅ Specify exact column names and data types
- ✅ Mention if RLS policies are needed
- ✅ Include constraints (NOT NULL, UNIQUE, etc.)
- ✅ Test migrations on local Supabase before deploying

### For General Help

- ✅ Provide context about what you're building
- ✅ Ask about CircleTel-specific patterns
- ✅ Request code examples when helpful
- ✅ Clarify any unclear responses

## Tips for Better Results

1. **Be Specific**: "Review auth for SQL injection" > "Review auth"
2. **Include Files**: Agent can read actual code for better analysis
3. **Iterate**: Ask follow-ups to dive deeper
4. **Verify**: Always review AI-generated code/migrations
5. **Learn**: Use it to understand CircleTel patterns

## Troubleshooting

### Agent Not Responding

Check:
- Is `ANTHROPIC_API_KEY` set in `.env.local`?
- Is the API key valid? (test at console.anthropic.com)
- Check browser console for errors

### Generic Responses

Make it better:
- Add more context to your request
- Specify which files to analyze
- Be explicit about what you want checked

### Migration Issues

Common fixes:
- Include exact table/column names
- Specify data types clearly
- Mention RLS requirements upfront

## Next Steps

- Read full documentation: [docs/agents/DEV_ASSISTANT.md](DEV_ASSISTANT.md)
- Explore example requests in the web UI
- Try reviewing your own code
- Generate your first migration
- Integrate with your development workflow

## Support

For issues:
1. Check [Troubleshooting](#troubleshooting) above
2. Review example requests
3. Consult [Claude Agent SDK docs](https://docs.anthropic.com/agent-sdk)
4. File an issue in GitHub repo

---

**Ready to get started?** Visit [/admin/dev-assistant](http://localhost:3006/admin/dev-assistant) now!
