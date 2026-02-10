# Corporate Client Management System - Learnings

**Date**: 2026-02-11
**Scope**: Enterprise multi-site account management (e.g., Unjani Clinics 252+ sites)

## Summary

Implemented complete corporate client management system with parent-child account structure, auto-generated account numbers, bulk PPPoE credential management, and admin UI.

## Key Patterns

### 1. Auto-Generated Sequential Account Numbers per Parent

PostgreSQL trigger generates account numbers in format `CT-{CORP_CODE}-{NNN}`:

```sql
CREATE OR REPLACE FUNCTION generate_corporate_site_account_number()
RETURNS TRIGGER AS $$
DECLARE
  corp_code VARCHAR(10);
  next_num INTEGER;
BEGIN
  -- Get corporate code from parent
  SELECT corporate_code INTO corp_code
  FROM corporate_accounts WHERE id = NEW.corporate_id;

  -- Get next sequential number for this corporate
  SELECT COALESCE(MAX(site_number), 0) + 1 INTO next_num
  FROM corporate_sites WHERE corporate_id = NEW.corporate_id;

  -- Set values
  NEW.site_number := next_num;
  NEW.account_number := 'CT-' || corp_code || '-' || LPAD(next_num::TEXT, 3, '0');
  NEW.pppoe_username := NEW.account_number || '@circletel.co.za';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_corporate_site_account_number
  BEFORE INSERT ON corporate_sites
  FOR EACH ROW
  WHEN (NEW.account_number IS NULL)
  EXECUTE FUNCTION generate_corporate_site_account_number();
```

**Benefits**:
- Automatic, sequential numbering per corporate
- Consistent format across all sites
- PPPoE username derived from account number

### 2. Cached Aggregate Counts via Trigger

Keep site counts updated on parent entity:

```sql
CREATE OR REPLACE FUNCTION update_corporate_site_counts()
RETURNS TRIGGER AS $$
DECLARE
  corp_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    corp_id := OLD.corporate_id;
  ELSE
    corp_id := NEW.corporate_id;
  END IF;

  UPDATE corporate_accounts
  SET
    total_sites = (SELECT COUNT(*) FROM corporate_sites WHERE corporate_id = corp_id),
    active_sites = (SELECT COUNT(*) FROM corporate_sites WHERE corporate_id = corp_id AND status = 'active'),
    pending_sites = (SELECT COUNT(*) FROM corporate_sites WHERE corporate_id = corp_id AND status IN ('pending', 'ready', 'provisioned'))
  WHERE id = corp_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

**Benefits**:
- No need for COUNT queries on list pages
- Always accurate (trigger-maintained)
- Improves query performance

### 3. Bulk Credential Generation with Encrypted Export

```typescript
// Generate credentials for sites without them
const result = await CorporatePPPoEBulkService.bulkGenerate(siteIds, adminUserId);

// Export decrypted credentials for ops team
const exportResult = await CorporatePPPoEBulkService.exportCredentials(
  corporateId,
  requestedBy,
  ipAddress
);
// Returns CSV with: Site Name, Account Number, PPPoE Username, Password, Address
```

**Security**:
- Passwords stored encrypted (AES-256-GCM)
- Export logged to audit trail
- CSV should be deleted after router configuration

### 4. Centralized Contact Constants

```typescript
// lib/constants/contact.ts
export const CONTACT = {
  PHONE_SUPPORT: '082 487 3900',
  WHATSAPP_NUMBER: '082 487 3900',
  WHATSAPP_LINK: 'https://wa.me/27824873900',
  EMAIL_SUPPORT: 'support@circletel.co.za',
  // ...
} as const;

export function getWhatsAppLink(message?: string): string {
  if (!message) return CONTACT.WHATSAPP_LINK;
  return `${CONTACT.WHATSAPP_LINK}?text=${encodeURIComponent(message)}`;
}
```

**Benefits**:
- Single source of truth for contact info
- Update once, propagate everywhere
- Includes helper functions for common patterns

## File Structure

```
lib/corporate/
├── types.ts           # Type definitions
├── corporate-service.ts   # Corporate CRUD
├── site-service.ts    # Site management + bulk import
├── pppoe-bulk-service.ts  # Bulk credential operations
└── index.ts           # Barrel export

app/api/admin/corporate/
├── route.ts           # List/Create
├── stats/route.ts     # Dashboard stats
└── [id]/
    ├── route.ts       # Get/Update
    ├── sites/
    │   ├── route.ts   # Site CRUD
    │   └── bulk/route.ts  # CSV import
    └── pppoe/
        ├── generate/route.ts  # Credential generation
        └── export/route.ts    # CSV export

app/admin/corporate/
├── page.tsx           # List with stats cards
├── new/page.tsx       # Create form
└── [id]/page.tsx      # Detail with tabs
```

## Gotchas

1. **Supabase Join Returns Array**: Always handle joined data as potentially array:
   ```typescript
   const cred = Array.isArray(site.pppoe_credentials)
     ? site.pppoe_credentials[0]
     : site.pppoe_credentials;
   ```

2. **MCP Tools in Subagents**: MCP tools aren't available from Task subagents - apply migrations via Dashboard or main session

3. **Corporate Code Validation**: Must be uppercase alphanumeric:
   ```sql
   CONSTRAINT corporate_code_uppercase CHECK (corporate_code = UPPER(corporate_code)),
   CONSTRAINT corporate_code_alphanumeric CHECK (corporate_code ~ '^[A-Z0-9]+$')
   ```

## Usage Example

```typescript
import { CorporateAccountService, CorporateSiteService, CorporatePPPoEBulkService } from '@/lib/corporate';

// Create corporate
const { account } = await CorporateAccountService.create({
  corporateCode: 'UNJ',
  companyName: 'Unjani Clinics NPC',
  primaryContactName: 'Lynda Toussaint',
  primaryContactEmail: 'ltoussaint@unjani.org',
  industry: 'Healthcare',
  expectedSites: 252,
});

// Add site (account number auto-generated: CT-UNJ-001)
const { site } = await CorporateSiteService.create({
  corporateId: account.id,
  siteName: 'Unjani Clinic - Kayamandi',
  installationAddress: { city: 'Stellenbosch', province: 'Western Cape' },
  monthlyFee: 450,
});

// Generate PPPoE credentials
const result = await CorporatePPPoEBulkService.bulkGenerate([site.id], adminUserId);
// result.credentials[0] = { username: 'CT-UNJ-001@circletel.co.za', password: 'xYz123...' }

// Export for ops team
const csv = await CorporatePPPoEBulkService.exportCredentials(account.id, adminUserId);
```

## Related Files

- Migration: `supabase/migrations/20260211000001_create_corporate_accounts.sql`
- Client docs: `docs/clients/unjani-clinics/README.md`
- Contact constants: `lib/constants/contact.ts`
