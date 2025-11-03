# Supabase Migrations

This directory contains all database migrations for CircleTel.

---

## 📁 **Directory Structure**

```
migrations/
├── README.md                    # This file
├── 202412*.sql                  # Dec 2024 - Product setup
├── 202501*.sql                  # Jan 2025 - Admin & RBAC
├── 202509*.sql                  # Sep 2025 - Contract audits
├── 202510*.sql                  # Oct 2025 - Coverage, providers, packages
├── 202511*.sql                  # Nov 2025 - B2B workflow, KYC, RLS
├── 202512*.sql                  # Dec 2025 - Future migrations
│
└── archive/                     # Archived migrations
    ├── duplicates/              # _FIXED, _v2, .bak versions
    └── deprecated/              # Old/unused migrations
```

---

## 🎯 **Active Migrations** (Applied to Production)

### **December 2024 - Foundation**
- Product tables and sample data
- Service packages setup

### **January 2025 - Admin System**
- Admin users and RBAC
- Service type mapping
- MTN 5G/LTE packages
- Orders and payment columns

### **September-October 2025 - Core Features**
- Contract audits (Unjani)
- Coverage system tables
- FTTB providers
- Dynamic pricing
- Provider management
- Customer journey system
- Payment transactions

### **October 2025 - Enhancements**
- Multi-provider architecture
- Provider health monitoring
- Product approval system
- KYC documents (legacy)
- Coverage analytics
- Partner system

### **November 2025 - B2B Workflow** ⭐

**Applied via Consolidated Migration**:
- ✅ `B2B_WORKFLOW_MIGRATION_FINAL.sql` (in docs/deployment/)

**Individual Migration Files** (reference only, NOT applied separately):
1. `20251101000001_create_kyc_system.sql` - KYC sessions, RICA
2. `20251101120000_add_payment_webhooks_idempotency.sql` - Webhook tracking
3. `20251102000001_create_contracts_system.sql` - Contracts with signatures
4. `20251103000001_create_zoho_sync_system.sql` - ZOHO CRM integration
5. `20251104000001_create_invoicing_system.sql` - Invoices, billing cycles
6. `20251105000001_create_fulfillment_system.sql` - Installation, RICA

**Tables Created**:
- `kyc_sessions` - KYC verification from Didit
- `rica_submissions` - RICA compliance tracking
- `payment_webhooks` - Idempotency for NetCash
- `contracts` - Digital contracts with auto-numbering
- `invoices` - Invoice generation with VAT
- `payment_transactions` - Payment records
- `billing_cycles` - Recurring billing
- `installation_schedules` - Technician scheduling

**RLS Security**:
- All tables have RLS enabled
- Service role has full access (for API operations)
- Admin policies can be added later

---

## 📋 **Migration Naming Convention**

Format: `YYYYMMDDHHMMSS_description.sql`

Examples:
- `20251101000001_create_kyc_system.sql`
- `20251028143000_create_sales_agents.sql`

---

## 🚀 **Applying Migrations**

### **Option 1: Supabase Dashboard** (Recommended)
1. Go to https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/sql
2. Copy migration SQL
3. Paste and run

### **Option 2: Supabase CLI**
```bash
# Install CLI
winget install Supabase.CLI

# Link project
supabase link --project-ref agyjovdugmtopasyvlng

# Push migrations
supabase db push
```

### **Option 3: npx (No Installation)**
```bash
npx supabase link --project-ref agyjovdugmtopasyvlng
npx supabase db push
```

---

## 🗄️ **Archive Policy**

Files moved to `archive/`:

### **duplicates/**
- Files ending in `_FIXED.sql`
- Files ending in `_v2.sql`
- Files ending in `_fixed.sql`
- Files ending in `_clean.sql`
- Backup files (`.bak`)

These are alternate versions created during development. The main version was applied.

### **deprecated/**
- Files that drop tables (e.g., `drop_business_quotes.sql`)
- Empty or nearly-empty files
- Migrations replaced by newer versions

---

## ⚠️ **Important Notes**

1. **Never delete applied migrations** - Breaks migration history
2. **Archive instead of delete** - Keeps reference for debugging
3. **Test on staging first** - Avoid production issues
4. **Backup before migrating** - Critical for rollback
5. **Check dependencies** - Apply in chronological order

---

## 📊 **Migration Statistics**

| Category | Count |
|----------|-------|
| Total migrations | 98 |
| Active (in main folder) | ~80 |
| Archived duplicates | ~10 |
| Archived deprecated | ~8 |
| B2B Workflow migrations | 6 |

---

## 🔍 **Finding Migrations**

### **By Feature**
- **Products**: 2024* migrations
- **Admin/RBAC**: 202501* and 202510* migrations
- **Providers**: 202510* migrations
- **B2B Workflow**: 202511* migrations
- **Partners**: 20251027* migrations

### **By Table**
Use git blame or search migration content:
```bash
grep -r "CREATE TABLE kyc_sessions" migrations/
```

---

## 📞 **Support**

**Questions about migrations?**
- Check git history: `git log -- supabase/migrations/`
- Review spec: `agent-os/specs/20251101-b2b-quote-to-contract-kyc/spec.md`
- Contact: devops@circletel.co.za

---

**Last Updated**: 2025-11-02  
**Maintained By**: DevOps Team
