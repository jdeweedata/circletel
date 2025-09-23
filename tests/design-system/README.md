# Design System Validation with Playwright

This comprehensive testing suite validates design system consistency, accessibility compliance, and visual regression across the CircleTel website using Playwright Browser Automation MCP server.

## Overview

The design system validation ensures that:
- ✅ All components use approved design tokens
- ✅ Accessibility standards (WCAG 2.1 AA) are met
- ✅ Visual consistency is maintained across browsers/devices
- ✅ New components/pages follow design system guidelines
- ✅ Brand compliance is enforced

## Quick Start

### 1. Setup
```bash
# Install dependencies and setup validation
npm run ds:setup

# Or manually install Playwright
npm run ds:install
```

### 2. Run Validation
```bash
# Full design system validation
npm run ds:validate full

# Quick component validation
npm run ds:validate components

# Accessibility-only validation
npm run ds:validate accessibility

# Visual regression testing
npm run ds:validate visual
```

### 3. View Results
```bash
# Generate and open test report
npm run ds:report
```

## Testing Scenarios

### Component Validation
Tests individual design system components for:
- Design token usage (colors, typography, spacing)
- Interactive states (hover, focus, disabled)
- Responsive behavior
- Accessibility compliance
- Visual regression

```bash
npm run ds:validate components
```

### Accessibility Validation
Comprehensive WCAG 2.1 AA compliance testing:
- Semantic HTML structure
- Keyboard navigation
- ARIA attributes and roles
- Color contrast ratios
- Screen reader compatibility
- Focus management

```bash
npm run ds:validate accessibility
```

### Design Token Consistency
Validates that all elements use approved design tokens:
- Color consistency across pages
- Typography adherence
- Spacing standardization
- Border radius compliance
- Shadow usage validation
- Animation timing consistency

```bash
npm run ds:validate tokens
```

### Visual Regression Testing
Captures and compares screenshots to detect unintended visual changes:
- Component-level screenshots
- Full-page captures
- Cross-browser comparison
- Responsive breakpoint testing

```bash
npm run ds:validate visual
```

### New Component/Page Validation
Automated workflow for validating new additions:

```bash
# Validate new component
npm run ds:component http://localhost:8080/internal-docs new-button

# Validate new page
npm run ds:page http://localhost:8080/new-page new-landing
```

## Test Structure

```
tests/design-system/
├── components/              # Component-specific tests
│   └── component-validation.spec.ts
├── accessibility/           # WCAG compliance tests
│   └── a11y-validation.spec.ts
├── tokens/                  # Design token consistency
│   └── token-consistency.spec.ts
├── workflows/               # Automated validation workflows
│   └── new-component-validation.spec.ts
└── utils/                   # Shared testing utilities
    └── design-validation.ts
```

## Configuration

### Playwright Configuration
- **File**: `playwright.design-system.config.ts`
- **Multiple projects**: Desktop, Mobile, Tablet, Accessibility, Visual Regression
- **Browsers**: Chrome, Firefox, Safari
- **Devices**: Desktop, Mobile, Tablet viewports

### Environment Variables
```bash
# Component validation
COMPONENT_URL=http://localhost:8080/component-page
COMPONENT_NAME=my-new-component

# Page validation
PAGE_URL=http://localhost:8080/new-page
PAGE_NAME=landing-page

# Debug mode
DESIGN_SYSTEM_DEBUG=true
```

## Design System Utilities

### DesignSystemValidator Class
Core validation utilities:

```typescript
import { createDesignValidator } from '../utils/design-validation';

const validator = createDesignValidator(page);

// Validate colors against design tokens
await validator.validateColors();

// Check typography compliance
await validator.validateTypography();

// Test responsive behavior
await validator.validateResponsiveness();

// Capture visual regression screenshots
await validator.captureVisualRegression('component-name');

// Comprehensive accessibility audit
await validator.validateAccessibility();
```

### Validation Functions

