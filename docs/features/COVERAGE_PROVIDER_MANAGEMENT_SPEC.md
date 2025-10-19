# Coverage Provider Management Module - Feature Specification

> **Feature**: Comprehensive Coverage Provider API Management System
> **Status**: Enhancement (Base exists + MTN Wholesale APIs in Production)
> **Priority**: High
> **Complexity**: Large (L)
> **Target Phase**: Phase 5
> **Created**: 2025-10-18

---

## Executive Summary

Build a comprehensive admin module for managing network provider APIs with full CRUD operations, API testing tools, configuration management, and seamless integration with the coverage checking system.

**Current Production State** ✅:
- ✅ MTN Wholesale Feasibility API fully integrated (`/api/mtn-wholesale/feasibility`)
- ✅ MTN Wholesale Products API (`/api/mtn-wholesale/products`)
- ✅ MTN SSO Authentication with auto-refresh (GitHub Actions cron)
- ✅ MTN Business WMS API (`/lib/coverage/mtn/wms-client.ts`)
- ✅ MTN Consumer API (`/lib/coverage/mtn/wms-realtime-client.ts`)
- ✅ Dual-source MTN integration (Business + Consumer)
- ✅ Geographic validation for South Africa
- ✅ Performance monitoring (`/lib/coverage/mtn/monitoring.ts`)
- ✅ Caching layer (5-min TTL)

**Admin Panel Current State**:
- ✅ Basic providers page exists (`/app/admin/coverage/providers/page.tsx`)
- ✅ Provider CRUD API endpoints (`/app/api/admin/providers/`)
- ✅ Database schema (`fttb_network_providers` table)
- ✅ TypeScript types (`/lib/types/coverage-providers.ts`)
- ⚠️ **No UI for editing MTN Wholesale API config**
- ⚠️ **MTN config hardcoded in code (not in database)**
- ⚠️ **No API testing interface**
- ⚠️ **No provider performance dashboard**
- ⚠️ **No integration with coverage aggregation service**

**Desired State**:
- ✅ Move MTN Wholesale config from code → database
- ✅ Full provider CRUD with rich UI
- ✅ API configuration editor (endpoints, auth, headers, SSO)
- ✅ Real-time API testing tool
- ✅ Provider performance dashboard (build on existing monitoring)
- ✅ Logo upload and management
- ✅ Coverage file upload (KML/KMZ)
- ✅ Automatic integration with coverage system
- ✅ Provider fallback configuration (MTN Business → MTN Consumer → Static)
- ✅ RBAC integration (Operations Manager role)

---

## User Stories

### 1. Operations Manager - Manage MTN Wholesale Config

**As an** Operations Manager
**I want to** update MTN Wholesale API configuration (endpoints, auth, products) via admin panel
**So that** I can manage API changes without developer intervention or code deployments

**Acceptance Criteria**:
- [ ] Can view current MTN Wholesale API configuration
- [ ] Can update API endpoints (Testing vs Production base URL)
- [ ] Can update X-API-KEY (if MTN provides new key)
- [ ] Can test connection before saving
- [ ] Can view session refresh status (SSO CAS Ticket expiry)
- [ ] Changes immediately reflected in coverage checker
- [ ] Audit log records who changed config

**Business Value**: Zero downtime for API config changes, faster response to MTN API updates

---

### 2. Operations Manager - Add New Provider

**As an** Operations Manager
**I want to** add a new network provider (e.g., Vodacom, Rain, Frogfoot) through the admin panel
**So that** customers can see coverage from that provider without developer involvement

**Acceptance Criteria**:
- [ ] Can create provider with name, display name, type (API/Static)
- [ ] Can configure API endpoints (feasibility, products, availability)
- [ ] Can set authentication method (API key, OAuth, Bearer token, SSO)
- [ ] Can upload provider logo (auto-resized to 200x50px)
- [ ] Can set service types (fibre, 5G, LTE, etc.)
- [ ] Can set provider priority (1-10 for fallback order)
- [ ] Changes immediately reflected in coverage checker
- [ ] Audit log records who added the provider

**Business Value**: Faster time-to-market for new providers (days instead of weeks)

---

### 3. Operations Manager - Test Provider API

**As an** Operations Manager
**I want to** test a provider's API before enabling it for customers
**So that** I can verify coverage data is accurate and API is responding correctly

**Acceptance Criteria**:
- [ ] Can test MTN Wholesale Feasibility API with real addresses
- [ ] Can enter test coordinates or address
- [ ] Can see raw API request (headers, body, URL, X-API-KEY)
- [ ] Can see raw API response (JSON formatted)
- [ ] Can see response time and success/failure status
- [ ] Can test all configured endpoints (feasibility, products)
- [ ] Can compare MTN Business vs MTN Consumer responses
- [ ] Can save test results for documentation

**Business Value**: Reduces production errors, increases confidence in data quality

---

### 4. System Admin - Monitor MTN API Performance

**As a** System Admin
**I want to** see real-time performance metrics for MTN Wholesale and Consumer APIs
**So that** I can identify failing APIs and optimize fallback order

**Acceptance Criteria**:
- [ ] Dashboard shows MTN Business API success rate (last 24 hours)
- [ ] Dashboard shows MTN Consumer API success rate
- [ ] Dashboard shows SSO session health (CAS Ticket status)
- [ ] Average response time per API endpoint
- [ ] Error rate and error types (anti-bot, timeout, invalid response)
- [ ] Geographic distribution of coverage checks
- [ ] Can drill down into failed requests
- [ ] Can disable underperforming APIs with one click
- [ ] Can manually trigger SSO session refresh

**Business Value**: 95%+ API success rate, faster troubleshooting, proactive session management

---

### 5. Operations Manager - Upload Coverage Files

**As an** Operations Manager
**I want to** upload KML/KMZ coverage files for providers without APIs
**So that** we can offer coverage from static-file providers (e.g., Frogfoot, local ISPs)

