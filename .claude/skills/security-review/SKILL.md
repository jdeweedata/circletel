---
name: security-review
description: |
  Chief Security Officer mode for CircleTel. Runs a full security audit:
  secrets archaeology, dependency supply chain, CI/CD pipeline, OWASP Top 10,
  STRIDE threat modeling, webhook signature verification, and active verification.
  Adapted from gstack/cso for CircleTel's stack: Next.js 15, Supabase, NetCash Pay Now,
  Inngest, Coolify/VPS deployment, and SA regulatory context (POPIA, PCI DSS, RICA).
  Two modes: daily (8/10 confidence gate, zero noise) and comprehensive (2/10 bar).
triggers:
  - security audit
  - security review
  - check for vulnerabilities
  - owasp review
  - threat model
  - pentest review
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
  - Write
  - Agent
  - WebSearch
---

## User-invocable

When the user types `/security-review`, run this skill.

## Arguments

- `/security-review` — full daily audit (all phases, 8/10 confidence gate)
- `/security-review --comprehensive` — monthly deep scan (2/10 bar, surfaces more)
- `/security-review --infra` — infrastructure-only (Phases 0–6, 12–14)
- `/security-review --code` — code-only (Phases 0–1, 7, 9–11, 12–14)
- `/security-review --diff` — branch changes only (combinable with any above)
- `/security-review --owasp` — OWASP Top 10 only (Phases 0, 9, 12–14)
- `/security-review --payments` — NetCash/payment flows only (Phases 0, 1, 6, 9, 10, 12–14)
- `/security-review --scope auth` — focused audit on a specific domain

## Mode Resolution

1. No flags → ALL phases 0–14, daily mode (8/10 confidence gate)
2. `--comprehensive` → ALL phases 0–14, comprehensive mode (2/10 gate). Combinable with scope flags.
3. Scope flags are mutually exclusive. Multiple scope flags = error immediately: "Error: mutually exclusive flags. Use one scope flag or run with no flags for a full audit."
4. `--diff` combines with any scope flag. Constrains each phase to files changed on current branch vs base.
5. Phases 0, 1, 12, 13, 14 always run regardless of scope.
6. If WebSearch is unavailable, skip checks requiring it and note: "WebSearch unavailable — local-only analysis."

## Important: Use the Grep tool for all code searches

Throughout this skill, bash blocks show WHAT patterns to search — not HOW to run them. Use Claude Code's Grep tool (not raw bash grep). Do NOT use `| head` to truncate results.

---

## Instructions

### Phase 0: Architecture Mental Model + Stack Detection

Before hunting bugs, build a mental model of the codebase.

**CircleTel known stack (verify these):**

- Next.js 15, TypeScript, Tailwind, shadcn/ui
- Supabase (project: `agyjovdugmtopasyvlng`) — auth, database, RLS policies
- NetCash Pay Now — payment processing (20+ methods)
- Inngest — background jobs and event-driven workflows
- Coolify on VPS `94.72.104.81` — deployment host
- Resend — transactional email (`billing@notify.circletel.co.za`)
- Zoho CRM + Zoho Desk — CRM and support tickets

**Key trust boundaries to map:**
- Public → API routes (Next.js `app/api/`)
- Customer dashboard (RLS-protected Supabase queries)
- Admin panel (`/admin/*` — requires `admin_users` table auth)
- Partner portal (`/partners/*` — requires `partners` table auth)
- NetCash webhook receiver (must verify HMAC)
- Inngest webhook endpoint (must verify signing key)
- B2B KYC: Didit webhook, 7-stage workflow

**Mental model output (required before proceeding):**
- Architecture summary: what components exist, how they connect
- Data flow: where user input enters, where it exits, what transformations occur
- Trust boundaries: public vs authenticated vs admin vs webhook
- High-risk areas: payment handling, KYC data, admin routes, RLS bypass potential

---

### Phase 1: Attack Surface Census

Map what an attacker sees.

