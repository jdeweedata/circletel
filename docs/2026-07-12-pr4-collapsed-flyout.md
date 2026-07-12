# PR4 — Collapsed-rail flyout drawers (UX polish)

**Date:** 2026-07-12
**Target repo:** https://github.com/jdeweedata/circletel (branch off `origin/staging` @ `443d57a4`)
**Parent:** [porting-plan §3 PR4](./2026-07-11-role-scoped-admin-porting-plan.md)
**Verified against:** live `staging` ref (`Sidebar.tsx` post-#613/B1a/PR5/PR2.5).
**Scope:** `components/admin/layout/Sidebar.tsx` only (+ its test). No data/role/guard changes.

---

## 0. The gap (evidenced)

On the collapsed rail (`!isOpen`, `lg:w-16`), a parent nav item (one with children) rendered an
icon button + a **name-only Tooltip**. Its children were gated on `isOpen && isExpanded(item.name)`,
so **on the collapsed rail the child links never rendered** — a user had to expand the whole sidebar
to reach e.g. Payments → Transactions. PR4 gives collapsed parents a hover/focus **flyout drawer**
listing those children, so they're reachable without expanding. Leaf items keep their name tooltip.

The workspace switcher already ships this pattern collapsed (`left-full top-0 ml-2 w-56` panel) — PR4
applies the same visual language to per-item children.

---

## 1. Design decisions

1. **New `CollapsedFlyout` subcomponent** in the same file; used only for `!isOpen && hasChildren`.
   Expanded accordion and leaf tooltips are untouched.
2. **Hover *and* focus-driven, local state** — matches the switcher's hand-rolled approach (no Radix
   Popover dep). `onMouseEnter/Leave` + focus-within (`onFocus` / `onBlur` with `relatedTarget`
   containment) so keyboard users get the same drawer.
3. **CSS transition, not framer-motion** — the sidebar's motion vocabulary is Tailwind
   `transition-*`; this file imports no framer. An opacity+translate CSS transition with
   `motion-reduce:transition-none` covers reduced-motion in one class and adds zero imports.
   `ponytail:` swap the wrapper for `motion.div` + `useReducedMotion()` if spring physics is wanted.
4. **No dead-zone bridge** — the panel wrapper sits at `left-full` (contiguous with the icon) with
   `pl-2` providing the visual gap, so moving the pointer icon→panel never crosses an unhovered gap.
5. **Reuse the switcher's panel chrome** for consistency: `rounded-lg border border-gray-200 bg-white
   p-1 shadow-lg`, `role="menu"`, child rows `role="menuitem"`, plus a small parent-name header (a
   collapsed user has no other label for the group).

---

## 2. The change

- **`Sidebar.tsx`:** new `CollapsedFlyout({ item, isActiveLink })` subcomponent (near
  `WORKSPACE_ICON`). The `hasChildren` branch of the nav map routes `!isOpen` parents to it; the
  `isOpen` accordion branch is behaviour-preserved with the now-dead collapsed guards removed
  (`isOpen &&` conditions that were always true, and the collapsed-only `<Tooltip>` wrapper).
- **`Sidebar.test.tsx`:** two new cases — a collapsed parent emits a flyout trigger
  (`aria-haspopup="menu"`), and every child href is reachable in the tree.

`Tooltip`/`TooltipTrigger`/`TooltipContent` imports stay — leaf items still use them collapsed.

---

## 3. Motion & accessibility

- **Reduced motion:** `motion-reduce:transition-none` on the panel → instant show/hide.
- **Keyboard:** icon button is tab-focusable (`aria-haspopup="menu"`, `aria-expanded`); focus opens
  the panel; child `<Link>`s live inside the focus-within container, so tabbing through them keeps
  it open; tabbing out (relatedTarget outside) closes it. No focus trap — it's a menu, not a modal.
- **Stacking / clip — escalation APPLIED:** an `absolute left-full` panel is painted *behind* the
  main content. The collapsed sidebar has `lg:translate-x-0` (a transform → stacking context) that
  the panel can't escape, so it loses the paint order to the content column. Confirmed live via
  `document.elementFromPoint` (panel CSS-visible but not the hit-target). Raising the sidebar's
  z-index does **not** fix it (the occluder is in a different context). The fix is the spec's escape
  hatch: render the panel **`position: fixed`**, positioned from the trigger's
  `getBoundingClientRect` (top = rect.top, left = rect.right), `z-60`, re-read on scroll/resize while
  open. It stays a DOM child of the wrapper so the hover-bridge is preserved. Re-verified live:
  `hitInsidePanel: true`.

---

## 4. Tests — `__tests__/components/admin/layout/Sidebar.test.tsx`

Env is jest-environment-node + react-test-renderer (no jsdom) — assert the **tree**, not hover.

- **Add:** collapsed + a parent item → a node with `aria-haspopup: 'menu'` exists.
- **Add:** collapsed flyout exposes every child href of the parent (reachable in the tree).
- The existing collapsed-leaf tooltip test stays green (the default Executive workspace's Dashboard
  is a leaf → still emits a tooltip); the accordion test (expanded) stays green.

Interaction (hover open/close, keyboard traversal, scroll-clip, reduced-motion) is **live-verified**
in §5 — node-env can't fire pointer/focus/scroll.

---

## 5. Acceptance

Unit: updated Sidebar suite green (was 8; 10 after), no other suite touched; type-check error set
identical to parent; build ✓.

Live (staging, collapse via the `‹` toggle):
- Hover/focus a collapsed parent icon → drawer slides in with child links + parent-name header.
- Click a child → navigates; drawer's active child highlighted.
- Keyboard: Tab to icon → drawer opens; Tab through children; Tab past → closes. No focus trap.
- Parent near the bottom of a long workspace → drawer not clipped by the nav scroll area.
- `prefers-reduced-motion` → drawer appears with no slide/fade.
- Leaf items collapsed → still a plain name tooltip (unchanged).

---

## 6. Out of scope / notes

- Expanded-sidebar accordion behaviour preserved (only dead collapsed-branch code removed).
- No framer-motion introduced (CSS transition; §1.3 names the upgrade path).
- Mobile (`< lg`) unaffected — the rail only collapses at `lg+`; on mobile the sidebar is a full
  `w-64` overlay, so parents always use the accordion.
