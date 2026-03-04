# CLAUDE.md

Guidance for Claude Code when working with CircleTel codebase.

## Quick Reference

| Need | Section | Key Command |
|------|---------|-------------|
| Start session | [Getting Started](#getting-started) | `powershell -File .claude/skills/context-manager/run-context-analyzer.ps1` |
| Run dev server | [Essential Commands](#essential-commands) | `npm run dev:memory` |
| Type check | [Essential Commands](#essential-commands) | `npm run type-check:memory` |
| Deploy | [Deployment](#deployment) | `git push origin feature/xyz:staging` |
| Auth patterns | [Rules](#rules) | See `.claude/rules/auth-patterns.md` |
| Database schema | [Database](#database-schema) | `customer_invoices` (not `invoices`) |
| File placement | [Rules](#rules) | See `.claude/rules/file-organization.md` |
| Skills | [Superpowers](#superpowers-skills) | `/skill superpowers:brainstorming` |

---

## ⚠️ ANTI-SLOP RULES — NON-NEGOTIABLE

```
NEVER write placeholder code, stub functions, or TODO items
NEVER invent file paths, function names, or variable names — check first
NEVER make changes outside the scope of the current task
NEVER claim a task is complete without running /skill superpowers:verification-before-completion
ALWAYS invoke the relevant superpowers skill before writing code
ALWAYS ask before modifying more than 3 files at once
```

---

## ⚠️ MANDATORY Rules (1 sentence each)

1. **Think first** — Read ALL relevant files and build a step-by-step plan before coding.
2. **Explain before implementing** — Describe your approach and wait for confirmation.
3. **Keep it simple** — Only touch files that absolutely need changing.
4. **Never be lazy** — Provide complete, production-ready solutions every time.
5. **No temporary fixes** — Address root causes, not symptoms.
6. **No hallucinations** — Verify files/functions exist before referencing them.
7. **Minimize blast radius** — Isolate changes to prevent breaking existing features.
8. **Be thorough but concise** — Follow existing code patterns in the project.
9. **Confirm understanding** — Ask questions when requirements are unclear.
10. **Know the system** — Read `docs/architecture/SYSTEM_OVERVIEW.md` first.
11. **Respect file placement** — See `.claude/rules/file-organization.md`.

**Remember: Think first, explain second, code third.**

---

## ⚠️ CRITICAL: Context Management

```powershell
powershell -File .claude/skills/context-manager/run-context-analyzer.ps1
```
**Budget Zones**: 🟢 Green (<70%) | 🟡 Yellow (70-85%) | 🔴 Red (>85%)

---

## Project Overview

**CircleTel** — B2B/B2C ISP platform for South Africa
**Stack**: Next.js 15, TypeScript, Supabase (`agyjovdugmtopasyvlng`), Tailwind, NetCash Pay Now
**Production**: https://www.circletel.co.za | **Staging**: https://circletel-staging.vercel.app

---

## Essential Commands

```bash
npm run dev:memory          # Dev server (8GB heap)
npm run type-check:memory   # Type check (4GB heap) — MANDATORY before commit
npm run build:memory        # Production build (8GB heap)
```

---

## Deployment

**2-Branch Strategy**: Feature → Staging → Main

```bash
git push origin feature/xyz:staging    # Test in staging first
gh pr create --base main               # Then merge via PR
```

**Pre-Deploy**: ✅ Type check ✅ Build ✅ Staging tests ✅ DB migrations ✅ ENV vars

---

## Rules

All detailed patterns are in `.claude/rules/`:

| Rule File | Scope |
|-----------|-------|
| `coding-standards.md` | TypeScript, Next.js 15, Supabase, Inngest, debugging |
| `file-organization.md` | File placement, docs structure, naming conventions |
| `anti-patterns.md` | NEVERs, hallucination prevention, scope discipline |
| `auth-patterns.md` | Three-context auth, header+cookie checks, RBAC |
| `workflow.md` | Planning protocol, blast radius, confirmation gates |
| `verify-schema-first.md` | Check DB schema before coding |
| `type-guards-optionals.md` | Safe access to optional/nested properties |
| `api-param-documentation.md` | Document API params with Wrong vs Correct tables |

---

## Architecture Overview

- **Coverage**: 4-layer fallback (MTN WMS → MTN Consumer → Provider APIs → Mock)
- **Orders**: 3-stage flow (Coverage → Package → Account) via Zustand store
- **Payments**: NetCash Pay Now (20+ methods) — See `components/checkout/InlinePaymentForm.tsx`
- **B2B KYC**: 7-stage workflow — See `docs/architecture/ADMIN_SUPABASE_ZOHO_INTEGRATION.md`

Full docs: `docs/architecture/SYSTEM_OVERVIEW.md`

---

## Database Schema

**⚠️ CRITICAL**: Use `customer_invoices` (NOT `invoices`) for billing queries.

| Category | Tables |
|----------|--------|
| Core | `service_packages`, `coverage_leads`, `customers`, `consumer_orders`, `admin_users` |
| B2B | `business_quotes`, `kyc_sessions`, `contracts` (CT-YYYY-NNN), `rica_submissions` |
| Billing | `customer_invoices`, `customer_payment_methods` |
| Partners | `partners` (CTPL-YYYY-NNN), `partner_compliance_documents` |

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://agyjovdugmtopasyvlng.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
SUPABASE_SERVICE_ROLE_KEY=<key>
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<key>
NETCASH_SERVICE_KEY=<key>
RESEND_API_KEY=<key>  # Use: billing@notify.circletel.co.za
```

See `.env.example` for complete list.

---

## Superpowers Skills

**⚠️ CRITICAL: Invoke via `Skill` tool when trigger keywords appear.**

| Skill | Trigger | When to Use |
|-------|---------|-------------|
| `superpowers:brainstorming` 🧠 | "create", "build", "add feature" | BEFORE any creative work |
| `superpowers:systematic-debugging` 🐛 | "bug", "error", "not working" | When encountering ANY bug |
| `superpowers:test-driven-development` 🧪 | "implement", "feature" | BEFORE writing implementation |
| `superpowers:writing-plans` 📝 | "spec", "requirements" | Multi-step task planning |
| `superpowers:executing-plans` ⚡ | "execute plan" | Implementing a written plan |
| `superpowers:verification-before-completion` ✅ | "done", "complete" | BEFORE claiming work is done |
| `superpowers:requesting-code-review` 🔍 | "review" | After completing features |
| `superpowers:dispatching-parallel-agents` 🚀 | 2+ independent tasks | Tasks with no shared state |
| `superpowers:finishing-a-development-branch` 🏁 | "ready to merge" | Implementation complete |

**Rule**: If even 1% chance a skill applies, invoke it.

---

## Getting Started

```bash
# 1. Run context analysis (MANDATORY)
powershell -File .claude/skills/context-manager/run-context-analyzer.ps1

# 2. Start dev server
npm run dev:memory

# 3. Type check
npm run type-check:memory
```

**Full workflow**: See `.claude/README.md`

---

## Additional Resources

| Resource | Location |
|----------|----------|
| MCP Code Execution Tools | `.claude/tools/README.md` |
| Business OS (hooks, commands, skills) | `.claude/README.md` |
| Changelog | `docs/CHANGELOG.md` |
| System Architecture | `docs/architecture/SYSTEM_OVERVIEW.md` |

---

**Version**: 7.0 | **Updated**: 2026-03-03 | **Lines**: ~140
