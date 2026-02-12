# Error: Supabase Join Array

**ID**: ERR-009
**Category**: supabase
**Severity**: medium
**Occurrences**: 3
**Last Seen**: 2026-02-10

## Signature

```
Cannot read property of undefined
joined data is array not object
customer[0]
TypeError: Cannot read properties of undefined (reading 'name')
Object has extra array wrapper
```

## Root Cause

Supabase `.select()` with joins returns joined data as arrays, not single objects:

```typescript
// Query
const { data } = await supabase
  .from('invoices')
  .select('*, customer:customers(*)')
  .single()

// Result - customer is ARRAY!
{
  id: 'inv_123',
  customer: [{ id: 'cust_456', name: 'John' }] // Array!
}
```

## Solution

Handle array wrapping when accessing joined data:

```typescript
// SAFE ACCESS
const customer = Array.isArray(invoice.customer)
  ? invoice.customer[0]
  : invoice.customer

// Or with optional chaining
const customerName = invoice.customer?.[0]?.name ?? invoice.customer?.name
```

### Utility Function

```typescript
// lib/supabase/utils.ts
export function unwrapJoin<T>(data: T | T[] | null): T | null {
  if (data === null) return null
  return Array.isArray(data) ? data[0] ?? null : data
}

// Usage
const customer = unwrapJoin(invoice.customer)
```

## Prevention

1. **Always expect arrays** from Supabase joins
2. **Use utility function** for consistent handling
3. **Type your queries** to catch this at compile time

```typescript
type InvoiceWithCustomer = {
  id: string
  customer: Customer[] // Explicitly typed as array
}
```

## Validation Checklist

- [ ] Joined data accessed correctly
- [ ] No undefined errors
- [ ] Null cases handled
- [ ] Types reflect array nature

## Related

- **Pattern**: MEMORY.md "Supabase Join Returns Array"
- **Learning**: `compound-learnings/learnings/patterns/supabase-join-handling.md`
