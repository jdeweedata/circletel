/**
 * Component Design System Validation Tests
 *
 * Visual regression and consistency tests for design system components
 */

import { test, expect } from '@playwright/test';
import { createDesignValidator, validateDesignSystem } from '../utils/design-validation';

// Test data for different component variants
const componentTestCases = [
  {
    name: 'Button',
    variants: ['default', 'primary', 'secondary', 'destructive', 'outline', 'ghost'],
    sizes: ['sm', 'md', 'lg'],
    states: ['default', 'hover', 'focus', 'disabled'],
  },
  {
    name: 'Text',
    variants: ['body', 'body-large', 'body-small', 'caption', 'overline'],
    colors: ['primary', 'secondary', 'muted', 'accent'],
  },
  {
    name: 'Heading',
    levels: [1, 2, 3, 4, 5, 6],
    variants: ['hero', 'display', 'headline', 'title', 'label'],
    colors: ['primary', 'secondary', 'accent'],
  },
];

test.describe('Design System Component Validation', () => {
  // Create a test page with all components for visual regression
  test.beforeEach(async ({ page }) => {
    await page.goto('/internal-docs'); // Navigate to internal docs page with components
    await page.waitForLoadState('networkidle');
  });

  test('validates button component consistency', async ({ page }) => {
    const validator = createDesignValidator(page);

    // Test each button variant
    for (const variant of componentTestCases[0].variants) {
      const buttonSelector = `[data-testid="button-${variant}"], .btn-${variant}, button[class*="${variant}"]`;
      const buttons = page.locator(buttonSelector);

      if (await buttons.count() > 0) {
        // Visual regression test
        await validator.captureVisualRegression(`button-${variant}`, {
          selector: buttonSelector,
        });

        // Validate button styling
        await validator.validateColors(buttonSelector);
        await validator.validateTypography(buttonSelector);
        await validator.validateSpacing(buttonSelector);

        // Test interactive states
        const firstButton = buttons.first();

        // Hover state
        await firstButton.hover();
        await validator.captureVisualRegression(`button-${variant}-hover`, {
          selector: buttonSelector,
        });

        // Focus state
        await firstButton.focus();
        await validator.captureVisualRegression(`button-${variant}-focus`, {
          selector: buttonSelector,
        });

        // Check accessibility
        const hasAriaLabel = await firstButton.getAttribute('aria-label');
        const hasText = await firstButton.textContent();
        const hasAriaLabelledBy = await firstButton.getAttribute('aria-labelledby');

        if (!hasAriaLabel && !hasText && !hasAriaLabelledBy) {
          test.fail('Button missing accessible label');
        }
      }
    }
  });

  test('validates text component consistency', async ({ page }) => {
    const validator = createDesignValidator(page);

    // Test text variants
    for (const variant of componentTestCases[1].variants) {
      const textSelector = `[data-testid="text-${variant}"], .text-${variant}, [class*="text-${variant}"]`;
      const textElements = page.locator(textSelector);

      if (await textElements.count() > 0) {
        await validator.captureVisualRegression(`text-${variant}`, {
          selector: textSelector,
        });

        await validator.validateTypography(textSelector);
        await validator.validateColors(textSelector);
      }
    }
  });

  test('validates heading hierarchy and consistency', async ({ page }) => {
    const validator = createDesignValidator(page);

    // Test heading levels
    for (const level of componentTestCases[2].levels) {
      const headingSelector = `h${level}`;
      const headings = page.locator(headingSelector);

      if (await headings.count() > 0) {
        await validator.captureVisualRegression(`heading-h${level}`, {
          selector: headingSelector,
        });

        await validator.validateTypography(headingSelector);
        await validator.validateColors(headingSelector);
      }
    }

    // Validate overall heading hierarchy
    await validator.validateAccessibility();
  });

  test('validates form components', async ({ page }) => {
    const validator = createDesignValidator(page);

    const formSelectors = [
      'input[type="text"]',
      'input[type="email"]',
      'input[type="password"]',
      'textarea',
      'select',
      'input[type="checkbox"]',
      'input[type="radio"]',
    ];

    for (const selector of formSelectors) {
      const elements = page.locator(selector);

      if (await elements.count() > 0) {
        const componentName = selector.replace(/[^\w]/g, '-');
        await validator.captureVisualRegression(`form-${componentName}`, {
          selector,
        });

        await validator.validateColors(selector);
        await validator.validateSpacing(selector);

        // Test focus states
        await elements.first().focus();
        await validator.captureVisualRegression(`form-${componentName}-focus`, {
          selector,
        });
      }
    }
  });

  test('validates card and container components', async ({ page }) => {
    const validator = createDesignValidator(page);

    const containerSelectors = [
      '[data-testid*="card"]',
      '.card',
      '[class*="card"]',
      '[data-testid*="container"]',
      '.container',
      '[class*="container"]',
    ];

    for (const selector of containerSelectors) {
      const elements = page.locator(selector);

      if (await elements.count() > 0) {
        const componentName = selector.replace(/[^\w]/g, '-');
        await validator.captureVisualRegression(`container-${componentName}`, {
          selector,
        });

        await validator.validateColors(selector);
        await validator.validateSpacing(selector);
      }
    }
  });

  test('validates responsive behavior', async ({ page }) => {
    const validator = createDesignValidator(page);

    // Test at different breakpoints
    const breakpoints = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 720 },
    ];

    for (const breakpoint of breakpoints) {
      await page.setViewportSize({
        width: breakpoint.width,
        height: breakpoint.height,
      });

      await page.waitForTimeout(300); // Wait for responsive changes

      // Capture full page at each breakpoint
      await validator.captureVisualRegression(`responsive-${breakpoint.name}`, {
        fullPage: true,
      });

      // Validate responsive design rules
      await validator.validateResponsiveness();
    }
  });

  test('validates brand compliance', async ({ page }) => {
    const validator = createDesignValidator(page);

    // Check for CircleTel branding elements
    await validator.validateBrandCompliance();

    // Verify brand colors are used correctly
    const brandElements = page.locator('[class*="circleTel"], [class*="brand"], [data-testid*="logo"]');

    if (await brandElements.count() > 0) {
      await validator.captureVisualRegression('brand-elements', {
        selector: '[class*="circleTel"], [class*="brand"], [data-testid*="logo"]',
      });
    }

    // Check color consistency across brand elements
    await validator.validateColors('[class*="circleTel"], [class*="brand"]');
  });

  test('validates accessibility compliance', async ({ page }) => {
    const validator = createDesignValidator(page);

    // Run comprehensive accessibility validation
    await validator.validateAccessibility();

    // Additional accessibility checks
    const interactiveElements = page.locator(
      'button, a, input, textarea, select, [tabindex]:not([tabindex="-1"]), [role="button"]'
    );

    const elementCount = await interactiveElements.count();

    for (let i = 0; i < elementCount; i++) {
      const element = interactiveElements.nth(i);

      // Check keyboard navigation
      await element.focus();

      // Verify focus is visible
      const hasFocusIndicator = await element.evaluate(el => {
        const styles = getComputedStyle(el);
        return styles.outline !== 'none' ||
               styles.boxShadow !== 'none' ||
               styles.outlineOffset !== '0px';
      });

      if (!hasFocusIndicator) {
        console.warn(`Element at index ${i} missing focus indicator`);
      }
    }
  });

  test('validates performance impact', async ({ page }) => {
    // Monitor performance metrics
    const performanceMetrics = await page.evaluate(() => {
      return JSON.parse(JSON.stringify(performance.getEntriesByType('navigation')[0]));
    });

    // Ensure the page loads within acceptable time
    expect(performanceMetrics.loadEventEnd - performanceMetrics.loadEventStart).toBeLessThan(3000);

    // Check for layout shifts
    const layoutShifts = await page.evaluate(() => {
      return new Promise((resolve) => {
        let totalShift = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
              totalShift += entry.value;
            }
          }
          resolve(totalShift);
        }).observe({ entryTypes: ['layout-shift'] });

        setTimeout(() => resolve(totalShift), 2000);
      });
    });

    // Cumulative Layout Shift should be minimal
    expect(layoutShifts).toBeLessThan(0.1);
  });
});

