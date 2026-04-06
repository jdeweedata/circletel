# Vercel → Coolify Migration Learnings
Date: 2026-04-05
Session: Full production cutover for CircleTel (254-page Next.js 15)

---

## What Was Accomplished

Complete migration from Vercel Pro to self-hosted Coolify on Contabo VPS 30 (24GB RAM):
- Traefik proxy configured and started
- DNS cutover (3 domains: www, bare, studio)
- 22 cron jobs installed on VPS
- UptimeRobot monitoring live
- Vercel builds disabled
- Production traffic 100% on VPS

Cost: EUR 28/mo → EUR 18.70/mo

---

## Coolify API Gotchas

### Field naming inconsistency: fqdn vs domains
**GET** response returns field `fqdn`, but **PATCH** requires `domains`:
```bash
# ❌ WRONG — returns 422 "This field is not allowed"
curl -X PATCH .../applications/{uuid} -d '{"fqdn": "https://www.example.com"}'

# ✅ CORRECT
curl -X PATCH .../applications/{uuid} -d '{"domains": "https://www.example.com,https://example.com"}'
```

### Restart endpoint is GET not POST
```bash
# ✅ CORRECT
curl -X GET http://coolify:8000/api/v1/applications/{uuid}/restart \
  -H "Authorization: Bearer {token}"
```

### env vars API: is_build_time not allowed
```bash
# ❌ WRONG — returns 422
{"key": "FOO", "value": "bar", "is_build_time": false}

# ✅ CORRECT
{"key": "FOO", "value": "bar", "is_preview": false}
```

### Memory limits
```bash
curl -X PATCH .../applications/{uuid} -d '{
  "limits_memory": "12288m",
  "limits_memory_reservation": "4096m"
}'
```

---

## Alpine Linux: localhost resolves to IPv6

On Alpine-based Docker containers, `localhost` resolves to `::1` (IPv6 loopback).
Next.js standalone server listens on IPv4 only (`0.0.0.0:3000`).
Result: Docker HEALTHCHECK with `localhost` always fails.

**Fix**: Always use `127.0.0.1` in Docker healthchecks on Alpine:
```dockerfile
# ❌ WRONG
HEALTHCHECK CMD wget -qO- http://localhost:3000/api/health || exit 1

# ✅ CORRECT
HEALTHCHECK CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
```

Same applies to Coolify UI healthcheck: Host = `127.0.0.1`, Port = `3000` (not `localhost:80`).

---

## Traefik Port 8080 Conflict

Coolify's Traefik docker-compose maps `8080:8080` for the dashboard.
If anything else occupies host port 8080 (e.g. CuriousFoe Dashboard), Traefik fails to start.

**Fix**: Remove the `8080:8080` mapping — the dashboard is accessible via Traefik's own router anyway:
```yaml
# /data/coolify/proxy/docker-compose.yml
ports:
  - '80:80'
  - '443:443'
  - '443:443/udp'
  # Remove: - '8080:8080'
```

Then: `cd /data/coolify/proxy && docker compose up -d`

---

## Vercel DNS vs Registrar DNS

**Architecture discovered**: Domain registered at xneelo, but Vercel is authoritative DNS.
- xneelo DNS changes → silently ignored (xneelo shows "update nameservers" banner)
- All DNS changes must be made in Vercel → Domains → circletel.co.za → DNS Records

**Vercel DNS: A records override locked ALIAS records**
Vercel auto-creates locked ALIAS records (`*` → `cname.vercel-dns-016.com.`).
These cannot be deleted, but adding a specific A record for the same name takes precedence:
```
# Locked ALIAS (cannot delete):
*     ALIAS  cname.vercel-dns-016.com.

# Added A records (override the wildcard for specific names):
@     A      94.72.104.81   ← overrides ALIAS for bare domain
www   A      94.72.104.81   ← overrides ALIAS for www
studio A     94.72.104.81   ← overrides ALIAS for studio
```

All Vercel DNS TTLs are 60s — cutover propagates within 1 minute.

---

## Disabling Vercel Builds

To stop Vercel from auto-deploying on every git push (but keep project/DNS alive):

Vercel → Project Settings → **Build and Deployment** → **Ignored Build Step**
- Behavior: **Custom**
- Command: `exit 1`
- Save

This is better than disconnecting the Git repo (which removes DNS management access).

---

## Cron Jobs: Environment Variable Pattern

VPS crontab doesn't inherit environment variables. Pattern for secure secret injection:

```bash
# /root/.cron-env (chmod 600)
CRON_SECRET=bf618cdf...
APP_URL=https://www.circletel.co.za

# Crontab entry pattern
*/30 * * * * . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/endpoint >> /var/log/circletel-cron.log 2>&1
```

**CRITICAL**: Use HTTPS domain, NOT localhost — app runs inside Docker container, unreachable from host via localhost.

---

## UptimeRobot API

Use `type: 1` (HTTP/HTTPS), not `type: 2` (keyword match — requires extra `keyword_type` param):

```python
data = {
    "api_key": API_KEY,
    "format": "json",
    "friendly_name": "CircleTel Health",
    "url": "https://www.circletel.co.za/api/health",
    "type": 1,      # ✅ HTTP — no keyword needed
    "interval": 300,
}
```

Monitor IDs created:
- CircleTel Health (`/api/health`): 802769548
- CircleTel Homepage: 802769549

---

## generateStaticParams Build-Time Guard

Any route with `generateStaticParams` that calls `createClient()` will fail Docker build
because `SUPABASE_SERVICE_ROLE_KEY` is a runtime secret, not a build arg.

**Fix pattern** (apply to all dynamic routes with generateStaticParams):
```typescript
export async function generateStaticParams() {
  // SUPABASE_SERVICE_ROLE_KEY is a runtime secret — not available during Docker build.
  // Return [] so the build succeeds; pages are generated on first request via ISR.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  const supabase = await createClient();
  // ... rest of function
}
```

Routes fixed: `app/coverage/[suburb]/page.tsx`, `app/p/[slug]/page.tsx`

---

## Coolify Token Creation

Laravel Sanctum format: `{id}|{plaintext}`

Direct DB insert (artisan tinker approach fails due to null team_id):
```sql
INSERT INTO personal_access_tokens (tokenable_type, tokenable_id, team_id, name, token, abilities, created_at, updated_at)
VALUES ('App\\Models\\User', 1, 0, 'circletel-env-sync-token', SHA2('circletel-env-sync-token-2026', 256), '["*"]', NOW(), NOW());
-- Token: 3|circletel-env-sync-token-2026
```
