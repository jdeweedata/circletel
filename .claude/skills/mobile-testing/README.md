# Mobile Testing Skill

Playwright-based mobile UI/UX testing for CircleTel Next.js application.

## Quick Start

```bash
# Run all mobile tests
npm run test:mobile

# Run specific device tests
npm run test:mobile:iphone
npm run test:mobile:android

# Run mobile tests with UI
npm run test:mobile:ui

# Generate mobile test report
npm run test:mobile:report
```

## Features

- **Device Emulation**: 10+ mobile devices (iPhone, Pixel, Galaxy, etc.)
- **Touch Interactions**: Swipe, pinch, long-press gesture support
- **Viewport Testing**: Responsive breakpoint validation
- **Network Throttling**: 3G/4G/slow connection simulation
- **Orientation**: Portrait/landscape testing
- **Screenshot Comparison**: Visual regression testing

## Supported Devices

| Device | Viewport | User Agent | Touch |
|--------|----------|------------|-------|
| iPhone SE | 375x667 | iOS Safari | Yes |
| iPhone 13 | 390x844 | iOS Safari | Yes |
| iPhone 14 Pro Max | 430x932 | iOS Safari | Yes |
| Pixel 5 | 393x851 | Chrome Android | Yes |
| Pixel 7 | 412x915 | Chrome Android | Yes |
| Galaxy S8 | 360x740 | Chrome Android | Yes |
| Galaxy S23 Ultra | 384x824 | Chrome Android | Yes |
| iPad Mini | 768x1024 | iOS Safari | Yes |
| iPad Pro 11 | 834x1194 | iOS Safari | Yes |

## Test Files

```
tests/e2e/mobile/
  mobile-navigation.spec.ts    # Mobile nav & hamburger menu
  mobile-order-flow.spec.ts    # Order journey on mobile
  mobile-forms.spec.ts         # Form interactions (touch keyboards)
  mobile-gestures.spec.ts      # Swipe, scroll, pinch tests
  mobile-responsive.spec.ts    # Breakpoint validation
```

## Usage

### Basic Mobile Test

```typescript
import { test, devices } from '@playwright/test';
import { MobileTestHelper } from '../utils/mobile-helpers';

test.use({ ...devices['iPhone 13'] });

test('mobile checkout flow', async ({ page }) => {
  const mobile = new MobileTestHelper(page);

  await page.goto('/order');
  await mobile.tapElement('[data-testid="package-card"]');
  await mobile.swipeUp();
  await mobile.assertMobileViewport();
});
```

### Custom Device

```typescript
test.use({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent: 'Custom Mobile Agent',
});
```

## Configuration

See `playwright.mobile.config.ts` for full device configuration.

## CircleTel-Specific Tests

- Coverage check on mobile
- Package selection with touch
- Order form with mobile keyboard
- Payment flow on small screens
- Dashboard responsive layout
