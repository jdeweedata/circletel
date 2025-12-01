# Competitor Analysis Module - Task List

## Overview

This document tracks all implementation tasks for the Competitor Analysis Module with web scraping, price tracking, and market intelligence features.

**Total Story Points:** 47
**Completed Story Points:** 0
**Remaining Story Points:** 47
**Implementation Status:** 0% Complete (0/8 Task Groups Done)
**Spec Version:** 1.0
**Created:** 2025-12-01

---

## Task Status Legend

- [ ] Not Started
- [x] Complete
- [~] In Progress
- [!] Blocked

---

## Task Groups

### Task Group 1: Database Foundation
**Assigned Implementer:** database-engineer
**Dependencies:** None
**Priority:** Critical
**Story Points:** 5

- [ ] 1.0 Create competitor analysis database schema
  - [ ] 1.1 Migration: `competitor_providers` table
    - Columns: id, name, slug, website, logo_url, provider_type, scrape_urls, scrape_config, is_active, last_scraped_at, scrape_frequency
    - Constraints: slug UNIQUE, provider_type CHECK
    - Timestamps: created_at, updated_at
  - [ ] 1.2 Migration: `competitor_products` table
    - Columns: id, provider_id, external_id, product_name, product_type, monthly_price, once_off_price, price_includes_vat, contract_term, data_bundle, data_gb, speed_mbps, device_name, technology, source_url, raw_data, scraped_at, is_current
    - Foreign key: provider_id → competitor_providers(id) CASCADE
    - Indexes: provider_id, is_current, product_type
  - [ ] 1.3 Migration: `competitor_price_history` table
    - Columns: id, competitor_product_id, monthly_price, once_off_price, recorded_at
    - Foreign key: competitor_product_id → competitor_products(id) CASCADE
    - Indexes: competitor_product_id, recorded_at
  - [ ] 1.4 Migration: `product_competitor_matches` table
    - Columns: id, product_type, product_id, competitor_product_id, match_confidence, match_method, matched_by, notes
    - Foreign key: competitor_product_id → competitor_products(id) CASCADE
    - Unique constraint: (product_type, product_id, competitor_product_id)
  - [ ] 1.5 Migration: `competitor_scrape_logs` table
    - Columns: id, provider_id, status, products_found, products_updated, products_new, error_message, started_at, completed_at, triggered_by, trigger_type
    - Foreign key: provider_id → competitor_providers(id) CASCADE
  - [ ] 1.6 Create views
    - v_competitor_price_comparison: Join matches with products and providers
    - v_competitor_provider_stats: Aggregate stats per provider
  - [ ] 1.7 RLS policies (admin-only via service role)
  - [ ] 1.8 Seed data: Initial 8 providers (MTN active, others inactive)

**Acceptance Criteria:**
- All tables created with proper constraints
- RLS policies enforced (admin-only)
- Views return expected data
- Seed data inserted successfully

**Files to Create:**
- `supabase/migrations/20251201XXXXXX_create_competitor_analysis.sql`

**Related User Story:** TS-2 (Database Schema)

---

### Task Group 2: Firecrawl Integration
**Assigned Implementer:** backend-engineer
**Dependencies:** None (can run parallel with TG1)
**Priority:** Critical
**Story Points:** 5

- [ ] 2.0 Build Firecrawl client infrastructure
  - [ ] 2.1 Install Firecrawl SDK
    - Run: `npm install @mendable/firecrawl-js`
    - Add FIRECRAWL_API_KEY to .env.local
  - [ ] 2.2 Create TypeScript types `lib/competitor-analysis/types.ts`
    - CompetitorProvider interface
    - CompetitorProduct interface
    - ScrapeJob interface
    - PriceHistory interface
    - ProductMatch interface
    - FirecrawlConfig interface
  - [ ] 2.3 Create Firecrawl client `lib/competitor-analysis/firecrawl-client.ts`
    - Initialize Firecrawl SDK
    - scrapeUrl(url, options): Scrape single URL
    - extractData(urls, schema): Extract structured data
    - mapSite(url): Discover URLs on site
    - getCreditUsage(): Check remaining credits
    - Error handling and retry logic
  - [ ] 2.4 Create credit tracking utility
    - Track credits used per scrape
    - Alert when usage exceeds threshold
    - Log usage to console/monitoring

**Acceptance Criteria:**
- Firecrawl SDK installed and configured
- Client can scrape test URL successfully
- Types cover all data structures
- Error handling works for common failures

**Files to Create:**
- `lib/competitor-analysis/types.ts`
- `lib/competitor-analysis/firecrawl-client.ts`

**Related User Story:** TS-1 (Firecrawl Client Wrapper)

---

