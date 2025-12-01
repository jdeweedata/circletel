# Competitor Analysis Module

> **Status**: Planned  
> **Priority**: Medium  
> **Estimated Effort**: 16-18 hours  
> **Created**: December 2025

## Overview

Build a comprehensive competitor analysis system that tracks pricing across multiple South African telecoms providers. This gives CircleTel market intelligence for:

- **Pricing strategy** - Know where you stand vs competitors
- **Margin optimization** - Identify markup opportunities
- **Market positioning** - Spot gaps in competitor offerings
- **Sales enablement** - Arm sales team with competitive data

## Technology Stack

- **Firecrawl.dev** - Web scraping with JavaScript rendering support
- **Supabase** - Data storage and price history
- **Next.js API Routes** - Backend processing
- **React/Tailwind** - Admin UI

### Firecrawl Configuration

```env
FIRECRAWL_API_KEY=fc-b1d761084b974fd09e5f394180294d14
```

**Credits Available**: ~50,000 credits (as of Dec 2025)

---

## Target Competitors

### Mobile/Wireless Providers

| Provider | Website | Products | Priority |
|----------|---------|----------|----------|
| **MTN** | mtn.co.za | Mobile contracts, devices, data | High |
| **Vodacom** | vodacom.co.za | Mobile contracts, devices, data | High |
| **Telkom** | telkom.co.za | Mobile, fibre, LTE | Medium |
| **Cell C** | cellc.co.za | Mobile contracts, data | Low |
| **Rain** | rain.co.za | 5G, unlimited data | High |

### Fibre/ISP Providers

| Provider | Website | Products | Priority |
|----------|---------|----------|----------|
| **Afrihost** | afrihost.com | Fibre, LTE, hosting | High |
| **WebAfrica** | webafrica.co.za | Fibre, LTE | Medium |
| **Cool Ideas** | coolideas.co.za | Fibre | Medium |
| **Supersonic** | supersonic.co.za | Fibre, LTE | Medium |
| **RSAWEB** | rsaweb.co.za | Fibre, LTE | Low |
| **Herotel** | herotel.com | Wireless, fibre | Low |

### Business-Focused

| Provider | Website | Products | Priority |
|----------|---------|----------|----------|
| **BCX** | bcx.co.za | Enterprise solutions | Low |
| **Internet Solutions** | is.co.za | Business connectivity | Low |
| **SEACOM** | seacom.com | Enterprise fibre | Low |

---

## Confirmed Target URLs

### MTN (Verified Dec 2025)

| URL | Description |
|-----|-------------|
| `https://www.mtn.co.za/shop/deals/devices/phones` | All phone deals with contracts |
| `https://www.mtn.co.za/shop/deals/contracts` | Contract plans overview |
| `https://www.mtn.co.za/shop/deals/contracts/data-only` | Data-only contracts |
| `https://www.mtn.co.za/shop/deals/promotions` | Current promotions |
| `https://www.mtn.co.za/shop/deals/devices` | All device deals |
| `https://www.mtn.co.za/business/` | Business homepage |
| `https://www.mtn.co.za/business/shop/devices` | Business device deals |

**Note**: MTN uses Angular with SSR - requires JavaScript rendering (Firecrawl handles this).

### URL Patterns

Individual device deals follow this pattern:
```
https://www.mtn.co.za/shop/deals/device/contract/{brand}/{model}/{sku}
```

Examples:
- `https://www.mtn.co.za/shop/deals/device/contract/samsung/galaxy-a36-5g-128gb/1-OCCONYF`
- `https://www.mtn.co.za/shop/deals/device/contract/huawei/nova-13i-256gb/1-NHOCDD0`

---

## Module Architecture

### File Structure

