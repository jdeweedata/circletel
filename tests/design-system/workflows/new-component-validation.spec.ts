/**
 * New Component/Page Validation Workflow
 *
 * Automated tests that run when new components or pages are added
 * to ensure they follow design system guidelines
 */

import { test, expect } from '@playwright/test';
import { validateDesignSystem, createDesignValidator } from '../utils/design-validation';

test.describe('New Component Validation Workflow', () => {
  // This test runs against new components/pages to validate design system compliance
  test('validates new component against design system standards', async ({ page }) => {
    // Get the component URL from environment variable or test parameter
    const componentUrl = process.env.COMPONENT_URL || '/internal-docs';
    const componentName = process.env.COMPONENT_NAME || 'unknown-component';

    await page.goto(componentUrl);
    await page.waitForLoadState('networkidle');

    const validator = createDesignValidator(page);

    // Run comprehensive design system validation
    await validateDesignSystem(page, {
      checkColors: true,
      checkTypography: true,
      checkSpacing: true,
      checkAccessibility: true,
      checkResponsiveness: true,
      visualRegression: true,
    });

    // Take baseline screenshots for new components
    await validator.captureVisualRegression(`new-component-${componentName}`, {
      fullPage: true,
    });

    // Validate specific component requirements
    await test.step('Component-specific validation', async () => {
      // Check for proper data-testid attributes
      const componentElements = page.locator(`[data-testid*="${componentName}"], [class*="${componentName}"]`);
      const hasTestIds = await componentElements.count() > 0;

      if (hasTestIds) {
        // Validate the specific component
        const firstComponent = componentElements.first();

        // Check for proper ARIA attributes
        const hasAriaLabel = await firstComponent.getAttribute('aria-label');
        const hasRole = await firstComponent.getAttribute('role');
        const hasAriaLabelledBy = await firstComponent.getAttribute('aria-labelledby');

        if (!hasAriaLabel && !hasRole && !hasAriaLabelledBy) {
          console.warn(`Component ${componentName} may need accessibility attributes`);
        }

        // Visual regression for the specific component
        await validator.captureVisualRegression(`component-${componentName}`, {
          selector: `[data-testid*="${componentName}"], [class*="${componentName}"]`,
        });
      }
    });

    // Validate responsive behavior
    await test.step('Responsive validation', async () => {
      const breakpoints = [
        { name: 'mobile', width: 375, height: 667 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'desktop', width: 1440, height: 900 },
      ];

      for (const breakpoint of breakpoints) {
        await page.setViewportSize({
          width: breakpoint.width,
          height: breakpoint.height,
        });

        await page.waitForTimeout(300);

        await validator.captureVisualRegression(`${componentName}-${breakpoint.name}`, {
          fullPage: true,
        });
      }
    });

    // Performance check
    await test.step('Performance validation', async () => {
      const performanceMetrics = await page.evaluate(() => {
        return JSON.parse(JSON.stringify(performance.getEntriesByType('navigation')[0]));
      });

      // Component should not significantly impact load time
      const loadTime = performanceMetrics.loadEventEnd - performanceMetrics.loadEventStart;
      expect(loadTime).toBeLessThan(5000); // 5 seconds max

      // Check for layout shifts
      const layoutShifts = await page.evaluate(() => {
        return new Promise((resolve) => {
          let totalShift = 0;
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
                totalShift += entry.value;
              }
            }
          });

          observer.observe({ entryTypes: ['layout-shift'] });

          setTimeout(() => {
            observer.disconnect();
            resolve(totalShift);
          }, 2000);
        });
      });

      expect(layoutShifts).toBeLessThan(0.1); // CLS should be minimal
    });
  });

  test('validates new page against design system standards', async ({ page }) => {
    const pageUrl = process.env.PAGE_URL || '/';
    const pageName = process.env.PAGE_NAME || 'unknown-page';

    await page.goto(pageUrl);
    await page.waitForLoadState('networkidle');

    const validator = createDesignValidator(page);

    // Full page validation
    await validateDesignSystem(page, {
      checkColors: true,
      checkTypography: true,
      checkSpacing: true,
      checkAccessibility: true,
      checkResponsiveness: true,
      visualRegression: true,
    });

    // Page-specific checks
    await test.step('Page structure validation', async () => {
      // Check for proper HTML structure
      const hasHeader = await page.locator('header, [role="banner"]').count() > 0;
      const hasMain = await page.locator('main, [role="main"]').count() > 0;
      const hasFooter = await page.locator('footer, [role="contentinfo"]').count() > 0;

      expect(hasHeader).toBe(true);
      expect(hasMain).toBe(true);
      expect(hasFooter).toBe(true);

      // Check for proper page title
      const title = await page.title();
      expect(title).toContain('CircleTel');
      expect(title.length).toBeGreaterThan(10);

      // Check for meta description
      const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
      expect(metaDescription).toBeTruthy();
      expect(metaDescription?.length).toBeGreaterThan(50);
    });

    // SEO and meta validation
    await test.step('SEO validation', async () => {
      // Check for proper heading hierarchy
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1); // Should have exactly one H1

      const h1Text = await page.locator('h1').first().textContent();
      expect(h1Text?.length).toBeGreaterThan(5);

      // Check for Open Graph tags
      const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
      const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');

      expect(ogTitle).toBeTruthy();
      expect(ogDescription).toBeTruthy();
    });

    // Navigation validation
    await test.step('Navigation validation', async () => {
      const navLinks = page.locator('nav a, [role="navigation"] a');
      const linkCount = await navLinks.count();

      expect(linkCount).toBeGreaterThan(3); // Should have multiple nav links

      // Check that navigation links are properly accessible
      for (let i = 0; i < Math.min(linkCount, 10); i++) {
        const link = navLinks.nth(i);
        const href = await link.getAttribute('href');
        const text = await link.textContent();

        expect(href).toBeTruthy();
        expect(text?.trim().length).toBeGreaterThan(0);
      }
    });

    // Brand compliance for pages
    await test.step('Brand compliance validation', async () => {
      await validator.validateBrandCompliance();

      // Check for CircleTel logo
      const logo = page.locator('[data-testid="logo"], img[alt*="CircleTel"], .logo');
      const hasLogo = await logo.count() > 0;

      expect(hasLogo).toBe(true);

      // Check for brand colors usage
      const brandElements = page.locator('[class*="circleTel"], [style*="#F5831F"]');
      const hasBrandColors = await brandElements.count() > 0;

      expect(hasBrandColors).toBe(true);
    });

    // Performance validation for pages
    await test.step('Page performance validation', async () => {
      // Check for image optimization
      const images = page.locator('img');
      const imageCount = await images.count();

      for (let i = 0; i < Math.min(imageCount, 10); i++) {
        const img = images.nth(i);
        const src = await img.getAttribute('src');
        const alt = await img.getAttribute('alt');

        // Images should have alt text
        expect(alt).toBeTruthy();

        // Images should be optimized (check for modern formats)
        if (src) {
          const isOptimized = src.includes('.webp') || src.includes('.avif') || src.includes('optimize');
          if (!isOptimized) {
            console.warn(`Image ${src} may not be optimized`);
          }
        }
      }

      // Check for lazy loading
      const lazyImages = page.locator('img[loading="lazy"]');
      const lazyImageCount = await lazyImages.count();

      if (imageCount > 3 && lazyImageCount === 0) {
        console.warn('Consider implementing lazy loading for images');
      }
    });

    // Mobile-first validation
    await test.step('Mobile-first validation', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(300);

      // Check for mobile menu
      const mobileMenu = page.locator('[data-testid*="mobile"], .mobile-menu, .hamburger');
      const hasMobileMenu = await mobileMenu.count() > 0;

      if (linkCount > 5 && !hasMobileMenu) {
        console.warn('Consider implementing mobile navigation for complex menus');
      }

      // Check touch targets
      const touchTargets = page.locator('button, a, input, [role="button"]');
      const touchTargetCount = await touchTargets.count();

      for (let i = 0; i < Math.min(touchTargetCount, 10); i++) {
        const target = touchTargets.nth(i);
        const boundingBox = await target.boundingBox();

        if (boundingBox) {
          const minSize = 44; // 44px minimum touch target
          expect(boundingBox.width).toBeGreaterThanOrEqual(minSize);
          expect(boundingBox.height).toBeGreaterThanOrEqual(minSize);
        }
      }
    });
  });
});

