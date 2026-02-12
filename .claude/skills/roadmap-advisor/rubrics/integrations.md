# Integrations Rubric

Evaluate external integration health and maturity.

## Scoring Criteria

| Criterion | Weight | 10 | 5 | 1 |
|-----------|--------|----|----|---|
| **API Coverage** | 25% | Full API utilized, all needed endpoints | Core endpoints only | Minimal, missing features |
| **Error Recovery** | 25% | Retry, fallback, circuit breaker | Basic retry logic | Fail hard, no recovery |
| **Sync Health** | 20% | Real-time or near-real-time, consistent | Batch sync, eventual consistency | Manual or broken sync |
| **Monitoring** | 15% | Health checks, alerting, dashboards | Logs only | Blind, no visibility |
| **Documentation** | 15% | Complete, current, examples | Partial docs | Missing or outdated |

## CircleTel Thresholds

| Score | Status | Action |
|-------|--------|--------|
| 8-10 | Production Ready | Maintain and monitor |
| 6-7 | Operational | Add monitoring, improve docs |
| 4-5 | Fragile | Needs reliability work |
| 1-3 | Broken | Critical fix required |

## Integration-Specific Expectations

### NetCash Pay Now (Payment)
- Webhook signature verification
- Transaction status tracking
- Reconciliation automation
- eMandate management
- Expected score: 9+ (revenue-critical)

### Zoho CRM/Billing
- Async sync with retry
- Conflict resolution
- Sync status tracking in DB
- Rate limit handling
- Expected score: 7+ (async acceptable)

### MTN APIs (Coverage)
- 4-layer fallback chain
- Response caching
- Anti-bot header handling
- Timeout management
- Expected score: 8+ (core business)

### Didit KYC
- Session lifecycle management
- Webhook verification
- Status polling fallback
- Document handling
- Expected score: 7+ (compliance-critical)

### Clickatell SMS
- Delivery status tracking
- Template management
- Rate limiting
- Fallback for failures
- Expected score: 7+ (notification-critical)

### Interstellio (Service Provisioning)
- Credential generation
- Activation workflows
- Session monitoring
- Error handling
- Expected score: 7+ (operational)

## Health Check Patterns

### Required Patterns
- [ ] Dedicated service file in `lib/[provider]/`
- [ ] Webhook handler in `app/api/webhooks/`
- [ ] Sync status table in database
- [ ] Error logging with domain logger
- [ ] Timeout configuration

### Monitoring Checklist
- [ ] Health endpoint exists
- [ ] Status tracked in admin panel
- [ ] Alerts configured for failures
- [ ] Logs searchable by integration

## Evaluation Prompt

When scoring an integration:

1. Find service file: `lib/[provider]/*-service.ts`
2. Check for webhook handlers: `app/api/webhooks/[provider]/`
3. Look for sync status tables: `supabase/migrations/*[provider]*`
4. Verify error handling patterns
5. Check for health/status endpoints
6. Review documentation in `docs/`

## Quick Assessment

```
Integration: [Provider Name]
Type: [payment/crm/coverage/kyc/sms/provisioning]

API Coverage:     _/10 × 0.25 = _
Error Recovery:   _/10 × 0.25 = _
Sync Health:      _/10 × 0.20 = _
Monitoring:       _/10 × 0.15 = _
Documentation:    _/10 × 0.15 = _
─────────────────────────────────
Total Score:      _/10
Status:           [Production Ready/Operational/Fragile/Broken]
```

## Integration Dependency Map

```
┌─────────────────────────────────────────────────────────────────┐
│                 INTEGRATION DEPENDENCIES                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   MTN Coverage ──► Package Selection ──► Order Creation          │
│                                              │                   │
│                                              ▼                   │
│   Didit KYC ◄──────────────────────── B2B Quote Flow             │
│       │                                      │                   │
│       ▼                                      ▼                   │
│   Contract Gen ──► Zoho Sign ──► NetCash Payment                 │
│                                      │                           │
│                                      ▼                           │
│   Interstellio Provisioning ◄── Payment Success                  │
│       │                                                          │
│       ▼                                                          │
│   Clickatell SMS ──► Customer Notification                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```
