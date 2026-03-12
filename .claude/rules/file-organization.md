Rule: file-organization
Loaded by: CLAUDE.md
Scope: File placement, documentation structure, naming conventions

---

## Root-Level Files ONLY

Config files only: `package.json`, `tsconfig.json`, `next.config.js`, `.env*`, `tailwind.config.*`, `vercel.json`, `CLAUDE.md`, `README.md`, `.gitignore`, `.eslintrc.*`, `.prettierrc.*`

**All other files MUST go in subdirectories.**

## Source Code Structure

| Type | Location | Example |
|------|----------|---------|
| Pages | `app/[page]/page.tsx` | `app/packages/[leadId]/page.tsx` |
| API | `app/api/[endpoint]/route.ts` | `app/api/coverage/packages/route.ts` |
| Components | `components/[domain]/` | `components/admin/products/` |
| Services | `lib/[service]/` | `lib/coverage/aggregation-service.ts` |
| Migrations | `supabase/migrations/` | `supabase/migrations/20251024_*.sql` |

## Documentation Structure

**⚠️ CRITICAL: Never create documentation files in the project root!**

| Type | Location |
|------|----------|
| Architecture Docs | `docs/architecture/` |
| Feature Specs | `docs/features/YYYY-MM-DD_feature-name/` |
| Implementation Guides | `docs/implementation/` |
| Optimization Guides | `docs/guides/` |
| API Documentation | `docs/api/` |
| Claude-Specific | `.claude/docs/` |
| Agent Specs | `agent-os/specs/[spec-id]/` |

## MCP/Claude Code Tools

| Type | Location |
|------|----------|
| Executors | `.claude/tools/` |
| Skills | `.claude/skills/[skill-name]/` |
| Custom Commands | `.claude/commands/` |

## Naming Conventions

- **Components**: PascalCase (`CustomerCard.tsx`)
- **Hooks**: `use-name.ts` (`use-auth.ts`)
- **Services**: `name-service.ts` (`billing-service.ts`)
- **Documentation**: `SCREAMING_SNAKE.md` (`AUTHENTICATION_SYSTEM.md`)
- **Feature Folders**: `YYYY-MM-DD_feature-name` (`2025-11-23_cms_no_code`)

## Examples

```
✅ docs/implementation/MCP_CODE_EXECUTION_IMPLEMENTATION.md
✅ docs/guides/MCP_OPTIMIZATION_GUIDE.md
✅ .claude/docs/EXECUTOR_PATTERNS.md

❌ MCP_CODE_EXECUTION_IMPLEMENTATION.md (root folder)
❌ IMPLEMENTATION_NOTES.md (root folder)
```

## Before Creating Files

1. Check if appropriate folder exists
2. If not, create the folder first
3. Use descriptive folder names
4. Follow naming conventions above

## Monorepo Skills Discovery

Skills in nested directories are auto-discovered when editing files in that path:

| Working in... | Also loads skills from... |
|---------------|---------------------------|
| `packages/frontend/src/` | `packages/frontend/.claude/skills/` |
| `packages/backend/src/` | `packages/backend/.claude/skills/` |
| `apps/admin/` | `apps/admin/.claude/skills/` |

**Key difference from CLAUDE.md**:
- CLAUDE.md uses **ancestor loading** (walks UP the tree)
- Skills use **descendant discovery** (loads from nested paths you're working in)

This supports monorepo setups where packages have their own domain-specific skills.
