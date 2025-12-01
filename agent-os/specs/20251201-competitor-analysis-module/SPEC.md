# Specification: Competitor Analysis Module

## 1. Executive Summary

### Goal

Build a comprehensive competitor analysis system that tracks pricing across South African telecom providers (MTN, Vodacom, Telkom, Rain, Afrihost, etc.). This system provides CircleTel with market intelligence for pricing strategy, margin optimization, and sales enablement using Firecrawl.dev for reliable web scraping.

### Success Criteria

**Business Metrics (30 days post-launch)**:
- Competitor coverage: 5+ providers actively tracked
- Data freshness: All pricing data <7 days old
- Product match rate: >80% of CircleTel products matched to competitors
- Actionable insights: 10+ margin opportunities identified per month
- Time savings: 90% reduction in manual competitor research

**Technical Metrics**:
- Scrape success rate: >95%
- API response time: <2s for comparison queries
- Data accuracy: >98% (verified by spot checks)
- Credit efficiency: <300 Firecrawl credits/month

**Cost Efficiency**:
- Firecrawl: ~250 credits/month (50,000 available)
- Zero manual data entry for tracked providers
- Automated price change detection

---

## 2. User Stories

### Primary Stories

**US-1: Competitor Provider Management** (5 pts)
- Admin adds/configures competitor providers with scrape URLs
- System stores provider metadata (name, logo, type, URLs)
- Enable/disable providers without data loss
- Configure scrape frequency (daily/weekly/manual)

**US-2: Automated Price Scraping** (8 pts)
- Trigger scrape jobs manually or on schedule
- Firecrawl extracts product data from provider websites
- System normalizes pricing (VAT handling, contract terms)
- Store historical prices for trend analysis
- Handle JavaScript-rendered sites (MTN Angular, etc.)

**US-3: Product Matching** (5 pts)
- Auto-match CircleTel products to competitor equivalents
- Manual matching interface for edge cases
- Match confidence scoring (0-100%)
- Support multiple product types (MTN dealer, fibre, LTE)

**US-4: Price Comparison Dashboard** (8 pts)
- Visual comparison table: CircleTel vs competitors
- Market position indicators (competitive/above/below)
- Price difference calculations (absolute and percentage)
- Filter by product type, provider, date range

**US-5: Historical Trends & Alerts** (5 pts)
- Price history charts (line graphs over time)
- Detect significant price changes (>10%)
- Email/Slack alerts for competitor price drops
- Export data to CSV/Excel

**US-6: Market Intelligence Insights** (3 pts)
- Opportunity finder: Products where CircleTel can increase margin
- Risk alerts: Products where CircleTel is overpriced
- Market position radar/bar chart
- Provider summary statistics

### Technical Stories

**TS-1: Firecrawl Client Wrapper** (3 pts)
- Typed client for Firecrawl API
- Rate limiting and retry logic
- Credit usage tracking
- Error handling for anti-bot measures

**TS-2: Database Schema** (5 pts)
- Create 5 tables with proper constraints
- RLS policies (admin-only access via service role)
- Views for analysis queries
- Indexes for performance

**TS-3: Provider Abstraction** (5 pts)
- Abstract base class for scrapers
- Provider-specific implementations (MTN, Vodacom, etc.)
- Schema definitions for data extraction
- Normalization logic per provider

---