**Acceptance Criteria**:
- [ ] Can upload KML or KMZ files (drag-and-drop)
- [ ] File automatically parsed for bounding box and features
- [ ] Can map service types to file (fibre, LTE, etc.)
- [ ] Can set coverage areas (provinces, cities)
- [ ] File stored securely with metadata
- [ ] Coverage system automatically queries files
- [ ] Can replace outdated files

**Business Value**: Support providers without APIs, expand coverage options

---

### 6. Product Manager - Configure Fallback Strategy

**As a** Product Manager
**I want to** configure MTN provider fallback order (Business → Consumer → Static)
**So that** customers always see coverage data even if primary API fails

**Acceptance Criteria**:
- [ ] Can set MTN Business API as priority 1
- [ ] Can set MTN Consumer API as priority 2
- [ ] Can configure fallback strategy (sequential with timeout)
- [ ] Can set timeout values per provider (currently 5s)
- [ ] Can configure retry attempts and delays
- [ ] Can test fallback behavior with simulated failures
- [ ] Configuration saved to global settings
- [ ] Changes take effect immediately (no deploy needed)

**Business Value**: 99.5%+ coverage check success rate

---

## Technical Breakdown

### Frontend Impact

#### New Components

1. **ProviderManagementDashboard** (`/app/admin/coverage/providers/page.tsx` - ENHANCE)
   - Provider list with status indicators (✅ MTN Business, ✅ MTN Consumer, ⚠️ Supersonic Disabled)
   - Quick actions (enable/disable, edit, test, view performance)
   - Search and filter (type, status, service types)
   - Performance metrics cards (success rate, avg response time)
   - SSO session status badge (Active, Expiring Soon, Expired)

2. **MTNWholesaleEditor** (`/components/admin/coverage/MTNWholesaleEditor.tsx`)
   - **API Config Tab**:
     - Base URL selector (Testing vs Production)
     - X-API-KEY input (masked, reveal on click)
     - Product names list (MNS_10G, MNS_20G, etc.)
     - Enable/disable specific products
   - **SSO Config Tab**:
     - SSO Login URL display
     - CAS Ticket status (valid until timestamp)
     - Manual refresh button
     - Auto-refresh schedule display (GitHub Actions cron)
   - **Testing Tab**:
     - Address input with Google autocomplete
     - Product selector (multi-select)
     - "Test Feasibility" button
     - Request/Response panels
   - **Performance Tab**:
     - Last 24h success rate chart
     - Failed requests table
     - Average response time gauge

3. **ProviderEditor** (`/components/admin/coverage/ProviderEditor.tsx`)
   - Multi-step form (Details → API Config → Testing)
   - API configuration editor with syntax highlighting
   - Logo upload with preview
   - Service type multi-select
   - Priority slider (1-10 scale)
   - Authentication method dropdown:
     - None
     - API Key (X-API-KEY header)
     - Bearer Token
     - OAuth 2.0
     - **SSO (MTN-style with CAS Ticket)**

4. **ApiTestingTool** (`/components/admin/coverage/ApiTestingTool.tsx`)
   - Provider selector (test single or compare all)
   - Address/coordinates input (Google Maps autocomplete)
   - Product selector (for feasibility APIs)
   - Request panel (auto-generated from config, syntax highlighted)
   - Response panel (JSON viewer with collapsible nodes)
   - Performance metrics (response time, status code, timestamp)
   - "Test MTN Business" vs "Test MTN Consumer" buttons
   - Save test results button

5. **CoverageFileUploader** (`/components/admin/coverage/CoverageFileUploader.tsx`)
   - Drag-and-drop zone
   - File type validation (KML/KMZ only, max 50MB)
   - Upload progress bar
   - Metadata editor (service types, coverage areas)
   - Bounding box map preview (Leaflet or Google Maps)
   - Parse progress indicator (for large files)

6. **ProviderPerformanceDashboard** (`/app/admin/coverage/performance/page.tsx` - NEW)
   - **Overview Cards**:
     - Total API calls (24h)
     - Overall success rate
     - Average response time
     - Active providers count
   - **Charts** (using Recharts):
     - Line chart: API calls over time (MTN Business vs Consumer)
     - Pie chart: Success vs Failure rate
     - Bar chart: Response time distribution
     - Heatmap: Geographic distribution of checks
   - **Provider Comparison Table**:
     - Provider name
     - Success rate (24h)
     - Avg response time
     - Last successful check
     - Status (Healthy, Degraded, Down)
     - Quick actions (Disable, Test, View Logs)
   - **Failed Requests Table**:
     - Timestamp
     - Provider
     - Endpoint
     - Error message
     - Address/Coordinates
     - "Retry" button

7. **SSOSessionMonitor** (`/components/admin/coverage/SSOSessionMonitor.tsx`)
   - CAS Ticket expiry countdown
   - Session health status (✅ Healthy, ⚠️ Expiring Soon, ❌ Expired)
   - Last refresh timestamp
   - Next auto-refresh scheduled time
   - Manual "Refresh Now" button
   - Session refresh history (last 10 refreshes with status)

#### Modified Components

1. **CoverageAggregationService** (`/lib/coverage/aggregation-service.ts`)
   - Replace hardcoded MTN config with database-driven config
   - Load providers from `network_providers` table (sorted by priority)
   - Implement priority-based fallback:
     ```typescript
     const providers = await getEnabledProviders(); // From DB
     for (const provider of providers.sort((a, b) => a.priority - b.priority)) {
       const coverage = await checkProviderCoverage(provider, coords);
       if (coverage.success) return coverage; // Success, stop fallback
     }
     ```
   - Add caching layer for provider configs (5 min TTL, same as coverage cache)
   - Log performance metrics to `provider_api_logs`

2. **MTNSSOAuth** (`/lib/services/mtn-sso-auth.ts`)
   - Load SSO config from database (not environment variables)
   - Add method to update CAS Ticket from admin panel
   - Add validation method (check ticket expiry)
   - Add manual refresh trigger

