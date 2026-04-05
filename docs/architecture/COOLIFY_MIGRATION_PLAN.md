# CircleTel → Coolify Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## Context

CircleTel (Next.js 15.1.9, 254 pages) is deployed on Vercel Pro ($20/month credit). The app requires Enhanced Build Machine (16GB, $0.030/min) because webpack OOMs on Standard/Elastic 8GB machines. Turbopack crashes on the `sanity` package. Cost optimization is critical.

**Goal**: Replace Vercel entirely with Coolify self-hosted on VPS. Also consolidate existing VPS services (CuriousFoe, nginx) under Coolify management.

**VPS**: Contabo VPS 30 — 8 vCPU, 24GB RAM, 200GB NVMe, 600 Mbit/s (EUR 18.70/mo) — **upgrade required from current VPS 20 (12GB RAM)**

**Architecture**: GitHub Actions CI builds Docker image → pushes to GHCR → Coolify pulls and deploys. **Builds never run on the VPS** — this prevents the documented issue where Next.js rebuilds spike to 70+ load average and OOM-kill the running production container.

### Current VPS State (Discovered via `/status`)

The VPS 20 (12GB RAM) is already running multiple services that affect this migration:

| Service | Port | RAM Est. | Status |
|---------|------|----------|--------|
| CuriousFoe Orchestrator | — | ~500MB | systemd, running |
| CuriousFoe Dashboard | :8080 | ~500MB | systemd, running |
| CuriousFoe Gateway | — | ~500MB | systemd, running |
| CuriousFoe FileWatcher | — | ~200MB | systemd, running |
| nginx | :80, :8081 | ~100MB | **Blocks Traefik (port 80 conflict)** |
| CircleTel dev server | :3001 | ~1.5GB | next-server running |
| Chrome DevTools (x2) | :9222 | ~500MB | MCP browser tools |
| PM2 | — | ~50MB | Running but empty (0 processes) |
| `python3 -m http.server` | :8899 | ~20MB | **Ad-hoc, public-facing, security risk** |
| `npx serve` | :3456 | ~20MB | **Ad-hoc, public-facing, security risk** |

**Total RAM used: 8.4GB / 11GB (72%)** — no swap configured. VPS 20 cannot safely add Docker + Coolify + CircleTel container.

**Critical blockers identified:**
1. **nginx on port 80** — conflicts with Coolify's Traefik reverse proxy
2. **RAM at 72%** — insufficient for Docker + Coolify + CircleTel production
3. **Two unknown public-facing processes** on :8899 and :3456 (identified as ad-hoc file servers)
4. **No Docker installed** — prerequisite for Coolify
5. **CuriousFoe services** — should migrate into Coolify containers (not dual systemd + Coolify)

---

## Migration Blockers (Must Address)

| Blocker | Impact | Solution |
|---------|--------|----------|
| No `output: 'standalone'` in next.config.js | Docker image requires full node_modules (~1GB+) | Add `output: 'standalone'` |
| `NEXT_PUBLIC_*` vars not baked into build | Client-side vars render as `undefined` | `ARG`/`ENV` injection in Dockerfile + GitHub Actions secrets |
| Builds on VPS crash live app | OOM-kills production container during deploy | GitHub Actions CI → GHCR → Coolify CD (build offloaded) |
| 21 Vercel cron jobs | No scheduler on bare Docker | Linux crontab with curl via HTTPS domain (NOT localhost) |
| `@vercel/analytics` import | Will fail/no-op on non-Vercel | Remove |
| `process.env.VERCEL` checks | PWA auto-enables, env detection breaks | Keep PWA enabled, verify service worker behavior |
| Inngest (22 background functions) | Needs Inngest service | Continue with Inngest Cloud |
| Subdomain routing (studio.circletel.co.za) | Middleware expects subdomain | Add as second domain in Coolify, Traefik routes both to same container |
| ~80+ environment variables | All need configuring | Bulk import via Coolify CLI + GitHub Secrets for build vars |
| Puppeteer/Chromium in Docker | Needs system libraries | Alpine chromium + nss + harfbuzz in Dockerfile |
| `sharp` Alpine compatibility | Native binaries fail without musl deps | `libc6-compat python3 make g++` in deps stage |
| No health check endpoint | Docker/Coolify can't verify app is running | Add `/api/health` route |
| Bare domain → www redirect | SEO + canonical URL issues | Traefik redirect middleware |
| **nginx occupies port 80** | Traefik cannot start — Coolify install fails | Stop + disable nginx before Coolify install, migrate proxy rules to Traefik |
| **VPS 20 RAM too low (12GB, 72% used)** | Cannot fit Docker + Coolify + CircleTel alongside existing services | Upgrade to VPS 30 (24GB) via Contabo Live Migration |
| **Ad-hoc processes on :8899, :3456** | Public-facing security risk, wasted RAM | Kill and firewall before migration |
| **CuriousFoe on systemd** | Dual service management (systemd + Coolify) is fragile | Migrate into Coolify containers post-CircleTel |
| **PM2 running empty** | Wasting ~50MB RAM | Kill and disable |
| **No swap** | Any memory spike = OOM kill | Add 4GB swap after VPS 30 upgrade |

