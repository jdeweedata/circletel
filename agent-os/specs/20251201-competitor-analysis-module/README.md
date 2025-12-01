# Competitor Analysis Module

**Spec ID:** 20251201-competitor-analysis-module
**Status:** Ready for Implementation
**Priority:** Medium
**Total Story Points:** 47
**Estimated Effort:** 16-18 hours

---

## Quick Summary

Build a comprehensive competitor analysis system that tracks pricing across South African telecom providers using Firecrawl.dev for web scraping. Provides market intelligence for pricing strategy, margin optimization, and sales enablement.

---

## Key Features

1. **Web Scraping Infrastructure** - Firecrawl.dev integration with provider-specific scrapers
2. **Price Tracking** - Track competitor prices with historical data
3. **Product Matching** - Match CircleTel products to competitor offerings
4. **Admin Dashboard** - Visual analytics, comparison tables, and alerts
5. **Automation** - Scheduled scraping with change detection

---

## Files to Create

### Backend Services (lib/)
- `lib/competitor-analysis/firecrawl-client.ts` - Firecrawl API wrapper
- `lib/competitor-analysis/types.ts` - TypeScript types
- `lib/competitor-analysis/analysis-engine.ts` - Comparison logic
- `lib/competitor-analysis/price-matcher.ts` - Product matching service
- `lib/competitor-analysis/providers/base-provider.ts` - Abstract provider class
- `lib/competitor-analysis/providers/mtn-provider.ts` - MTN scraper
- `lib/competitor-analysis/providers/vodacom-provider.ts` - Vodacom scraper
- `lib/competitor-analysis/providers/telkom-provider.ts` - Telkom scraper
- `lib/competitor-analysis/providers/rain-provider.ts` - Rain scraper
- `lib/competitor-analysis/providers/afrihost-provider.ts` - Afrihost scraper
- `lib/competitor-analysis/providers/index.ts` - Provider registry

### API Routes (app/api/)
- `app/api/admin/competitor-analysis/route.ts` - Dashboard stats
- `app/api/admin/competitor-analysis/providers/route.ts` - Provider CRUD
- `app/api/admin/competitor-analysis/providers/[id]/route.ts` - Single provider
- `app/api/admin/competitor-analysis/scrape/route.ts` - Trigger scrape
- `app/api/admin/competitor-analysis/scrape/[id]/route.ts` - Scrape status
- `app/api/admin/competitor-analysis/products/route.ts` - Scraped products
- `app/api/admin/competitor-analysis/compare/route.ts` - Price comparison
- `app/api/admin/competitor-analysis/matches/route.ts` - Product matches
- `app/api/admin/competitor-analysis/matches/[id]/route.ts` - Single match
- `app/api/admin/competitor-analysis/history/route.ts` - Price history

### Frontend (app/admin/)
- `app/admin/competitor-analysis/page.tsx` - Main dashboard
- `app/admin/competitor-analysis/providers/page.tsx` - Provider management
- `app/admin/competitor-analysis/matches/page.tsx` - Product matching
- `app/admin/competitor-analysis/[provider]/page.tsx` - Provider detail

### Components (components/admin/)
- `components/admin/competitor-analysis/CompetitorDashboard.tsx`
- `components/admin/competitor-analysis/PriceComparisonTable.tsx`
- `components/admin/competitor-analysis/ProviderCard.tsx`
- `components/admin/competitor-analysis/MatchingInterface.tsx`
- `components/admin/competitor-analysis/PriceHistoryChart.tsx`
- `components/admin/competitor-analysis/MarketPositionChart.tsx`

### Database
- `supabase/migrations/20251201XXXXXX_create_competitor_analysis.sql`

---

## Files to Modify

- `components/admin/layout/Sidebar.tsx` - Add navigation item
- `components/navigation/NavigationData.ts` - Add menu entry
- `package.json` - Add @mendable/firecrawl-js dependency

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `competitor_providers` | Provider registry with scrape config |
| `competitor_products` | Scraped product data |
| `competitor_price_history` | Historical price tracking |
| `product_competitor_matches` | CircleTel to competitor mapping |
| `competitor_scrape_logs` | Scrape job audit trail |

---

## Task Groups

| Group | Description | Points | Implementer |
|-------|-------------|--------|-------------|
| 1 | Database Foundation | 5 | database-engineer |
| 2 | Firecrawl Integration | 5 | backend-engineer |
| 3 | Provider Scrapers | 8 | backend-engineer |
| 4 | API Layer | 8 | backend-engineer |
| 5 | Admin Dashboard UI | 8 | frontend-engineer |
| 6 | Product Matching | 5 | backend-engineer |
| 7 | Charts & Visualization | 5 | frontend-engineer |
| 8 | Automation & Alerts | 3 | backend-engineer |

---

## Quick Start

```bash
# 1. Install Firecrawl SDK
npm install @mendable/firecrawl-js

# 2. Add environment variable
echo "FIRECRAWL_API_KEY=fc-b1d761084b974fd09e5f394180294d14" >> .env.local

# 3. Run database migration
npx supabase migration new create_competitor_analysis

# 4. Start implementation with Task Group 1
```

---

## Success Metrics

- Track pricing from 5+ competitors
- Data freshness: <7 days old
- 80%+ product match rate
- 10+ margin opportunities identified monthly
- 90% reduction in manual research time

---

## Related Documentation

- [Feature Specification](./SPEC.md)
- [Task Breakdown](./TASKS.md)
- [Progress Tracking](./PROGRESS.md)
- [Architecture](./architecture.md)
- [Original Feature Doc](../../docs/features/competitor-analysis-module.md)