**Code surface — use Grep to find:**
- API routes: `app/api/` directory
- Auth-gated pages: look for middleware, `createClient()` usage
- Admin routes: `/admin/` prefix
- Partner routes: `/partners/` prefix
- Webhook handlers: files containing `webhook`, `hook`, `callback`
- File upload endpoints
- Background job triggers (Inngest event senders)

**Infrastructure surface:**
```bash
find .github/workflows -maxdepth 1 \( -name '*.yml' -o -name '*.yaml' \) 2>/dev/null | wc -l
find . -maxdepth 4 -name "Dockerfile*" -o -name "docker-compose*.yml" 2>/dev/null
ls .env .env.* .env.local .env.example 2>/dev/null
```

**Output format:**
```
ATTACK SURFACE MAP
══════════════════
CODE SURFACE
  Public endpoints:      N (unauthenticated)
  Authenticated:         N (customer dashboard)
  Admin-only:            N (/admin/* routes)
  Partner-only:          N (/partners/* routes)
  Webhook receivers:     N
  Payment endpoints:     N (NetCash-related)
  Background jobs:       N (Inngest functions)
  B2B KYC endpoints:     N

INFRASTRUCTURE SURFACE
  CI/CD workflows:       N
  Webhook receivers:     N
  Container configs:     N
  Deploy targets:        Coolify VPS 94.72.104.81
  Secret management:     [env vars | unknown]
```

---

### Phase 2: Secrets Archaeology

Scan git history for leaked credentials.

**CircleTel-specific secret prefixes to scan:**
- `NETCASH_SERVICE_KEY` / NetCash service keys (UUID format)
- `SUPABASE_SERVICE_ROLE_KEY` / `eyJ` (Supabase JWTs)
- `sk_live_` / `sk_test_` (Stripe-pattern, Resend API keys start `re_`)
- `RESEND_API_KEY`
- `ZOHO_REFRESH_TOKEN` / `ZOHO_DESK_REFRESH_TOKEN`
- `GOOGLE_MAPS_API_KEY` / `AIza`
- `DIDIT_` (KYC provider keys)

**Git history scan:**
```bash
git log -p --all -S "AKIA" --diff-filter=A -- "*.env" "*.yml" "*.json" 2>/dev/null
git log -p --all -S "eyJ" --diff-filter=A -- "*.env" "*.yml" "*.json" "*.ts" 2>/dev/null
git log -p --all -G "sk_live_|re_|NETCASH|SERVICE_ROLE" 2>/dev/null
git log -p --all -G "password|secret|token|api_key" -- "*.env" "*.yml" "*.json" 2>/dev/null
```

**.env files tracked:**
```bash
git ls-files '*.env' '.env.*' 2>/dev/null | grep -v '.example\|.sample\|.template'
grep -q "^\.env\.local$\|^\.env$" .gitignore 2>/dev/null && echo ".env.local IS gitignored" || echo "WARNING: not in .gitignore"
```

**POPIA/Regulatory note:** Any leaked credentials to Supabase (service role key) would expose all customer PII — names, addresses, ID numbers (RICA), payment data. This is a POPIA breach event. Flag these at CRITICAL severity with explicit POPIA breach note.

**Severity:** CRITICAL for any active credential pattern in git history. HIGH for `.env.local` tracked by git. MEDIUM for suspicious `.env.example` real values.

---

### Phase 3: Dependency Supply Chain

**Run available audit tools:**
```bash
npm audit --audit-level=high 2>/dev/null || echo "npm audit unavailable"
```

**Check for install scripts in production deps:**
Use Grep to find `preinstall`, `postinstall`, `install` script keys in `node_modules/*/package.json` for non-devDependencies.

**Lockfile integrity:**
```bash
git ls-files package-lock.json bun.lock yarn.lock 2>/dev/null | grep -c . || echo "WARNING: lockfile not tracked by git"
```

**Severity:** CRITICAL for known CVEs (high/critical) in direct deps used in production paths. HIGH for install scripts in prod deps / missing lockfile. MEDIUM for abandoned packages / medium CVEs.

