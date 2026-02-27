# Marketing Platform - Remaining Phases

**Status**: Phases 1-2 Complete | Phases 3-5 Remaining
**Last Updated**: 2026-02-27

---

## Completed

### Phase 1: Foundation (Weeks 1-2) ✅
- Promotions Admin UI at `/admin/marketing/promotions`
- Marketing dashboard shell
- Promotion service and API

### Phase 2: Ambassador Portal & Partner Marketing (Weeks 3-5) ✅
- Ambassador portal at `/ambassadors` (7 pages)
- Ambassador authentication with tier system
- Attribution tracking service
- Short tracking URLs (`/t/[code]`)
- Marketing asset library with admin CRUD
- Partner marketing materials section

**Commit**: `88daeb3` | **PR**: #417

---

## Remaining Phases

### Phase 3: AI Creative (Weeks 6-7)

**Goal**: AI-powered marketing asset generation.

**Deliverables**:
- [ ] Template management UI
- [ ] Recraft API integration for image generation
- [ ] AI copy generation for marketing
- [ ] Brand consistency validation

**Critical Files**:
- Create: `lib/marketing/ai-image-service.ts` (Recraft API)
- Create: `app/admin/marketing/assets/templates/page.tsx`
- Extend: `app/api/admin/cms/generate/` for marketing copy

**External Integration**:
- Recraft API: `POST /v1/images/generate`, `POST /v1/images/removeBackground`
- Environment: `RECRAFT_API_KEY`

**Reuse**:
- `lib/cms/block-registry.ts` - Block patterns for templates
- Existing CMS AI generation at `/api/admin/cms/generate`

**Estimated Effort**: 50-70 hours

---

### Phase 4: Social Media (Weeks 8-10)

**Goal**: Multi-platform content scheduling and campaign management.

**Deliverables**:
- [ ] OAuth flows for Meta, LinkedIn, X
- [ ] Content scheduler with calendar UI
- [ ] Campaign builder (links promotions + pages + social)
- [ ] Post analytics

**Critical Files**:
- Create: `lib/marketing/social-service.ts`
- Create: `app/admin/marketing/social/` (accounts, schedule, calendar)
- Create: `app/admin/marketing/campaigns/page.tsx`
- Create: `app/api/admin/marketing/social/*/route.ts`

**New Tables**:
```sql
CREATE TABLE social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'twitter')),
  account_id TEXT NOT NULL,
  account_name TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  page_id TEXT, -- For Facebook/Instagram pages
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platforms TEXT[] NOT NULL, -- Array of platforms to post to
  content TEXT NOT NULL,
  media_urls TEXT[], -- Array of image/video URLs
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'failed')),
  campaign_id UUID REFERENCES campaigns(id),
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE social_post_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  budget DECIMAL(10, 2),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE campaign_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  component_type TEXT NOT NULL CHECK (component_type IN ('promotion', 'page', 'social_post', 'email')),
  component_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**External APIs**:
- Meta Graph API v19 (Facebook + Instagram)
- LinkedIn Marketing API
- X API v2

**Environment Variables**:
```env
META_APP_ID=<id>
META_APP_SECRET=<secret>
LINKEDIN_CLIENT_ID=<id>
LINKEDIN_CLIENT_SECRET=<secret>
X_CLIENT_ID=<id>
X_CLIENT_SECRET=<secret>
```

**Estimated Effort**: 80-100 hours

---

### Phase 5: Analytics (Weeks 11-12)

**Goal**: Complete attribution and ROI visibility.

**Deliverables**:
- [ ] Marketing analytics dashboard
- [ ] Multi-touch attribution engine
- [ ] Partner/Ambassador leaderboards
- [ ] Report builder with exports

**Critical Files**:
- Create: `app/admin/marketing/analytics/page.tsx`
- Create: `lib/marketing/analytics-service.ts`
- Create: `app/api/admin/marketing/analytics/route.ts`

**New Tables**:
```sql
CREATE TABLE marketing_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  channel TEXT NOT NULL, -- 'ambassador', 'partner', 'social', 'organic', 'paid'
  source_id UUID, -- ambassador_id, partner_id, campaign_id
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  signups INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(10, 2) DEFAULT 0,
  cost DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, channel, source_id)
);

CREATE TABLE campaign_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id),
  report_type TEXT NOT NULL CHECK (report_type IN ('summary', 'detailed', 'roi', 'attribution')),
  data JSONB NOT NULL,
  generated_by UUID REFERENCES admin_users(id),
  generated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Attribution Models**:
- First Touch
- Last Touch
- Linear (equal credit)
- Time Decay (more recent = more credit)

**Estimated Effort**: 50-60 hours

---

## Timeline Summary

| Phase | Weeks | Hours | Status |
|-------|-------|-------|--------|
| 1. Foundation | 1-2 | 60-80 | ✅ Complete |
| 2. Partner Portal | 3-5 | 90-120 | ✅ Complete |
| 3. AI Creative | 6-7 | 50-70 | ⏳ Pending |
| 4. Social Media | 8-10 | 80-100 | ⏳ Pending |
| 5. Analytics | 11-12 | 50-60 | ⏳ Pending |
| **Total** | **12** | **330-430** | **~45% Complete** |

---

## External Integrations Required

| Service | Purpose | API | Environment Variable |
|---------|---------|-----|---------------------|
| **Recraft** | AI image generation | REST | `RECRAFT_API_KEY` |
| **Meta Graph** | Facebook + Instagram | OAuth + REST | `META_APP_ID`, `META_APP_SECRET` |
| **LinkedIn** | Company page posts | OAuth + REST | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` |
| **X (Twitter)** | Tweets, threads | OAuth 2.0 | `X_CLIENT_ID`, `X_CLIENT_SECRET` |

---

## Success Metrics

| KPI | Target | Measurement |
|-----|--------|-------------|
| **Time-to-Launch** | < 30 min for campaigns | Timestamp tracking |
| **Attribution Accuracy** | 95%+ tracked | attribution_logs coverage |
| **Asset Utilization** | 70%+ partner downloads | download_count metrics |
| **Revenue Impact** | 20%+ from tracked campaigns | campaign_components → orders |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Meta API rate limits | Batch posts, use webhooks |
| Recraft API cost | Template-first approach, cache results |
| OAuth token expiry | Auto-refresh with retry logic |
| Attribution data loss | Event sourcing, daily aggregation |

---

## Next Steps

To start Phase 3:
1. Sign up for Recraft API and get `RECRAFT_API_KEY`
2. Create `lib/marketing/ai-image-service.ts`
3. Build template management UI
4. Integrate with existing CMS AI generation
