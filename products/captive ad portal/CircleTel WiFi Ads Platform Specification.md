<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# CircleTel WiFi Ads Platform Specification

## Overview

This specification defines a white-labeled CircleTel platform that sits above Powerlynx-managed hotspot infrastructure and supports managed ad sales, self-serve ad booking, venue reporting, revenue-share calculations, and future programmatic demand integration. The platform must explicitly support the initial pilot hardware profile already quoted for testing: MikroTik hAP ax S routers, Reyee RG-RAP62X outdoor Wi-Fi 6 access points, and 52V/30W PoE adapters.[^1][^2][^3][^4][^5][^6]

## Product Goal

Build a production-grade commercial and reporting layer for CircleTel that uses Powerlynx for captive portal and ad execution while CircleTel owns advertiser workflows, partner reporting, revenue logic, and future ad-serving abstraction. The platform must not hardcode a single hardware vendor, even though the first certified test profile is based on MikroTik and Reyee hardware.[^2][^3][^4][^5][^6][^1]

## In Scope

- Managed ad sales operations dashboard.
- Self-serve advertiser portal.
- Venue and partner reporting dashboards.
- Revenue-share engine.
- Hardware inventory and deployment profile management.
- Powerlynx integration for hotspot execution and metric ingestion.
- Future-ready abstraction for programmatic demand routing.[^3][^1][^2]


## Out of Scope for V1

- Building a full SSP or RTB bidder.
- Replacing Powerlynx captive portal enforcement in v1.
- Supporting every AP/router vendor on day one.
- Fully automated campaign push into Powerlynx unless partner API access is confirmed beyond current public/read-only scope.[^2][^3]


## Business Context

CircleTel already operates venue-based ad-supported WiFi and needs to replicate and improve the existing commercial reporting model under its own control. Powerlynx already supports Wi-Fi advertising with image and video creatives, impression counting, and targeting by location, splash page, and plan, which makes it suitable as the execution layer for the initial rollout.[^4][^1][^3]

## Users

- **Super Admin**: full platform access.
- **Sales Ops**: advertiser setup, campaign booking, reporting.
- **Finance Admin**: invoicing, reconciliation, payout approval.
- **Partner Admin**: venue-level revenue and performance only.
- **Advertiser Admin**: self-serve campaign creation and billing.
- **Reviewer**: creative moderation and policy approval.
- **Deployment Admin**: hardware profiles, firmware baselines, field rollout tracking.


## Initial Certified Hardware Profile

The initial certified test and pilot hardware profile is based on the quoted bundle from Scoop Distribution. The quoted bundle includes 10 Reyee RG-RAP62X dual-band Wi-Fi 6 outdoor APs, 10 PoE-52V30W adapters, and 10 MikroTik hAP ax S routers. The hAP ax S provides RouterOS 7, five Gigabit Ethernet ports, integrated Wi-Fi 6, and a 2.5G SFP uplink option, which is suitable for the initial clinic-style split-SSID and VLAN deployment model. The RG-RAP62X is an outdoor Wi-Fi 6 AP with 1x Gigabit Ethernet and is suitable for testing patient WiFi coverage, captive portal behavior, and venue-side ad delivery in the pilot profile.[^5][^6][^7][^4]

### Initial hardware bundle

| Component | Model | Qty | Intended role | Source |
| :-- | :-- | --: | :-- | :-- |
| Router | MikroTik hAP ax S | 10 | Routing, VLANs, SSID policy, hotspot edge | [^4][^5] |
| Access Point | Reyee RG-RAP62X | 10 | Outdoor/venue WiFi access layer | [^4][^7][^6] |
| Power | PoE-52V30W | 10 | AP power injection | [^4] |

## Hardware Strategy

The software must treat the quoted hardware as the **initial certified profile**, not the permanent standard for all future deployments. The platform must support a hardware abstraction layer so that future indoor APs, alternative MikroTik routers, and other AP vendors can be certified without changing the business logic, reporting logic, or advertiser workflows.[^6][^4][^5]

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

Each venue record must be extended with hardware inventory fields so reporting and support can be correlated to deployed equipment. The venue model must store router model, AP model, AP count, PoE method, firmware versions, serial numbers where available, deployment date, and certified profile ID.[^4]

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

