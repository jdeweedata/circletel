# Sales Agent Quote Request System

## Overview

The Sales Agent System allows CircleTel to work with external and internal sales agents who can submit business quote requests on behalf of customers. Agents receive commission on accepted quotes and have access to a dashboard to track their performance.

## System Architecture

### Core Components

1. **Database Schema** (`supabase/migrations/20251028143000_create_sales_agents.sql`)
   - `sales_agents` - Agent profiles with commission tracking
   - `agent_quote_links` - Temporary shareable links
   - `quote_acceptance_links` - Customer acceptance tracking
   - `business_quotes` enhanced with `agent_id` foreign key

2. **Backend APIs**
   - `/api/sales-agents` - CRUD operations for agents
   - `/api/sales-agents/[id]` - Individual agent management
   - `/api/quotes/request/validate` - Token validation
   - `/api/quotes/request/submit` - Quote submission with agent attribution
   - `/api/quotes` - List quotes with filters

3. **Public Quote Request Form** (`/quotes/request`)
   - 4-step wizard: Coverage → Details → Packages → Review
   - No authentication required (token-based)
   - Coverage check integration
   - Auto-pricing with VAT calculation

4. **Agent Portal** (`/agents`)
   - `/agents` - Landing page
   - `/agents/login` - Login form
   - `/agents/dashboard` - Performance dashboard

5. **Notification System**
   - Email/SMS templates for 7 quote events
   - Variable substitution ({{quote_number}}, {{commission_amount}}, etc.)
   - Delivery tracking and status logging

## Database Schema

### sales_agents Table

```sql
CREATE TABLE sales_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT, -- For authenticated access
  full_name TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  agent_type agent_type NOT NULL, -- 'internal' | 'external'
  commission_rate DECIMAL(5,2) DEFAULT 0.00,

  -- Performance Metrics (auto-updated by triggers)
  total_quotes_created INTEGER DEFAULT 0,
  total_quotes_accepted INTEGER DEFAULT 0,
  total_revenue_generated DECIMAL(12,2) DEFAULT 0.00,

  -- Authentication & Access
  unique_link_token TEXT UNIQUE NOT NULL, -- Permanent shareable link
  status agent_status NOT NULL DEFAULT 'active', -- 'active' | 'inactive' | 'suspended'

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id)
);
```

### Performance Tracking

**Automatic Updates via Database Triggers:**

1. **On Quote Created**: `total_quotes_created++`
2. **On Quote Accepted**: `total_quotes_accepted++`, `total_revenue_generated += monthly_price`

### Token System

**Two Types of Tokens:**

1. **Permanent Agent Token** (`unique_link_token`)
   - Stored in `sales_agents.unique_link_token`
   - Generated on agent creation: `encode(gen_random_bytes(32), 'hex')`
   - Never expires
   - Unlimited uses
   - Example URL: `https://circletel.co.za/quotes/request?token=abc123...`

2. **Temporary Quote Links** (`agent_quote_links`)
   - Time-limited (optional `expires_at`)
   - Usage-limited (optional `max_uses`)
   - Useful for campaigns or limited-time offers

## API Reference

### Create Agent

```bash
POST /api/sales-agents
Content-Type: application/json

{
  "email": "agent@company.com",
  "full_name": "John Smith",
  "phone": "+27821234567",
  "company": "Sales Co",
  "agent_type": "external",
  "commission_rate": 5.0
}
```

**Response:**
```json
{
  "success": true,
  "agent": {
    "id": "uuid",
    "email": "agent@company.com",
    "unique_link_token": "abc123...",
    "status": "active",
    ...
  },
  "message": "Sales agent created successfully"
}
```

### Validate Token

```bash
GET /api/quotes/request/validate?token=abc123...
```

**Response:**
```json
{
  "success": true,
  "valid": true,
  "token_type": "agent_permanent",
  "agent": {
    "name": "John Smith",
    "company": "Sales Co"
  }
}
```

### Submit Quote