**FP rules:** devDependency CVEs are MEDIUM max. `node-gyp`/`esbuild` install scripts expected (MEDIUM not HIGH). No-fix-available without known exploit = skip.

---

### Phase 4: CI/CD Pipeline Security

**GitHub Actions analysis — use Grep to check each workflow for:**
- Unpinned third-party actions (missing `@sha256:...` pins)
- `pull_request_target` trigger (fork PRs get write access)
- Script injection via `${{ github.event.* }}` in `run:` steps
- Secrets exposed as env vars in logs
- Missing CODEOWNERS for workflow files

**CircleTel build config check** — verify the build configuration is within expected parameters:
```bash
grep -r "max-old-space-size" vercel.json next.config.js package.json 2>/dev/null
grep -r "cpus" next.config.js 2>/dev/null
```

**Severity:** CRITICAL for `pull_request_target` + PR checkout / script injection via event body. HIGH for unpinned third-party actions / secrets in logs. MEDIUM for missing CODEOWNERS.

---

### Phase 5: Infrastructure Shadow Surface

**Coolify/VPS deployment check:**
- Are any credentials hardcoded in deployment scripts?
- Is the VPS SSH key managed securely?
- Are systemd service configs checked into git with secrets?

**Config files with prod credentials — use Grep to search for:**
- `postgres://` / `postgresql://` in committed config files
- `supabase.co` URLs with embedded keys
- Database connection strings outside `.env` files

**Severity:** CRITICAL for prod DB credentials in committed configs. HIGH for VPS credentials in git. MEDIUM for missing security headers in `next.config.js`.

---

### Phase 6: Webhook & Integration Audit

**CircleTel has multiple inbound webhooks — verify each one has signature verification:**

1. **NetCash Pay Now webhook** — should verify NetCash HMAC signature
2. **Inngest webhook** — should verify Inngest signing key
3. **Didit KYC webhook** — should verify Didit HMAC-SHA256 signature
4. **Zoho webhooks** (if any)

**Use Grep to find webhook route files, then for each one check:**
- Does the handler verify a signature before processing the payload?
- Patterns to look for: `signature`, `hmac`, `createHmac`, `timingSafeEqual`, `x-hub-signature`

**NetCash-specific checks:**
- Is `NETCASH_SERVICE_KEY` only used server-side?
- Is `p4` amount validated server-side (not trust client-submitted amount)?
- Is the PCI vault key (`m2`) only in server env vars, never exposed to client?

**Supabase-specific checks:**
- Is `SUPABASE_SERVICE_ROLE_KEY` only used in server-side API routes?
- Is the anon key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) used for client-side with proper RLS?
- Are RLS policies enforced on all tables with customer data?

**TLS verification disabled — use Grep to search for:**
- `NODE_TLS_REJECT_UNAUTHORIZED.*0`
- `verify.*false` in HTTP client configs
- `rejectUnauthorized: false`

**Severity:** CRITICAL for webhooks without signature verification (especially payment webhooks). HIGH for server-side keys exposed to client / TLS verification disabled. MEDIUM for undocumented outbound data flows.

---

### Phase 7: LLM & AI Security

Check for AI/LLM-specific vulnerabilities (CircleTel may use Claude/Gemini integrations).

**Use Grep to search for:**
- String interpolation near system prompt construction: user input flowing into AI prompts
- `dangerouslySetInnerHTML` rendering LLM output
- Hardcoded AI API keys: `sk-`, `AIza` patterns outside env vars
- `eval()`, `exec()`, `Function()` processing AI responses

**Severity:** CRITICAL for user input in system prompts / unsanitized LLM output as HTML / eval of LLM output. HIGH for hardcoded AI API keys. MEDIUM for unbounded LLM calls without cost caps.

---

### Phase 8: (Skip — gstack-specific)

Skill supply chain scanning from gstack is not applicable. Proceed to Phase 9.

---

### Phase 9: OWASP Top 10 Assessment

Use Grep for all searches, scoped to `.ts`, `.tsx`, `.js` file extensions.

#### A01: Broken Access Control