---

## Phase 0: VPS Preparation (Before Code Changes)

> **CRITICAL**: These steps must happen BEFORE installing Coolify. Skipping any step risks migration failure.

### Task 0a: Security — Kill and Block Ad-Hoc Public Processes

**Why**: Two unidentified processes are listening on public interfaces — security risk.

- [ ] Identify and kill:
  ```bash
  # Port 8899: python3 -m http.server (ad-hoc file server)
  kill $(lsof -t -i:8899)

  # Port 3456: npx serve (ad-hoc static server)
  kill $(lsof -t -i:3456)
  ```
- [ ] Verify killed: `ss -tlnp | grep -E '8899|3456'` → no output
- [ ] Block ports via ufw (if installed) or iptables:
  ```bash
  ufw deny 8899/tcp 2>/dev/null
  ufw deny 3456/tcp 2>/dev/null
  ```

### Task 0b: Cleanup — Free RAM on Current VPS

- [ ] Kill empty PM2 (consuming memory for nothing):
  ```bash
  pm2 kill
  systemctl stop pm2-root
  systemctl disable pm2-root
  ```
- [ ] Stop CircleTel dev server (production is on Vercel, no need for local dev server):
  ```bash
  kill $(lsof -t -i:3001) 2>/dev/null
  ```
- [ ] Stop Chrome DevTools instances (MCP browser tools — restart when needed):
  ```bash
  pkill -f chrome
  ```
- [ ] Verify RAM freed: `free -h` (should drop from 8.4GB to ~5-6GB used)

### Task 0c: Backup nginx Config

**Why**: nginx proxy rules must be preserved to recreate in Traefik/Coolify.

- [ ] Export configs:
  ```bash
  nginx -T > ~/nginx-full-config-backup.txt
  cp -r /etc/nginx/sites-enabled/ ~/nginx-sites-backup/
  ```
- [ ] Document current proxy rules:
  | nginx Rule | Target | Coolify Equivalent |
  |------------|--------|-------------------|
  | `:80 /` → `:3000` | CircleTel app | CircleTel Coolify app with domain |
  | `:80 /dashboard` → `/home/design-architect` | Static files | Static site in Coolify or remove |
  | `:8081` → `/var/www/entrsphere` | EntSphere static | Coolify static site app |

### Task 0d: Upgrade VPS 20 → VPS 30

**Why**: VPS 20 (12GB) cannot fit Docker + Coolify + CircleTel + CuriousFoe. VPS 30 (24GB) provides headroom.

**STATUS**: Upgrade ordered — Contabo Ticket #16240144281 confirmed. IP 94.72.104.81 stays the same. Live Migration in progress, data preserved. Waiting for Contabo completion email.

- [x] Order VPS 30 upgrade via Contabo Customer Control Panel
  - Use **Live Migration** (no data loss, ~15-30 min downtime)
  - New specs: 8 vCPU, 24GB RAM, 200GB NVMe, EUR 18.70/mo
- [ ] After migration completes, verify: `free -h` shows ~24GB
- [ ] Verify all CuriousFoe services survived: `systemctl status curiousfoe-*`
- [ ] **Take Contabo snapshot** (rollback point before Docker/Coolify install)

### Task 0e: Add Swap + Install Docker

- [ ] Add 4GB swap:
  ```bash
  fallocate -l 4G /swapfile && chmod 600 /swapfile
  mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  ```
- [ ] Install Docker Engine 24+ (NOT snap):
  ```bash
  curl -fsSL https://get.docker.com | sh
  docker --version  # Should show 24+
  ```

### Task 0f: Stop nginx (Frees Port 80 for Traefik)

**Why**: Coolify's Traefik reverse proxy requires ports 80 and 443. nginx occupying port 80 will cause Traefik to fail on startup.

- [ ] Stop and disable nginx:
  ```bash
  systemctl stop nginx
  systemctl disable nginx
  ```
- [ ] Verify port 80 is free: `ss -tlnp | grep :80` → no output
- [ ] **Note**: EntSphere (:8081) and design-architect (/dashboard) will be offline until recreated in Coolify. CuriousFoe Dashboard (:8080) is localhost-only and unaffected.

