# Manual Migration Application Instructions

## SQL Fix: Health Metrics Function (20251021000001)

Due to connection authentication issues with programmatic SQL execution, please apply this migration manually via the Supabase Dashboard.

### Steps to Apply:

1. **Open Supabase Dashboard SQL Editor**
   - URL: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/sql/new

2. **Copy the SQL below and paste it into the SQL Editor**

3. **Click "Run" to execute**

---

## SQL to Execute:

```sql
-- Fix ambiguous health_status reference in update_provider_health_metrics function
-- Created: 2025-10-21
-- Issue: Line "health_status = health_status" is ambiguous (column vs variable)
-- Fix: Rename local variable to v_health_status

CREATE OR REPLACE FUNCTION update_provider_health_metrics(p_provider_id UUID)
RETURNS VOID AS $$
DECLARE
  v_success_rate DECIMAL(5, 2);
  v_avg_response_time INTEGER;
  v_health_status TEXT;
BEGIN
  -- Calculate metrics
  v_success_rate := calculate_provider_success_rate_24h(p_provider_id);
  v_avg_response_time := calculate_provider_avg_response_time_24h(p_provider_id);

  -- Determine health status
  IF v_success_rate >= 95 THEN
    v_health_status := 'healthy';
  ELSIF v_success_rate >= 80 THEN
    v_health_status := 'degraded';
  ELSE
    v_health_status := 'down';
  END IF;

  -- Update provider (now unambiguous)
  UPDATE fttb_network_providers
  SET
    success_rate_24h = v_success_rate,
    avg_response_time_24h = v_avg_response_time,
    health_status = v_health_status,
    last_health_check = NOW(),
    last_successful_check = CASE
      WHEN v_success_rate > 0 THEN (
        SELECT MAX(created_at)
        FROM provider_api_logs
        WHERE provider_id = p_provider_id AND success = true
      )
      ELSE last_successful_check
    END,
    updated_at = NOW()
  WHERE id = p_provider_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_provider_health_metrics IS 'Updates provider health metrics (success rate, avg response time, health status) based on last 24 hours of API logs - Fixed version with v_ prefix for local variables';
```

---

## Verification:

After applying, verify the function exists:

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'update_provider_health_metrics';
```

Expected result: One row showing the function exists.

---

## Alternative: SQL File Location

The migration file is located at:
`C:\Projects\circletel-nextjs\supabase\migrations\20251021000001_fix_health_metrics_function.sql`

---

## Next Steps After Migration:

1. Start development server: `npm run dev`
2. Run MTN integration tests: `powershell -File scripts/run-mtn-tests.ps1`
3. Test admin coverage dashboard: Navigate to `/admin/coverage`

---

**Issue**: Connection string authentication failed for programmatic execution
**Reason**: "Tenant or user not found" error when using pooler connection
**Solution**: Manual execution via Supabase Dashboard SQL Editor (most reliable method)
