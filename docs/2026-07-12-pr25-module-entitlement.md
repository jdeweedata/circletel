# PR2.5 — Module entitlement (the whitelabel sell-switch)

**Date:** 2026-07-12
**Target repo:** https://github.com/jdeweedata/circletel (branch off `origin/staging` @ `1053bb7f`)
**Parent:** [porting-plan §3 PR2.5](./2026-07-11-role-scoped-admin-porting-plan.md) ·
[catalog §3](./2026-07-11-modular-product-catalog.md) · builds on [PR5](./2026-07-12-pr5-server-route-guards.md)
**Verified against:** the live `staging` ref (post-PR5). All file shapes below are real.

---

## 0. What exists / what's missing (evidenced)

| Piece | State on staging |
|---|---|
| `getWorkspaceNav({role, modules})` | ✅ already module-aware (PR1 `a980da83`, tested) — but nothing passes `modules` |
| `ITEM_MODULE` (item → ModuleId, 34 items) | ✅ in `lib/admin/feature-registry.ts` |
| `lib/tenant/` (`getTenantConfig`, defaults, env overrides, 3 tests) | ✅ exists — **but `TenantConfig` = `{branding, contacts}` only. No `modules` field.** |
| Server enforcement point | ✅ PR5's `canAccessAdminPath` in `middleware/admin-auth.ts` — workspace-only today |

So PR2.5 = add the `modules` axis to tenant config, then thread it into the two consumers that
already exist: the Sidebar (nav hiding) and the middleware guard (route rejection). Per the
porting plan: *"disabling a module hides its sections and rejects its routes; CircleTel unchanged."*

**No-op guarantee for CircleTel:** defaults enable all 15 modules; no env var set → behaviour
byte-identical.

---

## 1. Design decisions

1. **`ModuleId` stays in `feature-registry.ts`; consumers use `import type`** — type-only imports
   are erased at compile, so tenant config and the edge middleware can share the type without
   dragging the icon-laden registry into the edge bundle.
2. **The canonical runtime module list lives in `lib/admin/workspace-access.ts`** (the pure,
   edge-safe module): `ALL_MODULES` built from a `Record<ModuleId, true>` table — the compiler
   errors if the registry's union gains/loses a member and the table isn't updated. `isModuleId()`
   guards env parsing.
3. **`'core'` can never be disabled.** Env parsing force-includes it. Dashboard (`/admin/dashboard`,
   the PR5 deny-landing), Users, Settings, Notifications are `core` — disabling it would brick the
   admin and re-open a redirect loop.
4. **One deny path.** A module-denied route uses PR5's existing redirect
   (`/admin/dashboard?denied=<workspace>`); no separate `denied=module:` branch. ponytail: add the
   distinction only if a tenant support case ever needs it.
5. **Fail-open for unmapped routes unchanged** (PR5 §2); parity tests extended to lock
   route-prefix → module against `ITEM_MODULE`.

---

## 2. Changes (6 files modified, 0 new source files)

### `lib/admin/workspace-access.ts`
- `import type { ModuleId } from '@/lib/admin/feature-registry';` (erased — stays edge-safe).
- `MODULE_IDS: Record<ModuleId, true>` → `ALL_MODULES`, `isModuleId()`.
- Every `ADMIN_WORKSPACE_ROUTES` row gains `module: ModuleId` (derived from `ITEM_MODULE` via each
  prefix's owning item — parity-tested, see §4). Notables: `/admin/finance/*` → `billing`
  ("Billing & Revenue" children), `/admin/b2b/*` → `crm` ("B2B Customers" children),
  `/admin/sales/feasibility` → `coverage` ("B2B Feasibility"), `/admin/workflow` → `compliance`
  ("Approvals"), `/admin/zoho` → `integrations`, `/admin/support` → `crm`.
- `moduleForPathname(pathname)` — same longest-prefix matcher; executive special case → `'core'`.
- `canAccessAdminPath(role, pathname, modules?)` — role check as before **and**
  `modules.includes(moduleForPathname(path))` when `modules` is passed. Omitted `modules` = all on.

### `lib/tenant/types.ts`

```ts
import type { ModuleId } from '@/lib/admin/feature-registry';
export interface TenantConfig {
  branding: TenantBranding;
  contacts: TenantContacts;
  /** Sellable modules enabled for this tenant. 'core' is always present. */
  modules: ModuleId[];
}
```

### `lib/tenant/defaults.ts`
`modules: ALL_MODULES` (import from workspace-access — pure). CircleTel = everything on.

### `lib/tenant/config.ts`

```ts
modules: parseModules(process.env.NEXT_PUBLIC_TENANT_MODULES) ?? d.modules,
```

`parseModules`: comma-split, trim, keep `isModuleId` hits (warn + drop unknowns), force-include
`'core'`, return null for unset/blank (→ defaults).

### `middleware/admin-auth.ts`

```ts
import { getTenantConfig } from '@/lib/tenant';
// in the PR5 guard:
if (!canAccessAdminPath(role, pathname, getTenantConfig().modules)) { ...same redirect... }
```

(`lib/tenant` is pure data + type-only imports → edge-safe.)

### `components/admin/layout/Sidebar.tsx`

```ts
const workspaces = getWorkspaceNav({ role, modules: getTenantConfig().modules });
```

---

## 3. Env contract (per-tenant deployment)

`NEXT_PUBLIC_TENANT_MODULES="billing,crm,orders,coverage"` — comma-separated ModuleIds.
Unset → all modules (CircleTel). Unknown ids dropped with a console warning. `core` always added.
NEXT_PUBLIC_ = baked at build per tenant instance (matches the existing tenant-config model).

---

## 4. Tests

- **`__tests__/lib/tenant/config.test.ts`** (extend): defaults contain all modules incl. `core`;
  env override parses; unknown ids dropped; `core` force-included; blank env → defaults.
- **`__tests__/lib/admin/workspace-access.test.ts`** (extend): with `modules` lacking `billing`,
  `/admin/billing` is denied **even for super_admin**; `core` routes (`/admin/dashboard`,
  `/admin/settings`) allowed whenever `core` present; omitted `modules` → unchanged behaviour;
  unmapped routes still fail open.
- **`__tests__/lib/admin/workspace-access.parity.test.ts`** (extend): for every nav href, the
  route table's `moduleForPathname(href)` === `ITEM_MODULE[owning item]`. Locks the third axis the
  same way the workspace axis is locked.

---

## 5. Acceptance

- All existing tests still green (24) + new module tests; type-check error set identical to parent;
  build ✓.
- **Staging (CircleTel, no env var): zero behaviour change** — same nav, same guard outcomes as PR5
  verification (spot-check the PR5 matrix rows).
- **Entitlement demo (unit-level):** the `getWorkspaceNav({modules:['core']})` test from PR1 plus
  the new `canAccessAdminPath` module tests prove hide + reject. A live env-var demo requires a
  rebuild with `NEXT_PUBLIC_TENANT_MODULES` set — optional; do NOT set it on the shared staging
  deploy (it would disable modules for real staging users).

---

## 6. Out of scope

- API-route module gating (same follow-up axis as PR5's `requirePermission` audit).
- Module-aware marketing/site surfaces (tenant checkout, portal) — later phases.
- DB-driven entitlements (env-var is the instance-per-tenant model today; a `tenant_modules` table
  arrives with multi-tenant-per-instance, if ever).