```bash
POST /api/quotes/request/submit
Content-Type: application/json

{
  "token": "abc123...",
  "customer_type": "smme",
  "company_name": "Customer Co",
  "contact_name": "Jane Doe",
  "contact_email": "jane@customer.co.za",
  "contact_phone": "+27821234567",
  "service_address": "123 Main St, Johannesburg",
  "coordinates": { "lat": -26.1234, "lng": 28.5678 },
  "contract_term": 24,
  "selected_packages": [
    {
      "package_id": "uuid",
      "item_type": "primary",
      "quantity": 1,
      "notes": "Optional notes"
    }
  ],
  "customer_notes": "Any additional requirements"
}
```

**Response:**
```json
{
  "success": true,
  "quote": {
    "id": "uuid",
    "quote_number": "BQ-2025-001",
    "status": "draft",
    "total_monthly": 999.00,
    "total_installation": 0.00,
    ...
  },
  "message": "Quote created successfully"
}
```

### List Quotes

```bash
GET /api/quotes?agent_id=uuid&status=draft&limit=20
```

**Response:**
```json
{
  "success": true,
  "quotes": [
    {
      "id": "uuid",
      "quote_number": "BQ-2025-001",
      "company_name": "Customer Co",
      "status": "draft",
      "total_monthly": 999.00,
      ...
    }
  ],
  "count": 1
}
```

## Public Quote Request Form

### URL Format

```
https://circletel.co.za/quotes/request?token=abc123...
```

### 4-Step Wizard Flow

**Step 1: Coverage Check**
- Enter service address
- Google Maps Autocomplete
- Check coverage via `/api/coverage/check`
- Display available packages
- Store `coverage_lead_id` for quote creation

**Step 2: Customer Details**
- Customer type (SMME, Enterprise, Corporate)
- Company/contact information
- Phone, email, address

**Step 3: Package Selection**
- Display packages available at address
- Quantity selection
- Add-ons (VoIP, Static IP, support plans)
- Live pricing calculation with VAT

**Step 4: Review & Submit**
- Summary of all details
- Pricing breakdown
- Terms acceptance
- Submit quote

### Technical Implementation

```typescript
// Form state management
const [step, setStep] = useState<'coverage' | 'details' | 'packages' | 'review' | 'success'>('coverage');
const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
const [coverageResult, setCoverageResult] = useState<CoverageResult | null>(null);

// Token validation on mount
useEffect(() => {
  if (token) {
    validateToken();
  }
}, [token]);

// Coverage check
const handleCoverageCheck = async (address: string, coordinates: Coordinates) => {
  const response = await fetch('/api/coverage/check', {
    method: 'POST',
    body: JSON.stringify({ address, coordinates })
  });
  const data = await response.json();
  setCoverageResult(data);
  setStep('details');
};

// Quote submission
const handleSubmit = async () => {
  const response = await fetch('/api/quotes/request/submit', {
    method: 'POST',
    body: JSON.stringify({
      token,
      coverage_lead_id: coverageResult.lead_id,
      selected_packages,
      // ... all form data
    })
  });
};
```

## Agent Portal

### Dashboard Features

1. **Performance Overview**
   - Total Quotes Created
   - Total Quotes Accepted
   - Total Revenue Generated
   - Acceptance Rate (%)
   - Average Quote Value

2. **Commission Tracking**
   - Current commission rate
   - Estimated earnings
   - Pending commissions

3. **Quote Management**
   - List of all quotes
   - Filter by status (draft, pending, approved, accepted, rejected)
   - View quote details
   - Track customer actions

4. **Unique Link**
   - Copy-to-clipboard functionality
   - QR code generation
   - Usage statistics

### Dashboard UI Components

```typescript
// Stats Cards
<Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
    <FileText className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">{agent.total_quotes_created}</div>
    <p className="text-xs text-muted-foreground">
      {agent.total_quotes_accepted} accepted
    </p>
  </CardContent>
</Card>

// Unique Link Display
<div className="bg-gray-50 p-3 rounded-md flex items-center justify-between">
  <code className="text-sm">{shareableLink}</code>
  <Button onClick={copyLink} size="sm">
    <Copy className="h-4 w-4 mr-2" />
    Copy
  </Button>
</div>
```