3. **Admin Sidebar** (`/components/admin/layout/Sidebar.tsx`)
   - Update Coverage section menu:
     ```
     Coverage
     ├─ Dashboard
     ├─ Providers (enhanced)
     ├─ API Testing (new)
     ├─ Performance (new)
     ├─ MTN Wholesale Config (new)
     └─ Configuration
     ```

#### UI/UX Considerations

- **Responsive Design**: All tables responsive on mobile (horizontal scroll + sticky columns)
- **Loading States**: Skeleton loaders for all async operations
- **Error Handling**: Toast notifications for all API errors
- **Confirmation Modals**: Confirm destructive actions (delete, disable, session refresh)
- **Inline Editing**: Edit provider details without full form modal
- **Real-time Updates**: Poll for MTN session status every 30s
- **Syntax Highlighting**: JSON request/response panels use `react-json-view`

---

### Backend Impact

#### New API Endpoints

1. **`GET /api/admin/providers/mtn-wholesale`**
   - Returns current MTN Wholesale configuration from database
   - Includes SSO session status (CAS Ticket expiry)
   - Includes enabled products list

2. **`PATCH /api/admin/providers/mtn-wholesale`**
   - Updates MTN Wholesale configuration
   - Validates X-API-KEY before saving
   - Invalidates coverage cache
   - Logs audit trail

3. **`POST /api/admin/providers/mtn-wholesale/test`**
   - Tests MTN Wholesale Feasibility API
   - Accepts: `{ address, product_names }`
   - Returns: full request/response + performance metrics
   - Logs test result to `provider_api_logs`

4. **`POST /api/admin/providers/mtn-wholesale/refresh-session`**
   - Manually triggers MTN SSO session refresh
   - Calls existing `mtnSSOAuth.refreshSession()`
   - Updates database with new CAS Ticket
   - Returns new expiry timestamp

5. **`POST /api/admin/providers/test`**
   - Generic provider API testing endpoint
   - Accepts: `{ providerId, coordinates, address }`
   - Returns: request/response details + performance metrics
   - Logs test results to database

6. **`GET /api/admin/providers/performance`**
   - Query params: `providerId`, `startDate`, `endDate`
   - Returns aggregated metrics (success rate, avg response time)
   - Includes error breakdown by type
   - Joins `provider_api_logs` table

7. **`POST /api/admin/providers/[id]/logo`** ✅ (exists, enhance)
   - Upload logo image
   - Validate file type (PNG, JPG, SVG)
   - Resize to 200x50px using Sharp
   - Store in `/uploads/provider-logos/`

8. **`POST /api/admin/providers/[id]/coverage-files`** ✅ (exists, enhance)
   - Upload KML/KMZ file
   - Parse with `xml2js` and `adm-zip`
   - Extract metadata (bounding box, features, author)
   - Store in `/uploads/coverage-files/`

9. **`GET /api/admin/providers/configuration`**
   - Return global provider configuration
   - Includes fallback strategy, default timeouts, etc.

10. **`PATCH /api/admin/providers/configuration`**
    - Update global provider configuration
    - Invalidate cache to apply changes immediately

#### Modified API Endpoints

1. **`GET /api/admin/providers`** ✅ (exists, enhance)
   - Add filtering: `?type=api&enabled=true&priority_gte=5`
   - Include performance metrics (last 24h success rate)
   - Include SSO session status for MTN providers
   - Sort by priority by default

2. **`POST /api/admin/providers`** ✅ (exists, enhance)
   - Enhanced validation (duplicate name check)
   - Auto-generate unique `name` from `displayName`
   - Create audit log entry
   - For MTN provider: validate SSO config

3. **`PATCH /api/admin/providers`** ✅ (exists, enhance)
   - Support partial updates
   - Invalidate coverage cache on config changes
   - Update `updated_at` timestamp
   - For MTN provider: validate CAS Ticket if SSO config changed

4. **`DELETE /api/admin/providers`** ✅ (exists, enhance)
   - Soft delete (set `enabled=false`) instead of hard delete
   - Check if provider is in use (has coverage checks in last 30 days)
   - Archive related coverage files
   - Cannot delete MTN providers (system-critical)

#### Database Schema Changes

**New Table: `provider_api_logs`**
```sql
CREATE TABLE provider_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES network_providers(id),
  endpoint_type TEXT CHECK (endpoint_type IN ('feasibility', 'products', 'coverage', 'availability')),
  request_url TEXT,
  request_method TEXT,
  request_headers JSONB,
  request_body JSONB,
  response_status INTEGER,
  response_body JSONB,
  response_time_ms INTEGER,
  success BOOLEAN,
  error_message TEXT,
  error_code TEXT,
  coordinates GEOGRAPHY(POINT, 4326),
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_provider_api_logs_provider ON provider_api_logs(provider_id, created_at DESC);
CREATE INDEX idx_provider_api_logs_success ON provider_api_logs(provider_id, success);
CREATE INDEX idx_provider_api_logs_created ON provider_api_logs(created_at DESC) WHERE success = false;

-- Partition by month for performance (logs grow fast)
-- Implement after 1M+ rows
```

**New Table: `provider_configuration`**
```sql
CREATE TABLE provider_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default configuration
INSERT INTO provider_configuration (setting_key, setting_value, description) VALUES
('fallback_strategy', '{"type": "sequential", "maxProviders": 3, "timeout": 5000}', 'Provider fallback configuration'),
('default_timeouts', '{"api": 5000, "static": 1000, "cache": 100}', 'Default timeout values in milliseconds'),
('rate_limits', '{"rpm": 60, "hourly": 1000, "daily": 10000}', 'API rate limit settings'),
('geographic_bounds', '{"north": -22.1, "south": -34.8, "east": 32.9, "west": 16.5}', 'South Africa bounding box'),
('mtn_wholesale_products', '["MNS_10G", "MNS_20G", "MNS_50G", "MNS_100G", "MNS_200G", "MNS_500G", "MNS_1G"]', 'Enabled MTN Wholesale products');
```

