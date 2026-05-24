# Mistakes & Pitfalls — Never Repeat These

> Long-term memory: Every mistake costs time. Log them here so future sessions don't repeat them.

## Format
[YYYY-MM-DD] Mistake Title
What happened: Description
Root cause: Why it happened
Fix: How it was resolved
Prevention: How to avoid this forever

---

### [2025-10-24] Queried `invoices` table instead of `customer_invoices`
**What happened**: Billing queries failed silently — returned empty results
**Root cause**: Assumed standard naming. Didn't verify schema first.
**Fix**: Changed all references to `customer_invoices`
**Prevention**: ALWAYS run verify-schema-first check before writing any DB query.

### [2025-10-24] Multiple Supabase client instances
**What happened**: Console flooded with "Multiple GoTrueClient instances" warnings
**Root cause**: Several components created their own Supabase clients
**Fix**: Planned — Roadmap item 2.4
**Prevention**: Always use the shared Supabase context provider. Never instantiate a new client in a component.

### [2025-10-24] Product table drift
**What happened**: Admin-edited products didn't reflect on customer-facing pages
**Root cause**: Two tables (`products` + `service_packages`) with no sync mechanism
**Fix**: Planned — Roadmap item 2.2
**Prevention**: Until sync is built, manually update BOTH tables when changing product data.

### [2025-10-24] OOM crashes during dev/build
**What happened**: `npm run dev` and `npm run build` crashed with out-of-memory errors
**Root cause**: Default Node.js heap too small for the codebase size
**Fix**: Use memory-allocated commands: `dev:memory`, `build:memory`, `type-check:memory`
**Prevention**: NEVER use plain `npm run dev` or `npm run build`.

### [2025-10-24] Hallucinated file paths and function names
**What happened**: Referenced functions and files that didn't exist
**Root cause**: Assumed existence without checking
**Fix**: Verified actual codebase structure
**Prevention**: NEVER invent file paths or function names. Use `code-review-graph get_symbols` to verify.

### [2025-10-24] Changes outside task scope
**What happened**: A simple fix snowballed into touching 10+ files
**Root cause**: Didn't scope the change before starting
**Fix**: Reverted extra changes, isolated the fix
**Prevention**: Karpathy Principle #3 (Surgical Changes). Ask before modifying more than 3 files. Use `get_blast_radius`.

### [2026-04-28] Google service account key unprotected in root
**What happened**: `circletel-drive-9afdd33bd927.json` sat in project root with no `.gitignore` entry — live GCP credentials would have been committed on next `git add .`
**Root cause**: File was added manually without updating `.gitignore`
**Fix**: Added `circletel-drive-*.json` pattern to `.gitignore`
**Prevention**: Any `*-[hash].json` in the root is almost certainly a service account key. Check `git check-ignore -v <file>` immediately on discovery.

### [2026-04-28] Hardcoded absolute paths in Python scripts block file reorganisation
**What happened**: `circletel-drive-9afdd33bd927.json` could not be moved to a cleaner location because 4 scripts hardcode `/home/circletel/circletel-drive-9afdd33bd927.json` as a literal string
**Root cause**: Credential path set directly instead of via env var
**Fix**: Left file in place; added to `.gitignore`
**Prevention**: Credential file paths must always be read from `os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')`, set in `.env.local`. Never hardcode.

---

