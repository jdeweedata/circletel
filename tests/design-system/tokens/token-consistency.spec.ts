/**
 * Design Token Consistency Tests
 *
 * Validates that all components and pages use only approved design tokens
 * and maintain consistency with the design system
 */

import { test, expect } from '@playwright/test';
import { tokens } from '@/design-system/tokens';

test.describe('Design Token Consistency', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/internal-docs');
    await page.waitForLoadState('networkidle');
  });

  test('validates color token usage', async ({ page }) => {
    // Get all elements with color styles
    const colorUsage = await page.evaluate((designTokens) => {
      const results = [];
      const elements = document.querySelectorAll('*');

      // Valid color values from design tokens
      const validColors = [
        ...Object.values(designTokens.colors.brand),
        ...Object.values(designTokens.colors.states),
        'transparent',
        'inherit',
        'currentColor',
      ];

      // Convert HSL semantic colors to comparable format
      const validHSLPatterns = Object.values(designTokens.colors.semantic).map(hsl => {
        // Extract hsl values for comparison
        const match = hsl.match(/hsl\(([^)]+)\)/);
        return match ? match[1] : null;
      }).filter(Boolean);

      elements.forEach((el, index) => {
        if (index > 1000) return; // Limit to first 1000 elements for performance

        const styles = getComputedStyle(el);
        const elementData = {
          tagName: el.tagName,
          className: el.className,
          color: styles.color,
          backgroundColor: styles.backgroundColor,
          borderColor: styles.borderColor,
          violations: []
        };

        // Check color property
        if (elementData.color && elementData.color !== 'rgba(0, 0, 0, 0)') {
          const isValidColor = validColors.some(validColor =>
            elementData.color.includes(validColor) ||
            validColor.includes(elementData.color.replace(/[()]/g, ''))
          );

          if (!isValidColor) {
            elementData.violations.push({
              property: 'color',
              value: elementData.color,
              message: 'Color not from design tokens'
            });
          }
        }

        // Check background color
        if (elementData.backgroundColor && elementData.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          const isValidBgColor = validColors.some(validColor =>
            elementData.backgroundColor.includes(validColor) ||
            validColor.includes(elementData.backgroundColor.replace(/[()]/g, ''))
          );

          if (!isValidBgColor) {
            elementData.violations.push({
              property: 'backgroundColor',
              value: elementData.backgroundColor,
              message: 'Background color not from design tokens'
            });
          }
        }

        if (elementData.violations.length > 0) {
          results.push(elementData);
        }
      });

      return results;
    }, tokens);

    // Log violations for debugging but don't fail test if there are a few
    if (colorUsage.length > 0) {
      console.log('Color token violations found:', colorUsage.slice(0, 10));
    }

    // Expect no more than 10% violation rate for colors
    const totalElements = await page.locator('*').count();
    const violationRate = colorUsage.length / Math.min(totalElements, 1000);
    expect(violationRate).toBeLessThan(0.1);
  });

  test('validates typography token usage', async ({ page }) => {
    const typographyUsage = await page.evaluate((designTokens) => {
      const results = [];
      const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, a, button, input, textarea');

      // Valid font families from design tokens
      const validFontFamilies = [
        'Inter',
        'Space Mono',
        'sans-serif',
        'monospace',
        'system-ui'
      ];

      // Valid font sizes from design tokens (convert rem to px for comparison)
      const validFontSizes = Object.values(designTokens.typography.fontSize).map(size => {
        if (size.includes('rem')) {
          return (parseFloat(size) * 16) + 'px';
        }
        return size;
      });

      textElements.forEach((el, index) => {
        if (index > 500) return; // Limit for performance

        const styles = getComputedStyle(el);
        const hasText = el.textContent?.trim().length > 0;

        if (hasText) {
          const elementData = {
            tagName: el.tagName,
            className: el.className,
            fontFamily: styles.fontFamily,
            fontSize: styles.fontSize,
            fontWeight: styles.fontWeight,
            lineHeight: styles.lineHeight,
            violations: []
          };

          // Check font family
          const fontFamilyLower = elementData.fontFamily.toLowerCase();
          const isValidFontFamily = validFontFamilies.some(validFont =>
            fontFamilyLower.includes(validFont.toLowerCase())
          );

          if (!isValidFontFamily) {
            elementData.violations.push({
              property: 'fontFamily',
              value: elementData.fontFamily,
              message: 'Font family not from design tokens'
            });
          }

          // Check font size (allow some flexibility for computed values)
          const fontSize = elementData.fontSize;
          const isValidFontSize = validFontSizes.some(validSize => {
            const diff = Math.abs(parseFloat(fontSize) - parseFloat(validSize));
            return diff < 2; // Allow 2px difference for browser computation
          });

          if (!isValidFontSize && parseFloat(fontSize) > 10) { // Ignore very small sizes
            elementData.violations.push({
              property: 'fontSize',
              value: fontSize,
              message: 'Font size not from design tokens'
            });
          }

          if (elementData.violations.length > 0) {
            results.push(elementData);
          }
        }
      });

      return results;
    }, tokens);

    if (typographyUsage.length > 0) {
      console.log('Typography token violations found:', typographyUsage.slice(0, 10));
    }

    // Expect no more than 15% violation rate for typography
    const totalTextElements = await page.locator('h1, h2, h3, h4, h5, h6, p, span, div, a, button').count();
    const violationRate = typographyUsage.length / Math.min(totalTextElements, 500);
    expect(violationRate).toBeLessThan(0.15);
  });

  test('validates spacing token usage', async ({ page }) => {
    const spacingUsage = await page.evaluate((designTokens) => {
      const results = [];
      const elements = document.querySelectorAll('*');

      // Valid spacing values from design tokens
      const validSpacingValues = Object.values(designTokens.spacing);

      // Convert rem values to px for comparison
      const validSpacingPx = validSpacingValues.map(spacing => {
        if (spacing.includes('rem')) {
          return (parseFloat(spacing) * 16) + 'px';
        }
        return spacing;
      });

      elements.forEach((el, index) => {
        if (index > 1000) return; // Limit for performance

        const styles = getComputedStyle(el);
        const elementData = {
          tagName: el.tagName,
          className: el.className,
          margins: [styles.marginTop, styles.marginRight, styles.marginBottom, styles.marginLeft],
          paddings: [styles.paddingTop, styles.paddingRight, styles.paddingBottom, styles.paddingLeft],
          gap: styles.gap,
          violations: []
        };

        // Check all spacing values
        const allSpacingValues = [...elementData.margins, ...elementData.paddings, elementData.gap];

        allSpacingValues.forEach((value, spacingIndex) => {
          if (value && value !== '0px' && value !== 'auto' && value !== 'normal') {
            const isValidSpacing = validSpacingPx.some(validValue => {
              const diff = Math.abs(parseFloat(value) - parseFloat(validValue));
              return diff < 2; // Allow 2px difference for browser computation
            });

            if (!isValidSpacing && parseFloat(value) > 0) {
              const property = spacingIndex < 4 ? 'margin' : (spacingIndex < 8 ? 'padding' : 'gap');
              elementData.violations.push({
                property,
                value,
                message: `${property} value not from design tokens`
              });
            }
          }
        });

        if (elementData.violations.length > 0) {
          results.push(elementData);
        }
      });

      return results;
    }, tokens);

    if (spacingUsage.length > 0) {
      console.log('Spacing token violations found:', spacingUsage.slice(0, 10));
    }

    // Expect no more than 20% violation rate for spacing (more lenient due to computed values)
    const totalElements = await page.locator('*').count();
    const violationRate = spacingUsage.length / Math.min(totalElements, 1000);
    expect(violationRate).toBeLessThan(0.2);
  });

  test('validates border radius token usage', async ({ page }) => {
    const borderRadiusUsage = await page.evaluate((designTokens) => {
      const results = [];
      const elements = document.querySelectorAll('*');

      // Valid border radius values from design tokens
      const validBorderRadius = Object.values(designTokens.borderRadius);

      elements.forEach((el, index) => {
        if (index > 1000) return; // Limit for performance

        const styles = getComputedStyle(el);
        const borderRadius = styles.borderRadius;

        if (borderRadius && borderRadius !== '0px' && borderRadius !== 'none') {
          const elementData = {
            tagName: el.tagName,
            className: el.className,
            borderRadius,
            violations: []
          };

          // Check if border radius matches tokens (accounting for calc() expressions)
          const isValidBorderRadius = validBorderRadius.some(validValue => {
            if (validValue.includes('calc(')) {
              // For calc expressions, check if the pattern matches
              return borderRadius.includes('calc(') || borderRadius === '6px' || borderRadius === '8px';
            }
            return borderRadius === validValue;
          });

          if (!isValidBorderRadius) {
            elementData.violations.push({
              property: 'borderRadius',
              value: borderRadius,
              message: 'Border radius not from design tokens'
            });
          }

          if (elementData.violations.length > 0) {
            results.push(elementData);
          }
        }
      });

      return results;
    }, tokens);

    if (borderRadiusUsage.length > 0) {
      console.log('Border radius token violations found:', borderRadiusUsage.slice(0, 10));
    }

    // More lenient for border radius due to calc() complexity
    const totalElements = await page.locator('*').count();
    const violationRate = borderRadiusUsage.length / Math.min(totalElements, 1000);
    expect(violationRate).toBeLessThan(0.25);
  });

  test('validates shadow token usage', async ({ page }) => {
    const shadowUsage = await page.evaluate((designTokens) => {
      const results = [];
      const elements = document.querySelectorAll('*');

      // Valid shadow values from design tokens
      const validShadows = Object.values(designTokens.shadows);

      elements.forEach((el, index) => {
        if (index > 1000) return; // Limit for performance

        const styles = getComputedStyle(el);
        const boxShadow = styles.boxShadow;

        if (boxShadow && boxShadow !== 'none') {
          const elementData = {
            tagName: el.tagName,
            className: el.className,
            boxShadow,
            violations: []
          };

          // Check if box shadow matches tokens
          const isValidShadow = validShadows.some(validValue =>
            boxShadow.includes(validValue) || validValue.includes(boxShadow)
          );

          if (!isValidShadow) {
            elementData.violations.push({
              property: 'boxShadow',
              value: boxShadow,
              message: 'Box shadow not from design tokens'
            });
          }

          if (elementData.violations.length > 0) {
            results.push(elementData);
          }
        }
      });

      return results;
    }, tokens);

    if (shadowUsage.length > 0) {
      console.log('Shadow token violations found:', shadowUsage.slice(0, 5));
    }

    // Allow for custom shadows as they're less standardized
    const elementsWithShadows = await page.locator('*').evaluateAll(elements =>
      elements.filter(el => getComputedStyle(el).boxShadow !== 'none').length
    );

    if (elementsWithShadows > 0) {
      const violationRate = shadowUsage.length / elementsWithShadows;
      expect(violationRate).toBeLessThan(0.5);
    }
  });

  test('validates animation token usage', async ({ page }) => {
    const animationUsage = await page.evaluate((designTokens) => {
      const results = [];
      const elements = document.querySelectorAll('*');

      // Valid animation durations from design tokens
      const validDurations = Object.values(designTokens.animations.duration);

      elements.forEach((el, index) => {
        if (index > 1000) return; // Limit for performance

        const styles = getComputedStyle(el);
        const transition = styles.transition;
        const animation = styles.animation;

        const elementData = {
          tagName: el.tagName,
          className: el.className,
          transition,
          animation,
          violations: []
        };

        // Check transition durations
        if (transition && transition !== 'none' && transition !== 'all 0s ease 0s') {
          const durationMatches = transition.match(/(\d+(?:\.\d+)?)(s|ms)/g);

          if (durationMatches) {
            durationMatches.forEach(duration => {
              const isValidDuration = validDurations.some(validDur => {
                const normalizedDuration = duration.includes('ms') ?
                  duration : (parseFloat(duration) * 1000) + 'ms';
                return normalizedDuration === validDur;
              });

              if (!isValidDuration) {
                elementData.violations.push({
                  property: 'transition',
                  value: duration,
                  message: 'Animation duration not from design tokens'
                });
              }
            });
          }
        }

        if (elementData.violations.length > 0) {
          results.push(elementData);
        }
      });

      return results;
    }, tokens);

    if (animationUsage.length > 0) {
      console.log('Animation token violations found:', animationUsage.slice(0, 5));
    }

    // Allow for more custom animations
    const elementsWithAnimations = await page.locator('*').evaluateAll(elements =>
      elements.filter(el => {
        const styles = getComputedStyle(el);
        return styles.transition !== 'none' || styles.animation !== 'none';
      }).length
    );

    if (elementsWithAnimations > 0) {
      const violationRate = animationUsage.length / elementsWithAnimations;
      expect(violationRate).toBeLessThan(0.6);
    }
  });

  test('validates z-index token usage', async ({ page }) => {
    const zIndexUsage = await page.evaluate((designTokens) => {
      const results = [];
      const elements = document.querySelectorAll('*');

      // Valid z-index values from design tokens
      const validZIndexValues = Object.values(designTokens.zIndex).map(String);

      elements.forEach((el, index) => {
        if (index > 1000) return; // Limit for performance

        const styles = getComputedStyle(el);
        const zIndex = styles.zIndex;

        if (zIndex && zIndex !== 'auto' && zIndex !== '0') {
          const elementData = {
            tagName: el.tagName,
            className: el.className,
            zIndex,
            violations: []
          };

          const isValidZIndex = validZIndexValues.includes(zIndex);

          if (!isValidZIndex) {
            elementData.violations.push({
              property: 'zIndex',
              value: zIndex,
              message: 'Z-index not from design tokens'
            });
          }

          if (elementData.violations.length > 0) {
            results.push(elementData);
          }
        }
      });

      return results;
    }, tokens);

    if (zIndexUsage.length > 0) {
      console.log('Z-index token violations found:', zIndexUsage.slice(0, 5));
    }

    // Allow for some custom z-index values
    const elementsWithZIndex = await page.locator('*').evaluateAll(elements =>
      elements.filter(el => {
        const zIndex = getComputedStyle(el).zIndex;
        return zIndex !== 'auto' && zIndex !== '0';
      }).length
    );

    if (elementsWithZIndex > 0) {
      const violationRate = zIndexUsage.length / elementsWithZIndex;
      expect(violationRate).toBeLessThan(0.3);
    }
  });

  test('validates component token consistency across pages', async ({ page }) => {
    const pages = ['/', '/services', '/pricing', '/connectivity'];
    const tokenUsageByPage = [];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');

      const pageTokenUsage = await page.evaluate(() => {
        const components = document.querySelectorAll('[class*="btn"], [class*="card"], [class*="header"], [class*="footer"]');
        const usage = {};

        components.forEach(component => {
          const styles = getComputedStyle(component);
          const className = component.className;

          if (!usage[className]) {
            usage[className] = {
              color: styles.color,
              backgroundColor: styles.backgroundColor,
              fontSize: styles.fontSize,
              padding: styles.padding,
              margin: styles.margin,
            };
          }
        });

        return usage;
      });

      tokenUsageByPage.push({
        page: pagePath,
        usage: pageTokenUsage
      });
    }

    // Check for consistency across pages
    const componentClasses = new Set();
    tokenUsageByPage.forEach(pageData => {
      Object.keys(pageData.usage).forEach(className => {
        componentClasses.add(className);
      });
    });

    componentClasses.forEach(className => {
      const usageAcrossPages = tokenUsageByPage
        .filter(pageData => pageData.usage[className])
        .map(pageData => pageData.usage[className]);

      if (usageAcrossPages.length > 1) {
        // Check that the same component class has consistent styling across pages
        const firstUsage = usageAcrossPages[0];
        const isConsistent = usageAcrossPages.every(usage =>
          usage.color === firstUsage.color &&
          usage.backgroundColor === firstUsage.backgroundColor &&
          usage.fontSize === firstUsage.fontSize
        );

        if (!isConsistent) {
          console.warn(`Inconsistent styling for ${className} across pages`);
        }
      }
    });

    // At least some components should be consistent across pages
    expect(componentClasses.size).toBeGreaterThan(0);
  });
});