**Enhanced Table: `network_providers`** (add columns)
```sql
ALTER TABLE network_providers
ADD COLUMN IF NOT EXISTS api_config JSONB,
ADD COLUMN IF NOT EXISTS static_config JSONB,
ADD COLUMN IF NOT EXISTS last_health_check TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS health_status TEXT CHECK (health_status IN ('healthy', 'degraded', 'down', 'untested')) DEFAULT 'untested',
ADD COLUMN IF NOT EXISTS success_rate_24h DECIMAL(5, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS avg_response_time_24h INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_successful_check TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sso_config JSONB;

COMMENT ON COLUMN network_providers.api_config IS 'API configuration (endpoints, auth type, headers, rate limits)';
COMMENT ON COLUMN network_providers.static_config IS 'Static file configuration (KML/KMZ paths, coverage areas)';
COMMENT ON COLUMN network_providers.sso_config IS 'SSO configuration (login URL, CAS Ticket, expiry timestamp)';

-- Migrate MTN Wholesale config from code to database
INSERT INTO network_providers (
  name,
  display_name,
  enabled,
  type,
  service_types,
  priority,
  api_config,
  sso_config,
  health_status
) VALUES (
  'mtn_wholesale',
  'MTN Wholesale (MNS)',
  true,
  'api',
  ARRAY['fibre', 'fixed_lte'],
  1,
  '{
    "baseUrl": "https://ftool.mtnbusiness.co.za",
    "authMethod": "api_key",
    "apiKey": "bdaacbcae8ab77672e545649df54d0df",
    "rateLimitRpm": 60,
    "timeoutMs": 5000,
    "retryAttempts": 3,
    "endpoints": {
      "feasibility": "/api/v1/feasibility/product/wholesale/mns/bulk",
      "products": "/api/v1/feasibility/product/wholesale/mns"
    },
    "customHeaders": {
      "X-API-KEY": "bdaacbcae8ab77672e545649df54d0df",
      "Content-Type": "application/json"
    }
  }'::JSONB,
  '{
    "loginUrl": "https://asp-feasibility.mtnbusiness.co.za/auth/login",
    "casTicket": null,
    "expiryTimestamp": null,
    "autoRefreshEnabled": true,
    "autoRefreshCron": "0 */6 * * *"
  }'::JSONB,
  'healthy'
) ON CONFLICT (name) DO NOTHING;

-- Insert MTN Business (WMS) as separate provider
INSERT INTO network_providers (
  name,
  display_name,
  enabled,
  type,
  service_types,
  priority,
  api_config,
  health_status
) VALUES (
  'mtn_business_wms',
  'MTN Business (WMS)',
  true,
  'api',
  ARRAY['fibre', 'fixed_lte', 'uncapped_wireless'],
  2,
  '{
    "baseUrl": "https://biz.mtn.co.za/arcgis/rest/services",
    "authMethod": "none",
    "timeoutMs": 5000,
    "endpoints": {
      "coverage": "/BusinessProduct_Production/MapServer/identify"
    }
  }'::JSONB,
  'healthy'
) ON CONFLICT (name) DO NOTHING;

-- Insert MTN Consumer as fallback provider
INSERT INTO network_providers (
  name,
  display_name,
  enabled,
  type,
  service_types,
  priority,
  api_config,
  health_status
) VALUES (
  'mtn_consumer',
  'MTN Consumer',
  true,
  'api',
  ARRAY['fibre', '5g', 'lte'],
  3,
  '{
    "baseUrl": "https://supersonic.mtn.co.za/arcgis/rest/services",
    "authMethod": "none",
    "timeoutMs": 3000,
    "endpoints": {
      "coverage": "/mtnsi/MapServer/identify"
    }
  }'::JSONB,
  'healthy'
) ON CONFLICT (name) DO NOTHING;
```

#### Business Logic Services

1. **ProviderApiClient** (`/lib/coverage/provider-api-client.ts`) - NEW
   - Generic API client for any provider
   - Handles all auth types (API key, OAuth, Bearer, SSO)
   - Implements retry logic with exponential backoff (matches MTN implementation)
   - Logs all requests to `provider_api_logs`
   - Returns standardized response format
   ```typescript
   class ProviderApiClient {
     constructor(provider: NetworkProvider) { /* ... */ }
     async checkFeasibility(coords: Coordinates, products: string[]) { /* ... */ }
     async getProducts() { /* ... */ }
     async checkCoverage(coords: Coordinates) { /* ... */ }
   }
   ```

2. **CoverageFileParser** (`/lib/coverage/coverage-file-parser.ts`) - NEW
   - Parse KML files using `xml2js`
   - Parse KMZ files using `adm-zip` + `xml2js`
   - Extract bounding box from `<LatLonBox>`
   - Count features (`<Placemark>` elements)
   - Extract metadata (`<name>`, `<description>`, `<author>`)

3. **ProviderHealthMonitor** (`/lib/coverage/provider-health-monitor.ts`) - NEW
   - Periodic health checks (cron job every 5 minutes)
   - Update `health_status` and `success_rate_24h`
   - Send alerts if provider goes down (email to ops team)
   - Auto-disable providers with <80% success rate (configurable)
   - Special handling for MTN SSO (check CAS Ticket expiry)

4. **ProviderService** (`/lib/services/provider-service.ts`) - NEW
   - CRUD operations for providers
   - `getEnabledProviders()` - Returns sorted by priority
   - `getProviderConfig(id)` - Returns full config from DB
   - `updateProviderConfig(id, config)` - Invalidates cache
   - `testProviderConnection(id, testData)` - Runs test and logs result

---

### Integration Impact

