/**
 * Design System Validation Utilities
 *
 * Playwright utilities for validating design system consistency
 * across components, pages, and features.
 */

import { Page, Locator, expect } from '@playwright/test';
import { tokens } from '@/design-system/tokens';

export interface DesignValidationOptions {
  checkColors?: boolean;
  checkTypography?: boolean;
  checkSpacing?: boolean;
  checkAccessibility?: boolean;
  checkResponsiveness?: boolean;
  visualRegression?: boolean;
}

export class DesignSystemValidator {
  constructor(private page: Page) {}

  /**
   * Validate color usage against design tokens
   */
  async validateColors(selector?: string): Promise<void> {
    const elements = selector
      ? await this.page.locator(selector).all()
      : await this.page.locator('*').all();

    for (const element of elements) {
      const computedStyle = await element.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          color: style.color,
          backgroundColor: style.backgroundColor,
          borderColor: style.borderColor,
        };
      });

      // Validate against brand colors
      await this.validateColorToken(computedStyle.color, 'color');
      await this.validateColorToken(computedStyle.backgroundColor, 'backgroundColor');
      await this.validateColorToken(computedStyle.borderColor, 'borderColor');
    }
  }

  /**
   * Validate typography usage against design tokens
   */
  async validateTypography(selector?: string): Promise<void> {
    const elements = selector
      ? await this.page.locator(selector).all()
      : await this.page.locator('h1, h2, h3, h4, h5, h6, p, span, div').all();

    for (const element of elements) {
      const computedStyle = await element.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          lineHeight: style.lineHeight,
          letterSpacing: style.letterSpacing,
        };
      });

      // Validate font family usage
      const expectedFonts = ['Inter', 'Space Mono', 'sans-serif', 'monospace'];
      const actualFont = computedStyle.fontFamily.toLowerCase();
      const isValidFont = expectedFonts.some(font =>
        actualFont.includes(font.toLowerCase())
      );

      if (!isValidFont) {
        console.warn(`Invalid font family detected: ${computedStyle.fontFamily}`);
      }

      // Validate font size against tokens
      await this.validateFontSize(computedStyle.fontSize);
    }
  }

  /**
   * Validate spacing usage against design tokens
   */
  async validateSpacing(selector?: string): Promise<void> {
    const elements = selector
      ? await this.page.locator(selector).all()
      : await this.page.locator('*').all();

    for (const element of elements) {
      const computedStyle = await element.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          margin: [style.marginTop, style.marginRight, style.marginBottom, style.marginLeft],
          padding: [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft],
          gap: style.gap,
        };
      });

      // Validate spacing values against tokens
      [...computedStyle.margin, ...computedStyle.padding, computedStyle.gap]
        .filter(value => value && value !== '0px')
        .forEach(value => this.validateSpacingValue(value));
    }
  }

  /**
   * Validate accessibility compliance
   */
  async validateAccessibility(): Promise<void> {
    // Check for proper heading hierarchy
    await this.validateHeadingHierarchy();

    // Check for alt text on images
    await this.validateImageAltText();

    // Check for proper form labels
    await this.validateFormLabels();

    // Check color contrast
    await this.validateColorContrast();

    // Check focus indicators
    await this.validateFocusIndicators();
  }

  /**
   * Validate responsive design consistency
   */
  async validateResponsiveness(): Promise<void> {
    const breakpoints = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1440, height: 900 },
      { name: 'wide', width: 1920, height: 1080 },
    ];

    for (const breakpoint of breakpoints) {
      await this.page.setViewportSize({
        width: breakpoint.width,
        height: breakpoint.height
      });

      // Wait for any responsive changes to complete
      await this.page.waitForTimeout(300);

      // Check for horizontal scrollbars (unwanted overflow)
      const hasHorizontalScroll = await this.page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      if (hasHorizontalScroll) {
        console.warn(`Horizontal scroll detected at ${breakpoint.name} breakpoint`);
      }

      // Validate that interactive elements are appropriately sized
      await this.validateTouchTargets();
    }
  }

  /**
   * Take visual regression screenshots
   */
  async captureVisualRegression(name: string, options?: {
    fullPage?: boolean;
    selector?: string;
  }): Promise<void> {
    const screenshotOptions = {
      fullPage: options?.fullPage ?? false,
      animations: 'disabled' as const,
    };

    if (options?.selector) {
      await expect(this.page.locator(options.selector)).toHaveScreenshot(
        `${name}.png`,
        screenshotOptions
      );
    } else {
      await expect(this.page).toHaveScreenshot(
        `${name}.png`,
        screenshotOptions
      );
    }
  }

  /**
   * Validate CircleTel brand compliance
   */
  async validateBrandCompliance(): Promise<void> {
    // Check for proper logo usage
    const logos = this.page.locator('[data-testid="logo"], .logo, img[alt*="CircleTel"]');
    const logoCount = await logos.count();

    if (logoCount > 0) {
      for (let i = 0; i < logoCount; i++) {
        const logo = logos.nth(i);
        const src = await logo.getAttribute('src');

        if (src && !src.includes('circletel')) {
          console.warn('Logo source may not be CircleTel branded');
        }
      }
    }

    // Check for brand color usage
    const primaryColorElements = this.page.locator('[class*="circleTel-orange"], [style*="#F5831F"]');
    const hasBrandColors = await primaryColorElements.count() > 0;

    if (!hasBrandColors) {
      console.warn('No CircleTel brand colors detected on page');
    }
  }

  // Private validation methods

  private async validateColorToken(color: string, property: string): Promise<void> {
    if (!color || color === 'rgba(0, 0, 0, 0)' || color === 'transparent') return;

    // Convert to hex if possible for comparison
    const hexColor = await this.rgbToHex(color);

    // Check against brand colors
    const brandColors = Object.values(tokens.colors.brand);
    const stateColors = Object.values(tokens.colors.states);
    const validColors = [...brandColors, ...stateColors];

    if (hexColor && !validColors.includes(hexColor.toUpperCase())) {
      console.warn(`Non-token color detected for ${property}: ${color}`);
    }
  }

  private async validateFontSize(fontSize: string): Promise<void> {
    if (!fontSize) return;

    const validSizes = Object.values(tokens.typography.fontSize);
    const sizeInPx = parseFloat(fontSize) + 'px';
    const sizeInRem = (parseFloat(fontSize) / 16) + 'rem';

    if (!validSizes.includes(sizeInRem) && !validSizes.includes(sizeInPx)) {
      console.warn(`Non-token font size detected: ${fontSize}`);
    }
  }

  private validateSpacingValue(spacing: string): void {
    if (!spacing || spacing === '0px') return;

    const validSpacing = Object.values(tokens.spacing);
    const spacingInPx = spacing;
    const spacingInRem = (parseFloat(spacing) / 16) + 'rem';

    if (!validSpacing.includes(spacingInPx) && !validSpacing.includes(spacingInRem)) {
      console.warn(`Non-token spacing detected: ${spacing}`);
    }
  }

  private async validateHeadingHierarchy(): Promise<void> {
    const headings = await this.page.locator('h1, h2, h3, h4, h5, h6').all();
    let lastLevel = 0;

    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
      const level = parseInt(tagName.charAt(1));

      if (level > lastLevel + 1) {
        console.warn(`Heading hierarchy skip detected: ${tagName} after h${lastLevel}`);
      }

      lastLevel = level;
    }
  }

  private async validateImageAltText(): Promise<void> {
    const images = await this.page.locator('img').all();

    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const isDecorative = await img.getAttribute('role') === 'presentation';

      if (!alt && !isDecorative) {
        console.warn('Image missing alt text');
      }
    }
  }

  private async validateFormLabels(): Promise<void> {
    const inputs = await this.page.locator('input, textarea, select').all();

    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');

      if (id) {
        const label = this.page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;

        if (!hasLabel && !ariaLabel && !ariaLabelledBy) {
          console.warn('Form input missing label');
        }
      }
    }
  }

  private async validateColorContrast(): Promise<void> {
    const textElements = await this.page.locator('p, span, div, h1, h2, h3, h4, h5, h6, a, button').all();

    for (const element of textElements) {
      const hasText = await element.evaluate(el => el.textContent?.trim().length > 0);

      if (hasText) {
        const styles = await element.evaluate(el => {
          const style = getComputedStyle(el);
          return {
            color: style.color,
            backgroundColor: style.backgroundColor,
            fontSize: parseFloat(style.fontSize),
          };
        });

        // Basic contrast check (simplified - in real implementation,
        // you'd use a proper contrast calculation library)
        if (styles.color === styles.backgroundColor) {
          console.warn('Potential contrast issue detected');
        }
      }
    }
  }

  private async validateFocusIndicators(): Promise<void> {
    const focusableElements = await this.page.locator(
      'button, a, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    ).all();

    for (const element of focusableElements) {
      await element.focus();

      const focusStyles = await element.evaluate(el => {
        const style = getComputedStyle(el);
        return {
          outline: style.outline,
          outlineOffset: style.outlineOffset,
          boxShadow: style.boxShadow,
        };
      });

      const hasFocusIndicator =
        focusStyles.outline !== 'none' ||
        focusStyles.boxShadow !== 'none' ||
        focusStyles.outlineOffset !== '0px';

      if (!hasFocusIndicator) {
        console.warn('Interactive element missing focus indicator');
      }
    }
  }

  private async validateTouchTargets(): Promise<void> {
    const interactiveElements = await this.page.locator(
      'button, a, input, [role="button"], [onclick]'
    ).all();

    for (const element of interactiveElements) {
      const boundingBox = await element.boundingBox();

      if (boundingBox) {
        const minSize = 44; // 44px minimum touch target size

        if (boundingBox.width < minSize || boundingBox.height < minSize) {
          console.warn(`Touch target too small: ${boundingBox.width}x${boundingBox.height}`);
        }
      }
    }
  }

  private async rgbToHex(rgb: string): Promise<string | null> {
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return null;

    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
  }
}

/**
 * Helper function to create a design system validator
 */
export function createDesignValidator(page: Page): DesignSystemValidator {
  return new DesignSystemValidator(page);
}

/**
 * Run comprehensive design system validation
 */
export async function validateDesignSystem(
  page: Page,
  options: DesignValidationOptions = {}
): Promise<void> {
  const validator = createDesignValidator(page);

  const {
    checkColors = true,
    checkTypography = true,
    checkSpacing = true,
    checkAccessibility = true,
    checkResponsiveness = true,
    visualRegression = false,
  } = options;

  if (checkColors) {
    await validator.validateColors();
  }

  if (checkTypography) {
    await validator.validateTypography();
  }

  if (checkSpacing) {
    await validator.validateSpacing();
  }

  if (checkAccessibility) {
    await validator.validateAccessibility();
  }

  if (checkResponsiveness) {
    await validator.validateResponsiveness();
  }

  if (visualRegression) {
    await validator.captureVisualRegression('full-page', { fullPage: true });
  }

  // Always validate brand compliance
  await validator.validateBrandCompliance();
}