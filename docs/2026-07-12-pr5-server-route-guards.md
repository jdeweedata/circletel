# PR5 — Server-side workspace route guards

**Date:** 2026-07-12
**Scope:** Enforce B1a's role→workspace mapping in middleware so a typed URL to a
workspace the role can't enter is **rejected**, not just hidden in the nav.
**Status:** shipped to `staging` and verified. NOT on `main`, NOT in production.
**Depends on:** [B1a role-scoped workspaces](2026-07-12-b1a-role-workspace-mapping.md).

## Why

B1a scopes the **nav** by role (`getWorkspaceNav`), but that is nav-hiding only: a
`viewer` could still hand-type `/admin/billing` and the page rendered (proven live).
PR5 adds the server enforcement that makes the workspace boundary real.

## What changed

| File | Change |
|------|--------|
| `lib/admin/workspace-access.ts` | **NEW**, edge-safe. `WORKSPACE_ROLES` (mirrors `feature-registry` `WORKSPACES`), a route-prefix→workspace table, and `workspaceForPathname()` / `canAccessAdminPath()`. |
| `middleware/admin-auth.ts` | After auth, reads `admin_users.role` and redirects denied requests to `/admin/dashboard?denied=<ws>`. |
| `__tests__/lib/admin/workspace-access.test.ts` | Role × route matrix. |
| `__tests__/lib/admin/workspace-access.parity.test.ts` | Parity lock: `workspace-access` ↔ `feature-registry`. |

`feature-registry.ts` is untouched.

### Why a second, edge-safe module (not import feature-registry)

`middleware/admin-auth.ts` runs in the **edge runtime**. `feature-registry.ts` pulls
`react-icons` and a JSX component, so it is not edge-importable. `workspace-access.ts`
is kept pure (types + data + functions, no React). The two are kept in lockstep by the
**parity test**, which fails CI if either the role sets or any route mapping drifts:

1. `WORKSPACE_ROLES[ws]` must equal `WORKSPACES[].roles` for every workspace.
2. Every real nav `href` in the registry must resolve (via `workspaceForPathname`) to
   the workspace the registry assigns that item (`ITEM_WORKSPACE`).

## Route resolution

`ADMIN_WORKSPACE_ROUTES` maps URL prefixes to workspaces, matched **longest-prefix-first**
(precomputed at module load). Two rules worth noting:

- **Executive is special-cased**, not a prefix. Dashboard lives at `/admin` (and the
  post-login `/admin/dashboard`); a `/admin` prefix would swallow every admin route.
- **Longest-prefix disambiguation**, e.g. `/admin/coverage/checker` → `sales` beats
  `/admin/coverage` → `platform`; `/admin/payments/settings` → `finance` is not caught
  by `/admin/settings` → `admin`.

## Enforcement flow (middleware)

```
authenticated?  ──no──▶ existing redirect to /admin/login
      │yes
read admin_users.role  (anon+cookie client, RLS applies)
      │
  no active row ──▶ redirect /admin/login?error=unauthorized
      │
canAccessAdminPath(role, path)?
   yes ──▶ render
   no  ──▶ redirect /admin/dashboard?denied=<workspace>
```

- **No redirect loop:** the deny target `/admin/dashboard` is the Executive workspace,
  open to every admin role, so `canAccessAdminPath(anyRole, '/admin/dashboard')` is always
  true — the landing never re-denies.
- **One DB read per protected admin request** (`select role where email = … and is_active`).

## Precondition — `admin_users` RLS self-select (verified present)

The middleware reads the caller's role via the **anon+cookie** client, so RLS applies
(`/api/admin/me` uses the service role and bypasses it). A self-select policy is required
or every admin is bounced. On the shared project `agyjovdugmtopasyvlng` this **already
exists** (two equivalent policies), so no migration was applied:

```sql
-- present as "Admin users can read admin_users" and "Users can view own admin record"
create policy admin_users_self_select on public.admin_users
  for select using (auth.uid() = id);
```

## Fail-open on unmapped routes (intentional)

`canAccessAdminPath` returns `true` when a path resolves to no workspace. The sensitive
prefixes (Administration, finance, etc.) are all mapped **and parity-tested**, so fail-open
only affects routes not present in the registry. Tightening to default-deny (a catch-all
row) is a deliberate follow-up **after a full admin-route audit** — not done here to avoid
locking out unmapped-but-legitimate routes.

## Verification (live on staging, typed URLs)

One throwaway `admin_users` account, real login, role flipped per case, account deleted
after (0 leftover rows). All 14 checks passed:

| Role | `/admin/billing` | `/admin/settings` | `/admin/customers` | `/admin/dashboard` |
|------|:---:|:---:|:---:|:---:|
| viewer | redirect `denied=finance` | redirect `denied=admin` | render | render |
| editor | render | redirect `denied=admin` | — | render |
| super_admin | render | render | render | render |
| product_manager | render | render | — | render |

## Out of scope (follow-ups)

- **API-route permission coverage** — a `requirePermission` audit of `/api/admin/*`
  (route guards cover pages, not every API handler).
- **Per-item write gating** — read/enter vs. mutate within a workspace.
- **JWT `app_metadata.admin_role` claim** — removes the per-request DB read.
- **Default-deny** — catch-all row after the route audit (see fail-open above).