## 3. System Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       COMPETITOR ANALYSIS SYSTEM                         │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │ Admin Trigger│ ────────────────────────────────────────────┐
    │ (Manual/Cron)│                                              │
    └──────────────┘                                              ▼
                                                        ┌─────────────────┐
                                                        │  Scrape Job API │
                                                        │  /api/scrape    │
                                                        └────────┬────────┘
                                                                 │
                    ┌────────────────────────────────────────────┼────────────────────────────────────────────┐
                    │                                            ▼                                            │
                    │                               ┌─────────────────────────┐                               │
                    │                               │   Provider Registry     │                               │
                    │                               │   (MTN, Vodacom, etc.)  │                               │
                    │                               └───────────┬─────────────┘                               │
                    │                                           │                                             │
        ┌───────────┼───────────────────────────────────────────┼───────────────────────────────────────────┐ │
        │           ▼                   ▼                       ▼                   ▼                       │ │
        │   ┌─────────────┐     ┌─────────────┐         ┌─────────────┐     ┌─────────────┐                 │ │
        │   │MTN Provider │     │Vodacom Prov.│         │Rain Provider│     │Afrihost Prov│                 │ │
        │   └──────┬──────┘     └──────┬──────┘         └──────┬──────┘     └──────┬──────┘                 │ │
        │          │                   │                       │                   │                         │ │
        │          ▼                   ▼                       ▼                   ▼                         │ │
        │   ┌─────────────────────────────────────────────────────────────────────────────────┐             │ │
        │   │                           FIRECRAWL.DEV API                                      │             │ │
        │   │   • JavaScript Rendering • Extract with Schema • Rate Limiting                  │             │ │
        │   └────────────────────────────────────────────────────────────────────────────────┘             │ │
        │                                            │                                                       │ │
        │                                            ▼                                                       │ │
        │                               ┌─────────────────────────┐                                         │ │
        │                               │   Data Normalization    │                                         │ │
        │                               │   • Price extraction    │                                         │ │
        │                               │   • VAT handling        │                                         │ │
        │                               │   • Contract parsing    │                                         │ │
        │                               └───────────┬─────────────┘                                         │ │
        └───────────────────────────────────────────┼───────────────────────────────────────────────────────┘ │
                                                    │                                                         │
                                                    ▼                                                         │
                                        ┌─────────────────────────┐                                           │
                                        │      SUPABASE DB        │                                           │
                                        │  ┌─────────────────────┐│                                           │
                                        │  │competitor_providers ││                                           │
                                        │  │competitor_products  ││                                           │
                                        │  │price_history        ││                                           │
                                        │  │product_matches      ││                                           │
                                        │  │scrape_logs          ││                                           │
                                        │  └─────────────────────┘│                                           │
                                        └───────────┬─────────────┘                                           │
                                                    │                                                         │
                    ┌───────────────────────────────┴───────────────────────────────┐                         │
                    ▼                               ▼                               ▼                         │
        ┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────────┐               │
        │  Comparison Engine  │         │   Match Engine      │         │   Alert Engine      │               │
        │  • Price analysis   │         │   • Auto-match      │         │   • Change detect   │               │
        │  • Position calc    │         │   • Confidence      │         │   • Notifications   │               │
        └──────────┬──────────┘         └──────────┬──────────┘         └──────────┬──────────┘               │
                   │                               │                               │                           │
                   └───────────────────────────────┴───────────────────────────────┘                           │
                                                   │                                                           │
                                                   ▼                                                           │
                                        ┌─────────────────────────┐                                           │
                                        │     ADMIN DASHBOARD     │ ◄─────────────────────────────────────────┘
                                        │  ┌─────────────────────┐│
                                        │  │ Price Comparison    ││
                                        │  │ Provider Management ││
                                        │  │ Product Matching    ││
                                        │  │ Historical Charts   ││
                                        │  │ Opportunity Finder  ││
                                        │  └─────────────────────┘│
                                        └─────────────────────────┘
```

### Integration Points

| System | Integration | Purpose |
|--------|-------------|---------|
| Firecrawl.dev | REST API | Web scraping with JS rendering |
| Supabase | PostgreSQL + RLS | Data storage and access control |
| Next.js | API Routes | Backend processing |
| React | Admin UI | Dashboard and management |
| Recharts | Charts | Price history visualization |
| Resend (future) | Email API | Price change alerts |

---

## 4. Database Schema

### Table: competitor_providers

```sql
CREATE TABLE competitor_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- "MTN", "Vodacom", etc.
  slug TEXT UNIQUE NOT NULL,             -- "mtn", "vodacom"
  website TEXT NOT NULL,
  logo_url TEXT,
  provider_type TEXT NOT NULL,           -- "mobile", "fibre", "both"
  scrape_urls JSONB DEFAULT '[]',        -- URLs to scrape
  scrape_config JSONB DEFAULT '{}',      -- Provider-specific config
  is_active BOOLEAN DEFAULT true,
  last_scraped_at TIMESTAMPTZ,
  scrape_frequency TEXT DEFAULT 'weekly', -- "daily", "weekly", "manual"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: competitor_products