The first deployment phase is a lab and pilot certification exercise using the quoted MikroTik + Reyee stack before broader hardware support is introduced. The pilot must validate staff/patient SSID separation, VLAN isolation, captive portal behavior, ad display, session tracking, bandwidth shaping, and integration with Powerlynx reporting workflows.[^1][^5][^4]

### Lab acceptance criteria

- Staff and patient SSIDs work independently.
- VLAN isolation is enforced.
- Patient SSID redirects to captive portal correctly.
- Ad creatives display as expected on the patient journey.
- Powerlynx metrics can be reconciled into CircleTel reporting.
- Hardware profile and firmware versions are stored per venue.
- Rollback procedure exists for failed field deployments.


## Powerlynx Integration Model

Powerlynx remains the hotspot execution layer in v1 and is responsible for captive portal flow and native ad serving. CircleTel remains the system of record for commercial logic, campaign contracts, revenue splits, partner payouts, branded reporting, and hardware inventory.[^3][^1][^2]

### Integration assumptions

- Powerlynx is used for hotspot locations, splash pages, plans, and ad execution.[^1][^3]
- CircleTel stores the commercial campaign record and external Powerlynx references.[^2]
- Metrics are ingested from Powerlynx API, reports, or controlled import workflows depending on available access.[^2]
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
4. Campaign is mirrored into Powerlynx or staged for assisted sync.[^1][^2]
5. Daily metrics are imported and reconciled.
6. Revenue is calculated and statements are generated.

### 2. Self-Serve Workflow

1. Advertiser signs up.
2. Advertiser creates campaign and uploads creative.
3. Advertiser selects venue groups, which expose only eligible venues with supported hardware/captive-portal capability.
4. Campaign enters moderation.
5. Approved campaign is activated through the Powerlynx execution path.[^3][^1]

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
- Powerlynx-specific logic isolated behind adapter interfaces.[^2]
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

The platform must be commercially opinionated but hardware-flexible. The first live deployment profile is explicitly based on MikroTik hAP ax S and Reyee RG-RAP62X hardware from the quoted bundle, but every core system decision must preserve future compatibility with additional routers, access points, and site topologies.[^5][^6][^4]

## AI Delivery Methodology

The implementation methodology for this platform should explicitly combine **GitHub Spec Kit** and **obra/superpowers** rather than relying on ad hoc prompting alone. Spec Kit should be used as the formal spec-driven framework for defining the constitution, feature specifications, implementation plans, task breakdowns, and delivery sequence. Superpowers should be used as the execution operating layer inside Claude Code for brainstorming, planning discipline, structured implementation, code review loops, and parallelized work patterns.[^8][^9][^10][^11][^12]

### Recommended methodology roles

| Tool | Recommended role | How it should be used |
| :-- | :-- | :-- |
| GitHub Spec Kit | Formal product and engineering specification backbone | Own constitution, requirements, plans, tasks, and feature-level implementation artifacts.[^8][^9] |
| obra/superpowers | Claude Code execution workflow layer | Drive structured plan generation, iterative implementation, review, and developer workflow discipline.[^10][^12][^11] |
| garrytan/gbrain | Optional long-term engineering memory layer | Store architecture decisions, deployment notes, hardware certifications, troubleshooting knowledge, and operational learnings once the platform matures.[^13][^14] |
| mattpocock/skills | Optional tactical engineering skills library | Pull in targeted coding practices such as TDD, refactoring, and code-quality habits where useful, rather than treating it as the primary framework.[^15][^16] |

### Delivery principle

Spec Kit must remain the source of truth for **what** is being built and **why**. Superpowers must govern **how Claude Code behaves during implementation** so that the work stays structured and reviewable. GBrain should be added later only when project memory and operational knowledge become large enough to justify a persistent knowledge substrate. Matt Pocock's skills should be treated as selective implementation accelerators, not as the governing project system.[^9][^10][^11][^14][^16][^8]

## Spec-Driven Workflow

This project should adopt a spec-driven lifecycle for all major modules, especially because the platform includes hotspot orchestration, hardware profile support, advertiser workflows, and future adtech abstractions. GitHub Spec Kit is explicitly intended to support spec-driven development workflows through staged specification, planning, and execution artifacts.[^17][^8][^9]

### Required workflow stages

