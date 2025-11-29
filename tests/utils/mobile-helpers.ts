/**
 * Mobile Testing Utilities for Playwright
 *
 * Provides helpers for touch interactions, gestures, viewport validation,
 * and mobile-specific testing scenarios.
 */

import { Page, expect, Locator } from '@playwright/test';

/**
 * Mobile breakpoints matching Tailwind defaults
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Common mobile viewport sizes
 */
export const MOBILE_VIEWPORTS = {
  iPhoneSE: { width: 375, height: 667 },
  iPhone12: { width: 390, height: 844 },
  iPhone13: { width: 390, height: 844 },
  iPhone14ProMax: { width: 430, height: 932 },
  pixel5: { width: 393, height: 851 },
  pixel7: { width: 412, height: 915 },
  galaxyS8: { width: 360, height: 740 },
  galaxyS23: { width: 384, height: 824 },
  iPadMini: { width: 768, height: 1024 },
  iPadPro11: { width: 834, height: 1194 },
} as const;

/**
 * Mobile Test Helper Class
 *
 * Provides touch gesture simulation, viewport validation,
 * and mobile-specific interaction helpers.
 */
export class MobileTestHelper {
  constructor(private page: Page) {}

  /**
   * Simulate a tap (touch) on an element
   */
  async tap(selector: string | Locator): Promise<void> {
    const element = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await element.tap();
  }

  /**
   * Simulate a double tap
   */
  async doubleTap(selector: string | Locator): Promise<void> {
    const element = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await element.tap();
    await this.page.waitForTimeout(100);
    await element.tap();
  }

  /**
   * Simulate a long press (touch and hold)
   */
  async longPress(selector: string | Locator, duration: number = 500): Promise<void> {
    const element = typeof selector === 'string' ? this.page.locator(selector) : selector;
    const box = await element.boundingBox();
    if (!box) throw new Error('Element not visible');

    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;

    await this.page.touchscreen.tap(x, y);
    await this.page.waitForTimeout(duration);
  }

  /**
   * Simulate a swipe up gesture
   */
  async swipeUp(distance: number = 300): Promise<void> {
    const viewport = this.page.viewportSize();
    if (!viewport) throw new Error('No viewport size');

    const startX = viewport.width / 2;
    const startY = viewport.height * 0.7;
    const endY = startY - distance;

    await this.swipe(startX, startY, startX, endY);
  }

  /**
   * Simulate a swipe down gesture
   */
  async swipeDown(distance: number = 300): Promise<void> {
    const viewport = this.page.viewportSize();
    if (!viewport) throw new Error('No viewport size');

    const startX = viewport.width / 2;
    const startY = viewport.height * 0.3;
    const endY = startY + distance;

    await this.swipe(startX, startY, startX, endY);
  }

  /**
   * Simulate a swipe left gesture
   */
  async swipeLeft(distance: number = 200): Promise<void> {
    const viewport = this.page.viewportSize();
    if (!viewport) throw new Error('No viewport size');

    const startX = viewport.width * 0.8;
    const startY = viewport.height / 2;
    const endX = startX - distance;

    await this.swipe(startX, startY, endX, startY);
  }

  /**
   * Simulate a swipe right gesture
   */
  async swipeRight(distance: number = 200): Promise<void> {
    const viewport = this.page.viewportSize();
    if (!viewport) throw new Error('No viewport size');

    const startX = viewport.width * 0.2;
    const startY = viewport.height / 2;
    const endX = startX + distance;

    await this.swipe(startX, startY, endX, startY);
  }

  /**
   * Generic swipe from point A to point B
   */
  private async swipe(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    steps: number = 10
  ): Promise<void> {
    const deltaX = (endX - startX) / steps;
    const deltaY = (endY - startY) / steps;

    // Start touch
    await this.page.touchscreen.tap(startX, startY);

    // Move through intermediate points
    for (let i = 1; i <= steps; i++) {
      const x = startX + deltaX * i;
      const y = startY + deltaY * i;
      await this.page.mouse.move(x, y);
      await this.page.waitForTimeout(10);
    }
  }

  /**
   * Scroll to element using touch
   */
  async scrollToElement(selector: string | Locator): Promise<void> {
    const element = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await element.scrollIntoViewIfNeeded();
  }

  /**
   * Verify current viewport is mobile-sized
   */
  async assertMobileViewport(): Promise<void> {
    const viewport = this.page.viewportSize();
    expect(viewport).toBeTruthy();
    expect(viewport!.width).toBeLessThan(BREAKPOINTS.md);
  }

  /**
   * Verify current viewport is tablet-sized
   */
  async assertTabletViewport(): Promise<void> {
    const viewport = this.page.viewportSize();
    expect(viewport).toBeTruthy();
    expect(viewport!.width).toBeGreaterThanOrEqual(BREAKPOINTS.md);
    expect(viewport!.width).toBeLessThan(BREAKPOINTS.lg);
  }

