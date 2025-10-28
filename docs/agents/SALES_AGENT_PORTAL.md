# Sales Agent Portal - Implementation Guide

## Overview

The Sales Agent Portal is a comprehensive system that allows external and internal sales agents to:
- Create and manage business quotes
- Track performance metrics and commissions
- Share unique quote request links with customers
- View quote acceptance rates and revenue

## Architecture

### Database Schema

**Tables:**
- `sales_agents` - Agent profiles with performance tracking
- `agent_quote_links` - Temporary shareable links with usage limits
- `quote_acceptance_links` - Customer acceptance links with tracking
- `business_quotes` - Enhanced with `agent_id` foreign key

**Key Features:**
- Automatic performance tracking via database triggers
- Unique permanent link per agent (`unique_link_token`)
- Temporary links with expiry and usage limits
- Commission rate tracking per agent

### API Endpoints

**Sales Agents:**
- `GET /api/sales-agents` - List agents with filters
- `POST /api/sales-agents` - Create new agent
- `GET /api/sales-agents/[id]` - Get agent with calculated metrics
- `PATCH /api/sales-agents/[id]` - Update agent
- `DELETE /api/sales-agents/[id]` - Deactivate agent (soft delete)

**Quotes:**
- `GET /api/quotes` - List quotes with filters (agent_id, status, search)
- `POST /api/quotes/request/submit` - Submit quote (with optional agent token)
- `GET /api/quotes/request/validate` - Validate agent token

### Frontend Pages

**Public Pages:**
- `/agents` - Landing page for sales agents
- `/agents/login` - Simple email-based login (TODO: implement proper auth)
- `/quotes/request` - Public quote request form (works with or without token)

**Protected Pages:**
- `/agents/dashboard` - Main dashboard with metrics and quotes

### Navigation Integration

**Main Navigation:**
- "Request Quote" button in header (desktop & mobile)
- Links on business landing page (hero, CTA sections, package cards)

## Key Features

### 1. Performance Metrics Dashboard

**Metrics Displayed:**
- Total Quotes Created
- Quotes Accepted (with acceptance rate %)
- Total Revenue Generated (with average quote value)
- Active Quotes Count (pending states)
- Commission Rate & Estimated Earnings

**Implementation:**
```typescript
// app/agents/dashboard/page.tsx
const metrics = {
  acceptance_rate: (total_quotes_accepted / total_quotes_created) * 100,
  average_quote_value: total_revenue_generated / total_quotes_accepted,
  active_quotes_count: count of quotes in ['draft', 'pending_approval', 'approved', 'sent', 'viewed']
};
```

### 2. Quote Management

**Features:**
- View all quotes created by the agent
- Filter by status
- See customer details and amounts
- Track quote lifecycle (draft → approved → sent → viewed → accepted)

**Status Flow:**
```
draft → pending_approval → approved → sent → viewed → accepted/rejected/expired
```

### 3. Shareable Links

**Permanent Link:**
- Each agent has a unique token: `unique_link_token`
- Never expires
- Link format: `/quotes/request?token={unique_link_token}`
- Automatically tracks all quotes created via this link

**Temporary Links (Coming Soon):**
- Admin can create temporary links with:
  - Expiry date
  - Max usage count
  - Campaign tracking
- Table: `agent_quote_links`

### 4. Token-Based Attribution

**How It Works:**

1. **Agent shares link:**
   ```
   https://circletel.co.za/quotes/request?token=abc123xyz
   ```

2. **Customer fills form:**
   - Token validated via `/api/quotes/request/validate`
   - Shows agent name and company (for transparency)
   - Coverage check → package selection → quote submission

3. **Quote creation:**
   - Quote automatically linked to agent (`agent_id` set)
   - Agent's `total_quotes_created` increments (via trigger)

4. **Quote acceptance:**
   - Admin approves and sends to customer
   - Customer accepts quote
   - Agent's `total_quotes_accepted` and `total_revenue_generated` update (via trigger)

## Database Triggers

### Quote Created Trigger
```sql
CREATE OR REPLACE FUNCTION update_agent_quote_created()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.agent_id IS NOT NULL THEN
    UPDATE sales_agents
    SET total_quotes_created = total_quotes_created + 1
    WHERE id = NEW.agent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Quote Accepted Trigger
```sql
CREATE OR REPLACE FUNCTION update_agent_quote_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' AND NEW.agent_id IS NOT NULL THEN
    UPDATE sales_agents
    SET
      total_quotes_accepted = total_quotes_accepted + 1,
      total_revenue_generated = total_revenue_generated + NEW.total_monthly
    WHERE id = NEW.agent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Authentication (TODO)

**Current Implementation:**
- Simple email lookup from `sales_agents` table
- Session stored in `sessionStorage` (browser only)
- No password validation

**Planned Implementation:**
- Supabase Auth integration
- Email/password authentication
- Session management with cookies
- Password reset flow
- 2FA for security

**Security Notes:**
- Agent portal is separate from admin panel (different auth)
- Agent portal is separate from customer portal (different auth)
- Each uses its own Supabase client and session

## Commission Calculation

**Formula:**
```typescript
commission_amount = quote.total_monthly * (agent.commission_rate / 100)
```