### Task Group 3: Provider Scrapers
**Assigned Implementer:** backend-engineer
**Dependencies:** Task Groups 1, 2
**Priority:** High
**Story Points:** 8

- [ ] 3.0 Build provider scraper system
  - [ ] 3.1 Create abstract base provider `lib/competitor-analysis/providers/base-provider.ts`
    - Abstract class BaseProvider
    - Properties: name, slug, providerType, scrapeUrls
    - Methods: scrape(), parseProducts(), normalizePrice()
    - Protected helpers: extractPrice(), parseDataBundle(), determineProductType()
  - [ ] 3.2 Create provider registry `lib/competitor-analysis/providers/index.ts`
    - Map of slug → Provider instance
    - getProvider(slug): Get provider by slug
    - getAllProviders(): List all registered providers
    - getActiveProviders(): List active providers only
  - [ ] 3.3 Implement MTN provider `lib/competitor-analysis/providers/mtn-provider.ts`
    - Extend BaseProvider
    - Define Firecrawl extraction schema for MTN deal structure
    - Handle Angular SSR content
    - Parse device deals, contract plans, data bundles
    - Normalize pricing (VAT inclusive)
  - [ ] 3.4 Implement Vodacom provider `lib/competitor-analysis/providers/vodacom-provider.ts`
    - Extend BaseProvider
    - Vodacom-specific extraction schema
  - [ ] 3.5 Implement Telkom provider `lib/competitor-analysis/providers/telkom-provider.ts`
    - Extend BaseProvider
    - Handle both mobile and fibre products
  - [ ] 3.6 Implement Rain provider `lib/competitor-analysis/providers/rain-provider.ts`
    - Extend BaseProvider
    - Focus on 5G/unlimited data products
  - [ ] 3.7 Implement Afrihost provider `lib/competitor-analysis/providers/afrihost-provider.ts`
    - Extend BaseProvider
    - Focus on fibre/LTE products
  - [ ] 3.8 Write unit tests for MTN provider
    - Test price extraction
    - Test data normalization
    - Test product type detection

**Acceptance Criteria:**
- Base provider class extensible for new providers
- MTN provider extracts real data from live site
- Price normalization handles VAT correctly
- At least 2 additional providers implemented

**Files to Create:**
- `lib/competitor-analysis/providers/base-provider.ts`
- `lib/competitor-analysis/providers/index.ts`
- `lib/competitor-analysis/providers/mtn-provider.ts`
- `lib/competitor-analysis/providers/vodacom-provider.ts`
- `lib/competitor-analysis/providers/telkom-provider.ts`
- `lib/competitor-analysis/providers/rain-provider.ts`
- `lib/competitor-analysis/providers/afrihost-provider.ts`
- `lib/competitor-analysis/providers/__tests__/mtn-provider.test.ts`

**Related User Story:** US-2 (Automated Price Scraping), TS-3 (Provider Abstraction)

---

### Task Group 4: API Layer
**Assigned Implementer:** backend-engineer
**Dependencies:** Task Groups 1, 2, 3
**Priority:** High
**Story Points:** 8

- [ ] 4.0 Build competitor analysis API endpoints
  - [ ] 4.1 Dashboard endpoint `app/api/admin/competitor-analysis/route.ts`
    - GET: Return dashboard stats (provider count, product count, last scrape, alerts)
    - Include opportunity finder data
    - Include risk alerts
  - [ ] 4.2 Providers CRUD `app/api/admin/competitor-analysis/providers/route.ts`
    - GET: List all providers with stats (from view)
    - POST: Add new provider (validate URLs, slug uniqueness)
  - [ ] 4.3 Single provider `app/api/admin/competitor-analysis/providers/[id]/route.ts`
    - GET: Provider details with scrape history
    - PUT: Update provider config
    - DELETE: Remove provider (cascade products)
  - [ ] 4.4 Scrape trigger `app/api/admin/competitor-analysis/scrape/route.ts`
    - POST: Trigger scrape job for provider(s)
    - Accept: { providerId?: string, all?: boolean }
    - Return: { jobId, status: 'started' }
  - [ ] 4.5 Scrape status `app/api/admin/competitor-analysis/scrape/[id]/route.ts`
    - GET: Return scrape job status and results
  - [ ] 4.6 Products endpoint `app/api/admin/competitor-analysis/products/route.ts`
    - GET: List scraped products with filters
    - Query params: provider, type, minPrice, maxPrice, search
  - [ ] 4.7 Comparison endpoint `app/api/admin/competitor-analysis/compare/route.ts`
    - GET: Price comparison data for matched products
    - Return: CircleTel product with all competitor matches
  - [ ] 4.8 Price history `app/api/admin/competitor-analysis/history/route.ts`
    - GET: Historical price data for charts
    - Query params: productId, startDate, endDate
  - [ ] 4.9 Matches CRUD `app/api/admin/competitor-analysis/matches/route.ts`
    - GET: List all product matches
    - POST: Create manual match
  - [ ] 4.10 Single match `app/api/admin/competitor-analysis/matches/[id]/route.ts`
    - DELETE: Remove match

