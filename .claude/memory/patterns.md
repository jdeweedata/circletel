# Codebase Patterns

Persistent patterns discovered in the CircleTel codebase. These survive across sessions.

---

## Authentication

### Three-Context System
- **Consumer**: Token in httpOnly cookies → RLS-protected queries
- **Partner**: Same as consumer + FICA/CIPC compliance docs
- **Admin**: RBAC (17 roles, 100+ permissions) → Service role bypasses RLS

### Auth Header Pattern (Fixes 401 Errors)
```typescript
// Server: Check BOTH header and cookies
const authHeader = request.headers.get('authorization')
if (authHeader?.startsWith('Bearer ')) {
  const user = await supabase.auth.getUser(authHeader.split(' ')[1])
} else {
  const session = await createClientWithSession()
}
```
- **Reference**: Commit `ac642e8`

---

## API Routes

### Next.js 15 Async Params (Required)
```typescript
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  // ...
}
```

---

## Supabase

### Client Usage
- **Server (API routes)**: `import { createClient } from '@/lib/supabase/server'`
- **Client (components)**: `import { createClient } from '@/lib/supabase/client'`

### RLS Considerations
- Service role bypasses RLS (use for admin operations)
- Anon key respects RLS policies

---

## Development

### Memory-Safe Commands
- `npm run dev:memory` - 8GB heap for dev server
- `npm run type-check:memory` - 4GB heap for type checking
- `npm run build:memory` - 8GB heap for builds

---

## Add New Patterns Below

[New patterns will be added here as discovered]