---

## Phase 1: Prepare Codebase for Docker/Coolify

### Task 1: Add `output: 'standalone'` to next.config.js

**Files:** `next.config.js`

- [ ] Add `output: 'standalone'` to the `nextConfig` object (after `productionBrowserSourceMaps: false`)
- [ ] Verify: `node -e "const c = require('./next.config.js'); console.log(c.output)"` → `standalone`
- [ ] Commit

### Task 2: Create Dockerfile and .dockerignore

**Files:** `Dockerfile` (new), `.dockerignore` (new)

- [ ] Create `.dockerignore`:
  ```
  node_modules
  .next
  .git
  .env*
  docs
  .claude
  .superpowers
  *.md
  ```

- [ ] Create production-ready multi-stage `Dockerfile`:

```dockerfile
FROM node:20-alpine AS base

# -- Stage 1: Install deps --
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# -- Stage 2: Build --
FROM base AS builder
RUN apk add --no-cache libc6-compat chromium
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time NEXT_PUBLIC_ vars (injected via docker build --build-arg from GitHub Actions)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ARG NEXT_PUBLIC_NETCASH_SERVICE_KEY
ARG NEXT_PUBLIC_NETCASH_PCI_VAULT_KEY
ARG NEXT_PUBLIC_DIDIT_ENVIRONMENT
ARG NEXT_PUBLIC_ICASA_ENVIRONMENT

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY \
    NEXT_PUBLIC_NETCASH_SERVICE_KEY=$NEXT_PUBLIC_NETCASH_SERVICE_KEY \
    NEXT_PUBLIC_NETCASH_PCI_VAULT_KEY=$NEXT_PUBLIC_NETCASH_PCI_VAULT_KEY \
    NEXT_PUBLIC_DIDIT_ENVIRONMENT=$NEXT_PUBLIC_DIDIT_ENVIRONMENT \
    NEXT_PUBLIC_ICASA_ENVIRONMENT=$NEXT_PUBLIC_ICASA_ENVIRONMENT \
    NEXT_TELEMETRY_DISABLED=1 \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_OPTIONS='--max-old-space-size=12288'

RUN npm run build

# -- Stage 3: Runner --
FROM base AS runner

# Chromium runtime deps for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto \
    font-noto-cjk

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=5 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
```