```typescript
import { validateDesignSystem } from '../utils/design-validation';

// Run all validations
await validateDesignSystem(page, {
  checkColors: true,
  checkTypography: true,
  checkSpacing: true,
  checkAccessibility: true,
  checkResponsiveness: true,
  visualRegression: true,
});
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Design System Validation

on: [push, pull_request]

jobs:
  design-system:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npm run ds:install

      - name: Run design system tests
        run: npm run ds:validate full

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: design-system-report
          path: test-results/
```

### Pre-commit Hook
Automatically installed with `npm run ds:setup`:
```bash
#!/bin/sh
echo "Running design system validation..."
npm run ds:validate components
if [ $? -ne 0 ]; then
  echo "❌ Design system validation failed."
  exit 1
fi
echo "✅ Design system validation passed!"
```

## Best Practices

### 1. Component Development
- Run validation during development: `npm run ds:validate components`
- Update visual baselines when intentionally changing appearance: `npm run ds:update-baselines`
- Test across multiple browsers before committing

### 2. Design Token Usage
- Always use design system tokens instead of custom values
- Check token consistency: `npm run ds:validate tokens`
- Validate new tokens against existing patterns

### 3. Accessibility
- Test with keyboard navigation
- Verify screen reader compatibility
- Maintain proper heading hierarchy
- Ensure adequate color contrast

### 4. Visual Regression
- Keep baseline screenshots up to date
- Review visual changes carefully
- Test responsive behavior across breakpoints

## Troubleshooting

### Common Issues

**Test Failures**:
```bash
# View detailed error report
npm run ds:report
```

**Visual Regression Mismatches**:
```bash
# Update baselines after intentional changes
npm run ds:update-baselines
```

**Accessibility Violations**:
- Check the HTML report for specific ARIA/semantic issues
- Use browser dev tools accessibility inspector
- Test with screen readers

**Performance Issues**:
```bash
# Run with debug mode for more details
DESIGN_SYSTEM_DEBUG=true npm run ds:validate full
```

### Debug Mode
Enable detailed logging and artifact retention:
```bash
DESIGN_SYSTEM_DEBUG=true npm run ds:validate components
```

## VS Code Integration

The setup script installs VS Code tasks:
- **Ctrl+Shift+P** → "Tasks: Run Task" → "Design System: Full Validation"
- **Ctrl+Shift+P** → "Tasks: Run Task" → "Design System: Component Validation"
- **Ctrl+Shift+P** → "Tasks: Run Task" → "Design System: Accessibility Check"

## Reporting

### HTML Report
Interactive report with screenshots and detailed results:
```bash
npm run ds:report
# Opens: test-results/design-system-report/index.html
```

### JSON Report
Machine-readable results for CI/CD:
```bash
# Located at: test-results/design-system-results.json
```

### JUnit Report
For integration with CI systems:
```bash
# Located at: test-results/design-system-junit.xml
```

## Contributing

### Adding New Tests
1. Create test files in appropriate directories
2. Use the `DesignSystemValidator` utilities
3. Follow existing naming conventions
4. Include both positive and negative test cases

### Extending Validation
1. Add new validation methods to `design-validation.ts`
2. Create corresponding test scenarios
3. Update configuration if needed
4. Document new validation rules

## Validation Rules

### Design Tokens
- ✅ Colors must use approved palette
- ✅ Typography must use Inter/Space Mono fonts
- ✅ Spacing must use standardized scale
- ✅ Border radius must use token values
- ✅ Shadows must use approved shadows
- ✅ Animations must use standard durations

### Accessibility
- ✅ WCAG 2.1 AA compliance
- ✅ Proper heading hierarchy (h1→h2→h3)
- ✅ Alt text for all images
- ✅ Form labels for all inputs
- ✅ Keyboard navigation support
- ✅ Focus indicators on interactive elements
- ✅ Minimum touch target sizes (44px)

### Brand Compliance
- ✅ CircleTel logo usage
- ✅ Brand color implementation (#F5831F)
- ✅ Consistent brand messaging
- ✅ Proper logo placement and sizing

### Performance
- ✅ Page load time < 3 seconds
- ✅ Cumulative Layout Shift < 0.1
- ✅ No horizontal scrollbars on mobile
- ✅ Optimized image formats

This validation suite ensures the CircleTel design system maintains consistency, accessibility, and quality across all components and pages.