#### Coverage Aggregation Service Integration

**Before** (Hardcoded):
```typescript
// lib/coverage/aggregation-service.ts
const mtnConfig = {
  baseUrl: 'https://ftool.mtnbusiness.co.za',
  apiKey: 'bdaacbcae8ab77672e545649df54d0df',
  // ... hardcoded
};
```

**After** (Database-driven):
```typescript
// lib/coverage/aggregation-service.ts
async aggregateCoverage(coords: Coordinates) {
  // Load providers from database (cached for 5 min)
  const providers = await ProviderService.getEnabledProviders();
  const sorted = providers.sort((a, b) => a.priority - b.priority);

  for (const provider of sorted) {
    const client = new ProviderApiClient(provider);

    try {
      const coverage = await client.checkCoverage(coords);

      if (coverage.success) {
        // Log successful check
        await logProviderCheck(provider.id, coords, coverage, true);
        return coverage; // Success, no need for fallback
      }
    } catch (error) {
      // Log failed check
      await logProviderCheck(provider.id, coords, null, false, error.message);
      // Continue to next provider (fallback)
    }
  }

  // All providers failed
  throw new Error('All providers failed coverage check');
}
```

#### MTN Wholesale Integration

- Move config from `/app/api/mtn-wholesale/feasibility/route.ts` to database
- Replace hardcoded `MTN_API_BASE` and `MTN_API_KEY` with database lookup
- Use `ProviderApiClient` instead of direct `fetch`
- Preserve existing SSO session refresh logic (GitHub Actions cron)

#### Database Integration

- Use Supabase client with RLS policies
- Operations Manager role required for write operations
- Viewer role can read providers and view performance
- Super Admin can delete providers and modify global config
- MTN providers cannot be deleted (protected by database constraint)

#### External API Integrations

**MTN Wholesale (MNS)** ✅:
- Config moved to database (`network_providers.api_config`)
- SSO session managed via database (`network_providers.sso_config`)
- GitHub Actions cron job updates database instead of environment variables

**MTN Business (WMS)** ✅:
- Config moved to database
- Set as fallback (priority 2)

**MTN Consumer** ✅:
- Config moved to database
- Set as fallback (priority 3)

**Future Providers (Vodacom, Rain, Telkom, Frogfoot)**:
- Template provider configs in database
- Admin can activate and configure via UI
- No code changes required

---

### Testing Requirements

#### E2E Test Scenarios (Playwright)

1. **MTN Wholesale Config Management**
   - Navigate to MTN Wholesale config page
   - Update base URL (Testing → Production)
   - Update X-API-KEY → Save → Verify toast success
   - Test connection → Verify request/response displayed
   - Check SSO session status → Should show expiry timestamp

2. **Provider CRUD Flow**
   - Create new provider (Vodacom) → Fill form → Save → Verify in list
   - Edit provider → Change name → Save → Verify update
   - Disable provider → Confirm → Verify badge changes to "Disabled"
   - Try to delete MTN provider → Should show error (system-critical)

3. **API Testing Flow**
   - Select MTN Wholesale → Enter test address "Heritage Hill, Centurion"
   - Select products (MNS_10G, MNS_20G)
   - Click "Test Feasibility"
   - Verify request panel shows correct URL and X-API-KEY (masked)
   - Verify response panel shows JSON data
   - Save test result → Verify saved to database

4. **Performance Dashboard**
   - Navigate to Performance page
   - Verify MTN Wholesale success rate chart renders
   - Verify MTN Business vs Consumer comparison
   - Click "View Failed Requests" → Drill down to details
   - Click "Disable Provider" → Confirm → Verify disabled

5. **Fallback Behavior**
   - Disable MTN Wholesale (priority 1)
   - Run coverage check → Should fallback to MTN Business (priority 2)
   - Verify performance dashboard shows fallback event
   - Re-enable MTN Wholesale → Verify coverage check uses it again

#### API Test Cases

1. **GET /api/admin/providers**
   - ✅ Returns MTN Wholesale, MTN Business, MTN Consumer
   - ✅ Filters by type (`?type=api`)
   - ✅ Sorted by priority (Wholesale=1, Business=2, Consumer=3)
   - ✅ Includes SSO session status for MTN Wholesale

2. **GET /api/admin/providers/mtn-wholesale**
   - ✅ Returns current config from database
   - ✅ Includes CAS Ticket expiry timestamp
   - ✅ Includes enabled products list

3. **PATCH /api/admin/providers/mtn-wholesale**
   - ✅ Updates base URL successfully
   - ✅ Updates X-API-KEY successfully
   - ❌ Returns 400 for invalid base URL format
   - ✅ Invalidates coverage cache after update

4. **POST /api/admin/providers/mtn-wholesale/test**
   - ✅ Returns feasibility data for valid address
   - ❌ Returns 400 for invalid product name
   - ✅ Logs request to `provider_api_logs`
   - ✅ Returns performance metrics (response time)

5. **POST /api/admin/providers/mtn-wholesale/refresh-session**
   - ✅ Refreshes CAS Ticket successfully
   - ✅ Updates database with new expiry timestamp
   - ❌ Returns 500 if SSO login fails

6. **GET /api/admin/providers/performance**
   - ✅ Returns metrics for MTN Wholesale (24h)
   - ✅ Aggregates success rate correctly (e.g., 95.2%)
   - ✅ Calculates average response time (e.g., 1.2s)
   - ✅ Groups errors by type (timeout, anti-bot, invalid response)

#### Edge Cases

1. **MTN SSO Session Expired**
   - CAS Ticket expires mid-request
   - Verify fallback to MTN Business API
   - Verify alert sent to operations team
   - Verify GitHub Actions cron runs refresh within 6 hours

2. **Provider API Timeout**
   - Test with unreachable endpoint (e.g., `https://fake-provider.test`)
   - Verify timeout after 5 seconds (configurable)
   - Verify fallback to next provider (priority order)
   - Verify error logged to `provider_api_logs`

