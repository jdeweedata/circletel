<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# create a spec for me to use within Claude Code

Below is a Claude Code-ready product spec you can paste directly into your repo or use as a master prompt. It is tailored to your CircleTel use case: Powerlynx as the WiFi/captive-portal execution layer, and your own platform as the reporting, revenue, self-serve, and future programmatic layer. Powerlynx already supports location-, splash-page-, and plan-scoped image/video ads with impression counters, and its current public API is read-only for customers, vouchers, and plans, so the spec below assumes you will need a hybrid integration model at first rather than full write access to campaigns from your app.[^1][^2][^3]

## Product spec

### Title

CircleTel WiFi Ads Platform

### Goal

Build a white-labeled ad operations and reporting platform for CircleTel that sits on top of Powerlynx-managed hotspot infrastructure and supports three monetization modes:

- Managed direct ad sales
- Self-serve advertiser booking
- Future programmatic demand integration[^4][^3][^1]


### Core objective

Replace dependence on third-party reporting/monetization layers by owning:

- Advertiser onboarding
- Campaign booking
- Revenue-share calculations
- Venue/partner reporting
- Internal operations dashboards
- Future ad serving abstraction layer[^2]


### Non-goal for v1

Do not build a full SSP, bidder, or custom captive portal in v1. Powerlynx remains the hotspot enforcement and native ad display layer in v1 because it already supports unskippable video/image ads tied to locations, splash pages, and plans.[^3][^1]

## Business context

Current deployments already run on another platform with venue-level metrics like unique users, sessions, impressions, CPM, gross revenue, net revenue, platform share, and partner revenue, so the main need is to reproduce and improve that reporting and monetization stack under CircleTel ownership. Powerlynx can natively handle WiFi ad display and impression counting, but the branded business intelligence, revenue sharing, self-serve workflows, and multi-party reporting need to be built by CircleTel.[^1][^2]

## Users

- CircleTel Super Admin: manages all venues, advertisers, campaigns, revenue rules, and reports.
- CircleTel Sales/Ops: creates managed campaigns, approves creatives, allocates venues, exports reports.
- Venue Partner Admin: sees only their venues, revenue, impressions, and campaign history.
- Advertiser: books campaigns, uploads creatives, selects venues, funds wallet, tracks performance.
- Finance Admin: sees invoices, revenue splits, payouts, reconciliation.
- Future Programmatic Manager: manages fallback demand, floors, fill, and supply integrations.


## Success metrics

- Replicate current Think Digital-style dashboard metrics for all active venues.
- Support direct-sold campaigns across multiple venues and date ranges.
- Produce automated revenue-share statements by venue and by campaign.
- Reduce manual reporting/admin effort by at least 70%.
- Enable advertiser self-serve without CircleTel ops intervention for standard campaigns.
- Prepare clean abstraction for future non-Powerlynx ad serving.


## Functional scope

### V1 managed sales

- Create advertisers
- Create venues and venue groups
- Map CircleTel venue records to Powerlynx locations
- Create campaigns in your platform
- Store creatives and metadata
- Push campaign instructions to Powerlynx manually or via assisted ops workflow
- Ingest performance metrics from Powerlynx/manual exports
- Calculate CPM, gross revenue, CircleTel share, venue share, platform share
- Produce branded dashboards and PDF/CSV exports


### V1.5 self-serve

- Advertiser portal
- Wallet/prepaid credit
- Campaign booking wizard
- Creative upload and moderation queue
- Location targeting by venue group
- Budget controls and campaign status tracking
- Automated invoice generation


### V2 programmatic

- Inventory abstraction
- Ad decision service
- Floor pricing engine
- OpenRTB-compatible request/response layer
- Demand source connectors
- Fallback chain: direct sold > self-serve > house ads > programmatic


## System architecture

### High-level components

1. Web app: Next.js app router, TypeScript, Tailwind, server actions where useful.
2. Database: Supabase Postgres.
3. Auth: Supabase Auth with role-based access control.
4. File storage: Supabase Storage or Cloudflare R2 for creatives.
5. Background jobs: Inngest or cron jobs for ingestion, aggregation, reconciliation.
6. BI/reporting layer: materialized views + chart pages.
7. Integration layer:
    - Powerlynx connector
    - Zoho Books connector
    - Optional WhatsApp/email notifications
8. Future ad decision engine for non-native serving.

### Deployment

- Frontend/API on Vercel.
- Postgres on Supabase.
- Optional worker/webhook services on Contabo or Vercel cron depending load.
This fits the user's existing preferred stack and operating model.


## Powerlynx integration model

Powerlynx already supports:

