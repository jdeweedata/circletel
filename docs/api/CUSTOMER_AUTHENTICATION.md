---
title: Customer Authentication System
description: Comprehensive documentation for CircleTel's customer authentication system using Supabase Auth with localStorage-based sessions
category: api
authContext: consumer
date: 2025-12-15
version: 2.0
---

# Customer Authentication System

This document covers CircleTel's customer-facing authentication system built on Supabase Auth. The system supports email/password login, Google OAuth, OTP via SMS, and session persistence using localStorage.

## Overview

CircleTel implements a three-context authentication architecture:

| Context | Storage | RLS Behavior | Use Case |
|---------|---------|--------------|----------|
| **Consumer** | localStorage (client-side) | RLS-protected queries | Customer portal, order flow |
| **Partner** | localStorage (client-side) | RLS + FICA/CIPC compliance | Partner dashboard |
| **Admin** | Cookie-based SSR | Service role bypasses RLS | Admin panel |

This document focuses on the **Consumer** authentication context.

## Quick Start

### Authenticate a Customer (5 minutes)

```typescript
import { CustomerAuthService } from '@/lib/auth/customer-auth-service';

// Email/Password Login
const result = await CustomerAuthService.signIn('customer@example.com', 'securePassword123');

if (result.error) {
  console.error('Login failed:', result.error);
  return;
}

// User is now authenticated
console.log('Logged in as:', result.user?.email);
console.log('Customer ID:', result.customer?.id);
```

### Check Authentication Status

```typescript
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';

function MyComponent() {
  const { user, customer, isAuthenticated, loading } = useCustomerAuth();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please log in</div>;

  return <div>Welcome, {customer?.first_name}!</div>;
}
```

## Architecture

### File Structure

```
lib/
  supabase/
    client.ts          # Singleton Supabase client (localStorage)
    server.ts          # Server-side clients (service role + session)
  supabase.ts          # Re-exports for backwards compatibility
  auth/
    customer-auth-service.ts  # Authentication methods

components/
  providers/
    CustomerAuthProvider.tsx  # React context for auth state

integrations/
  supabase/
    client.ts          # Integration wrapper (returns singleton)

app/
  auth/
    login/page.tsx     # Login page (email/password, OTP, Google)
    callback/page.tsx  # OAuth callback handler
    forgot-password/page.tsx
    reset-password/page.tsx
  api/
    auth/
      create-customer/route.ts  # Creates customer record
      logout/route.ts           # Server-side logout
      send-otp/route.ts         # Send OTP to phone
      verify-otp/route.ts       # Verify OTP code
      password-reset/route.ts   # Password reset handler
    customers/
      ensure/route.ts  # Ensures customer record exists
```

### Session Storage: Why localStorage?

CircleTel uses localStorage-based session storage for customers instead of cookies. This decision was made to solve:

1. **Login Loop Bug**: Cookie-based `@supabase/ssr` caused infinite login redirects when cookies weren't properly synchronized across client/server boundaries.

2. **Multiple GoTrueClient Warning**: Using both `@supabase/ssr` and `@supabase/supabase-js` created competing auth instances that cleared each other's sessions.

3. **Simpler Client-Side Logic**: localStorage provides a single source of truth for client-side auth without cookie synchronization complexity.

**Trade-off**: Server-side rendering cannot access the session directly. API routes must accept both Authorization headers and cookies.

### Singleton Pattern

All client-side code uses a single Supabase client instance:

```typescript
// lib/supabase/client.ts
let _supabaseClient: SupabaseClient | null = null;

function getSupabaseClient() {
  if (_supabaseClient) return _supabaseClient;

  _supabaseClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,      // Store in localStorage
      autoRefreshToken: true,    // Auto-refresh before expiry
      detectSessionInUrl: true,  // Handle OAuth callbacks
    },
  });

  return _supabaseClient;
}

export function createClient() {
  return getSupabaseClient();
}
```

This prevents the "Multiple GoTrueClient instances detected" warning that causes session conflicts.

## Authentication Methods

### Email/Password Sign Up

Creates both a Supabase Auth user and a CircleTel customer record.

```typescript
import { CustomerAuthService, CustomerData } from '@/lib/auth/customer-auth-service';

const customerData: CustomerData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '0821234567',
  accountType: 'personal',
};

const result = await CustomerAuthService.signUp(
  'john.doe@example.com',
  'SecurePassword123!',
  customerData
);

if (result.error) {
  // Handle specific errors
  if (result.error.includes('already registered')) {
    // Redirect to login
  } else if (result.error.includes('rate limit')) {
    // Show retry message
  }
  return;
}

// Email verification required before full access
if (result.user && !result.user.email_confirmed_at) {
  // Redirect to verification page
}
```

**Sign Up Flow**:

