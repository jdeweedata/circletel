# Architecture Documentation

Categorized index of all architecture docs. Files are referenced across the codebase — do not rename or move without checking `grep -r "docs/architecture/FILENAME"`.

## Core Architecture

| Document | Description |
|----------|-------------|
| [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md) | Main system overview — start here |
| [AUTHENTICATION_SYSTEM.md](AUTHENTICATION_SYSTEM.md) | Three-context auth (consumer, partner, admin) |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | Design tokens, colors, spacing |
| [TYPOGRAPHY.md](TYPOGRAPHY.md) | Font families, sizes, line heights |
| [CRON_SCHEDULE.md](CRON_SCHEDULE.md) | All scheduled jobs |
| [ARCHITECTURE_DISCOVERY.md](ARCHITECTURE_DISCOVERY.md) | Auto-generated codebase structure |

## Customer Journeys

| Document | Description |
|----------|-------------|
| [CIRCLETEL_ORDER_JOURNEY.md](CIRCLETEL_ORDER_JOURNEY.md) | Current consumer order flow (3-step) |
| [CIRCLETEL_ORDER_JOURNEY_REDESIGN.md](CIRCLETEL_ORDER_JOURNEY_REDESIGN.md) | Redesigned consumer flow (7-step) with Didit KYC |
| [CIRCLETEL_BUSINESS_BUY_JOURNEY.md](CIRCLETEL_BUSINESS_BUY_JOURNEY.md) | B2B 6-stage journey (quote to go-live) |
| [VOX_LTE_ORDER_JOURNEY.md](VOX_LTE_ORDER_JOURNEY.md) | Vox competitor reference for design patterns |

## Integrations

| Document | Description |
|----------|-------------|
| [ADMIN_SUPABASE_ZOHO_INTEGRATION.md](ADMIN_SUPABASE_ZOHO_INTEGRATION.md) | B2B KYC 7-stage workflow, Zoho sync |
| [COVERAGE_INTEGRATION_IMPLEMENTATION.md](COVERAGE_INTEGRATION_IMPLEMENTATION.md) | 4-layer coverage fallback system |
| [FTTB_COVERAGE_SYSTEM.md](FTTB_COVERAGE_SYSTEM.md) | Fibre-to-the-Business coverage |
| [PLAYWRIGHT_MTN_MAP_INTEGRATION.md](PLAYWRIGHT_MTN_MAP_INTEGRATION.md) | MTN coverage map scraping |
| [PAYMENT_SYNC_SYSTEM.md](PAYMENT_SYNC_SYSTEM.md) | NetCash payment reconciliation |
| [INFRASTRUCTURE_FALLBACK_REALTIME_DESIGN.md](INFRASTRUCTURE_FALLBACK_REALTIME_DESIGN.md) | Infrastructure monitoring fallback design |

## Audits

| Document | Description |
|----------|-------------|
| [ADMIN_ROUTE_AUDIT.md](ADMIN_ROUTE_AUDIT.md) | Admin route auth audit (2026-05-09) |
| [PAYMENT_JOURNEY_AUDIT_2026-05-11.md](PAYMENT_JOURNEY_AUDIT_2026-05-11.md) | Payment flow audit (2026-05-11) |

## Architecture Decision Records

| Document | Description |
|----------|-------------|
| [ADR-001](adr/ADR-001-cms-migration-to-prismic.md) | CMS migration to Prismic |

## Archive

Completed plans, decided analyses, and superseded docs.

| Document | Status |
|----------|--------|
| [COOLIFY_MIGRATION_PLAN.md](archive/COOLIFY_MIGRATION_PLAN.md) | Migration complete (2026-04-05) |
| [SUPABASE_VS_CLERK_AUTH_ANALYSIS.md](archive/SUPABASE_VS_CLERK_AUTH_ANALYSIS.md) | Decision: stay with Supabase |
| [REFACTORING_PLAN.md](archive/REFACTORING_PLAN.md) | Auth refactoring plan |
| [SIDEBAR_REFACTOR_MIGRATION.md](archive/SIDEBAR_REFACTOR_MIGRATION.md) | Sidebar component refactor |
| [CUSTOMER_JOURNEY_ORDER_TO_PAYMENT.md](archive/CUSTOMER_JOURNEY_ORDER_TO_PAYMENT.md) | Superseded by CIRCLETEL_ORDER_JOURNEY_REDESIGN.md |
