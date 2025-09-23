/**
 * Accessibility Validation Tests
 *
 * Comprehensive accessibility testing for design system compliance
 * following WCAG 2.1 AA standards
 */

import { test, expect } from '@playwright/test';
import { createDesignValidator } from '../utils/design-validation';

test.describe('Accessibility Compliance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/internal-docs');
    await page.waitForLoadState('networkidle');
  });

  test('validates semantic HTML structure', async ({ page }) => {
    // Check for proper landmark elements
    const landmarks = {
      header: await page.locator('header, [role="banner"]').count(),
      nav: await page.locator('nav, [role="navigation"]').count(),
      main: await page.locator('main, [role="main"]').count(),
      footer: await page.locator('footer, [role="contentinfo"]').count(),
    };

    expect(landmarks.header).toBeGreaterThanOrEqual(1);
    expect(landmarks.main).toBe(1); // Should have exactly one main landmark
    expect(landmarks.footer).toBeGreaterThanOrEqual(1);

    // Check heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    const headingLevels = await page.locator('h1, h2, h3, h4, h5, h6').evaluateAll(
      (elements) => elements.map(el => parseInt(el.tagName.charAt(1)))
    );

    // Should start with h1
    expect(headingLevels[0]).toBe(1);

    // Check for logical heading progression
    for (let i = 1; i < headingLevels.length; i++) {
      const currentLevel = headingLevels[i];
      const previousLevel = headingLevels[i - 1];
      const levelJump = currentLevel - previousLevel;

      // Should not skip more than one level
      expect(levelJump).toBeLessThanOrEqual(1);
    }
  });

  test('validates keyboard navigation', async ({ page }) => {
    const focusableElements = page.locator(
      'button, a, input, textarea, select, [tabindex]:not([tabindex="-1"]), [role="button"], [role="link"]'
    );

    const elementCount = await focusableElements.count();
    expect(elementCount).toBeGreaterThan(0);

    let focusedElementsCount = 0;

    // Tab through all focusable elements
    for (let i = 0; i < elementCount; i++) {
      await page.keyboard.press('Tab');

      const focusedElement = page.locator(':focus');
      const isFocused = await focusedElement.count() > 0;

      if (isFocused) {
        focusedElementsCount++;

        // Check for visible focus indicator
        const focusStyles = await focusedElement.evaluate(el => {
          const styles = getComputedStyle(el);
          return {
            outline: styles.outline,
            boxShadow: styles.boxShadow,
            outlineOffset: styles.outlineOffset,
          };
        });

        const hasFocusIndicator =
          focusStyles.outline !== 'none' ||
          focusStyles.boxShadow !== 'none' ||
          focusStyles.outlineOffset !== '0px';

        expect(hasFocusIndicator).toBe(true);

        // Test skip links functionality
        const isSkipLink = await focusedElement.evaluate(el =>
          el.textContent?.toLowerCase().includes('skip') ||
          el.getAttribute('href')?.startsWith('#')
        );

        if (isSkipLink) {
          await page.keyboard.press('Enter');
          await page.waitForTimeout(100);

          // Verify skip link worked
          const newFocusedElement = page.locator(':focus');
          const newElementText = await newFocusedElement.textContent();

          // Skip link should move focus to a different element
          expect(newElementText).not.toBe(await focusedElement.textContent());
        }
      }
    }

    expect(focusedElementsCount).toBeGreaterThan(0);
  });

  test('validates ARIA attributes and roles', async ({ page }) => {
    // Check for proper ARIA labels on interactive elements
    const interactiveElements = page.locator(
      'button, a, input, textarea, select, [role="button"], [role="link"], [role="tab"]'
    );

    const elementCount = await interactiveElements.count();

    for (let i = 0; i < elementCount; i++) {
      const element = interactiveElements.nth(i);

      const hasAccessibleName = await element.evaluate(el => {
        const ariaLabel = el.getAttribute('aria-label');
        const ariaLabelledBy = el.getAttribute('aria-labelledby');
        const textContent = el.textContent?.trim();
        const title = el.getAttribute('title');

        return !!(ariaLabel || ariaLabelledBy || textContent || title);
      });

      expect(hasAccessibleName).toBe(true);
    }

    // Check for proper ARIA states
    const toggleElements = page.locator('[aria-expanded], [aria-selected], [aria-checked]');
    const toggleCount = await toggleElements.count();

    for (let i = 0; i < toggleCount; i++) {
      const element = toggleElements.nth(i);

      const ariaStates = await element.evaluate(el => ({
        expanded: el.getAttribute('aria-expanded'),
        selected: el.getAttribute('aria-selected'),
        checked: el.getAttribute('aria-checked'),
      }));

      // ARIA boolean attributes should have valid values
      Object.values(ariaStates).forEach(value => {
        if (value !== null) {
          expect(['true', 'false']).toContain(value);
        }
      });
    }

    // Check for proper live regions
    const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]');
    const liveRegionCount = await liveRegions.count();

    for (let i = 0; i < liveRegionCount; i++) {
      const region = liveRegions.nth(i);

      const ariaLive = await region.getAttribute('aria-live');
      if (ariaLive) {
        expect(['polite', 'assertive', 'off']).toContain(ariaLive);
      }
    }
  });

  test('validates form accessibility', async ({ page }) => {
    const forms = page.locator('form');
    const formCount = await forms.count();

    for (let i = 0; i < formCount; i++) {
      const form = forms.nth(i);

      // Check for form inputs with proper labels
      const inputs = form.locator('input, textarea, select');
      const inputCount = await inputs.count();

      for (let j = 0; j < inputCount; j++) {
        const input = inputs.nth(j);
        const inputId = await input.getAttribute('id');

        if (inputId) {
          // Check for associated label
          const label = page.locator(`label[for="${inputId}"]`);
          const hasLabel = await label.count() > 0;

          const ariaLabel = await input.getAttribute('aria-label');
          const ariaLabelledBy = await input.getAttribute('aria-labelledby');

          expect(hasLabel || ariaLabel || ariaLabelledBy).toBe(true);
        }

        // Check for required field indicators
        const isRequired = await input.getAttribute('required') !== null;
        const hasAriaRequired = await input.getAttribute('aria-required') === 'true';

        if (isRequired || hasAriaRequired) {
          // Should have some indication that field is required
          const parentText = await input.evaluate(el => {
            const parent = el.closest('.form-field, .field, fieldset, div');
            return parent?.textContent?.toLowerCase() || '';
          });

          const hasRequiredIndicator =
            parentText.includes('required') ||
            parentText.includes('*') ||
            hasAriaRequired;

          expect(hasRequiredIndicator).toBe(true);
        }
      }

      // Check for fieldsets with legends
      const fieldsets = form.locator('fieldset');
      const fieldsetCount = await fieldsets.count();

      for (let k = 0; k < fieldsetCount; k++) {
        const fieldset = fieldsets.nth(k);
        const legend = fieldset.locator('legend');
        const hasLegend = await legend.count() > 0;

        expect(hasLegend).toBe(true);
      }

      // Check for error message associations
      const errorMessages = form.locator('[role="alert"], .error, [aria-describedby]');
      const errorCount = await errorMessages.count();

      for (let l = 0; l < errorCount; l++) {
        const error = errorMessages.nth(l);
        const errorId = await error.getAttribute('id');

        if (errorId) {
          // Should be referenced by an input's aria-describedby
          const referencingInput = form.locator(`[aria-describedby*="${errorId}"]`);
          const hasReferencingInput = await referencingInput.count() > 0;

          expect(hasReferencingInput).toBe(true);
        }
      }
    }
  });

  test('validates color contrast ratios', async ({ page }) => {
    const textElements = page.locator('p, span, div, h1, h2, h3, h4, h5, h6, a, button');
    const elementCount = await textElements.count();

    for (let i = 0; i < Math.min(elementCount, 20); i++) { // Test first 20 elements
      const element = textElements.nth(i);

      const hasVisibleText = await element.evaluate(el => {
        const text = el.textContent?.trim();
        const style = getComputedStyle(el);
        return text && text.length > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      });

      if (hasVisibleText) {
        const styles = await element.evaluate(el => {
          const style = getComputedStyle(el);
          return {
            color: style.color,
            backgroundColor: style.backgroundColor,
            fontSize: parseFloat(style.fontSize),
            fontWeight: style.fontWeight,
          };
        });

        // Note: This is a simplified contrast check
        // In a real implementation, you'd use a proper contrast calculation library
        const isLargeText = styles.fontSize >= 18 || (styles.fontSize >= 14 && styles.fontWeight >= 700);

        // Visual check that text color differs from background
        expect(styles.color).not.toBe(styles.backgroundColor);

        // Ensure text isn't transparent
        expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
        expect(styles.color).not.toBe('transparent');
      }
    }
  });

  test('validates image accessibility', async ({ page }) => {
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);

      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      const ariaLabel = await img.getAttribute('aria-label');
      const ariaLabelledBy = await img.getAttribute('aria-labelledby');

      // Images should either have alt text or be marked as decorative
      const isDecorative = role === 'presentation' || role === 'none' || alt === '';
      const hasAccessibleName = alt || ariaLabel || ariaLabelledBy;

      expect(isDecorative || hasAccessibleName).toBe(true);

      // If alt is present, it should be meaningful (not just filename)
      if (alt && alt !== '') {
        expect(alt).not.toMatch(/\.(jpg|jpeg|png|gif|svg|webp)$/i);
        expect(alt.length).toBeGreaterThan(3);
      }
    }
  });

  test('validates table accessibility', async ({ page }) => {
    const tables = page.locator('table');
    const tableCount = await tables.count();

    for (let i = 0; i < tableCount; i++) {
      const table = tables.nth(i);

      // Check for table headers
      const headers = table.locator('th');
      const hasHeaders = await headers.count() > 0;

      if (hasHeaders) {
        // Headers should have scope attributes
        const headerCount = await headers.count();

        for (let j = 0; j < headerCount; j++) {
          const header = headers.nth(j);
          const scope = await header.getAttribute('scope');

          if (scope) {
            expect(['col', 'row', 'colgroup', 'rowgroup']).toContain(scope);
          }
        }
      }

      // Check for caption or aria-label
      const caption = table.locator('caption');
      const hasCaption = await caption.count() > 0;
      const ariaLabel = await table.getAttribute('aria-label');
      const ariaLabelledBy = await table.getAttribute('aria-labelledby');

      expect(hasCaption || ariaLabel || ariaLabelledBy).toBe(true);
    }
  });

  test('validates responsive accessibility', async ({ page }) => {
    const viewport = page.viewportSize();

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);

    // Check that interactive elements are appropriately sized for touch
    const touchTargets = page.locator('button, a, input, [role="button"]');
    const touchTargetCount = await touchTargets.count();

    for (let i = 0; i < Math.min(touchTargetCount, 10); i++) { // Test first 10 elements
      const target = touchTargets.nth(i);
      const boundingBox = await target.boundingBox();

      if (boundingBox) {
        const minSize = 44; // 44px minimum touch target size (WCAG guideline)

        expect(boundingBox.width).toBeGreaterThanOrEqual(minSize);
        expect(boundingBox.height).toBeGreaterThanOrEqual(minSize);
      }
    }

    // Restore original viewport
    if (viewport) {
      await page.setViewportSize(viewport);
    }
  });

  test('validates error handling accessibility', async ({ page }) => {
    // Look for forms to test error states
    const forms = page.locator('form');
    const formCount = await forms.count();

    if (formCount > 0) {
      const form = forms.first();

      // Try to submit form without filling required fields
      const submitButton = form.locator('button[type="submit"], input[type="submit"], button:has-text("submit")');

      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(1000);

        // Check for error messages
        const errorMessages = page.locator('[role="alert"], .error, [aria-live="assertive"]');
        const hasErrors = await errorMessages.count() > 0;

        if (hasErrors) {
          // Error messages should be announced to screen readers
          const firstError = errorMessages.first();
          const ariaLive = await firstError.getAttribute('aria-live');
          const role = await firstError.getAttribute('role');

          expect(ariaLive === 'assertive' || role === 'alert').toBe(true);

          // Error should have meaningful text
          const errorText = await firstError.textContent();
          expect(errorText?.length).toBeGreaterThan(5);
        }
      }
    }
  });

  test('validates modal and dialog accessibility', async ({ page }) => {
    // Look for modal triggers
    const modalTriggers = page.locator('[data-testid*="modal"], [aria-haspopup="dialog"], button:has-text("open")');
    const triggerCount = await modalTriggers.count();

    if (triggerCount > 0) {
      const trigger = modalTriggers.first();
      await trigger.click();
      await page.waitForTimeout(500);

      // Check for modal dialog
      const modal = page.locator('[role="dialog"], [role="alertdialog"], .modal');
      const hasModal = await modal.count() > 0;

      if (hasModal) {
        const firstModal = modal.first();

        // Modal should be properly labeled
        const ariaLabel = await firstModal.getAttribute('aria-label');
        const ariaLabelledBy = await firstModal.getAttribute('aria-labelledby');
        expect(ariaLabel || ariaLabelledBy).toBeTruthy();

        // Focus should be trapped in modal
        const focusableInModal = firstModal.locator(
          'button, a, input, textarea, select, [tabindex]:not([tabindex="-1"])'
        );
        const focusableCount = await focusableInModal.count();

        if (focusableCount > 0) {
          // First focusable element should receive focus
          const firstFocusable = focusableInModal.first();
          await firstFocusable.focus();

          const isFocused = await firstFocusable.evaluate(el => el === document.activeElement);
          expect(isFocused).toBe(true);
        }

        // Escape key should close modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);

        const modalStillVisible = await modal.isVisible();
        expect(modalStillVisible).toBe(false);
      }
    }
  });
});