**Key fixes vs original draft:**
- `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium` (NOT `/usr/bin/chromium-browser` — wrong path on Alpine)
- `font-noto font-noto-cjk` (NOT `font-noto-emoji` — doesn't exist in Alpine apk)
- `--start-period=120s --retries=5` (NOT 60s/3 — 254-page app needs 90-120s cold start)

- [ ] Commit

### Task 3: Create GitHub Actions CI/CD workflow

**Files:** `.github/workflows/deploy.yml` (new)

**WHY**: Building on the VPS risks OOM-killing the live production container. GitHub Actions provides free 7GB runners that handle webpack builds safely, then Coolify only pulls the pre-built image.

```yaml
name: Build & Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ghcr.io/jdeweedata/circletel:latest
          build-args: |
            NEXT_PUBLIC_SUPABASE_URL=${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
            NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=${{ secrets.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY }}
            NEXT_PUBLIC_APP_URL=https://www.circletel.co.za
            NEXT_PUBLIC_BASE_URL=https://www.circletel.co.za
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=${{ secrets.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY }}
            NEXT_PUBLIC_NETCASH_SERVICE_KEY=${{ secrets.NEXT_PUBLIC_NETCASH_SERVICE_KEY }}
            NEXT_PUBLIC_NETCASH_PCI_VAULT_KEY=${{ secrets.NEXT_PUBLIC_NETCASH_PCI_VAULT_KEY }}
            NEXT_PUBLIC_DIDIT_ENVIRONMENT=${{ secrets.NEXT_PUBLIC_DIDIT_ENVIRONMENT }}
            NEXT_PUBLIC_ICASA_ENVIRONMENT=${{ secrets.NEXT_PUBLIC_ICASA_ENVIRONMENT }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Coolify deploy webhook
        run: |
          curl -sfX GET "${{ secrets.COOLIFY_DEPLOY_WEBHOOK }}"
```

- [ ] Add GitHub repo secrets (Settings → Secrets and variables → Actions):
  - All 9 `NEXT_PUBLIC_*` vars
  - `COOLIFY_DEPLOY_WEBHOOK` (get from Coolify → App → Webhooks after Task 10)
- [ ] Commit

### Task 4: Add health check endpoint

**Files:** `app/api/health/route.ts` (new)

- [ ] Create lightweight health check endpoint:
  ```typescript
  import { NextResponse } from 'next/server';

  export async function GET() {
    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
  }
  ```
- [ ] Commit

### Task 5: Create nixpacks.toml (fallback)

**Files:** `nixpacks.toml` (new)

Fallback if Coolify ever needs to build directly (not used in primary CI/CD flow):

- [ ] Create `nixpacks.toml`:
  ```toml
  [phases.install]
  cmds = ["npm ci --legacy-peer-deps"]

  [phases.build]
  cmds = ["NODE_OPTIONS='--max-old-space-size=12288' npm run build"]

  [start]
  cmd = "npm run start"
  ```
- [ ] Commit

### Task 6: Handle Vercel-specific code

**Files:** Multiple

- [ ] `app/layout.tsx`: Remove `@vercel/analytics` `<Analytics />` component
- [ ] `next.config.js`: Keep PWA enabled on Coolify (the `isVercel` guard correctly enables PWA on non-Vercel). Verify service worker doesn't cache stale API responses — runtimeCaching uses `NetworkFirst` for Supabase API with 1hr expiry (acceptable).
- [ ] `lib/utils/webhook-urls.ts`: Verify fallback when `VERCEL_ENV` is undefined (checks `NEXT_PUBLIC_APP_URL` patterns — works)
- [ ] `lib/api/test-guard.ts`: Set `NODE_ENV=production` in Coolify to handle test route restrictions
- [ ] Commit

### Task 7: Create cron job scripts

**Files:** `scripts/install-crontab.sh` (new)

**CRITICAL**: Cron jobs must use the full HTTPS domain, NOT `localhost:3000`. The Next.js app runs inside a Docker container behind Traefik — `localhost:3000` from the VPS host won't reach it.

**CRITICAL**: `$CRON_SECRET` won't be available in the VPS crontab environment. Source it from a file.

- [ ] Create `/root/.cron-env` (chmod 600) on VPS:
  ```bash
  CRON_SECRET=your_secret_here
  APP_URL=https://www.circletel.co.za
  ```

- [ ] Create `scripts/install-crontab.sh` with all 21 entries.

Each cron entry follows this pattern (with logging):
```bash
. /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/<endpoint> >> /var/log/circletel-cron.log 2>&1
```

Full schedule (all times UTC, matching Vercel config):

```
0 0 * * *     . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/generate-invoices >> /var/log/circletel-cron.log 2>&1
0 2 * * *     . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/expire-deals >> /var/log/circletel-cron.log 2>&1
0 2 * * *     . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/price-changes >> /var/log/circletel-cron.log 2>&1
0 0 * * *     . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/zoho-sync >> /var/log/circletel-cron.log 2>&1
*/30 * * * *  . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/integrations-health-check >> /var/log/circletel-cron.log 2>&1
0 3 * * 0     . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/cleanup-webhook-logs >> /var/log/circletel-cron.log 2>&1
0 1 * * *     . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/competitor-scrape >> /var/log/circletel-cron.log 2>&1
0 7 * * *     . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/payment-reconciliation >> /var/log/circletel-cron.log 2>&1
0 */4 * * *   . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/payment-sync-retry >> /var/log/circletel-cron.log 2>&1
0 2,6,10,14,18,22 * * * . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/payment-sync-monitor >> /var/log/circletel-cron.log 2>&1
0 8 * * *     . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/invoice-sms-reminders >> /var/log/circletel-cron.log 2>&1
0 21 * * *    . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/ar-snapshot >> /var/log/circletel-cron.log 2>&1
0 6 * * *     . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/submit-debit-orders >> /var/log/circletel-cron.log 2>&1
0 6 * * *     . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/submit-cc-debit-orders >> /var/log/circletel-cron.log 2>&1
0 5 * * *     . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/process-billing-day >> /var/log/circletel-cron.log 2>&1
0 1 * * *     . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/stats-snapshot >> /var/log/circletel-cron.log 2>&1
0 0,6,12,18 * * * . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/diagnostics-health-check >> /var/log/circletel-cron.log 2>&1
0 4 1 * *     . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/generate-monthly-invoices >> /var/log/circletel-cron.log 2>&1
0 4 25 * *    . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/generate-invoices-25th >> /var/log/circletel-cron.log 2>&1
0 6 * * *     . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/paynow-reconciliation >> /var/log/circletel-cron.log 2>&1
0 3 * * *     . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/zoho-books-sync >> /var/log/circletel-cron.log 2>&1
*/15 * * * *  . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/zoho-books-retry >> /var/log/circletel-cron.log 2>&1
```

- [ ] Commit

---

## Phase 2: Install Coolify on VPS

> **Prerequisites**: All Phase 0 tasks must be complete — VPS 30 confirmed, Docker installed, nginx stopped, port 80 free.

### Task 8: Install Coolify

- [ ] Open port 8000 for Coolify dashboard: `ufw allow 8000/tcp 2>/dev/null`
- [ ] Run: `curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash`
- [ ] Access Coolify at `http://<VPS-IP>:8000`
- [ ] **IMMEDIATELY** create admin account (first visitor gets admin access)
- [ ] Configure admin email for notifications
- [ ] Verify Traefik started on port 80: `ss -tlnp | grep :80` → should show Traefik

### Task 9: Connect GitHub

- [ ] In Coolify: Sources → Add → GitHub App
- [ ] Authorize on GitHub, select `jdeweedata/circletel` repository

---

## Phase 3: Deploy to Coolify

### Task 10: Create application in Coolify

- [ ] New Project → "CircleTel" → Environment "production"
- [ ] Add new Resource → Application → **Docker Image** (NOT Dockerfile — we build on GitHub Actions)
- [ ] Image: `ghcr.io/jdeweedata/circletel:latest`
- [ ] Ports Exposes: `3000`
- [ ] Copy the deploy webhook URL (Coolify → App → Webhooks) → add as `COOLIFY_DEPLOY_WEBHOOK` GitHub secret

### Task 11: Set container resource limits

In Coolify → App → Resources:

- [ ] **Memory limit**: `12288` MB (12GB) — see RAM budget below
- [ ] **Memory reservation**: `4096` MB (4GB soft floor)

**VPS 30 RAM Budget (24GB total):**

| Component | RAM |
|-----------|-----|
| CircleTel container (cap) | 12 GB |
| CuriousFoe (4 services) | ~2 GB |
| Coolify + Traefik + Docker | ~2 GB |
| OS + swap cache | ~2 GB |
| **Headroom** | **~6 GB** |

### Task 12: Configure environment variables

**Runtime-only secrets** (toggle "Build Variable" OFF — builds happen on GitHub Actions, not Coolify):

- [ ] **Option A (recommended)**: Bulk import via Coolify CLI:
  ```bash
  npm install -g @coollabsio/coolify-cli
  coolify login --token <api-token>  # Generate in Coolify → Team → API Keys
  coolify env sync --app <app-uuid> --file .env.production
  ```
- [ ] **Option B**: Manual entry in Coolify UI for all ~80+ vars
- [ ] Set `NODE_ENV=production`
- [ ] Set `CRON_SECRET` (same value as Vercel)
- [ ] Set `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`

**Note**: `NEXT_PUBLIC_*` vars are baked at build time via GitHub Actions `--build-arg`. They do NOT need to be in Coolify's env vars (but setting them as runtime vars too doesn't hurt).

