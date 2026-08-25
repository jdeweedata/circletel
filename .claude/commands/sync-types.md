---
description: Generate TypeScript types from Supabase schema and sync to project
---

# Sync Supabase Types

Generate TypeScript types from the current Supabase database schema and update the project types.

## Steps

### 1. Generate Types from Supabase

Use the MCP Supabase tool to generate types:

```
mcp__supabase__generate_typescript_types
```

This will return the complete TypeScript type definitions for all tables.

### 2. Update Types File

Write the generated types to:
```
lib/types/database.generated.ts
```

Then keep `lib/types/database.types.ts` as a re-export of that file. Do not write `types/supabase.ts` — that path is obsolete.

Prefer the repo script when credentials are available:

```
npm run types:generate
npm run types:check
```

**Important**: This file should contain:
- Database type definition with all schemas
- All table interfaces
- Insert/Update type variants
- Enum types
- Relationship types

### 3. Verify Type Compatibility

Run type check to ensure the new types are compatible:

```bash
npm run type-check:memory
```

### 4. Report Results

Report the following:

```
╔════════════════════════════════════════════════════════════════╗
║                    Supabase Types Synced                        ║
╚════════════════════════════════════════════════════════════════╝

📝 GENERATED TYPES
   Tables: XX
   Enums: XX
   Functions: XX
   File: lib/types/database.generated.ts
   Size: XX KB

✅ TYPE CHECK
   Status: [PASSED / FAILED]
   New conflicts: X
   [List any conflicts with existing code]

🔄 CHANGES DETECTED
   New tables: [list or "None"]
   Modified tables: [list or "None"]
   Removed tables: [list or "None"]

═══════════════════════════════════════════════════════════════════
```

### 5. Handle Conflicts

If there are type conflicts:

1. **Identify affected files** that import from `lib/types/database.types.ts`
2. **List specific conflicts** (property type mismatches, missing fields)
3. **Suggest fixes** based on the schema changes

## Common Scenarios

### After Adding a New Table

```
/sync-types
```

New table types will be added. No conflicts expected.

### After Modifying Columns

```
/sync-types
```

May cause conflicts if code depends on removed/renamed columns. Review affected files.

### After Running Migrations

Always run `/sync-types` after applying migrations to keep types in sync.

## Type File Structure

The generated `lib/types/database.generated.ts` should follow this structure:

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      // All table definitions
    }
    Views: {
      // All view definitions
    }
    Functions: {
      // All function definitions
    }
    Enums: {
      // All enum definitions
    }
    CompositeTypes: {
      // Composite types
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]
```

## Usage

Simply run:
```
/sync-types
```

No arguments needed. Types are generated from the current production database schema.
