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
| Skills | [Superpowers Pipeline](#superpowers-pipeline-mandatory) | See mandatory pipeline stages |
| Karpathy principles | [Karpathy Foundation](#-karpathy-foundation-4-guiding-principles) | Think → Simple → Surgical → Goal-Driven |
| Memory OS           | [Memory OS](#️-memory-os) | `memory-os/long-term/`, `short-term/`, `self-improvement/` |

---

## ⚠️ ANTI-SLOP RULES — NON-NEGOTIABLE

```
NEVER write placeholder code, stub functions, or TODO items
NEVER invent file paths, function names, or variable names — check first
NEVER make changes outside the scope of the current task
NEVER claim a task is complete without running /skill superpowers:verification-before-completion
ALWAYS follow the Superpowers Pipeline (6 stages) — invoke every applicable skill gate before proceeding
ALWAYS ask before modifying more than 3 files at once
```

---

## 🧠 Karpathy Foundation (4 Guiding Principles)

> Based on Andrej Karpathy's mental models for the 4 biggest limitations holding back LLM outputs.
> These principles apply to ALL work — coding, skills, debugging, planning, and documentation.
> They reinforce your existing Mandatory Rules and Superpowers Pipeline.

### Principle 1: Think Before Coding
BEFORE writing any code, answer these silently:

What assumptions am I making? Are they verified?
What confusion exists in the requirements?
What trade-offs am I ignoring?
Have I read ALL relevant files? (not just the ones I think matter)

**Maps to**: Mandatory Rule #1 (Think first), Stage 1 Superpowers (brainstorming, systematic-debugging)

### Principle 2: Simplicity First

No bloated abstractions
No premature optimization
No over-engineering "just in case"
If the solution feels complex, it's probably wrong — simplify
Prefer 20 clear lines over 5 clever ones

**Maps to**: Mandatory Rule #3 (Keep it simple), Anti-Slop Rule (NEVER make changes outside scope)

### Principle 3: Surgical Changes

Only touch what you MUST
If the task is "change button color," don't refactor the component
Orthogonal edits only — changes should be independent and isolated
Measure blast radius BEFORE editing (use code-review-graph get_blast_radius)

**Maps to**: Mandatory Rule #7 (Minimize blast radius), `.claude/rules/anti-patterns.md`

### Principle 4: Goal-Driven Execution

Every change must have a verifiable success condition
Write the test/check FIRST, then implement
"Done" means: it works, it's tested, it's type-checked, it doesn't break other things
No "it should work" — prove it works

**Maps to**: Mandatory Rule #4 (Never be lazy), Stage 3 TDD skill, Stage 4 verification skill

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
| `contact-details.md` | Contact channels, WhatsApp/email constants, support hours |
| `file-organization.md` | File placement, docs structure, naming conventions |
| `anti-patterns.md` | NEVERs, hallucination prevention, scope discipline |
| `auth-patterns.md` | Three-context auth, header+cookie checks, RBAC |
| `workflow.md` | Planning protocol, blast radius, confirmation gates |
| `compound-learnings.md` | Learning capture triggers, RSI, pattern extraction |
| `verify-schema-first.md` | Check DB schema before coding |
| `type-guards-optionals.md` | Safe access to optional/nested properties |
| `api-param-documentation.md` | Document API params with Wrong vs Correct tables |
| `product-management.md` | Product skills triggers, suppliers, wholesale providers |
| `execution-targets.md` | 12-month milestones, MSC schedule, channel targets, capital budget |
| `undocumented-api-debugging.md` | Browser-first API inspection, cookie vs Bearer auth, Istio gateway signals |
| `product-economics.md` | Unit economics, channel comparison, COS floor, commission tiers |
| `margin-guardrails.md` | Min margins, discount approval, pricing rules, MSC-aware pricing |
| `admin-shared-components.md` | StatusBadge/StatCard/SectionCard prop interfaces — verified signatures |
| `vercel-deployment.md` | Manual deployment trigger API, monitoring, CircleTel project IDs |
| `invoice-pdf-patterns.md` | VAT calc (excl-VAT multiply), fetch/blob download, print:hidden, jsPDF patterns |

---

## Architecture Overview

- **Coverage**: 4-layer fallback (MTN WMS → MTN Consumer → Provider APIs → Mock)
- **Orders**: 3-stage flow (Coverage → Package → Account) via Zustand store
- **Payments**: NetCash Pay Now (20+ methods) — See `components/checkout/InlinePaymentForm.tsx`
- **B2B KYC**: 7-stage workflow — See `docs/architecture/ADMIN_SUPABASE_ZOHO_INTEGRATION.md`
- **Product Pages**: CRO-optimized structure — See `components/products/ProductHowItWorks.tsx`, `WhyCircleTel.tsx`

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

## Superpowers Pipeline (MANDATORY)

**Every task flows through this pipeline. Skills are gates — you MUST invoke each applicable skill via the `Skill` tool before proceeding to the next stage. Skipping a skill is a rule violation.**

### Stage 1: START — Understand & Design

| Skill | Gate |
|-------|------|
| `superpowers:brainstorming` | MUST invoke before any new feature, page, component, or creative work |
| `superpowers:systematic-debugging` | MUST invoke when encountering any bug, error, or unexpected behavior |

### Stage 2: PLAN — Break Down the Work

| Skill | Gate |
|-------|------|
| `superpowers:writing-plans` | MUST invoke for any multi-step task (2+ files or stages) |
| `superpowers:executing-plans` | MUST invoke when a written plan exists and implementation begins |

### Stage 3: IMPLEMENT — Write the Code

| Skill | Gate |
|-------|------|
| `superpowers:test-driven-development` | MUST invoke before writing any feature implementation |
| `superpowers:dispatching-parallel-agents` | MUST invoke when 2+ independent tasks can run simultaneously |
| `superpowers:subagent-driven-development` | MUST invoke when executing a plan with independent implementation steps |

### Stage 4: VERIFY — Confirm Quality

| Skill | Gate |
|-------|------|
| `superpowers:verification-before-completion` | MUST invoke before claiming ANY work is done — no exceptions |
| `superpowers:requesting-code-review` | MUST invoke after completing any feature or significant change |

### Stage 5: SHIP — Merge & Deploy

| Skill | Gate |
|-------|------|
| `superpowers:finishing-a-development-branch` | MUST invoke when implementation is complete and ready to merge |

### Stage 6: LEARN — Capture Knowledge

| Skill | Gate |
|-------|------|
| `compound:compound` | MUST invoke when: task >30min, pattern found, correction received, tricky debug |

See `.claude/rules/compound-learnings.md` for triggers and templates.

### Context-Triggered Skills (invoke when context arises)

| Skill | Context |
|-------|---------|
| `superpowers:receiving-code-review` | When PR feedback or review comments are received |
| `superpowers:using-git-worktrees` | When feature work needs isolation from main branch |
| `superpowers:writing-skills` | When creating or editing Claude Code skills |

### Product Management Skills (invoke for product work)

| Skill | Trigger |
|-------|---------|
| `product-management:product` | Product strategy questions, overview menu |
| `product-management:browse-suppliers` | Hardware from Scoop, MiRO, Nology |
| `product-management:wholesale-providers` | MTN, Echo SP, DFA, Arlan services/pricing |
| `product-management:market-fit` | Evaluating viability, margin calc, GO/NO-GO |
| `product-management:generate-docs` | Creating CPS, BRD, FSD documentation |
| `product-management:product-lifecycle` | Tracking IDEA → DRAFT → ACTIVE → ARCHIVED |

See `.claude/rules/product-management.md` for detailed triggers.

**Rule**: Never skip a gate. If unsure whether a skill applies, invoke it — the skill will tell you if it's not needed.

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

## Code Review Graph (MCP)

**Knowledge graph** of the codebase for token-efficient AI code reviews and blast-radius analysis.

```bash
code-review-graph build          # Full rebuild (after major changes)
code-review-graph update         # Incremental update (daily use)
code-review-graph status         # Show graph stats
```

- **MCP Config**: `.mcp.json` — auto-discovered by Claude Code
- **Database**: `.code-review-graph/graph.db` (SQLite, gitignored)
- **Coverage**: 2,557 files, 14,417 nodes, 120,442 edges
- **Languages**: TypeScript, TSX, JavaScript, Python

**Available MCP tools** (22 tools exposed to Claude Code):
- `get_symbols` — Functions, classes, imports in a file
- `get_blast_radius` — Impact analysis for changed files
- `search_symbols` — Semantic search across codebase
- `get_dependencies` — Upstream/downstream dependencies

See `docs/tools/CODE_REVIEW_GRAPH.md` for full setup and usage.

---

## 🗄️ Memory OS

**Purpose**: Persistent memory across Claude Code sessions. Claude wakes up smarter every session.

### Folder Structure
memory-os/
├── long-term/              # Permanent project knowledge
│   ├── decisions.md        # Architecture & business decisions with reasoning
│   ├── patterns.md         # Proven patterns specific to CircleTel
│   ├── mistakes.md         # Mistakes made + how they were fixed (never repeat)
│   └── client-context.md   # Business context, pricing logic, SA market specifics
├── short-term/             # Current session / sprint context
│   ├── active-tasks.md     # What's in progress right now
│   ├── blockers.md         # Current blockers and unknowns
│   └── session-notes.md    # Notes from this working session
└── self-improvement/       # Skill scoring and evolution
    ├── scores.md           # Output quality scores (1-10) with timestamps
    ├── feedback-log.md     # User corrections and preferences
    └── improvement-plan.md # What to do differently next time

### Memory Protocol
SESSION START:

Run context analyzer (existing): powershell -File .claude/skills/context-manager/run-context-analyzer.ps1
Read memory-os/short-term/active-tasks.md for continuity
Read memory-os/long-term/mistakes.md to avoid repeats
Check memory-os/self-improvement/feedback-log.md for recent corrections

SESSION END:

Update memory-os/short-term/session-notes.md with what was done
If a mistake was made → add to memory-os/long-term/mistakes.md
If a new pattern was discovered → add to memory-os/long-term/patterns.md
If user gave correction → add to memory-os/self-improvement/feedback-log.md
Score the session output (1-10) → append to memory-os/self-improvement/scores.md


### Integration with Existing Systems

| Existing System | Memory OS Connection |
|----------------|---------------------|
| `compound:compound` skill (Stage 6) | Learnings auto-feed into `long-term/patterns.md` and `long-term/mistakes.md` |
| `.claude/rules/compound-learnings.md` | Existing triggers still apply — Memory OS is the *storage layer* |
| Context Analyzer | Runs first, Memory OS reads second |
| Superpowers Pipeline | Memory OS wraps around the pipeline (before Stage 1, after Stage 6) |

### Self-Improvement Loop
After every significant task:

Score output quality (1-10) based on:

Did it pass type-check first try?
Was the blast radius correct?
Did user need to correct anything?
Was the approach the simplest possible?


Log score + reasoning to self-improvement/scores.md
If score < 7, add specific improvement to improvement-plan.md
Next session: read improvement-plan.md BEFORE starting work


---

## Additional Resources

| Resource | Location |
|----------|----------|
| MCP Code Execution Tools | `.claude/tools/README.md` |
| Code Review Graph | `docs/tools/CODE_REVIEW_GRAPH.md` |
| Business OS (hooks, commands, skills) | `.claude/README.md` |
| Changelog | `docs/CHANGELOG.md` |
| System Architecture | `docs/architecture/SYSTEM_OVERVIEW.md` |

---

**Version**: 9.0 | **Updated**: 2026-04-28 | **Lines**: ~305