test.describe('Design System Regression Tests', () => {
  test('detects design system violations in existing components', async ({ page }) => {
    await page.goto('/internal-docs');
    await page.waitForLoadState('networkidle');

    const validator = createDesignValidator(page);

    // Check for components that don't use design system
    const violationReport = await page.evaluate(() => {
      const violations = [];
      const components = document.querySelectorAll('[class*="component"], [data-testid]');

      components.forEach(component => {
        const styles = getComputedStyle(component);
        const className = component.className;

        // Check for inline styles (potential design system bypass)
        if (component.style.length > 0) {
          violations.push({
            type: 'inline-styles',
            element: className,
            message: 'Component uses inline styles instead of design system classes'
          });
        }

        // Check for non-standard font families
        const fontFamily = styles.fontFamily;
        if (fontFamily && !fontFamily.includes('Inter') && !fontFamily.includes('Space Mono')) {
          violations.push({
            type: 'font-family',
            element: className,
            value: fontFamily,
            message: 'Component uses non-standard font family'
          });
        }
      });

      return violations;
    });

    // Report but don't fail on existing violations
    if (violationReport.length > 0) {
      console.log('Design system violations detected:', violationReport.slice(0, 20));
    }

    // Capture current state for comparison
    await validator.captureVisualRegression('design-system-baseline', {
      fullPage: true,
    });
  });

  test('validates design system documentation is up to date', async ({ page }) => {
    await page.goto('/internal-docs');
    await page.waitForLoadState('networkidle');

    // Check that all design system components are documented
    const documentedComponents = await page.evaluate(() => {
      const componentSections = document.querySelectorAll('[data-testid*="component"], .component-example');
      return Array.from(componentSections).map(section => {
        const title = section.querySelector('h1, h2, h3, h4, h5, h6')?.textContent;
        const hasExample = section.querySelector('.example, [data-testid*="example"]') !== null;
        const hasCode = section.querySelector('code, pre') !== null;

        return {
          title,
          hasExample,
          hasCode,
        };
      });
    });

    // Each documented component should have examples and code
    documentedComponents.forEach(component => {
      if (component.title) {
        expect(component.hasExample).toBe(true);
        expect(component.hasCode).toBe(true);
      }
    });

    expect(documentedComponents.length).toBeGreaterThan(5); // Should have multiple components documented
  });
});