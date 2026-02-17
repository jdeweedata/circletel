# Admin Billing Dashboard Integration Design

**Date**: 2026-02-17
**Status**: Approved
**Author**: Claude Code + User

## Overview

Integrate monthly invoice automation features into the admin dashboard with:
1. Customer detail page billing tab
2. Cron logs audit page

## Requirements

| Requirement | Decision |
|-------------|----------|
| Location | Customer detail page (tab-based) |
| Cron Logs | New `/admin/billing/cron-logs` page |

## Design

### 1. Customer Detail Page - Tab Structure

Convert existing customer detail page to tab-based layout:

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Back    Shaun Robertson                    [Edit] [Actions ▼] │
│            CT-2025-00012 • shaunr07@gmail.com                    │
├──────────────────────────────────────────────────────────────────┤
│  [Overview]  [Orders]  [Services]  [Billing]  [Tickets]          │
├──────────────────────────────────────────────────────────────────┤
│  (Tab content here)                                              │
└──────────────────────────────────────────────────────────────────┘
```

**Tabs:**
| Tab | Content |
|-----|---------|
| Overview | Customer info, contact details, account status |
| Orders | Order history |
| Services | Active services (moved from overview) |
| **Billing** | NEW: Billing settings, generate invoice, invoice history |
| Tickets | Support tickets |

### 2. Billing Tab Content

```
┌──────────────────────────────────────────────────────────────────┐
│  BILLING TAB                                                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ Services & Billing Settings ─────────────────────────────┐  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────────┐   │  │
│  │  │ 📦 SkyFibre Home Plus                              │   │  │
│  │  │    R899.00/month • Status: Active                  │   │  │
│  │  │                                                    │   │  │
│  │  │    Billing Day: [1 ▼]    Last Billed: 01 Feb 2026 │   │  │
│  │  │                                                    │   │  │
│  │  │    [Generate Invoice]  [Send Pay Now]              │   │  │
│  │  └────────────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─ Invoice History ──────────────────────────── [View All →] ┐  │
│  │                                                            │  │
│  │  INV-2026-00002   R899.00   🔴 Overdue    25 Jan 2026     │  │
│  │  INV-000040       R899.00   🟢 Paid       25 Nov 2025     │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─ Payment Methods ──────────────────────────────────────────┐  │
│  │  (Existing CustomerPaymentMethods component)               │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Actions:**
| Button | Action |
|--------|--------|
| **Billing Day dropdown** | Edit billing_day (1-28), auto-saves |
| **Generate Invoice** | Creates invoice for this service, syncs ZOHO, shows confirmation |
| **Send Pay Now** | Sends Pay Now link via Email + SMS for existing unpaid invoice |

### 3. Cron Logs Page (`/admin/billing/cron-logs`)

```
┌──────────────────────────────────────────────────────────────────┐
│  Billing Cron Logs                              [Run Now ▼]      │
│  Audit trail for automated billing jobs                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ Summary Stats ───────────────────────────────────────────┐  │
│  │  [Last Run: 01 Feb 2026 06:00]  [Next: 01 Mar 2026 06:00] │  │
│  │                                                            │  │
│  │  📊 47 Processed   ✅ 45 Success   ❌ 2 Failed   ⏭️ 5 Skip │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─ Run History ─────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │  🟢 01 Feb 2026 06:00    monthly_invoice    47 → 45 ✓     │  │
│  │     Duration: 2m 34s     ZOHO: 45   Email: 45   SMS: 43   │  │
│  │                                                  [Details] │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Features:**
| Feature | Description |
|---------|-------------|
| **Summary Stats** | Last/next run, totals from latest run |
| **Run History** | List of cron runs with status indicators |
| **Details Modal** | Click to see full results JSON, failed customers |
| **Run Now** | Dropdown: "Dry Run" or "Run Now" for manual trigger |

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/customers/[id]/services` | GET | List services with billing_day |
| `/api/admin/customers/[id]/services/[serviceId]` | PATCH | Update billing_day |
| `/api/admin/customers/[id]/generate-invoice` | POST | Generate invoice for customer |
| `/api/admin/customers/[id]/send-paynow` | POST | Send Pay Now for unpaid invoice |
| `/api/admin/billing/cron-logs` | GET | List cron run history |
| `/api/admin/billing/cron-logs/[id]` | GET | Get single run details |

**Existing endpoints to reuse:**
- `/api/cron/generate-monthly-invoices` - Already has `customerId` filter

## Components

### New Components
| Component | Location | Purpose |
|-----------|----------|---------|
| `CustomerBillingTab` | `components/admin/customers/` | Billing tab content |
| `ServiceBillingCard` | `components/admin/customers/` | Service with billing controls |
| `BillingCronLogsPage` | `app/admin/billing/cron-logs/` | Cron logs page |
| `CronRunDetailsModal` | `components/admin/billing/` | Details modal |

### Modified Components
| Component | Changes |
|-----------|---------|
| `CustomerDetailPage` | Convert to tab-based layout |

## Estimated Effort

| Task | Effort |
|------|--------|
| Tab refactor of customer page | 1 hour |
| CustomerBillingTab component | 1 hour |
| API endpoints (4 new) | 1 hour |
| Cron logs page | 1 hour |
| Testing | 30 min |
| **Total** | **~4.5 hours** |