**Acceptance Criteria:**
- All endpoints follow Next.js 15 async params pattern
- Error responses use consistent format
- Admin authentication enforced
- Service role used for database queries

**Files to Create:**
- `app/api/admin/competitor-analysis/route.ts`
- `app/api/admin/competitor-analysis/providers/route.ts`
- `app/api/admin/competitor-analysis/providers/[id]/route.ts`
- `app/api/admin/competitor-analysis/scrape/route.ts`
- `app/api/admin/competitor-analysis/scrape/[id]/route.ts`
- `app/api/admin/competitor-analysis/products/route.ts`
- `app/api/admin/competitor-analysis/compare/route.ts`
- `app/api/admin/competitor-analysis/history/route.ts`
- `app/api/admin/competitor-analysis/matches/route.ts`
- `app/api/admin/competitor-analysis/matches/[id]/route.ts`

**Related User Story:** US-1, US-2, US-3, US-4, US-5

---

### Task Group 5: Admin Dashboard UI
**Assigned Implementer:** frontend-engineer
**Dependencies:** Task Group 4
**Priority:** High
**Story Points:** 8

- [ ] 5.0 Build competitor analysis admin pages
  - [ ] 5.1 Main dashboard `app/admin/competitor-analysis/page.tsx`
    - Summary stats cards (providers, products, last scrape)
    - Price alerts section (significant changes)
    - Quick actions (scrape all, export)
    - Recent scrape activity table
  - [ ] 5.2 Dashboard component `components/admin/competitor-analysis/CompetitorDashboard.tsx`
    - Stats grid with icons
    - Alert list with severity indicators
    - Action buttons
  - [ ] 5.3 Provider management `app/admin/competitor-analysis/providers/page.tsx`
    - Provider list with cards
    - Add/edit provider modal
    - Toggle active/inactive
    - Trigger scrape button
  - [ ] 5.4 Provider card `components/admin/competitor-analysis/ProviderCard.tsx`
    - Logo, name, type badge
    - Last scraped timestamp
    - Product count
    - Status indicator
    - Actions dropdown
  - [ ] 5.5 Provider detail `app/admin/competitor-analysis/[provider]/page.tsx`
    - Provider info header
    - Scraped products table
    - Scrape history log
    - Configuration panel
  - [ ] 5.6 Price comparison table `components/admin/competitor-analysis/PriceComparisonTable.tsx`
    - Your product column
    - Competitor columns (dynamic)
    - Price difference badges
    - Position indicators (competitive/above/below)
    - Sort and filter controls
  - [ ] 5.7 Add navigation entry
    - Update Sidebar.tsx
    - Update NavigationData.ts

**Acceptance Criteria:**
- Dashboard loads within 2 seconds
- Responsive design (mobile-friendly)
- Loading states for async data
- Error handling with user feedback

**Files to Create:**
- `app/admin/competitor-analysis/page.tsx`
- `app/admin/competitor-analysis/providers/page.tsx`
- `app/admin/competitor-analysis/[provider]/page.tsx`
- `components/admin/competitor-analysis/CompetitorDashboard.tsx`
- `components/admin/competitor-analysis/ProviderCard.tsx`
- `components/admin/competitor-analysis/PriceComparisonTable.tsx`

**Files to Modify:**
- `components/admin/layout/Sidebar.tsx`
- `components/navigation/NavigationData.ts`

**Related User Story:** US-4 (Price Comparison Dashboard)

---

### Task Group 6: Product Matching
**Assigned Implementer:** backend-engineer
**Dependencies:** Task Groups 1, 4
**Priority:** Medium
**Story Points:** 5

- [ ] 6.0 Build product matching system
  - [ ] 6.1 Create price matcher service `lib/competitor-analysis/price-matcher.ts`
    - autoMatchProducts(circletelProductId, circletelType): Find potential matches
    - calculateConfidence(product, competitor): 0-1 score
    - Matching criteria: data bundle, speed, price range, technology
  - [ ] 6.2 Create analysis engine `lib/competitor-analysis/analysis-engine.ts`
    - compareProducts(productId): Get all competitor prices
    - calculatePosition(yourPrice, competitorPrices): competitive/above/below
    - findOpportunities(): Products with margin upside
    - findRisks(): Products where overpriced
  - [ ] 6.3 Matching interface `app/admin/competitor-analysis/matches/page.tsx`
    - Unmatched products list
    - Search competitor products
    - Manual match creation
    - Match confidence display
  - [ ] 6.4 Matching component `components/admin/competitor-analysis/MatchingInterface.tsx`
    - Split view: CircleTel products | Competitor products
    - Drag-and-drop or click-to-match
    - Confidence override input
    - Bulk matching support