**CircleTel-specific auth pattern (three contexts):**
- Customer dashboard: Supabase session via `createClient()` from `lib/supabase/server`
- Admin panel: `admin_users` table check + session
- Partner portal: `partners` table check + session

**Check for:**
- API routes that skip auth (no `createClient()` call, no session check)
- Direct object references: `params.id` used in DB query without ownership check
- Admin routes accessible without `admin_users` check
- RLS bypass: `supabase` client using service role key where anon should be used

**Pattern to search for missing auth:**
Look for API route files that have no import from `lib/supabase/server` and no auth check.

#### A02: Cryptographic Failures

- Weak crypto: use Grep to find `MD5`, `SHA1`, `createHash('md5')`, `createHash('sha1')`
- NetCash HMAC: should use `SHA256` (check `createHmac('sha256', ...)`)
- Password hashing: Supabase handles auth — check for any custom password handling
- Sensitive data encrypted at rest: Supabase encrypts at rest by default

#### A03: Injection

- **SQL injection:** Look for template literals in Supabase queries: `.rpc(`, string concatenation in `.from(`.filter(`. Supabase client is parameterised by default — only flag raw SQL via `.rpc()` with string interpolation.
- **Command injection:** use Grep for `exec(`, `execSync(`, `spawn(`, `child_process` with user input nearby
- **Template injection:** `dangerouslySetInnerHTML`, `eval(`, `new Function(`

#### A04: Insecure Design

- Rate limits on `/api/auth/*` routes?
- Account lockout on admin login?
- Is order amount validated server-side (not trust client `total`)?
- Is coverage check result validated before allowing order placement?

#### A05: Security Misconfiguration

- CORS: check `next.config.js` for wildcard `*` origins on sensitive routes
- CSP headers: check `next.config.js` for `Content-Security-Policy`
- Debug mode / verbose error messages leaking stack traces to clients
- `NEXT_PUBLIC_*` env vars — verify none contain secrets (service role key, NetCash keys)

#### A06: Vulnerable and Outdated Components

See Phase 3. No duplicate findings.

#### A07: Identification and Authentication Failures

- Supabase session tokens: are they HttpOnly? Is `supabase.auth.getSession()` validated server-side?
- Admin JWT: is the `admin_users` check done server-side on every protected route?
- Partner auth: same check
- Token expiry: are refresh tokens properly rotated?
- MFA: is it available for admin accounts?

#### A08: Software and Data Integrity Failures

See Phase 4 (CI/CD). Additionally:
- Inngest event payloads: are they validated before processing?
- External API responses: are they schema-validated before use?

#### A09: Security Logging and Monitoring Failures

- Auth events logged? (login, logout, failed attempts)
- Authorization failures logged?
- Payment events logged? (NetCash callbacks, success/failure)
- Admin actions audit-trailed?
- KYC status changes logged?

#### A10: Server-Side Request Forgery (SSRF)

- Coverage check: does the coverage API proxy to external URLs constructed from user input?
- Webhook delivery: are outbound webhook URLs user-configurable?
- Image/file upload: does any route fetch a user-supplied URL?

---

### Phase 10: STRIDE Threat Model

For each major CircleTel component, evaluate:

```
COMPONENT: [Name]
  Spoofing:             Can an attacker impersonate a user/service/webhook sender?
  Tampering:            Can order amounts, package selections, or KYC status be modified?
  Repudiation:          Can payments or KYC steps be denied? Is there an audit trail?
  Information Disclosure: Can customer PII, payment data, or admin data leak?
  Denial of Service:    Can coverage checks, payment flows, or Inngest queues be overwhelmed?
  Elevation of Privilege: Can a customer access admin routes? Can partner access admin?
```

**Required components to model:**
1. Customer Order Flow (Coverage → Package → Checkout → NetCash)
2. Admin Panel (admin_users auth → customer management)
3. Partner Portal (partners auth → commission tracking)
4. B2B KYC Workflow (7-stage Didit integration)
5. NetCash Payment Webhook
6. Inngest Background Jobs

---

### Phase 11: Data Classification

**CircleTel handles regulated data — classify carefully:**

```
DATA CLASSIFICATION (POPIA + PCI DSS context)
═════════════════════════════════════════════
RESTRICTED (breach = POPIA notifiable incident + PCI DSS violation):
  - Customer payment data: [where stored, PCI compliance status]
  - RICA identity documents: [ID numbers, addresses — stored where?]
  - KYC biometric/identity data: [Didit data retention policy]
  - Customer credentials: [Supabase auth — hashed, not visible]

CONFIDENTIAL (breach = business damage + regulatory risk):
  - NetCash service keys + PCI vault key
  - Supabase service role key (bypasses RLS — full DB access)
  - Customer PII: names, addresses, emails, phone numbers
  - Zoho CRM data: sales pipeline, pricing, margins

INTERNAL:
  - Inngest job logs
  - System error logs (check for PII leakage into logs)
  - Admin dashboard data

PUBLIC:
  - Product pages, pricing, coverage checker (postcode only)
  - API docs, public endpoints
```

**POPIA note:** South Africa's POPIA requires breach notification within a "reasonable time." Supabase service role key leaks should be treated as POPIA incidents. RICA data (ID documents) must be stored securely and only accessible to authorised persons.

---

### Phase 12: False Positive Filtering + Active Verification

**Confidence gates:**
- Daily mode (`/security-review`): 8/10 minimum — zero noise
- Comprehensive mode (`/security-review --comprehensive`): 2/10 minimum — mark low-confidence as `TENTATIVE`

**Hard exclusions — automatically discard:**
1. DoS / resource exhaustion (EXCEPTION: payment amplification — unbounded NetCash callbacks or Inngest triggers = financial risk, not DoS)
2. Secrets on disk if encrypted and permissioned
3. Memory / CPU / file descriptor leaks
4. Input validation on non-security-critical fields without proven impact
5. GitHub Actions findings unless triggerable via untrusted input
6. Missing hardening absent concrete vulnerability (EXCEPTION: unpinned actions, missing CODEOWNERS)
7. Race conditions unless concretely exploitable
8. Outdated library vulnerabilities (handled in Phase 3)
9. Test-only files not imported by production code
10. Log spoofing (non-vulnerability)
11. SSRF where attacker only controls path, not host/protocol
12. User content in AI user-message position (NOT prompt injection)
13. Missing audit logs as sole finding (absence of logging ≠ vulnerability)
14. Insecure randomness in non-security contexts (UI IDs)
15. Git history secrets committed AND removed in same initial-setup commit

**CircleTel-specific precedents:**
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` being public is EXPECTED — it is safe with correct RLS
- `NEXT_PUBLIC_SUPABASE_URL` being public is EXPECTED
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` being public is acceptable with domain restrictions configured in GCP
- NetCash `p4` amount must be validated server-side — client-submitted amount is NOT trusted by default in CircleTel's checkout

**Active Verification:**

For each finding surviving the confidence gate:
1. **Secrets:** Verify real key format (correct length, prefix). Do NOT test against live APIs.
2. **Webhooks:** Trace handler code to confirm signature verification exists in middleware chain. Do NOT make HTTP requests.
3. **Auth bypass:** Trace the actual route handler — does it call `createClient()` and check session?
4. **RLS bypass:** Check whether the Supabase client used is anon (RLS enforced) or service role (RLS bypassed). Service role in a public route = CRITICAL.
5. **Payment amount:** Trace checkout flow — is amount taken from server-computed value or client-submitted?

Mark each:
- `VERIFIED` — confirmed via code tracing
- `UNVERIFIED` — pattern match only
- `TENTATIVE` — comprehensive mode, below 8/10

**Parallel verification:** For each candidate finding, launch an independent Agent sub-task. Give it only: file path + line number, the FP rules, and the question "Is there a real vulnerability here? Score 1-10." Discard if scored below threshold.

---

### Phase 13: Findings Report + Remediation

**Every finding must include a concrete exploit scenario — step-by-step attack path.**

**Findings table:**
```
SECURITY FINDINGS — CircleTel
══════════════════════════════
#   Sev    Conf   Status      Category         Finding                          Phase   File:Line
──  ────   ────   ──────      ────────         ───────                          ─────   ─────────
1   CRIT   9/10   VERIFIED    Secrets          Supabase service key in git      P2      .env:3
2   CRIT   9/10   VERIFIED    Webhooks         NetCash webhook no sig verify    P6      api/netcash/route.ts:12
3   HIGH   8/10   VERIFIED    Auth             Admin route missing auth check   P9-A01  app/api/admin/xyz/route.ts
```

**Finding format:**
```
## Finding N: [Title] — [File:Line]

* **Severity:** CRITICAL | HIGH | MEDIUM
* **Confidence:** N/10
* **Status:** VERIFIED | UNVERIFIED | TENTATIVE
* **Phase:** N — [Phase Name]
* **Category:** [Secrets | Auth | Webhooks | Supply Chain | CI/CD | OWASP A01-A10 | POPIA]
* **Description:** [What's wrong]
* **Exploit scenario:** [Step-by-step attack path an attacker would follow]
* **Impact:** [What an attacker gains — data, money, access]
* **Regulatory impact:** [POPIA breach? PCI DSS violation? RICA exposure?]
* **Recommendation:** [Specific fix with code example]
```

**For leaked credentials, include incident response playbook:**
1. Revoke the credential immediately
2. Rotate — generate new credential, update in Coolify environment
3. Scrub history — `git filter-repo` or BFG Repo-Cleaner
4. Force-push cleaned history
5. Audit exposure window — when committed? Was repo public?
6. Check provider audit logs for abuse
7. If Supabase service role key: assess POPIA breach notification requirement

**Remediation roadmap for top 5 findings:**

For each, present options:
- A) Fix now — specific code change + effort estimate
- B) Mitigate — workaround that reduces risk
- C) Accept risk — document why, set review date
- D) Defer — add to backlog with security label

---

### Phase 14: Save Report

```bash
mkdir -p docs/security-reports
```

Write findings to `docs/security-reports/{YYYY-MM-DD}-security-audit.json`:

```json
{
  "version": "1.0.0",
  "date": "ISO-8601-datetime",
  "mode": "daily | comprehensive",
  "scope": "full | infra | code | owasp | payments",
  "diff_mode": false,
  "phases_run": [0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14],
  "attack_surface": {
    "public_endpoints": 0,
    "authenticated_endpoints": 0,
    "admin_endpoints": 0,
    "partner_endpoints": 0,
    "webhook_receivers": 0,
    "payment_endpoints": 0,
    "background_jobs": 0
  },
  "findings": [
    {
      "id": 1,
      "severity": "CRITICAL | HIGH | MEDIUM",
      "confidence": 9,
      "status": "VERIFIED | UNVERIFIED | TENTATIVE",
      "phase": 6,
      "category": "Webhooks",
      "title": "Short title",
      "file": "app/api/...",
      "line": 42,
      "description": "...",
      "exploit_scenario": "...",
      "impact": "...",
      "regulatory_impact": "...",
      "recommendation": "...",
      "fingerprint": "sha256-of-category+file+normalized-title"
    }
  ],
  "trend": {
    "prior_report": "path or null",
    "resolved": 0,
    "persistent": 0,
    "new": 0,
    "trend": "IMPROVING | DEGRADING | STABLE"
  },
  "summary": {
    "critical": 0,
    "high": 0,
    "medium": 0,
    "total": 0,
    "filter_stats": "N candidates → M filtered → K reported"
  }
}
```

After saving, print the report path and a one-line security posture summary:

```
Report saved: docs/security-reports/{date}-security-audit.json
Posture: N CRITICAL · N HIGH · N MEDIUM | Trend: IMPROVING / DEGRADING / STABLE
```

If no findings survive the confidence gate, print:
```
✅ No findings above confidence threshold. Posture: CLEAN
```
