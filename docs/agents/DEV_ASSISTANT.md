# Development Assistant Agent

AI-powered development assistance for CircleTel using Claude Agent SDK.

## Overview

The Development Assistant is an AI agent built on the Claude Agent SDK that helps with:

- **Code Reviews**: Analyze code for type safety, security, performance, and best practices
- **Migration Generation**: Create Supabase database migrations with proper structure
- **General Development Help**: Answer questions about CircleTel patterns and architecture

## Features

### Code Review Capabilities

The agent reviews code for:

1. **Type Safety**
   - Proper TypeScript types
   - Strict null checks
   - Avoidance of `any` types
   - Next.js 15 async params pattern

2. **Next.js Best Practices**
   - Server Components by default
   - Proper use of `'use client'`
   - Error boundaries and loading states
   - SEO with Metadata API

3. **Security**
   - Authentication and authorization
   - Input validation
   - SQL injection prevention
   - XSS protection

4. **RBAC Compliance**
   - Permission checks with `usePermissions()`
   - `<PermissionGate>` components
   - Database-level validation

5. **Performance**
   - Efficient database queries
   - Proper indexing
   - Caching strategies
   - Bundle size optimization

### Migration Generation

Generates Supabase migrations with:

- Proper file naming convention: `YYYYMMDDHHMMSS_description.sql`
- Idempotent SQL (`IF NOT EXISTS`)
- Indexes for foreign keys and frequently queried columns
- RLS policies for user-facing data
- `updated_at` triggers for timestamp columns
- Helpful comments and documentation

### General Development Help

Answers questions about:

- CircleTel architecture and patterns
- Implementation strategies
- Best practices
- Troubleshooting

## Usage

### Web Interface

Access the Development Assistant at: [/admin/dev-assistant](http://localhost:3006/admin/dev-assistant)

#### Code Review Example

1. Select "Code Review" as request type
2. Enter description:
   ```
   Review the admin authentication system for security vulnerabilities,
   proper session management, and RBAC compliance.
   ```
3. Add files to review:
   ```
   app/admin/login/page.tsx
   hooks/useAdminAuth.ts
   lib/auth/admin-auth.ts
   ```
4. Click "Submit Request"

#### Migration Generation Example

1. Select "Migration Generation" as request type
2. Enter description:
   ```
   Generate a migration to create a user_preferences table with columns:
   - id (UUID primary key)
   - user_id (UUID FK to admin_users)
   - theme (text)
   - notifications_enabled (boolean)
   - created_at, updated_at timestamps
   Include RLS policies so users can only access their own preferences.
   ```
3. Click "Submit Request"

### API Usage

#### Endpoint

```
POST /api/agents/dev-assistant
```

#### Request Body

```typescript
{
  type: 'code_review' | 'migration_generation' | 'general_help',
  input: string,
  files?: string[], // Optional file paths
  context?: Record<string, unknown> // Additional context
}
```

#### Response

```typescript
{
  success: boolean,
  response: string,
  suggestions?: CodeSuggestion[],
  migration?: MigrationFile,
  error?: string
}
```

#### Example: Code Review via API

```typescript
const response = await fetch('/api/agents/dev-assistant', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'code_review',
    input: 'Review this API route for security issues',
    files: ['app/api/coverage/check/route.ts']
  })
});

const data = await response.json();
console.log(data.response);
```

#### Example: Migration Generation via API

```typescript
const response = await fetch('/api/agents/dev-assistant', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'migration_generation',
    input: 'Add email_verified column to admin_users table (boolean, default false)',
    context: {
      table: 'admin_users',
      requiresRLS: true
    }
  })
});

const data = await response.json();
console.log(data.response);
```

## Configuration

### Environment Variables

Required:
```bash
ANTHROPIC_API_KEY=sk-ant-...
```

Optional (for third-party providers):
```bash
CLAUDE_CODE_USE_BEDROCK=1  # Use Amazon Bedrock
CLAUDE_CODE_USE_VERTEX=1   # Use Google Vertex AI
```

### Agent Configuration

Configuration is defined in [lib/agents/dev-assistant-config.ts](../../lib/agents/dev-assistant-config.ts):

```typescript
export const DEV_ASSISTANT_ALLOWED_TOOLS = [
  'Read',
  'Write',
  'Edit',
  'Bash',
  'Glob',
  'Grep',
  'mcp__supabase__*',
  'mcp__playwright__*',
  'WebSearch',
  'WebFetch',
];
```

The agent automatically uses:
- **CLAUDE.md**: For CircleTel-specific context
- **.claude/settings.json**: For hooks configuration
- **MCP Servers**: Supabase, Playwright for extended capabilities

## Response Format

### Code Review Response

```markdown
**Summary**: Brief overview of the code quality

**Critical Issues**: Must be fixed before deployment
- [Issue 1 with file:line reference]
- [Issue 2 with file:line reference]

**Important Improvements**: Recommended changes
- [Improvement 1]
- [Improvement 2]

**Minor Suggestions**: Nice-to-have improvements
- [Suggestion 1]

**Positive Feedback**: What was done well
- [Positive note 1]
```

### Migration Response

```markdown
**Migration File**: 20250101120000_add_user_preferences.sql

**What it does**:
- Creates user_preferences table
- Adds RLS policies for user data isolation
- Includes updated_at trigger
- Adds indexes for performance

**Related Code Changes**:
- Update lib/types/database.ts with new table type
- Create hooks/useUserPreferences.ts for data fetching

**Testing**:
1. Run migration: `supabase db push`
2. Verify RLS: Try accessing another user's preferences
3. Test CRUD operations
```

## Best Practices

### When to Use Code Review

- Before committing significant changes
- When implementing new features
- For security-sensitive code (auth, payments, etc.)
- When learning CircleTel patterns

### When to Use Migration Generation

- Adding new tables or columns
- Modifying existing schema
- When unsure about RLS policies
- For complex database changes

### Tips for Better Results

1. **Be Specific**: Provide clear, detailed descriptions
2. **Include Context**: Add relevant files for review
3. **Ask Follow-ups**: The agent can iterate on suggestions
4. **Verify Output**: Always review generated code/migrations
5. **Test Changes**: Run type-check and tests after applying suggestions

## Troubleshooting

### Agent Not Responding

- Check `ANTHROPIC_API_KEY` is set in `.env`
- Verify API key is valid in [Anthropic Console](https://console.anthropic.com/)
- Check browser console for errors

### Migration Not Generated

- Ensure request is specific about table/column names
- Include data types and constraints
- Mention if RLS policies are needed

### Code Review Too Generic

- Specify which files to review
- Be specific about what to check (security, performance, etc.)
- Provide context about the feature/change

## Examples

See the "Example Requests" section in the web UI for common use cases.

## Related Documentation

- [Claude Agent SDK](../claude-docs/agent-sdk/agent-sdk.md)
- [RBAC System](../rbac/RBAC_SYSTEM_GUIDE.md)
- [Supabase Setup](../setup/SUPABASE_AUTH_USER_CREATION.md)
- [CLAUDE.md](../../CLAUDE.md) - Project instructions used by the agent

## Future Enhancements

Planned features:

- [ ] Structured code suggestion parsing
- [ ] Direct migration file application
- [ ] Integration with CI/CD pipeline
- [ ] Code refactoring suggestions
- [ ] Performance profiling
- [ ] Security vulnerability scanning
- [ ] Test generation
- [ ] Documentation generation

## Support

For issues or questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review example requests in the UI
3. Consult [Claude Agent SDK docs](https://docs.anthropic.com/agent-sdk)
4. File an issue in the GitHub repository