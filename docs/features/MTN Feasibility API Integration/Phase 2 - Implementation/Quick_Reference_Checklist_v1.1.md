# MTN Feasibility Integration - Quick Reference Checklist
## For Development Team

**Phase 1 Status:** ✅ APPROVED  
**Ready for Phase 2:** ✅ YES  
**Document Version:** 1.1

---

## 🚦 PRE-IMPLEMENTATION CHECKLIST

### Environment Setup
- [ ] Create staging Supabase project
- [ ] Install required PostgreSQL extensions:
  ```sql
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  CREATE EXTENSION IF NOT EXISTS "postgis";
  CREATE EXTENSION IF NOT EXISTS "cube";           -- ⚠️ CRITICAL
  CREATE EXTENSION IF NOT EXISTS "earthdistance";  -- ⚠️ CRITICAL
  CREATE EXTENSION IF NOT EXISTS "pg_cron";        -- Optional
  ```
- [ ] Generate encryption key:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] Configure environment variables:
  ```env
  NEXT_PUBLIC_ENABLE_FEASIBILITY=false  # Start disabled
  MTN_API_BASE_URL=https://hnssl.mtn.co.za/
  MTN_API_KEY=your_key_here
  MTN_CLIENT_ID=your_client_id
  MTN_CLIENT_SECRET=your_secret_here
  FEASIBILITY_ENCRYPTION_KEY=<32_byte_hex_from_above>
  FEASIBILITY_CACHE_TTL_DAYS=7
  FEASIBILITY_CACHE_RADIUS_METERS=500
  FEASIBILITY_RATE_LIMIT_PER_MINUTE=60
  CRON_SECRET=<random_secret_for_health_checks>
  ```

### Repository Setup
- [ ] Create feature branch: `feature/mtn-feasibility-integration`
- [ ] Create directory structure:
  ```
  lib/feasibility/
  ├── checker.ts
  ├── cache-manager.ts
  ├── provider-client.ts
  ├── encryption.ts
  ├── rate-limiter.ts
  ├── logger.ts
  ├── health-monitor.ts
  ├── transformers/
  │   ├── mtn.ts
  │   └── base-transformer.ts
  └── types.ts
  ```

---

## 📅 IMPLEMENTATION TIMELINE (6-8 weeks)

### Week 1: Database Foundation
**Tasks:**
- [ ] Run database migration in staging
- [ ] Verify all extensions enabled
- [ ] Test spatial functions (`ll_to_earth`, `earth_distance`)
- [ ] Seed default MTN provider (disabled)
- [ ] Create RLS policies
- [ ] Test database performance

**Deliverable:** Working database schema in staging

### Week 2: Core Business Logic
**Tasks:**
- [ ] Implement `lib/feasibility/types.ts` (TypeScript interfaces)
- [ ] Implement `lib/feasibility/encryption.ts` (credential encryption)
- [ ] Implement `lib/feasibility/transformers/mtn.ts` (MTN API client)
- [ ] Implement `lib/feasibility/cache-manager.ts` (caching logic)
- [ ] Implement `lib/feasibility/checker.ts` (orchestration)
- [ ] Write unit tests (80%+ coverage target)

**Deliverable:** Tested business logic layer

### Week 3: API Endpoints
**Tasks:**
- [ ] Create `app/api/v1/feasibility/check/route.ts` (public endpoint)
- [ ] Create `app/api/v1/admin/network-providers/route.ts` (CRUD)
- [ ] Create `app/api/v1/admin/network-providers/[id]/route.ts`
- [ ] Create `app/api/v1/admin/network-providers/[id]/test/route.ts`
- [ ] Implement rate limiting middleware
- [ ] Write API tests with Supertest
- [ ] Test with Postman/Insomnia

**Deliverable:** Functional API endpoints

### Week 4: Admin Interface
**Tasks:**
- [ ] Create `app/admin/network-providers/page.tsx` (dashboard)
- [ ] Create `ProviderCard.tsx` component
- [ ] Create `app/admin/network-providers/[id]/page.tsx` (edit form)
- [ ] Create `ProviderForm.tsx` component
- [ ] Create `APITestConsole.tsx` component
- [ ] Update admin navigation
- [ ] Add RBAC permissions to `lib/rbac/permissions.ts`
- [ ] Test admin workflow end-to-end

**Deliverable:** Working admin panel

### Week 5: Frontend Integration
**Tasks:**
- [ ] Create `components/feasibility/FeasibilityChecker.tsx`
- [ ] Create `components/feasibility/AddressInput.tsx` (autocomplete)
- [ ] Create `components/feasibility/ProductList.tsx`
- [ ] Create `components/feasibility/CoverageMap.tsx` (optional)
- [ ] Integrate into `app/home-internet/page.tsx`
- [ ] Integrate into `app/wireless/page.tsx`
- [ ] Test on mobile devices
- [ ] Lighthouse performance audit

**Deliverable:** Customer-facing feasibility checker

