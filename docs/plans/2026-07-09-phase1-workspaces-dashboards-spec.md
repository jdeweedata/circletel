# WhiteLabel Phase 1.5–1.9: Workspace Dashboard Implementations

**Status**: Ready for parallel dispatch (5 independent tasks)  
**Foundation**: Phase 1.1–1.4 (workspace-auth, feature-registry roles, workspace-config)  
**Timeline**: ~30–45 min parallel execution  

---

## Task 1.5: Finance Workspace Dashboard

**Role**: Finance Manager, Accountant, Invoice Processor  
**Purpose**: Revenue visibility, cash flow, AR aging, invoice pipeline

### Scope
Create `/admin/dashboards/finance` (new page):

**Components**:
1. **KPI Cards** (4-card row)
   - Monthly Recurring Revenue (MRR) — sum of active subscriptions
   - Outstanding AR — overdue invoices > 30 days
   - Collections This Month — successful payments
   - Gross Margin % — revenue minus COGS

2. **Charts**
   - Revenue Trend (line chart, 12 months)
   - Invoice Status Breakdown (pie: Draft/Sent/Paid/Overdue/Voided)
   - AR Aging Bucket (bar: 0–30/31–60/61–90/90+)
   - Top Customers by Revenue (horizontal bar, top 5)

3. **Tables**
   - Recent Invoices (10 rows, paginated, sortable by date/status/amount)
   - Outstanding AR (searchable, filter by bucket, sort by days overdue)

**Data Sources**:
- `customer_invoices` — status, amount_due, amount_paid, created_at
- `customers` — customer name, email
- `customer_payment_methods` — payment method (Debit, Card, etc.)

**Navigation**: Finance section shows this dashboard as landing page  
**Acceptance Criteria**:
- ✅ All 4 KPI cards display real data
- ✅ Charts render without errors
- ✅ Tables support pagination & sorting
- ✅ Workspace role filtering applied (finance_manager + accountant roles)
- ✅ Type-check clean

---

## Task 1.6: Sales Workspace Dashboard

**Role**: Sales Manager, Sales Rep, Account Executive  
**Purpose**: Pipeline visibility, lead scoring, conversion metrics, deal tracking

### Scope
Create `/admin/dashboards/sales` (new page):

**Components**:
1. **KPI Cards** (4-card row)
   - Active Deals — quotes with status=pending_approval or accepted
   - Pipeline Value — sum of accepted quote amounts
   - Win Rate % — accepted / (accepted + rejected) last 90 days
   - Avg Deal Size — mean of accepted quotes

2. **Charts**
   - Deal Pipeline (funnel: Prospects→Proposals→Accepted→Completed)
   - Quote Status Breakdown (pie: Pending/Accepted/Rejected/Expired)
   - Sales by Territory (map or bar, if territory data exists)
   - Monthly Sales Trend (line chart, 6 months)

3. **Tables**
   - Active Quotes (name, value, status, days in stage, last updated)
   - Top Performers (sales rep, deals closed, value, conversion %)

**Data Sources**:
- `business_quotes` — status, amount, created_at, updated_at, sales_rep
- `customers` — customer_name, territory/segment (if available)
- `consumer_orders` — for B2C deal tracking (status, amount, created_at)

**Navigation**: Sales section shows this dashboard as landing page  
**Acceptance Criteria**:
- ✅ All 4 KPI cards display real data
- ✅ Pipeline funnel chart renders correctly
- ✅ Tables support filtering by status & date range
- ✅ Workspace role filtering applied (sales_manager, sales_rep, account_executive)
- ✅ Type-check clean

---

## Task 1.7: Operations Workspace Dashboard

**Role**: Operations Manager, Network Admin, Deployment Technician  
**Purpose**: Network health, fulfillment status, field operations capacity, inventory

### Scope
Create `/admin/dashboards/ops` (new page):

**Components**:
1. **KPI Cards** (4-card row)
   - Network Uptime % — last 30 days (from Ruijie/network-management)
   - Devices Online — count from ruijie_device_cache where status=online
   - Pending Activations — orders with status=pending_activation
   - Installation SLA Adherence % — completed on-time / total this month

2. **Charts**
   - Network Health (gauge: % uptime, color-coded)
   - Device Status (pie: Online/Offline/Maintenance)
   - Fulfillment Pipeline (bar: Received→Stock→Dispatch→Delivery→Activation)
   - Technician Utilization (bar: hours booked / available hours per tech)

3. **Tables**
   - Devices Status (device_id, location, status, last_sync, cpu/mem %)
   - Pending Installation Jobs (order_id, customer, site, scheduled_date, assigned_tech)

**Data Sources**:
- `ruijie_device_cache` — status, last_sync, cpu_usage, memory_usage, signal_strength
- `consumer_orders` — status, device_assigned_at, installation_scheduled_at
- Field ops tables (technicians, jobs, schedule) — if they exist

**Navigation**: Operations section shows this dashboard as landing page  
**Acceptance Criteria**:
- ✅ All 4 KPI cards display real data
- ✅ Network health gauge renders with color bands
- ✅ Device status and fulfillment charts render correctly
- ✅ Installation jobs table is sortable, filterable by technician & date
- ✅ Workspace role filtering applied (ops_manager, network_admin, deployment_technician)
- ✅ Type-check clean

---

## Task 1.8: Support Workspace Dashboard

**Role**: Support Manager, Support Agent, Customer Success Manager  
**Purpose**: Customer health, ticket volume, SLA tracking, escalation queue

### Scope
Create `/admin/dashboards/support` (new page):

**Components**:
1. **KPI Cards** (4-card row)
   - Open Tickets — count from zoho_desk (status=open)
   - Avg Response Time — seconds to first response (last 30 days)
   - SLA Adherence % — tickets resolved within SLA / total
   - Customer Satisfaction (CSAT) — if survey data exists, avg score last 30 days