1. Create Supabase Auth user with metadata
2. Wait 500ms for auth user propagation
3. Create customer record via `/api/auth/create-customer` (uses service role)
4. Retry up to 3 times if timing issues occur
5. Trigger async ZOHO Billing sync

### Email/Password Sign In

```typescript
const result = await CustomerAuthService.signIn('john.doe@example.com', 'password123');

if (result.error) {
  console.error('Login failed:', result.error);
  return;
}

// Session stored in localStorage automatically
// Customer record fetched and returned
console.log('Customer:', result.customer);
```

### Google OAuth

```typescript
const result = await CustomerAuthService.signInWithGoogle();

if (result.error) {
  console.error('Google sign-in failed:', result.error);
  return;
}

// User is redirected to Google for authentication
// After success, redirected to /auth/callback
```

**OAuth Flow**:

1. Store intended redirect URL in `localStorage.circletel_oauth_next`
2. Redirect to Google OAuth with `redirectTo: /auth/callback`
3. Callback page extracts tokens from URL hash (implicit flow)
4. Call `supabase.auth.setSession()` with tokens
5. Create customer record if not exists
6. Redirect to stored destination

### OTP (Phone) Authentication

```typescript
// Step 1: Send OTP
const sendResponse = await fetch('/api/otp/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '0821234567' }),
});

// Step 2: Verify OTP
const result = await CustomerAuthService.signInWithOtp('0821234567', '123456');

if (result.error) {
  console.error('OTP verification failed:', result.error);
  return;
}
```

**Note**: Full OTP authentication requires Supabase phone auth configuration. Without it, OTP verification succeeds but session creation may fail.

### Sign Out

```typescript
const result = await CustomerAuthService.signOut();

if (result.error) {
  console.error('Sign out failed:', result.error);
  return;
}

// Session cleared from localStorage
// CircleTel data cleared for privacy:
// - circletel_order_data
// - circletel_order_id
// - circletel_pending_order_id
// - circletel_coverage_address
// - circletel_payment_retries
// - circletel_payment_error
// - circletel_oauth_next
```

### Password Reset

```typescript
// Request reset email
const result = await CustomerAuthService.sendPasswordResetEmail('john.doe@example.com');

if (result.error) {
  console.error('Failed to send reset email:', result.error);
  return;
}

// User receives email, clicks link to /auth/reset-password
// Then updates password:
const updateResult = await CustomerAuthService.updatePassword('NewSecurePassword123!');
```

## React Context Provider

### CustomerAuthProvider

Wrap your application with `CustomerAuthProvider` to access auth state:

```tsx
// app/layout.tsx
import { CustomerAuthProvider } from '@/components/providers/CustomerAuthProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <CustomerAuthProvider>
          {children}
        </CustomerAuthProvider>
      </body>
    </html>
  );
}
```

### useCustomerAuth Hook

Access authentication state and methods in any component:

```typescript
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';

function ProfilePage() {
  const {
    user,              // Supabase Auth user
    customer,          // CircleTel customer record
    session,           // Current session (access_token, refresh_token)
    loading,           // True during initialization
    isAuthenticated,   // Boolean: user exists
    isEmailVerified,   // Boolean: email confirmed
    signIn,            // CustomerAuthService.signIn
    signUp,            // CustomerAuthService.signUp
    signOut,           // CustomerAuthService.signOut
    signInWithGoogle,  // CustomerAuthService.signInWithGoogle
    signInWithOtp,     // CustomerAuthService.signInWithOtp
    refreshCustomer,   // Refresh customer data from DB
    resendVerification // Resend verification email
  } = useCustomerAuth();

  // Use state and methods...
}
```

### Context Interface

```typescript
interface CustomerAuthContextType {
  user: User | null;
  customer: Customer | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  signUp: (email: string, password: string, data: CustomerData) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signInWithOtp: (phone: string, otp: string) => Promise<SignInResult>;
  signOut: () => Promise<{ error: string | null }>;
  refreshCustomer: () => Promise<void>;
  resendVerification: (email: string) => Promise<{ error: string | null }>;
}

interface Customer {
  id: string;
  auth_user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  account_number?: string;     // CT-YYYY-NNNNN format
  account_status?: 'active' | 'suspended' | 'cancelled' | 'pending';
  account_type: 'personal' | 'business';
  business_name?: string;
  business_registration?: string;
  tax_number?: string;
  email_verified: boolean;
  status: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
}
```

## API Routes

### POST /api/auth/create-customer

Creates a customer record using service role (bypasses RLS).

**Request**:

```typescript
{
  auth_user_id: string;  // Required - Supabase Auth user ID
  email: string;         // Required
  first_name?: string;   // Defaults to 'Customer'
  last_name?: string;    // Defaults to 'User'
  phone?: string;        // Defaults to ''
  account_type?: 'personal' | 'business';  // Defaults to 'personal'
}
```