### Task 13: Configure domains

- [ ] **Reduce DNS TTL to 300s** (5 min) on current records BEFORE cutover (do this 24-48hrs in advance)
- [ ] In Coolify app settings, set domains (comma-separated):
  - `https://www.circletel.co.za` (primary)
  - `https://circletel.co.za`
  - `https://studio.circletel.co.za`
- [ ] Configure bare domain → www 301 redirect. In Coolify → App → Advanced → Custom Labels, add Traefik middleware:
  ```yaml
  traefik.http.middlewares.circletel-redirect.redirectregex.regex: "^https://circletel\\.co\\.za/(.*)"
  traefik.http.middlewares.circletel-redirect.redirectregex.replacement: "https://www.circletel.co.za/$${1}"
  traefik.http.middlewares.circletel-redirect.redirectregex.permanent: "true"
  ```
- [ ] Traefik routes all domains to the same container on port 3000; Next.js middleware distinguishes `studio.circletel.co.za` by `request.headers.get('host')`
- [ ] DNS: Update A records to point to VPS IP (at domain registrar):
  - `circletel.co.za` → VPS IP
  - `www.circletel.co.za` → VPS IP
  - `studio.circletel.co.za` → VPS IP
  - `staging.circletel.co.za` → VPS IP
- [ ] SSL: Automatic via Let's Encrypt (Coolify/Traefik handles this)
- [ ] Test: Verify SSL certificate provisioned after DNS propagation

### Task 14: Configure Inngest

Inngest Cloud continues to work — same domain, now pointing to VPS:

- [ ] In Inngest Cloud dashboard: verify webhook URL `https://www.circletel.co.za/api/inngest` (unchanged — DNS now routes to VPS)
- [ ] Verify `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` are set in Coolify env vars
- [ ] Test: trigger a test event and verify it's received

### Task 15: Install cron jobs on VPS

