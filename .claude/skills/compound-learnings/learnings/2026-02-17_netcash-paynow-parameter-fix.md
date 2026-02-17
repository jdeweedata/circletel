# NetCash Pay Now Parameter Mapping Fix

**Date**: 2026-02-17
**Issue**: Payment page showing R0.00 instead of correct amount
**Root Cause**: Incorrect parameter mapping for Pay Now URL

## The Problem

When generating Pay Now URLs, the payment page was showing:
- Amount: R0.00 (should be R899.00)
- Description: showing webhook URL instead of invoice description

## Investigation Steps

1. Checked NetCash portal screenshots for service keys
2. Tried multiple parameter combinations:
   - m1=service_key, m2=account_number → "Cannot process"
   - m1=service_key, m2=vendor_key → R0.00
   - m1=service_key, m2=service_key → R0.00
   - Amount parameter in cents → R0.00
3. Found existing working code in `lib/payments/providers/netcash/netcash-provider.ts`

## The Solution

### Correct Parameter Mapping

| Parameter | Purpose | Value |
|-----------|---------|-------|
| `m1` | Service Key | `65251ca3-95d8-47da-bbeb-d7fad8cd9ef1` |
| `m2` | **PCI Vault Key** | `6940844b-ea39-44a5-b929-427b205e457e` |
| `p2` | Transaction Reference | `CT-INV2026-00002-{timestamp}` |
| `p3` | Description | `CircleTel - INV-2026-00002` |
| `p4` | Amount in **RANDS** | `899.00` (NOT cents!) |
| `m9` | Return URL | `https://www.circletel.co.za/...` |

### Common Mistakes (that cause R0.00)

| Wrong | Correct |
|-------|---------|
| `m4` for amount | `p4` for amount |
| `Amount=89900` (cents) | `p4=899.00` (Rands) |
| `m2=vendor_key` | `m2=pci_vault_key` |
| `m2=account_number` | `m2=pci_vault_key` |
| `p3=webhook_url` | `p3=description` |

### NetCash Portal Settings Required

1. Go to **Services → Pay Now → Payment button**
2. Select **"Variable amount"** (NOT "Fixed amount")
3. Webhook URL should be configured in the **console only**, NOT in URL parameters

## Environment Variables

```bash
# .env.local - CORRECT configuration
NETCASH_SERVICE_KEY=65251ca3-95d8-47da-bbeb-d7fad8cd9ef1      # m1
NETCASH_MERCHANT_ID=6940844b-ea39-44a5-b929-427b205e457e      # m2 = PCI Vault Key
NEXT_PUBLIC_NETCASH_PCI_VAULT_KEY=6940844b-ea39-44a5-b929-427b205e457e
```

## Working URL Example

```
https://paynow.netcash.co.za/site/paynow.aspx?
  m1=65251ca3-95d8-47da-bbeb-d7fad8cd9ef1&
  m2=6940844b-ea39-44a5-b929-427b205e457e&
  p2=CT-INV2026-00002-1771356357084&
  p3=CircleTel+-+INV-2026-00002&
  p4=899.00&
  Budget=N&
  CustomerEmailAddress=customer@example.com&
  m9=https://www.circletel.co.za/api/payments/netcash/redirect&
  m4=CT-INV2026-00002-1771356357084
```

## Code Reference

The correct implementation exists in:
- `lib/payments/providers/netcash/netcash-provider.ts` - Uses p4 for amount in Rands
- `lib/payments/netcash-service.ts` - Was using wrong parameters (needs update)

## Key Learnings

1. **m2 is PCI Vault Key**, not vendor key or account number
2. **Amount uses p4 parameter**, not m4 or Amount
3. **Amount format is Rands** (e.g., "899.00"), not cents (89900)
4. **p3 is description**, NOT webhook URL
5. **Webhook URL goes in NetCash console only**, not in URL parameters
6. **NetCash portal must have "Variable amount" selected**, not "Fixed amount"

## Files Updated

- `/home/circletel/.env.local` - Fixed NETCASH_MERCHANT_ID to PCI Vault Key
- `/root/.claude/projects/-home-circletel/memory/MEMORY.md` - Added pattern documentation