- Ad campaigns
- Video/image creatives
- Impression counter
- Assignment by location
- Assignment by splash page
- Assignment by plan[^5][^1][^3]

Powerlynx public API currently exposes read-only access to customers, vouchers, and plans, which means campaign and advert automation may initially require one of these patterns:

- Manual operations sync by CircleTel ops in Powerlynx UI
- CSV import/export bridge
- Browser automation/internal admin assistant for campaign mirroring
- Await/confirm broader partner API access from Powerlynx[^2]


### Required integration approach for v1

Build the app assuming Powerlynx is the source of truth for hotspot execution but CircleTel is the source of truth for commercial logic. That means:

- Campaign commercial record lives in CircleTel DB
- Creative binary stored in CircleTel
- Powerlynx campaign reference stored if mirrored there
- Performance ingested from Powerlynx reports/export
- Revenue, CPM, share logic computed only in CircleTel DB


## Core workflows

### Workflow 1: Managed campaign

1. Sales creates advertiser.
2. Sales creates campaign.
3. Uploads creative.
4. Selects venues, dates, frequency assumptions, CPM or flat fee.
5. Finance approves pricing.
6. Ops creates/mirrors ad in Powerlynx.
7. Campaign goes live.
8. Metrics ingest nightly.
9. Revenue split calculated daily.
10. Venue and advertiser dashboards update.

### Workflow 2: Self-serve advertiser

1. Advertiser signs up.
2. Completes business profile and billing details.
3. Tops up wallet or pays invoice.
4. Creates campaign.
5. Uploads creative.
6. Chooses venues/venue groups and dates.
7. System validates campaign against policy.
8. Campaign enters moderation.
9. Approved campaign is mirrored to Powerlynx.
10. Reporting updates automatically.

### Workflow 3: Venue reporting

1. Venue admin logs in.
2. Sees active venues only.
3. Sees daily impressions, sessions, estimated revenue, approved payout, payout status.
4. Downloads statement by month.
5. Can compare sites and trends.

### Workflow 4: Future programmatic serving

1. User session eligible for ad.
2. Platform checks direct sold reservation.
3. If no direct sold fill, check self-serve guaranteed inventory.
4. If no fill, send request to demand partner.
5. If no bid, serve house ad.
This workflow is future-facing and should only be designed, not fully implemented in v1.

## Data model

### Tables

- organizations
- users
- roles
- advertisers
- venues
- venue_groups
- venue_partner_agreements
- hotspot_locations
- powerlynx_locations
- splash_pages
- plans
- campaigns
- campaign_targets
- campaign_creatives
- creative_reviews
- campaign_bookings
- ad_impressions_daily
- user_sessions_daily
- bandwidth_usage_daily
- revenue_rules
- revenue_calculations
- invoices
- wallet_transactions
- payouts
- integration_sync_runs
- import_files
- audit_logs


### Key fields

#### advertisers

- id
- legal_name
- brand_name
- industry
- billing_email
- vat_number
- status


#### venues

- id
- name
- province
- city
- latitude
- longitude
- venue_type
- partner_org_id
- powerlynx_location_id
- status


#### campaigns

- id
- advertiser_id
- name
- type enum(managed,self_serve,house,programmatic)
- pricing_model enum(cpm,flat,cpv,sponsorship)
- booked_budget
- start_date
- end_date
- status
- powerlynx_campaign_ref nullable
- targeting_mode enum(location_group,splash_page,plan)
- approval_status


#### campaign_creatives

- id
- campaign_id
- asset_type enum(video,image,html_future)
- file_url
- duration_seconds
- click_url
- checksum
- moderation_status


#### revenue_rules

- id
- venue_id nullable
- partner_org_id nullable
- advertiser_id nullable
- effective_from
- pricing_model
- circle_tel_pct
- venue_pct
- platform_pct
- fixed_fee nullable


#### ad_impressions_daily

- date
- venue_id
- campaign_id
- impressions
- clicks nullable
- unique_users nullable
- sessions nullable
- source enum(powerlynx,manual,estimated)


#### revenue_calculations

- date
- venue_id
- campaign_id
- gross_revenue
- net_revenue
- venue_share
- platform_share
- circletel_share
- cpm_effective
- status


## Revenue engine rules

The platform must support:

- CPM campaigns
- Flat monthly sponsorships
- CPV/video view pricing
- Free house ads
- Mixed models by venue or advertiser


### Formulas

- Gross Revenue = impressions / 1000 * booked_cpm
- Net Revenue = gross revenue - taxes - payment fees - discounts
- Venue Share = gross or net * venue percentage, configurable
- CircleTel Share = gross or net * CircleTel percentage, configurable
- Platform Share = gross or net * platform percentage, configurable

