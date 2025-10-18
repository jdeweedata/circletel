# MTN Feasibility API Integration - Feature Specification v1.0

**Project:** Circle Tel ISP Platform  
**Feature:** Multi-Provider Network Feasibility Checker (Starting with MTN)  
**Document Version:** 1.0  
**Date:** October 15, 2025  
**Status:** Phase 1 - Awaiting Approval  

---

## EXECUTIVE SUMMARY

This specification outlines the integration of MTN's network feasibility API into Circle Tel's existing platform, enabling real-time coverage checks for customers before order placement. The system is designed to:

1. **Extend (not replace)** existing functionality
2. Support multiple network providers through a unified interface
3. Be managed entirely from the admin backend
4. Gracefully degrade if providers are unavailable

**Timeline:** 6-8 weeks from approval  
**Risk Level:** LOW (feature flagged, isolated codebase, no breaking changes)  
**Business Impact:** Expected 20% increase in order conversion, 50% reduction in coverage-related support tickets

---

## TABLE OF CONTENTS

1. [Business Requirements](#1-business-requirements)
2. [Technical Architecture](#2-technical-architecture)
3. [Database Schema](#3-database-schema)
4. [API Specifications](#4-api-specifications)
5. [Admin Interface Design](#5-admin-interface-design)
6. [Frontend Integration](#6-frontend-integration)
7. [MTN API Integration Details](#7-mtn-api-integration-details)
8. [Security & Authentication](#8-security--authentication)
9. [Performance & Caching Strategy](#9-performance--caching-strategy)
10. [Error Handling & Monitoring](#10-error-handling--monitoring)
11. [Testing Strategy](#11-testing-strategy)
12. [Deployment Plan](#12-deployment-plan)
13. [Rollback Procedures](#13-rollback-procedures)
14. [Future Extensibility](#14-future-extensibility)
15. [Appendices](#15-appendices)

---

## 1. BUSINESS REQUIREMENTS

### 1.1 Problem Statement

**Current State:**
- Customers can browse packages but don't know if service is available at their location
- Sales team spends hours manually checking coverage with multiple providers
- High order abandonment rate due to post-purchase coverage issues
- No centralized system to manage multiple ISP partnerships

**Desired State:**
- Real-time coverage validation during browsing experience
- Self-service feasibility checks reduce support burden
- Multi-provider comparison helps customers choose best option
- Admin team can add/remove providers without developer intervention

### 1.2 Stakeholders

| Role | Needs | Success Criteria |
|------|-------|------------------|
| **Network Operations** | Easy provider configuration | Can add new provider in < 15 minutes |
| **Product Managers** | Coverage analytics | Dashboard shows check volume, conversion rates |
| **Sales Team** | Quick feasibility checks | Response time < 3 seconds |
| **Customers** | Know before they buy | 95%+ accuracy on availability |
| **Developers** | Non-breaking integration | Zero impact on existing features |

### 1.3 Functional Requirements

#### Must-Have (Phase 1):
- ✅ Admin can configure MTN API credentials
- ✅ Frontend displays feasibility check widget
- ✅ System queries MTN API with lat/long coordinates
- ✅ Results cached for 7 days to minimize API costs
- ✅ RBAC permissions for admin access
- ✅ Audit logging of all checks

#### Should-Have (Phase 2):
- 🔄 Multiple provider support (Vodacom, Telkom)
- 🔄 Address autocomplete with Google Places API
- 🔄 Coverage heatmap visualization
- 🔄 Email notifications when new areas covered

#### Nice-to-Have (Future):
- 💡 Predict coverage expansion using ML
- 💡 Automatically notify waitlisted customers
- 💡 API webhooks when provider status changes

### 1.4 Non-Functional Requirements

| Category | Requirement | Measurement |
|----------|-------------|-------------|
| **Performance** | 90th percentile response < 2s | APM monitoring |
| **Availability** | 99.9% uptime for feasibility service | Status page |
| **Security** | API credentials encrypted at rest | Vault audit logs |
| **Scalability** | Handle 1000 checks/hour | Load testing |
| **Maintainability** | New provider added in < 1 day | Developer survey |
| **Usability** | Mobile-friendly interface | Lighthouse score 90+ |

---

## 2. TECHNICAL ARCHITECTURE

### 2.1 System Context Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Circle Tel Platform                      │
│                                                               │
│  ┌───────────┐         ┌──────────────┐      ┌────────────┐ │
│  │  Frontend │ ──GET──▶│ Feasibility  │◀─────│   Admin    │ │
│  │  (Public) │         │  API Layer   │      │  Backend   │ │
│  └───────────┘         └──────────────┘      └────────────┘ │
│        │                       │                      │      │
│        │                       ▼                      │      │
│        │              ┌──────────────┐                │      │
│        │              │   Supabase   │                │      │
│        │              │  PostgreSQL  │                │      │
│        │              └──────────────┘                │      │
│        │                       │                      │      │
└────────┼───────────────────────┼──────────────────────┼──────┘
         │                       │                      │
         │                       ▼                      │
         │              ┌──────────────┐                │
         └─────────────▶│  MTN API     │◀───────────────┘
                        │  (External)  │
                        └──────────────┘
```

### 2.2 Component Architecture

```
Circle Tel Codebase Structure:

app/
├── admin/
│   └── network-providers/        # NEW: Admin dashboard
│       ├── page.tsx              # Provider list view
│       ├── [id]/page.tsx         # Edit provider
│       └── components/
│           ├── ProviderCard.tsx
│           ├── ProviderForm.tsx
│           └── APITestConsole.tsx
│
├── api/
│   └── v1/
│       ├── feasibility/          # NEW: Public API
│       │   ├── check/route.ts
│       │   └── cache/route.ts
│       └── admin/
│           └── network-providers/  # NEW: Admin API
│               ├── route.ts
│               └── [id]/
│                   ├── route.ts
│                   ├── test/route.ts
│                   └── health/route.ts
│
├── home-internet/page.tsx        # MODIFIED: Add feasibility widget
├── wireless/page.tsx             # MODIFIED: Add feasibility widget
└── order/page.tsx                # MODIFIED: Add validation step

components/
└── feasibility/                  # NEW: Reusable components
    ├── FeasibilityChecker.tsx
    ├── CoverageMap.tsx
    ├── ProductList.tsx
    └── AddressInput.tsx

lib/
├── feasibility/                  # NEW: Core business logic
│   ├── checker.ts               # Main orchestration
│   ├── cache-manager.ts         # Cache operations
│   ├── provider-client.ts       # HTTP wrapper
│   ├── transformers/
│   │   ├── mtn.ts              # MTN-specific parser
│   │   └── base-transformer.ts
│   └── types.ts                # TypeScript interfaces
│
├── rbac/permissions.ts          # MODIFIED: Add new permissions
└── supabase/client.ts           # EXISTING: No changes

supabase/
└── migrations/
    └── 20251015_add_feasibility_system.sql  # NEW: Database setup
```

### 2.3 Data Flow Diagrams

#### Feasibility Check Flow (Customer Journey)

```
1. Customer enters address/location
   ↓
2. Frontend geocodes to lat/long (if needed)
   ↓
3. POST /api/v1/feasibility/check
   ↓
4. Check cache (within 500m radius, not expired)
   ├── Cache Hit → Return cached results (200ms)
   └── Cache Miss → Query active providers
       ↓
5. Parallel API calls to all active providers
   ├── MTN API → 500ms
   ├── Vodacom API → 450ms (future)
   └── Telkom API → 600ms (future)
   ↓
6. Transform responses to unified format
   ↓
7. Save to cache (expires in 7 days)
   ↓
8. Return aggregated results to frontend
   ↓
9. Display available products + coverage map
```

#### Admin Provider Configuration Flow

```
1. Admin navigates to /admin/network-providers
   ↓
2. Clicks "Add New Provider"
   ↓
3. Fills form:
   - Provider name (e.g., "MTN")
   - API base URL
   - Authentication credentials
   - Endpoint paths
   ↓
4. Admin clicks "Test Connection"
   ↓
5. System makes test API call
   ├── Success → Shows parsed results
   └── Failure → Shows error details
   ↓
6. Admin saves configuration
   ↓
7. Credentials encrypted and stored in DB
   ↓
8. Provider now available for feasibility checks
```

### 2.4 Technology Stack (Unchanged)

| Layer | Technology | Usage |
|-------|-----------|--------|
| **Frontend** | Next.js 15 + TypeScript | Existing |
| **Backend** | Next.js API Routes | Existing |
| **Database** | Supabase PostgreSQL | Existing |
| **Authentication** | Supabase Auth + Custom RBAC | Existing |
| **UI Components** | Radix UI + Tailwind CSS | Existing |
| **State Management** | Zustand | Existing |
| **HTTP Client** | Native `fetch` API | NEW for provider calls |
| **Caching** | PostgreSQL + Redis (optional) | NEW |
| **Monitoring** | Existing logging system | EXTENDED |

---

## 3. DATABASE SCHEMA

### 3.1 Entity Relationship Diagram

```
┌──────────────────────┐
│ network_providers    │
│──────────────────────│
│ id (PK)              │
│ name                 │
│ slug (UNIQUE)        │
│ api_type             │
│ base_url             │
│ is_active            │
│ auth_config (JSONB)  │
│ endpoints (JSONB)    │
│ rate_limit_per_min   │
│ created_at           │
│ updated_at           │
└──────────────────────┘
         │
         │ 1
         │
         │ N
         ▼
┌──────────────────────┐       ┌──────────────────────┐
│ feasibility_checks   │       │ provider_health_chks │
│──────────────────────│       │──────────────────────│
│ id (PK)              │       │ id (PK)              │
│ provider_id (FK)     │◀──────│ provider_id (FK)     │
│ latitude             │       │ checked_at           │
│ longitude            │       │ is_healthy           │
│ request_payload      │       │ response_time_ms     │
│ response_payload     │       │ error_message        │
│ products_available   │       │ success_rate_1h      │
│ is_available         │       └──────────────────────┘
│ check_status         │
│ checked_at           │
│ expires_at           │
│ cache_hit            │
└──────────────────────┘
```

### 3.2 Detailed Schema

#### Table 1: `network_providers`

**Purpose:** Stores configuration for each network provider (MTN, Vodacom, etc.)

```sql
CREATE TABLE network_providers (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Provider Identification
  name VARCHAR(100) NOT NULL, 
    -- Example: "MTN South Africa"
  slug VARCHAR(50) UNIQUE NOT NULL, 
    -- Example: "mtn" (URL-safe identifier)
  
  -- API Configuration
  api_type VARCHAR(50) NOT NULL CHECK (api_type IN ('rest', 'soap', 'graphql')),
    -- "rest" for MTN
  base_url TEXT NOT NULL,
    -- Example: "https://hnssl.mtn.co.za/"
  is_active BOOLEAN DEFAULT true,
    -- Quick enable/disable without deletion
  
  -- Authentication (Encrypted at Application Layer)
  auth_config JSONB NOT NULL DEFAULT '{}',
    /* Example:
    {
      "type": "bearer",
      "api_key": "encrypted_key_here",
      "client_id": "encrypted_id_here",
      "client_secret": "encrypted_secret_here",
      "token_endpoint": "/auth/token"
    }
    */
  
  -- API Endpoints Mapping
  endpoints JSONB NOT NULL DEFAULT '{}',
    /* Example:
    {
      "feasibility_wholesale": "/MTNBulkApi/api/Sync",
      "feasibility_products": "/MTNBulkApi/api/Products",
      "auth_endpoint": "/auth/token"
    }
    */
  
  -- Rate Limiting Configuration
  rate_limit_per_minute INTEGER DEFAULT 60,
    -- Prevents hitting provider's rate limits
  
  -- Response Transformation (Optional)
  request_transformer TEXT,
    -- JavaScript function as string to customize request format
  response_transformer TEXT,
    -- JavaScript function to normalize API responses
  
  -- Visual & Documentation
  logo_url TEXT,
    -- Provider logo for UI display
  contact_email VARCHAR(255),
    -- Support contact
  documentation_url TEXT,
    -- Link to provider's API docs
  
  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT positive_rate_limit CHECK (rate_limit_per_minute > 0)
);

-- Indexes
CREATE INDEX idx_network_providers_active ON network_providers(is_active) 
  WHERE is_active = true;
CREATE INDEX idx_network_providers_slug ON network_providers(slug);

-- Row Level Security (Supabase)
ALTER TABLE network_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage providers"
  ON network_providers
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Authenticated users can view active providers"
  ON network_providers
  FOR SELECT
  USING (is_active = true);
```

#### Table 2: `feasibility_checks`

**Purpose:** Caches feasibility check results to minimize API calls and costs

```sql
CREATE TABLE feasibility_checks (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES network_providers(id) ON DELETE CASCADE,
  
  -- Location Data
  latitude DECIMAL(10, 8) NOT NULL,
    -- Range: -90 to 90
  longitude DECIMAL(11, 8) NOT NULL,
    -- Range: -180 to 180
  address_string TEXT,
    -- Optional human-readable address for UI display
  
  -- Request/Response Storage
  request_payload JSONB NOT NULL,
    -- Full request sent to provider
  response_payload JSONB NOT NULL,
    -- Raw API response
  products_available JSONB,
    /* Parsed and normalized products:
    [
      {
        "id": "mtn_fiber_100",
        "name": "MTN Fiber 100Mbps",
        "speed_mbps": 100,
        "price_monthly": 699,
        "installation_fee": 0
      }
    ]
    */
  
  -- Result Status
  is_available BOOLEAN,
    -- Quick boolean for filtering
  check_status VARCHAR(20) NOT NULL DEFAULT 'success',
    -- 'success', 'failed', 'timeout', 'rate_limited'
  error_message TEXT,
    -- Populated only if check_status != 'success'
  
  -- Caching Metadata
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    -- TTL: 7 days by default
  cache_hit BOOLEAN DEFAULT false,
    -- Tracks if this row was served from cache
  
  -- Performance Metrics
  response_time_ms INTEGER,
    -- API call duration
  user_session_id TEXT,
    -- For analytics (track conversion from check to order)
  
  -- Constraints
  CONSTRAINT valid_latitude CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT valid_longitude CHECK (longitude BETWEEN -180 AND 180),
  CONSTRAINT valid_check_status CHECK (
    check_status IN ('success', 'failed', 'timeout', 'rate_limited')
  )
);

-- Indexes for Performance
CREATE INDEX idx_feasibility_checks_location 
  ON feasibility_checks 
  USING GIST (ll_to_earth(latitude, longitude));
  -- GIS index for fast radius searches

CREATE INDEX idx_feasibility_checks_expires 
  ON feasibility_checks(expires_at) 
  WHERE check_status = 'success' AND expires_at > NOW();
  -- Optimizes cache lookup queries

CREATE INDEX idx_feasibility_checks_provider 
  ON feasibility_checks(provider_id, checked_at DESC);
  -- For provider-specific analytics

-- Automatic Cleanup Function
CREATE OR REPLACE FUNCTION cleanup_expired_checks()
RETURNS void AS $$
BEGIN
  DELETE FROM feasibility_checks
  WHERE expires_at < NOW() - INTERVAL '30 days';
  -- Keep expired records for 30 days for analytics, then purge
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (run daily)
-- Note: Use pg_cron extension or application-level cron job
```

#### Table 3: `provider_health_checks`

**Purpose:** Monitors provider API availability for admin dashboard

```sql
CREATE TABLE provider_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES network_providers(id) ON DELETE CASCADE,
  
  -- Check Results
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  is_healthy BOOLEAN NOT NULL,
  response_time_ms INTEGER,
  error_message TEXT,
  http_status_code INTEGER,
  
  -- Aggregated Metrics (calculated by background job)
  success_rate_1h DECIMAL(5,2),
    -- Example: 99.50 (means 99.5% success)
  avg_response_time_1h INTEGER
    -- Average response time in last hour
);

-- Indexes
CREATE INDEX idx_provider_health_checks_provider 
  ON provider_health_checks(provider_id, checked_at DESC);

CREATE INDEX idx_provider_health_checks_recent 
  ON provider_health_checks(checked_at DESC) 
  WHERE checked_at > NOW() - INTERVAL '1 hour';

-- View: Latest Health Status Per Provider
CREATE VIEW provider_latest_health AS
SELECT DISTINCT ON (provider_id)
  provider_id,
  is_healthy,
  response_time_ms,
  error_message,
  checked_at
FROM provider_health_checks
ORDER BY provider_id, checked_at DESC;
```

### 3.3 Database Migrations

**File:** `supabase/migrations/20251015_add_feasibility_system.sql`

```sql
-- Migration: Add feasibility check system
-- Version: 1.0
-- Date: 2025-10-15
-- Author: CircleTel Dev Team

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For GIS operations
CREATE EXTENSION IF NOT EXISTS "pg_cron";  -- For scheduled jobs (optional)

-- Create tables (see above for full definitions)
-- ... [Insert all CREATE TABLE statements from sections 3.2.1, 3.2.2, 3.2.3]

-- Create views
CREATE VIEW active_providers_with_health AS
SELECT 
  np.*,
  COALESCE(plh.is_healthy, true) as current_health,
  COALESCE(plh.response_time_ms, 0) as last_response_time,
  COALESCE(plh.checked_at, NOW()) as last_health_check
FROM network_providers np
LEFT JOIN provider_latest_health plh ON plh.provider_id = np.id
WHERE np.is_active = true;

-- Insert default MTN provider (template)
INSERT INTO network_providers (
  name,
  slug,
  api_type,
  base_url,
  auth_config,
  endpoints,
  is_active,
  logo_url
) VALUES (
  'MTN South Africa',
  'mtn',
  'rest',
  'https://hnssl.mtn.co.za/',
  '{"type": "bearer", "api_key": "PLACEHOLDER"}',
  '{
    "feasibility_wholesale": "/MTNBulkApi/api/Sync",
    "feasibility_products": "/MTNBulkApi/api/Sync"
  }',
  false, -- Disabled by default until credentials configured
  'https://www.mtn.co.za/logo.png'
);

-- Schedule automatic cache cleanup (if pg_cron available)
SELECT cron.schedule(
  'cleanup-expired-feasibility-checks',
  '0 2 * * *', -- Run at 2 AM daily
  $$DELETE FROM feasibility_checks WHERE expires_at < NOW() - INTERVAL '30 days'$$
);

COMMIT;
```

### 3.4 Data Retention Policy

| Table | Retention Period | Cleanup Strategy |
|-------|------------------|------------------|
| `network_providers` | Permanent | Soft delete (is_active = false) |
| `feasibility_checks` (active) | 7 days | Auto-expire via `expires_at` |
| `feasibility_checks` (expired) | 30 days | Daily cron job purge |
| `provider_health_checks` | 90 days | Weekly aggregation to summary table |

---

## 4. API SPECIFICATIONS

### 4.1 Public API: Feasibility Check

#### Endpoint: `POST /api/v1/feasibility/check`

**Purpose:** Check network coverage at a given location across all active providers

**Authentication:** None (public endpoint, rate-limited by IP)

**Request:**

```typescript
interface FeasibilityCheckRequest {
  latitude: number;
  longitude: number;
  address?: string; // Optional, for UI display
  provider_slugs?: string[]; // Optional: ["mtn"], defaults to all active
  force_refresh?: boolean; // Optional: bypass cache, default false
}

// Example:
POST /api/v1/feasibility/check
Content-Type: application/json

{
  "latitude": -26.2041,
  "longitude": 28.0473,
  "address": "123 Main St, Johannesburg",
  "provider_slugs": ["mtn"]
}
```

**Response (Success):**

```typescript
interface FeasibilityCheckResponse {
  success: true;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  providers: ProviderResult[];
  cache_expires_at: string; // ISO 8601
  total_providers_checked: number;
  total_products_available: number;
}

interface ProviderResult {
  provider: string; // slug
  provider_name: string; // full name
  available: boolean;
  products: Product[];
  response_time_ms: number;
  cached: boolean;
  error?: string; // Only if available = false
}

interface Product {
  id: string;
  name: string;
  speed_mbps: number;
  price_monthly: number;
  installation_fee: number;
  technology: string; // "fiber", "lte", "5g"
  metadata: Record<string, any>; // Raw provider data
}

// Example:
{
  "success": true,
  "location": {
    "latitude": -26.2041,
    "longitude": 28.0473,
    "address": "123 Main St, Johannesburg"
  },
  "providers": [
    {
      "provider": "mtn",
      "provider_name": "MTN South Africa",
      "available": true,
      "products": [
        {
          "id": "mtn_fiber_100",
          "name": "MTN Fiber 100Mbps",
          "speed_mbps": 100,
          "price_monthly": 699,
          "installation_fee": 0,
          "technology": "fiber",
          "metadata": { /* raw MTN response */ }
        }
      ],
      "response_time_ms": 234,
      "cached": false
    }
  ],
  "cache_expires_at": "2025-10-22T12:00:00Z",
  "total_providers_checked": 1,
  "total_products_available": 5
}
```

**Response (Error):**

```typescript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid latitude value",
    "details": {
      "field": "latitude",
      "value": 200,
      "constraint": "Must be between -90 and 90"
    }
  }
}

// Other error codes:
// - RATE_LIMIT_EXCEEDED
// - ALL_PROVIDERS_UNAVAILABLE
// - INVALID_COORDINATES
// - PROVIDER_NOT_FOUND
```

**Rate Limiting:**
- **Unauthenticated:** 20 requests per minute per IP
- **Authenticated users:** 100 requests per minute
- **Admin users:** Unlimited

**Caching Strategy:**
1. Check for cached result within 500m radius, not expired
2. If cache hit, return immediately with `cached: true`
3. If cache miss, query all active providers in parallel
4. Save results to cache before returning

---

### 4.2 Admin API: Provider Management

#### Endpoint: `GET /api/v1/admin/network-providers`

**Purpose:** List all configured providers with health status

**Authentication:** Required (`admin` role)

**Request:**

```http
GET /api/v1/admin/network-providers
Authorization: Bearer {supabase_access_token}
```

**Response:**

```typescript
interface ProviderListResponse {
  providers: ProviderSummary[];
  total_count: number;
}

interface ProviderSummary {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  health_status: "healthy" | "degraded" | "unavailable" | "unknown";
  last_health_check: string; // ISO 8601
  success_rate_24h: number; // Percentage
  avg_response_time_ms: number;
  total_checks_today: number;
  created_at: string;
}

// Example:
{
  "providers": [
    {
      "id": "uuid-123",
      "name": "MTN South Africa",
      "slug": "mtn",
      "is_active": true,
      "health_status": "healthy",
      "last_health_check": "2025-10-15T10:30:00Z",
      "success_rate_24h": 99.2,
      "avg_response_time_ms": 250,
      "total_checks_today": 1234,
      "created_at": "2025-10-15T08:00:00Z"
    }
  ],
  "total_count": 1
}
```

---

#### Endpoint: `POST /api/v1/admin/network-providers`

**Purpose:** Add a new network provider

**Authentication:** Required (`admin` role)

**Request:**

```typescript
interface CreateProviderRequest {
  name: string;
  slug: string; // Must be URL-safe
  api_type: "rest" | "soap" | "graphql";
  base_url: string;
  auth_config: {
    type: "api_key" | "oauth2" | "basic" | "bearer";
    api_key?: string;
    client_id?: string;
    client_secret?: string;
    token_endpoint?: string;
  };
  endpoints: {
    feasibility_check: string;
    product_list?: string;
    auth_endpoint?: string;
  };
  rate_limit_per_minute?: number; // Default: 60
  logo_url?: string;
  contact_email?: string;
}

// Example:
POST /api/v1/admin/network-providers
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "MTN South Africa",
  "slug": "mtn",
  "api_type": "rest",
  "base_url": "https://hnssl.mtn.co.za/",
  "auth_config": {
    "type": "bearer",
    "api_key": "your_mtn_api_key",
    "client_id": "your_client_id",
    "client_secret": "your_client_secret"
  },
  "endpoints": {
    "feasibility_check": "/MTNBulkApi/api/Sync"
  },
  "rate_limit_per_minute": 60,
  "logo_url": "https://www.mtn.co.za/logo.png",
  "contact_email": "api-support@mtn.co.za"
}
```

**Response:**

```typescript
{
  "success": true,
  "provider": {
    "id": "uuid-456",
    "name": "MTN South Africa",
    "slug": "mtn",
    "is_active": false, // Disabled by default until tested
    "created_at": "2025-10-15T11:00:00Z"
  },
  "message": "Provider created successfully. Run a test before activating."
}
```

---

#### Endpoint: `POST /api/v1/admin/network-providers/{id}/test`

**Purpose:** Test provider API connection with sample coordinates

**Authentication:** Required (`admin` role)

**Request:**

```typescript
interface TestProviderRequest {
  test_latitude: number;
  test_longitude: number;
}

POST /api/v1/admin/network-providers/{id}/test
Authorization: Bearer {token}
Content-Type: application/json

{
  "test_latitude": -26.2041,
  "test_longitude": 28.0473
}
```

**Response (Success):**

```typescript
{
  "success": true,
  "test_results": {
    "connection_successful": true,
    "response_time_ms": 234,
    "raw_request": {
      "url": "https://hnssl.mtn.co.za/MTNBulkApi/api/Sync",
      "method": "POST",
      "headers": { /* sanitized */ },
      "body": { "latitude": -26.2041, "longitude": 28.0473 }
    },
    "raw_response": {
      "status": 200,
      "headers": { /* ... */ },
      "body": { /* Raw MTN API response */ }
    },
    "parsed_products": [
      {
        "id": "mtn_fiber_100",
        "name": "MTN Fiber 100Mbps",
        "speed_mbps": 100,
        "price_monthly": 699
      }
    ]
  },
  "recommendation": "Test successful. Provider can be activated."
}
```

**Response (Failure):**

```typescript
{
  "success": false,
  "test_results": {
    "connection_successful": false,
    "error_type": "authentication_failed",
    "error_message": "Invalid API key",
    "raw_response": {
      "status": 401,
      "body": { "error": "Unauthorized" }
    }
  },
  "recommendation": "Check authentication credentials and try again."
}
```

---

#### Endpoint: `PATCH /api/v1/admin/network-providers/{id}`

**Purpose:** Update provider configuration or toggle active status

**Request:**

```typescript
PATCH /api/v1/admin/network-providers/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "is_active": true, // Enable/disable provider
  "rate_limit_per_minute": 120, // Increase rate limit
  "auth_config": {
    // Update credentials (will re-encrypt)
    "api_key": "new_key_here"
  }
}
```

---

#### Endpoint: `DELETE /api/v1/admin/network-providers/{id}`

**Purpose:** Soft delete a provider (sets `is_active = false`, retains data)

**Request:**

```http
DELETE /api/v1/admin/network-providers/{id}
Authorization: Bearer {token}
```

**Response:**

```typescript
{
  "success": true,
  "message": "Provider deactivated. Historical data retained for analytics."
}
```

---

## 5. ADMIN INTERFACE DESIGN

### 5.1 Page: Provider Dashboard (`/admin/network-providers`)

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ Admin Panel > Network Providers                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [+ Add New Provider]           [🔄 Refresh Health Status]   │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ MTN South Africa                         🟢 Healthy  │   │
│  │ ─────────────────────────────────────────────────────│   │
│  │ Status: Active ● | Checks Today: 1,234               │   │
│  │ Success Rate (24h): 99.2% | Avg Response: 250ms     │   │
│  │ Last Health Check: 2 minutes ago                     │   │
│  │                                                       │   │
│  │ [Test Connection] [Edit] [⚙ Settings] [❌ Disable]  │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ Vodacom                                  🔴 Offline  │   │
│  │ ─────────────────────────────────────────────────────│   │
│  │ Status: Inactive ○ | Checks Today: 0                │   │
│  │ Last Error: Connection timeout                       │   │
│  │ Last Health Check: 30 minutes ago                    │   │
│  │                                                       │   │
│  │ [Test Connection] [Edit] [⚙ Settings] [✅ Enable]   │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Component:** `ProviderCard.tsx`

```tsx
interface ProviderCardProps {
  provider: {
    id: string;
    name: string;
    slug: string;
    is_active: boolean;
    health_status: "healthy" | "degraded" | "unavailable";
    success_rate_24h: number;
    avg_response_time_ms: number;
    total_checks_today: number;
    last_health_check: string;
  };
  onTest: (id: string) => void;
  onEdit: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
}

export function ProviderCard({ provider, onTest, onEdit, onToggle }: ProviderCardProps) {
  const healthIcon = {
    healthy: "🟢",
    degraded: "🟡",
    unavailable: "🔴"
  }[provider.health_status];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold">{provider.name}</h3>
          <Badge variant={provider.is_active ? "success" : "secondary"}>
            {healthIcon} {provider.health_status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Label>Status:</Label>
            <p>{provider.is_active ? "Active ●" : "Inactive ○"}</p>
          </div>
          <div>
            <Label>Checks Today:</Label>
            <p>{provider.total_checks_today.toLocaleString()}</p>
          </div>
          <div>
            <Label>Success Rate (24h):</Label>
            <p className={
              provider.success_rate_24h > 95 ? "text-green-600" : "text-yellow-600"
            }>
              {provider.success_rate_24h}%
            </p>
          </div>
          <div>
            <Label>Avg Response:</Label>
            <p>{provider.avg_response_time_ms}ms</p>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <p className="text-xs text-muted-foreground">
          Last health check: {timeAgo(provider.last_health_check)}
        </p>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => onTest(provider.id)}>
            Test Connection
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEdit(provider.id)}>
            Edit
          </Button>
        </div>
        
        <Switch
          checked={provider.is_active}
          onCheckedChange={(active) => onToggle(provider.id, active)}
        />
      </CardFooter>
    </Card>
  );
}
```

### 5.2 Page: Add/Edit Provider (`/admin/network-providers/[id]`)

**Form Fields:**

| Field | Type | Required | Validation | Help Text |
|-------|------|----------|------------|-----------|
| **Provider Name** | Text | ✅ | Max 100 chars | E.g., "MTN South Africa" |
| **Slug** | Text | ✅ | Lowercase, no spaces | URL identifier, e.g., "mtn" |
| **API Type** | Select | ✅ | rest, soap, graphql | Choose provider's API type |
| **Base URL** | URL | ✅ | Valid HTTPS URL | E.g., "https://hnssl.mtn.co.za/" |
| **Auth Type** | Select | ✅ | api_key, oauth2, bearer | How to authenticate |
| **API Key** | Password | ❌ | - | Bearer token or API key |
| **Client ID** | Text | ❌ | - | For OAuth2 flows |
| **Client Secret** | Password | ❌ | - | For OAuth2 flows |
| **Token Endpoint** | URL | ❌ | Valid URL | OAuth token endpoint |
| **Feasibility Endpoint** | Text | ✅ | Starts with / | E.g., "/MTNBulkApi/api/Sync" |
| **Rate Limit** | Number | ❌ | 1-10000 | Requests per minute (default: 60) |
| **Logo URL** | URL | ❌ | Valid URL | Provider logo |
| **Contact Email** | Email | ❌ | Valid email | Support contact |

**Component:** `ProviderForm.tsx` (Simplified)

```tsx
export function ProviderForm({ initialData, onSubmit }: ProviderFormProps) {
  const form = useForm<ProviderFormValues>({
    defaultValues: initialData || {
      name: "",
      slug: "",
      api_type: "rest",
      base_url: "",
      auth_type: "bearer",
      rate_limit_per_minute: 60,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provider Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="MTN South Africa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Slug *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="mtn" 
                      {...field}
                      onChange={(e) => {
                        // Auto-format to lowercase, no spaces
                        field.onChange(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Used in URLs, must be unique. Example: "mtn"
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* api_type, base_url, endpoints fields... */}
          </CardContent>
        </Card>

        {/* Authentication */}
        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>
              Credentials are encrypted before storage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* auth_config fields with conditional rendering based on auth_type */}
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Advanced Settings</CardTitle>
          </CardHeader>
          <CardContent>
            {/* rate_limit, transformers, etc. */}
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="button" variant="secondary" onClick={handleTest}>
            Test Connection
          </Button>
          <Button type="submit">
            {initialData ? "Update Provider" : "Create Provider"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

### 5.3 Component: API Test Console

**Purpose:** Allow admins to test provider API with sample coordinates and see raw results

```tsx
export function APITestConsole({ providerId }: { providerId: string }) {
  const [testCoords, setTestCoords] = useState({
    latitude: -26.2041,
    longitude: 28.0473
  });
  const [results, setResults] = useState<TestResults | null>(null);
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);
    const response = await fetch(`/api/v1/admin/network-providers/${providerId}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testCoords)
    });
    const data = await response.json();
    setResults(data);
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Connection Test</CardTitle>
        <CardDescription>
          Test the provider's API with sample coordinates to verify configuration
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label>Test Latitude</Label>
            <Input 
              type="number" 
              value={testCoords.latitude}
              onChange={(e) => setTestCoords(prev => ({
                ...prev, 
                latitude: parseFloat(e.target.value)
              }))}
            />
          </div>
          <div>
            <Label>Test Longitude</Label>
            <Input 
              type="number" 
              value={testCoords.longitude}
              onChange={(e) => setTestCoords(prev => ({
                ...prev, 
                longitude: parseFloat(e.target.value)
              }))}
            />
          </div>
        </div>
        
        <Button onClick={runTest} disabled={loading} className="w-full">
          {loading ? "Testing..." : "Run Test"}
        </Button>
        
        {results && (
          <div className="mt-6 space-y-4">
            {/* Success/Failure Badge */}
            <div className="flex items-center gap-2">
              {results.success ? (
                <Badge variant="success">✓ Test Passed</Badge>
              ) : (
                <Badge variant="destructive">✗ Test Failed</Badge>
              )}
              <span className="text-sm text-muted-foreground">
                Response time: {results.test_results.response_time_ms}ms
              </span>
            </div>
            
            {/* Parsed Products (if successful) */}
            {results.test_results.parsed_products && (
              <div>
                <Label>Parsed Products ({results.test_results.parsed_products.length})</Label>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
                  {JSON.stringify(results.test_results.parsed_products, null, 2)}
                </pre>
              </div>
            )}
            
            {/* Raw Request */}
            <Collapsible>
              <CollapsibleTrigger>
                <Button variant="outline" size="sm">
                  View Raw Request
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs mt-2">
                  {JSON.stringify(results.test_results.raw_request, null, 2)}
                </pre>
              </CollapsibleContent>
            </Collapsible>
            
            {/* Raw Response */}
            <Collapsible>
              <CollapsibleTrigger>
                <Button variant="outline" size="sm">
                  View Raw Response
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs mt-2">
                  {JSON.stringify(results.test_results.raw_response, null, 2)}
                </pre>
              </CollapsibleContent>
            </Collapsible>
            
            {/* Error Details (if failed) */}
            {!results.success && results.test_results.error_message && (
              <Alert variant="destructive">
                <AlertTitle>Error Details</AlertTitle>
                <AlertDescription>
                  {results.test_results.error_message}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Recommendation */}
            <Alert>
              <AlertTitle>Recommendation</AlertTitle>
              <AlertDescription>{results.recommendation}</AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## 6. FRONTEND INTEGRATION

### 6.1 Component: `<FeasibilityChecker>`

**Purpose:** Public-facing widget for customers to check service availability

**Usage:**

```tsx
// app/home-internet/page.tsx

import { FeasibilityChecker } from '@/components/feasibility/FeasibilityChecker';

export default function HomeInternetPage() {
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);

  const handleFeasibilityCheck = (result: FeasibilityCheckResponse) => {
    // Aggregate products from all providers
    const allProducts = result.providers.flatMap(p => p.products);
    setAvailableProducts(allProducts);
    
    // Optionally filter existing packages
    // to only show what's available
  };

  return (
    <div className="container mx-auto py-12">
      <h1>Home Internet Packages</h1>
      
      {/* New Feasibility Widget */}
      <FeasibilityChecker 
        onCheckComplete={handleFeasibilityCheck}
        className="mb-8"
      />
      
      {/* Existing Package Grid */}
      {availableProducts.length > 0 ? (
        <PackageGrid packages={availableProducts} />
      ) : (
        <PackageGrid packages={defaultPackages} />
      )}
    </div>
  );
}
```

**Component Implementation:**

```tsx
// components/feasibility/FeasibilityChecker.tsx

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AddressInput } from './AddressInput';
import { CoverageMap } from './CoverageMap';
import { ProductList } from './ProductList';

interface FeasibilityCheckerProps {
  onCheckComplete?: (result: FeasibilityCheckResponse) => void;
  className?: string;
}

export function FeasibilityChecker({ onCheckComplete, className }: FeasibilityCheckerProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FeasibilityCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [location, setLocation] = useState<{
    latitude?: number;
    longitude?: number;
    address?: string;
  }>({});

  const checkFeasibility = async () => {
    if (!location.latitude || !location.longitude) {
      setError('Please enter a valid address or coordinates');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/feasibility/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address
        })
      });

      if (!response.ok) {
        throw new Error('Failed to check feasibility');
      }

      const data: FeasibilityCheckResponse = await response.json();
      setResult(data);
      onCheckComplete?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Check Service Availability</CardTitle>
        <CardDescription>
          Enter your address to see which internet services are available at your location
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Address Input with Autocomplete */}
        <div className="space-y-4">
          <AddressInput
            value={location.address || ''}
            onChange={(address, coords) => {
              setLocation({
                address,
                latitude: coords?.lat,
                longitude: coords?.lng
              });
            }}
          />

          {/* Manual Coordinate Input (Collapsible) */}
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground">
              Or enter coordinates manually
            </summary>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <Input
                type="number"
                placeholder="Latitude"
                value={location.latitude || ''}
                onChange={(e) => setLocation(prev => ({
                  ...prev,
                  latitude: parseFloat(e.target.value)
                }))}
              />
              <Input
                type="number"
                placeholder="Longitude"
                value={location.longitude || ''}
                onChange={(e) => setLocation(prev => ({
                  ...prev,
                  longitude: parseFloat(e.target.value)
                }))}
              />
            </div>
          </details>

          <Button 
            onClick={checkFeasibility} 
            disabled={loading || !location.latitude}
            className="w-full"
          >
            {loading ? 'Checking...' : 'Check Availability'}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Results Display */}
        {result && (
          <div className="mt-6 space-y-6">
            {/* Summary */}
            <Alert>
              <AlertDescription>
                Found <strong>{result.total_products_available}</strong> available products
                from <strong>{result.providers.filter(p => p.available).length}</strong> providers
                at your location.
              </AlertDescription>
            </Alert>

            {/* Coverage Map (Optional) */}
            {location.latitude && location.longitude && (
              <CoverageMap
                center={{ lat: location.latitude, lng: location.longitude }}
                providers={result.providers}
              />
            )}

            {/* Available Products */}
            <ProductList providers={result.providers} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### 6.2 Component: `<AddressInput>` (Autocomplete)

```tsx
// components/feasibility/AddressInput.tsx

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import debounce from 'lodash/debounce';

interface AddressInputProps {
  value: string;
  onChange: (address: string, coords?: { lat: number; lng: number }) => void;
}

export function AddressInput({ value, onChange }: AddressInputProps) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced geocoding search
  const searchAddresses = useCallback(
    debounce(async (query: string) => {
      if (query.length < 3) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        // Use Google Places API (if configured)
        if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&components=country:za`
          );
          const data = await response.json();
          setSuggestions(
            data.predictions?.map((p: any) => ({
              id: p.place_id,
              description: p.description
            })) || []
          );
        } else {
          // Fallback: Basic address parsing
          // Could use OpenStreetMap Nominatim or similar free API
          setSuggestions([]);
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  const selectAddress = async (placeId: string, description: string) => {
    // Geocode the selected address to get coordinates
    if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?place_id=${placeId}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
        );
        const data = await response.json();
        
        if (data.results?.[0]?.geometry?.location) {
          const { lat, lng } = data.results[0].geometry.location;
          onChange(description, { lat, lng });
        }
      } catch (error) {
        console.error('Geocode error:', error);
        onChange(description);
      }
    }
    
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            searchAddresses(e.target.value);
            setOpen(true);
          }}
          placeholder="Enter your address (e.g., 123 Main St, Johannesburg)"
          className="w-full"
        />
      </PopoverTrigger>
      
      <PopoverContent className="w-full p-0">
        <Command>
          {loading && (
            <div className="p-4 text-sm text-muted-foreground">
              Searching addresses...
            </div>
          )}
          
          {!loading && suggestions.length === 0 && value.length >= 3 && (
            <CommandEmpty>No addresses found.</CommandEmpty>
          )}
          
          {!loading && suggestions.length > 0 && (
            <CommandGroup>
              {suggestions.map((suggestion) => (
                <CommandItem
                  key={suggestion.id}
                  onSelect={() => selectAddress(suggestion.id, suggestion.description)}
                >
                  {suggestion.description}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

### 6.3 Component: `<ProductList>`

```tsx
// components/feasibility/ProductList.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface ProductListProps {
  providers: ProviderResult[];
}

export function ProductList({ providers }: ProductListProps) {
  return (
    <div className="space-y-4">
      {providers.map((provider) => (
        <Card key={provider.provider}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{provider.provider_name}</CardTitle>
                <CardDescription>
                  {provider.available 
                    ? `${provider.products.length} products available`
                    : 'No coverage at this location'}
                </CardDescription>
              </div>
              
              <Badge variant={provider.available ? "success" : "secondary"}>
                {provider.available ? '✓ Available' : '✗ Not Available'}
              </Badge>
            </div>
          </CardHeader>

          {provider.available && provider.products.length > 0 && (
            <CardContent>
              <div className="space-y-4">
                {provider.products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">{product.name}</h4>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>⚡ {product.speed_mbps} Mbps</span>
                        <span>📡 {product.technology}</span>
                        {product.installation_fee === 0 && (
                          <Badge variant="outline">Free Installation</Badge>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        R{product.price_monthly}
                        <span className="text-sm font-normal text-muted-foreground">/mo</span>
                      </p>
                      {product.installation_fee > 0 && (
                        <p className="text-xs text-muted-foreground">
                          + R{product.installation_fee} installation
                        </p>
                      )}
                      
                      <Button className="mt-2" size="sm">
                        Select Package
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}

          {!provider.available && provider.error && (
            <CardContent>
              <p className="text-sm text-muted-foreground">{provider.error}</p>
            </CardContent>
          )}

          <Separator />
          
          <CardContent className="py-2">
            <p className="text-xs text-muted-foreground">
              {provider.cached ? '📦 Cached result' : '🌐 Live check'} • 
              Response time: {provider.response_time_ms}ms
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

---

## 7. MTN API INTEGRATION DETAILS

### 7.1 MTN API Overview (From Screenshot)

Based on the provided screenshot, the MTN API has the following characteristics:

**Base URL:** `https://hnssl.mtn.co.za/`

**Authentication:** Appears to use Bearer token or API key authentication

**Endpoints:**
1. `/MTNBulkApi/api/Sync` - Feasibility Study - HNS Wholesale Product Listing
2. `/MTNBulkApi/api/Sync` - Feasibility Study - HNS Wholesale Products (detailed)

**Request Structure:**
```json
{
  "latitude": -26.2041,
  "longitude": 28.0473
  // Additional fields may be required (check MTN docs)
}
```

### 7.2 MTN Provider Implementation

**File:** `lib/feasibility/transformers/mtn.ts`

```typescript
// lib/feasibility/transformers/mtn.ts

import { ProviderResult, Product } from '../types';

export const MTN_CONFIG = {
  name: 'MTN South Africa',
  slug: 'mtn',
  baseUrl: process.env.MTN_API_BASE_URL || 'https://hnssl.mtn.co.za/',
  endpoints: {
    feasibilityWholesale: '/MTNBulkApi/api/Sync',
    feasibilityProducts: '/MTNBulkApi/api/Sync'
  },
  auth: {
    type: 'bearer' as const,
    apiKey: process.env.MTN_API_KEY || '',
    clientId: process.env.MTN_CLIENT_ID || '',
    clientSecret: process.env.MTN_CLIENT_SECRET || ''
  },
  rateLimitPerMinute: 60
};

/**
 * Check MTN feasibility at given coordinates
 */
export async function checkMTNFeasibility(
  latitude: number,
  longitude: number
): Promise<ProviderResult> {
  const startTime = Date.now();

  try {
    // Build request
    const requestPayload = {
      latitude,
      longitude,
      // Add additional required fields based on MTN API docs
    };

    // Make API call
    const response = await fetch(
      `${MTN_CONFIG.baseUrl}${MTN_CONFIG.endpoints.feasibilityWholesale}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MTN_CONFIG.auth.apiKey}`,
          // Add other required headers
        },
        body: JSON.stringify(requestPayload)
      }
    );

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`MTN API returned ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();

    // Transform response to unified format
    const products = transformMTNProducts(data);

    return {
      provider: MTN_CONFIG.slug,
      provider_name: MTN_CONFIG.name,
      available: products.length > 0,
      products,
      response_time_ms: responseTime,
      cached: false
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      provider: MTN_CONFIG.slug,
      provider_name: MTN_CONFIG.name,
      available: false,
      products: [],
      response_time_ms: responseTime,
      cached: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Transform MTN API response to unified Product format
 */
function transformMTNProducts(apiResponse: any): Product[] {
  // This transformation depends on actual MTN API response structure
  // Example based on common ISP API patterns:
  
  if (!apiResponse.products || !Array.isArray(apiResponse.products)) {
    return [];
  }

  return apiResponse.products.map((mtnProduct: any) => ({
    id: `mtn_${mtnProduct.id || mtnProduct.ProductCode}`,
    name: mtnProduct.ProductName || mtnProduct.name,
    speed_mbps: parseInt(mtnProduct.Speed || mtnProduct.speed_mbps) || 0,
    price_monthly: parseFloat(mtnProduct.MonthlyFee || mtnProduct.price) || 0,
    installation_fee: parseFloat(mtnProduct.InstallationFee || mtnProduct.once_off_fee) || 0,
    technology: determineTechnology(mtnProduct),
    metadata: mtnProduct // Store raw data for reference
  }));
}

/**
 * Determine technology type from MTN product data
 */
function determineTechnology(mtnProduct: any): string {
  const name = (mtnProduct.ProductName || '').toLowerCase();
  const type = (mtnProduct.Type || '').toLowerCase();
  
  if (name.includes('fiber') || type.includes('fiber')) {
    return 'fiber';
  } else if (name.includes('5g') || type.includes('5g')) {
    return '5g';
  } else if (name.includes('lte') || name.includes('4g')) {
    return 'lte';
  } else if (name.includes('wireless')) {
    return 'wireless';
  }
  
  return 'unknown';
}

/**
 * Validate MTN API credentials
 */
export async function validateMTNCredentials(): Promise<{
  valid: boolean;
  error?: string;
}> {
  try {
    // Test with a known location
    const testResult = await checkMTNFeasibility(-26.2041, 28.0473);
    
    return {
      valid: !testResult.error,
      error: testResult.error
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

### 7.3 Provider Client Wrapper

**File:** `lib/feasibility/provider-client.ts`

```typescript
// lib/feasibility/provider-client.ts

import { checkMTNFeasibility } from './transformers/mtn';
// Future imports:
// import { checkVodacomFeasibility } from './transformers/vodacom';
// import { checkTelkomFeasibility } from './transformers/telkom';

export interface ProviderClient {
  slug: string;
  checkFeasibility: (lat: number, lon: number) => Promise<ProviderResult>;
}

/**
 * Registry of all supported provider clients
 */
export const PROVIDER_CLIENTS: Record<string, ProviderClient> = {
  mtn: {
    slug: 'mtn',
    checkFeasibility: checkMTNFeasibility
  },
  // Future providers:
  // vodacom: {
  //   slug: 'vodacom',
  //   checkFeasibility: checkVodacomFeasibility
  // },
  // telkom: {
  //   slug: 'telkom',
  //   checkFeasibility: checkTelkomFeasibility
  // }
};

/**
 * Get client for a provider slug
 */
export function getProviderClient(slug: string): ProviderClient | null {
  return PROVIDER_CLIENTS[slug] || null;
}

/**
 * Check if a provider client exists
 */
export function hasProviderClient(slug: string): boolean {
  return slug in PROVIDER_CLIENTS;
}
```

---

## 8. SECURITY & AUTHENTICATION

### 8.1 Credential Encryption

**Library:** Use `@supabase/supabase-js` built-in encryption or implement custom encryption

```typescript
// lib/feasibility/encryption.ts

import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.FEASIBILITY_ENCRYPTION_KEY || '';
const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypt sensitive provider credentials before storing in database
 */
export function encryptCredentials(credentials: Record<string, any>): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(credentials), 'utf8'),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

/**
 * Decrypt provider credentials when needed for API calls
 */
export function decryptCredentials(encryptedData: string): Record<string, any> {
  const data = Buffer.from(encryptedData, 'base64');
  
  const iv = data.subarray(0, 16);
  const authTag = data.subarray(16, 32);
  const encrypted = data.subarray(32);

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);

  return JSON.parse(decrypted.toString('utf8'));
}
```

**Environment Setup:**

```bash
# Generate encryption key (run once)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env.local
FEASIBILITY_ENCRYPTION_KEY=your_generated_key_here
```

### 8.2 RBAC Integration

**File:** `lib/rbac/permissions.ts` (MODIFIED)

```typescript
// lib/rbac/permissions.ts

export const PERMISSIONS = {
  // Existing permissions...
  
  // NEW: Feasibility system permissions
  'network_providers.read': {
    description: 'View network provider configurations',
    roles: ['admin', 'network_ops']
  },
  'network_providers.write': {
    description: 'Create, update, delete network providers',
    roles: ['admin', 'network_ops']
  },
  'network_providers.test': {
    description: 'Test provider API connections',
    roles: ['admin', 'network_ops', 'developer']
  },
  'feasibility.check': {
    description: 'Perform feasibility checks (public)',
    roles: ['*'] // All users including anonymous
  },
  'feasibility.analytics': {
    description: 'View feasibility check analytics',
    roles: ['admin', 'product_manager', 'sales_manager']
  }
};
```

### 8.3 API Rate Limiting

**File:** `lib/feasibility/rate-limiter.ts`

```typescript
// lib/feasibility/rate-limiter.ts

import { createClient } from '@/lib/supabase/client';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Check if request is within rate limit
 */
export async function checkRateLimit(
  identifier: string, // IP address or user ID
  limit: number = 20, // Requests per window
  windowMs: number = 60000 // 1 minute
): Promise<RateLimitResult> {
  const supabase = createClient();
  const now = Date.now();
  const windowStart = now - windowMs;

  // Get recent requests from cache
  const { data: recentChecks, error } = await supabase
    .from('feasibility_checks')
    .select('checked_at')
    .eq('user_session_id', identifier)
    .gte('checked_at', new Date(windowStart).toISOString())
    .order('checked_at', { ascending: false });

  if (error) {
    console.error('Rate limit check error:', error);
    return { allowed: true, remaining: limit, resetAt: new Date(now + windowMs) };
  }

  const requestCount = recentChecks?.length || 0;
  const allowed = requestCount < limit;
  const remaining = Math.max(0, limit - requestCount);
  const resetAt = new Date(now + windowMs);

  return { allowed, remaining, resetAt };
}

/**
 * Middleware for Next.js API routes
 */
export function rateLimitMiddleware(
  limit: number = 20,
  windowMs: number = 60000
) {
  return async (req: Request): Promise<Response | null> => {
    const identifier = req.headers.get('x-forwarded-for') || 
                       req.headers.get('x-real-ip') || 
                       'unknown';

    const result = await checkRateLimit(identifier, limit, windowMs);

    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            remaining: result.remaining,
            resetAt: result.resetAt.toISOString()
          }
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetAt.toISOString()
          }
        }
      );
    }

    return null; // Allow request to proceed
  };
}
```

---

## 9. PERFORMANCE & CACHING STRATEGY

### 9.1 Cache Implementation

**File:** `lib/feasibility/cache-manager.ts`

```typescript
// lib/feasibility/cache-manager.ts

import { createClient } from '@/lib/supabase/client';

const CACHE_TTL_DAYS = 7;
const CACHE_RADIUS_METERS = 500; // Consider cached if within 500m

/**
 * Check if there's a cached result near the given coordinates
 */
export async function getCachedResult(
  latitude: number,
  longitude: number,
  providerId: string
): Promise<CachedFeasibilityCheck | null> {
  const supabase = createClient();

  // Use PostGIS earthdistance functions for radius search
  const { data, error } = await supabase
    .rpc('find_nearby_feasibility_check', {
      search_lat: latitude,
      search_lon: longitude,
      search_radius_meters: CACHE_RADIUS_METERS,
      search_provider_id: providerId
    });

  if (error || !data || data.length === 0) {
    return null;
  }

  // Return the most recent valid cache entry
  const cached = data[0];
  
  return {
    id: cached.id,
    provider_id: cached.provider_id,
    latitude: cached.latitude,
    longitude: cached.longitude,
    products_available: cached.products_available,
    is_available: cached.is_available,
    response_payload: cached.response_payload,
    checked_at: cached.checked_at,
    expires_at: cached.expires_at
  };
}

/**
 * Save feasibility check result to cache
 */
export async function saveFeasibilityCheck(
  providerId: string,
  latitude: number,
  longitude: number,
  requestPayload: any,
  responsePayload: any,
  products: any[],
  isAvailable: boolean,
  checkStatus: 'success' | 'failed' | 'timeout' | 'rate_limited',
  responseTimeMs: number,
  errorMessage?: string
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('feasibility_checks')
    .insert({
      provider_id: providerId,
      latitude,
      longitude,
      request_payload: requestPayload,
      response_payload: responsePayload,
      products_available: products,
      is_available: isAvailable,
      check_status: checkStatus,
      error_message: errorMessage,
      response_time_ms: responseTimeMs,
      expires_at: new Date(Date.now() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()
    });

  if (error) {
    console.error('Failed to cache feasibility check:', error);
    // Non-fatal error, continue execution
  }
}

/**
 * Invalidate cache for a specific location
 */
export async function invalidateCache(
  latitude: number,
  longitude: number,
  radiusMeters: number = CACHE_RADIUS_METERS
): Promise<void> {
  const supabase = createClient();

  await supabase.rpc('invalidate_nearby_cache', {
    center_lat: latitude,
    center_lon: longitude,
    radius_meters: radiusMeters
  });
}
```

**Database Functions (Add to migration):**

```sql
-- Add to migration: 20251015_add_feasibility_system.sql

-- Function: Find nearby cached feasibility checks
CREATE OR REPLACE FUNCTION find_nearby_feasibility_check(
  search_lat DECIMAL,
  search_lon DECIMAL,
  search_radius_meters INTEGER,
  search_provider_id UUID
)
RETURNS TABLE (
  id UUID,
  provider_id UUID,
  latitude DECIMAL,
  longitude DECIMAL,
  products_available JSONB,
  is_available BOOLEAN,
  response_payload JSONB,
  checked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  distance_meters REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fc.id,
    fc.provider_id,
    fc.latitude,
    fc.longitude,
    fc.products_available,
    fc.is_available,
    fc.response_payload,
    fc.checked_at,
    fc.expires_at,
    earth_distance(
      ll_to_earth(fc.latitude, fc.longitude),
      ll_to_earth(search_lat, search_lon)
    ) AS distance_meters
  FROM feasibility_checks fc
  WHERE fc.provider_id = search_provider_id
    AND fc.check_status = 'success'
    AND fc.expires_at > NOW()
    AND earth_distance(
      ll_to_earth(fc.latitude, fc.longitude),
      ll_to_earth(search_lat, search_lon)
    ) <= search_radius_meters
  ORDER BY distance_meters ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function: Invalidate cache within radius
CREATE OR REPLACE FUNCTION invalidate_nearby_cache(
  center_lat DECIMAL,
  center_lon DECIMAL,
  radius_meters INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE feasibility_checks
  SET expires_at = NOW()
  WHERE earth_distance(
    ll_to_earth(latitude, longitude),
    ll_to_earth(center_lat, center_lon)
  ) <= radius_meters;
END;
$$ LANGUAGE plpgsql;
```

### 9.2 Performance Optimization

**Parallel Provider Queries:**

```typescript
// lib/feasibility/checker.ts

import { getActiveProviders } from './providers';
import { getCachedResult, saveFeasibilityCheck } from './cache-manager';
import { getProviderClient } from './provider-client';

/**
 * Check feasibility across all active providers (or specific providers)
 */
export async function checkAllProviders(
  latitude: number,
  longitude: number,
  providerSlugs?: string[],
  forceRefresh: boolean = false
): Promise<FeasibilityCheckResponse> {
  // 1. Get active providers
  const providers = await getActiveProviders(providerSlugs);

  // 2. Check feasibility for each provider in parallel
  const providerResults = await Promise.all(
    providers.map(provider => 
      checkSingleProvider(
        provider.id,
        provider.slug,
        latitude,
        longitude,
        forceRefresh
      )
    )
  );

  // 3. Aggregate results
  const totalProductsAvailable = providerResults.reduce(
    (sum, result) => sum + result.products.length,
    0
  );

  return {
    success: true,
    location: { latitude, longitude },
    providers: providerResults,
    cache_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    total_providers_checked: providerResults.length,
    total_products_available: totalProductsAvailable
  };
}

/**
 * Check feasibility for a single provider (with caching)
 */
async function checkSingleProvider(
  providerId: string,
  providerSlug: string,
  latitude: number,
  longitude: number,
  forceRefresh: boolean
): Promise<ProviderResult> {
  // 1. Check cache (unless force refresh)
  if (!forceRefresh) {
    const cached = await getCachedResult(latitude, longitude, providerId);
    
    if (cached) {
      return {
        provider: providerSlug,
        provider_name: cached.provider_name || providerSlug,
        available: cached.is_available,
        products: cached.products_available || [],
        response_time_ms: 0, // Cached response
        cached: true
      };
    }
  }

  // 2. Get provider client
  const client = getProviderClient(providerSlug);
  
  if (!client) {
    return {
      provider: providerSlug,
      provider_name: providerSlug,
      available: false,
      products: [],
      response_time_ms: 0,
      cached: false,
      error: 'Provider client not available'
    };
  }

  // 3. Make API call
  try {
    const result = await Promise.race([
      client.checkFeasibility(latitude, longitude),
      new Promise<ProviderResult>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 10000) // 10s timeout
      )
    ]);

    // 4. Save to cache
    await saveFeasibilityCheck(
      providerId,
      latitude,
      longitude,
      { latitude, longitude },
      result,
      result.products,
      result.available,
      'success',
      result.response_time_ms
    );

    return result;
  } catch (error) {
    console.error(`Provider ${providerSlug} check failed:`, error);

    // Save failed check to cache (with shorter TTL)
    await saveFeasibilityCheck(
      providerId,
      latitude,
      longitude,
      { latitude, longitude },
      {},
      [],
      false,
      error.message === 'Timeout' ? 'timeout' : 'failed',
      0,
      error instanceof Error ? error.message : 'Unknown error'
    );

    return {
      provider: providerSlug,
      provider_name: providerSlug,
      available: false,
      products: [],
      response_time_ms: 0,
      cached: false,
      error: error instanceof Error ? error.message : 'Check failed'
    };
  }
}
```

---

## 10. ERROR HANDLING & MONITORING

### 10.1 Error Codes

| Error Code | HTTP Status | Description | User-Facing Message |
|------------|-------------|-------------|---------------------|
| `VALIDATION_ERROR` | 400 | Invalid request parameters | "Please check your input and try again." |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests | "You've made too many requests. Please wait a few minutes." |
| `PROVIDER_UNAVAILABLE` | 503 | Provider API down | "This service is temporarily unavailable. Please try again later." |
| `ALL_PROVIDERS_UNAVAILABLE` | 503 | All providers down | "Our systems are experiencing issues. Please try again in a few minutes." |
| `AUTHENTICATION_FAILED` | 401 | Invalid provider credentials | "API authentication failed. Please check your credentials." |
| `INVALID_COORDINATES` | 400 | Lat/long out of range | "Invalid location coordinates provided." |
| `PROVIDER_NOT_FOUND` | 404 | Provider slug doesn't exist | "The requested provider was not found." |
| `TIMEOUT` | 504 | API call timed out | "Request timed out. Please try again." |

### 10.2 Logging Strategy

**File:** `lib/feasibility/logger.ts`

```typescript
// lib/feasibility/logger.ts

import { createClient } from '@/lib/supabase/client';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  timestamp: Date;
}

/**
 * Log feasibility system events
 */
export async function logFeasibilityEvent(entry: LogEntry): Promise<void> {
  // Log to console (development)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${entry.level.toUpperCase()}] ${entry.message}`, entry.context);
  }

  // Log to external service (production)
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    // Send to Sentry or similar
    // Sentry.captureMessage(entry.message, { level: entry.level, extra: entry.context });
  }

  // Log to database for analytics (async, non-blocking)
  const supabase = createClient();
  await supabase.from('system_logs').insert({
    level: entry.level,
    message: entry.message,
    context: entry.context,
    error_stack: entry.error?.stack,
    created_at: entry.timestamp.toISOString()
  }).catch(err => {
    console.error('Failed to log to database:', err);
  });
}

/**
 * Helper functions
 */
export const logger = {
  debug: (message: string, context?: Record<string, any>) =>
    logFeasibilityEvent({ level: LogLevel.DEBUG, message, context, timestamp: new Date() }),
  
  info: (message: string, context?: Record<string, any>) =>
    logFeasibilityEvent({ level: LogLevel.INFO, message, context, timestamp: new Date() }),
  
  warn: (message: string, context?: Record<string, any>) =>
    logFeasibilityEvent({ level: LogLevel.WARN, message, context, timestamp: new Date() }),
  
  error: (message: string, error?: Error, context?: Record<string, any>) =>
    logFeasibilityEvent({ level: LogLevel.ERROR, message, error, context, timestamp: new Date() })
};
```

### 10.3 Health Monitoring

**Background Job:** `lib/feasibility/health-monitor.ts`

```typescript
// lib/feasibility/health-monitor.ts

import { createClient } from '@/lib/supabase/client';
import { getActiveProviders } from './providers';
import { getProviderClient } from './provider-client';
import { logger } from './logger';

/**
 * Run health check for all active providers
 * (Should be called via cron job every 5 minutes)
 */
export async function runHealthChecks(): Promise<void> {
  logger.info('Starting provider health checks');

  const providers = await getActiveProviders();
  const supabase = createClient();

  for (const provider of providers) {
    try {
      const client = getProviderClient(provider.slug);
      
      if (!client) {
        await recordHealthCheck(supabase, provider.id, false, 0, 'No client available');
        continue;
      }

      const startTime = Date.now();
      
      // Test with Johannesburg coordinates
      const result = await Promise.race([
        client.checkFeasibility(-26.2041, 28.0473),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 10000)
        )
      ]);

      const responseTime = Date.now() - startTime;
      const isHealthy = !result.error;

      await recordHealthCheck(
        supabase,
        provider.id,
        isHealthy,
        responseTime,
        result.error || null
      );

      logger.info(`Health check completed for ${provider.slug}`, {
        provider: provider.slug,
        healthy: isHealthy,
        responseTime
      });

    } catch (error) {
      await recordHealthCheck(
        supabase,
        provider.id,
        false,
        0,
        error instanceof Error ? error.message : 'Unknown error'
      );

      logger.error(`Health check failed for ${provider.slug}`, error as Error);
    }
  }

  logger.info('Provider health checks completed');
}

/**
 * Record health check result in database
 */
async function recordHealthCheck(
  supabase: any,
  providerId: string,
  isHealthy: boolean,
  responseTimeMs: number,
  errorMessage: string | null
): Promise<void> {
  // Calculate success rate for last 1 hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const { data: recentChecks } = await supabase
    .from('provider_health_checks')
    .select('is_healthy')
    .eq('provider_id', providerId)
    .gte('checked_at', oneHourAgo);

  const successCount = recentChecks?.filter((c: any) => c.is_healthy).length || 0;
  const totalCount = recentChecks?.length || 1;
  const successRate = (successCount / totalCount) * 100;

  // Insert new health check
  await supabase.from('provider_health_checks').insert({
    provider_id: providerId,
    is_healthy: isHealthy,
    response_time_ms: responseTimeMs,
    error_message: errorMessage,
    http_status_code: isHealthy ? 200 : 500,
    success_rate_1h: successRate,
    avg_response_time_1h: responseTimeMs
  });
}
```

**Cron Job Setup (Supabase Edge Function or Vercel Cron):**

```typescript
// app/api/cron/health-check/route.ts

import { runHealthChecks } from '@/lib/feasibility/health-monitor';

export const runtime = 'edge';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await runHealthChecks();
    return new Response('Health checks completed', { status: 200 });
  } catch (error) {
    console.error('Health check cron failed:', error);
    return new Response('Health check failed', { status: 500 });
  }
}
```

**Vercel Cron Configuration (`vercel.json`):**

```json
{
  "crons": [
    {
      "path": "/api/cron/health-check",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

---

## 11. TESTING STRATEGY

### 11.1 Test Coverage Plan

| Test Type | Coverage Target | Tools |
|-----------|----------------|-------|
| **Unit Tests** | 80%+ | Jest + Testing Library |
| **Integration Tests** | Key flows | Playwright |
| **E2E Tests** | Critical paths | Playwright |
| **API Tests** | All endpoints | Supertest |
| **Performance Tests** | Load testing | k6 |

### 11.2 Unit Tests

**Example:** `lib/feasibility/__tests__/checker.test.ts`

```typescript
import { checkAllProviders } from '../checker';
import { getCachedResult } from '../cache-manager';
import { getProviderClient } from '../provider-client';

jest.mock('../cache-manager');
jest.mock('../provider-client');

describe('Feasibility Checker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return cached results when available', async () => {
    const mockCached = {
      id: 'uuid-123',
      provider_id: 'provider-uuid',
      latitude: -26.2041,
      longitude: 28.0473,
      is_available: true,
      products_available: [
        { id: 'mtn_fiber_100', name: 'MTN Fiber 100Mbps', speed_mbps: 100, price_monthly: 699 }
      ],
      checked_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    (getCachedResult as jest.Mock).mockResolvedValue(mockCached);

    const result = await checkAllProviders(-26.2041, 28.0473);

    expect(result.providers[0].cached).toBe(true);
    expect(result.providers[0].products).toHaveLength(1);
  });

  it('should query provider API when cache miss', async () => {
    (getCachedResult as jest.Mock).mockResolvedValue(null);
    
    const mockClient = {
      slug: 'mtn',
      checkFeasibility: jest.fn().mockResolvedValue({
        provider: 'mtn',
        available: true,
        products: [
          { id: 'mtn_fiber_100', name: 'MTN Fiber 100Mbps', speed_mbps: 100, price_monthly: 699 }
        ],
        response_time_ms: 250
      })
    };

    (getProviderClient as jest.Mock).mockReturnValue(mockClient);

    const result = await checkAllProviders(-26.2041, 28.0473);

    expect(mockClient.checkFeasibility).toHaveBeenCalledWith(-26.2041, 28.0473);
    expect(result.providers[0].cached).toBe(false);
  });

  it('should handle provider API failures gracefully', async () => {
    (getCachedResult as jest.Mock).mockResolvedValue(null);
    
    const mockClient = {
      slug: 'mtn',
      checkFeasibility: jest.fn().mockRejectedValue(new Error('API Error'))
    };

    (getProviderClient as jest.Mock).mockReturnValue(mockClient);

    const result = await checkAllProviders(-26.2041, 28.0473);

    expect(result.providers[0].available).toBe(false);
    expect(result.providers[0].error).toBe('API Error');
  });
});
```

### 11.3 Integration Tests

**Example:** `__tests__/integration/feasibility-flow.test.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feasibility Check Flow', () => {
  test('should complete feasibility check from home page', async ({ page }) => {
    // Navigate to home internet page
    await page.goto('/home-internet');

    // Enter address
    await page.fill('[data-testid="address-input"]', '123 Main St, Johannesburg');
    await page.click('[data-testid="feasibility-check-button"]');

    // Wait for results
    await page.waitForSelector('[data-testid="feasibility-results"]');

    // Verify provider cards are displayed
    const providerCards = await page.locator('[data-testid="provider-card"]').count();
    expect(providerCards).toBeGreaterThan(0);

    // Verify products are listed
    const products = await page.locator('[data-testid="product-item"]').count();
    expect(products).toBeGreaterThan(0);

    // Click on a product
    await page.click('[data-testid="product-item"]:first-child >> text=Select Package');

    // Verify order flow initiated
    await expect(page).toHaveURL(/\/order/);
  });
});
```

### 11.4 API Tests

**Example:** `__tests__/api/feasibility-check.test.ts`

```typescript
import { POST } from '@/app/api/v1/feasibility/check/route';

describe('POST /api/v1/feasibility/check', () => {
  it('should return 400 for invalid coordinates', async () => {
    const request = new Request('http://localhost/api/v1/feasibility/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: 200, // Invalid
        longitude: 28.0473
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return cached results when available', async () => {
    // First request
    const request1 = new Request('http://localhost/api/v1/feasibility/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: -26.2041,
        longitude: 28.0473
      })
    });

    const response1 = await POST(request1);
    expect(response1.status).toBe(200);

    const data1 = await response1.json();
    expect(data1.providers[0].cached).toBe(false);

    // Second request (should be cached)
    const response2 = await POST(request1);
    const data2 = await response2.json();
    expect(data2.providers[0].cached).toBe(true);
  });
});
```

---

## 12. DEPLOYMENT PLAN

### 12.1 Deployment Checklist

#### Pre-Deployment:
- [ ] All unit tests passing (≥80% coverage)
- [ ] Integration tests passing
- [ ] API tests passing
- [ ] Performance tests completed (response time < 2s)
- [ ] Security audit completed
- [ ] Database migrations tested in staging
- [ ] Environment variables configured
- [ ] Rate limiting tested
- [ ] Error handling verified
- [ ] Logging configured
- [ ] Health monitoring active

#### Deployment Steps:
1. **Database Migration (Staging)**
   ```bash
   # Run migration in staging
   npx supabase db push
   
   # Verify tables created
   npx supabase db diff
   
   # Test with sample data
   ```

2. **Deploy Application Code (Staging)**
   ```bash
   # Deploy to Vercel staging
   vercel --env=staging
   
   # Smoke test
   curl -X POST https://staging.circletel.co.za/api/v1/feasibility/check \
     -H "Content-Type: application/json" \
     -d '{"latitude": -26.2041, "longitude": 28.0473}'
   ```

3. **User Acceptance Testing (Staging)**
   - [ ] Admin can add/edit provider
   - [ ] Admin can test provider connection
   - [ ] Frontend feasibility checker works
   - [ ] Cache hit rate > 50%
   - [ ] Error handling graceful

4. **Production Deployment**
   ```bash
   # Backup production database
   pg_dump -h <prod_host> -U <user> -d circle_tel_prod > backup.sql
   
   # Run migration in production
   npx supabase db push --project-ref <prod_ref>
   
   # Deploy application
   vercel --prod
   
   # Enable feature flag
   # Set NEXT_PUBLIC_ENABLE_FEASIBILITY=true in Vercel dashboard
   ```

5. **Post-Deployment Verification**
   - [ ] Health checks running every 5 minutes
   - [ ] Logs flowing to monitoring system
   - [ ] No errors in Sentry
   - [ ] Response times within SLA
   - [ ] Cache hit rate tracking

### 12.2 Environment Configuration

**Staging:**
```bash
# .env.staging
NEXT_PUBLIC_ENABLE_FEASIBILITY=true
MTN_API_BASE_URL=https://staging-api.mtn.co.za/
MTN_API_KEY=staging_key_here
FEASIBILITY_CACHE_TTL_DAYS=1 # Shorter TTL for testing
FEASIBILITY_RATE_LIMIT_PER_MINUTE=100 # Higher limit for testing
SENTRY_DSN=staging_sentry_dsn
```

**Production:**
```bash
# .env.production
NEXT_PUBLIC_ENABLE_FEASIBILITY=true
MTN_API_BASE_URL=https://hnssl.mtn.co.za/
MTN_API_KEY=production_key_here
MTN_CLIENT_ID=production_client_id
MTN_CLIENT_SECRET=production_client_secret
FEASIBILITY_CACHE_TTL_DAYS=7
FEASIBILITY_CACHE_RADIUS_METERS=500
FEASIBILITY_RATE_LIMIT_PER_MINUTE=60
FEASIBILITY_ENCRYPTION_KEY=<32_byte_hex_key>
SENTRY_DSN=production_sentry_dsn
CRON_SECRET=<random_secret_for_cron>
```

### 12.3 Monitoring Setup

**Supabase Dashboard Alerts:**
- Database connection pool usage > 80%
- Query response time > 1s
- Error rate > 1%

**Vercel Alerts:**
- Function execution time > 5s
- Function error rate > 5%
- Bandwidth usage spike

**Custom Alerts:**
- Provider health check failures > 3 consecutive
- Cache hit rate < 50%
- Feasibility check volume spike (> 10x normal)

---

## 13. ROLLBACK PROCEDURES

### 13.1 Feature Flag Rollback

**Immediate Disable (< 1 minute):**

```bash
# Via Vercel Dashboard:
# 1. Go to Project Settings > Environment Variables
# 2. Set NEXT_PUBLIC_ENABLE_FEASIBILITY=false
# 3. Redeploy (takes ~30 seconds)

# Or via CLI:
vercel env rm NEXT_PUBLIC_ENABLE_FEASIBILITY production
vercel env add NEXT_PUBLIC_ENABLE_FEASIBILITY production
# Enter: false
vercel --prod
```

**Result:** Frontend feasibility checker hidden, all API calls no-op

### 13.2 Code Rollback

**Revert to Previous Deployment:**

```bash
# List recent deployments
vercel ls circle-tel

# Promote previous deployment
vercel promote <previous_deployment_url> --prod
```

**Estimated Time:** 2-3 minutes

### 13.3 Database Rollback

**Scenario: Migration caused issues**

```bash
# Restore from backup
psql -h <prod_host> -U <user> -d circle_tel_prod < backup.sql

# Or drop new tables (if no data loss concern)
psql -h <prod_host> -U <user> -d circle_tel_prod -c "
  DROP TABLE IF EXISTS provider_health_checks CASCADE;
  DROP TABLE IF EXISTS feasibility_checks CASCADE;
  DROP TABLE IF EXISTS network_providers CASCADE;
"
```

**⚠️ Warning:** Only perform database rollback if absolutely necessary. Feature flag rollback is safer.

### 13.4 Rollback Decision Matrix

| Issue | Severity | Rollback Method | Estimated Time |
|-------|----------|-----------------|----------------|
| Frontend widget broken | Low | Feature flag disable | < 1 min |
| API errors > 10% | Medium | Feature flag + code revert | < 5 min |
| Database performance degradation | High | Feature flag + investigate | < 2 min |
| Data corruption | Critical | Full rollback + restore backup | < 30 min |

---

## 14. FUTURE EXTENSIBILITY

### 14.1 Additional Providers

**Adding Vodacom (Example):**

1. **Create Transformer:**
   ```typescript
   // lib/feasibility/transformers/vodacom.ts
   
   export async function checkVodacomFeasibility(
     latitude: number,
     longitude: number
   ): Promise<ProviderResult> {
     // Similar to MTN implementation
     // ...
   }
   ```

2. **Register Client:**
   ```typescript
   // lib/feasibility/provider-client.ts
   
   export const PROVIDER_CLIENTS: Record<string, ProviderClient> = {
     mtn: { slug: 'mtn', checkFeasibility: checkMTNFeasibility },
     vodacom: { slug: 'vodacom', checkFeasibility: checkVodacomFeasibility }, // NEW
     // ...
   };
   ```

3. **Admin Configuration:**
   - Navigate to `/admin/network-providers`
   - Click "Add New Provider"
   - Fill in Vodacom details
   - Test connection
   - Enable

**Total Time:** ~2 hours for developer, 15 minutes for admin

### 14.2 Coverage Heatmap Visualization

**Future Enhancement:**

```typescript
// components/feasibility/CoverageHeatmap.tsx

export function CoverageHeatmap({ provider }: { provider: string }) {
  // Fetch historical feasibility checks
  // Generate heatmap using Google Maps API or Mapbox
  // Color-code areas: Green (available), Red (not available), Gray (unknown)
  
  return (
    <div className="w-full h-96">
      <GoogleMap
        center={{ lat: -26.2041, lng: 28.0473 }}
        zoom={12}
        heatmapLayer={{
          data: heatmapData,
          gradient: ['rgba(0, 255, 0, 0)', 'rgba(0, 255, 0, 1)']
        }}
      />
    </div>
  );
}
```

### 14.3 Webhooks for Coverage Changes

**Use Case:** Notify users when service becomes available in their area

**Implementation:**

```typescript
// lib/feasibility/webhooks.ts

export async function notifyCoverageChange(
  latitude: number,
  longitude: number,
  provider: string,
  nowAvailable: boolean
) {
  // Find users who requested notifications for this area
  const { data: waitlist } = await supabase
    .from('coverage_waitlist')
    .select('*')
    .eq('provider', provider)
    .filter('latitude', 'near', latitude)
    .filter('longitude', 'near', longitude);

  // Send email notifications
  for (const user of waitlist) {
    await sendEmail({
      to: user.email,
      subject: `Good news! ${provider} is now available at your location`,
      html: `<p>Hi ${user.name},</p><p>${provider} fiber is now available at your address. Check it out!</p>`
    });
  }
}
```

---

## 15. APPENDICES

### 15.1 Glossary

| Term | Definition |
|------|------------|
| **Feasibility Check** | Query to determine if network service is available at a location |
| **Provider** | Network service provider (e.g., MTN, Vodacom) |
| **Transformer** | Function that converts provider-specific API responses to unified format |
| **Cache TTL** | Time To Live - how long cached results remain valid (default: 7 days) |
| **Cache Radius** | Distance within which cached results are considered valid (default: 500m) |
| **Health Check** | Automated test of provider API availability |
| **GIS** | Geographic Information System - spatial database extensions |
| **RLS** | Row Level Security - Supabase database access control |
| **RBAC** | Role-Based Access Control - permission system |

### 15.2 Related Documentation

- **Factory.ai CLI Docs:** https://docs.factory.ai/cli/
- **Supabase PostGIS Guide:** https://supabase.com/docs/guides/database/extensions/postgis
- **Next.js 15 API Routes:** https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- **MTN API Documentation:** [Provided by MTN partnership team]
- **Circle Tel RBAC System:** `docs/rbac.md` (internal)

### 15.3 Support Contacts

| Role | Contact | Responsibility |
|------|---------|----------------|
| **Network Operations Lead** | netops@circletelsa.co.za | Provider configurations |
| **Product Manager** | product@circletelsa.co.za | Feature priorities |
| **Lead Developer** | dev-lead@circletelsa.co.za | Technical implementation |
| **DevOps Engineer** | devops@circletelsa.co.za | Deployment & monitoring |
| **MTN API Support** | api-support@mtn.co.za | MTN API issues |

### 15.4 Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-15 | Initial specification | AI Tech-Lead |

---

## APPROVAL SIGNATURES

### Technical Approval:

- [ ] **Lead Developer:** _______________________ Date: _______
- [ ] **DevOps Engineer:** _______________________ Date: _______
- [ ] **Database Administrator:** _________________ Date: _______

### Business Approval:

- [ ] **Product Manager:** _______________________ Date: _______
- [ ] **Network Operations Lead:** _______________ Date: _______
- [ ] **Executive Sponsor:** _____________________ Date: _______

---

## NEXT STEPS AFTER APPROVAL

Once this Phase 1 specification is approved by all stakeholders:

1. **Schedule Phase 2 Kickoff Meeting**
   - Review implementation plan
   - Assign tasks to developers
   - Set sprint goals

2. **Generate Factory Droid CLI Commands**
   - Request automated scaffolding
   - Define safe implementation workflow
   - Create checkpoint testing strategy

3. **Begin Development**
   - Week 1: Database setup + migrations
   - Week 2: API endpoints + business logic
   - Week 3: Admin UI components
   - Week 4: Frontend integration
   - Week 5-6: Testing + deployment

---

**END OF PHASE 1 SPECIFICATION**

**Total Pages:** 50+  
**Total Words:** ~15,000  
**Estimated Reading Time:** 60 minutes  
**Estimated Implementation Time:** 6-8 weeks

**Document Status:** 📋 AWAITING APPROVAL

Please review this specification and provide feedback or approval to proceed to Phase 2.