test.describe('Component Integration Tests', () => {
  test('validates component composition', async ({ page }) => {
    await page.goto('/internal-docs');
    const validator = createDesignValidator(page);

    // Test that components work well together
    const compositeSelectors = [
      '[data-testid*="hero"]', // Hero sections
      '[data-testid*="navigation"]', // Navigation components
      '[data-testid*="footer"]', // Footer components
      'form', // Form compositions
    ];

    for (const selector of compositeSelectors) {
      const elements = page.locator(selector);

      if (await elements.count() > 0) {
        const componentName = selector.replace(/[^\w]/g, '-');

        // Test the composite component
        await validator.captureVisualRegression(`composite-${componentName}`, {
          selector,
        });

        // Validate design system consistency within the component
        await validateDesignSystem(page, {
          checkColors: true,
          checkTypography: true,
          checkSpacing: true,
          checkAccessibility: true,
        });
      }
    }
  });

  test('validates cross-page consistency', async ({ page }) => {
    const pages = [
      '/',
      '/services',
      '/pricing',
      '/connectivity',
      '/cloud',
      '/resources',
    ];

    const validator = createDesignValidator(page);

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');

      // Capture full page for consistency comparison
      const pageName = pagePath === '/' ? 'home' : pagePath.replace('/', '');
      await validator.captureVisualRegression(`page-${pageName}`, {
        fullPage: true,
      });

      // Validate design system compliance on each page
      await validateDesignSystem(page);
    }
  });
});