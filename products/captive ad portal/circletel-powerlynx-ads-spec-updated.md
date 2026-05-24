# CircleTel WiFi Ads Platform Specification

## Overview

This specification defines a white-labeled CircleTel platform that sits above Powerlynx-managed hotspot infrastructure and supports managed ad sales, self-serve ad booking, venue reporting, revenue-share calculations, and future programmatic demand integration.[cite:105][cite:109][cite:110] The platform must explicitly support the initial pilot hardware profile already quoted for testing: MikroTik hAP ax S routers, Reyee RG-RAP62X outdoor Wi-Fi 6 access points, and 52V/30W PoE adapters.[cite:115][cite:116][cite:125]

## Product Goal

Build a production-grade commercial and reporting layer for CircleTel that uses Powerlynx for captive portal and ad execution while CircleTel owns advertiser workflows, partner reporting, revenue logic, and future ad-serving abstraction.[cite:105][cite:109][cite:110] The platform must not hardcode a single hardware vendor, even though the first certified test profile is based on MikroTik and Reyee hardware.[cite:115][cite:116][cite:125]

## In Scope

- Managed ad sales operations dashboard.
- Self-serve advertiser portal.
- Venue and partner reporting dashboards.
- Revenue-share engine.
- Hardware inventory and deployment profile management.
- Powerlynx integration for hotspot execution and metric ingestion.
- Future-ready abstraction for programmatic demand routing.[cite:105][cite:109][cite:110]

## Out of Scope for V1

- Building a full SSP or RTB bidder.
- Replacing Powerlynx captive portal enforcement in v1.
- Supporting every AP/router vendor on day one.
- Fully automated campaign push into Powerlynx unless partner API access is confirmed beyond current public/read-only scope.[cite:109][cite:110]

## Business Context

CircleTel already operates venue-based ad-supported WiFi and needs to replicate and improve the existing commercial reporting model under its own control.[cite:115] Powerlynx already supports Wi-Fi advertising with image and video creatives, impression counting, and targeting by location, splash page, and plan, which makes it suitable as the execution layer for the initial rollout.[cite:105][cite:110]

## Users

- **Super Admin**: full platform access.
- **Sales Ops**: advertiser setup, campaign booking, reporting.
- **Finance Admin**: invoicing, reconciliation, payout approval.
- **Partner Admin**: venue-level revenue and performance only.
- **Advertiser Admin**: self-serve campaign creation and billing.
- **Reviewer**: creative moderation and policy approval.
- **Deployment Admin**: hardware profiles, firmware baselines, field rollout tracking.

## Initial Certified Hardware Profile

The initial certified test and pilot hardware profile is based on the quoted bundle from Scoop Distribution.[cite:115] The quoted bundle includes 10 Reyee RG-RAP62X dual-band Wi-Fi 6 outdoor APs, 10 PoE-52V30W adapters, and 10 MikroTik hAP ax S routers.[cite:115] The hAP ax S provides RouterOS 7, five Gigabit Ethernet ports, integrated Wi-Fi 6, and a 2.5G SFP uplink option, which is suitable for the initial clinic-style split-SSID and VLAN deployment model.[cite:116] The RG-RAP62X is an outdoor Wi-Fi 6 AP with 1x Gigabit Ethernet and is suitable for testing patient WiFi coverage, captive portal behavior, and venue-side ad delivery in the pilot profile.[cite:121][cite:125]

### Initial hardware bundle

| Component | Model | Qty | Intended role | Source |
|---|---|---:|---|---|
| Router | MikroTik hAP ax S | 10 | Routing, VLANs, SSID policy, hotspot edge | [cite:115][cite:116] |
| Access Point | Reyee RG-RAP62X | 10 | Outdoor/venue WiFi access layer | [cite:115][cite:121][cite:125] |
| Power | PoE-52V30W | 10 | AP power injection | [cite:115] |

## Hardware Strategy

The software must treat the quoted hardware as the **initial certified profile**, not the permanent standard for all future deployments.[cite:115] The platform must support a hardware abstraction layer so that future indoor APs, alternative MikroTik routers, and other AP vendors can be certified without changing the business logic, reporting logic, or advertiser workflows.[cite:116][cite:125]

### Hardware design principles

- Hardware-aware, vendor-neutral data model.
- Powerlynx integration abstracted from AP vendor specifics where possible.
- Venue capability flags rather than vendor-only assumptions.
- Profile-based deployment templates.
- Firmware and configuration auditability.

### Required hardware capabilities to track

Each hardware profile must record whether it supports:
- VLAN segmentation.
- Separate staff and patient SSIDs.
- Captive portal compatibility.
- External RADIUS support.
- Powerlynx-compatible hotspot workflow.
- Remote management.
- PoE requirements.
- Indoor or outdoor deployment classification.
- Throughput class and user-density class.

## Hardware Profiles Module

