# Error: Quote Column Name

**ID**: ERR-010
**Category**: supabase
**Severity**: low
**Occurrences**: 1
**Last Seen**: 2026-02-06

## Signature

```
column "notes" does not exist
save quote fails
Could not find column 'notes'
admin_notes
```

## Root Cause

Using wrong column name in business_quotes table. The column is named `admin_notes`, not `notes`.

## Solution

Use correct column name:

```typescript
// WRONG
await supabase
  .from('business_quotes')
  .update({ notes: 'Updated note' })

// CORRECT
await supabase
  .from('business_quotes')
  .update({ admin_notes: 'Updated note' })
```

## Prevention

1. **Check schema** before writing queries
2. **Use TypeScript types** generated from Supabase
3. **IDE autocomplete** will suggest correct column names

```typescript
// With proper types, this would error:
const update: Partial<Database['public']['Tables']['business_quotes']['Update']> = {
  notes: 'test' // TypeScript error: 'notes' doesn't exist
}
```

## Related

- **Commit**: `88b821b`
- **Table**: `business_quotes`
- **Documentation**: Check database schema in System Overview