### Week 6: Testing & Bug Fixes
**Tasks:**
- [ ] Run full test suite (unit + integration + E2E)
- [ ] Performance testing (k6 load tests)
- [ ] Security audit (credentials, rate limiting, SQL injection)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Browser compatibility testing
- [ ] Fix all P0 and P1 bugs

**Deliverable:** Production-ready code

### Week 7: Staging Deployment
**Tasks:**
- [ ] Deploy to staging environment
- [ ] Configure MTN API credentials (staging)
- [ ] Run smoke tests
- [ ] User acceptance testing (UAT)
- [ ] Load testing (500 concurrent users)
- [ ] Monitor logs and performance
- [ ] Fix any staging-specific issues

**Deliverable:** Stable staging deployment

### Week 8: Production Deployment
**Tasks:**
- [ ] Backup production database
- [ ] Run production migration
- [ ] Deploy application code
- [ ] Configure MTN API credentials (production)
- [ ] Keep feature flag disabled initially
- [ ] Monitor health checks for 24 hours
- [ ] Enable feature flag for 10% of users
- [ ] Monitor for issues
- [ ] Gradually roll out to 100%

**Deliverable:** Live in production

---

## ⚠️ CRITICAL ITEMS (DO NOT SKIP)

### Database
1. **Extensions Must Be Enabled in Correct Order:**
   ```sql
   CREATE EXTENSION cube;           -- FIRST
   CREATE EXTENSION earthdistance;  -- SECOND (depends on cube)
   ```
   If you get `undefined_function` errors, you missed this step.

2. **Verify Spatial Functions Work:**
   ```sql
   SELECT earth_distance(
     ll_to_earth(-26.2041, 28.0473),
     ll_to_earth(-26.2050, 28.0480)
   ) AS distance_meters;
   ```
   Should return ~100 meters.

### Security
3. **Never Commit API Keys:**
   - Always use environment variables
   - Add `.env.local` to `.gitignore`
   - Use encrypted storage for provider credentials

4. **Test Encryption/Decryption:**
   ```typescript
   const encrypted = encryptCredentials({ api_key: "test" });
   const decrypted = decryptCredentials(encrypted);
   expect(decrypted.api_key).toBe("test");
   ```

### Performance
5. **Cache Hit Rate Monitoring:**
   - Target: > 70% cache hit rate
   - If below 60%, consider increasing TTL or radius
   - Monitor with SQL query:
   ```sql
   SELECT 
     COUNT(*) FILTER (WHERE cache_hit = true) * 100.0 / COUNT(*) 
   FROM feasibility_checks 
   WHERE checked_at > NOW() - INTERVAL '24 hours';
   ```

6. **Provider Timeout Handling:**
   - Always wrap provider API calls in `Promise.race()` with timeout
   - Default: 10 seconds
   - Log slow providers for investigation

### Testing
7. **Test With Real MTN API:**
   - Get staging API credentials from MTN
   - Test with at least 10 different coordinates
   - Verify response parsing is correct

8. **Test Rate Limiting:**
   ```bash
   # Should succeed
   for i in {1..20}; do curl -X POST http://localhost:3000/api/v1/feasibility/check -d '{"latitude":-26.2041,"longitude":28.0473}'; done
   
   # 21st request should return 429
   curl -X POST http://localhost:3000/api/v1/feasibility/check -d '{"latitude":-26.2041,"longitude":28.0473}'
   ```

---

## 🐛 COMMON ISSUES & SOLUTIONS

### Issue 1: `ll_to_earth` function not found
**Cause:** `earthdistance` extension not enabled  
**Solution:**
```sql
CREATE EXTENSION cube;
CREATE EXTENSION earthdistance;
```

### Issue 2: Rate limiting not working
**Cause:** Missing user session tracking  
**Solution:** Check `user_session_id` is being set in `feasibility_checks` table

### Issue 3: MTN API authentication fails
**Cause:** Incorrect credentials or token expired  
**Solution:**
1. Test credentials with `curl`:
   ```bash
   curl -X POST https://hnssl.mtn.co.za/MTNBulkApi/api/Sync \
     -H "Authorization: Bearer $MTN_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"latitude":-26.2041,"longitude":28.0473}'
   ```
2. Contact MTN API support if credentials are correct

### Issue 4: Cache not working
**Cause:** Spatial index not created  
**Solution:**
```sql
CREATE INDEX idx_feasibility_location ON feasibility_checks 
USING GIST (ll_to_earth(latitude, longitude));
```

### Issue 5: Slow admin dashboard
**Cause:** No index on `provider_id` + `checked_at`  
**Solution:**
```sql
CREATE INDEX idx_provider_health_checks_provider 
ON provider_health_checks(provider_id, checked_at DESC);
```

---

## 📊 MONITORING QUERIES

### Cache Hit Rate (Last 24 Hours)
```sql
SELECT 
  COUNT(*) FILTER (WHERE cache_hit = true) AS cache_hits,
  COUNT(*) AS total_checks,
  ROUND(COUNT(*) FILTER (WHERE cache_hit = true) * 100.0 / COUNT(*), 2) AS hit_rate_percent
FROM feasibility_checks 
WHERE checked_at > NOW() - INTERVAL '24 hours';
```

