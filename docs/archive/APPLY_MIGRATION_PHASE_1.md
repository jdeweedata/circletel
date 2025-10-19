# 🚀 Apply Customer Journey Phase 1 Migration

> **Quick Start Guide - Database Setup**
> **Migration**: `20251019000003_create_customer_journey_system.sql` (✅ FIXED)
> **Time Required**: 5 minutes
> **⚠️ Note**: If you encountered errors previously, see `MIGRATION_FIX_PHASE_1.md`

---

## ⚡ Quick Steps

### 1. Open Supabase Dashboard

Go to: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng

### 2. Navigate to SQL Editor

- Click **"SQL Editor"** in left sidebar
- Click **"New Query"** button

### 3. Copy Migration SQL

Open file: `supabase/migrations/20251019000003_create_customer_journey_system.sql`

**Copy entire file contents** (Ctrl+A, Ctrl+C)

### 4. Paste and Execute

- **Paste** SQL into Supabase SQL Editor (Ctrl+V)
- Click **"Run"** button (or press Ctrl+Enter)
- Wait for: **"Success. No rows returned"** message

### 5. Verify Tables Created

Run this verification query:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'coverage_leads',
  'consumer_orders',
  'business_quotes',
  'kyc_documents',
  'order_status_history'
)
ORDER BY table_name;
```

**Expected Result**: 5 rows

```
coverage_leads
consumer_orders
business_quotes
kyc_documents
order_status_history
```

### 6. Test Functions

```sql
-- Should return format: ORD-YYYYMMDD-XXXX
SELECT generate_order_number();

-- Should return format: QTE-YYYYMMDD-XXXX
SELECT generate_quote_number();
```

---

## ✅ Verification Checklist

After migration completes:

- [ ] All 5 tables exist
- [ ] Functions work (`generate_order_number()`, `generate_quote_number()`)
- [ ] Triggers active (check with sample insert)
- [ ] RLS policies enabled
- [ ] No error messages in SQL Editor

---

## 🧪 Quick Test

Test the complete workflow:

```sql
-- 1. Create a test coverage lead
INSERT INTO coverage_leads (
  customer_type,
  first_name,
  last_name,
  email,
  phone,
  address,
  city,
  province,
  lead_source,
  status
) VALUES (
  'consumer',
  'Test',
  'User',
  'test@example.com',
  '+27821234567',
  '123 Test Street',
  'Johannesburg',
  'Gauteng',
  'coverage_checker',
  'new'
) RETURNING id, created_at;

-- 2. Verify lead created
SELECT COUNT(*) FROM coverage_leads;
-- Should return: 1

-- 3. Test quote with auto-calculations
INSERT INTO business_quotes (
  quote_number,
  company_name,
  contact_first_name,
  contact_last_name,
  contact_email,
  contact_phone,
  business_address,
  package_name,
  package_speed,
  monthly_recurring,
  installation_fee,
  router_cost,
  valid_until,
  lead_source
) VALUES (
  generate_quote_number(),
  'Test Company',
  'Jane',
  'Smith',
  'jane@test.com',
  '+27821234567',
  '456 Business Blvd',
  'BizFibre Pro',
  '100/100 Mbps',
  2999.00,
  3500.00,
  1200.00,
  CURRENT_DATE + INTERVAL '30 days',
  'website_form'
) RETURNING quote_number, subtotal, vat_amount, total_amount;

-- Verify auto-calculations:
-- subtotal = 2999 + 3500 + 1200 = 7699
-- vat_amount = 7699 * 0.15 = 1154.85
-- total_amount = 7699 + 1154.85 = 8853.85

-- 4. Clean up test data
DELETE FROM business_quotes WHERE company_name = 'Test Company';
DELETE FROM coverage_leads WHERE email = 'test@example.com';
```

---

## 🐛 Troubleshooting

### Error: "column does not exist" or "relation does not exist"

**Solution**: See `MIGRATION_FIX_PHASE_1.md` - this has been fixed by removing foreign key to non-existent `coverage_checks` table.

### Error: "relation already exists"

**Solution**: Tables already created, migration is idempotent and safe to re-run.

**To recreate tables** (if needed):

```sql
-- Drop tables in correct order (respects foreign keys)
DROP TABLE IF EXISTS order_status_history CASCADE;
DROP TABLE IF EXISTS kyc_documents CASCADE;
DROP TABLE IF EXISTS business_quotes CASCADE;
DROP TABLE IF EXISTS consumer_orders CASCADE;
DROP TABLE IF EXISTS coverage_leads CASCADE;

-- Then re-run migration
```

### Error: "permission denied"

**Solution**: Ensure you're logged in as database owner/admin in Supabase Dashboard.

### Warning: No rows affected

**This is normal** - migration creates structure (tables, functions, triggers), not data.

---

## 📊 What Gets Created

### Tables (5)
1. `coverage_leads` - Lead capture
2. `consumer_orders` - B2C orders
3. `business_quotes` - B2B quotes
4. `kyc_documents` - Document management
5. `order_status_history` - Audit trail

### Enums (7)
- `customer_type`, `lead_source`, `order_status`, `quote_status`
- `kyc_document_type`, `kyc_verification_status`

### Functions (3)
- `generate_order_number()`
- `generate_quote_number()`
- `calculate_quote_totals()`
- `update_updated_at_column()`
- `track_status_change()`

### Triggers (8)
- Auto-update timestamps (5 tables)
- Auto-calculate quote totals
- Auto-track status changes (3 entity types)

### RLS Policies (10)
- View/manage policies for all 5 tables
- Admin-only access

### Indexes (20+)
- Performance indexes on all key fields
- Unique indexes on Zoho IDs, order numbers, quote numbers

---

## 🎯 Next Actions

After successful migration:

1. **Update local TypeScript** (already done):
   - Types in `/lib/types/customer-journey.ts`
   - Import and use in components

2. **Test API Routes**:
   ```bash
   npm run dev:memory
   # Visit: http://localhost:3001/api/admin/coverage-leads
   ```

3. **Start Building Phase 2**:
   - Coverage checker lead capture
   - Order form
   - Status tracking

4. **Reference Documentation**:
   - Full guide: `docs/features/CUSTOMER_JOURNEY_PHASE_1_GUIDE.md`
   - Summary: `PHASE_1_COMPLETE_SUMMARY.md`

---

## 📞 Need Help?

- **Migration Issues**: Check Supabase Dashboard logs
- **SQL Errors**: Review migration file comments
- **Type Errors**: Run `npm run type-check`

---

**Estimated Time**: 5 minutes
**Complexity**: Low (copy/paste SQL)
**Reversible**: Yes (drop tables if needed)
**Safe**: Idempotent, re-runnable

✅ Ready to apply!