**Acceptance Criteria:**
- Auto-matching finds >70% of matches
- Confidence scores are meaningful
- Manual matching is intuitive
- Analysis provides actionable insights

**Files to Create:**
- `lib/competitor-analysis/price-matcher.ts`
- `lib/competitor-analysis/analysis-engine.ts`
- `app/admin/competitor-analysis/matches/page.tsx`
- `components/admin/competitor-analysis/MatchingInterface.tsx`

**Related User Story:** US-3 (Product Matching), US-6 (Market Intelligence)

---

### Task Group 7: Charts & Visualization
**Assigned Implementer:** frontend-engineer
**Dependencies:** Task Groups 4, 5
**Priority:** Medium
**Story Points:** 5

- [ ] 7.0 Build visualization components
  - [ ] 7.1 Price history chart `components/admin/competitor-analysis/PriceHistoryChart.tsx`
    - Line chart with Recharts
    - Multiple products overlay
    - Date range selector
    - Tooltip with details
  - [ ] 7.2 Market position chart `components/admin/competitor-analysis/MarketPositionChart.tsx`
    - Radar chart or bar chart
    - Your pricing vs market average
    - Per-provider breakdown
  - [ ] 7.3 Integrate charts into dashboard
    - Add to main dashboard page
    - Add to provider detail page
  - [ ] 7.4 Export functionality
    - Export comparison table to CSV
    - Export history data to Excel
    - PDF report generation (future)

**Acceptance Criteria:**
- Charts render within 1 second
- Interactive tooltips work
- Export produces valid files
- Responsive on mobile

**Files to Create:**
- `components/admin/competitor-analysis/PriceHistoryChart.tsx`
- `components/admin/competitor-analysis/MarketPositionChart.tsx`

**Files to Modify:**
- `app/admin/competitor-analysis/page.tsx` (add charts)
- `app/admin/competitor-analysis/[provider]/page.tsx` (add charts)

**Related User Story:** US-5 (Historical Trends & Alerts)

---

### Task Group 8: Automation & Alerts
**Assigned Implementer:** backend-engineer
**Dependencies:** Task Groups 1, 2, 3, 4
**Priority:** Low
**Story Points:** 3

- [ ] 8.0 Build automation system
  - [ ] 8.1 Price change detection
    - Compare current vs previous scrape
    - Flag changes >10%
    - Store in scrape log
  - [ ] 8.2 Alert service (future - optional)
    - Email notification template
    - Slack webhook integration
    - Weekly summary report
  - [ ] 8.3 Scheduled scraping (Vercel cron)
    - Create cron endpoint `/api/cron/competitor-scrape`
    - Configure vercel.json for weekly schedule
    - Handle timeout limits

**Acceptance Criteria:**
- Price changes detected automatically
- Alerts are actionable (not noisy)
- Cron job runs successfully

**Files to Create:**
- `app/api/cron/competitor-scrape/route.ts`

**Files to Modify:**
- `vercel.json` (add cron schedule)

**Related User Story:** US-5 (Historical Trends & Alerts)

---

## Implementation Order

```
Week 1:
├── Task Group 1: Database Foundation (5 pts) ──┐
├── Task Group 2: Firecrawl Integration (5 pts) ┼──▶ Foundation Complete
└── Task Group 3: Provider Scrapers (8 pts) ────┘

Week 2:
├── Task Group 4: API Layer (8 pts) ────────────▶ Backend Complete
└── Task Group 5: Admin Dashboard UI (8 pts) ───▶ Basic UI Complete

Week 3:
├── Task Group 6: Product Matching (5 pts) ─────▶ Core Features Complete
├── Task Group 7: Charts & Visualization (5 pts)
└── Task Group 8: Automation & Alerts (3 pts) ──▶ Full Module Complete
```

---

## Verification Checklist

### Before Starting
- [ ] FIRECRAWL_API_KEY added to environment
- [ ] Firecrawl SDK installed
- [ ] Database migration ready

### After Completion
- [ ] All database tables created
- [ ] MTN scraper working with live data
- [ ] At least 3 providers configured
- [ ] Dashboard accessible at /admin/competitor-analysis
- [ ] Navigation entry added
- [ ] Product matching functional
- [ ] Price history charts rendering
- [ ] No TypeScript errors (`npm run type-check`)