**Response (Success)**:

```json
{
  "success": true,
  "customer": {
    "id": "uuid",
    "auth_user_id": "uuid",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "0821234567",
    "account_type": "personal",
    "email_verified": false,
    "status": "active"
  },
  "message": "Customer profile created successfully"
}
```

**Response (Error)**:

```json
{
  "success": false,
  "error": "Auth user not found. Please try again in a moment.",
  "code": "AUTH_USER_NOT_FOUND"
}
```

### POST /api/customers/ensure

Ensures a customer record exists. Supports both Authorization header and cookie auth.

**Headers** (choose one):

```
Authorization: Bearer <access_token>
Cookie: sb-agyjovdugmtopasyvlng-auth-token=<token>
```

**Request Body** (optional, for unauthenticated calls):

```typescript
{
  auth_user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}
```

**Response**:

```json
{
  "success": true,
  "customer": { ... },
  "message": "Customer already exists" | "Customer created"
}
```

## Protected Routes

### Dashboard Layout Pattern

The dashboard layout demonstrates proper auth protection with payment return handling:

```typescript
// app/dashboard/layout.tsx
export default function DashboardLayout({ children }) {
  const { user, session, loading } = useCustomerAuth();
  const searchParams = useSearchParams();

  // Detect payment return from URL params
  const isPaymentReturn = useMemo(() => {
    const paymentMethod = searchParams.get('payment_method');
    const paymentStatus = searchParams.get('payment_status');
    return !!(paymentMethod || paymentStatus);
  }, [searchParams]);

  // Don't redirect during payment return - session needs time to restore
  useEffect(() => {
    if (isPaymentReturn) return;

    if (!loading && !user && !session) {
      // Extended delay for session recovery
      setTimeout(() => {
        router.push('/auth/login?redirect=/dashboard');
      }, 1500);
    }
  }, [user, session, loading, isPaymentReturn]);

  // Show loading during payment return
  if (loading || (isPaymentReturn && !user)) {
    return <LoadingSpinner />;
  }

  if (!user && !session) {
    return null;
  }

  return <DashboardContent>{children}</DashboardContent>;
}
```

### Auth Page Exclusion

The `CustomerAuthProvider` skips initialization on certain pages to prevent session conflicts:

```typescript
// Skip auth on admin, partner, and auth pages
const isAdminPage = pathname?.startsWith('/admin');
const isPartnerPage = pathname?.startsWith('/partners');
const isAuthPage = pathname?.startsWith('/auth/');

if (isAdminPage || isPartnerPage || isAuthPage) {
  setLoading(false);
  return; // Don't initialize customer auth
}
```

## API Route Authentication Pattern

API routes must support both localStorage-based (Authorization header) and cookie-based authentication:

```typescript
// Pattern for API routes supporting both auth methods
import { createClient, createClientWithSession } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  let user = null;

  // Check Authorization header first (localStorage-based clients)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const tokenClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await tokenClient.auth.getUser(token);
    user = data?.user ?? null;
  } else {
    // Fall back to cookie-based auth
    const sessionClient = await createClientWithSession();
    const { data } = await sessionClient.auth.getUser();
    user = data?.user ?? null;
  }

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // User is authenticated, proceed with request...
}
```

## Error Handling

### Common Errors and Resolutions

| Error | Cause | Resolution |
|-------|-------|------------|
| `Multiple GoTrueClient instances` | Creating multiple Supabase clients | Use singleton from `lib/supabase/client.ts` |
| `Invalid credentials` | Wrong email or password | Verify credentials, offer password reset |
| `Email already registered` | Duplicate signup attempt | Redirect to login page |
| `Rate limit exceeded` | Too many requests (429) | Wait and retry with exponential backoff |
| `AUTH_USER_NOT_FOUND` | Timing issue after signup | Automatic retry (3 attempts) |
| `401 Unauthorized` | Session expired or missing | Check both header and cookies in API |
| `Login loop` | Cookie/localStorage conflict | Clear session with `clearSupabaseSession()` |
| `Foreign key violation` | Customer created before auth user | Wait 500ms after auth signup |

### clearSupabaseSession Utility

Clear stale session data to resolve auth issues:

```typescript
import { clearSupabaseSession } from '@/lib/supabase/client';

// Clears:
// - Supabase cookies (sb-agyjovdugmtopasyvlng-auth-token)
// - localStorage items starting with 'sb-' or containing 'supabase'
// - Resets singleton client

clearSupabaseSession();
```

### Error Handling Example