```sql
CREATE TABLE competitor_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES competitor_providers(id) ON DELETE CASCADE,
  external_id TEXT,                      -- Their product ID/SKU
  product_name TEXT NOT NULL,
  product_type TEXT,                     -- "mobile_contract", "fibre", "lte", "device"

  -- Pricing
  monthly_price DECIMAL(10,2),
  once_off_price DECIMAL(10,2),
  price_includes_vat BOOLEAN DEFAULT true,

  -- Product details
  contract_term INTEGER,                 -- Months
  data_bundle TEXT,                      -- "50GB", "Unlimited"
  data_gb DECIMAL(10,2),                 -- Parsed numeric value
  speed_mbps INTEGER,                    -- For fibre/LTE
  device_name TEXT,                      -- If bundled with device
  technology TEXT,                       -- "LTE", "5G", "Fibre"

  -- Metadata
  source_url TEXT,
  raw_data JSONB,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  is_current BOOLEAN DEFAULT true,       -- Latest version

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: competitor_price_history

```sql
CREATE TABLE competitor_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_product_id UUID REFERENCES competitor_products(id) ON DELETE CASCADE,
  monthly_price DECIMAL(10,2),
  once_off_price DECIMAL(10,2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: product_competitor_matches

```sql
CREATE TABLE product_competitor_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Your product (polymorphic)
  product_type TEXT NOT NULL,            -- "mtn_dealer", "fibre", "lte", "product"
  product_id UUID NOT NULL,

  -- Competitor product
  competitor_product_id UUID REFERENCES competitor_products(id) ON DELETE CASCADE,

  -- Match quality
  match_confidence DECIMAL(3,2),         -- 0.00 to 1.00
  match_method TEXT,                     -- "auto", "manual"
  matched_by UUID REFERENCES auth.users(id),
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(product_type, product_id, competitor_product_id)
);
```

### Table: competitor_scrape_logs

```sql
CREATE TABLE competitor_scrape_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES competitor_providers(id) ON DELETE CASCADE,
  status TEXT NOT NULL,                  -- "pending", "running", "completed", "failed"
  products_found INTEGER DEFAULT 0,
  products_updated INTEGER DEFAULT 0,
  products_new INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  triggered_by UUID REFERENCES auth.users(id),
  trigger_type TEXT DEFAULT 'manual'     -- "manual", "scheduled"
);
```

### Views

```sql
-- Comparison analysis results
CREATE VIEW v_competitor_price_comparison AS
SELECT
  pcm.product_type,
  pcm.product_id,
  cp.provider_id,
  prov.name AS competitor_name,
  prov.slug AS competitor_slug,
  prov.logo_url AS competitor_logo,
  cp.product_name AS competitor_product,
  cp.monthly_price AS competitor_price,
  cp.once_off_price AS competitor_once_off,
  cp.data_bundle AS competitor_data,
  cp.data_gb AS competitor_data_gb,
  cp.contract_term AS competitor_term,
  cp.technology AS competitor_technology,
  pcm.match_confidence,
  cp.scraped_at,
  cp.source_url
FROM product_competitor_matches pcm
JOIN competitor_products cp ON pcm.competitor_product_id = cp.id
JOIN competitor_providers prov ON cp.provider_id = prov.id
WHERE cp.is_current = true;

-- Provider summary stats
CREATE VIEW v_competitor_provider_stats AS
SELECT
  p.id,
  p.name,
  p.slug,
  p.provider_type,
  p.is_active,
  p.last_scraped_at,
  COUNT(cp.id) AS total_products,
  COUNT(CASE WHEN cp.is_current THEN 1 END) AS current_products,
  AVG(cp.monthly_price) AS avg_monthly_price,
  MIN(cp.monthly_price) AS min_monthly_price,
  MAX(cp.monthly_price) AS max_monthly_price
FROM competitor_providers p
LEFT JOIN competitor_products cp ON p.id = cp.provider_id
GROUP BY p.id;
```

### Indexes

```sql
CREATE INDEX idx_competitor_products_provider ON competitor_products(provider_id);
CREATE INDEX idx_competitor_products_current ON competitor_products(is_current) WHERE is_current = true;
CREATE INDEX idx_competitor_products_type ON competitor_products(product_type);
CREATE INDEX idx_product_matches_product ON product_competitor_matches(product_type, product_id);
CREATE INDEX idx_scrape_logs_provider ON competitor_scrape_logs(provider_id);
CREATE INDEX idx_price_history_product ON competitor_price_history(competitor_product_id);
CREATE INDEX idx_price_history_date ON competitor_price_history(recorded_at);
```

### RLS Policies

```sql
ALTER TABLE competitor_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_competitor_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_scrape_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only access (use service role for API routes)
CREATE POLICY "Admin access only" ON competitor_providers FOR ALL USING (false);
CREATE POLICY "Admin access only" ON competitor_products FOR ALL USING (false);
CREATE POLICY "Admin access only" ON competitor_price_history FOR ALL USING (false);
CREATE POLICY "Admin access only" ON product_competitor_matches FOR ALL USING (false);
CREATE POLICY "Admin access only" ON competitor_scrape_logs FOR ALL USING (false);
```

### Seed Data

```sql
INSERT INTO competitor_providers (name, slug, website, provider_type, scrape_urls, is_active) VALUES
('MTN', 'mtn', 'https://www.mtn.co.za', 'mobile',
 '["https://www.mtn.co.za/shop/deals/devices/phones", "https://www.mtn.co.za/shop/deals/contracts", "https://www.mtn.co.za/business/shop/devices"]'::jsonb,
 true),
('Vodacom', 'vodacom', 'https://www.vodacom.co.za', 'mobile', '[]'::jsonb, false),
('Telkom', 'telkom', 'https://www.telkom.co.za', 'both', '[]'::jsonb, false),
('Rain', 'rain', 'https://www.rain.co.za', 'mobile', '[]'::jsonb, false),
('Afrihost', 'afrihost', 'https://www.afrihost.com', 'fibre', '[]'::jsonb, false),
('WebAfrica', 'webafrica', 'https://www.webafrica.co.za', 'fibre', '[]'::jsonb, false),
('Supersonic', 'supersonic', 'https://www.supersonic.co.za', 'fibre', '[]'::jsonb, false),
('Cool Ideas', 'coolideas', 'https://www.coolideas.co.za', 'fibre', '[]'::jsonb, false);
```

---

## 5. API Endpoints

### Dashboard & Stats

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/competitor-analysis` | Dashboard stats (summary, alerts, opportunities) |

### Provider Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/competitor-analysis/providers` | List all providers with stats |
| POST | `/api/admin/competitor-analysis/providers` | Add new provider |
| GET | `/api/admin/competitor-analysis/providers/[id]` | Get provider details |
| PUT | `/api/admin/competitor-analysis/providers/[id]` | Update provider config |
| DELETE | `/api/admin/competitor-analysis/providers/[id]` | Delete provider |

### Scraping

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/competitor-analysis/scrape` | Trigger scrape job |
| GET | `/api/admin/competitor-analysis/scrape/[id]` | Get scrape job status |

### Products & Comparison

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/competitor-analysis/products` | List scraped products |
| GET | `/api/admin/competitor-analysis/compare` | Price comparison data |
| GET | `/api/admin/competitor-analysis/history` | Price history data |

### Product Matching

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/competitor-analysis/matches` | List product matches |
| POST | `/api/admin/competitor-analysis/matches` | Create manual match |
| DELETE | `/api/admin/competitor-analysis/matches/[id]` | Remove match |

---

## 6. Risk Assessment

### Risk Level: Medium

### Risk Factors

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Website structure changes | High | Medium | Abstract provider classes, easy to update |
| Rate limiting/blocking | Medium | High | Respect robots.txt, use delays, rotate User-Agent |
| Incorrect price extraction | Medium | Medium | Manual review queue, confidence scores |
| Legal concerns | Low | High | Only scrape public pricing, no login required |
| Credit exhaustion | Low | Medium | Monitor usage, set alerts at 80% |
| Anti-bot detection | Medium | Medium | Firecrawl handles JS rendering, use proper headers |

### Mitigations

1. **Provider Abstraction**: Each provider has its own scraper class, easy to update when sites change
2. **Confidence Scoring**: Match confidence helps identify uncertain data for review
3. **Audit Trail**: All scrapes logged with status and error messages
4. **Gradual Rollout**: Start with MTN only, add providers incrementally
5. **Credit Monitoring**: Track Firecrawl usage, alert before exhaustion

---

## 7. Testing Strategy

### Unit Tests

- Firecrawl client: API calls, error handling, retry logic
- Provider scrapers: Data extraction, normalization
- Price matcher: Matching algorithm, confidence calculation
- Analysis engine: Comparison logic, position calculation

### Integration Tests

- Database operations: CRUD for all tables
- API endpoints: Request/response validation
- Scrape flow: End-to-end scrape job execution

### E2E Tests (Playwright)

- Admin dashboard: Load, filter, export
- Provider management: Add, edit, delete
- Product matching: Manual match creation
- Scrape trigger: Job execution and status

### Test Coverage Target

- Unit tests: 80%+ coverage for lib/ code
- Integration tests: All API endpoints
- E2E tests: Critical user flows

---

## 8. Implementation Phases

### Phase 1: Foundation (4 hours)
- Install Firecrawl SDK
- Create database migration
- Build Firecrawl client wrapper
- Create base provider class
- Define TypeScript types

### Phase 2: MTN Provider (2 hours)
- Implement MTN-specific scraper
- Define extraction schema
- Price normalization
- Test with live data

### Phase 3: Additional Providers (4 hours)
- Vodacom provider
- Telkom provider
- Rain provider
- Afrihost provider

### Phase 4: Admin UI (4 hours)
- Dashboard with summary stats
- Provider management page
- Product matching interface
- Price comparison tables

### Phase 5: Automation (2 hours)
- Scheduled scraping (Vercel cron)
- Price change detection
- Alert notifications
- Export functionality

---

## 9. Environment Variables

```env
# Required
FIRECRAWL_API_KEY=fc-b1d761084b974fd09e5f394180294d14

# Optional (for alerts)
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
```

---

## 10. Related Documentation

- [Feature Specification](../../docs/features/competitor-analysis-module.md)
- [Firecrawl SDK Docs](https://docs.firecrawl.dev/sdks/node)
- [System Overview](../../docs/architecture/SYSTEM_OVERVIEW.md)
- [MTN Dealer Products](../../docs/admin/mtn-dealer-products.md)
