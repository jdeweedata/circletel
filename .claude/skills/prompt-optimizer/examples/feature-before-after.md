# Feature Request: Before & After Examples

Examples of how the Prompt Optimizer skill transforms vague feature requests into structured, actionable prompts.

---

## Example 1: Admin Search Feature

### ❌ BEFORE (Vague)
```
Add a search feature to the admin panel
```

### ✅ AFTER (Optimized)
```markdown
## Objective
Add a global search feature to the admin panel header that allows admins to search across orders, customers, and partners with real-time results.

## Context
- **Current state**: Admin panel has separate pages for orders, customers, and partners with no unified search
- **Desired state**: Search bar in admin header that searches all entities and displays results grouped by type
- **Affected systems**: Admin UI, API routes, database queries, RBAC
- **Related files**:
  - `app/admin/layout.tsx` (header search bar)
  - `components/admin/GlobalSearch.tsx` (new component)
  - `app/api/admin/search/route.ts` (new API endpoint)

## Requirements
1. Search input in admin panel header (visible on all admin pages)
2. Real-time search across orders, customers, partners
3. Debounced API calls (300ms delay)
4. Results grouped by entity type with icons
5. Click result to navigate to detail page
6. Keyboard navigation (arrow keys, Enter to select)
7. Keyboard shortcut to open search (Ctrl+K / Cmd+K)

## Constraints
- Must respect RBAC permissions (users only see entities they have access to)
- Search query must be performant (<500ms response time)
- UI must match existing admin panel design (Tailwind + shadcn/ui)
- Must work on mobile (responsive)
- Search should index relevant fields only (not all table columns)

## Acceptance Criteria
- [ ] Search bar visible in admin header on all admin pages
- [ ] Typing triggers API call after 300ms debounce
- [ ] Results grouped by: Orders (order number, customer name), Customers (name, email), Partners (partner number, business name)
- [ ] Clicking result navigates to detail page (e.g., /admin/orders/[id])
- [ ] Empty state displays helpful message: "No results found for '[query]'"
- [ ] Loading state shows skeleton loader
- [ ] RBAC filtering applied (e.g., sales reps only see their assigned customers)
- [ ] Keyboard shortcut Ctrl+K opens search
- [ ] Arrow keys navigate results, Enter selects
- [ ] Escape key closes search
- [ ] Type check passes: `npm run type-check`
- [ ] Mobile responsive (tested on 375px width)

## CircleTel Patterns to Follow
- Use `createClient()` with service role for API route (lib/supabase/server)
- Apply RBAC filtering using `lib/rbac/permissions.ts` patterns
- Use shadcn/ui Command component for search UI
- Follow Next.js 15 async params pattern for API route
- Add to admin sidebar navigation with search icon

## Database Queries
- Orders: Search `order_number`, `first_name`, `last_name`, `email`
- Customers: Search `first_name`, `last_name`, `email`, `phone`
- Partners: Search `partner_number`, `business_name`, `contact_email`
- Use PostgreSQL `ILIKE` for case-insensitive search
- Limit results to 10 per entity type (30 total max)

## API Endpoint Specification
```typescript
// GET /api/admin/search?q=searchQuery
// Response:
{
  orders: [
    { id, order_number, customer_name, status, created_at }
  ],
  customers: [
    { id, first_name, last_name, email, created_at }
  ],
  partners: [
    { id, partner_number, business_name, status }
  ]
}
```

## Suggested Approach
1. **Create API Route** (`app/api/admin/search/route.ts`):
   - Accept `q` query parameter
   - Query orders, customers, partners tables in parallel
   - Apply RBAC filtering per user role
   - Return grouped results (limit 10 per type)

2. **Create Search Component** (`components/admin/GlobalSearch.tsx`):
   - Use shadcn/ui Command component
   - Implement debounced search (use `useDebouncedValue` hook)
   - Group results by entity type with icons
   - Handle keyboard navigation

3. **Add to Layout** (`app/admin/layout.tsx`):
   - Add search button to header (Ctrl+K badge)
   - Open Command modal on click or Ctrl+K
   - Position in header next to notifications

4. **Test RBAC Scenarios**:
   - Test as Admin (sees all results)
   - Test as Sales Rep (sees only assigned customers)
   - Test as Account Manager (sees all customers, limited orders)
   - Test as Tech Support (sees orders, no customers)

5. **Optimize Performance**:
   - Add database indexes on search columns
   - Test with large datasets (1000+ records)
   - Verify <500ms response time
```

