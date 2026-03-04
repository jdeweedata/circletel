# Phosphor Icons Migration Design

**Date**: 2026-03-04
**Status**: Approved
**Goal**: Design differentiation — avoid the "AI template" look from overused Lucide icons

## Summary

Migrate CircleTel from Lucide React to Phosphor Icons (Bold weight) via `react-icons/pi`. This is a big-bang migration affecting ~600 files.

## Current State

| Library | Files | Action |
|---------|-------|--------|
| `lucide-react` | ~596 | Replace with Phosphor |
| `@heroicons/react` | ~9 | Replace with Phosphor |
| `react-icons` | 7 | Keep (already Phosphor) |

## Approach

Use `react-icons/pi` (Phosphor Icons) which is already installed. Create a codemod script to automate the migration.

### Naming Convention

```typescript
// Before (Lucide)
import { ChevronRight, User, Settings } from 'lucide-react'

// After (Phosphor via react-icons)
import { PiCaretRightBold, PiUserBold, PiGearBold } from 'react-icons/pi'
```

### Icon Weight

**Bold** — Strong visual presence, matches existing `PiXxxBold` convention in the codebase.

## Icon Mapping (Key Categories)

| Category | Lucide | Phosphor Bold |
|----------|--------|---------------|
| **Chevrons** | `ChevronRight/Left/Up/Down` | `PiCaretRightBold/LeftBold/UpBold/DownBold` |
| **Arrows** | `ArrowRight/Left/Up/Down` | `PiArrowRightBold/LeftBold/UpBold/DownBold` |
| **Actions** | `Plus`, `Minus`, `X`, `Check` | `PiPlusBold`, `PiMinusBold`, `PiXBold`, `PiCheckBold` |
| **Navigation** | `Menu`, `Home`, `Search` | `PiListBold`, `PiHouseBold`, `PiMagnifyingGlassBold` |
| **User** | `User`, `Users`, `UserPlus` | `PiUserBold`, `PiUsersBold`, `PiUserPlusBold` |
| **Settings** | `Settings`, `Sliders` | `PiGearBold`, `PiSlidersBold` |
| **Alerts** | `AlertCircle`, `AlertTriangle`, `Info` | `PiWarningCircleBold`, `PiWarningBold`, `PiInfoBold` |
| **Status** | `CheckCircle`, `XCircle` | `PiCheckCircleBold`, `PiXCircleBold` |
| **Media** | `Play`, `Pause`, `Volume2` | `PiPlayBold`, `PiPauseBold`, `PiSpeakerHighBold` |
| **Files** | `File`, `Folder`, `Download`, `Upload` | `PiFileBold`, `PiFolderBold`, `PiDownloadSimpleBold`, `PiUploadSimpleBold` |
| **Communication** | `Mail`, `Phone`, `MessageCircle` | `PiEnvelopeBold`, `PiPhoneBold`, `PiChatCircleBold` |
| **Commerce** | `ShoppingCart`, `CreditCard`, `DollarSign` | `PiShoppingCartBold`, `PiCreditCardBold`, `PiCurrencyDollarBold` |
| **Maps** | `MapPin`, `Map`, `Navigation` | `PiMapPinBold`, `PiMapTrifoldBold`, `PiNavigationArrowBold` |
| **Time** | `Clock`, `Calendar` | `PiClockBold`, `PiCalendarBold` |
| **Misc** | `Eye`, `EyeOff`, `Copy`, `Trash` | `PiEyeBold`, `PiEyeSlashBold`, `PiCopyBold`, `PiTrashBold` |

## Edge Cases

1. **No direct equivalent** — Document in `ICON_MAPPING.md` with suggested alternatives
2. **Size props** — Both use `className` for sizing (`w-4 h-4`), no changes needed
3. **Color inheritance** — Both inherit `currentColor`, no changes needed
4. **Heroicons** — Map to same Phosphor equivalents

## Deliverables

1. `scripts/migrate-to-phosphor.ts` — Codemod script with full icon mapping
2. `docs/design-system/ICON_MAPPING.md` — Complete mapping reference for future use
3. Updated `package.json` — Remove `lucide-react`, `@heroicons/react`
4. All files updated with Phosphor imports

## Success Criteria

- [ ] Zero Lucide or Heroicon imports remain
- [ ] All icons render correctly
- [ ] Type checking passes
- [ ] Visual review of key pages confirms icons display properly

## Risks

| Risk | Mitigation |
|------|------------|
| Missing icon equivalents | Manual review and alternative selection |
| Broken layouts from size differences | Icons are same default size (1em) |
| Large PR difficult to review | Codemod is deterministic, spot-check samples |
