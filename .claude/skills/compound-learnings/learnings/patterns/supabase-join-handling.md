# Supabase Join Array Handling

**Category**: Database Patterns
**Created**: 2026-02-10

## The Problem

When using Supabase's foreign key joins with `.single()`, the joined table data comes back as an **array**, not an object. This causes TypeScript errors and runtime issues.

```typescript
// This query...
const { data: invoice } = await supabase
  .from('customer_invoices')
  .select(`
    id,
    customer:customers(id, email, phone)
  `)
  .eq('id', invoiceId)
  .single();

// Returns customer as array:
// invoice.customer = [{ id: '...', email: '...', phone: '...' }]
// NOT: invoice.customer = { id: '...', email: '...', phone: '...' }
```

## The Solution

Always check if joined data is an array before accessing:

```typescript
// Safe extraction pattern
const customerData = Array.isArray(invoice.customer)
  ? invoice.customer[0]
  : invoice.customer;

// Now safe to use
const email = customerData?.email;
const phone = customerData?.phone;
```

## Type-Safe Version

```typescript
interface InvoiceWithCustomer {
  id: string;
  customer: {
    id: string;
    email: string | null;
    phone: string | null;
  } | null;
}

// Transform after query
const invoice = rawInvoice as unknown;
const customerData = Array.isArray((invoice as any).customer)
  ? (invoice as any).customer[0]
  : (invoice as any).customer;

const typedInvoice: InvoiceWithCustomer = {
  ...invoice as any,
  customer: customerData || null,
};
```

## When This Happens

- Any Supabase `.select()` with joined tables using foreign key syntax
- Happens regardless of `.single()` or `.maybeSingle()`
- PostgREST design decision - can return multiple related records

## CircleTel Usage

Files using this pattern:
- `lib/billing/paynow-billing-service.ts` - Customer join on invoices
- `lib/billing/invoice-notification-service.ts` - Customer join on invoices

## Prevention

When writing new Supabase queries with joins:
1. Always assume joined data is an array
2. Add array check before accessing properties
3. Consider creating a helper function for common joins
