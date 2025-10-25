# Customer Dashboard Analysis & Recommendations

**Date:** October 25, 2025  
**Current Route:** `/dashboard`  
**Status:** ⚠️ Non-functional with placeholder data

---

## Current Issues

### 1. **Hardcoded Placeholder Data**
The dashboard displays generic placeholder data that doesn't reflect actual customer information:
- Plan: "Premium Family" (not a CircleTel product)
- Billing: "MASTERCARD ••2876" (fake card)
- Network: "090240287465" (fake ID)
- Location: "Lagos, Nigeria" (not South Africa)
- Referral link: `https://www.share.inc.referral/254163` (wrong domain)

### 2. **No Database Integration**
- No API calls to fetch real customer data
- No connection to `customers` or `customer_accounts` tables
- No order history retrieval
- No billing information from Zoho

### 3. **Generic UI Not Aligned with CircleTel Brand**
- Uses generic "Share" branding references
- Doesn't match CircleTel design system
- Missing CircleTel orange (#F5831F) primary color
- No CircleTel logo or branding elements

### 4. **Missing Critical Features**
- No real service/package information
- No actual billing history
- No order tracking integration
- No support ticket system
- No data usage tracking
- No network status monitoring

### 5. **Broken Navigation Links**
All links are placeholder `href="#"`:
- "Manage plan" → not functional
- "Change payment method" → not functional
- "Report network issue" → not functional
- "Track referrals" → not functional

---

## Recommended Architecture

### Database Schema Required

```sql
-- Customer dashboard data view
CREATE OR REPLACE VIEW customer_dashboard_summary AS
SELECT 
  c.id as customer_id,
  c.email,
  c.first_name,
  c.last_name,
  c.phone,
  
  -- Active service
  s.id as service_id,
  s.package_name,
  s.service_type,
  s.status as service_status,
  s.installation_date,
  s.monthly_price,
  
  -- Billing
  b.payment_method,
  b.last_payment_date,
  b.next_billing_date,
  b.account_balance,
  
  -- Usage (if applicable)
  u.data_used_gb,
  u.data_limit_gb,
  u.current_month_usage,
  
  -- Orders
  (SELECT COUNT(*) FROM orders WHERE customer_id = c.id) as total_orders,
  (SELECT COUNT(*) FROM orders WHERE customer_id = c.id AND status = 'pending') as pending_orders
  
FROM customers c
LEFT JOIN customer_services s ON c.id = s.customer_id AND s.active = true
LEFT JOIN customer_billing b ON c.id = b.customer_id
LEFT JOIN customer_usage u ON c.id = u.customer_id AND u.month = EXTRACT(MONTH FROM NOW());
```

### API Endpoints Needed

1. **GET `/api/dashboard/summary`**
   - Returns customer overview data
   - Service status, billing info, usage stats

2. **GET `/api/dashboard/services`**
   - List all customer services (active and inactive)
   - Package details, installation dates, status

3. **GET `/api/dashboard/billing`**
   - Billing history
   - Payment methods
   - Invoices (integrate with Zoho)

4. **GET `/api/dashboard/orders`**
   - Order history with tracking
   - Current order status

5. **GET `/api/dashboard/usage`**
   - Data usage statistics (if applicable)
   - Historical usage trends

6. **POST `/api/dashboard/support`**
   - Submit support tickets
   - Report network issues

---

## UI/UX Recommendations

### 1. **Dashboard Overview (Main Page)**

**Hero Section:**
```tsx
- Welcome message with customer name
- Quick stats cards:
  * Active Services
  * Account Balance
  * Next Billing Date
  * Support Tickets
```

**Active Services Card:**
```tsx
- Package name (e.g., "HomeFibre Connect 100")
- Service type badge (Fibre/LTE/5G/Wireless)
- Status indicator (Active/Pending/Suspended)
- Monthly price
- Installation address
- Quick actions: Upgrade, Manage, Report Issue
```

**Billing Summary Card:**
```tsx
- Current balance
- Next billing date
- Payment method (last 4 digits)
- Quick action: View Invoices, Update Payment
```

**Recent Orders Card:**
```tsx
- Last 3 orders with status
- Order tracking link
- "View All Orders" button
```

### 2. **Color Scheme (CircleTel Branding)**

```tsx
Primary: #F5831F (CircleTel Orange)
Secondary: WebAfrica Blue palette
Success: #10B981 (Green for active status)
Warning: #F59E0B (Yellow for pending)
Error: #EF4444 (Red for issues)
Neutral: Gray scale for backgrounds
```

### 3. **Navigation Structure**

```
/dashboard
  ├── Overview (main dashboard)
  ├── /services (all services)
  ├── /billing (invoices, payment history)
  ├── /orders (order history & tracking)
  ├── /kyc (document uploads)
  ├── /support (tickets, FAQs)
  └── /profile (account settings)
```

### 4. **Mobile Responsiveness**
- Stack cards vertically on mobile
- Collapsible sidebar
- Touch-friendly buttons (min 44px)
- Swipeable cards for services

### 5. **Empty States**
- No active services: CTA to browse packages
- No orders: CTA to check coverage
- No payment method: CTA to add payment

---

## Implementation Priority

### Phase 1: Critical (Week 1)
1. ✅ Create customer dashboard API endpoints
2. ✅ Fetch real customer data from database
3. ✅ Display active services with real data
4. ✅ Show billing summary with Zoho integration
5. ✅ Update branding to CircleTel colors/logo

### Phase 2: Essential (Week 2)
1. ✅ Order history and tracking
2. ✅ Payment method management
3. ✅ Invoice download (PDF from Zoho)
4. ✅ Support ticket submission
5. ✅ Profile editing

### Phase 3: Enhanced (Week 3)
1. ✅ Data usage tracking (for applicable services)
2. ✅ Network status monitoring
3. ✅ Referral program (if applicable)
4. ✅ Notifications center
5. ✅ Service upgrade flow

### Phase 4: Advanced (Week 4)
1. ✅ Real-time service status updates
2. ✅ Live chat integration
3. ✅ Bill payment gateway
4. ✅ Auto-pay setup
5. ✅ Usage alerts and notifications

---

## Specific Code Changes Needed

### 1. **Update page.tsx to fetch real data**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';

interface DashboardData {
  customer: {
    id: string;
    name: string;
    email: string;
  };
  services: Array<{
    id: string;
    package_name: string;
    service_type: string;
    status: string;
    monthly_price: number;
    installation_address: string;
  }>;
  billing: {
    account_balance: number;
    next_billing_date: string;
    payment_method: string;
  };
  orders: Array<{
    id: string;
    status: string;
    created_at: string;
    total: number;
  }>;
}

export default function DashboardPage() {
  const { user } = useCustomerAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch('/api/dashboard/summary');
        const result = await response.json();
        setData(result.data);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return <DashboardContent data={data} />;
}
```

### 2. **Create API endpoint**

```typescript
// app/api/dashboard/summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get authenticated user
  const authHeader = request.headers.get('authorization');
  // ... auth logic

  // Fetch customer data
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('auth_user_id', userId)
    .single();

  // Fetch active services
  const { data: services } = await supabase
    .from('customer_services')
    .select('*')
    .eq('customer_id', customer.id)
    .eq('active', true);

  // Fetch billing info
  const { data: billing } = await supabase
    .from('customer_billing')
    .select('*')
    .eq('customer_id', customer.id)
    .single();

  // Fetch recent orders
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })
    .limit(5);

  return NextResponse.json({
    success: true,
    data: {
      customer,
      services,
      billing,
      orders
    }
  });
}
```

### 3. **Update CircleTel Branding**

```tsx
// Replace generic colors with CircleTel brand
<div className="bg-circleTel-orange text-white">
  {/* Orange primary elements */}
