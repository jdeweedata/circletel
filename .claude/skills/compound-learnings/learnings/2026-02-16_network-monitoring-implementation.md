# Network Monitoring Implementation Learnings

**Date**: 2026-02-16
**Scope**: Phases 1-3 of Network Monitoring roadmap
**Files Created**: 19 files, ~3,000 lines

## Summary

Implemented complete network monitoring stack:
- 7 database tables (provider health, outages, SLA tracking)
- Admin dashboard with incident CRUD
- Public status page at `/status`

## Patterns

### 1. Public vs Admin API Separation

```typescript
// PUBLIC API: No auth, cached, filtered
// app/api/public/status/route.ts
export const revalidate = 60 // Cache 60s

export async function GET() {
  const { data: incidents } = await supabase
    .from('outage_incidents')
    .select('*')
    .eq('is_public', true)  // Only public incidents
    .in('status', ['investigating', 'identified', 'monitoring'])
}

// ADMIN API: Auth required, real-time, full access
// app/api/admin/network/outages/route.ts
export async function GET(request: NextRequest) {
  // Auth check first
  const { data: incidents } = await supabase
    .from('outage_incidents')
    .select('*')  // All incidents, including internal
}
```

### 2. Graceful API Fallback

Status pages must never fail - return safe defaults:

```typescript
try {
  const data = await fetchFromDB()
  return NextResponse.json(data)
} catch (error) {
  // Don't return 500 - return safe defaults
  return NextResponse.json({
    overallStatus: 'operational',
    providers: defaultProviders,
    activeIncidents: [],
    lastUpdated: new Date().toISOString(),
  }, { status: 200 })
}
```

### 3. Supabase Migration Chunking

Large migrations timeout via MCP. Split by logical group:

```
20260212224146_network_monitoring_part1_tables.sql    # Core tables
20260212224146_network_monitoring_part2_outages.sql   # Outage tables
20260212224146_network_monitoring_part3_sla.sql       # SLA tables
20260212224146_network_monitoring_part4_indexes.sql   # All indexes
20260212224146_network_monitoring_part5_rls.sql       # RLS policies
```

Rules:
- Each part must be atomic (no cross-dependencies)
- Tables before indexes before RLS
- Keep under 50 lines per file for MCP reliability

### 4. Incident Status Workflow

Standard incident lifecycle:
```
investigating → identified → monitoring → resolved
```

Database enum:
```sql
CREATE TYPE incident_status AS ENUM (
  'investigating',
  'identified',
  'monitoring',
  'resolved'
);
```

UI status colors:
- investigating: Yellow
- identified: Orange
- monitoring: Blue
- resolved: Green

### 5. Auto-Refresh Pattern

```typescript
const [refreshing, setRefreshing] = useState(false)

// Auto-refresh every 60 seconds
useEffect(() => {
  const interval = setInterval(() => fetchStatus(), 60000)
  return () => clearInterval(interval)
}, [])

// Manual refresh with loading state
const handleRefresh = async () => {
  setRefreshing(true)
  await fetchStatus()
  setRefreshing(false)
}
```

## Friction Points

### RLS Policy Column Mismatch

**Issue**: Tried to use `auth_user_id` in RLS policy, but `admin_users` has different structure.

**Resolution**: Admin access uses service role (bypasses RLS), customer access uses RLS.

```sql
-- Customer RLS (works)
CREATE POLICY "customers_own_logs" ON customer_connection_logs
  FOR SELECT USING (customer_id = auth.uid());

-- Admin access: Use service role, no RLS policy needed
```

### Migration Timeout

**Issue**: 200+ line migration timed out after 20 seconds.

**Resolution**: Split into 5 files, run sequentially.

## Architecture Reference

```
Database Tables:
├── provider_status_logs     # Upstream provider health
├── customer_connection_logs # PPPoE session events
├── network_health_checks    # Latency probes
├── outage_incidents         # Incident lifecycle
├── outage_updates           # Timeline entries
├── sla_definitions          # SLA policies
└── sla_violations           # Breach records

API Routes:
├── /api/public/status       # Public (cached)
├── /api/admin/network/overview
├── /api/admin/network/outages
└── /api/admin/network/outages/[id]

UI Pages:
├── /status                  # Public status page
├── /admin/network           # Admin dashboard
├── /admin/network/outages   # Incident list
├── /admin/network/outages/new
└── /admin/network/outages/[id]
```

## Next Steps

- Phase 4: SLA Auto-Credits (13 pts)
- Phase 5: Proactive Alerting (21 pts)
- Add cron job to populate `provider_status_logs` with health checks
