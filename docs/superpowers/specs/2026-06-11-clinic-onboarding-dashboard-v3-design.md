# Clinic Onboarding Dashboard v3.0 — Design

**Date:** 2026-06-11
**Route:** `/admin/unjani/onboarding`
**Supersedes:** the current 370-line `app/admin/unjani/onboarding/page.tsx` (basic table)
**Source mockup:** `CircleTel_Clinic_Onboarding_Dashboard_v3_0.html` (design review artifact, simulated data)

## Goal

Rebuild the clinic onboarding pipeline page as a sales-ops dashboard: at-a-glance KPIs, a clickable stage funnel, charts, a rich filterable table, a read-only Kanban view, and a clinic detail drawer — wired to **real** backend data.

## Scope decisions (locked)

1. **Data:** Build the full v3.0 layout on existing data **plus** a new lightweight `owner` field. **Defer** ISP-displacement savings (no data source): omit the "Saving p/m" column, the "Top displacement savings" chart, and the drawer "Commercials" block.
2. **Interactivity:** "Wire what exists, route the rest." Inline actions where an endpoint exists (assign owner, send/resend invite, confirm mandate, issue service order); navigate for actions without an endpoint (vet documents → `/admin/b2b/vetting`, schedule install). **Kanban is read-only** (no drag-to-advance) — stage is derived from workflow state, not directly settable.
3. **Third chart slot:** replace the deferred savings chart with **"Oldest in stage"** (clinics waiting longest) — actionable on real data.

## Non-goals (v1)

- ISP/cost/speed/savings data, the savings chart, drawer commercials.
- Drag-to-advance Kanban; new workflow-transition endpoints.
- A stage-transition audit log (see SLA caveat).

## Architecture

Thin page + focused co-located components (the current single file is doing too much for the v3.0 surface):

```
app/admin/unjani/onboarding/
  page.tsx                    # layout + data fetch via hook, composes pieces, view toggle
  components/
    stages.ts                 # shared 7-stage config: id, label, brand color, SLA target (days), action
    useOnboardingPipeline.ts  # fetch + client-side filter/sort/search/selection state
    OnboardingKpis.tsx        # 5 KPI cards (unified-kit StatCard)
    StageFunnel.tsx           # 7 clickable stage tiles + overdue flags → sets stage filter
    StageDonut.tsx            # lightweight inline SVG donut (no chart-lib dependency)
    ProvinceBars.tsx          # CSS horizontal bars from real province counts
    OldestInStage.tsx         # third panel: clinics waiting longest
    PipelineFilters.tsx       # search + province/SLA/owner selects + active stage chip + bulk bar
    PipelineTable.tsx         # rows: checkbox, clinic, stage pill+progress dots, SLA, owner, next action
    PipelineKanban.tsx        # read-only 7-column board; click card → drawer
    ClinicDrawer.tsx          # slide-in detail: contact + onboarding timeline (no commercials)
```

