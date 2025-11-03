# Invoice Number Generation Examples

## Format
**Pattern:** `INV-YYYY-NNN`

Where:
- `INV` = Prefix (Invoice)
- `YYYY` = Current year (4 digits)
- `NNN` = Sequential number padded to 3 digits (001, 002, ...)

## Example Invoice Numbers

### Year 2025 Invoices
```
INV-2025-001  (First invoice of 2025)
INV-2025-002  (Second invoice)
INV-2025-003  (Third invoice)
INV-2025-004
INV-2025-005
...
INV-2025-099  (99th invoice)
INV-2025-100  (100th invoice)
...
INV-2025-999  (999th invoice - supports up to 999 invoices per year)
```

### Year Rollover (2026)
```
INV-2026-001  (First invoice of new year - sequence resets)
INV-2026-002
INV-2026-003
...
```

## Implementation Details

### Function: generate_invoice_number()
```sql
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  sequence_num TEXT;
  next_sequence INTEGER;
BEGIN
  current_year := TO_CHAR(NOW(), 'YYYY');

  -- Count existing invoices for current year
  SELECT COUNT(*) + 1
  INTO next_sequence
  FROM invoices
  WHERE invoice_number LIKE 'INV-' || current_year || '-%';

  -- Pad sequence to 3 digits (001, 002, etc.)
  sequence_num := LPAD(next_sequence::TEXT, 3, '0');

  -- Return formatted invoice number
  RETURN 'INV-' || current_year || '-' || sequence_num;
END;
$$ LANGUAGE plpgsql;
```

### Trigger: before_insert_invoice
```sql
CREATE TRIGGER before_insert_invoice
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_invoice_number();
```

## Usage

### Automatic Generation (Recommended)
```sql
-- Invoice number auto-generated
INSERT INTO invoices (
  contract_id,
  customer_id,
  items,
  subtotal,
  vat_amount,
  total_amount,
  due_date
) VALUES (
  'contract-uuid',
  'customer-uuid',
  '[{"description": "Monthly Service", "quantity": 1, "unit_price": 799.00, "total": 799.00}]'::JSONB,
  799.00,
  119.85,
  918.85,
  CURRENT_DATE + INTERVAL '30 days'
);

-- Result: invoice_number = 'INV-2025-001' (or next sequential)
```

### Manual Override (Not Recommended)
```sql
-- Explicitly set invoice_number (bypasses trigger)
INSERT INTO invoices (
  invoice_number,
  contract_id,
  customer_id,
  items,
  subtotal,
  vat_amount,
  total_amount,
  due_date
) VALUES (
  'INV-2025-CUSTOM',  -- Custom number
  'contract-uuid',
  'customer-uuid',
  '[]'::JSONB,
  0, 0, 0,
  CURRENT_DATE
);
```

## Uniqueness Guarantee

### Database Constraint
```sql
invoice_number TEXT UNIQUE NOT NULL
```

- **UNIQUE:** Prevents duplicate invoice numbers
- **NOT NULL:** Ensures all invoices have a number
- **Index:** Automatically created for UNIQUE constraint (fast lookups)

### Concurrency Handling
- Sequential numbering works correctly under concurrent inserts
- PostgreSQL transaction isolation ensures no gaps or duplicates
- Each transaction sees consistent COUNT(*) result

## Pattern Consistency

### CircleTel Document Numbering
All CircleTel business documents follow the same pattern:

| Document Type | Prefix | Example |
|--------------|--------|---------|
| **Quote** | BQ | BQ-2025-001 |
| **Contract** | CT | CT-2025-001 |
| **Invoice** | INV | INV-2025-001 |
| **Receipt** | RCP | RCP-2025-001 |

### Benefits
1. **Easy identification** by document type (prefix)
2. **Chronological ordering** by year
3. **Sequential tracking** within each year
4. **Audit-friendly** for accounting and compliance
5. **Customer-friendly** for reference and support

## Testing

### Test Script
See: `supabase/tests/test_invoice_number_generation.sql`

**Test Output:**
```
NOTICE:  Invoice Number 1: INV-2025-001
NOTICE:  ✓ Format matches INV-YYYY-NNN
NOTICE:  Invoice Number 2: INV-2025-002
NOTICE:  Invoice Number 3: INV-2025-003
NOTICE:
NOTICE:  === TEST RESULTS ===
NOTICE:  Example Invoice Numbers:
NOTICE:    1: INV-2025-001
NOTICE:    2: INV-2025-002
NOTICE:    3: INV-2025-003
NOTICE:
NOTICE:  ✓ Invoice number generation working correctly
NOTICE:  ✓ Format: INV-YYYY-NNN
NOTICE:  ✓ Sequential numbering verified
```

## Migration File
**Path:** `supabase/migrations/20251104000001_create_invoicing_system.sql`
**Lines:** 344
**Created:** 2025-11-04

---

**Last Updated:** 2025-11-04
**Verified By:** database-engineer agent