```
lib/
  competitor-analysis/
    providers/
      base-provider.ts       # Abstract base class
      mtn-provider.ts        # MTN scraper
      vodacom-provider.ts    # Vodacom scraper
      telkom-provider.ts     # Telkom scraper
      rain-provider.ts       # Rain scraper
      afrihost-provider.ts   # Afrihost scraper
      webafrica-provider.ts  # WebAfrica scraper
      supersonic-provider.ts # Supersonic scraper
      index.ts               # Provider registry
    
    firecrawl-client.ts      # Firecrawl wrapper
    price-matcher.ts         # Match to your products
    analysis-engine.ts       # Comparison logic
    types.ts                 # Shared types

app/
  admin/
    competitor-analysis/
      page.tsx               # Main dashboard
      providers/
        page.tsx             # Provider management
      matches/
        page.tsx             # Product matching
      [provider]/
        page.tsx             # Provider-specific view
      
  api/admin/
    competitor-analysis/
      route.ts               # List analyses
      scrape/route.ts        # Trigger scrape job
      providers/route.ts     # List/manage providers
      compare/route.ts       # Run comparison
      matches/route.ts       # Product matches

components/
  admin/
    competitor-analysis/
      CompetitorDashboard.tsx
      PriceComparisonTable.tsx
      ProviderCard.tsx
      MatchingInterface.tsx
      PriceHistoryChart.tsx
      MarketPositionChart.tsx

supabase/migrations/
  XXXXXX_create_competitor_analysis.sql
```

---

## Database Schema

```sql
-- ============================================
-- COMPETITOR ANALYSIS MODULE
-- ============================================

-- Competitor providers registry
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

-- Scraped competitor products
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

-- Price history for tracking changes
CREATE TABLE competitor_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_product_id UUID REFERENCES competitor_products(id) ON DELETE CASCADE,
  monthly_price DECIMAL(10,2),
  once_off_price DECIMAL(10,2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Your products matched to competitors
CREATE TABLE product_competitor_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Your product (polymorphic - can match different product types)
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

-- Scrape job logs
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

-- ============================================
-- VIEWS
-- ============================================

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

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_competitor_products_provider ON competitor_products(provider_id);
CREATE INDEX idx_competitor_products_current ON competitor_products(is_current) WHERE is_current = true;
CREATE INDEX idx_competitor_products_type ON competitor_products(product_type);
CREATE INDEX idx_product_matches_product ON product_competitor_matches(product_type, product_id);
CREATE INDEX idx_scrape_logs_provider ON competitor_scrape_logs(provider_id);

-- ============================================
-- RLS POLICIES
-- ============================================

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

-- ============================================
-- SEED DATA - Initial Providers
-- ============================================

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

## Admin UI Features

### 1. Dashboard Overview (`/admin/competitor-analysis`)

- **Market position chart** - Your pricing vs competitors (radar/bar chart)
- **Price alerts** - When competitors change prices significantly
- **Opportunity finder** - Products where you can increase margin
- **Risk alerts** - Where you're priced higher than market
- **Recent scrapes** - Last scrape status per provider

### 2. Provider Management (`/admin/competitor-analysis/providers`)

- Add/edit competitor providers
- Configure scrape URLs
- Set scrape frequency (daily/weekly/manual)
- View scrape history and status
- Enable/disable providers

### 3. Product Matching (`/admin/competitor-analysis/matches`)

- Auto-match your products to competitors (fuzzy matching)
- Manual matching interface with search
- Match confidence scores
- Bulk matching tools

### 4. Price Comparison Table

| Your Product | Your Price | MTN | Vodacom | Telkom | Rain | Position |
|--------------|------------|-----|---------|--------|------|----------|
| 50GB LTE | R399 | R449 | R429 | R399 | R479 | ✅ Competitive |
| 100GB 5G | R599 | R649 | R599 | - | R549 | ⚠️ Above Rain |
| Unlimited 5G | R999 | R1099 | R999 | - | R849 | ❌ Overpriced |

### 5. Historical Trends

- Price change tracking over time (line charts)
- Competitor promotion detection
- Market trend analysis
- Export to CSV/Excel

---

## Implementation Phases

### Phase 1: Foundation (4 hours)
- [ ] Install Firecrawl SDK (`npm install @mendable/firecrawl-js`)
- [ ] Add `FIRECRAWL_API_KEY` to environment
- [ ] Create database migration
- [ ] Build Firecrawl client wrapper (`lib/competitor-analysis/firecrawl-client.ts`)
- [ ] Create base provider class (`lib/competitor-analysis/providers/base-provider.ts`)
- [ ] Create types (`lib/competitor-analysis/types.ts`)

### Phase 2: MTN Provider (2 hours)
- [ ] Implement MTN scraper with Firecrawl Extract
- [ ] Define extraction schema for MTN deal structure
- [ ] Price extraction and normalization
- [ ] Match scraped products to dealer products
- [ ] Test with live data

### Phase 3: Additional Providers (1-2 hours each)
- [ ] Vodacom provider
- [ ] Telkom provider  
- [ ] Rain provider
- [ ] Afrihost provider (fibre)
- [ ] WebAfrica/Supersonic providers

### Phase 4: Admin UI (4 hours)
- [ ] Dashboard with summary stats and charts
- [ ] Provider management page
- [ ] Product matching interface
- [ ] Price comparison tables
- [ ] Historical trend charts

### Phase 5: Automation (2 hours)
- [ ] Scheduled scraping (Vercel cron or external)
- [ ] Price change detection
- [ ] Email/Slack notifications for significant changes
- [ ] Weekly market report generation

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/competitor-analysis` | Dashboard stats |
| GET | `/api/admin/competitor-analysis/providers` | List providers |
| POST | `/api/admin/competitor-analysis/providers` | Add provider |
| PUT | `/api/admin/competitor-analysis/providers/[id]` | Update provider |
| POST | `/api/admin/competitor-analysis/scrape` | Trigger scrape |
| GET | `/api/admin/competitor-analysis/scrape/[id]` | Scrape status |
| GET | `/api/admin/competitor-analysis/products` | Scraped products |
| GET | `/api/admin/competitor-analysis/compare` | Price comparison |
| GET | `/api/admin/competitor-analysis/matches` | Product matches |
| POST | `/api/admin/competitor-analysis/matches` | Create match |
| DELETE | `/api/admin/competitor-analysis/matches/[id]` | Remove match |
| GET | `/api/admin/competitor-analysis/history` | Price history |

