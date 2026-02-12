# Error: Payment Amount Format

**ID**: ERR-004
**Category**: api
**Severity**: critical
**Occurrences**: 2
**Last Seen**: 2026-02-08

## Signature

```
Invalid amount format
Amount must be in cents (integer)
NetCash amount error
Payment rejected - invalid amount
received: "799.00" (should be integer)
```

## Root Cause

Sending amount as decimal instead of cents. NetCash (and most payment APIs) require amounts in smallest currency unit (cents for ZAR).

```typescript
// BROKEN
const amount = package.price // 799.00 (decimal)
await netcash.initiatePayment({ amount }) // Error!
```

## Solution

Convert amount to cents before sending:

```typescript
// FIXED
const amountInCents = Math.round(package.price * 100)
await netcash.initiatePayment({ amount: amountInCents })

// Example: R799.00 * 100 = 79900 cents
```

### Utility Function

```typescript
// lib/payments/utils.ts
export function toCents(amount: number): number {
  return Math.round(amount * 100)
}

export function fromCents(cents: number): number {
  return cents / 100
}
```

## Prevention

1. **Always convert at API boundary** - not in business logic
2. **Use utility functions** consistently
3. **Add validation** for amounts before sending

```typescript
function validateAmountInCents(amount: number): void {
  if (!Number.isInteger(amount)) {
    throw new Error('Amount must be in cents (integer)')
  }
  if (amount < 0) {
    throw new Error('Amount cannot be negative')
  }
}
```

## Validation Checklist

- [ ] Payments process successfully
- [ ] Correct amount charged
- [ ] NetCash accepts format
- [ ] Edge cases tested (999.99, 0.01, large amounts)

## Related

- **File**: `lib/payments/netcash-client.ts`
- **Service**: NetCash Pay Now integration
- **Pattern**: Currency handling for payment APIs