- [ ] Create `/root/.cron-env` with `CRON_SECRET` and `APP_URL` (chmod 600)
- [ ] Create `/var/log/circletel-cron.log` (touch + chmod 644)
- [ ] Install crontab from `scripts/install-crontab.sh`
- [ ] Verify: `crontab -l` shows all 21 entries with `>> /var/log/circletel-cron.log 2>&1`
- [ ] Test one endpoint: `. /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/integrations-health-check`
- [ ] Add logrotate for `/var/log/circletel-cron.log` (weekly, 4 rotations)

### Task 16: Deploy and verify

- [ ] Push code to `main` → GitHub Actions builds and pushes to GHCR → Coolify pulls image
- [ ] Monitor: GitHub Actions build log (should complete in ~8-12 min on free runner)
- [ ] Monitor: Coolify deployment log (should be fast — just pulling image + starting container)
- [ ] Verify app loads at `https://www.circletel.co.za`
- [ ] Test critical flows:
  - Homepage loads
  - Coverage check works (Google Maps API)
  - Package selection works
  - Auth login/logout (Supabase)
  - Admin panel loads (`/admin`)
  - Dashboard loads (`/dashboard`)
  - Partner portal loads (`/partner`)
  - Payment flow (test mode)
  - Webhook endpoints respond (Netcash, Interstellio, etc.)
  - Subdomain routing: `studio.circletel.co.za` → CMS
  - Bare domain redirect: `circletel.co.za` → `www.circletel.co.za`

### Task 17: Set up monitoring

- [ ] Add UptimeRobot (free tier, 5-minute checks) monitoring:
  - `https://www.circletel.co.za/api/health` — primary health check
  - `https://www.circletel.co.za` — homepage availability
- [ ] Configure alerts (email + SMS/WhatsApp)
- [ ] Add nightly cron log check: verify `/var/log/circletel-cron.log` has recent entries

---

## Phase 4: Staging Environment

### Task 18: Create staging in Coolify

- [ ] In CircleTel project → Add environment "staging"
- [ ] Deploy from `ghcr.io/jdeweedata/circletel:staging` tag (add staging workflow or manual trigger)
- [ ] Domain: `https://staging.circletel.co.za`
- [ ] Separate env vars (staging Supabase URL, test payment keys, etc.)

---

## Phase 5: Migrate CuriousFoe into Coolify

> **When**: After CircleTel is stable on Coolify for 48+ hours. Not blocking CircleTel deployment.

### Task 19: Containerize CuriousFoe Services

**Why**: Running dual service management (systemd + Coolify/Docker) is fragile and hard to maintain. All services should be under Coolify.

- [ ] Create `Dockerfile` in `/home/curiousfoe/` for all 4 services (or 1 per service if they have different deps)
- [ ] Create Coolify project "CuriousFoe" with 4 apps:
  - `orchestrator` — no exposed port
  - `dashboard` — exposed on port 8080, domain: `curiousfoe.<your-domain>` (Traefik handles SSL)
  - `gateway` — no exposed port (Telegram API outbound only)
  - `filewatcher` — no exposed port, mount `/home/curiousfoe/app/uploads` as volume
- [ ] Test each service in Coolify
- [ ] Disable systemd services:
  ```bash
  systemctl stop curiousfoe-orchestrator curiousfoe-dashboard curiousfoe-gateway curiousfoe-filewatcher
  systemctl disable curiousfoe-orchestrator curiousfoe-dashboard curiousfoe-gateway curiousfoe-filewatcher
  ```
- [ ] Verify: `systemctl list-units curiousfoe-*` shows all disabled

### Task 20: Recreate nginx Static Sites in Coolify (Optional)

- [ ] EntSphere static site (was on :8081 via nginx): Add as Coolify static site if still needed
- [ ] Design Architect dashboard (was at `/dashboard` via nginx): Add as Coolify static site if still needed
- [ ] If neither is needed, skip this task

---

## Phase 6: Decommission Vercel

### Task 21: Cut over

