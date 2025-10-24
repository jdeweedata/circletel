# Orchestrator Test: Commission Tracking Journey

**Date**: 2025-10-20
**Feature**: Commission Tracking for Sales Partners
**Source**: Circle Tel BRS (Section 4.9.3)

---

## Task Analysis

### User Request
```
Implement the Commission Tracking Journey for Sales Partners

Requirements:
- Sales partners need full transparency in commission process
- Detailed view of commissions with breakdown (sales/referrals)
- Status of pending payouts
- Historical record of all past commissions
- Track performance over time

User Story: As a sales partner, I want a clear and detailed view of my commissions,
ensuring I understand my earnings and can track any due payouts.
```

---

## Orchestrator Decision Matrix

### 1. Intent Detection
**Primary Intent**: Feature Implementation
**Secondary Intent**: Full-stack development (database + API + UI)
**Keywords Matched**: "implement", "commission tracking", "sales partners", "view", "historical record"

### 2. Layer Detection
**Layers Identified** (3 layers):
1. **Database Layer**:
   - Commission records table
   - Sales partner relationship
   - Commission status (pending/paid)
   - Transaction history

2. **Backend Layer**:
   - Commission calculation logic
   - API endpoints for commission queries
   - Payout status management
   - Performance analytics aggregation

3. **Frontend Layer**:
   - Commission dashboard component
   - Historical data visualization (charts)
   - Breakdown by category (sales/referrals)
   - Pending payout tracking

### 3. Complexity Scoring
**Complexity**: **MEDIUM-COMPLEX**

| Factor | Assessment | Score |
|--------|------------|-------|
| Layers | 3 (DB + API + UI) | Medium |
| Files Affected | 10-15 files | Medium |
| Business Logic | Commission calculation | Medium |
| Time Estimate | 90-120 minutes | Medium |
| Agent Count | 1-2 agents | Medium |

**Reasoning**:
- Not a simple CRUD (requires calculations and analytics)
- Involves financial data (requires precision)
- Historical tracking (data aggregation)
- Performance over time (requires charting)
- RBAC enforcement (sales partner role)

### 4. Agent Selection

**Primary Agent**: `full-stack-dev`

**Rationale**:
- Complete feature (database + backend + frontend)
- Standard CircleTel patterns (RBAC, Next.js, Supabase)
- Fits within 90-120 minute timeframe
- Single cohesive feature (no need for multiple specialists)

**Supporting Agents** (sequential):
- None initially (full-stack-dev handles all layers)
- `testing-agent` (after implementation)
- `documentation-agent` (after testing)

---

## Workflow Plan

### **Workflow Template**: Complete Feature
Using orchestrator's pre-built `complete_feature` template

### Phase 1: Planning (15 minutes)
**Agent**: `full-stack-dev`
**Tasks**:
- [ ] Analyze commission tracking requirements
- [ ] Identify database tables needed
  - `commissions` table
  - `commission_transactions` table (if needed)
  - Relationship with `admin_users` (sales partners)
- [ ] Design API endpoints
  - `GET /api/sales-partners/commissions` - List commissions
  - `GET /api/sales-partners/commissions/:id` - Get specific commission
  - `GET /api/sales-partners/commissions/analytics` - Performance data
- [ ] Sketch component hierarchy
  - `CommissionDashboard.tsx` (main container)
  - `CommissionsList.tsx` (table view)
  - `CommissionBreakdown.tsx` (charts)
  - `PendingPayouts.tsx` (pending transactions)
- [ ] Identify RBAC permissions
  - `PERMISSIONS.COMMISSIONS.VIEW` (sales partner can view own)
  - `PERMISSIONS.COMMISSIONS.MANAGE` (admin can view all)
  - `PERMISSIONS.COMMISSIONS.APPROVE_PAYOUT` (finance manager)

**Output**: Implementation plan with file list

---

