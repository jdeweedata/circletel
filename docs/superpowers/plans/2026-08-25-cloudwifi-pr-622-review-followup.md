# CloudWiFi PR #622 Review Follow-up Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the five merge blockers from the PR #622 review on `fix/cloudwifi-pr-622-review` without losing real site-survey leads.

**Architecture:** Keep the public honeypot silent (`201` + `success: true`) but never return a client-accepted `leadId`. Measure brand literals without counting Tailwind `circleTel-*` tokens. Persist `source_campaign` on insert. Coerce the shared mobile hook at the sidebar boundary. Drop out-of-scope docs.

**Tech Stack:** Next.js 15, Jest, `coverage_leads`, `scripts/check-brand-literals.sh`

---

### Task 1: Honeypot must not confirm a fake lead

**Files:**
- Modify: `__tests__/api/cloudwifi-lead-route.test.ts`
- Modify: `components/cloudwifi/__tests__/CloudWifiSurveyWizard.test.tsx`
- Modify: `app/api/leads/cloudwifi/route.ts`
- Modify: `components/cloudwifi/CloudWifiSurveyWizard.tsx`

- [ ] **Step 1: Write the failing tests**

Route: honeypot `201` has no `leadId`; `_hp` and `website` both trip the guard; insert is not called.

Wizard: `leadId: "received"` is not success; honeypot input is `_hp`, not labeled "Company website".

- [ ] **Step 2: Run tests and confirm they fail for the missing behavior**
- [ ] **Step 3: Minimal implementation** — omit `leadId` on honeypot `201`; send `_hp`; reject reserved `"received"` client-side
- [ ] **Step 4: Re-run the two suites and confirm they pass**

### Task 2: Persist `source_campaign`

**Files:**
- Modify: `__tests__/api/cloudwifi-lead-route.test.ts`
- Modify: `lib/cloudwifi/lead-payload.ts`

- [ ] Assert insert includes `source_campaign: "cloudwifi_site_survey"`
- [ ] Add the column to `CloudWifiLeadPayload` / `buildCloudWifiLeadPayload`

### Task 3: Brand-literal ratchet without inflating baseline

**Files:**
- Modify: `scripts/check-brand-literals.sh`
- Modify: `.brand-literal-baseline`
- Modify CloudWiFi copy in `components/cloudwifi/*` to use `getTenantConfig().branding.companyName` where the string is identity, not a Tailwind token

- [ ] Strip `circleTel-*` token fragments before counting
- [ ] Route new product-copy "CircleTel" strings through tenant config
- [ ] Run the script; ratchet baseline **down** to the new count only

### Task 4: Coerce `useIsMobile` in sidebar

**Files:**
- Modify: `components/ui/sidebar.tsx`

- [ ] `const isMobile = useIsMobile() ?? false` so `SidebarContext.isMobile` stays `boolean`

### Task 5: Drop out-of-scope files

**Files:**
- Delete: `docs/superpowers/specs/2026-07-13-circletel-operations-dashboard-design.md`
- Delete: `memory-os/short-term/handoffs/2026-07-14-cloudwifi-product-page.md`
- Revert CloudWiFi-only hunks in `memory-os/long-term/agent-context.md` and `memory-os/short-term/session-notes.md`

### Task 6: Verify

- [ ] CloudWiFi Jest suites
- [ ] Brand-literal script
- [ ] Scoped `tsc` on touched files