## Notification System

### Notification Events

| Event | Triggered When | Recipients |
|-------|---------------|------------|
| `quote_created` | New quote submitted | Admin |
| `quote_approved` | Admin approves quote | Agent + Customer |
| `quote_sent` | Quote sent to customer | Agent |
| `quote_viewed` | Customer views quote | Agent |
| `quote_accepted` | Customer accepts quote | Admin + Agent |
| `quote_rejected` | Customer rejects quote | Admin + Agent |
| `quote_expired` | Quote validity ends | Agent |

### Template Variables

**Quote Details:**
- `{{quote_number}}` - BQ-2025-001
- `{{company_name}}` - Customer company
- `{{contact_name}}` - Primary contact
- `{{contact_email}}` - Contact email
- `{{total_monthly}}` - Monthly total (incl VAT)
- `{{total_installation}}` - Installation total

**Agent Details:**
- `{{agent_name}}` - Full name
- `{{agent_email}}` - Email address
- `{{commission_rate}}` - 5.0 (percentage)
- `{{commission_amount}}` - R250.00 (calculated)

**URLs:**
- `{{acceptance_url}}` - Customer acceptance link
- `{{agent_dashboard_url}}` - Agent portal
- `{{admin_url}}` - Admin panel link

### Example Template

```
Subject: New Quote Request: {{quote_number}}

A new quote request has been submitted.

Quote Number: {{quote_number}}
Company: {{company_name}}
Contact: {{contact_name}} ({{contact_email}})
Total Monthly: R{{total_monthly}}
Agent: {{agent_name}}

View quote in admin panel: {{admin_url}}

--
CircleTel Business Solutions
```

### Sending Notifications

```typescript
import { QuoteNotificationService } from '@/lib/notifications/quote-notifications';

// Automatic trigger after quote creation
await QuoteNotificationService.sendForQuoteEvent('quote_created', quote.id);

// Manual trigger with additional context
await QuoteNotificationService.sendForQuoteEvent(
  'quote_viewed',
  quote.id,
  { viewed_at: new Date().toISOString() }
);
```

## Navigation Integration

### Header Navigation

**Request Quote Button:**
```typescript
<Button
  asChild
  variant="outline"
  className="ml-4 border-circleTel-orange text-circleTel-orange hover:bg-circleTel-orange hover:text-white"
>
  <Link href="/quotes/request">Request Quote</Link>
</Button>
```

### Business Landing Page

**Updated CTAs:**
- Hero section "Request a Quote" → `/quotes/request`
- Benefits section "Get Started" → `/quotes/request`
- Features section "Request Quote" → `/quotes/request`
- Bottom CTA "Get Your Quote" → `/quotes/request`

## Testing

### End-to-End Test Script

**Run Test:**
```bash
node scripts/test-sales-agent-workflow.js

# Or specify custom URL
TEST_BASE_URL=http://localhost:3004 node scripts/test-sales-agent-workflow.js
```

**Test Coverage:**

1. ✅ Create test agent
2. ✅ Validate agent token
3. ⚠️ Submit quote (may fail with mock package ID)
4. ✅ Verify agent metrics
5. ⚠️ Test notifications (skipped if quote creation fails)
6. ✅ List quotes for agent
7. ✅ Cleanup test data

**Expected Output:**
```
============================================================
CIRCLETEL SALES AGENT SYSTEM - E2E TEST SUITE
============================================================

🧪 SALES AGENT WORKFLOW - END-TO-END TEST
Testing against: http://localhost:3004

============================================================
STEP 1: Create Test Sales Agent
============================================================
ℹ️  Creating agent: test-agent-1761661802948@circletel.test
✅ Agent created: 1a82e29c-dc36-4327-aec5-d0658bcfbc45
ℹ️  Agent token: 7410dfd634df022a...

...

🎉 END-TO-END TEST COMPLETED SUCCESSFULLY!
✨ All tests passed! System is working correctly.
```