### Phase 2: Database (20 minutes)
**Agent**: `full-stack-dev` (database layer)
**Tasks**:
- [ ] Create migration `20251020000001_create_commission_tracking.sql`
- [ ] Define `commissions` table schema:
  ```sql
  CREATE TABLE commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_partner_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,

    -- Commission Details
    commission_type TEXT NOT NULL CHECK (commission_type IN ('sale', 'referral', 'renewal')),
    order_id UUID REFERENCES orders(id),
    customer_id UUID REFERENCES customers(id),

    -- Financial Details
    base_amount DECIMAL(10, 2) NOT NULL,
    commission_rate DECIMAL(5, 2) NOT NULL,
    commission_amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'ZAR',

    -- Status
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
    approved_by UUID REFERENCES admin_users(id),
    approved_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,

    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [ ] Add RLS policies:
  ```sql
  -- Sales partners can view own commissions
  CREATE POLICY "sales_partners_view_own_commissions"
    ON commissions FOR SELECT
    USING (
      sales_partner_id = auth.uid()
      AND
      EXISTS (
        SELECT 1 FROM admin_users
        WHERE id = auth.uid()
        AND role_template_id IN (
          SELECT id FROM role_templates
          WHERE name = 'Sales Representative'
        )
      )
    );

  -- Finance managers can view all
  CREATE POLICY "finance_managers_view_all_commissions"
    ON commissions FOR SELECT
    USING (user_has_permission('commissions:manage'));

  -- Only finance can update status
  CREATE POLICY "finance_managers_update_status"
    ON commissions FOR UPDATE
    USING (user_has_permission('commissions:approve_payout'))
    WITH CHECK (user_has_permission('commissions:approve_payout'));
  ```
- [ ] Add indexes for performance:
  ```sql
  CREATE INDEX idx_commissions_sales_partner ON commissions(sales_partner_id);
  CREATE INDEX idx_commissions_status ON commissions(status);
  CREATE INDEX idx_commissions_created_at ON commissions(created_at DESC);
  ```
- [ ] Test migration in Supabase Dashboard

**Output**: Working database schema with RLS

---

### Phase 3: Backend (30 minutes)
**Agent**: `full-stack-dev` (backend layer)
**Tasks**:
- [ ] Create `/app/api/sales-partners/commissions/route.ts`
  - GET handler: List commissions (paginated)
  - Query params: `?status=pending&page=1&limit=20`
  - Permission check: `PERMISSIONS.COMMISSIONS.VIEW`
  - Response: Array of commissions with metadata

- [ ] Create `/app/api/sales-partners/commissions/analytics/route.ts`
  - GET handler: Performance analytics
  - Aggregations:
    - Total commissions (all time)
    - Total commissions (this month)
    - Total commissions (last 30 days)
    - Breakdown by type (sales/referrals)
    - Pending amount
    - Paid amount
  - Permission check: `PERMISSIONS.COMMISSIONS.VIEW`

- [ ] Create `/app/api/sales-partners/commissions/[id]/route.ts`
  - GET handler: Get specific commission details
  - Permission check: Sales partner can only access own
  - Response: Commission with related order/customer data

- [ ] Create `/app/api/admin/commissions/approve/route.ts`
  - POST handler: Approve pending payout
  - Permission check: `PERMISSIONS.COMMISSIONS.APPROVE_PAYOUT`
  - Updates status to 'approved', sets approved_by and approved_at
  - Sends notification to sales partner

- [ ] Add TypeScript types in `/lib/types/commission-types.ts`:
  ```typescript
  export type CommissionType = 'sale' | 'referral' | 'renewal';
  export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'cancelled';

  export interface Commission {
    id: string;
    sales_partner_id: string;
    commission_type: CommissionType;
    order_id?: string;
    customer_id?: string;
    base_amount: number;
    commission_rate: number;
    commission_amount: number;
    currency: string;
    status: CommissionStatus;
    approved_by?: string;
    approved_at?: string;
    paid_at?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
  }

  export interface CommissionAnalytics {
    total_all_time: number;
    total_this_month: number;
    total_last_30_days: number;
    pending_amount: number;
    paid_amount: number;
    breakdown_by_type: {
      sale: number;
      referral: number;
      renewal: number;
    };
  }
  ```

- [ ] Test API endpoints with Postman/Thunder Client

**Output**: Working API routes with validation

---

### Phase 4: Frontend (40 minutes)
**Agent**: `full-stack-dev` (frontend layer)
**Tasks**:
- [ ] Create `/app/sales-partners/commissions/page.tsx` (main page)
  ```tsx
  'use client';

  import { CommissionDashboard } from '@/components/sales-partners/CommissionDashboard';
  import { PermissionGate } from '@/components/rbac/PermissionGate';
  import { PERMISSIONS } from '@/lib/rbac/permissions';

  export default function CommissionsPage() {
    return (
      <PermissionGate permissions={[PERMISSIONS.COMMISSIONS.VIEW]}>
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold mb-6">Commission Tracking</h1>
          <CommissionDashboard />
        </div>
      </PermissionGate>
    );
  }
  ```

- [ ] Create `/components/sales-partners/CommissionDashboard.tsx`
  - Fetch analytics data
  - Display summary cards (total, pending, paid)
  - Commission breakdown chart (Recharts)
  - Commissions list table
  - Filter controls (status, date range, type)

- [ ] Create `/components/sales-partners/CommissionsList.tsx`
  - Data table with columns: Date, Type, Order, Amount, Status
  - Pagination controls
  - Sort by date (newest first)
  - Status badges (color-coded)
  - Click row to view details

- [ ] Create `/components/sales-partners/CommissionBreakdown.tsx`
  - Pie chart for commission types (Recharts)
  - Bar chart for monthly performance (Recharts)
  - Responsive design

- [ ] Create `/components/sales-partners/PendingPayouts.tsx`
  - List of pending commissions
  - Total pending amount displayed prominently
  - Expected payout date (if available)

- [ ] Create `/hooks/use-commissions.ts` (React Query)
  ```typescript
  export function useCommissions(filters: CommissionFilters) {
    return useQuery({
      queryKey: ['commissions', filters],
      queryFn: () => fetchCommissions(filters),
    });
  }

  export function useCommissionAnalytics() {
    return useQuery({
      queryKey: ['commission-analytics'],
      queryFn: fetchCommissionAnalytics,
    });
  }
  ```

- [ ] Style with Tailwind CSS (CircleTel design system)
  - Primary: `circleTel-orange`
  - Status colors: Green (paid), Yellow (pending), Gray (cancelled)

- [ ] Add loading skeletons for better UX

**Output**: Working commission tracking UI

---

### Phase 5: Integration & Testing (15 minutes)
**Agent**: `full-stack-dev`
**Tasks**:
- [ ] Test complete flow:
  1. Sales partner logs in
  2. Navigates to `/sales-partners/commissions`
  3. Sees commission dashboard with analytics
  4. Views list of commissions
  5. Filters by pending status
  6. Clicks on a commission to see details
  7. Verifies historical data shows correctly

- [ ] Test RBAC:
  - Sales partner can only see own commissions
  - Finance manager can see all commissions
  - Regular users cannot access commission page

- [ ] Test edge cases:
  - No commissions yet (empty state)
  - Large dataset (pagination)
  - Different date ranges (filtering)

- [ ] Run TypeScript validation:
  ```bash
  npm run type-check
  ```

- [ ] Verify no console errors in browser

**Output**: Fully integrated and tested feature

---

## Quality Gates

### 1. TypeScript Validation ✅
```bash
npm run type-check
# Expected: 0 errors in new code
```

### 2. RBAC Enforcement ✅
- [x] PermissionGate used in `/sales-partners/commissions/page.tsx`
- [x] Permission checks in all API routes
- [x] RLS policies enforce database-level security

### 3. Error Handling ✅
- [x] Try-catch blocks in API routes
- [x] User-friendly error messages in UI
- [x] Loading states while fetching data

### 4. Design System Compliance ✅
- [x] CircleTel colors used (`circleTel-orange`)
- [x] Tailwind spacing scale (4px increments)
- [x] shadcn/ui components (Table, Card, Button)
- [x] Recharts for data visualization

### 5. Performance ✅
- [x] Database indexes on frequently queried columns
- [x] Pagination for large datasets
- [x] React Query caching (5-minute stale time)

---

## Handoff Plan

### To Testing Agent
**After Phase 5 Complete**:
- Generate unit tests for commission calculation logic
- Generate integration tests for API endpoints
- Generate E2E tests with Playwright:
  - Test: Sales partner views commissions
  - Test: Filter by status
  - Test: View commission details

### To Documentation Agent
**After Testing Complete**:
- Generate API documentation (`/docs/api/COMMISSION_TRACKING_API.md`)
- Generate user guide (`/docs/features/COMMISSION_TRACKING_USER_GUIDE.md`)
- Update admin documentation with new permission

### To Code Reviewer (Skill)
**After Documentation Complete**:
- Review code quality
- Verify RBAC enforcement
- Validate CircleTel standards compliance
- Check for security vulnerabilities

---

## Success Criteria

- ✅ Sales partners can view their commission history
- ✅ Breakdown by commission type (sales/referrals/renewals)
- ✅ Pending payouts clearly displayed
- ✅ Performance analytics over time (charts)
- ✅ RBAC enforced at all 3 layers (UI, API, database)
- ✅ TypeScript validation passes
- ✅ No console errors
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ CircleTel design system applied

---

## Estimated Timeline

| Phase | Duration | Agent |
|-------|----------|-------|
| Planning | 15 min | full-stack-dev |
| Database | 20 min | full-stack-dev |
| Backend | 30 min | full-stack-dev |
| Frontend | 40 min | full-stack-dev |
| Integration | 15 min | full-stack-dev |
| **Total** | **120 min** | **1 agent** |

**Additional Time** (Sequential):
- Testing: 30 min (testing-agent)
- Documentation: 20 min (documentation-agent)
- Code Review: 15 min (code-reviewer skill)

**Grand Total**: **185 minutes (~3 hours)**

---

## Files to be Created/Modified

### New Files (12):
1. `/supabase/migrations/20251020000001_create_commission_tracking.sql`
2. `/lib/types/commission-types.ts`
3. `/lib/rbac/permissions.ts` (add `PERMISSIONS.COMMISSIONS.*`)
4. `/app/api/sales-partners/commissions/route.ts`
5. `/app/api/sales-partners/commissions/analytics/route.ts`
6. `/app/api/sales-partners/commissions/[id]/route.ts`
7. `/app/api/admin/commissions/approve/route.ts`
8. `/app/sales-partners/commissions/page.tsx`
9. `/components/sales-partners/CommissionDashboard.tsx`
10. `/components/sales-partners/CommissionsList.tsx`
11. `/components/sales-partners/CommissionBreakdown.tsx`
12. `/components/sales-partners/PendingPayouts.tsx`
13. `/hooks/use-commissions.ts`

### Modified Files (2):
1. `/components/admin/layout/Sidebar.tsx` (add "Commissions" menu item for sales partners)
2. `/lib/rbac/permissions.ts` (add commission permissions)

---

## Conclusion

**Orchestrator Decision**: ✅ **Approved for Implementation**

**Primary Agent**: `full-stack-dev`
**Complexity**: Medium
**Estimated Time**: 120 minutes
**Quality Gates**: 5 (TypeScript, RBAC, Errors, Design, Performance)
**Success Probability**: High (follows standard CircleTel patterns)

**Next Action**: Hand off to `full-stack-dev` agent to begin Phase 1 (Planning)