### Provider Health Summary
```sql
SELECT 
  np.name,
  COUNT(*) AS checks_last_hour,
  ROUND(AVG(phc.response_time_ms), 0) AS avg_response_ms,
  ROUND(COUNT(*) FILTER (WHERE phc.is_healthy = true) * 100.0 / COUNT(*), 2) AS success_rate
FROM network_providers np
LEFT JOIN provider_health_checks phc ON phc.provider_id = np.id
WHERE phc.checked_at > NOW() - INTERVAL '1 hour'
GROUP BY np.id, np.name;
```

### Top Searched Locations
```sql
SELECT 
  ROUND(latitude::numeric, 3) AS lat,
  ROUND(longitude::numeric, 3) AS lon,
  COUNT(*) AS check_count,
  array_agg(DISTINCT check_status) AS statuses
FROM feasibility_checks
WHERE checked_at > NOW() - INTERVAL '7 days'
GROUP BY ROUND(latitude::numeric, 3), ROUND(longitude::numeric, 3)
ORDER BY check_count DESC
LIMIT 20;
```

### Failed Checks (Requires Investigation)
```sql
SELECT 
  fc.id,
  fc.latitude,
  fc.longitude,
  fc.error_message,
  fc.checked_at,
  np.name AS provider_name
FROM feasibility_checks fc
JOIN network_providers np ON np.id = fc.provider_id
WHERE fc.check_status IN ('failed', 'timeout', 'rate_limited')
  AND fc.checked_at > NOW() - INTERVAL '1 hour'
ORDER BY fc.checked_at DESC;
```

---

## 🔄 ROLLBACK PROCEDURES

### Emergency Rollback (< 1 minute)
```bash
# Disable feature via environment variable
vercel env rm NEXT_PUBLIC_ENABLE_FEASIBILITY production
vercel env add NEXT_PUBLIC_ENABLE_FEASIBILITY production
# Enter: false
vercel --prod
```

### Code Rollback (< 5 minutes)
```bash
# Revert to previous deployment
vercel ls circle-tel
vercel promote <previous_deployment_url> --prod
```

### Database Rollback (Only if absolutely necessary)
```bash
# Restore from backup
pg_restore -h <prod_host> -U <user> -d circle_tel_prod backup.dump

# Or drop new tables
psql -c "DROP TABLE IF EXISTS provider_health_checks, feasibility_checks, network_providers CASCADE;"
```

---

## ✅ FINAL PRE-DEPLOYMENT CHECKLIST

### Code Quality
- [ ] All tests passing (unit + integration + E2E)
- [ ] Code coverage > 80%
- [ ] No console.log statements in production code
- [ ] All TODO comments resolved
- [ ] TypeScript strict mode enabled
- [ ] ESLint passing with zero warnings

### Security
- [ ] No API keys in code or git history
- [ ] Environment variables configured
- [ ] RBAC permissions tested
- [ ] Rate limiting working
- [ ] SQL injection tests passed
- [ ] OWASP top 10 vulnerabilities checked

### Performance
- [ ] Lighthouse score > 90
- [ ] API response time < 2s (90th percentile)
- [ ] Database queries use indexes
- [ ] Cache hit rate > 70%
- [ ] No N+1 query issues

### Monitoring
- [ ] Sentry error tracking configured
- [ ] Health check cron job active
- [ ] Database metrics dashboard created
- [ ] Alert thresholds configured
- [ ] On-call rotation established

### Documentation
- [ ] README updated
- [ ] API documentation in Swagger/Postman
- [ ] Admin user guide written
- [ ] Architecture diagram updated
- [ ] Runbook for common issues

---

## 🎯 SUCCESS METRICS (Monitor After Launch)

### Week 1 Post-Launch
- [ ] Zero critical bugs reported
- [ ] API uptime > 99.9%
- [ ] Average response time < 2s
- [ ] Cache hit rate > 70%
- [ ] No security incidents

### Month 1 Post-Launch
- [ ] Order conversion rate +20%
- [ ] Support tickets about coverage -50%
- [ ] Admin can add provider in < 15 minutes
- [ ] Customer satisfaction score > 4.5/5
- [ ] Feature usage > 60% of home internet page visitors

---

## 📞 SUPPORT CONTACTS

| Issue Type | Contact | Response Time |
|------------|---------|---------------|
| Database issues | dba@circletelsa.co.za | < 2 hours |
| API errors | dev-lead@circletelsa.co.za | < 1 hour |
| MTN API issues | api-support@mtn.co.za | < 4 hours |
| Deployment issues | devops@circletelsa.co.za | < 30 minutes |
| Security concerns | security@circletelsa.co.za | Immediate |

---

**This checklist should be printed and referenced throughout the implementation process.**

**Questions?** Contact the tech lead or refer to the full specification document.