---

## Example 2: Customer Notifications

### ❌ BEFORE (Vague)
```
Add notifications
```

### ✅ AFTER (Optimized)
```markdown
## Objective
Implement email and SMS notifications for customer order status updates using Resend (email) and Clickatell (SMS).

## Context
- **Current state**: No automated notifications when order status changes
- **Desired state**: Customers receive email + optional SMS when order status changes (payment confirmed, installation scheduled, activated)
- **Affected systems**: Orders, Notifications, Customer communication
- **Related files**:
  - `lib/notifications/email-service.ts` (new - Resend integration)
  - `lib/notifications/sms-service.ts` (new - Clickatell integration)
  - `app/api/orders/[id]/update-status/route.ts` (trigger notifications)
  - `lib/notifications/templates/` (email templates)

## Requirements
1. Email notifications for order status changes
2. Optional SMS notifications (customer can opt-in during order)
3. Notification triggers:
   - Payment confirmed
   - Installation scheduled (includes date/time)
   - Installation completed
   - Service activated (includes account number, credentials)
4. Email templates with CircleTel branding
5. SMS templates (concise, <160 characters)
6. Notification preferences stored per customer
7. Delivery status tracking (sent, delivered, failed)

## Constraints
- Use Resend for email (existing CircleTel account)
- Use Clickatell for SMS (existing CircleTel account)
- Email templates must match CircleTel brand guidelines
- SMS is optional (not all customers want SMS)
- Must handle delivery failures gracefully
- No spam (max 1 email + 1 SMS per status change)
- POPIA compliance (customers can opt-out)

## Acceptance Criteria
- [ ] Email sent when order status changes to: paid, installation_scheduled, completed, active
- [ ] SMS sent only if customer opted in
- [ ] Email uses CircleTel email template with logo, colors
- [ ] Email includes order number, customer name, status, next steps
- [ ] SMS includes order number, status, short message
- [ ] Notification delivery status tracked in database
- [ ] Failed notifications logged for retry
- [ ] Customer can opt-in/opt-out of SMS in account settings
- [ ] Type check passes: `npm run type-check`
- [ ] Test emails sent successfully on staging

## CircleTel Patterns to Follow
- Follow CLAUDE.md integration patterns
- Use environment variables for API keys
- Implement webhook signature verification (HMAC-SHA256)
- Add to `consumer_orders` table: `notification_preferences` JSONB column

## Database Changes
```sql
-- Add notification preferences to consumer_orders
ALTER TABLE consumer_orders
ADD COLUMN notification_preferences JSONB DEFAULT '{"email": true, "sms": false}';

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES consumer_orders(id),
  customer_id UUID REFERENCES customers(id),
  type TEXT CHECK (type IN ('email', 'sms')),
  event TEXT CHECK (event IN ('payment_confirmed', 'installation_scheduled', 'installation_completed', 'service_activated')),
  recipient TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  provider_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

-- Add RLS policies
CREATE POLICY "service_role_all" ON notifications
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
```

## Email Templates (Resend)
1. **Payment Confirmed**:
   - Subject: "Payment Received - Order #{{order_number}}"
   - Body: Thank you message, order summary, next steps

2. **Installation Scheduled**:
   - Subject: "Installation Scheduled - Order #{{order_number}}"
   - Body: Installation date/time, technician details, preparation instructions

3. **Installation Completed**:
   - Subject: "Installation Complete - Order #{{order_number}}"
   - Body: Service activation timeline, support contact

4. **Service Activated**:
   - Subject: "Welcome to CircleTel - Order #{{order_number}}"
   - Body: Account number, login credentials, getting started guide

## SMS Templates (Clickatell)
1. Payment: "CircleTel: Payment confirmed for order #{{number}}. Installation will be scheduled soon."
2. Scheduled: "CircleTel: Installation on {{date}} at {{time}}. Order #{{number}}"
3. Completed: "CircleTel: Installation complete! Service activating soon. Order #{{number}}"
4. Activated: "CircleTel: Service active! Account: {{account_number}}. Order #{{number}}"

## API Integration
- **Resend**: Use `resend` npm package
- **Clickatell**: Use REST API with API key authentication
- Store API keys in environment variables:
  - `RESEND_API_KEY`
  - `CLICKATELL_API_KEY`

## Suggested Approach
1. Create notification service (`lib/notifications/email-service.ts`):
   - Configure Resend client
   - Implement `sendOrderNotification(orderId, event)` function
   - Create email templates using React Email

2. Create SMS service (`lib/notifications/sms-service.ts`):
   - Configure Clickatell client
   - Implement `sendSMSNotification(orderId, event)` function
   - Use SMS templates

3. Update order status route (`app/api/orders/[id]/update-status/route.ts`):
   - After status update, trigger notifications
   - Check customer preferences
   - Send email (always) + SMS (if opted in)
   - Record notification in database

4. Create migration for notifications table:
   - Add `notification_preferences` to orders
   - Create `notifications` table
   - Add RLS policies

5. Test notification flow:
   - Create test order
   - Update status to each trigger event
   - Verify email received
   - Verify SMS received (if opted in)
   - Check notification delivery status
```