  /**
   * Check if hamburger menu is visible (mobile nav indicator)
   */
  async hasHamburgerMenu(): Promise<boolean> {
    const hamburger = this.page.locator(
      '[data-testid="hamburger-menu"], [aria-label*="menu"], button:has(svg[class*="menu"]), .hamburger-menu'
    );
    return hamburger.first().isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Open hamburger/mobile menu
   */
  async openMobileMenu(): Promise<void> {
    const hamburger = this.page.locator(
      '[data-testid="hamburger-menu"], [aria-label*="menu"], button:has(svg[class*="menu"]), .hamburger-menu'
    ).first();
    await hamburger.tap();
  }

  /**
   * Wait for mobile keyboard to appear (form focus)
   */
  async waitForKeyboard(timeout: number = 3000): Promise<void> {
    // On mobile, focusing an input typically shows keyboard
    // We can detect this by checking if viewport height changes
    const initialHeight = this.page.viewportSize()?.height || 0;
    await this.page.waitForTimeout(timeout);
    // Note: Playwright emulation doesn't actually show a keyboard,
    // but this helper is here for structural testing
  }

  /**
   * Dismiss keyboard by tapping outside input
   */
  async dismissKeyboard(): Promise<void> {
    const viewport = this.page.viewportSize();
    if (!viewport) return;
    // Tap near the top of the screen to dismiss keyboard
    await this.page.touchscreen.tap(viewport.width / 2, 50);
  }

  /**
   * Check if element is within visible viewport
   */
  async isElementInViewport(selector: string | Locator): Promise<boolean> {
    const element = typeof selector === 'string' ? this.page.locator(selector) : selector;
    const box = await element.boundingBox();
    const viewport = this.page.viewportSize();

    if (!box || !viewport) return false;

    return (
      box.x >= 0 &&
      box.y >= 0 &&
      box.x + box.width <= viewport.width &&
      box.y + box.height <= viewport.height
    );
  }

  /**
   * Get touch target size (accessibility check)
   * WCAG recommends at least 44x44px for touch targets
   */
  async checkTouchTargetSize(selector: string | Locator): Promise<{
    width: number;
    height: number;
    meetsWCAG: boolean;
  }> {
    const element = typeof selector === 'string' ? this.page.locator(selector) : selector;
    const box = await element.boundingBox();

    if (!box) {
      throw new Error('Element not visible');
    }

    const MINIMUM_SIZE = 44;

    return {
      width: box.width,
      height: box.height,
      meetsWCAG: box.width >= MINIMUM_SIZE && box.height >= MINIMUM_SIZE,
    };
  }

  /**
   * Check all tappable elements meet minimum touch target size
   */
  async auditTouchTargets(): Promise<{
    total: number;
    passing: number;
    failing: Array<{ selector: string; width: number; height: number }>;
  }> {
    const tappableSelectors = 'button, a, input, [role="button"], [onclick]';
    const elements = await this.page.locator(tappableSelectors).all();

    const failing: Array<{ selector: string; width: number; height: number }> = [];
    let passing = 0;

    for (const element of elements) {
      try {
        const box = await element.boundingBox();
        if (box) {
          if (box.width >= 44 && box.height >= 44) {
            passing++;
          } else {
            const id = await element.getAttribute('id');
            const testId = await element.getAttribute('data-testid');
            failing.push({
              selector: testId || id || (await element.textContent())?.slice(0, 30) || 'unknown',
              width: box.width,
              height: box.height,
            });
          }
        }
      } catch {
        // Element not visible or detached
      }
    }

    return {
      total: elements.length,
      passing,
      failing,
    };
  }

  /**
   * Take a mobile-formatted screenshot
   */
  async screenshot(name: string): Promise<void> {
    const viewport = this.page.viewportSize();
    const deviceName = viewport
      ? `${viewport.width}x${viewport.height}`
      : 'unknown';
    await this.page.screenshot({
      path: `test-results/mobile-${deviceName}-${name}.png`,
      fullPage: false,
    });
  }
}

/**
 * Network throttling presets for mobile testing
 * Use with page.route() or CDP commands
 */
export const NETWORK_CONDITIONS = {
  offline: { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 },
  slow3G: { offline: false, latency: 2000, downloadThroughput: 50000, uploadThroughput: 50000 },
  fast3G: { offline: false, latency: 500, downloadThroughput: 780000, uploadThroughput: 330000 },
  regular4G: { offline: false, latency: 100, downloadThroughput: 4000000, uploadThroughput: 3000000 },
} as const;

/**
 * Apply network throttling (requires CDP)
 */
export async function setNetworkConditions(
  page: Page,
  conditions: (typeof NETWORK_CONDITIONS)[keyof typeof NETWORK_CONDITIONS]
): Promise<void> {
  const client = await page.context().newCDPSession(page);
  await client.send('Network.emulateNetworkConditions', conditions);
}

/**
 * Wait for mobile-specific loading states
 */
export async function waitForMobileLoad(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  // Wait for any skeleton loaders or spinners to disappear
  await page.waitForSelector('[class*="skeleton"], [class*="spinner"], [class*="loading"]', {
    state: 'hidden',
    timeout: 10000,
  }).catch(() => {});
}

/**
 * Check if page has horizontal overflow (common mobile issue)
 */
export async function hasHorizontalOverflow(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
}

/**
 * Get all elements causing horizontal overflow
 */
export async function findOverflowElements(page: Page): Promise<string[]> {
  return await page.evaluate(() => {
    const elements: string[] = [];
    const docWidth = document.documentElement.clientWidth;

    document.querySelectorAll('*').forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.right > docWidth) {
        const id = el.id ? `#${el.id}` : '';
        const classes = el.className ? `.${el.className.toString().split(' ').join('.')}` : '';
        elements.push(`${el.tagName.toLowerCase()}${id}${classes}`);
      }
    });

    return elements.slice(0, 10); // Return first 10
  });
}