### [2026-04-29] CI hang on "Save Next.js SWC cache" — rsync stalling under memory pressure
**What happened**: GitHub Actions job appeared stuck on "Build Next.js" for 25+ minutes. Root cause was actually the subsequent rsync step (`Save Next.js SWC cache`) hanging indefinitely. The build had completed but rsync stalled because the VPS was under severe memory pressure (12GB Node heap + Docker overhead pushed system into heavy swap use).
**Root cause**: rsync becomes unresponsive under swap pressure. The 12GB heap (`--max-old-space-size=12288`) was too large for this VPS — it consumed most available RAM, leaving rsync no clean memory to operate. The failure was **non-deterministic**: same code succeeded on the next run when memory conditions were better.
**Fix**: 
1. Added `timeout 120 rsync ... || echo "Cache save timed out — skipping"` to prevent indefinite hang
2. Bumped `timeout-minutes: 20 → 35` to give proper headroom for 18-minute builds
3. Prior commit already reduced heap `12288 → 8192` which cut build time from ~18min to ~13min by reducing swap thrashing
**Prevention**: 
- Any rsync/cp step after a memory-intensive build step must have a `timeout` guard
- Self-hosted runner on shared VPS = no memory isolation guarantee — treat all post-build I/O as potentially flaky
- 8GB heap is the correct ceiling for this VPS (23GB RAM shared with Coolify + curiousfoe + OS)
- Diagnosis command: check step timestamps via `gh api repos/.../actions/runs/.../jobs` — if a step has no `completed_at` long after the previous step ended, that's the real hang point (not the step GitHub UI shows as "in_progress")

---

### [2026-05-18] Hardcoded Coolify container name broke health check in deploy.yml
**What happened**: GitHub Actions run 26052825759 build succeeded, Docker image built, container deployed and healthy — but the health check step failed because it referenced container `b7ukn3c76rd46dsl19oqq59e-141223811188` which no longer existed. Coolify had regenerated the suffix to `-185027262864`.
**Root cause**: Container name was hardcoded in deploy.yml. Coolify assigns a new random numeric suffix on every `docker compose up -d --force-recreate`.
**Fix**: Replaced hardcoded name with dynamic resolution: `docker ps --filter "label=coolify.name=b7ukn3c76rd46dsl19oqq59e" --format '{{.Names}}' | head -1`
**Prevention**: NEVER hardcode Coolify container names in any script or workflow. Always use label-based lookup via `docker ps --filter "label=coolify.name=<app-id>"`.

---

### [2026-05-18] KYC API routes used cookie-only auth — 401 in production
**What happened**: `/api/dashboard/kyc/status` and `/api/dashboard/kyc/create-session` returned 401 for authenticated users. Console showed Bearer token being sent but API returning 401.
**Root cause**: Both routes used `createClientWithSession()` which only reads cookies. The dashboard client (`useCustomerAuth()`) sends auth via `Authorization: Bearer` header. The cookie-only approach silently fails because the browser fetch includes the header but the API ignores it.
**Fix**: Added header-first auth check matching the pattern from `/api/dashboard/services/route.ts` — check `Authorization` header first, fall back to cookies. Commit `de457c2a`.
**Prevention**: ALL new consumer dashboard API routes MUST check Authorization header first, then fall back to cookies. Reference pattern: `/api/dashboard/services/route.ts` lines 31-78. Never use bare `createClientWithSession()` + `getUser()` for consumer-facing APIs — it only works if cookies are present, but the dashboard client sends Bearer tokens.

---

### [2026-05-24] Facebook campaign: R1,045 spent, 30 leads, 0 conversions
**What happened**: Marlbank (Vaal) campaign ran 28 Mar–2 Apr 2026. Generated 25 conversations and 30+ Zoho tickets at R41.80/conversation. Zero conversions. Two customers asked to pay (tickets #613, #614) and were never called back.
**Root cause**: Three simultaneous failures:
1. 60% of leads got zero follow-up — Tamsyn at 50% allocation carries 64% of all tickets with no sales/support prioritisation
2. 67% of checked leads were outside SkyFibre coverage — campaign advertised a product in an area where it wasn't available
3. WhatsApp bot had a phone validation bug that rejected valid SA numbers (ticket #572)
**Fix**: 
1. Zoho priority queues: sales leads Priority 1, support tickets Priority 2
2. Lead response SLA: all leads responded to within 2 hours
3. Coverage webhook automation: auto-check address against RN database, auto-reply
4. Only advertise products in confirmed coverage areas
5. Fix WhatsApp bot phone validation (accept 071-084 ranges)
**Prevention**: NEVER launch a campaign without: (a) confirmed product availability in the target geography, (b) a dedicated person handling leads within 2 hours, (c) conversion tracking from day one. The ad is the easy part. The business behind the ad is what converts.

> **Rule**: Every correction from the user goes here immediately. This is the most important file in Memory OS.
