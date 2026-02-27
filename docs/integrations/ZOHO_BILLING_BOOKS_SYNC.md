# ZOHO Billing to Books Sync Configuration

This document describes how to enable and configure the native sync between ZOHO Billing and ZOHO Books for CircleTel's accounting integration.

## Overview

CircleTel uses ZOHO Billing for subscription management and invoicing. To integrate with the accounting system (ZOHO Books), we use ZOHO's native Billing → Books sync feature rather than building a custom API integration.

**Benefits of Native Sync:**
- Zero custom code required for accounting sync
- ZOHO handles GL mapping and chart of accounts
- Automatic invoice/payment reconciliation
- Real-time sync option available
- Maintains existing ZOHO Billing integration

## Prerequisites

- Active ZOHO Billing subscription (Plus or higher)
- Active ZOHO Books subscription
- Both accounts under the same ZOHO organization
- Admin access to both ZOHO Billing and ZOHO Books

## Configuration Steps

### Step 1: Access Integration Settings

1. Log in to **ZOHO Billing** at https://billing.zoho.com
2. Click the **Settings** gear icon (top right)
3. Navigate to **Integrations** → **ZOHO Apps** → **ZOHO Books**

### Step 2: Connect ZOHO Books

1. Click **Connect to ZOHO Books**
2. Select your ZOHO Books organization from the dropdown
3. Click **Connect**

If you have multiple ZOHO Books organizations, ensure you select the correct one for CircleTel.

### Step 3: Configure Sync Settings

**Sync Direction:** ZOHO Billing → ZOHO Books (one-way)

**Entities to Sync:**
- ✅ **Customers** - Sync customer records
- ✅ **Invoices** - Sync all invoices with line items
- ✅ **Payments** - Sync payment records
- ✅ **Credit Notes** - Sync credit notes and refunds

**Sync Frequency:**
- **Real-time** (Recommended) - Syncs immediately when changes occur
- **Daily** - Syncs once per day at a scheduled time

### Step 4: Map Chart of Accounts

Map ZOHO Billing accounts to ZOHO Books GL accounts:

| ZOHO Billing | ZOHO Books Account | Notes |
|--------------|-------------------|-------|
| Subscription Revenue | Sales Revenue | Main revenue account |
| Installation Fees | Installation Revenue | One-time setup fees |
| Equipment Sales | Equipment Revenue | Router sales, etc. |
| Bank Deposits | Bank Account (FNB/Standard) | Where payments deposit |
| Accounts Receivable | Accounts Receivable | Outstanding invoices |
| VAT Collected | VAT Output | 15% VAT |

### Step 5: Test the Sync

1. Create a test invoice in ZOHO Billing
2. Wait for sync (immediate if real-time enabled)
3. Check ZOHO Books for the synced invoice
4. Record a test payment in ZOHO Billing
5. Verify payment appears in ZOHO Books

### Step 6: Enable Production Sync

Once testing is successful:
1. Disable test mode (if enabled)
2. Enable sync for all historical data (optional)
3. Monitor sync status in ZOHO Billing → Integrations → Sync Logs

## Troubleshooting

### Sync Not Working

1. **Check connection status:** Settings → Integrations → ZOHO Books
2. **Review sync logs:** Look for error messages
3. **Verify account mapping:** Ensure all accounts are correctly mapped
4. **Check ZOHO Books limits:** Free tier has sync limitations

### Duplicate Records

1. **Enable duplicate detection** in sync settings
2. Use **customer reference numbers** for matching
3. If duplicates exist, merge in ZOHO Books before enabling sync

### Missing Data

- Ensure the entity type (Customer/Invoice/Payment) is enabled for sync
- Check date range filters in sync settings
- Verify the record exists in ZOHO Billing first

## Monitoring

### Sync Dashboard

Access: ZOHO Billing → Settings → Integrations → ZOHO Books → Sync Status

Shows:
- Last sync timestamp
- Records synced today
- Failed records
- Pending records

### Alerts

Configure email alerts for sync failures:
1. Settings → Notifications → Integration Alerts
2. Enable "ZOHO Books sync failed" notification
3. Add admin email addresses

## CircleTel-Specific Notes

### Customer Mapping

CircleTel customers sync with the following mapping:
- `account_number` (CT-YYYY-NNNNN) → ZOHO Books Customer Reference
- `company_name` (B2B) or `first_name + last_name` (B2C) → Customer Name
- `email` → Primary Contact Email

### Invoice Mapping

- `invoice_number` (INV-YYYY-NNNNN) → ZOHO Books Invoice Number
- `total_amount` → Invoice Total (ZAR)
- `line_items` → Invoice Line Items
- `due_date` → Due Date

### Payment Mapping

- Payment method → Recorded in ZOHO Books payment notes
- Transaction reference → ZOHO Books Reference Number
- NetCash payments → Auto-marked as "Electronic Payment"

## Environment Variables

No additional environment variables are needed for native sync configuration.
All settings are managed in the ZOHO console.

## Related Files

- `lib/integrations/zoho/billing-sync-service.ts` - Existing ZOHO Billing sync
- `lib/integrations/zoho/billing-client.ts` - ZOHO Billing API client
- `lib/integrations/zoho/types.ts` - ZOHO type definitions

## Support

For issues with ZOHO sync:
1. Check ZOHO status page: https://status.zoho.com
2. ZOHO Billing support: https://help.zoho.com/portal/en/billing
3. ZOHO Books support: https://help.zoho.com/portal/en/books

---

**Last Updated:** 2026-02-28
**Author:** Claude Code
**Version:** 1.0