**Example:**
- Quote monthly total: R5,000
- Agent commission rate: 5%
- Commission: R5,000 × 0.05 = R250

**Tracking:**
- Total revenue: Sum of all accepted quote `total_monthly` values
- Estimated commission: `total_revenue_generated * (commission_rate / 100)`

## Quote Request Flow

### Without Token (Public)
```
1. User visits /quotes/request
2. No token → Public form
3. Complete coverage check → package selection → details
4. Submit → Quote created with agent_id = NULL
5. Status: 'draft' (admin will follow up)
```

### With Agent Token
```
1. Agent shares link: /quotes/request?token=abc123
2. Token validated → Shows agent attribution
3. Customer completes form (same steps)
4. Submit → Quote created with agent_id set
5. Status: 'pending_approval' (auto-submitted to admin)
6. Agent sees quote in dashboard immediately
```

## Admin Workflow (TODO)

**Quote Approval:**
1. Admin views pending quotes in admin panel
2. Reviews quote details and pricing
3. Approves or rejects quote
4. If approved → Status changes to 'approved'
5. Admin sends quote to customer (email or acceptance link)

**Agent Management:**
1. Admin can create new agents
2. Set commission rates per agent
3. View agent performance
4. Activate/deactivate agents
5. Generate temporary links for campaigns

## Testing Checklist

### Agent Portal
- [ ] Landing page loads and displays correctly
- [ ] Login form validates agent email
- [ ] Dashboard shows correct metrics
- [ ] Quote list displays agent's quotes only
- [ ] Permanent link can be copied
- [ ] "New Quote" button redirects to quote form

### Quote Request Form
- [ ] Form loads without token (public)
- [ ] Form loads with valid token (shows agent info)
- [ ] Form rejects invalid/expired token
- [ ] Coverage check works
- [ ] Package selection shows available packages
- [ ] Form validation works (all required fields)
- [ ] Quote submission succeeds
- [ ] Quote appears in agent dashboard

### Performance Tracking
- [ ] Metrics update when quote is created
- [ ] Metrics update when quote is accepted
- [ ] Acceptance rate calculates correctly
- [ ] Average quote value calculates correctly
- [ ] Commission calculation is accurate

### Navigation
- [ ] "Request Quote" button in header works
- [ ] Mobile menu shows "Request Quote"
- [ ] Business page CTAs link to quote form
- [ ] All links open correct page

## File Structure

```
app/
├── agents/
│   ├── page.tsx                 # Landing page
│   ├── login/
│   │   └── page.tsx             # Login page
│   ├── dashboard/
│   │   └── page.tsx             # Main dashboard
│   └── layout.tsx               # Agents layout
├── quotes/
│   └── request/
│       └── page.tsx             # Public quote form
└── api/
    ├── sales-agents/
    │   ├── route.ts             # List & create agents
    │   └── [id]/
    │       └── route.ts         # Get/update/delete agent
    └── quotes/
        ├── route.ts             # List quotes
        └── request/
            ├── validate/
            │   └── route.ts     # Validate token
            └── submit/
                └── route.ts     # Submit quote

lib/
└── sales-agents/
    └── types.ts                 # TypeScript types

components/
├── layout/
│   └── Navbar.tsx              # Updated with "Request Quote"
└── navigation/
    └── MobileMenu.tsx          # Updated with "Request Quote"

supabase/
└── migrations/
    └── 20251028143000_create_sales_agents.sql

docs/
└── agents/
    └── SALES_AGENT_PORTAL.md  # This file
```

## Next Steps

### High Priority
1. **Implement proper authentication** - Supabase Auth for agents
2. **Build admin panel** - Manage agents, approve quotes
3. **Add client acceptance system** - Digital signature, acceptance links
4. **Implement notifications** - Email/SMS for quote events

### Medium Priority
5. **Create temporary links UI** - Campaign tracking, usage limits
6. **Add quote detail page** - Full view of quote with all items
7. **Commission reports** - Export agent performance data
8. **Quote PDF generation** - Automated PDF creation for approved quotes

### Low Priority
9. **Analytics dashboard** - Charts and graphs for agent performance
10. **Team management** - Hierarchical agent structure
11. **CRM integration** - Sync with Zoho or other CRM
12. **Mobile app** - Native iOS/Android apps for agents

## Environment Variables

No new environment variables required - uses existing Supabase configuration:

```env
NEXT_PUBLIC_SUPABASE_URL=https://agyjovdugmtopasyvlng.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
SUPABASE_SERVICE_ROLE_KEY=<key>
```

## Security Considerations

1. **Token Security:**
   - Tokens are 64-character random hex strings
   - Stored in database, not in URLs permanently
   - Validate on every request

2. **Data Access:**
   - Agents can only see their own quotes
   - Admin approval required for quote progression
   - RLS policies enforce data isolation

3. **Authentication:**
   - Current: Email-only (dev/testing)
   - Future: Full Supabase Auth with passwords
   - Consider 2FA for sensitive agent accounts

4. **Commission Tracking:**
   - Database triggers ensure accuracy
   - No manual editing of performance metrics
   - Audit trail via created_at/updated_at timestamps

---

**Last Updated:** 2025-10-28
**Status:** ✅ Core Implementation Complete
**Version:** 1.0