1. `constitution` — define engineering principles, tenant isolation, adapter-first integration, hardware abstraction, auditability, and revenue calculation integrity.
2. `specify` — define each feature in business and technical terms.
3. `plan` — convert the feature spec into implementation architecture and milestones.
4. `tasks` — generate an ordered task list with dependencies.
5. `implement` — execute the feature in Claude Code using Superpowers-guided workflow discipline.[^10][^8][^9][^17]

### Mandatory feature specs

The following modules must each have their own Spec Kit feature specification before implementation begins:

- Venue and hardware profile management.
- Device inventory and deployment certification.
- Captive portal/session engine.
- Advertiser and campaign management.
- Creative moderation.
- Revenue engine.
- Venue and advertiser reporting.
- Billing and payouts.
- Powerlynx adapter and future non-Powerlynx adapter interface.
- Programmatic-ready ad decision contracts.


## Superpowers Operating Model

Superpowers should be used as the day-to-day execution framework inside Claude Code because it adds structure around brainstorming, planning, code review, and task execution. For this project, Superpowers should be configured to enforce small implementation batches, explicit review checkpoints, and branch/worktree isolation for higher-risk modules such as RADIUS integration, captive portal logic, and revenue calculation workflows.[^11][^12][^10]

### Recommended Superpowers usage

- Use brainstorming mode before writing a new module.
- Generate an implementation plan from the approved Spec Kit feature spec.
- Run development in small checkpoints rather than large monolithic prompts.
- Require review after schema, adapter, and reporting changes.
- Use separate branches or worktrees for high-risk modules.
- Keep implementation tied back to the current feature spec and constitution.


## GBrain Usage Policy

GBrain is best positioned as an optional memory and knowledge system, not as the primary delivery framework. It is better suited to storing durable operational knowledge such as deployment SOPs, hardware certification notes, venue issue histories, Powerlynx integration quirks, campaign learnings, and architecture decision records.[^13][^14]

### When to add GBrain

Introduce GBrain only after the platform has enough complexity that knowledge retrieval becomes a bottleneck, for example:

- multiple certified hardware profiles,
- recurring deployment and troubleshooting patterns,
- accumulated revenue-rule exceptions,
- large operational playbooks,
- cross-team architecture decision history.[^14]


## Skills Library Policy

Matt Pocock's skills repository should be treated as a selective engineering accelerant for implementation quality rather than a complete methodology replacement. It is appropriate to import specific skill patterns for TDD, refactoring, or code organization if they improve output quality in Claude Code.[^15][^16]

### Approved usage of external skills

- Use targeted skills for testing discipline.
- Use targeted skills for refactoring and code review checklists.
- Avoid indiscriminately loading large skill sets that conflict with the project's constitution or Spec Kit workflow.
- Prefer project-specific skills over generic community skills once internal patterns are mature.


## Repository Operating Standard

The repository should standardize on the following hierarchy:

- **Spec Kit** governs specification artifacts.
- **Superpowers** governs implementation behavior in Claude Code.
- **Internal project skills** govern CircleTel-specific engineering conventions.
- **GBrain** is optional for long-term memory after operational scale is reached.[^16][^9][^10][^14]

<div align="center">⁂</div>

[^1]: https://docs.powerlynx.app/system/adverts.html

[^2]: https://powerlynx.app/blog/powerlynx-public-api/

[^3]: https://powerlynx.app/features/

[^4]: Quotation-QU523205.PDF

[^5]: https://mikrotik.com/product/hap_ax_s

[^6]: https://scoop.co.za/reyee-dual-band-wifi-6-3000mbps-gigabit-outdoor-ap-rg-rap62-od.html

[^7]: https://www.comx.co.za/RG-RAP62X-Reyee-Dual-Band-WiFi-6-3000Mbps-Gigabit-Outdoor-Buy-p-307594.php

[^8]: https://github.github.com/spec-kit/

[^9]: https://github.com/github/spec-kit/blob/main/README.md

[^10]: https://github.com/obra/superpowers

[^11]: https://github.com/wln/obra-superpowers/blob/main/README.md

[^12]: https://www.claudepluginhub.com/plugins/obra-superpowers-2

[^13]: https://x.com/garrytan/status/2042369335419945338

[^14]: https://hermesatlas.com/projects/garrytan/gbrain

[^15]: https://github.com/mattpocock/skills/blob/main/scaffold-exercises/SKILL.md

[^16]: https://github.com/mattpocock/skills/blob/main/README.md

[^17]: https://github.com/github/spec-kit/blob/main/spec-driven.md