```typescript
const result = await CustomerAuthService.signIn(email, password);

if (result.error) {
  // Parse error type
  const errorLower = result.error.toLowerCase();

  if (errorLower.includes('invalid') || errorLower.includes('credentials')) {
    toast.error('Invalid email or password');
  } else if (errorLower.includes('not confirmed')) {
    toast.error('Please verify your email first');
    router.push('/auth/verify-email');
  } else if (errorLower.includes('rate limit') || errorLower.includes('429')) {
    toast.error('Too many attempts. Please wait a moment.');
  } else {
    toast.error(result.error);
  }
  return;
}
```

## Troubleshooting

### Login Loop Issue

**Symptom**: User logs in successfully but is immediately redirected back to login.

**Cause**: Session stored in localStorage but cookies are stale/conflicting.

**Resolution**:

```typescript
// Clear stale session data on login page
import { clearSupabaseSession } from '@/lib/supabase/client';

// Only clear on explicit auth errors, not just redirects
const authError = searchParams.get('error');
if (authError) {
  clearSupabaseSession();
}
```

### Multiple GoTrueClient Warning

**Symptom**: Console warning "Multiple GoTrueClient instances detected"

**Cause**: Creating new Supabase client instances instead of using singleton.

**Resolution**:

```typescript
// WRONG - Creates new instance
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(url, key);

// CORRECT - Uses singleton
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();

// Also correct - Import from integrations
import { createClient } from '@/integrations/supabase/client';
const supabase = createClient();
```

### 401 Errors on API Routes

**Symptom**: Authenticated user gets 401 from API routes.

**Cause**: API route only checks cookies, but session is in localStorage.

**Resolution**: Implement dual-auth pattern (see API Route Authentication Pattern above).

### Session Lost After Payment Return

**Symptom**: User loses session when returning from external payment provider.

**Cause**: Race condition between session restoration and auth redirect.

**Resolution**:

```typescript
// Detect payment return and delay redirect
const isPaymentReturn = !!(
  searchParams.get('payment_method') ||
  searchParams.get('payment_status')
);

if (isPaymentReturn) {
  // Don't redirect - wait for session to restore
  return;
}
```

### OAuth Callback Fails

**Symptom**: Google OAuth succeeds at Google but fails at callback.

**Cause**: Tokens in URL hash not being processed.

**Resolution**: The callback page extracts tokens from hash:

```typescript
if (window.location.hash) {
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');

  if (accessToken && refreshToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }
}
```

### Customer Record Not Created

**Symptom**: User can authenticate but has no customer record.

**Cause**: Timing issue between auth user creation and customer record insert.

**Resolution**: The system automatically:

1. Waits 500ms after auth signup
2. Retries customer creation up to 3 times
3. Falls back to API route with service role
4. Uses upsert with `ON CONFLICT` handling

For manual recovery, call `/api/customers/ensure`.

## Security Considerations

### Token Storage

- Access tokens stored in localStorage (client-side only)
- Refresh tokens stored in localStorage (client-side only)
- Never expose tokens in URLs (except OAuth hash fragments)
- Service role key only used server-side

### RLS (Row Level Security)

- Customer queries use anon key + RLS policies
- Customers can only access their own data
- Service role bypasses RLS (used by API routes)

### Session Lifecycle

```
Sign Up
  |-> Create auth user
  |-> Store session in localStorage
  |-> Create customer record (service role)
  |-> Email verification sent

Sign In
  |-> Verify credentials
  |-> Store session in localStorage
  |-> Auto-refresh before expiry

Sign Out
  |-> Clear Supabase session
  |-> Clear CircleTel localStorage data
  |-> Reset singleton client
```

### Data Cleanup on Logout

Sensitive data is cleared on sign out:

```typescript
const keysToRemove = [
  'circletel_order_data',
  'circletel_order_id',
  'circletel_pending_order_id',
  'circletel_coverage_address',
  'circletel_payment_retries',
  'circletel_payment_error',
  'circletel_oauth_next',
];
```

## Related Documentation

- [Authentication System Overview](../architecture/AUTHENTICATION_SYSTEM.md) - Full three-context system
- [Admin Authentication](./ADMIN_AUTHENTICATION.md) - Admin panel RBAC
- [Partner Authentication](./PARTNER_AUTHENTICATION.md) - Partner portal compliance
- [System Overview](../architecture/SYSTEM_OVERVIEW.md) - Database schema and architecture

## Changelog

### 2025-12-15 (v2.0)

- **Fixed**: Login loop issue by switching from `@supabase/ssr` to `@supabase/supabase-js`
- **Fixed**: Multiple GoTrueClient warning with singleton pattern
- **Fixed**: 401 API errors with dual-auth (header + cookie) support
- **Added**: Payment return session restoration grace period
- **Added**: `clearSupabaseSession()` utility for stale session cleanup
- **Improved**: Customer record creation with retry logic and upsert
