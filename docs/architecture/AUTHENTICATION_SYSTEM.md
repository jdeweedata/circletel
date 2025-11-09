# CircleTel Authentication & Data Retrieval Architecture

**Version**: 2.0
**Last Updated**: 2025-11-09
**Status**: Production

## Overview

CircleTel's authentication and data retrieval system uses a robust, **three-context structure** that separates consumer customer, partner, and admin flows, leveraging Supabase's Auth, Row Level Security (RLS), and Role-Based Access Control (RBAC) for high security and scalable user management.

## Table of Contents

1. [Consumer Customer Auth Flow](#consumer-customer-auth-flow)
2. [Partner Auth Flow](#partner-auth-flow)
3. [Admin Backend Auth Flow](#admin-backend-auth-flow)
4. [Integration Patterns & Security](#integration-patterns--security)
5. [User Journey Examples](#user-journey-examples)
6. [Practical Code Patterns](#practical-code-patterns)
7. [Key Takeaways](#key-takeaways)

---

## Consumer Customer Auth Flow

### Sign Up

**Flow**: Browser → `CustomerAuthService.signUp()` → `supabase.auth.signUp()` → Verification Email

**Process**:
1. Customer initiates sign-up on the browser
2. Triggers `CustomerAuthService.signUp()` which calls `supabase.auth.signUp()`
3. Supabase creates an `auth.users` record and sends verification email
4. Backend API (`/api/auth/create-customer`) uses service role key to insert customer record
5. Service role bypasses RLS and supports retry logic to handle timing conflicts

**Why Service Role?**
RLS policies require an authenticated UID (not available until sign-up finishes), so we use the service role to bypass RLS temporarily.

**Key Files**:
- `lib/auth/customer-auth-service.ts` - Client-side sign-up logic
- `app/api/auth/create-customer/route.ts` - Server-side customer record creation

### Sign In

**Flow**: Browser → `supabase.auth.signInWithPassword()` → Session/Token → Load Customer Context

**Process**:
1. Client uses `supabase.auth.signInWithPassword()` with anon key
2. Validates credentials and returns session/token
3. Session stored securely in httpOnly, secure cookies
4. Client looks up customer record via `auth_user_id`
5. Loads user, session, and customer state into context providers

**Session Storage**:
- **Cookies**: httpOnly, secure, SameSite=Lax
- **Auto-refresh**: Supabase handles token expiry transparently
- **Context Provider**: `CustomerAuthProvider` loads session on each app load

**Key Files**:
- `components/providers/CustomerAuthProvider.tsx` - Client-side auth context
- `lib/auth/session-utils.ts` - Session management utilities

### Session Handling

**Mechanism**: httpOnly cookies + Auto-refresh

**Features**:
- Secure httpOnly cookies prevent XSS attacks
- Supabase auto-refreshes access tokens
- Handles expiry transparently
- Context provider (`CustomerAuthProvider`) loads session on app initialization

**Security**:
- Tokens never exposed to JavaScript (httpOnly)
- HTTPS-only in production
- SameSite cookie protection
- Automatic rotation on refresh

### Data Retrieval

**Flow**: Client Request → Authorization Header → API Validation → RLS Query → Customer Data

**Process**:
1. Customer requests pass access token in HTTP Authorization header
2. API validates token using `supabase.auth.getUser(token)`
3. Retrieves customer ID from validated session
4. Fetches related tables (`customer_services`, `customer_billing`) using RLS-protected queries
5. Only authenticated customer's data is returned

**Example**:
```typescript
// Client side
const response = await fetch('/api/dashboard/summary', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  }
})

// Server side (API route)
const token = request.headers.get('authorization')?.split(' ')[1]
const { data: { user } } = await supabase.auth.getUser(token)
const { data: customer } = await supabase
  .from('customers')
  .select('*')
  .eq('auth_user_id', user.id)
  .single()
```

**Key Files**:
- `app/api/dashboard/summary/route.ts` - Dashboard data API
- `app/api/dashboard/services/route.ts` - Services data API

---

## Partner Auth Flow

### Registration & Onboarding

**Flow**: Browser → Partner Registration → FICA/CIPC Document Upload → Admin Review → Partner Approval

**Process**:
1. Partner initiates registration at `/partners/onboarding`
2. Submits business details, banking info, compliance documents
3. System creates `auth.users` record via `supabase.auth.signUp()`
4. Backend API creates partner record in `partners` table with service role
5. Partner uploads 13 FICA/CIPC compliance documents to Supabase Storage
6. Admin reviews and approves partner (`compliance_status`: `incomplete` → `submitted` → `under_review` → `verified`)

**Business Type Requirements**:
- **Sole Proprietor**: 5 required, 2 optional documents
- **Company**: 11 required, 1 optional documents
- **Partnership**: 7 required, 2 optional documents

**Key Files**:
- `app/partners/onboarding/page.tsx` - Registration form
- `app/partners/onboarding/verify/page.tsx` - Document upload UI
- `app/api/partners/compliance/upload/route.ts` - File upload to Supabase Storage
- `lib/partners/compliance-requirements.ts` - Document requirements logic (452 lines)

### Sign In

**Flow**: Browser → `supabase.auth.signInWithPassword()` → Session/Token → Load Partner Context

**Process**:
1. Partner uses `supabase.auth.signInWithPassword()` with anon key
2. Validates credentials and returns session/token
3. Session stored in httpOnly, secure cookies
4. Client looks up partner record via `auth_user_id`
5. Loads partner profile, compliance status, and leads into context
6. Context provider (`PartnerAuthProvider`) manages partner state

**Session Storage**:
- **Cookies**: httpOnly, secure, SameSite=Lax
- **Auto-refresh**: Supabase handles token expiry
- **Context Provider**: `PartnerAuthProvider` loads session on app initialization

**Key Files**:
- `components/providers/PartnerAuthProvider.tsx` - Partner auth context
- `app/partners/login/page.tsx` - Partner login page

### Session Handling

**Mechanism**: httpOnly cookies + Auto-refresh (similar to customer flow)

**Features**:
- Secure httpOnly cookies prevent XSS attacks
- Supabase auto-refreshes access tokens
- Partner-specific context provider loads session
- Separated from customer and admin contexts

**Partner-Specific Context**:
- Partner profile (`partner_number`, `compliance_status`, `tier`)
- Assigned leads and commissions
- Document upload progress
- Commission tracking

### Data Retrieval

**Flow**: Client Request → Authorization Header → API Validation → RLS Query → Partner Data

**Process**:
1. Partner requests pass access token in HTTP Authorization header
2. API validates token using `supabase.auth.getUser(token)`
3. Retrieves partner ID from validated session
4. Fetches related tables (`partner_compliance_documents`, `partner_leads`, `partner_commissions`) using RLS-protected queries
5. Only authenticated partner's data is returned

**Example**:
```typescript
// Client side
const response = await fetch('/api/partners/leads', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  }
})

// Server side (API route)
const token = request.headers.get('authorization')?.split(' ')[1]
const { data: { user } } = await supabase.auth.getUser(token)
const { data: partner } = await supabase
  .from('partners')
  .select('*')
  .eq('auth_user_id', user.id)
  .single()

// RLS ensures only partner's leads are returned
const { data: leads } = await supabase
  .from('partner_leads')
  .select('*')
  .eq('partner_id', partner.id)
```

**RLS Policies (4 total)**:
1. Partners upload own documents (INSERT)
2. Partners view own documents (SELECT)
3. Partners delete own unverified documents (DELETE)
4. Admins access all documents (ALL)

**Key Files**:
- `app/api/partners/leads/route.ts` - Partner leads API
- `app/api/partners/compliance/route.ts` - Compliance documents API
- `supabase/migrations/*_partner_rls_policies.sql` - RLS policies

### Compliance & Document Management

**Document Categories (13 total)**:
- **FICA**: Identity Document, Proof of Address
- **CIPC**: Registration Certificate (CK1), Company Profile, Directors (CM1), Memorandum of Incorporation (MOI)
- **SARS**: Tax Clearance Certificate, VAT Registration
- **Banking**: Bank Confirmation Letter, Bank Statement
- **Business**: Business Proof of Address, Letter of Authorization

**Storage Structure**:
```
partner-compliance-documents/
  {partner_id}/
    identity_document/
      {timestamp}_{filename}.pdf
    cipc_registration/
      {timestamp}_{filename}.pdf
    ...
```

**Compliance Status Flow**:
```
incomplete → submitted → under_review → verified
                                     ↓
                                  rejected
```

**Partner Number Format**: `CTPL-YYYY-NNN` (e.g., `CTPL-2025-001`)

**Key Files**:
- `app/partners/dashboard/page.tsx` - Partner dashboard
- `components/partners/ComplianceUploadForm.tsx` - Document upload component
- `lib/partners/compliance-requirements.ts` - Requirements validation

---

## Admin Backend Auth Flow

### Login

**Flow**: Browser → Validate Credentials → RBAC Check → `supabase.auth.signIn()` → Session Setup

**Process**:
1. Validate credentials against `admin_users` table
2. Check role, `is_active` status, and granular permissions
3. Only then perform Supabase Auth sign-in
4. Set session cookies and store login details in localStorage
5. Two Supabase clients:
   - **Cookie client**: SSR cookie management
   - **Service role client**: Unrestricted table access + RBAC checks

**RBAC Validation**:
```typescript
// Check if admin has required permission
const hasPermission = admin.permissions.includes('orders:read')
if (!hasPermission) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

**Key Files**:
- `app/api/auth/admin/login/route.ts` - Admin login endpoint
- `lib/rbac/permissions.ts` - Permission definitions
- `hooks/useAdminAuth.ts` - Client-side auth hook

### Session Handling

**Dual Storage Pattern**:
1. **Cookies**: Secure SSR context management
2. **localStorage**: Client-side role/permission management

**Session Validation**:
- Middleware intercepts admin page loads
- Validates session using cookies
- Redirects unauthenticated users to login page
- Loads admin permissions from localStorage

**Key Files**:
- `middleware.ts` - Route protection
- `components/providers/AdminAuthProvider.tsx` - Admin context provider

### Data Retrieval

**Flow**: Client Request → Session Validation → RBAC Filtering → Service Role Query → Admin Data

**Process**:
1. Admin API route validates session (cookies)
2. RBAC filtering based on admin's role and permissions
3. Service role queries bypass RLS for global data access
4. Endpoint-level checks enforce RBAC for least-privilege access

**Example**:
```typescript
// API route with RBAC
export async function GET(request: NextRequest) {
  // 1. Validate session
  const supabase = await createClientWithSession()
  const { data: { session } } = await supabase.auth.getSession()

  // 2. Get admin user with permissions
  const { data: admin } = await supabase
    .from('admin_users')
    .select('*, permissions')
    .eq('email', session.user.email)
    .single()

  // 3. RBAC check
  if (!admin.permissions.includes('orders:read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 4. Service role query (bypasses RLS)
  const serviceSupabase = await createClient() // Service role
  const { data: orders } = await serviceSupabase
    .from('consumer_orders')
    .select('*')

  return NextResponse.json(orders)
}
```

**Key Files**:
- `app/api/admin/orders/route.ts` - Orders management API
- `app/api/admin/dashboard/route.ts` - Dashboard stats API
- `lib/supabase/server.ts` - Server-side Supabase clients

---

## Integration Patterns & Security

### RLS & RBAC Enforcement

**Customer Tables (RLS)**:
- All customer-facing tables use RLS policies based on `auth.uid()`
- Ensures customers only see their own data
- Policies defined in Supabase migrations

**Example RLS Policy**:
```sql
-- Customers can only view their own services
CREATE POLICY "Customers can view own services"
ON customer_services
FOR SELECT
USING (auth.uid() = auth_user_id);
```

**Admin Tables (RBAC)**:
- Admin tables have RLS policies allowing only active admins
- RBAC controls data visibility per role
- Endpoint-level permission checks

**Example RBAC Check**:
```typescript
// Permission-based access control
const requiredPermissions = ['orders:read', 'orders:update']
const hasAccess = requiredPermissions.every(perm =>
  admin.permissions.includes(perm)
)
```

**Key Files**:
- `supabase/migrations/*_rls_policies.sql` - RLS policy definitions
- `lib/rbac/role-templates.ts` - 17 role templates with permissions

### Session Security

**Features**:
- **httpOnly Cookies**: Prevent XSS attacks
- **Secure Flag**: HTTPS-only in production
- **SameSite**: CSRF protection
- **Token Rotation**: Automatic on refresh
- **Expiry Handling**: Transparent auto-refresh

**Cookie Configuration**:
```typescript
{
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/'
}
```

**localStorage for Admin**:
- Stores admin role and permissions
- Synced on login/logout
- Used for client-side UI permission checks
- Never stores sensitive tokens

### Audit Logging and Timeout Protection

**Audit Logging**:
- Admin logins trigger asynchronous writes to audit tables
- Two audit tables for comprehensive action tracking:
  1. `admin_login_logs` - Login attempts (success/failure)
  2. `service_action_log` - Service-related admin actions

**Example**:
```typescript
// Log admin action
await supabase.from('service_action_log').insert({
  admin_id: admin.id,
  action: 'service_suspension',
  service_id: serviceId,
  details: { reason: 'Non-payment' },
  ip_address: request.headers.get('x-forwarded-for')
})
```

**Timeout Protection**:
- All API queries include timeout logic (30s default)
- Prevent hanging requests
- Graceful error handling if data is missing
- Policy breach detection

**Example**:
```typescript
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Request timeout')), 30000)
)

const result = await Promise.race([
  supabase.from('table').select('*'),
  timeoutPromise
])
```

---

## User Journey Examples

### Customer Flow

| Step | Browser → Middleware → API Route → Supabase | Security |
|------|---------------------------------------------|----------|
| Sign Up | Browser → API (`/api/auth/create-customer`) → Service Role Insert | Service role bypasses RLS for initial insert |
| Sign In | Browser → `supabase.auth.signInWithPassword()` → Session Cookies | Token in httpOnly cookie |
| Data Fetch | Browser → API with Authorization header → RLS Query | Only customer's data returned |
| Session Refresh | Browser → `supabase.auth.refreshSession()` → New Token | Automatic rotation |

### Partner Flow

| Step | Browser → Middleware → API Route → Supabase | Security |
|------|---------------------------------------------|----------|
| Registration | Browser → `/partners/onboarding` → Service Role Creates Partner Record | Service role bypasses RLS |
| Document Upload | Browser → Storage API → Supabase Storage (private bucket) | RLS: partners upload own docs |
| Sign In | Browser → `supabase.auth.signInWithPassword()` → Session Cookies | Token in httpOnly cookie |
| Data Fetch | Browser → API with Authorization header → RLS Query | Only partner's data returned |
| Compliance Check | Browser → API → Fetch documents + status → Calculate progress | RLS enforced per partner |

### Admin Flow

| Step | Browser → Middleware → API Route → Supabase | Security |
|------|---------------------------------------------|----------|
| Login | Browser → Validate `admin_users` → RBAC Check → Session Setup | Dual storage (cookies + localStorage) |
| Page Access | Browser → Middleware validates cookies → Redirect if unauthenticated | Route protection |
| Data Fetch | Browser → API validates session → RBAC filtering → Service role query | RBAC enforced, broad access |
| Action | Browser → API → RBAC check → Action → Audit log | Comprehensive tracking |

---

## Practical Code Patterns

### Supabase Client Creation

**Client-Side (RLS Enforced)**:
```typescript
import { createClient } from '@/lib/supabase/client'

// Anonymous client with RLS
const supabase = createClient()
const { data } = await supabase
  .from('customer_services')
  .select('*') // Only returns current user's data
```

**Server-Side (Session-Based)**:
```typescript
import { createClientWithSession } from '@/lib/supabase/server'

// Reads cookies for session-bound APIs
const supabase = await createClientWithSession()
const { data: { session } } = await supabase.auth.getSession()
```

**Server-Side (Service Role)**:
```typescript
import { createClient } from '@/lib/supabase/server'

// Service role - RLS bypassed (admin only!)
const supabase = await createClient()
const { data } = await supabase
  .from('consumer_orders')
  .select('*') // Returns ALL orders
```

### Authorization Header Pattern

**Client-Side Request**:
```typescript
const session = await supabase.auth.getSession()
const response = await fetch('/api/dashboard/summary', {
  headers: {
    'Authorization': `Bearer ${session.data.session.access_token}`
  }
})
```

**Server-Side Validation**:
```typescript
export async function GET(request: NextRequest) {
  // Method 1: Authorization header (for client-side fetch)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser(token)

    if (user) {
      // User authenticated via token
    }
  }

  // Method 2: Cookies (for SSR)
  const sessionClient = await createClientWithSession()
  const { data: { session } } = await sessionClient.auth.getSession()

  if (session) {
    // User authenticated via cookies
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### RBAC Permission Check Pattern

```typescript
import { checkPermissions } from '@/lib/rbac/permissions'

// Single permission
if (!admin.permissions.includes('orders:read')) {
  throw new Error('Forbidden')
}

// Multiple permissions (all required)
const required = ['orders:read', 'orders:update']
const hasAccess = required.every(perm => admin.permissions.includes(perm))

// Multiple permissions (any required)
const hasAnyAccess = required.some(perm => admin.permissions.includes(perm))
```

### Auth Provider Page Exclusion Pattern

**Critical for Multi-Context Apps**:
```typescript
// CustomerAuthProvider.tsx
const isAdminPage = pathname?.startsWith('/admin')
const isPartnerPage = pathname?.startsWith('/partners')
const isAuthPage = pathname?.startsWith('/auth/reset-password') ||
                   pathname?.startsWith('/auth/callback')

useEffect(() => {
  // Skip initialization on admin, partner, and auth pages
  if (isAdminPage || isPartnerPage || isAuthPage) {
    setLoading(false)
    return
  }

  // Initialize customer auth only on customer pages
  initializeAuth()
}, [isAdminPage, isPartnerPage, isAuthPage])
```

**Why?** Different auth contexts (customer, admin, partner) must not interfere with each other. Each system has its own provider and should only run on designated pages.

---

## Key Takeaways

### Customers
- **Token-based sessions** for simple, secure UX
- **RLS enforcement** ensures data privacy
- **Context providers** for consistent state access
- **httpOnly cookies** prevent XSS attacks

### Partners
- **Token-based sessions** similar to customers
- **RLS policies** for document and lead privacy
- **Compliance workflow** with 13 FICA/CIPC document categories
- **Storage integration** with private Supabase Storage bucket
- **Partner-specific context** (partner_number, compliance_status, tier)
- **Admin oversight** for compliance verification and approval

### Admins
- **Dual storage** (cookies + localStorage) for flexibility
- **Granular RBAC** with 100+ permissions
- **Service role access** for comprehensive data views
- **Audit logging** for compliance and troubleshooting

### Security
- **Separation of three contexts** prevents auth conflicts (customer/partner/admin)
- **Proper session management** with auto-refresh
- **Clear security patterns** (RLS for customers/partners, RBAC for admins)
- **Timeout protection** and graceful error handling

### Scalability
- Supabase handles session management transparently
- RLS policies scale with user growth
- RBAC supports complex organizational structures
- Audit trails enable compliance and debugging
- Multi-context architecture supports diverse user types

---

## Related Documentation

- [RBAC Permission System](../admin/RBAC_SYSTEM.md)
- [Customer Auth Flow](../features/customer-journey/AUTHENTICATION.md)
- [Admin Auth Flow](../admin/AUTHENTICATION.md)
- [Supabase Client Patterns](../../CLAUDE.md#supabase-client-patterns)
- [Webhook Security](../../CLAUDE.md#webhook-signature-verification-hmac-sha256)

---

**Maintained By**: Development Team
**Questions?** See `docs/README.md` or contact the development team.