---

## Firecrawl Usage Estimates

| Action | Credits per Call | Frequency | Monthly Credits |
|--------|------------------|-----------|-----------------|
| Scrape MTN deals page | 1 | Weekly | 4 |
| Scrape MTN contracts | 1 | Weekly | 4 |
| Extract product details | 15 (Extract) | Per product | ~200 |
| Scrape other providers | 1 each | Weekly | 28 |
| **Total Estimated** | | | **~250/month** |

With 50,000 credits available, this is sustainable for years.

---

## Success Metrics

1. **Coverage**: Track pricing from 5+ competitors
2. **Freshness**: Data no older than 7 days
3. **Match Rate**: 80%+ of your products matched to competitors
4. **Actionable Insights**: Identify 10+ margin opportunities per month
5. **Time Saved**: Reduce manual competitor research by 90%

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Website structure changes | Abstract provider classes, easy to update |
| Rate limiting | Respect robots.txt, use delays, cache results |
| Incorrect price extraction | Manual review queue, confidence scores |
| Legal concerns | Only scrape public pricing, no login required |
| Credit exhaustion | Monitor usage, set alerts at 80% |

---

## Future Enhancements

1. **AI-powered matching** - Use embeddings for better product matching
2. **Competitor alerts** - Real-time notifications for price drops
3. **Market reports** - Automated weekly/monthly PDF reports
4. **API for sales team** - Mobile-friendly competitor lookup
5. **Promotion tracking** - Detect and track limited-time offers
6. **Geographic pricing** - Track regional price differences

---

## Related Documentation

- [MTN Dealer Products](../admin/mtn-dealer-products.md)
- [Product Management](../admin/products.md)
- [Firecrawl SDK Docs](https://docs.firecrawl.dev/sdks/node)

---

## Changelog

| Date | Change |
|------|--------|
| Dec 2025 | Initial plan created |