2. **Charts**
   - Ticket Volume (line chart, tickets created/resolved/overdue, 30 days)
   - Ticket Status (pie: Open/In Progress/Resolved/Closed/Escalated)
   - Response Time Distribution (histogram: <1h / 1–4h / 4–24h / >24h)
   - Top Issues (bar: issue category, ticket count)

3. **Tables**
   - Open Tickets (ticket_id, customer, subject, status, opened_date, assigned_agent)
   - Escalation Queue (tickets escalated, reason, days open, severity)

**Data Sources**:
- Zoho Desk API / tickets table — ticket_id, status, customer_id, created_at, response_time
- `customers` — customer_name, email, account_status
- Support metrics (if tracking exists in logs)

**Navigation**: Support section shows this dashboard as landing page  
**Acceptance Criteria**:
- ✅ All 4 KPI cards display real data
- ✅ Ticket volume and status charts render correctly
- ✅ Open tickets table with agent assignment, sortable by date/priority
- ✅ Escalation queue visible with time-in-queue
- ✅ Workspace role filtering applied (support_manager, support_agent, customer_success_manager)
- ✅ Type-check clean

---

## Task 1.9: Executive Workspace Dashboard

**Role**: CEO, CFO, Product Director, Operations Director, Board Member  
**Purpose**: Strategic overview, business metrics, growth tracking, executive reporting

### Scope
Create `/admin/dashboards/executive` (new page):

**Components**:
1. **KPI Cards** (6-card row — strategic metrics)
   - Monthly Recurring Revenue (MRR)
   - Customer Count (total active)
   - Churn Rate % (last 30 days)
   - Gross Profit % (revenue - COGS / revenue)
   - Average Revenue Per User (MRR / customer_count)
   - NPS Score (if survey data exists)

2. **Charts**
   - MRR Trend (area chart, 12 months, with growth %)
   - Customer Growth (line chart, new + churn, 12 months)
   - Revenue by Segment (pie or bar: B2B/B2C/Unjani/Partners/…)
   - Geographic Distribution (map or bar: revenue by region/territory)

3. **Executive Summary Table**
   - Key metrics snapshot (MRR, customers, churn, CAC, LTV, payback period)
   - Quarter-over-quarter comparison

4. **Alerts / Red Flags**
   - MRR down month-over-month
   - Churn rate above threshold
   - Overdue AR > X threshold
   - Network uptime below SLA

**Data Sources**:
- `customers` — created_at, is_active, cancellation_date
- `customer_invoices` — amount, created_at
- `consumer_orders` — status, segment/category
- Network/uptime metrics (executive visibility into ops)
- Finance metrics (MRR, churn, margins)

**Navigation**: Executive section shows this dashboard as landing page  
**Acceptance Criteria**:
- ✅ All 6 KPI cards display real data
- ✅ MRR and growth trend charts render correctly
- ✅ Revenue by segment pie chart renders
- ✅ Executive summary table with QoQ comparison
- ✅ Red flag alerts show (color-coded)
- ✅ Workspace role filtering applied (ceo, cfo, product_director, ops_director, board_member)
- ✅ Type-check clean

---

## Shared Implementation Patterns

### Component Reuse
- **KPI Card**: Use admin's existing `StatCard` component (verify in `components/admin/layout/`)
- **Charts**: Use Recharts (already imported in admin pages)
- **Tables**: Use CircleTel admin table pattern with sorting/pagination

### Workspace Filtering
- Each dashboard imports `getWorkspaceFromAssignment()` from `lib/admin/workspace-auth.ts`
- Middleware (Phase 1.1) will gate access: `withWorkspaceAuth('finance')` etc.
- Use `getVisibleSections()` to filter nav items for each workspace

### Data Query Pattern
```typescript
// Use session-aware Supabase client
import { createSessionClient } from '@/lib/supabase/server';
const supabase = await createSessionClient();
const { data } = await supabase.from('...').select('...').eq('...', value);
```

### Navigation
- Each dashboard is linked from its workspace section in feature-registry
- URL pattern: `/admin/dashboards/{workspace}` (finance, sales, ops, support, executive)
- Dashboard pages created at `app/admin/dashboards/[workspace]/page.tsx`

### Type Safety
- Import admin types from `lib/auth/admin-api-auth.ts`
- Use Supabase generated types (`lib/supabase/database.types.ts`)
- Run `npm run type-check:memory` before commit

---

## Execution Order (Parallel Dispatch)

All 5 tasks can run in parallel:
1. **Executor 1** → Task 1.5 (Finance)
2. **Executor 2** → Task 1.6 (Sales)
3. **Executor 3** → Task 1.7 (Operations)
4. **Executor 4** → Task 1.8 (Support)
5. **Executor 5** → Task 1.9 (Executive)

Expected completion: ~30–45 min (parallel)

---

## Task 1.10: Integration Testing & Documentation (Sequential, after 1.5–1.9)

**Scope**:
- Verify all 5 dashboards display correctly
- Test workspace role filtering (finance user sees finance only, etc.)
- Type-check all dashboards clean
- Update feature-registry docs with workspace dashboard links
- Create `/admin/dashboards` landing page with workspace selector

**Acceptance Criteria**:
- ✅ All 5 dashboards type-check clean
- ✅ All 5 dashboards render without errors (manual test)
- ✅ Workspace role isolation verified (test with different roles)
- ✅ Navigation links update feature-registry
- ✅ Documentation updated in CLAUDE.md or docs/

---

**Total Phase 1 Effort**: ~2–3 hours (foundation + 5 dashboards + integration)
