# Proven Patterns — CircleTel

> Long-term memory: Patterns that work in this codebase. Follow these instead of reinventing.

---

## Dev Environment
- Always use memory-allocated commands: `npm run dev:memory` (8GB), `npm run type-check:memory` (4GB), `npm run build:memory` (8GB). Standard `npm run dev` will OOM.
- Type-check before every commit — non-negotiable.
- Context analyzer first: Run `powershell -File .claude/skills/context-manager/run-context-analyzer.ps1` at session start.

## Database Patterns
- Table name: `customer_invoices` (NEVER `invoices`)
- Contract IDs: Format `CT-YYYY-NNN`
- Partner IDs: Format `CTPL-YYYY-NNN`
- Always verify schema before coding: See `.claude/rules/verify-schema-first.md`
- Supabase client: Single instance via context provider.

## Auth Patterns
- Three-context auth: header + cookie checks + RBAC
- 100+ granular permissions across 14 admin modules
- 17 pre-defined role templates
- Full details: `.claude/rules/auth-patterns.md`
- **Consumer dashboard API auth**: MUST check `Authorization: Bearer` header first, then fall back to cookies. Reference: `/api/dashboard/services/route.ts`. Using bare `createClientWithSession()` only works for cookie-based auth and will 401 when the client sends Bearer tokens.
- **Auth pattern for new consumer API routes**:
  ```
  1. Extract token from Authorization header
  2. If token → createSupabaseClient() + getUser(token)
  3. Else → createClientWithSession() + getUser() (cookie fallback)
  ```

## Component Patterns
- Admin shared components: `StatusBadge`, `StatCard`, `SectionCard` — see `.claude/rules/admin-shared-components.md`
- Product pages: CRO-optimized using `ProductHowItWorks.tsx`, `WhyCircleTel.tsx`
- Checkout: `components/checkout/InlinePaymentForm.tsx` for NetCash Pay Now
- Coverage: 4-layer fallback (MTN WMS → MTN Consumer → Provider APIs → Mock)

## Orders Pattern
- 3-stage flow: Coverage → Package → Account
- State managed via Zustand store

## File Placement
- Follow `.claude/rules/file-organization.md` strictly
- Root cleanup requires a **two-pass scan**: first pass audits, then after bulk moves, re-scan to catch stragglers
- Before moving any file, grep for hardcoded references: `grep -r "filename" . --include="*.py" --include="*.ts" -l`
- Any `*-[hash].json` in the root is almost certainly a service account key — check `git check-ignore -v <file>` immediately
- Admin components: `components/admin/`
- UI primitives: `components/ui/` (shadcn)
- API routes: `app/api/`
- Public pages: `app/(public)/`

## CI / Self-Hosted Runner Patterns
- **Heap ceiling**: `--max-old-space-size=12288` (12GB) for production builds via deploy.yml. Self-hosted runner has 24GB total.
- **rsync must have a timeout guard**: `timeout 120 rsync ... || echo "Cache save timed out — skipping"`. rsync stalls indefinitely under memory pressure.
- **`timeout-minutes: 40`** on the build job — 18-min build + Docker + buffer. Never set below 30.
- **Hang diagnosis**: Step timestamps via `gh api repos/jdeweedata/circletel/actions/runs/<RUN_ID>/jobs` reveal the true hang point. The step GitHub shows "in_progress" is often not the stuck one — look for a step where `started_at` exists but `completed_at` is null long after the previous step ended.
- **Flaky failures are memory-pressure failures**: Same workflow can succeed or hang depending on VPS memory state at build time. If a build unexpectedly hangs, check `free -h` on the runner before re-running.
- **Pre-build zombie cleanup**: deploy.yml kills orphan `next dev` processes running in `user.slice` (outside Docker) before building. Prevents them from competing for RAM.
- **Container memory cap**: Coolify container limited to `mem_limit: 4096m` / `mem_reservation: 2048m`. Prevents the running app from starving the build.
- **Never hardcode Coolify container names**: Coolify regenerates the numeric suffix on every recreate. Use `docker ps --filter "label=coolify.name=<app-id>"` for dynamic resolution.
- **paths-ignore in deploy.yml**: Skips builds for docs, .claude, designs, memory-os, agent-os, openspec, scripts — prevents unnecessary builds that consume VPS resources.

## Deployment Pattern
- Feature → Staging → Main (2-branch)
- `git push origin feature/xyz:staging` to test
- `gh pr create --base main` to ship
- Pre-deploy checklist: Type check → Build → Staging tests → DB migrations → ENV vars

## Pencil CLI (Design File Generation)
- Installed globally: `npm install -g @pencil.dev/cli`
- Authenticated as jeffrey@entrsphere.com; CLI key in `.env.local` as `PENCIL_CLI_KEY`
- Design files go in `designs/` subdirectory — never project root
- Run pattern: `set -a && source .env.local && set +a && pencil --out designs/filename.pen --prompt "..."`
- Export to PNG: `pencil --in designs/filename.pen --export designs/filename.png`
- Default model: `claude-opus-4-6`

---

> **Rule**: When you discover a new pattern that works, add it here. When a pattern breaks, move it to mistakes.md with explanation.
