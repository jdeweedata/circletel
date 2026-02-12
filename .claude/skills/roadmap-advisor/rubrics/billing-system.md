# Billing System Rubric

Evaluate billing and payment system completeness.

## Scoring Criteria

| Criterion | Weight | 10 | 5 | 1 |
|-----------|--------|----|----|---|
| **Billing Models** | 25% | Recurring + usage + tiered + overage | Basic recurring only | Manual billing |
| **Payment Methods** | 20% | 20+ methods, fallback, retry | Card/EFT only | Single method |
| **Dunning Automation** | 20% | Multi-step, configurable, escalation | Basic reminders | Manual follow-up |
| **Reconciliation** | 20% | Automated matching, exception handling | Semi-automated | Fully manual |
| **Compliance** | 15% | Full audit trail, POPIA, invoicing rules | Basic logging | Non-compliant |

## CircleTel Thresholds

| Score | Status | Action |
|-------|--------|--------|
| 8-10 | Mature | Monitor and optimize |
| 6-7 | Functional | Add automation |
| 4-5 | Manual | Significant investment needed |
| 1-3 | Broken | Critical business risk |

## Capability Breakdown

### Billing Models
| Model | Status | Implementation |
|-------|--------|----------------|
| Recurring (monthly) | ✅ | `customer_invoices`, billing cron |
| Usage-based | ⚠️ | Basic usage_history, no overage |
| Tiered pricing | ⚠️ | Service packages, no dynamic |
| Overage charges | ❌ | Not implemented |
| Prorated billing | ❌ | Not implemented |
| Multi-currency | ❌ | ZAR only |

### Payment Processing
| Method | Status | Implementation |
|--------|--------|----------------|
| Credit Card | ✅ | NetCash Pay Now |
| Debit Order | ✅ | eMandate |
| EFT | ✅ | NetCash Pay Now |
| Mobicred/Payflex | ✅ | NetCash Pay Now |
| Cryptocurrency | ❌ | Not implemented |

### Dunning Flow
| Step | Status | Implementation |
|------|--------|----------------|
| Payment due reminder | ✅ | Email + SMS |
| 1st past due | ⚠️ | Manual |
| 2nd past due | ❌ | Not implemented |
| Final notice | ❌ | Not implemented |
| Service suspension | ❌ | Not automated |
| Collections handoff | ❌ | Not implemented |

### Reconciliation
| Process | Status | Implementation |
|---------|--------|----------------|
| Statement import | ⚠️ | Semi-automated |
| Auto-matching | ⚠️ | Basic rules |
| Exception queue | ❌ | Not implemented |
| Bank feed integration | ❌ | Not implemented |

## Required Tables

Check for these billing tables:

| Table | Purpose | Exists |
|-------|---------|--------|
| `customer_invoices` | Invoice records | ✅ |
| `customer_payment_methods` | Stored methods | ✅ |
| `payment_transactions` | Payment history | ✅ |
| `credit_notes` | Refunds/credits | ✅ |
| `paynow_tracking` | Short URL tracking | ✅ |
| `usage_records` | Metered usage | ⚠️ |
| `dunning_history` | Collection attempts | ❌ |
| `reconciliation_log` | Matching records | ❌ |

## Evaluation Prompt

When scoring the billing system:

1. Check billing tables: `supabase/migrations/*invoice*`, `*payment*`
2. Review billing services: `lib/billing/`
3. Check payment integration: `lib/payments/netcash*`
4. Verify cron jobs: `app/api/cron/*billing*`
5. Check notification flow: Email + SMS for billing events
6. Look for audit logging: `audit_logs` entries

## Quick Assessment

```
Billing Area: [Overall/Invoicing/Payments/Dunning/Reconciliation]

Billing Models:      _/10 × 0.25 = _
Payment Methods:     _/10 × 0.20 = _
Dunning Automation:  _/10 × 0.20 = _
Reconciliation:      _/10 × 0.20 = _
Compliance:          _/10 × 0.15 = _
─────────────────────────────────────
Total Score:         _/10
Status:              [Mature/Functional/Manual/Broken]
```

## Industry Comparison

### CircleTel vs Industry Average

| Capability | CircleTel | Industry | Gap |
|------------|-----------|----------|-----|
| Recurring billing | 9/10 | 8/10 | ✅ Above |
| Payment methods | 9/10 | 7/10 | ✅ Above |
| eMandate support | 9/10 | 6/10 | ✅ Above |
| Usage-based billing | 3/10 | 7/10 | ❌ Below |
| Dunning automation | 4/10 | 7/10 | ❌ Below |
| Reconciliation | 5/10 | 7/10 | ⚠️ Below |
| Proration | 2/10 | 6/10 | ❌ Below |

**Overall**: Strong payment foundation, gaps in usage billing and dunning.