---

## Example 3: Dashboard Widget

### ❌ BEFORE (Vague)
```
Make the dashboard better
```

### ✅ AFTER (Optimized)
```markdown
## Objective
Add a "Recent Activity" widget to the customer dashboard showing the 5 most recent actions (orders, payments, support tickets) with timestamps.

## Context
- **Current state**: Customer dashboard shows static cards (services, billing, orders) but no activity feed
- **Desired state**: Dashboard includes a "Recent Activity" section showing chronological list of recent actions
- **Affected systems**: Customer dashboard, API routes
- **Related files**:
  - `app/dashboard/page.tsx` (add widget)
  - `components/dashboard/RecentActivityWidget.tsx` (new component)
  - `app/api/dashboard/activity/route.ts` (new API endpoint)

## Requirements
1. Display 5 most recent activities
2. Activity types:
   - Orders created/updated
   - Payments made
   - Support tickets opened/resolved
   - Service changes (upgrades, downgrades)
3. Each activity shows: Icon, Title, Description, Timestamp
4. Activities sorted by timestamp (newest first)
5. Clicking activity navigates to detail page
6. Real-time updates (refetch every 30 seconds)
7. Empty state if no recent activity

## Constraints
- Must respect RLS policies (customer sees only their own activity)
- Query must be performant (<200ms)
- UI must match existing dashboard cards
- Must work on mobile (responsive)
- No pagination (just 5 most recent)

## Acceptance Criteria
- [ ] Widget displays 5 most recent activities
- [ ] Activities include orders, payments, tickets, service changes
- [ ] Each activity has icon, title, description, relative timestamp ("2 hours ago")
- [ ] Clicking activity navigates to detail page
- [ ] Empty state shows helpful message
- [ ] Data refreshes every 30 seconds
- [ ] Loading state shows skeleton loader
- [ ] Type check passes: `npm run type-check`
- [ ] Mobile responsive (tested on 375px)

## CircleTel Patterns to Follow
- Use `createClientWithSession()` for API route (customer auth)
- Follow dashboard card design (shadcn/ui Card component)
- Use lucide-react icons (Package, CreditCard, MessageSquare, Settings)
- Use relative timestamps (`date-fns` formatDistanceToNow)

## API Endpoint
```typescript
// GET /api/dashboard/activity
// Response:
{
  activities: [
    {
      id: "uuid",
      type: "order" | "payment" | "ticket" | "service_change",
      title: "New Order Created",
      description: "Order #CT-2025-001 for 100Mbps Fibre",
      timestamp: "2025-11-10T10:30:00Z",
      link: "/dashboard/orders/uuid"
    },
    // ... up to 5 activities
  ]
}
```

## Suggested Approach
1. Create API route (`app/api/dashboard/activity/route.ts`):
   - Query last 5 orders, payments, tickets, service changes
   - Merge and sort by timestamp
   - Return unified activity feed

2. Create widget component (`components/dashboard/RecentActivityWidget.tsx`):
   - Fetch from `/api/dashboard/activity`
   - Use SWR with 30s revalidate interval
   - Render activity list with icons
   - Handle empty state

3. Add to dashboard page (`app/dashboard/page.tsx`):
   - Place widget in right sidebar (or below quick actions)
   - Ensure responsive layout

4. Test with different activity scenarios:
   - Customer with no activity
   - Customer with mixed activities
   - Customer with only one activity type
```

---

**Example Version**: 1.0.0
**Purpose**: Demonstrate prompt optimization for feature requests