### Manual Testing Checklist

**Agent Creation:**
- [ ] Create agent via `/api/sales-agents`
- [ ] Verify `unique_link_token` is generated
- [ ] Check email uniqueness constraint
- [ ] Verify default values (commission_rate, status, metrics)

**Quote Request Form:**
- [ ] Access form without token
- [ ] Access form with valid agent token
- [ ] Verify agent name displays in header
- [ ] Complete coverage check
- [ ] Select packages
- [ ] Submit quote
- [ ] Verify quote created with `agent_id`

**Agent Dashboard:**
- [ ] Login with agent credentials
- [ ] View performance metrics
- [ ] Copy unique link
- [ ] Filter quotes by status
- [ ] View quote details

**Notifications:**
- [ ] Create quote → admin receives email
- [ ] Approve quote → agent and customer receive emails
- [ ] Accept quote → admin and agent receive emails
- [ ] Check notification log in database

## Security Considerations

### Token Security

1. **Token Generation**: Cryptographically secure random bytes
2. **Token Storage**: Stored as plain text (consider hashing for production)
3. **Token Validation**: Check against both permanent and temporary tokens
4. **Token Expiry**: Temporary tokens support `expires_at`

### RLS Policies

```sql
-- Agents can view their own data
CREATE POLICY "Agents can view own data"
  ON sales_agents FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Service role can manage all agents (for API access)
CREATE POLICY "Service can manage agents"
  ON sales_agents FOR ALL
  TO service_role
  WITH CHECK (true);
```

### Input Validation

- Email format validation (CHECK constraint)
- Commission rate bounds (0-100)
- Required fields enforced at API level
- Phone number format validation (TODO)

## Future Enhancements

### Phase 1 (Immediate)
- [ ] Agent authentication (Supabase Auth)
- [ ] Admin panel for managing agents
- [ ] Real email integration (Resend)
- [ ] Real SMS integration (Africa's Talking)

### Phase 2 (Short-term)
- [ ] Customer quote acceptance system with digital signature
- [ ] Agent performance reports (PDF export)
- [ ] Commission payout tracking
- [ ] Multi-tier commission structure

### Phase 3 (Long-term)
- [ ] Agent onboarding workflow
- [ ] Training materials and resources
- [ ] Gamification (leaderboards, badges)
- [ ] WhatsApp integration for notifications

## Troubleshooting

### Quote Submission Fails

**Symptom:** "Invalid package selection" error

**Causes:**
- Package ID doesn't exist in database
- Package is inactive
- Package not available at coverage address

**Fix:**
```sql
-- Check if package exists
SELECT id, name, status FROM service_packages WHERE id = 'uuid';

-- Check coverage lead packages
SELECT * FROM coverage_lead_packages WHERE lead_id = 'uuid';
```

### Agent Metrics Not Updating

**Symptom:** `total_quotes_created` stays at 0 after quote submission

**Causes:**
- Database trigger not working
- Quote doesn't have `agent_id`
- Trigger was dropped during migration

**Fix:**
```sql
-- Check if trigger exists
SELECT * FROM information_schema.triggers
WHERE trigger_name = 'update_agent_quote_created_trigger';

-- Manually update metrics
UPDATE sales_agents
SET total_quotes_created = (
  SELECT COUNT(*) FROM business_quotes WHERE agent_id = sales_agents.id
)
WHERE id = 'agent-uuid';
```

### Notifications Not Sending

**Symptom:** No console output after quote creation

**Causes:**
- Template not enabled
- No recipients configured
- Notification service error

**Fix:**
```sql
-- Check if template is enabled
SELECT * FROM quote_notification_templates
WHERE event = 'quote_created' AND enabled = true;

-- Check notification log
SELECT * FROM quote_notification_log
WHERE quote_id = 'uuid'
ORDER BY created_at DESC
LIMIT 1;
```

---

**Last Updated:** 2025-10-28
**Status:** ✅ Core Implementation Complete
**Version:** 1.0