3. **Malformed API Response**
   - MTN API returns invalid JSON
   - Verify graceful error handling
   - Verify error message logged
   - Verify fallback triggered

4. **Concurrent Provider Updates**
   - Two admins edit MTN config simultaneously
   - Verify last-write-wins with timestamp check
   - Verify no data corruption

5. **Large Coverage File**
   - Upload 50MB KMZ file
   - Verify parsing doesn't timeout (use chunked parsing)
   - Verify file stored correctly
   - Verify metadata extracted

---

## Implementation Steps

### Phase 1: Database Migration & MTN Config Migration (Complexity: M)

**Goal**: Move MTN configs from code to database

**Tasks**:
- [ ] Create `provider_api_logs` table migration
- [ ] Create `provider_configuration` table migration
- [ ] Add new columns to `network_providers` table
- [ ] Create RLS policies for new tables
- [ ] Migrate MTN Wholesale config to database
- [ ] Migrate MTN Business (WMS) config to database
- [ ] Migrate MTN Consumer config to database
- [ ] Update TypeScript types in `/lib/types/coverage-providers.ts`

**Estimated Time**: 2 days

**Dependencies**: None

**Acceptance Criteria**:
- All migrations run successfully
- MTN configs in database match current code
- Type checking passes
- Existing coverage checker still works (no breaking changes)

---

### Phase 2: Provider Service Layer (Complexity: M)

**Goal**: Build services to load providers from database

**Tasks**:
- [ ] Create `ProviderApiClient` service (generic API client)
- [ ] Create `ProviderService` (CRUD operations)
- [ ] Create `CoverageFileParser` service (KML/KMZ parsing)
- [ ] Create `ProviderHealthMonitor` service (health checks)
- [ ] Update `MTNSSOAuth` to load config from database
- [ ] Write unit tests for all services

**Estimated Time**: 3 days

**Dependencies**: Phase 1 complete

**Acceptance Criteria**:
- Can load provider config from database
- Can create generic API client from config
- Can parse KML/KMZ files
- Unit tests pass (80%+ coverage)

---

### Phase 3: API Endpoints (Complexity: M)

**Goal**: Build API routes for provider management

**Tasks**:
- [ ] Implement `GET /api/admin/providers/mtn-wholesale`
- [ ] Implement `PATCH /api/admin/providers/mtn-wholesale`
- [ ] Implement `POST /api/admin/providers/mtn-wholesale/test`
- [ ] Implement `POST /api/admin/providers/mtn-wholesale/refresh-session`
- [ ] Implement `POST /api/admin/providers/test`
- [ ] Implement `GET /api/admin/providers/performance`
- [ ] Enhance existing CRUD endpoints (`GET`, `POST`, `PATCH`, `DELETE`)
- [ ] Write API integration tests

**Estimated Time**: 4 days

**Dependencies**: Phase 2 complete

**Acceptance Criteria**:
- All endpoints return correct status codes
- All endpoints handle errors gracefully
- All tests pass
- Postman collection updated

---

### Phase 4: MTN Wholesale Config UI (Complexity: M)

**Goal**: Build admin UI for MTN Wholesale management

**Tasks**:
- [ ] Build `MTNWholesaleEditor` component
- [ ] Build API Config tab (Base URL, X-API-KEY)
- [ ] Build SSO Config tab (CAS Ticket status, manual refresh)
- [ ] Build Testing tab (address input, product selector, request/response)
- [ ] Build Performance tab (success rate chart, failed requests table)
- [ ] Integrate with MTN Wholesale APIs
- [ ] Add form validation (Zod schema)
- [ ] Add loading and error states
- [ ] Add "Test Connection" button

**Estimated Time**: 3 days

**Dependencies**: Phase 3 complete

**Acceptance Criteria**:
- Can view current MTN Wholesale config
- Can update config and test before saving
- Can manually refresh SSO session
- Can view performance metrics
- Mobile responsive

---

### Phase 5: Generic Provider Editor UI (Complexity: L)

**Goal**: Build UI for adding/editing any provider

**Tasks**:
- [ ] Build `ProviderEditor` component (multi-step form)
- [ ] Build `ApiConfigurationPanel` component
- [ ] Build auth method selector (API key, OAuth, Bearer, SSO)
- [ ] Build endpoint configuration form
- [ ] Build custom headers editor (key-value pairs)
- [ ] Build service type multi-select
- [ ] Build priority slider (1-10)
- [ ] Integrate with CRUD APIs
- [ ] Add form validation (Zod schema)
- [ ] Add loading and error states

**Estimated Time**: 4 days

**Dependencies**: Phase 3 complete

**Acceptance Criteria**:
- Can create provider with all fields
- Can edit existing provider (including MTN providers)
- Form validation works
- Changes save successfully
- Mobile responsive

---

### Phase 6: API Testing Tool (Complexity: M)

**Goal**: Build real-time API testing interface

**Tasks**:
- [ ] Build `ApiTestingTool` component
- [ ] Build request panel with syntax highlighting (JSON)
- [ ] Build response panel with JSON viewer (`react-json-view`)
- [ ] Integrate Google Maps autocomplete for address input
- [ ] Add provider selector (single or "Test All")
- [ ] Add product selector (for feasibility APIs)
- [ ] Display performance metrics (response time, status code)
- [ ] Add "Save Test Result" button
- [ ] Build test history viewer (last 50 tests)

**Estimated Time**: 3 days

**Dependencies**: Phase 3 complete

**Acceptance Criteria**:
- Can test MTN Wholesale Feasibility API
- Can test MTN Business/Consumer APIs
- Request/response displayed with syntax highlighting
- Test results saved to database
- History accessible

---

### Phase 7: Coverage File Upload (Complexity: M)

**Goal**: Enable KML/KMZ coverage file upload

