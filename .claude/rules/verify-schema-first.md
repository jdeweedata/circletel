# Verify Schema First

**Trigger**: Starting any database or API integration work
**Source**: 3+ sessions (cpq-schema-patterns, netcash-paynow, partner-package-display)

## Pattern

Before implementing TypeScript code against a database or external API:

1. **Check actual column/parameter names** - Don't assume from docs or memory
2. **Verify existing data** - Check for seed data or migration history
3. **Match types to reality** - Column names often differ from expected

## DO

```sql
-- Check existing tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'prefix%';

-- Check column names
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'table_name' ORDER BY ordinal_position;

-- Check for seed data
SELECT * FROM table_name LIMIT 5;
```

```typescript
// Before implementing, verify:
// 1. Column exists: owner_id vs admin_user_id?
// 2. Column type: is_active vs active?
// 3. Parameter name: p4 vs Amount?
```

## DON'T

- Start coding based on assumed column names
- Copy types from previous similar implementations
- Trust documentation over actual schema
- Skip checking migration history

## Common Mismatches Found

| Assumed | Actual | Table/API |
|---------|--------|-----------|
| `active` | `is_active` | cpq_discount_limits |
| `admin_user_id` | `owner_id` | cpq_sessions |
| `Amount=89900` | `p4=899.00` | NetCash Pay Now |
| `coverageType=business` | `type=business` | /api/coverage/packages |

## Time Savings

~15-30 min per instance by avoiding:
- TypeScript errors from wrong column names
- API calls that silently fail
- Data not persisting correctly
