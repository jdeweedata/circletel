# CPQ System Schema Patterns

**Date**: 2026-02-27
**Context**: Implementing CPQ (Configure, Price, Quote) system for B2B sales automation
**Trigger**: Plan marked Phase 1 "Complete" but files didn't exist - discovered existing DB schema with different column names

---

## Key Learning: Always Verify Database Schema First

Before implementing TypeScript code against a database, **always check the actual schema**:

```sql
-- Check existing tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'cpq%';

-- Check column names
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'cpq_sessions' ORDER BY ordinal_position;
```

---

## CPQ Database Schema Reference

### cpq_sessions
| Actual Column | NOT This | Notes |
|--------------|----------|-------|
| `owner_type` | `user_type` | 'admin' or 'partner' |
| `owner_id` | `admin_user_id` / `partner_id` | Single UUID, not separate columns |
| `step_data` (JSONB) | Separate columns | All wizard step data in one JSONB |
| `total_discount_percent` | In pricing_discounts | Denormalized for quick access |
| `discount_approved` | Via approval table | Boolean flag on session |

### cpq_discount_limits
| Actual Column | NOT This | Notes |
|--------------|----------|-------|
| `is_active` | `active` | Supabase convention |
| `can_approve_discounts` | `requires_approval_from` | Boolean, not array |
| `max_approvable_discount` | - | New field for approvers |

### cpq_pricing_rules
| Actual Column | NOT This | Notes |
|--------------|----------|-------|
| `name` | `rule_name` | Simpler naming |
| `adjustment_type` | `action_type` | 'percentage', 'fixed', 'override' |
| `adjustment_value` | `action_value` | **Negative for discounts** (e.g., -5.00) |
| `can_stack` | `stackable` | Verb form |
| `stack_priority` | `priority` | More specific |
| `is_active` | `active` | Supabase convention |
| `applies_to_product_ids` | `applies_to_products` | Explicit 'ids' suffix |
| `applies_to_partner_tiers` | - | Array of PartnerTier |

---

## Seeded Data Reference

### Discount Limits (8 roles)
```
Partner Tiers:
- bronze:   5% max,  3% threshold, cannot approve
- silver:  10% max,  5% threshold, cannot approve
- gold:    15% max, 10% threshold, cannot approve
- platinum: 20% max, 15% threshold, cannot approve

Admin Roles:
- sales_rep:     10% max,  5% threshold, cannot approve
- sales_manager: 20% max, 15% threshold, can approve up to 15%
- director:      30% max, 25% threshold, can approve up to 25%
- super_admin:   50% max, 50% threshold, can approve any
```

### Pricing Rules (4 rules)
```
1. Multi-Site Discount: -5% for min_sites >= 3
2. Enterprise Volume:  -15% for min_sites >= 10, customer_type = enterprise
3. Long-Term Contract: -10% for min_contract_term >= 36
4. Fibre Bundle:        -5% for requires_services = ['fibre', 'voice']
```

---

## Code Patterns

### Async Usage Tracking (Non-blocking Supabase Insert)

```typescript
// CORRECT: Use void IIFE
void (async () => {
  try {
    await supabase.from('partner_ai_usage').insert({
      partner_id: userId,
      request_type: 'cpq_parse',
      // ...
    });
  } catch (err) {
    console.error('[cpq-ai] Usage tracking error:', err);
  }
})();

// WRONG: Supabase returns PromiseLike, not full Promise
supabase.from('table').insert(data).then().catch() // .catch doesn't exist!
```

### Rule Engine Field Mapping

```typescript
// When reading from cpq_pricing_rules:
const discountValue = Math.abs(Number(rule.adjustment_value)); // Convert negative to positive
const canStack = rule.can_stack;  // NOT rule.stackable
const priority = rule.stack_priority;  // NOT rule.priority

// When checking discount limits:
const isActive = limit.is_active;  // NOT limit.active
const canApprove = limit.can_approve_discounts;
```

### Session Ownership Check

```typescript
// Database uses owner_id for both admin and partner
if (session.owner_id !== user.id) {
  // Check if user is elevated admin
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!adminUser || !['super_admin', 'director', 'sales_manager'].includes(adminUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}
```

---

## Files Created

```
lib/cpq/
├── index.ts          # Public exports
├── types.ts          # 40+ types matching DB schema
├── rule-engine.ts    # 6 core functions
├── ai-service.ts     # Gemini integration (lazy-loaded)
└── ai-prompts.ts     # 3 prompt templates

app/api/cpq/
├── sessions/
│   ├── route.ts              # POST, GET
│   └── [id]/
│       ├── route.ts          # GET, PUT, DELETE
│       └── complete/route.ts # POST (convert to quote)
├── rules/
│   ├── discount-limits/route.ts    # GET
│   ├── check-eligibility/route.ts  # POST
│   └── validate-pricing/route.ts   # POST
└── ai/
    ├── parse/route.ts      # POST (NL → structured)
    ├── recommend/route.ts  # POST (package recommendations)
    └── analyze/route.ts    # POST (pricing optimization)
```

---

## Prevention Checklist

Before implementing database-backed features:

- [ ] Check if tables already exist: `SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'prefix%'`
- [ ] Get actual column names: `SELECT column_name FROM information_schema.columns WHERE table_name = 'x'`
- [ ] Check for existing seed data: `SELECT * FROM table LIMIT 5`
- [ ] Verify migration history: `SELECT * FROM supabase_migrations ORDER BY version DESC LIMIT 5`
- [ ] Match TypeScript types to actual columns, not assumed names