- [ ] Verify all cron jobs running (check `/var/log/circletel-cron.log` for 24 hours)
- [ ] Verify Inngest functions executing
- [ ] Verify webhooks from external services (Netcash, Interstellio, Clickatell, Didit, Zoho Sign)
- [ ] Monitor error rates for 48 hours
- [ ] Update Vercel deployment to "Disabled" (don't delete yet — keep as rollback)
- [ ] After 1 week stable: cancel Vercel Pro subscription

---

## Environment Variable Checklist

Full list from `.env.example` — categorized by service:

| Category | Count | Key Variables | Where |
|----------|-------|---------------|-------|
| Supabase | ~5 | URL, anon key, service role, DB password | GitHub Secrets (public) + Coolify (all) |
| Zoho (CRM+Books+Sign) | ~15 | Client ID/secret, refresh token, org ID | Coolify only (runtime) |
| Netcash | ~8 | Service key, PCI vault, webhook secret | GitHub Secrets (public) + Coolify (all) |
| Email (Resend) | ~6 | API key, team email addresses | Coolify only (runtime) |
| SMS (Clickatell) | ~3 | API key, API ID, base URL | Coolify only (runtime) |
| Google | ~4 | Maps API key, OAuth client ID/secret | GitHub Secrets (public) + Coolify (all) |
| Inngest | ~2 | Event key, signing key | Coolify only (runtime) |
| Compliance (Didit/ICASA) | ~6 | API keys, secrets, webhook secrets | GitHub Secrets (public) + Coolify (all) |
| Interstellio | ~4 | API token, tenant ID, domain | Coolify only (runtime) |
| Tarana | ~2 | Username, password | Coolify only (runtime) |
| Ruijie | ~4 | App ID, secret, base URL, mock mode | Coolify only (runtime) |
| Billing config | ~8 | VAT rate, payment terms, account prefix | Coolify only (runtime) |
| Feature flags | ~5 | B2B workflow, AI content, sales alerts | Coolify only (runtime) |
| Cron/Webhooks | ~2 | CRON_SECRET, WEBHOOK_MASTER_SECRET | Coolify only (runtime) |
| App config | ~5 | APP_URL, BASE_URL, NODE_ENV | GitHub Secrets (public) + Coolify (all) |
| **Total** | **~80+** | | **9 in GitHub Secrets, ~80+ in Coolify** |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| nginx port 80 conflict | Coolify/Traefik fails to start | Phase 0f: stop + disable nginx before Coolify install |
| VPS 20 RAM insufficient | Docker + Coolify + CircleTel OOM | Phase 0d: upgrade to VPS 30 (24GB) first |
| Live Migration data loss | All services down | Contabo snapshot before migration; CuriousFoe can recover |
| CuriousFoe downtime during nginx→Traefik switch | Dashboard inaccessible (~30 min) | Dashboard is localhost-only (:8080), unaffected. Only :8081 EntSphere goes down |
| GitHub Actions build OOM | Build fails (7GB runner) | GHA free runners have 7GB — tight but should work; can upgrade to larger runner if needed |
| DNS propagation delay | Downtime during cutover | Lower TTL to 300s 24-48hrs before switching |
| Webhook URLs change | Missed payments, sync failures | Same domain — webhooks route to same URL |
| No CDN/edge caching | Slower for non-SA users | Add Cloudflare free tier in front |
| VPS goes down | Full outage | Contabo snapshots + UptimeRobot alerts |
| Container memory leak | OOM-kills Coolify | 16GB container memory cap protects host |
| `NEXT_PUBLIC_*` vars not baked | Client-side features break | `ARG`/`ENV` injection in Dockerfile + GitHub Actions build-args |
| Cron jobs fail silently | Missed invoices, stale data | Log to file + nightly check + UptimeRobot |
| Cold start too slow | Healthcheck restart loop | `--start-period=120s --retries=5` in Dockerfile |

---

## Verification Checklist

**Phase 0 (VPS Prep):**
- [ ] Ad-hoc processes killed and ports blocked (:8899, :3456)
- [ ] VPS 30 confirmed: `free -h` shows 24GB RAM
- [ ] Swap active: `swapon --show` shows 4GB
- [ ] Docker installed: `docker --version` shows 24+
- [ ] nginx stopped: `ss -tlnp | grep :80` shows nothing (or Traefik after Phase 2)
- [ ] CuriousFoe services still running after VPS upgrade

**Phase 1-3 (CircleTel Deploy):**
- [ ] GitHub Actions builds image and pushes to GHCR
- [ ] Coolify pulls image and starts container
- [ ] Homepage loads with correct content
- [ ] Auth flow works (login, logout, session persistence)
- [ ] Admin panel accessible with RBAC
- [ ] Coverage check returns results (Google Maps + provider APIs)
- [ ] Order flow completes (coverage → packages → checkout)
- [ ] Payment form loads (Netcash Pay Now)
- [ ] Cron jobs execute on schedule (check `/var/log/circletel-cron.log` after 24h)
- [ ] Inngest functions trigger and complete
- [ ] Webhook endpoints respond to test payloads
- [ ] SSL certificate valid and auto-renewing
- [ ] Staging environment accessible at staging.circletel.co.za
- [ ] PWA service worker registers and doesn't cache stale API responses
- [ ] Subdomain routing works (studio.circletel.co.za → CMS)
- [ ] Bare domain redirects (circletel.co.za → www.circletel.co.za)
- [ ] UptimeRobot monitoring active and alerting
- [ ] Health check endpoint responds at `/api/health`
- [ ] Container memory stays within 16GB limit

**Phase 5 (CuriousFoe):**
- [ ] All 4 CuriousFoe services running in Coolify containers
- [ ] CuriousFoe Dashboard accessible via Traefik domain with SSL
- [ ] Telegram Gateway health checks passing
- [ ] File Watcher detecting uploads
- [ ] systemd CuriousFoe services disabled

---

## Cost Comparison

| Item | Current Setup | Coolify + VPS 30 |
|------|--------------|------------------|
| Vercel Pro | $20/month (~EUR 18.50) | EUR 0 (replaced) |
| Build machine | Enhanced ($0.030/min) | EUR 0 (GitHub Actions free tier) |
| Bandwidth | $0.15/GB after 1TB | Included in VPS |
| VPS 20 (current) | EUR 9.45/month | EUR 0 (upgraded) |
| VPS 30 (upgrade) | N/A | EUR 18.70/month |
| **Total** | **~EUR 28/month** | **EUR 18.70/month** |

**Savings: ~EUR 9.30/month** — and you get: CircleTel production + CuriousFoe (4 services) + all 18 projects under one dashboard, 24GB RAM, no per-seat pricing, no bandwidth charges, no function invocation costs, full control.

**Key insight**: You're currently paying EUR 9.45 (VPS 20) + EUR 18.50 (Vercel Pro) = EUR 28/month. The VPS 30 at EUR 18.70 replaces **both**.

---

## Implementation Order

| Step | Task | Files/Config | Risk |
|------|------|-------------|------|
| **Phase 0: VPS Preparation** | | | |
| 0a | Kill ad-hoc processes (:8899, :3456) | VPS | Low |
| 0b | Cleanup — free RAM (PM2, dev server, Chrome) | VPS | Low |
| 0c | Backup nginx config | VPS | Low |
| 0d | Upgrade VPS 20 → VPS 30 (Live Migration) | Contabo | **Medium** (downtime) |
| 0e | Add swap + install Docker | VPS | Low |
| 0f | Stop + disable nginx (frees port 80) | VPS | Low |
| **Phase 1: Codebase Changes** | | | |
| 1 | Add `output: 'standalone'` | `next.config.js` | Low |
| 2 | Create Dockerfile + .dockerignore (Alpine fixes) | 2 new files | Medium |
| 3 | Create GitHub Actions CI/CD workflow | `.github/workflows/deploy.yml` | Medium |
| 4 | Add `/api/health` endpoint | 1 new file | Low |
| 5 | Create nixpacks.toml (fallback) | 1 new file | Low |
| 6 | Handle Vercel-specific code | `app/layout.tsx`, utils | Low |
| 7 | Create cron scripts (HTTPS + logging) | 1 new file | Low |
| **Phase 2: Install Coolify** | | | |
| 8 | Install Coolify (port 80 must be free) | VPS | Medium |
| 9 | Connect GitHub | Coolify UI | Low |
| **Phase 3: Deploy CircleTel** | | | |
| 10 | Create app in Coolify (Docker Image from GHCR) | Coolify UI | Low |
| 11 | Set container memory limits (16GB cap) | Coolify UI | Low |
| 12 | Configure env vars (bulk import via CLI) | Coolify UI/CLI | Medium |
| 13 | Configure domains + DNS + bare→www redirect | DNS + Coolify + Traefik | Medium |
| 14 | Configure Inngest | Inngest Cloud | Low |
| 15 | Install cron jobs (HTTPS, sourced env, logged) | VPS crontab | Low |
| 16 | Deploy + verify | All | **High** (first deploy) |
| 17 | Set up UptimeRobot monitoring | External | Low |
| **Phase 4: Staging** | | | |
| 18 | Staging environment | Coolify UI | Low |
| **Phase 5: CuriousFoe Migration** | | | |
| 19 | Containerize CuriousFoe → Coolify | Dockerfiles + Coolify UI | Medium |
| 20 | Recreate nginx static sites (optional) | Coolify UI | Low |
| **Phase 6: Decommission** | | | |
| 21 | Decommission Vercel | Vercel dashboard | Low |

**Phase 0: VPS prep (6 steps, manual on VPS)**
**Phase 1: Code changes (Tasks 1-7, ~10 files)**
**Phase 2-6: Infrastructure (Tasks 8-21, VPS + Coolify UI + DNS + GitHub Secrets)**