**Styling:** map the mockup onto the existing **unified backend UI kit** (`components/backend/*`: StatCard, SectionCard, StatusBadge, PageHeader) and brand tokens — orange `#E87A1E`, navy `#1B2A4A` (NOT the mockup's `#F5841E`/`#13274A`). Donut and bars are hand-rolled SVG/CSS to match the mockup with no new dependency. Respect `prefers-reduced-motion`.

## Stage model

Backend `determineStage` already returns these; map 1:1 to the mockup labels and define once in `stages.ts`:

| Backend stage | Label | SLA target (working days) | Primary action |
|---|---|---|---|
| `pending` | Awaiting invite | 5 | Send invite (inline) |
| `invited` | Invited | 5 | Send reminder (inline, resend link) |
| `submitted` | Docs submitted | 3 | Vet documents (navigate → /admin/b2b/vetting) |
| `changes_requested` | Changes requested | 3 | Phone nurse (drawer shows contact) |
| `docs_approved` | Docs approved | 4 | Send mandate link (inline) |
| `mandate_active` | Mandate active | 4 | Schedule install (navigate) |
| `billing_ready` | Ready to install | 5 | Raise service order (inline → issue-service-order) |

## Data flow

- **`GET /api/admin/b2b/onboarding-pipeline`** (extend existing): per clinic add `nurse_owner_name`, `phone`, `email`, `area_type` (from `clinic_details` + `customers`), and `owner` (joined name from `admin_users` via the new FK). Keep returning `clinics`, `stageCounts`, `overdueCount`. KPI / province / donut / oldest-in-stage aggregates are computed **client-side** from `clinics`.
- **`POST /api/admin/b2b/onboarding-pipeline/assign-owner`** (new; admin-auth + `kyc:verify`): body `{ customerIds: string[], ownerId: string | null }` → sets `customers.onboarding_owner_id`. Supports single and bulk. Audit-logged.
- **Bulk invite:** reuse existing `POST /api/admin/unjani/send-onboarding-batch`. **Single invite/resend:** reuse existing `send-link`.
- **CSV export:** client-side from the loaded (filtered) clinic list. Columns: account, clinic, province, nurse, phone, email, stage, SLA status, owner. (No savings columns.)

## Backend / schema change (single migration)

`supabase/migrations/<ts>_onboarding_owner.sql`:
```sql
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS onboarding_owner_id uuid REFERENCES admin_users(id);
CREATE INDEX IF NOT EXISTS idx_customers_onboarding_owner
  ON customers(onboarding_owner_id);
```
Owner options for the assign dropdown come from active `admin_users` (those with `kyc:verify` / sales-admin permission).

## SLA handling (honest approximation)

- **Vetting stage:** real countdown from `vetting_due_date` (already set to `addBusinessDays(submitted_at, 2)`). `overdue` already returned by the API.
- **Other stages:** we do NOT store "stage entered at" timestamps, so per-stage "X of Y days" uses `customers.updated_at` as the best-available stage-entry proxy, compared against the `stages.ts` target. This is clearly an approximation; the UI labels it as "in stage" rather than implying a hard SLA. A precise per-stage SLA needs a stage-transition log (future, out of scope).
- The **"Overdue SLA"** KPI counts only clinics whose real `sla.overdue` is true (i.e. vetting overdue), to avoid overstating breaches from the approximation.

## KPIs (5 cards, all from real data)

Active pipeline (count) · Overdue SLA (real `sla.overdue` count) · Ready to install (`billing_ready` count) · Pipeline MRR at activation (`count × R450`) · Active clinics (count with a started onboarding) — savings KPI dropped.

## Error / empty / loading states

- Loading: skeleton rows + skeleton KPI cards (reuse existing `Skeleton`).
- Fetch error: unified-kit `ErrorState` with retry (the page previously surfaced "Failed to fetch pipeline" — keep a real error path).
- Empty filtered result: existing empty-state pattern ("No clinics match these filters").

## Testing / verification

- `npm run type-check:memory` clean (scoped pre-push hook will gate).
- Migration applied to Supabase; `assign-owner` route returns 200 and persists.
- Pipeline API returns the extended shape (nurse/phone/email/owner) — verify via authenticated fetch.
- Browser-verify on staging (deploy-staging label): page renders, funnel filters the table, owner assign persists, Kanban opens drawer, CSV downloads, no console errors (esp. no Radix Select empty-value — owner/SLA selects use sentinels).
- Confirm 21 real clinics render (all currently `pending` → "Awaiting invite").

## Risks / dependencies

- All 21 clinics currently sit in one stage (`pending`); funnel/donut will look sparse until onboarding progresses — expected, not a bug.
- `admin_users` is the owner source; if sales reps aren't admin users, the assign list may be short initially (acceptable; can broaden later).
- Reuse, don't duplicate: check `components/backend/*` exports before adding any new shared primitive.