Rules must be versioned and effective-dated so old months do not recalculate unexpectedly.

## Reporting requirements

### Internal dashboard

- Total unique users
- Total login sessions
- Total ad impressions
- Data consumed
- Sessions per user
- Gross revenue
- Net revenue
- CircleTel share
- Venue share
- Platform share
- CPM
- Top venues
- Top campaigns
- Top advertisers
- Fill rate future
- Active vs paused campaigns


### Advertiser dashboard

- Campaign spend
- Impressions
- Estimated reach
- Effective CPM
- Venue breakdown
- Creative status
- Active date range


### Venue dashboard

- Revenue by month
- Impressions by venue
- Sessions by venue
- Payout due
- Payout history
- Site ranking
- Map of active sites


### Exports

- CSV for finance
- PDF monthly venue statements
- Campaign performance export


## UI requirements

### Admin app sections

- Overview
- Advertisers
- Campaigns
- Creatives
- Venues
- Venue Groups
- Revenue Rules
- Reports
- Payouts
- Integrations
- Audit Log
- Settings


### Self-serve portal sections

- Dashboard
- Campaigns
- New Campaign
- Creatives
- Billing
- Reports
- Support


### Venue portal sections

- Overview
- My Venues
- Revenue
- Statements
- Campaign Exposure
- Settings


## Permissions model

- super_admin: full access
- sales_ops: advertisers, campaigns, reports
- finance: revenue, invoices, payouts
- partner_admin: own venues and statements only
- advertiser_admin: own campaigns and billing only
- reviewer: creative moderation only

Use row-level security in Supabase for tenant isolation.

## Integrations

### Powerlynx

Use for:

- hotspot/venue execution reference
- plan/splash page mapping
- ad display execution
- impression source data where available[^1][^2]

Need:

- import locations
- import plans
- store external IDs
- ingest report exports or API payloads
- reconcile campaign references


### Zoho Books

Use for:

- advertiser invoices
- credit notes
- payout accounting
- monthly reconciliations


### Email/WhatsApp

Use for:

- campaign approval
- low wallet balance
- invoice issued
- payout completed


## API design inside your app

### Internal APIs

- POST /api/advertisers
- POST /api/campaigns
- POST /api/creatives
- POST /api/bookings
- POST /api/revenue/recalculate
- GET /api/reports/overview
- GET /api/reports/venue/:id
- GET /api/reports/campaign/:id
- POST /api/integrations/powerlynx/import
- POST /api/integrations/powerlynx/reconcile
- POST /api/creative-reviews/:id/approve
- POST /api/creative-reviews/:id/reject


### Future ad decision API

- POST /api/ad-decision/request
- POST /api/ad-decision/win
- POST /api/ad-decision/impression
- POST /api/ad-decision/click

Do not implement the future ad decision API beyond interface stubs in v1.

## Creative policy

- Allowed formats: MP4, JPG, PNG initially because Powerlynx supports video and image ads.[^5][^1]
- Max file size default: 100 MB to align with Powerlynx docs for video uploads.[^1][^5]
- Require click URL validation.
- Require duration for image ads.
- Block prohibited content categories for clinic environments.
- Keep audit trail for approvals and rejections.


## Aggregation and ingestion

Because Powerlynx API access is currently limited publicly, build ingestion with pluggable adapters:

- adapter_powerlynx_api_readonly
- adapter_powerlynx_csv_import
- adapter_manual_entry
- adapter_future_partner_api


### Nightly jobs

- sync locations/plans
- import yesterday metrics
- aggregate by venue/day/campaign
- calculate revenue
- update dashboard caches
- generate anomaly alerts


### Anomaly detection

Flag:

- zero impressions on active campaign
- impressions without sessions
- sudden CPM drop
- duplicate venue mappings
- missing Powerlynx external IDs


## v1 implementation plan

### Phase 1 foundation

- Repo setup
- Auth and roles
- Core DB schema
- Admin shell
- Venue and advertiser CRUD
- Campaign CRUD
- Creative upload
- Revenue rules
- Audit logs


### Phase 2 reporting

- Import pipeline
- Overview dashboard
- Venue dashboard
- Campaign dashboard
- CSV export
- Monthly statement generator


### Phase 3 self-serve

- Advertiser signup
- Wallet
- Campaign booking wizard
- Moderation queue
- Approval notifications


### Phase 4 integration hardening

- Powerlynx reconciliation workflows
- Zoho Books integration
- Error handling
- admin tooling


### Phase 5 future-ready

- Inventory abstraction
- Ad decision service interfaces
- demand connector contracts


