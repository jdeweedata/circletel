# AGENTS.md

This file gives AI coding agents project-specific guidance for working in this repository. It follows the public `agents.md` convention and applies to the whole `/home/circletel` tree unless a more specific `AGENTS.md` exists in a subdirectory.

## Project Overview

CircleTel is a South African ISP and managed services platform.

- Stack: Next.js 15 App Router, React 18, TypeScript, Tailwind CSS, shadcn/ui, Supabase/PostgreSQL, PostGIS, Zustand, TanStack Query.
- Key integrations: MTN coverage APIs, Google Maps, Netcash payments, Zoho, Resend, Strapi CMS.
- Production site: `https://www.circletel.co.za`.
- Canonical agent guidance: read `CLAUDE.md` before significant work. It contains deeper architecture notes, workflow rules, and project-specific gotchas.
- Design system guidance: read `DESIGN.md` before UI work.

## First Files To Read

For most code changes, start with:

- `CLAUDE.md` for repository workflow and architecture.
- `docs/architecture/SYSTEM_OVERVIEW.md` for system context when the task touches architecture, auth, coverage, admin, orders, payments, or data flow.
- `.claude/rules/` for detailed local rules. Especially check `coding-standards.md`, `auth-patterns.md`, `file-organization.md`, `icon-system.md`, and `verify-schema-first.md` when relevant.
- The files you intend to edit and their immediate callers.

Do not invent file paths, APIs, table names, or component names. Search the repo first.

## Working Rules

- Keep changes surgical and scoped to the requested task.
- Preserve user work in the working tree. Do not revert unrelated changes.
- Prefer existing project patterns over new abstractions.
- Ask before touching more than three files for a single change unless the user explicitly requested a broad refactor.
- Do not add placeholder code, stub implementations, or TODOs as a substitute for completing requested behavior.
- Never hard-code secrets, API keys, production credentials, or private endpoints.
- For database-related changes, verify the current schema and existing migrations before writing code.
- For auth/admin work, follow the three-context Supabase auth patterns described in `.claude/rules/auth-patterns.md`.
- For UI changes, use existing components from `components/ui/` and project feature components before creating new primitives.
- For icons, follow `.claude/rules/icon-system.md`: use Phosphor for interface symbols, reserve Iconify for approved brand or specialist icons, and store production-critical Iconify assets locally instead of fetching them from the public API at runtime.

## Commands

Use memory-aware commands for this large project when possible:

```bash
npm run dev:memory
npm run type-check:memory
npm run build:memory
npm run build:ci
npm test
npm run test:coverage
```

Common targeted commands:

```bash
npm run type-check
npm run lint
npm run test:payment
npm run test:types
npm run test:mobile
npx playwright test
```

Scripts that need local credentials generally require `.env.local` to be loaded explicitly:

```bash
set -a && source .env.local && set +a && npx tsx scripts/my-script.ts
```

## Validation Expectations

Before reporting code changes as complete, run the narrowest useful checks and state exactly what passed.

- TypeScript-only changes: run `npm run type-check:memory` or `npm run type-check`.
- Component or UI changes: run type checking, any relevant tests, and inspect the UI in a browser when feasible.
- API, auth, payment, order, or data changes: add or run targeted tests where possible, then run type checking.
- Broad changes: run type checking plus the most relevant Jest or Playwright suites.

If a command cannot be run in the current environment, say so and explain the residual risk.

## Architecture Notes

- `app/` contains Next.js App Router routes, including public pages, admin routes, and API routes.
- `components/` contains shared and feature React components. `components/ui/` is the shadcn/ui layer.
- `lib/` contains business logic, service clients, auth, coverage, RBAC, and shared utilities.
- `middleware.ts` delegates to `middleware/` modules for subdomain routing, Supabase session handling, admin auth, and ambassador auth.
- `supabase/migrations/` contains database migrations.
- `docs/` contains implementation, architecture, product, admin, testing, and integration documentation.
- `designs/` is the correct location for Pencil design files.

## Domain Gotchas

- Coverage uses multiple fallbacks: MTN WMS, MTN Consumer, provider APIs, then mock/fallback behavior.
- Geographic logic uses South Africa-specific coordinate validation and PostGIS queries.
- MTN endpoints may require enhanced headers and retry/backoff behavior.
- Orders use a staged customer flow: coverage, package, account, checkout/payment.
- Payment work must respect Netcash Pay Now behavior and existing checkout components.
- Do not assume generic table names. For example, `customer_invoices` is the expected invoice table name in current guidance, not `invoices`.

## Git And Deployment

- Branch strategy: feature branches flow to `staging`, then to `main` by PR.
- Keep commits atomic and testable when asked to commit.
- Pre-deploy expectations: type check, build, relevant tests, migrations reviewed, environment variables checked.

## Documentation

Update documentation when behavior, setup, architecture, or operational expectations change. Prefer adding focused notes near the affected feature docs instead of creating broad duplicate docs.

## Shared Agent Memory System

This project uses a **two-tier shared memory system** so Hermes Agent and Claude Code never lose context between each other.

### How It Works
- **Global tier** (`~/.agent-memory/`): VPS-wide knowledge — tools, environment, cross-project patterns
- **Project tier** (`memory-os/`): CircleTel-specific — decisions, tasks, agent context, handoffs

### Hermes Agent Protocol (what you MUST do)

**Session start** — before any work, load the `shared-agent-memory` skill with `skill_view(name='shared-agent-memory')` and follow its protocol. This ensures you read the latest handoffs from Claude Code and never repeat documented mistakes.

**During session** — when you learn something Claude Code should know, update `memory-os/long-term/agent-context.md`.

**Session end** — write session notes, update active tasks, and if handing off work to Claude Code, write a handoff note to `memory-os/short-term/handoffs/YYYY-MM-DD-topic.md`.

### Key Files
| File | Purpose |
|------|---------|
| `memory-os/README.md` | Full protocol for both agents |
| `memory-os/long-term/agent-context.md` | What agents have learned about this codebase |
| `memory-os/short-term/handoffs/` | Agent-to-agent handoff notes |
| `~/.agent-memory/README.md` | Global memory protocol |
| `~/.agent-memory/GLOBAL_CONTEXT.md` | VPS environment overview |

### Claude Code Integration
Claude Code reads the same files via `CLAUDE.md` directives and `.claude/rules/shared-memory.md`. When it finishes work, it writes handoffs that Hermes picks up on next session start.

