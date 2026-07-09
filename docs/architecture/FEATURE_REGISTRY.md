# Admin Feature Registry

**Module**: `lib/admin/feature-registry.ts` | **Since**: Phase 0 (2026-07)
**Spec**: `docs/superpowers/specs/2026-07-09-whitelabel-platform-design.md` §6

Admin navigation is GENERATED from the registry — never edit nav JSX in
`components/admin/layout/Sidebar.tsx` to add/remove a section.

## Adding an admin section

1. Build the page under `app/admin/<section>/`.
2. Register it in `featureSections` (or `bottomSections`) with an icon.
3. Set `maturity`:
   - `stable` (default) — visible to allowed roles
   - `beta` — visible (Phase 4 will add a badge)
   - `internal` — hidden from nav (dev/testing only, reachable by URL)
   - `hidden` — hidden from nav (parked/incomplete work)
4. Set `adminOnly: true` if only super_admin / product_manager may see it.

## Hiding a half-finished section

Set `maturity: 'hidden'` on the item. Do not delete the entry.

## Phase 4 (planned, not yet built)

Role workspaces (finance / sales / ops / support / executive) will extend
these entries with `roles: [...]` and workspace grouping.
