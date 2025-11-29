# Mobile Testing Skill

## Trigger Keywords
- "mobile test"
- "test mobile"
- "mobile UI"
- "mobile UX"
- "responsive test"
- "touch test"
- "device emulation"
- "phone testing"
- "tablet testing"

## Skill Description
This skill provides comprehensive mobile UI/UX testing capabilities using Playwright's device emulation. It enables testing on various mobile devices without physical hardware, including touch interactions, viewport testing, and mobile-specific scenarios.

## When to Use
- Testing responsive layouts on mobile devices
- Validating touch interactions (tap, swipe, pinch)
- Testing mobile navigation (hamburger menus, bottom navs)
- Verifying mobile form inputs (virtual keyboard, autocomplete)
- Testing mobile-specific features (orientation, gestures)
- Visual regression testing across devices
- Performance testing on simulated slow networks

## Commands

### Run All Mobile Tests
```bash
npm run test:mobile
```

### Run Specific Device
```bash
# iPhone tests only
npm run test:mobile:iphone

# Android tests only
npm run test:mobile:android

# Tablet tests only
npm run test:mobile:tablet
```

### Interactive Mode
```bash
npm run test:mobile:ui
```

### Generate Report
```bash
npm run test:mobile:report
```

## Key Files
- `playwright.mobile.config.ts` - Mobile device configurations
- `tests/e2e/mobile/` - Mobile test files
- `tests/utils/mobile-helpers.ts` - Mobile testing utilities

## Integration with CircleTel
This skill is designed for testing CircleTel's customer-facing flows on mobile:
- Home page coverage checker
- Package selection cards
- Order form flow
- Payment processing
- Customer dashboard

## Example Test Output
```
Running 24 tests using 4 workers

  mobile-navigation.spec.ts
    [iPhone 13] hamburger menu opens correctly
    [Pixel 5] bottom navigation works
    [Galaxy S8] menu items are tappable

  mobile-order-flow.spec.ts
    [iPhone SE] can complete order on small screen
    [iPad Mini] order flow works on tablet
```

## Dependencies
- @playwright/test (already installed)
- No additional dependencies required
