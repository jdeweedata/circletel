# B2B Feasibility Portal Design

**Date**: 2026-02-18
**Author**: Claude Code
**Status**: Approved
**Effort**: Medium (2-3 weeks)

## Problem Statement

Sales agents currently submit B2B feasibility requests via email, leading to:
- 4+ email exchanges per request
- Manual coverage checks on external portals (MTN, Tarana)
- Multi-day turnaround times
- No centralized tracking of requests
- Manual quote creation after feasibility

## Solution

A dedicated **Sales Quick Entry Portal** at `/admin/sales/feasibility` that allows sales agents to:
1. Paste multiple site addresses/GPS coordinates
2. Auto-run coverage checks (MTN, DFA, Tarana)
3. View results with recommended packages
4. Generate individual quotes per site with one click

## User Flow

```
Sales paste sites → Coverage checks (auto) → Review results → Generate quotes (1-click)
```

## Requirements Captured

| Requirement | Decision |
|-------------|----------|
| Primary Users | Sales Agents (simple, fast interface) |
| Workflow | Auto-generate quotes from feasibility |
| Multi-site | One quote per site (independent acceptance) |
| Package Selection | Smart recommendations based on coverage + requirements |
| Client Acceptance | Existing self-service portal (reuse) |

## Architecture

### Components Created

1. **UI Page**: `/app/admin/sales/feasibility/page.tsx`
   - Three-column form layout
   - Client details, requirements, sites input
   - Real-time processing with staggered animations
   - Coverage badges (Fibre, Tarana, 5G, LTE)
   - Package recommendations per site
   - Bulk quote generation

2. **Sidebar Navigation**: Added under "Sales & Partners"

### Existing Components Reused

1. **Coverage Aggregation Service**: `lib/coverage/aggregation-service.ts`
   - MTN Consumer API (WMS GeoServer)
   - MTN Wholesale API (Tarana/SkyFibre)
   - DFA Fibre (ArcGIS)
   - NAD coordinate correction
   - Base station validation

2. **B2B Quote System**: `lib/quotes/`
   - Quote generator
   - PDF generation
   - Email notifications
   - Client sharing via token
   - Digital signatures

### Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Sales Agent    │────▶│  Feasibility     │────▶│  Coverage APIs  │
│  (Form Entry)   │     │  Page            │     │  (MTN/DFA)      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │                          │
                               │ Auto-generate            │ Coverage
                               │ recommendations          │ results
                               ▼                          ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │  Package         │◀────│  Aggregation    │
                        │  Recommender     │     │  Service        │
                        └──────────────────┘     └─────────────────┘
                               │
                               │ Create quotes
                               ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │  business_quotes │────▶│  Client Portal  │
                        │  (existing)      │     │  (existing)     │
                        └──────────────────┘     └─────────────────┘
```

## API Endpoints

| Endpoint | Method | Status | Purpose |
|----------|--------|--------|---------|
| `/api/coverage/check` | POST | EXISTS | Coverage aggregation |
| `/api/quotes/business/create` | POST | EXISTS | Create single quote |
| `/api/quotes/business/bulk-create` | POST | NEW | Create multiple quotes from feasibility |
| `/api/sales/feasibility/history` | GET | NEW (optional) | View past feasibility checks |

## Database Changes

**No new tables required.** Leverages existing:
- `coverage_leads` - Addresses checked
- `business_quotes` - Quotes with `source: 'feasibility'` metadata
- `business_quote_items` - Package line items

## UI Design

### Form Section (Step 1)
- **Client Details**: Company name, contact info (optional)
- **Requirements**: Speed (100/200/500/1Gbps), Contention (Best Effort/10:1/DIA), Budget, Failover toggle
- **Sites**: Textarea for bulk paste (addresses or GPS coordinates)

### Results Section (Step 2)
- Real-time processing indicators per site
- Coverage badges: Fibre, Tarana (Zone), 5G, LTE
- Recommended packages with prices
- Select/deselect for quote generation

### Package Recommendation Logic

```typescript
// Priority order based on coverage availability:
1. Fibre (if available) - highest speed, best reliability
2. Tarana (if available) - good for B2B, symmetrical
3. 5G (if available) - good speeds, quick install
4. LTE (fallback) - available almost everywhere

// Filter by:
- Speed requirement (100/200/500/1Gbps)
- Budget constraint (if specified)
- Contention level affects package selection
```

## Implementation Tasks

### Phase 1: Core Functionality (Week 1)
1. ✅ Create UI page with form layout
2. ✅ Add sidebar navigation
3. Wire up coverage API calls
4. Implement package recommendation logic
5. Create bulk quote generation API

### Phase 2: Polish & Integration (Week 2)
6. Add geocoding for addresses (existing service)
7. Improve error handling and retry logic
8. Add loading states and animations
9. Test with real sales scenarios
10. Add feasibility history (optional)

### Phase 3: Enhancements (Week 3 - if needed)
11. Email summary to sales after completion
12. Export results to CSV
13. Integration with Zoho CRM

## Success Metrics

| Metric | Target |
|--------|--------|
| Time from request to quote | < 5 minutes (vs days) |
| Email exchanges per request | 0 (vs 4+) |
| Coverage check accuracy | > 95% |
| Quote conversion rate | Track vs manual process |

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Coverage API rate limits | Use existing caching (5-min TTL) |
| GPS coordinate parsing errors | Robust regex with fallback to geocoding |
| Package recommendations miss edge cases | Allow manual override before quote generation |

## Appendix: Email Examples Analyzed

```
From: Ernst Burger
To: Jeffrey De Wee

Sites:
• Stellenbosch Vineyards -33.992024° 18.766900°
• Rennie farms -33.793678° 18.979570°
• 4 Chopin Street, Klarinet -25.843988° 29.202688°
• Groote Post, Darling -33.420433° 18.400117°
• Valley Containers -33.889760° 18.722715°
• Business Client for ISP -34.133161° 18.369946°

Current process: 4+ emails, multiple manual portal checks, days of back-and-forth.
New process: Paste all sites, click "Check Feasibility", generate quotes in minutes.
```