## Technical constraints

- Design for eventual replacement of Powerlynx ad execution without rewriting commercial logic.
- No business logic in UI components.
- All revenue calculations server-side only.
- All external integrations idempotent.
- Every imported record must preserve raw payload for audit/debug.
- Every calculation must be reproducible for a closed accounting period.


## Suggested folder structure

```txt
/apps/web
  /app
  /components
  /modules
    /advertisers
    /campaigns
    /venues
    /reports
    /revenue
    /integrations
    /billing
  /lib
  /types
/packages
  /db
  /ui
  /config
  /integrations
    /powerlynx
    /zoho
    /future-demand
  /revenue-engine
  /reporting
  /auth
```


## Claude Code build brief

Paste this into Claude Code as the working brief:

```md
Build a production-ready web application called CircleTel WiFi Ads Platform.

Context:
- CircleTel operates WiFi hotspots in public/clinic environments.
- Powerlynx is used as the hotspot and captive portal platform.
- Powerlynx already supports image/video ads, location targeting, splash page targeting, plan targeting, and impression counting.
- Powerlynx public API is currently limited/read-only for customers, vouchers, and plans, so campaign execution sync may initially require manual or import-based workflows.
- We need to build the commercial and reporting layer on top of Powerlynx.

Goals:
1. Managed ad sales operations dashboard
2. Self-serve advertiser portal
3. Venue/partner revenue dashboards
4. Revenue-share engine
5. Future-ready abstraction for programmatic demand

Tech stack:
- Next.js latest with App Router
- TypeScript
- Tailwind
- Supabase Postgres + Auth + Storage
- Vercel deployment
- Inngest or cron jobs for imports and aggregation

Roles:
- super_admin
- sales_ops
- finance
- partner_admin
- advertiser_admin
- reviewer

Core modules:
- Advertisers
- Venues
- Venue Groups
- Campaigns
- Creatives
- Creative Reviews
- Revenue Rules
- Reports
- Payouts
- Integrations
- Billing
- Audit Logs

Required v1 features:
- CRUD for advertisers, venues, campaigns
- Creative upload with validation
- Manual/assisted Powerlynx sync workflow
- Import pipeline for metrics
- Daily revenue calculations
- Overview dashboard
- Venue dashboard
- Advertiser dashboard
- CSV export
- Role-based access with tenant isolation
- Full audit logging

Data requirements:
- external IDs for Powerlynx locations/plans/campaign refs
- daily aggregated tables for impressions, sessions, usage, revenue
- versioned revenue rules
- raw import payload storage for debugging/reconciliation

Important architecture rules:
- Keep Powerlynx-specific code behind an integration interface
- Keep revenue logic independent from ad-serving platform
- Prepare interfaces for future ad decision service but do not implement full SSP
- Use server-side actions/services for all calculation logic
- Use Supabase RLS for tenant boundaries

Deliverables:
- Initial database schema
- Seed data
- App routes and layout
- Core CRUD screens
- Reporting pages
- Revenue engine service
- Integration service abstractions
- README with local setup and deployment steps
```


## Recommended build order

Start with managed sales and reporting first, because that is the fastest path to replacing your dependency on the current external reporting layer and captures the most commercial value early. Add self-serve second, and only build true programmatic after you have much larger inventory and cleaner first-party data workflows, because Powerlynx already covers the ad display need today while your moat is the audience, reporting, and revenue logic rather than the ad-serving primitive itself.[^3][^1]
<span style="display:none">[^10][^11][^12][^13][^14][^15][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://docs.powerlynx.app/system/adverts.html

[^2]: https://powerlynx.app/blog/powerlynx-public-api/

[^3]: https://powerlynx.app/features/

[^4]: https://powerlynx.app/wifi-advertising/

[^5]: https://powerlynx.app/blog/powerlynx-boost-wi-fi-hotspot-monetization-with-ads/

[^6]: https://docs.powerlynx.app

[^7]: https://www.youtube.com/watch?v=6uFzY9sJCa8

[^8]: https://www.itweb.co.za/article/powerlynx-enables-businesses-to-monetise-wifi-hotspots-with-adverts/JBwEr7n3KYNM6Db2

[^9]: https://docs.powerlynx.app/getstarted.html

[^10]: https://powerlynx.app/blog/powerlynx-splash-page-editor-tips/

[^11]: https://docs.powerlynx.app/system/notifications.html

[^12]: https://unified.to/ads

[^13]: https://powerlynx.app

[^14]: https://docs.powerlynx.app/integrations/splynx.html

[^15]: https://www.youtube.com/watch?v=YRMpoaTQO7M

