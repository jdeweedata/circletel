# B1a — Role-scoped admin workspaces

**Date:** 2026-07-12
**Scope:** Resolves porting-plan Blocker **B1** — map the 7 admin workspaces onto the
existing 4 `AdminRole` values. **Data-only, no DB/auth change.**
**Status:** shipped to `staging` for testing. NOT on `main`, NOT in production.

## What changed

`lib/admin/feature-registry.ts` — the `WORKSPACES` `roles:` values. The Sidebar
(`components/admin/layout/Sidebar.tsx`, PR #613) already renders `getWorkspaceNav({role})`,
which filters on `w.roles.includes(role)`, so this is **live on deploy**: editor/viewer
see fewer workspaces the moment it ships.

Three role tiers:

| Const | Roles |
|-------|-------|
| `ELEVATED` | super_admin, product_manager |
| `OPERATIONAL` | super_admin, product_manager, editor |
| `ALL_ADMIN_ROLES` | super_admin, product_manager, editor, viewer |

## Mapping table

| Workspace | Roles | super_admin | product_manager | editor | viewer |
|-----------|-------|:-:|:-:|:-:|:-:|
| Executive | ALL | ✅ | ✅ | ✅ | ✅ |
| Finance | OPERATIONAL | ✅ | ✅ | ✅ | — |
| Sales & Marketing | OPERATIONAL | ✅ | ✅ | ✅ | — |
| Ops & Onboarding | OPERATIONAL | ✅ | ✅ | ✅ | — |
| Support | ALL | ✅ | ✅ | ✅ | ✅ |
| Platform | OPERATIONAL | ✅ | ✅ | ✅ | — |
| Administration | ELEVATED | ✅ | ✅ | — | — |
| **Total** | | **7** | **7** | **6** | **2** |

Rationale: `viewer` → read-oriented (Executive/Support); `editor` → operational feature
workspaces; elevated → everything incl. Administration (parity with today's
`getVisibleSections({ isAdmin })`).

## Caveat — this is nav-hiding, NOT a security boundary

Hiding a workspace only removes it from the sidebar. A `viewer` can still hand-type
`/admin/settings` and reach the page until **server-side route guards (PR5)** land. This
is expected at this stage. Do not treat B1a as access control.

## Tests

`__tests__/lib/admin/feature-registry.test.ts` — `describe('B1a role -> workspace mapping')`:
viewer → {executive, support} only; editor → operational, no Administration; elevated →
Administration present.