</div>

<Badge className="bg-circleTel-orange">Active</Badge>

// Use CircleTel logo
<img src="/images/circletel-logo.svg" alt="CircleTel" />
```

---

## Testing Checklist

- [ ] Dashboard loads with real customer data
- [ ] Services display correct package information
- [ ] Billing shows accurate balance and payment method
- [ ] Orders list displays with correct status
- [ ] All navigation links work
- [ ] Mobile responsive layout
- [ ] Loading states display correctly
- [ ] Empty states show appropriate CTAs
- [ ] Error handling for failed API calls
- [ ] Authentication redirects work
- [ ] Logout functionality works

---

## South African Specific Considerations

1. **Currency:** Display prices in ZAR (R)
2. **Address Format:** South African address structure
3. **Phone Numbers:** SA format (+27)
4. **Load Shedding:** Show network status during outages
5. **Support Hours:** SA business hours (CAT timezone)
6. **Payment Methods:** Support SA payment gateways (Netcash, etc.)

---

## Next Steps

1. **Immediate:** Create database schema for customer dashboard data
2. **Day 1:** Build API endpoints for dashboard summary
3. **Day 2:** Replace placeholder UI with real data components
4. **Day 3:** Implement CircleTel branding
5. **Day 4:** Add order tracking integration
6. **Day 5:** Test and deploy to staging

---

## Files to Create/Modify

**New Files:**
- `app/api/dashboard/summary/route.ts`
- `app/api/dashboard/services/route.ts`
- `app/api/dashboard/billing/route.ts`
- `app/api/dashboard/orders/route.ts`
- `components/dashboard/ServiceCard.tsx`
- `components/dashboard/BillingCard.tsx`
- `components/dashboard/OrderCard.tsx`
- `components/dashboard/DashboardSkeleton.tsx`

**Modified Files:**
- `app/dashboard/page.tsx` (complete rewrite)
- `app/dashboard/layout.tsx` (update branding)
- `components/dashboard/Topbar.tsx` (CircleTel branding)
- `components/dashboard/SidebarNav.tsx` (update navigation)

**Database Migrations:**
- `supabase/migrations/YYYYMMDD_create_customer_dashboard_views.sql`
- `supabase/migrations/YYYYMMDD_create_customer_services_table.sql`
- `supabase/migrations/YYYYMMDD_create_customer_billing_table.sql`

---

## Estimated Effort

- **Backend (API + Database):** 16 hours
- **Frontend (UI Components):** 20 hours
- **Integration (Zoho, Orders):** 12 hours
- **Testing & QA:** 8 hours
- **Total:** ~56 hours (7 working days)

---

## Success Metrics

- Dashboard loads in < 2 seconds
- 100% real data (no placeholders)
- Mobile responsive on all devices
- Zero broken links
- Customer satisfaction > 90%
- Support ticket reduction by 30% (self-service)
