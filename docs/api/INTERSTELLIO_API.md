# Interstellio (NebularStack) API Documentation

> **Last Updated**: 2025-12-15
> **Version**: 1.0.0
> **Source**: https://docs.interstellio.io/
> **Purpose**: RADIUS service for customer provisioning and usage tracking

---

## Table of Contents

1. [Overview](#overview)
2. [Base URLs](#base-urls)
3. [Authentication](#authentication)
4. [Concepts](#concepts)
   - [Subscriber Accounts](#subscriber-accounts)
   - [Subscriber Profiles](#subscriber-profiles)
   - [Service Profiles](#service-profiles)
   - [Virtual Servers](#virtual-servers)
   - [RADIUS Flow](#radius-flow)
   - [Webhooks](#webhooks)
5. [API Endpoints](#api-endpoints)
   - [Subscriber Accounts API](#subscriber-accounts-api)
   - [Subscriber Profiles API](#subscriber-profiles-api)
   - [Services API](#services-api)
   - [Virtual Servers API](#virtual-servers-api)
   - [Webhooks API](#webhooks-api)
   - [Routes API](#routes-api)
   - [Telemetry API](#telemetry-api)
   - [Sessions API](#sessions-api)
   - [Credits API](#credits-api)
6. [CircleTel Integration Mapping](#circletel-integration-mapping)
7. [Environment Variables](#environment-variables)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)

---

## Overview

Interstellio's NebularStack is a cloud-based RADIUS/AAA platform that CircleTel uses for:

- **Provisioning**: Creating and managing customer internet service accounts
- **Authentication**: RADIUS authentication for PPPoE/IPoE connections
- **Usage Tracking**: Monitoring data consumption and session activity
- **Speed Management**: Dynamic bandwidth control via subscriber profiles

### Key Features

- JWT-based authentication with 12-month token validity
- RESTful API with versioned endpoints (v1, v2, v3)
- Webhook notifications for real-time event handling
- Multi-tenant architecture with domain isolation

---

## Base URLs

| Service | Region | Base URL |
|---------|--------|----------|
| **Identity** | South Africa | `https://identity-za.nebularstack.com` |
| **Subscriber** | South Africa | `https://subscriber-za.nebularstack.com` |
| **Telemetry** | South Africa | `https://telemetry-za.nebularstack.com` |

---

## Authentication

### Getting a Token

```http
POST https://identity-za.nebularstack.com/v3/token
Content-Type: application/json

{
  "domain": "circletel.co.za",
  "username": "api@circletel.co.za",
  "password": "your-password",
  "otp": "123456"  // Only if MFA enabled
}
```

### Response

```json
{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_id": "abc123",
  "user_id": "user-uuid",
  "username": "api@circletel.co.za",
  "name": "API User",
  "roles": ["administrator"],
  "context": {
    "domain": "circletel.co.za",
    "tenant_id": "tenant-uuid"
  }
}
```

### Required Headers

| Header | Required | Description |
|--------|----------|-------------|
| `X-Auth-Token` | Yes | JWT authentication token |
| `X-Domain` | Conditional | Domain context for token scope |
| `X-Tenant-ID` | Conditional | Tenant identifier (required for subscriber endpoints) |
| `X-Timezone` | No | Timezone for datetime values (default: UTC) |

### Token Lifecycle

- **Validity**: 12 months if unused
- **Revocation**: `DELETE /v3/token` with `X-Auth-Token` header

---

## Concepts

### Subscriber Accounts

Subscriber accounts authenticate and authorize sessions within Virtual Servers (RADIUS/AAA).

**Key Properties**:

| Property | Description |
|----------|-------------|
| `username` | Up to 64 chars (alphanumeric, hyphens, underscores, @ for realm) |
| `password` | Up to 64 chars (letters, digits, special: `?!@#$%^&*`) |
| `virtual_id` | Associated Virtual Server |
| `service_id` | Service Profile reference |
| `profile_id` | Subscriber Profile reference |
| `enabled` | Hard switch affecting active sessions immediately |
| `expire` | Scheduled automatic suspension datetime |
| `static_ip4` | Static IPv4 (restricts to single concurrent session) |
| `calling_station_id` | MAC address for device binding |
| `timezone` | Critical for credit renewals on capped accounts |

**Account States**:

- **Enabled**: Active and can authenticate
- **Disabled**: Immediately suspended, affects active sessions
- **Expired**: Automatically suspended at expiration datetime

### Subscriber Profiles

Define high-level configuration parameters (bandwidth, data caps).

**Key Properties**:

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Profile identifier (e.g., "100Mbps Uncapped") |
| `download` | string | Download speed in Mbit/s |
| `upload` | string | Upload speed in Mbit/s |
| `uncapped_data` | boolean | Whether data is uncapped (read-only after creation) |
| `session_limit` | integer | Max concurrent sessions (0 = unlimited, max 10) |
| `pool_id` | string | Dynamic IP pool for authenticating subscribers |
| `pool_id_deactivate` | string | IP pool for suspended subscribers |

**Important**: Capped accounts require assigned data credits or subscribers face suspension.

### Service Profiles

Configuration bridges that translate Subscriber Profile constraints into RADIUS attributes.

**Session Contexts**:

| Context | Description |
|---------|-------------|
| `activate-login` | Fully active session |
| `deactivate-login` | Suspended but connected (captive portal) |
| `activate-coa` | Activated via Change-of-Authorization packet |
| `deactivate-coa` | Suspended via CoA packet |
| `deactivate-pod` | Disconnected via Power-of-Disconnect |

**RADIUS Attribute Variables**:

- `{{ upload }}` - Upload speed from subscriber profile
- `{{ download }}` - Download speed from subscriber profile
- `{{ user-name }}` - Subscriber username
- `{{ ip_address }}` - Assigned IP address

### Virtual Servers

Virtualized AAA servers running across multiple physical hosts.

**Architecture**:

- **Proxy Servers**: Bridge between NebularStack backend and RADIUS clients
- **Default**: 3 proxy instances per virtual server
- **Ports**: 1812 (Auth), 1813 (Accounting), 3799 (CoA/PoD)

**Client Types**:

| Type | Description |
|------|-------------|
| `nas` | Network Access Server (actual device) |
| `proxy` | External RADIUS proxy server |

**Client Profiles**: Define RADIUS client types (Cisco, Juniper, Mikrotik, etc.)

### RADIUS Flow

```
┌──────────┐     ┌─────────────┐     ┌──────────────┐
│   NAS    │────>│ RADIUS Proxy│────>│ NebularStack │
│ (Router) │<────│   Server    │<────│   Backend    │
└──────────┘     └─────────────┘     └──────────────┘
     │                                      │
     │  Authentication Request              │
     │  (username, password, MAC)           │
     │                                      │
     │  Access-Accept/Reject                │
     │  (RADIUS AVPs, IP, Speed)            │
     │                                      │
     │  Accounting Start/Interim/Stop       │
     │  (Usage data, session info)          │
     │                                      │
     │  CoA (Change of Authorization)       │
     │  (Speed changes, suspension)         │
     │                                      │
     │  PoD (Power of Disconnect)           │
     │  (Force disconnect session)          │
```

### Webhooks

Real-time event notifications from the platform.

**Supported Events**:

| Context | Trigger | Description |
|---------|---------|-------------|
| `radius-authentication` | `subscriber-authenticated` | Successful authentication |
| `radius-authentication` | `subscriber-nas-updated` | Auth success with new NAS IP |
| `radius-accounting` | `subscriber-session-start` | New accounting session started |

**Webhook Payload Example**:

```json
{
  "timestamp": "2025-12-15T10:30:00Z",
  "timezone": "Africa/Johannesburg",
  "context": "radius-authentication",
  "trigger": "subscriber-authenticated",
  "subscriber": {
    "id": "sub-uuid",
    "domain": "circletel.co.za",
    "username": "customer@circletel",
    "tenant_id": "tenant-uuid",
    "virtual_id": "virtual-uuid",
    "last_known_nas_ip4": "196.x.x.x",
    "calling_station_id": "AA:BB:CC:DD:EE:FF"
  },
  "radius_request": { ... },
  "radius_response": { ... }
}
```

**Constraints**:
- One webhook per context allowed
- HTTPS with IP requires `ssl_verify: false`
- Worker must be enabled to process webhooks

---

## API Endpoints

### Subscriber Accounts API

Base: `https://subscriber-za.nebularstack.com`

#### List Subscribers

```http
GET /v1/subscribers
X-Auth-Token: {token}
X-Tenant-ID: {tenant_id}
```

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `username` | string | Filter by username (supports `*` wildcard) |
| `calling_station_id` | string | Filter by MAC address |
| `id` | string | Filter by ID |
| `l` | integer | Limit per page (1-50, -1 for streaming) |
| `p` | integer | Page number (default: 1) |
| `sc` | string | Sort column (id, username, calling_station_id) |
| `sd` | string | Sort direction (asc, desc) |

#### Get Subscriber

```http
GET /v1/subscriber/{subscriber_id}
X-Auth-Token: {token}
X-Tenant-ID: {tenant_id}
```

#### Create Subscriber

```http
POST /v1/subscriber
X-Auth-Token: {token}
X-Tenant-ID: {tenant_id}
Content-Type: application/json

{
  "virtual_id": "vs-uuid",
  "service_id": "svc-uuid",
  "profile_id": "prof-uuid",
  "username": "customer@circletel.co.za",
  "name": "John Doe",
  "enabled": true,
  "timezone": "Africa/Johannesburg",
  "calling_station_id": "AA:BB:CC:DD:EE:FF",
  "static_ip4": "196.x.x.x",
  "expire": "2026-12-31T23:59:59Z"
}
```

**Required Fields**: `virtual_id`, `service_id`, `profile_id`, `username`

#### Update Subscriber

```http
PATCH /v1/subscriber/{subscriber_id}
X-Auth-Token: {token}
X-Tenant-ID: {tenant_id}
Content-Type: application/json

{
  "enabled": false,
  "profile_id": "new-profile-uuid"
}
```

#### Delete Subscriber

```http
DELETE /v1/subscriber/{subscriber_id}
X-Auth-Token: {token}
X-Tenant-ID: {tenant_id}
```

**Response**: `204 No Content`

#### Get Subscriber Status

```http
GET /v2/subscriber/status/{subscriber_id}
X-Auth-Token: {token}
X-Tenant-ID: {tenant_id}
```

**Response**:

```json
{
  "active": true,
  "messages": [],
  "upload": "1.5",
  "download": "10.2"
}
```

#### Find Active/Inactive Subscribers

```http
POST /v1/subscribers/last_seen
X-Auth-Token: {token}
X-Tenant-ID: {tenant_id}
Content-Type: application/json

{
  "comparison": "<",
  "target_datetime": "2025-12-01T00:00:00Z",
  "not_seen": true,
  "timezone": "Africa/Johannesburg"
}
```

---

### Subscriber Profiles API

Base: `https://subscriber-za.nebularstack.com`

#### List Profiles

```http
GET /v1/profiles
X-Auth-Token: {token}
```

**Response**:

```json
{
  "payload": [
    {
      "id": "prof-uuid",
      "name": "100Mbps Uncapped"
    }
  ],
  "metadata": {
    "records": 10,
    "page": 1,
    "pages": 1,
    "per_page": 50
  }
}
```

#### Get Profile

```http
GET /v1/profile/{profile_id}
X-Auth-Token: {token}
```

**Response**:

```json
{
  "id": "prof-uuid",
  "name": "100Mbps Uncapped",
  "domain": "circletel.co.za",
  "uncapped_data": true,
  "upload": "50.000",
  "download": "100.000",
  "session_limit": 1,
  "pool_id": null,
  "pool_id_deactivate": null,
  "creation_time": "2025-01-01T00:00:00Z"
}
```

#### Create Profile

```http
POST /v1/profile
X-Auth-Token: {token}
Content-Type: application/json

{
  "name": "CT-100Mbps-Uncapped",
  "download": "100",
  "upload": "50",
  "uncapped_data": true,
  "session_limit": 1
}
```

#### Update Profile

```http
PATCH /v1/profile/{profile_id}
X-Auth-Token: {token}
Content-Type: application/json

{
  "download": "200",
  "upload": "100"
}
```

#### Delete Profile

```http
DELETE /v1/profile/{profile_id}
X-Auth-Token: {token}
```

---

### Services API

Base: `https://subscriber-za.nebularstack.com`

#### List Services

```http
GET /v1/services
X-Auth-Token: {token}
```

#### Get Service

```http
GET /v1/service/{service_id}
X-Auth-Token: {token}
```

**Response**:

```json
{
  "id": "svc-uuid",
  "name": "Broadband PPPoE",
  "domain": "circletel.co.za",
  "authentication": "username+password",
  "pool_id": "pool-uuid",
  "pool_id_deactivate": "suspend-pool-uuid",
  "creation_time": "2025-01-01T00:00:00Z"
}
```

#### Create Service

```http
POST /v1/service
X-Auth-Token: {token}
Content-Type: application/json

{
  "name": "CircleTel Fibre",
  "authentication": "username+password",
  "pool_id": "pool-uuid",
  "pool_id_deactivate": "suspend-pool-uuid"
}
```

#### List RADIUS Attributes

```http
GET /v1/radius/attributes
X-Auth-Token: {token}
```

#### Add Context Attribute

```http
POST /v1/service/context_attributes/{service_id}
X-Auth-Token: {token}
Content-Type: application/json

{
  "attribute": "mikrotik-rate-limit",
  "client_profile": "mikrotik",
  "ctx": "activate-login",
  "value": "{{upload}}M/{{download}}M"
}
```

---

### Virtual Servers API

Base: `https://subscriber-za.nebularstack.com`

#### List Virtual Servers

```http
GET /v1/virtuals
X-Auth-Token: {token}
```

#### Get Virtual Server

```http
GET /v1/virtual/{virtual_id}
X-Auth-Token: {token}
```

#### List Client Profiles

```http
GET /v1/client_profiles
X-Auth-Token: {token}
```

#### Create Client Profile

```http
POST /v1/client_profile
X-Auth-Token: {token}
Content-Type: application/json

{
  "name": "Mikrotik",
  "description": "Mikrotik RouterOS devices"
}
```

#### List RADIUS Clients

```http
GET /v1/virtual/{virtual_id}/clients
X-Auth-Token: {token}
```

#### Create RADIUS Client

```http
POST /v1/virtual/{virtual_id}/client
X-Auth-Token: {token}
Content-Type: application/json

{
  "name": "CircleTel-NAS-01",
  "type": "nas",
  "profile": "mikrotik",
  "secret": "radius-shared-secret",
  "ip4_address": "196.x.x.x",
  "coa_port": 3799
}
```

---

### Webhooks API

Base: `https://subscriber-za.nebularstack.com`

#### List Webhooks

```http
GET /v1/webhooks
X-Auth-Token: {token}
```

#### Create Webhook

```http
POST /v1/webhooks
X-Auth-Token: {token}
Content-Type: application/json

{
  "url": "https://circletel.co.za/api/webhooks/interstellio",
  "ssl_verify": true,
  "context": "radius-authentication",
  "wh_trigger": "subscriber-authenticated"
}
```

#### Get Available Contexts

```http
GET /v1/webhooks/contexts
X-Auth-Token: {token}
```

**Response**: `["radius-authentication", "radius-accounting"]`

#### Get Available Triggers

```http
GET /v1/webhooks/triggers
X-Auth-Token: {token}
```

**Response**: `["subscriber-authenticated", "subscriber-nas-updated", "subscriber-session-start"]`

#### Enable/Disable Webhook Worker

```http
POST /v1/webhook_worker/enable
X-Auth-Token: {token}

POST /v1/webhook_worker/disable
X-Auth-Token: {token}
```

---

### Routes API

Base: `https://subscriber-za.nebularstack.com`

#### List Routes for Subscriber

```http
GET /v1/routes/{subscriber_id}
X-Auth-Token: {token}
```

#### Create Route

```http
POST /v1/route/{subscriber_id}
X-Auth-Token: {token}
Content-Type: application/json

{
  "ip_prefix": "192.168.0.0/24",
  "ipv": "4",
  "metric1": 1,
  "metric2": 1,
  "metric3": 1,
  "pref": 1,
  "tag": "lan-route"
}
```

---

### Telemetry API

Base: `https://telemetry-za.nebularstack.com`

#### Get Data Usage

```http
POST /v1/subscriber/{subscriber_id}/data/{aggregation}
X-Auth-Token: {token}
Content-Type: application/json

{
  "start": "2025-12-01T00:00:00Z",
  "end": "2025-12-15T23:59:59Z"
}
```

**Aggregation Options**: `hourly`, `daily`, `weekly`, `monthly`, `yearly`

**Response**:

```json
{
  "payload": [
    {
      "time": "2025-12-01T00:00:00Z",
      "download_kb": 1048576,
      "upload_kb": 524288,
      "combined_kb": 1572864,
      "download_kbps": 1024,
      "upload_kbps": 512
    }
  ]
}
```

**Limits**: Max 128 days for hourly/daily aggregation

#### Get Subscriber Count

```http
GET /v1/subscribers/count
X-Auth-Token: {token}
X-Tenant-ID: {tenant_id}
```

#### Get Active/Inactive Count

```http
POST /v1/subscriber/count
X-Auth-Token: {token}
X-Tenant-ID: {tenant_id}
```

**Response**:

```json
{
  "active": 150,
  "inactive": 25,
  "total": 175
}
```

#### Get Top Users

```http
POST /v1/subscriber/topusers
X-Auth-Token: {token}
X-Tenant-ID: {tenant_id}
Content-Type: application/json

{
  "start": "2025-12-01T00:00:00Z",
  "end": "2025-12-15T23:59:59Z",
  "limit": 10
}
```

#### Get CDR Records

```http
POST /v1/subscriber/{subscriber_id}/cdr/records
X-Auth-Token: {token}
Content-Type: application/json

{
  "start": "2025-12-01T00:00:00Z",
  "end": "2025-12-15T23:59:59Z"
}
```

**Limits**: Max 32-day query window

---

### Sessions API

Base: `https://subscriber-za.nebularstack.com`

#### List Subscriber Sessions

```http
GET /v2/sessions/{subscriber_id}
X-Auth-Token: {token}
X-Tenant-ID: {tenant_id}
```

**Query Parameters**: `calling_station_id`, `ctx`, `framed_ip_address`, `username`, `realm`

#### Get Session Details

```http
GET /v2/session/{session_id}
X-Auth-Token: {token}
X-Tenant-ID: {tenant_id}
```

#### Disconnect Session

```http
DELETE /v1/disconnect/{session_id}
X-Auth-Token: {token}
X-Tenant-ID: {tenant_id}
```

#### Disconnect All Subscriber Sessions

```http
DELETE /v1/disconnect/subscriber/{subscriber_id}
X-Auth-Token: {token}
X-Tenant-ID: {tenant_id}
```

---

### Credits API

Base: `https://subscriber-za.nebularstack.com`

#### List Subscriber Credits

```http
GET /v1/credits/{subscriber_id}
X-Auth-Token: {token}
X-Tenant-ID: {tenant_id}
```

#### Add Credit

```http
POST /v1/credit
X-Auth-Token: {token}
X-Tenant-ID: {tenant_id}
Content-Type: application/json

{
  "subscriber_id": "sub-uuid",
  "credit_profile_id": "credit-prof-uuid",
  "volume_gb": 100,
  "expires": "2026-01-31T23:59:59Z"
}
```

#### Get Credit Status

```http
GET /v1/subscriber/{subscriber_id}/credit/status
X-Auth-Token: {token}
X-Tenant-ID: {tenant_id}
```

---

## CircleTel Integration Mapping

### Customer Lifecycle

| CircleTel Event | Interstellio Action |
|-----------------|---------------------|
| Order Completed | `POST /v1/subscriber` - Create subscriber account |
| Service Activated | `PATCH /v1/subscriber/{id}` - Set `enabled: true` |
| Package Upgrade | `PATCH /v1/subscriber/{id}` - Change `profile_id` |
| Package Downgrade | `PATCH /v1/subscriber/{id}` - Change `profile_id` |
| Service Suspended | `PATCH /v1/subscriber/{id}` - Set `enabled: false` |
| Service Cancelled | `DELETE /v1/subscriber/{id}` |
| Session Refresh | `DELETE /v1/disconnect/subscriber/{id}` |

### Dashboard Data

| Dashboard Widget | Interstellio Endpoint |
|------------------|----------------------|
| Usage Graph | `POST /v1/subscriber/{id}/data/daily` |
| Current Session | `GET /v2/sessions/{id}` |
| Connection Status | `GET /v2/subscriber/status/{id}` |
| Data Balance (Capped) | `GET /v1/subscriber/{id}/credit/status` |

### Database Mapping

| CircleTel Table | Interstellio Field |
|-----------------|-------------------|
| `customer_services.interstellio_id` | `subscriber.id` |
| `customer_services.radius_username` | `subscriber.username` |
| `service_packages.interstellio_profile_id` | `profile.id` |

### CircleTel Profile Mapping (Production)

| CircleTel Package | Interstellio Profile ID | Speed |
|-------------------|-------------------------|-------|
| 35 Mbps Uncapped | `1f890fc4-a294-11f0-b8a4-61ef2f83e8d9` | 35/35 Mbps |
| 60 Mbps Uncapped | `f324aadc-a294-11f0-b2a7-a59eec990c99` | 60/60 Mbps |
| 100 Mbps Uncapped | `64877644-c6d7-11f0-9fbd-61ef2f83e8d9` | 100/50 Mbps |
| 100 Mbps Symmetrical | `fd93a450-a294-11f0-b2aa-a59eec990c99` | 100/100 Mbps |

### Infrastructure IDs (Production)

```
Virtual Server: d5bf14bf-56f0-43c1-b8dd-388ee4782760 (Broadband)
Service:        23df54a1-14a9-4a70-9ff7-72e3ae132bdf (Broadband)
```

---

## Environment Variables

Add these to your `.env.local` file:

```env
# Interstellio (NebularStack) Configuration
# Required for RADIUS service integration

# Base URLs (defaults to South Africa region)
INTERSTELLIO_IDENTITY_URL=https://identity-za.nebularstack.com
INTERSTELLIO_SUBSCRIBER_URL=https://subscriber-za.nebularstack.com
INTERSTELLIO_TELEMETRY_URL=https://telemetry-za.nebularstack.com

# Authentication
INTERSTELLIO_DOMAIN=circletel.co.za
INTERSTELLIO_USERNAME=api@circletel.co.za
INTERSTELLIO_PASSWORD=your-api-password

# Tenant/Virtual Server IDs (get from Interstellio dashboard)
INTERSTELLIO_TENANT_ID=your-tenant-uuid
INTERSTELLIO_VIRTUAL_ID=your-virtual-server-uuid
INTERSTELLIO_SERVICE_ID=your-service-uuid

# Webhook Secret (for signature verification)
INTERSTELLIO_WEBHOOK_SECRET=your-webhook-secret
```

### Required vs Optional

| Variable | Required | Description |
|----------|----------|-------------|
| `INTERSTELLIO_DOMAIN` | Yes | Your domain in Interstellio |
| `INTERSTELLIO_USERNAME` | Yes | API user email |
| `INTERSTELLIO_PASSWORD` | Yes | API user password |
| `INTERSTELLIO_TENANT_ID` | Yes | Your tenant UUID |
| `INTERSTELLIO_VIRTUAL_ID` | Yes | Virtual server UUID |
| `INTERSTELLIO_SERVICE_ID` | Yes | Service profile UUID |
| `INTERSTELLIO_*_URL` | No | Defaults to South Africa endpoints |
| `INTERSTELLIO_WEBHOOK_SECRET` | No | Only needed for webhook handlers |

---

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created with Location header |
| 202 | Accepted (async operation) |
| 204 | Success, no content (DELETE) |
| 400 | Bad request / Invalid parameters |
| 401 | Authentication required |
| 402 | Out of credits |
| 403 | Access denied |
| 404 | Resource not found |
| 409 | Conflict (e.g., duplicate) |
| 429 | Rate limited |
| 500-504 | Server error |

### Error Response Format

```json
{
  "error": {
    "title": "Bad Request",
    "description": "The 'username' field is required",
    "request_id": "req-uuid-for-support"
  }
}
```

---

## Rate Limiting

- Rate limits apply per API key
- `429 Too Many Requests` returned when exceeded
- Include `Retry-After` header when available
- Recommended: Implement exponential backoff

---

## Document Metadata

```yaml
sources:
  - https://docs.interstellio.io/subscriber/subscriber_account
  - https://docs.interstellio.io/subscriber/service_profile
  - https://docs.interstellio.io/subscriber/virtuals
  - https://docs.interstellio.io/subscriber/subscriber_profile
  - https://docs.interstellio.io/subscriber/webhooks
  - https://docs.interstellio.io/subscriber/radius_flow
  - https://docs.interstellio.io/subscriber/api/virtuals
  - https://docs.interstellio.io/subscriber/api/services
  - https://docs.interstellio.io/subscriber/api/profiles
  - https://docs.interstellio.io/subscriber/api/accounts
  - https://docs.interstellio.io/subscriber/api/webhooks
  - https://docs.interstellio.io/subscriber/api/routes

last_polled: 2025-12-15T00:00:00Z
next_poll: 2025-12-22T00:00:00Z
poll_frequency: weekly
```
