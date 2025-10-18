# Supersonic Integration - Architecture Diagram

**Date**: October 16, 2025
**Version**: 1.0

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    CircleTel Frontend                           │
│  (Coverage Checker, Packages Display, Order Flow)              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                    HTTP/HTTPS
                         │
         ┌───────────────▼───────────────┐
         │   Next.js API Layer (Edge)    │
         │  /api/coverage/supersonic/*   │
         └───────────────┬───────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        │   ┌──────────────────────────┐  │
        │   │  Caching Layer           │  │
        │   │  (In-Memory, 5min TTL)   │  │
        │   │  Hit Rate: 80%           │  │
        │   └──────────────┬───────────┘  │
        │                  │               │
        │         ┌────────▼──────────┐    │
        │         │  MISS or TTL      │    │
        │         │  Expired?         │    │
        │         └────────┬──────────┘    │
        │                  │               │
        └──────────────────┼───────────────┘
                           │
        ┌──────────────────▼──────────────────┐
        │   Layered Fallback Architecture    │
        │                                    │
        │  ┌────────────────────────────┐    │
        │  │ Layer 1: Supersonic API    │◄───┤ Primary
        │  │ (Real-time packages)       │    │
        │  │ Timeout: 3s, Retries: 3   │    │
        │  └────────────────┬───────────┘    │
        │                   │                 │
        │        ┌──────────▼────────────┐    │
        │        │ Success?              │    │
        │        │ ├─ YES → Return + Cache   │
        │        │ └─ NO → Try Layer 2   │   │
        │        └──────────┬────────────┘   │
        │                   │                 │
        │  ┌────────────────▼───────────┐    │
        │  │ Layer 2: MTN Consumer API  │◄───┤ Fallback 1
        │  │ (Existing aggregator)      │    │
        │  │ /lib/coverage/             │    │
        │  │ aggregation-service.ts     │    │
        │  └────────────────┬───────────┘    │
        │                   │                 │
        │        ┌──────────▼────────────┐    │
        │        │ Success?              │    │
        │        │ ├─ YES → Return       │    │
        │        │ └─ NO → Try Layer 3   │    │
        │        └──────────┬────────────┘    │
        │                   │                 │
        │  ┌────────────────▼───────────┐    │
        │  │ Layer 3: PostGIS Query     │◄───┤ Fallback 2
        │  │ (Geographic lookup)        │    │
        │  │ check_coverage_at_point()  │    │
        │  └────────────────┬───────────┘    │
        │                   │                 │
        │        ┌──────────▼────────────┐    │
        │        │ Success?              │    │
        │        │ ├─ YES → Return       │    │
        │        │ └─ NO → Try Layer 4   │    │
        │        └──────────┬────────────┘    │
        │                   │                 │
        │  ┌────────────────▼───────────┐    │
        │  │ Layer 4: Coverage Areas    │◄───┤ Fallback 3
        │  │ (Legacy area lookup)       │    │
        │  │ Area name matching         │    │
        │  └────────────────┬───────────┘    │
        │                   │                 │
        │        ┌──────────▼────────────┐    │
        │        │ Success?              │    │
        │        │ ├─ YES → Return (ok)  │    │
        │        │ └─ NO → Empty result  │    │
        │        └──────────┬────────────┘    │
        │                   │                 │
        └───────────────────┼──────────────────┘
                            │
                  ┌─────────▼─────────┐
                  │ Response + Metadata│
                  │ ├─ Packages       │
                  │ ├─ Technology     │
                  │ ├─ Cache status   │
                  │ └─ Timing info    │
                  └─────────┬─────────┘
                            │
                    HTTP/HTTPS
                            │
         ┌──────────────────▼──────────────┐
         │     Frontend Receives           │
         │  (Display + User Interaction)   │
         └────────────────────────────────┘
```

---

## Component Architecture

### Request Flow Diagram

```
                    User Input
                    (Address)
                         │
                         ▼
          ┌──────────────────────────┐
          │ Address Geocoding        │
          │ (Google Maps API or      │
          │  Local Database)         │
          │ Returns: lat, lng        │
          └──────────────┬───────────┘
                         │
                         ▼
          ┌──────────────────────────┐
          │ POST /api/coverage/      │
          │ supersonic/lead          │
          │ ├─ address               │
          │ ├─ latitude              │
          │ └─ longitude             │
          └──────────────┬───────────┘
                         │
            ┌────────────▼────────────┐
            │ Check Cache             │
            │ Key: {lat}:{lng}        │
            └────────────┬────────────┘
                    YES/ │ \NO
                   /     │   \
                  /      │     \
    ┌────────────▼──┐    │   ┌──▼─────────────┐
    │ Return Cached │    │   │ Call Supersonic│
    │ (< 100ms)     │    │   │ API            │
    └────────────┬──┘    │   └──┬─────────────┘
                 │       │      │
                 │       │      ├─ Input validation
                 │       │      ├─ Retry logic (3x)
                 │       │      ├─ Timeout (3s)
                 │       │      └─ Error handling
                 │       │              │
                 │       │              ├─ 418 (anti-bot) → retry
                 │       │              ├─ 429 (rate limit) → backoff
                 │       │              ├─ 502 (server error) → next layer
                 │       │              └─ timeout → fallback
                 │       │
          ┌──────┴──────┴──────┐
          │ Success Response?  │
          └──────┬──────┬──────┘
             YES │      │ NO
                 │      │
      ┌──────────▼─┐    │
      │ Map to     │    │
      │ CircleTel  │    │
      │ Schema     │    │
      └──────────┬─┘    │
                 │      │
      ┌──────────▼──┐   │
      │ Cache Entry │   │
      │ TTL: 5 min  │   │
      └──────────┬──┘   │
                 │      │
                 └──┬───┘
                    │
          ┌─────────▼─────────┐
          │ GET packages      │
          │ {leadEntityID}    │
          └─────────┬─────────┘
                    │
          ┌─────────▼─────────┐
          │ Map & Validate    │
          │ Packages          │
          └─────────┬─────────┘
                    │
          ┌─────────▼─────────────────┐
          │ GET Technology Detection  │
          │ for {lat}, {lng}          │
          │ → Fibre vs 5G vs AirFibre │
          └─────────┬─────────────────┘
                    │
          ┌─────────▼──────────────────┐
          │ Return Response            │
          │ ├─ leadEntityID            │
          │ ├─ packages[]              │
          │ ├─ technology detection    │
          │ ├─ cache status            │
          │ └─ response time           │
          └────────────────────────────┘
```

---

## Data Flow Diagram

### Single Request Flow

```
┌─ SUPERSONIC LEAD CREATION ─┐
│                            │
│  INPUT:                    │
│  address: string           │
│  latitude: number          │
│  longitude: number         │
│                            │
│  VALIDATION:               │
│  ├─ Required fields        │
│  ├─ Numeric types          │
│  └─ SA coordinate bounds   │
│                            │
│  PROCESSING:               │
│  ├─ Check cache            │
│  ├─ Call Supersonic API    │
│  ├─ Detect technology      │
│  └─ Store in cache         │
│                            │
│  OUTPUT:                   │
│  {                         │
│    success: bool           │
│    leadEntityID: number    │
│    technology: {...}       │
│    cached: bool            │
│  }                         │
└────────────────────────────┘

┌─ PACKAGE MAPPING ──────────┐
│                            │
│  INPUT (Supersonic):       │
│  {                         │
│    id: 1                   │
│    name: "5G 60GB"         │
│    type: "5G"              │
│    price: 279              │
│    promo_price: 199        │
│    data_day: "60GB"        │
│    data_night: "60GB"      │
│    router_charge: 399      │
│    contract: "MTM"         │
│  }                         │
│                            │
│  TRANSFORMATION:           │
│  ├─ type: 5G → 5g-lte     │
│  ├─ promo check            │
│  ├─ data combine           │
│  ├─ feature extract        │
│  └─ schema validate        │
│                            │
│  OUTPUT (CircleTel):       │
│  {                         │
│    id: "supersonic_1"      │
│    name: "5G 60GB"         │
│    technology_type: "5g"   │
│    regular_price: 279      │
│    promo_price: 199        │
│    data_limit: "60GB+60GB" │
│    promoted: true          │
│    ...                     │
│  }                         │
└────────────────────────────┘

┌─ TECHNOLOGY DETECTION ─────┐
│                            │
│  INPUT:                    │
│  latitude: number          │
│  longitude: number         │
│                            │
│  ANALYSIS:                 │
│  ├─ Is in CBD?             │
│  │  └─ Distance < 2km?     │
│  ├─ Has Fibre?             │
│  ├─ Has 5G coverage?       │
│  └─ Fallback: AirFibre     │
│                            │
│  SCORING:                  │
│  ├─ CBD detection: 0.95    │
│  ├─ Suburban: 0.90         │
│  └─ Rural: 0.70            │
│                            │
│  OUTPUT:                   │
│  {                         │
│    primary: "fibre"        │
│    alternatives: [...]     │
│    confidence: 0.95        │
│    cbd_detected: true      │
│    reasoning: "string"     │
│  }                         │
└────────────────────────────┘
```

---

## Caching Architecture

### Cache Key Generation

```
Input: latitude: -25.903104, longitude: 28.1706496

┌─────────────────────────────┐
│ Round to 6 decimals         │
│ latitude:  -25.903104       │
│ longitude:  28.170650       │
└─────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────┐
│ Generate Cache Key          │
│ Key: packages:-25.903104:   │
│      28.170650              │
└─────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────┐
│ Store in Cache              │
│ TTL: 5 minutes              │
│ Timestamp: now              │
│ Expires: now + 5min         │
└─────────────────────────────┘
```

### Cache Entry Structure

```
CachedPackageEntry {
  leadEntityID: 72849626,
  latitude: -25.903104,
  longitude: 28.170650,
  packages: SupersonicPackage[],
  technology: "5g-lte",
  cached_at: 1697497200000,      // Timestamp
  expires_at: 1697497500000,     // Timestamp + 5min
  ttl_minutes: 5
}
```

### Cache Lifecycle

```
Request for (lat, lng)
    │
    ├─→ Generate Key: "packages:{lat}:{lng}"
    │
    ├─→ Lookup in Map
    │
    ├─→ Found?
    │   │
    │   ├─ YES:
    │   │   ├─ Is Expired?
    │   │   │   ├─ NO  → Return (HIT) ~50ms
    │   │   │   └─ YES → Delete, Try API
    │   │   └─ Track: hits++
    │   │
    │   └─ NO:
    │       ├─ Call API
    │       ├─ On Success → Store in Cache
    │       └─ Track: misses++
    │
    └─→ Return Stats {hits, misses, hit_rate%}
```

---

## Error Handling Flow

### Request Error Handling

```
Supersonic API Request
    │
    ├─ Network Error?
    │  └─→ Retry (500ms) → Retry (1s) → Retry (2s) → Fail
    │
    ├─ Timeout (3s)?
    │  └─→ Status: 408 → Fallback to Layer 2
    │
    ├─ HTTP 418 (Anti-Bot)?
    │  └─→ Retry with browser headers → Fallback if still fails
    │
    ├─ HTTP 429 (Rate Limited)?
    │  └─→ Backoff: exponential wait → Retry → Fallback
    │
    ├─ HTTP 502 (Server Error)?
    │  └─→ Retry → Fallback to Layer 2
    │
    ├─ HTTP 400 (Bad Request)?
    │  └─→ Return Error (don't retry)
    │
    └─ Success (HTTP 200)?
       └─→ Parse Response → Map → Cache → Return
```

### Validation Pipeline

```
POST /api/coverage/supersonic/lead
    │
    ├─ Parse JSON
    │  └─ Error? → 400 Bad Request
    │
    ├─ Extract Fields
    │  ├─ address?
    │  ├─ latitude (number)?
    │  └─ longitude (number)?
    │  └─ Any missing? → 400 Bad Request
    │
    ├─ Validate Coordinates
    │  ├─ Min Lat: -34.8?
    │  ├─ Max Lat: -22.0?
    │  ├─ Min Lng: 16.5?
    │  └─ Max Lng: 32.9?
    │  └─ Outside SA? → 400 Bad Request
    │
    └─ Process Request
       └─→ (If all pass)
```

---

## Technology Detection Tree

```
Coordinates (lat, lng)
    │
    ├─ Is CBD?
    │  (distance < 2km from center)
    │
    ├─ CBD Detection Results:
    │  ├─ Cape Town:     -33.9249, 18.4241
    │  ├─ Johannesburg:  -26.2023, 28.0436
    │  ├─ Durban:        -29.8587, 31.0292
    │  └─ Others: Consider as suburban
    │
    ├─ YES (In CBD):
    │  │
    │  ├─ Has Fibre Infrastructure?
    │  │
    │  ├─ YES:
    │  │  Primary: "fibre"
    │  │  Alternatives: ["5g-lte"]
    │  │  Confidence: 0.95
    │  │  Reasoning: "CBD location with fibre infrastructure"
    │  │
    │  └─ NO:
    │     Primary: "5g-lte"
    │     Alternatives: ["airfibre"]
    │     Confidence: 0.85
    │     Reasoning: "CBD area with 5G/LTE coverage"
    │
    └─ NO (Suburban/Rural):
       │
       ├─ Has 5G Coverage?
       │
       ├─ YES:
       │  Primary: "5g-lte"
       │  Alternatives: ["airfibre", "lte"]
       │  Confidence: 0.90
       │  Reasoning: "Suburban area with 5G/LTE coverage"
       │
       └─ NO:
          Primary: "airfibre"
          Alternatives: ["lte"]
          Confidence: 0.70
          Reasoning: "Rural/remote area - AirFibre fallback"
```

---

## Database Integration

### Supabase Tables Referenced

```
┌─────────────────────────────────────┐
│ coverage_leads                      │
├─────────────────────────────────────┤
│ id: UUID                            │
│ address: string                     │
│ latitude: numeric                   │
│ longitude: numeric                  │
│ coverage_available: boolean         │
│ available_services: string[]        │
│ checked_at: timestamp               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ service_packages                    │
├─────────────────────────────────────┤
│ id: UUID                            │
│ name: string                        │
│ service_type: string                │
│ product_category: string            │
│ price: numeric                      │
│ promotion_price: numeric (nullable) │
│ active: boolean                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ coverage_areas (Legacy)             │
├─────────────────────────────────────┤
│ id: UUID                            │
│ area_name: string                   │
│ city: string                        │
│ service_type: string                │
│ status: string                      │
└─────────────────────────────────────┘
```

### PostGIS Function

```sql
check_coverage_at_point(lat, lng)
    └─→ Query: geographic polygon
        intersection for
        coordinates
    └─→ Return: matching
        coverage areas
    └─→ Extract: service_type
```

---

## Performance Profile

### Request Timeline

```
User Request
    │
    ├─→ [0ms]   Start
    │
    ├─→ [1ms]   JSON parse
    │
    ├─→ [2ms]   Validation
    │
    ├─→ [3ms]   Cache lookup
    │   │
    │   ├─ HIT:  Return [~60ms total]
    │   │
    │   └─ MISS: Continue to API
    │
    ├─→ [5ms]   API call
    │   │
    │   ├─ Retry 1: [500ms]
    │   ├─ Retry 2: [1000ms]
    │   └─ Retry 3: [2000ms]
    │
    ├─→ [2000ms] API response (max)
    │
    ├─→ [2002ms] Parse response
    │
    ├─→ [2003ms] Map to schema
    │
    ├─→ [2004ms] Store in cache
    │
    ├─→ [2005ms] Return response
    │
    └─→ [2005ms] Total [1.5-2s avg, 60ms cached]
```

---

## Deployment Architecture

### Environment Separation

```
┌──────────────────────────┐
│  Local Development       │
├──────────────────────────┤
│ SUPERSONIC_API_KEY=test  │
│ Cache: In-Memory         │
│ Logging: Console         │
│ Fallback: Enabled        │
└──────────────────────────┘

┌──────────────────────────┐
│  Staging                 │
├──────────────────────────┤
│ SUPERSONIC_API_KEY=prod  │
│ Cache: In-Memory         │
│ Logging: File + Console  │
│ Fallback: Enabled        │
│ Monitoring: Enabled      │
└──────────────────────────┘

┌──────────────────────────┐
│  Production              │
├──────────────────────────┤
│ SUPERSONIC_API_KEY=prod  │
│ Cache: In-Memory + Redis │
│ Logging: Structured logs │
│ Fallback: Enabled        │
│ Monitoring: Full         │
│ Alerts: Active           │
└──────────────────────────┘
```

---

## Monitoring Dashboard

### Key Metrics to Monitor

```
┌─────────────────────────────────────┐
│      API Performance Metrics        │
├─────────────────────────────────────┤
│ • Response Time (p50/p95/p99)       │
│ • Error Rate (per 1000 requests)    │
│ • Throughput (requests/sec)         │
│ • Retry Rate                        │
│ • Timeout Rate                      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│      Cache Performance Metrics      │
├─────────────────────────────────────┤
│ • Hit Rate (target: > 80%)          │
│ • Cache Size (entries)              │
│ • Memory Usage                      │
│ • Eviction Rate                     │
│ • TTL Distribution                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│     Business Metrics                │
├─────────────────────────────────────┤
│ • Package Accuracy (% match)        │
│ • Technology Detection Accuracy     │
│ • Coverage Success Rate             │
│ • Cost per Request                  │
│ • User Satisfaction                 │
└─────────────────────────────────────┘
```

---

**End of Architecture Diagram Document**
