---
paths:
  - "components/admin/**"
  - "app/admin/**"
---

# Admin Shared Component Prop Interfaces

**Trigger**: Using any component from `components/admin/shared/`
**Source**: 1 session (2026-03-31 coverage-checker-ui) — 8/10 type errors from wrong props

---

## Rule: Read the component, don't guess the props

Before using a shared admin component, verify its prop interface. These are the verified signatures:

---

## StatusBadge

```typescript
interface StatusBadgeProps {
  status: string;          // ← NOT "label", NOT "text", NOT "children"
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  showDot?: boolean;
  icon?: React.ReactNode;
  className?: string;
}
```

**Common mistake:**
```tsx
// ❌ WRONG — "label" prop doesn't exist
<StatusBadge variant="success" label="Active" />

// ✅ CORRECT
<StatusBadge variant="success" status="Active" />
```

---

## StatCard

```typescript
interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  subtitleIcon?: React.ReactNode;
  icon?: React.ReactNode;   // ← ReactNode, NOT IconType (component reference)
  iconBgColor?: string;
  iconColor?: string;
  trend?: { value: number; isPositive: boolean };
  onClick?: () => void;
  isActive?: boolean;
  href?: string;
  className?: string;
}
```

**Common mistake:**
```tsx
// ❌ WRONG — passing component reference (IconType) not rendered element
<StatCard icon={PiRulerBold} label="Distance" value="1.5 km" />

// ✅ CORRECT — render as JSX element
<StatCard icon={<PiRulerBold />} label="Distance" value="1.5 km" />
```

---

## SectionCard

```typescript
interface SectionCardProps {
  title: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
  compact?: boolean;
  children: React.ReactNode;
  className?: string;
}
```

---

## InfoRow

```typescript
interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}
```

---

## StatusVariant Reference

```typescript
type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';
```

Note: `'info'` is valid — use for confidence levels, neutral states. `'neutral'` is also valid.

---

## DO

- Pass `status` to StatusBadge (not `label`, `text`, or `children`)
- Render icons as JSX: `icon={<PiSomeBold />}` not `icon={PiSomeBold}`
- Use `getStatusVariant()` helper from `@/components/admin/shared` to map DB status strings to variants

## DON'T

- Guess prop names — they differ from shadcn/ui conventions
- Use `label` on StatusBadge (shadcn Badge uses `children`; StatusBadge uses `status`)
- Pass icon component references to StatCard (TypeScript will error with "IconType not assignable to ReactNode")