**Tasks**:
- [ ] Build `CoverageFileUploader` component
- [ ] Implement drag-and-drop functionality
- [ ] Add file type validation (KML/KMZ only, max 50MB)
- [ ] Build upload progress indicator
- [ ] Display extracted metadata (bounding box, features)
- [ ] Build map preview of bounding box (Leaflet or Google Maps)
- [ ] Build service type mapping UI
- [ ] Integrate with file upload API
- [ ] Display uploaded files in table
- [ ] Add "Replace File" functionality

**Estimated Time**: 3 days

**Dependencies**: Phase 2 complete

**Acceptance Criteria**:
- Can upload KML/KMZ files
- Metadata extracted correctly
- Map preview shows bounding box
- Files stored securely
- Can replace files

---

### Phase 8: Performance Dashboard (Complexity: L)

**Goal**: Build comprehensive performance monitoring UI

**Tasks**:
- [ ] Build `ProviderPerformanceDashboard` component
- [ ] Create overview cards (total calls, success rate, avg time, active providers)
- [ ] Create Recharts line chart (API calls over time, multi-line for each provider)
- [ ] Create pie chart (success vs failure, per provider)
- [ ] Create bar chart (response time distribution)
- [ ] Create heatmap (geographic distribution of checks)
- [ ] Build failed requests table (timestamp, provider, error, address)
- [ ] Add date range picker (24h, 7d, 30d, custom)
- [ ] Add provider filter dropdown
- [ ] Implement drill-down functionality (click chart → see details)
- [ ] Add "Disable Provider" quick action
- [ ] Add export to CSV functionality

**Estimated Time**: 4 days

**Dependencies**: Phase 3 complete

**Acceptance Criteria**:
- All charts render correctly with real data
- Data refreshes on date range change
- Can drill down to failed requests
- Can disable underperforming provider
- Can export data to CSV
- Mobile responsive (charts stack vertically)

---

### Phase 9: Coverage System Integration (Complexity: L)

**Goal**: Replace hardcoded configs with database-driven system

**Tasks**:
- [ ] Refactor `CoverageAggregationService` to use `ProviderService`
- [ ] Implement dynamic provider loading from database
- [ ] Implement priority-based fallback (sorted by `priority` column)
- [ ] Add caching layer for provider configs (5 min TTL, same as coverage cache)
- [ ] Update `/app/api/mtn-wholesale/feasibility/route.ts` to use `ProviderApiClient`
- [ ] Update `/app/api/coverage/mtn/check/route.ts` to use `ProviderService`
- [ ] Test end-to-end flow (coverage check uses DB providers)
- [ ] Add provider performance logging to all coverage checks
- [ ] Implement health check cron job (Vercel cron or GitHub Actions)

**Estimated Time**: 5 days

**Dependencies**: Phase 1-8 complete

**Acceptance Criteria**:
- Coverage checker uses providers from database
- Fallback order respects `priority` column
- MTN Wholesale → MTN Business → MTN Consumer fallback works
- Config changes apply without deploy
- Health checks run every 5 minutes
- Performance metrics update in real-time

---

### Phase 10: SSO Session Monitor (Complexity: S)

**Goal**: Build UI for MTN SSO session monitoring

**Tasks**:
- [ ] Build `SSOSessionMonitor` component
- [ ] Display CAS Ticket expiry countdown (e.g., "Expires in 4h 23m")
- [ ] Display session health status badge (✅ Healthy, ⚠️ Expiring Soon, ❌ Expired)
- [ ] Display last refresh timestamp
- [ ] Display next auto-refresh scheduled time (from GitHub Actions cron)
- [ ] Add manual "Refresh Now" button
- [ ] Build session refresh history table (last 10 refreshes with status)
- [ ] Integrate with `POST /api/admin/providers/mtn-wholesale/refresh-session`

**Estimated Time**: 2 days

**Dependencies**: Phase 3 complete

**Acceptance Criteria**:
- Session status displayed correctly
- Manual refresh works
- Refresh history displayed
- Countdown updates in real-time (every 1min)

---

### Phase 11: RBAC Integration (Complexity: S)

**Goal**: Enforce permissions on all provider management features

**Tasks**:
- [ ] Add permission checks to all API routes
- [ ] Add `<PermissionGate>` to UI components
- [ ] Create new permissions:
  - `coverage:view_providers`
  - `coverage:manage_providers`
  - `coverage:test_providers`
  - `coverage:view_performance`
  - `coverage:manage_configuration`
  - `coverage:refresh_mtn_session`
- [ ] Update Operations Manager role with new permissions
- [ ] Update Viewer role (read-only, no test/refresh)
- [ ] Update Super Admin role (all permissions)
- [ ] Test permission enforcement

**Estimated Time**: 2 days

**Dependencies**: Phase 10 complete

**Acceptance Criteria**:
- Operations Manager can manage providers and refresh MTN session
- Viewer can only view providers and performance
- Super Admin can do everything
- API routes enforce permissions (return 403 if unauthorized)
- UI hides/disables actions based on permissions

---

### Phase 12: Testing & Documentation (Complexity: M)

**Goal**: Comprehensive testing and documentation

**Tasks**:
- [ ] Write E2E tests (Playwright) for all flows
- [ ] Write API integration tests for all endpoints
- [ ] Write unit tests for services (80%+ coverage)
- [ ] Update documentation:
  - `/docs/admin/COVERAGE_PROVIDERS.md` - User guide
  - `/docs/integrations/MTN_WHOLESALE_CONFIG.md` - MTN config guide
  - `/docs/rbac/RBAC_SYSTEM_GUIDE.md` - Updated permissions
- [ ] Create video tutorial for Operations team (15min)
- [ ] Create runbook for troubleshooting provider issues
- [ ] Update changelog

**Estimated Time**: 3 days

**Dependencies**: Phase 11 complete

**Acceptance Criteria**:
- All E2E tests pass
- All API tests pass
- Test coverage >80%
- Documentation complete
- Operations team trained
- Runbook validated