Add a dedicated module called `hardware_profiles` with the following responsibilities:
- Define certified hardware bundles.
- Track vendor, model, firmware, role, and environment type.
- Bind a venue to a hardware profile.
- Store deployment notes and known constraints.
- Version field templates and rollout playbooks.
- Support migration from one hardware profile to another.

### Required hardware profile records

Examples:
- `mikrotik-hap-ax-s__reyee-rg-rap62x__clinic-pilot-v1`
- `mikrotik-router__indoor-ap__clinic-indoor-v1`
- `mikrotik-router__multi-ap__high-density-v1`

## Venue Inventory Requirements

Each venue record must be extended with hardware inventory fields so reporting and support can be correlated to deployed equipment.[cite:115] The venue model must store router model, AP model, AP count, PoE method, firmware versions, serial numbers where available, deployment date, and certified profile ID.

### Additional venue fields

- `hardware_profile_id`
- `router_vendor`
- `router_model`
- `router_firmware`
- `ap_vendor`
- `ap_model`
- `ap_quantity`
- `ap_firmware`
- `poe_type`
- `environment_type` (`indoor`, `outdoor`, `mixed`)
- `supports_vlan`
- `supports_external_radius`
- `supports_powerlynx_hotspot`
- `deployment_status`
- `field_notes`

## Lab and Pilot Scope

The first deployment phase is a lab and pilot certification exercise using the quoted MikroTik + Reyee stack before broader hardware support is introduced.[cite:115] The pilot must validate staff/patient SSID separation, VLAN isolation, captive portal behavior, ad display, session tracking, bandwidth shaping, and integration with Powerlynx reporting workflows.[cite:105][cite:115][cite:116]

### Lab acceptance criteria

- Staff and patient SSIDs work independently.
- VLAN isolation is enforced.
- Patient SSID redirects to captive portal correctly.
- Ad creatives display as expected on the patient journey.
- Powerlynx metrics can be reconciled into CircleTel reporting.
- Hardware profile and firmware versions are stored per venue.
- Rollback procedure exists for failed field deployments.

## Powerlynx Integration Model

Powerlynx remains the hotspot execution layer in v1 and is responsible for captive portal flow and native ad serving.[cite:105][cite:110] CircleTel remains the system of record for commercial logic, campaign contracts, revenue splits, partner payouts, branded reporting, and hardware inventory.[cite:109]

### Integration assumptions

- Powerlynx is used for hotspot locations, splash pages, plans, and ad execution.[cite:105][cite:110]
- CircleTel stores the commercial campaign record and external Powerlynx references.[cite:109]
- Metrics are ingested from Powerlynx API, reports, or controlled import workflows depending on available access.[cite:109]
- Hardware profile selection determines which deployment playbook and test checklist applies.

## Core Modules

- Advertisers
- Campaigns
- Creatives
- Creative Reviews
- Venues
- Venue Groups
- Hardware Profiles
- Device Inventory
- Revenue Rules
- Revenue Calculations
- Reports
- Payouts
- Billing
- Integrations
- Audit Logs
- Deployment Playbooks

## Core Workflows

### 1. Managed Campaign Workflow

1. Sales creates advertiser and campaign.
2. Ops selects venue group and confirms compatible hardware profile.
3. Creative is uploaded and moderated.
4. Campaign is mirrored into Powerlynx or staged for assisted sync.[cite:105][cite:109]
5. Daily metrics are imported and reconciled.
6. Revenue is calculated and statements are generated.

### 2. Self-Serve Workflow

1. Advertiser signs up.
2. Advertiser creates campaign and uploads creative.
3. Advertiser selects venue groups, which expose only eligible venues with supported hardware/captive-portal capability.
4. Campaign enters moderation.
5. Approved campaign is activated through the Powerlynx execution path.[cite:105][cite:110]

### 3. Deployment Workflow

1. Deployment Admin creates or selects a certified hardware profile.
2. Venue is assigned router/AP inventory.
3. Configuration template is generated for that profile.
4. Lab checklist is passed.
5. Site is deployed.
6. Post-deployment health checks are stored against the hardware profile.

## Reporting Requirements

### Operational reporting

- Unique users
- Sessions
- Ad impressions
- Data usage
- Sessions per user
- Top venues
- Venue health by hardware profile
- Firmware distribution
- Hardware-related issue trends

### Commercial reporting

- Gross revenue
- Net revenue
- CircleTel share
- Venue share
- Platform share
- Effective CPM
- Revenue by advertiser
- Revenue by venue
- Revenue by hardware profile

### Deployment reporting

- Active sites by hardware profile
- AP count by venue
- Router/AP firmware compliance
- Venue certification status
- Failed or unsupported hardware rollouts

## Revenue Engine

Revenue rules must remain independent of hardware vendor, but revenue reports must be filterable by hardware profile to assess commercial performance by deployment type. This allows CircleTel to compare whether one hardware profile yields better session quality, fill, CPM, or operational stability than another.

## Database Changes

### New tables

- `hardware_profiles`
- `hardware_profile_components`
- `venue_devices`
- `firmware_baselines`
- `deployment_runs`
- `deployment_checklists`
- `hardware_capabilities`

