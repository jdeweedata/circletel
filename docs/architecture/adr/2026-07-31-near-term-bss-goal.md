# ADR: Near-term BSS goal — revenue-first with ops floor

**Status:** Accepted  
**Date:** 2026-07-31  
**Deciders:** Product / Jeffrey (via wayfinder map *Near-term BSS goal*)  
**Wayfinder:** `.scratch/near-term-bss-goal/` (tickets 01–07)

---

## Context

- Commercial pressure requires a clear **near-term** focus: convert leads to paid orders without waiting on full BSS/Zoho Inventory/FSM build-out.
- March 2026 paid social proved **capture works** and **follow-up failed** (large share of leads unworked).
- Meta WhatsApp Business is **ready** for Flows (verified business, GREEN quality, API scopes); **F1 is not implemented** in the repo.
- `coverage_leads` capture + alerts exist; there is **no admin workbench** for assignment/SLA.
- Separate billing maps (engine, recon hub, service↔invoice leakage) are decision-complete; they support ops hygiene but do not replace the revenue bet.
- WhatsApp **084** support/Desk bridge is a **parallel** support channel effort, not the sales F1 bet.

---

## Decision

**Near-term goal = revenue-first with ops floor.**

### 1. Primary revenue bet

**Lead → paid order conversion**, with choke points:

1. Lead follow-up (assignment, visibility, first response)  
2. Then quote / KYC (existing B2B journey)

Not: Inventory, FSM, or full provisioning automation first.

### 2. WhatsApp F1 MVP only

| IN | OUT |
|----|-----|
| **F1 Lead Qualification** Flow (static/`navigate`) | F2 B2B deep-qualification |
| 4 screens: Contact → Address → Interest → Contact pref + POPIA | F3 follow-up booking |
| Entry: site/landing WA link, QR, admin manual send | In-chat quote / KYC / checkout / full order journey |
| CTWA ads optional later (same flow_id) | Replacing human sales with in-chat close |

**CRM outcome on F1 complete:** insert `coverage_leads` (`lead_source = whatsapp_flow`) + sales alert email + customer confirmation template. Zoho CRM sync **best-effort** (must not drop the lead if Zoho fails).

### 3. Admin lead follow-up MVP

| IN | OUT |
|----|-----|
| Admin `coverage_leads` queue + detail | Full CRM / pipeline redesign |
| Owner via `assigned_admin_id` (or equivalent) | Partner UI rebuild |
| First-response SLA: **2h business hours** + escalate uncontacted | Zoho lead retry engine |
| Zoho sync status **visible** (display only) | Admin support tickets as SoR (Desk remains support SoR) |

Queue must accept `whatsapp_flow` leads when F1 ships.

### 4. Service-delivery floor (from Phase 1 roadmap)

| IN (floor) | OUT (deferred under this goal) |
|------------|--------------------------------|
| **1.4** Device ↔ customer linkage for critical sites/APs | **1.1** Full fulfillment/dispatch/activation stub pages |
| **1.3** Minimal `sla_tracking` / activation failure path fix | **1.2** Admin support ticket detail UI rebuild |
| **1.6** Consumer service/order orphan data fix | **1.5** Env var hygiene polish |

### 5. Explicit out of near-term goal

- Zoho Inventory (Phase 3) and Zoho FSM (Phase 4) implementation  
- Full MTN wholesale ordering API programme  
- Full in-chat lead → paid order WhatsApp journey  
- Phase 5 commercial depth (commissions, exec dashboard, RICA automation, etc.)  
- Non-floor Phase 1 work unless required to hold the floor  

WhatsApp ↔ Zoho Desk bridge on **084** is **not** this ADR’s primary bet (support channel; track separately).

---

## Consequences

- **Spec / build order:** (1) admin follow-up MVP and/or F1 foundation can proceed per sequencing in `/to-spec`; both feed the same lead→paid-order funnel. (2) Floor fixes keep existing paid base operable.  
- **Roadmap:** Phase 1 exit criteria in the long roadmap (“ops runs full fulfillment UI”) are **not** the near-term exit criteria; use this ADR’s floor + revenue bet instead.  
- **Later maps:** F2/F3, full WhatsApp order Flow, Inventory/FSM after revenue milestones (numeric gates not locked here).  
- **Implementation:** Exact Flow Builder field names locked at build time against the F1 TypeScript contract (`docs/plans/2026-07-08-whatsapp-flows-sales-crm.md`).

---

## Related

- Wayfinder map: `.scratch/near-term-bss-goal/map.md`  
- Roadmap: `docs/plans/2026-07-29-bss-zoho-feature-roadmap.md`  
- F1 plan: `docs/plans/2026-07-08-whatsapp-flows-sales-crm.md`  