---

## Acceptance Criteria

### Functional Requirements

- [ ] ✅ Can view/edit MTN Wholesale config (base URL, X-API-KEY, products)
- [ ] ✅ Can manually refresh MTN SSO session (CAS Ticket)
- [ ] ✅ Can create, read, update, delete providers via UI
- [ ] ✅ Can configure API endpoints, auth methods, headers
- [ ] ✅ Can upload logo (PNG, JPG, SVG) auto-resized to 200x50px
- [ ] ✅ Can upload coverage files (KML/KMZ) with metadata extraction
- [ ] ✅ Can test provider API with real-time request/response display
- [ ] ✅ Can view performance metrics (success rate, response time) per provider
- [ ] ✅ Can configure global fallback strategy (sequential, parallel)
- [ ] ✅ Coverage system automatically uses DB providers (sorted by priority)
- [ ] ✅ Config changes apply without code deploy
- [ ] ✅ RBAC enforced (Operations Manager + Super Admin only for write operations)

### Performance Requirements

- [ ] ✅ Provider list loads in <500ms
- [ ] ✅ API test completes in <3s (excluding provider API time)
- [ ] ✅ File upload handles 50MB files without timeout
- [ ] ✅ Performance dashboard loads in <1s
- [ ] ✅ Health checks don't impact coverage API performance (<10ms overhead)

### Type Safety Requirements

- [ ] ✅ All API responses typed
- [ ] ✅ All components typed (no `any`)
- [ ] ✅ All database queries typed (Supabase generated types)
- [ ] ✅ All form inputs validated with Zod
- [ ] ✅ `npm run type-check` passes

### Security/RBAC Requirements

- [ ] ✅ All API routes protected with Supabase Auth
- [ ] ✅ RLS policies enforce access control at database level
- [ ] ✅ Operations Manager can manage providers and refresh MTN session
- [ ] ✅ Viewer can only view providers (read-only)
- [ ] ✅ Super Admin can delete providers and modify global config
- [ ] ✅ MTN providers cannot be deleted (protected by database constraint)
- [ ] ✅ Audit log records all changes (who, what, when)
- [ ] ✅ File uploads validated (type, size, max 50MB)
- [ ] ✅ API credentials stored securely (encrypted JSONB, masked in UI)
- [ ] ✅ X-API-KEY masked in UI (click to reveal)

---

## Potential Blockers

1. **MTN SSO Session Refresh in Admin Panel**
   - **Risk**: Manual refresh may conflict with GitHub Actions cron
   - **Mitigation**: Add mutex lock in database to prevent concurrent refreshes

2. **Large Coverage Files (>50MB)**
   - **Risk**: Parsing may timeout
   - **Mitigation**: Implement chunked parsing, use worker threads, add progress indicator

3. **Complex OAuth Flow**
   - **Risk**: Some providers may require OAuth 2.0 with refresh tokens
   - **Mitigation**: Start with API key auth, add OAuth in Phase 13 if needed

4. **Real-time Health Checks Impact Performance**
   - **Risk**: Health checks may slow down coverage API
   - **Mitigation**: Run health checks in background Vercel cron job (every 5min), cache results

5. **MTN API Rate Limits**
   - **Risk**: Too many admin tests may hit rate limit
   - **Mitigation**: Add rate limiting to test endpoint (max 10 tests/hour per admin)

---

## Success Metrics

### User Adoption (Month 1)
- [ ] Operations Manager updates MTN config 3+ times (without dev help)
- [ ] 20+ API tests run via admin panel
- [ ] 5+ providers added (Frogfoot, Vumatel templates created)
- [ ] 0 provider-related support tickets (down from 2-3/month)

### Performance (Month 1-3)
- [ ] 95%+ API success rate (aggregated across all providers)
- [ ] <2s average coverage check response time
- [ ] MTN SSO session refresh success rate >99% (auto + manual)
- [ ] <5min time to add new provider (from discovery to enabled)

### Business Impact (Month 3-6)
- [ ] 3+ active providers (currently: MTN Wholesale, MTN Business, MTN Consumer)
- [ ] 10%+ increase in coverage check success rate
- [ ] 50%+ reduction in time to onboard new providers
- [ ] Zero MTN API downtime incidents (proactive session monitoring)

---

## Post-Implementation

### Maintenance
- Monitor `provider_api_logs` table size (implement partitioning after 1M rows)
- Review health check frequency (may need adjustment based on load)
- Update provider configs when MTN changes API endpoints
- Monitor MTN SSO session refresh job (verify GitHub Actions cron runs successfully)

### Future Enhancements (Phase 13+)
- 📅 OAuth 2.0 authentication support (for providers requiring it)
- 📅 Provider-specific pricing API integration (auto-sync pricing)
- 📅 Automated provider discovery (API directory, competitor monitoring)
- 📅 ML-based provider recommendation (based on success rates, response times)
- 📅 Provider SLA monitoring and alerts (uptime guarantees)
- 📅 Multi-tenant support (different providers per customer type)
- 📅 Webhook support (provider notifies us of coverage updates)

---

## Related Documentation

- `/docs/admin/COVERAGE_SYSTEM.md` - Coverage system architecture
- `/docs/integrations/MTN_WHOLESALE_API.md` - MTN Wholesale API integration
- `/docs/integrations/MTN_SSO_AUTHENTICATION.md` - MTN SSO documentation
- `/docs/rbac/RBAC_SYSTEM_GUIDE.md` - Permission system
- `/lib/types/coverage-providers.ts` - TypeScript types
- `/supabase/migrations/20251005000002_create_fttb_providers_system.sql` - Database schema

---

**Last Updated**: 2025-10-18
**Version**: 2.0 (Revised for MTN Wholesale Production APIs)
**Approved By**: Pending
**Implementation Start**: TBD
**Estimated Duration**: 8-10 weeks (12 phases)
