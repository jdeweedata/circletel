---
name: radix-navigation-menu-click-fix
description: Radix NavigationMenu with forceMount causes click failures - use CSS hover dropdowns instead
type: debugging
date: 2026-03-12
time_saved: 30-60 min
---

# Radix NavigationMenu Click Failures with forceMount

## Problem

Desktop navigation dropdown links were unclickable, but mobile navigation (using Accordion) worked perfectly.

## Root Cause

Radix UI's `NavigationMenu` with `forceMount` prop keeps all dropdown content in the DOM. This causes:

1. **Pointer-events conflicts**: Radix manages pointer-events internally, and hidden content can block clicks on visible content
2. **Multiple overlapping elements**: All dropdown panels are positioned `absolute` and always present in DOM
3. **State management complexity**: Even with `data-[state=closed]:hidden` and `pointer-events-none`, Radix's internal handling interferes

## Failed Fixes

1. **Removing onClick handler with e.preventDefault()** - Didn't help
2. **Adding explicit pointer-events classes** (`data-[state=open]:pointer-events-auto`) - Didn't help

## Working Solution

Replace Radix NavigationMenu with a simple CSS hover dropdown:

```tsx
function NavDropdown({ label, items }: NavDropdownProps) {
  return (
    <div className="relative group">
      {/* Trigger */}
      <button className="nav-trigger group-hover:bg-circleTel-orange/10">
        {label}
        <PiCaretDownBold className="group-hover:rotate-180" />
      </button>

      {/* Dropdown - CSS hover controlled */}
      <div className="absolute top-full opacity-0 invisible group-hover:opacity-100 group-hover:visible z-50">
        <ul>
          {items.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>{item.name}</Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

## Key Classes

```css
/* Parent container */
.relative .group

/* Dropdown content */
.absolute .top-full
.opacity-0 .invisible                    /* Hidden by default */
.group-hover:opacity-100 .group-hover:visible  /* Shown on hover */
.z-50                                    /* Above other content */
```

## When to Use This Pattern

- Navigation menus with hover dropdowns
- Any case where Radix NavigationMenu causes click issues
- When you need simple, reliable dropdown behavior

## When Radix NavigationMenu is Still Good

- Click-to-open dropdowns (not hover)
- Keyboard navigation is critical
- Complex multi-level menus with accessibility requirements

## Detection

Symptoms that indicate this issue:
- "Links work on mobile but not desktop"
- "Can see dropdown but can't click links"
- Using `forceMount` with NavigationMenuContent
- Multiple NavigationMenuContent elements in DOM

## Files Changed

- `components/navigation/NavigationMenu.tsx` - Replaced Radix with CSS hover dropdown
- `components/navigation/NavDropdownItem.tsx` - No longer needed (can be deleted)
- `components/navigation/NavDropdownSection.tsx` - No longer needed (can be deleted)
