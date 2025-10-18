Here’s a **structured breakdown of the customer journey improvements** from your document into **smaller actionable tasks** — formatted as a **to-do list grouped by priority and phase**.

---

## 🧭 Phase 1: Immediate Wins (Low Effort, High Impact)

### 🔧 Fix Critical Friction Points

* [ ] **Remove order page redirect loop**

  * Delete `app/order/page.tsx` or replace with direct order form.
  * Update all “Get this deal” links to point to correct order destination.

* [ ] **Add floating CTA after package selection**

  * Modify `CoverageChecker.tsx` to show sticky bottom bar when a package is selected.
  * Label: “Continue with {Package Name} →”.

* [ ] **Add progress indicator to coverage check**

  * Integrate 3-stage progress feedback:

    * Step 1: Finding location
    * Step 2: Checking coverage
    * Step 3: Loading packages
  * Improve perceived load time and UX.

* [ ] **Track lead source and customer type**

  * Update `/api/coverage/lead` to include:

    * `customer_type`, `utm_source`, `utm_medium`, `utm_campaign`.
  * Add optional phone number field.

---

## ⚙️ Phase 2: Short-Term Improvements (Medium Effort)

### 💼 Create Dedicated Business Journey

* [ ] **New landing page** `/business` or `/enterprise`

  * Add B2B hero section (SLA, uptime, scalability).
  * Include company size and contact form.
* [ ] **Implement B2B package filtering**

  * Separate consumer vs business offerings.
* [ ] **Replace CTA**

  * “Get this deal” → “Request Quote”.
* [ ] **Lead qualification fields**

  * Company name, size, and type in form.

### 🧩 Consolidate Order Flows

* [ ] **Create unified order form component**

  * New file: `components/order/UnifiedOrderForm.tsx`
  * Support variants: `"home-internet" | "wireless" | "business"`.
* [ ] **Add progress indicator UI**

  * Consistent with Home Internet & Wireless flows.
* [ ] **Refactor duplicated code**

  * Remove redundant order pages (~800 lines total).

### 🧠 Improve Lead Qualification

* [ ] **Add new data fields**

  * Property type, number of users/devices.
* [ ] **Implement SMS verification for phone numbers.**

---

## 🚀 Phase 3: Long-Term Enhancements (High Effort)

### 🧾 Add Multi-Step Quote Builder for Business

* [ ] **Step 1:** Company details (size, industry).
* [ ] **Step 2:** Locations (multi-site support).
* [ ] **Step 3:** Requirements (bandwidth, SLA).
* [ ] **Step 4:** Quote generation with PDF output.
* [ ] Integrate with CRM or sales pipeline.

### 🧭 Implement Smart Lead Routing

* [ ] **Consumer leads →** auto-provision.
* [ ] **Business leads →** sales team.
* [ ] **Enterprise leads (50+ users) →** account manager assignment.

### 💬 Add Live Chat for Business

* [ ] Integrate live chat on business pages.
* [ ] During business hours → sales agent.
* [ ] After hours → chatbot + quote capture.

### 🧪 Run A/B Tests for Package Presentation

* [ ] Grid vs list view.
* [ ] Price-first vs feature-first layout.
* [ ] CTA text variants (“Get this deal” vs “Select package”).
* [ ] Test pricing phrasing (“From R399” vs fixed).

---

## 🗃️ Phase 4: Technical Implementation Tasks

### 🗄️ Database Updates

* [ ] Add new columns to `coverage_leads` table for tracking and business data.
* [ ] Create tables for `pricing_tiers`, `package_pricing`, and `pricing_addons`.

### 🧰 API Enhancements

* [ ] Extend `/api/coverage/lead` with tracking & qualification.
* [ ] Create endpoints for quote generation and business lead submission.

### 🖥️ Frontend Updates

* [ ] Update `CoverageChecker.tsx` to include progress UI and data tracking.
* [ ] Update `PackageCard` components with floating CTA logic.
* [ ] Replace hardcoded pricing with dynamic pricing fetched from backend.

---

## 🎯 Phase 5: Optimization & Analysis

* [ ] **Implement conversion tracking** for each journey step.
* [ ] **Monitor performance KPIs:**

  * Coverage → Package view rate.
  * Package → Order start rate.
  * Order → Completion rate.
* [ ] **Iterate via A/B tests** and update funnels monthly.
* [ ] **Collect qualitative feedback** from user session recordings.

---