### Updated tables

- `venues`
- `campaign_targets`
- `integration_sync_runs`
- `audit_logs`

## Suggested Schema Additions

### hardware_profiles

- `id`
- `name`
- `slug`
- `router_vendor`
- `router_model`
- `ap_vendor`
- `ap_model`
- `poe_model`
- `environment_type`
- `supports_vlan`
- `supports_external_radius`
- `supports_powerlynx_hotspot`
- `supports_multi_ssid`
- `notes`
- `status`
- `version`

### venue_devices

- `id`
- `venue_id`
- `device_type`
- `vendor`
- `model`
- `serial_number`
- `firmware_version`
- `management_ip`
- `status`
- `installed_at`

## API Requirements

### New endpoints

- `GET /api/hardware-profiles`
- `POST /api/hardware-profiles`
- `GET /api/venues/:id/hardware`
- `POST /api/venues/:id/hardware`
- `POST /api/deployments/checklist/run`
- `GET /api/reports/hardware-overview`
- `GET /api/reports/hardware-profile/:id`

## UI Requirements

### New admin sections

- Hardware Profiles
- Device Inventory
- Deployment Checklists
- Firmware Compliance
- Hardware Performance

### Venue screen additions

Add panels for:
- Certified profile
- Installed hardware list
- Firmware versions
- Deployment notes
- Support flags
- Hardware-linked incidents

## Non-Functional Requirements

- Vendor-neutral architecture for future AP/router support.
- Powerlynx-specific logic isolated behind adapter interfaces.[cite:109]
- Revenue engine independent from hotspot vendor.
- All deployment templates versioned.
- Hardware capability flags available to both reporting and booking workflows.
- Venue eligibility for campaigns must consider both commercial targeting and hardware support.

## Build Phases

### Phase 1

- Core schema
- Auth and RBAC
- Advertisers, venues, campaigns
- Hardware profiles module
- Device inventory module
- Manual Powerlynx reconciliation workflow
- Basic dashboards

### Phase 2

- Revenue engine
- Venue and advertiser reporting
- CSV/PDF exports
- Deployment checklist workflows
- Firmware compliance dashboards

### Phase 3

- Self-serve advertiser portal
- Wallet and billing
- Automated moderation queue
- Venue eligibility rules by hardware profile

### Phase 4

- Enhanced Powerlynx sync tooling
- Zoho Books integration
- Deployment analytics by hardware profile
- API hardening

### Phase 5

- Inventory abstraction for non-Powerlynx execution
- Programmatic-ready ad decision contracts
- Multi-hardware rollout certification framework

## Claude Code Build Brief

```md
Build a production-ready application called CircleTel WiFi Ads Platform.

Context:
- CircleTel operates ad-supported WiFi at clinics and public venues.
- Powerlynx is used for hotspot and captive portal execution.
- CircleTel needs to own the commercial, reporting, revenue-share, and partner dashboard layer.
- The initial certified pilot hardware profile is MikroTik hAP ax S + Reyee RG-RAP62X + 52V/30W PoE adapters.
- Future hardware profiles must be supported without changing core business logic.

Tech stack:
- Next.js App Router
- TypeScript
- Tailwind
- Supabase Postgres/Auth/Storage
- Vercel deployment
- Background jobs with Inngest or cron

Required modules:
- Advertisers
- Campaigns
- Creatives
- Creative Reviews
- Venues
- Venue Groups
- Hardware Profiles
- Device Inventory
- Revenue Rules
- Revenue Calculations
- Reports
- Billing
- Payouts
- Integrations
- Audit Logs
- Deployment Checklists

Core requirements:
- CRUD for advertisers, venues, campaigns, and hardware profiles
- Device inventory linked to venues
- Powerlynx external reference fields
- Manual/assisted Powerlynx sync workflow
- Daily import and aggregation pipeline
- Revenue calculations with versioned rules
- Admin, advertiser, and partner dashboards
- Venue eligibility logic that considers hardware capabilities
- Supabase RLS for tenant isolation
- Adapter pattern for Powerlynx-specific logic

Important constraints:
- Do not hardcode Reyee-only or MikroTik-only logic outside deployment adapters.
- Keep revenue logic separate from hotspot execution logic.
- Treat the quoted hardware bundle as the first certified deployment profile, not the permanent standard.
- Prepare interfaces for future programmatic demand, but do not build a full SSP in v1.

Deliverables:
- Database schema
- Seed data
- App routes and layouts
- CRUD screens
- Reporting screens
- Hardware profile management
- Revenue engine service
- Integration adapters
- Deployment README
```

## Final Instruction

The platform must be commercially opinionated but hardware-flexible. The first live deployment profile is explicitly based on MikroTik hAP ax S and Reyee RG-RAP62X hardware from the quoted bundle, but every core system decision must preserve future compatibility with additional routers, access points, and site topologies.[cite:115][cite:116][cite:125]
