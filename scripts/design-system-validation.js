#!/usr/bin/env node

/**
 * Design System Validation Scripts
 *
 * Helper scripts for running design system validation tests
 * in different scenarios and configurations
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n${description}...`, 'cyan');
  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    log(`✓ ${description} completed successfully`, 'green');
    return true;
  } catch (error) {
    log(`✗ ${description} failed`, 'red');
    return false;
  }
}

// Validation scenarios
const scenarios = {
  // Full design system validation
  full: {
    description: 'Full Design System Validation',
    command: 'npx playwright test --config=playwright.design-system.config.ts',
  },

  // Quick component validation
  components: {
    description: 'Component Validation',
    command: 'npx playwright test --config=playwright.design-system.config.ts tests/design-system/components/',
  },

  // Accessibility-only validation
  accessibility: {
    description: 'Accessibility Validation',
    command: 'npx playwright test --config=playwright.design-system.config.ts tests/design-system/accessibility/',
  },

  // Token consistency validation
  tokens: {
    description: 'Design Token Consistency',
    command: 'npx playwright test --config=playwright.design-system.config.ts tests/design-system/tokens/',
  },

  // Visual regression testing
  visual: {
    description: 'Visual Regression Testing',
    command: 'npx playwright test --config=playwright.design-system.config.ts --project="Visual Regression"',
  },

  // New component validation
  'new-component': {
    description: 'New Component Validation',
    command: 'npx playwright test --config=playwright.design-system.config.ts tests/design-system/workflows/new-component-validation.spec.ts',
  },

  // Mobile-focused validation
  mobile: {
    description: 'Mobile Design Validation',
    command: 'npx playwright test --config=playwright.design-system.config.ts --project="Mobile Chrome" --project="Mobile Safari"',
  },

  // Cross-browser validation
  browsers: {
    description: 'Cross-Browser Validation',
    command: 'npx playwright test --config=playwright.design-system.config.ts --project="Desktop Chrome" --project="Desktop Firefox" --project="Desktop Safari"',
  },
};

// Helper functions
function validateNewComponent(componentUrl, componentName) {
  log(`\nValidating new component: ${componentName}`, 'bright');
  log(`Component URL: ${componentUrl}`, 'blue');

  const env = {
    ...process.env,
    COMPONENT_URL: componentUrl,
    COMPONENT_NAME: componentName,
  };

  try {
    execSync(scenarios['new-component'].command, {
      stdio: 'inherit',
      cwd: process.cwd(),
      env,
    });
    log(`✓ Component ${componentName} validation completed`, 'green');
    return true;
  } catch (error) {
    log(`✗ Component ${componentName} validation failed`, 'red');
    return false;
  }
}

function validateNewPage(pageUrl, pageName) {
  log(`\nValidating new page: ${pageName}`, 'bright');
  log(`Page URL: ${pageUrl}`, 'blue');

  const env = {
    ...process.env,
    PAGE_URL: pageUrl,
    PAGE_NAME: pageName,
  };

  try {
    execSync(scenarios['new-component'].command, {
      stdio: 'inherit',
      cwd: process.cwd(),
      env,
    });
    log(`✓ Page ${pageName} validation completed`, 'green');
    return true;
  } catch (error) {
    log(`✗ Page ${pageName} validation failed`, 'red');
    return false;
  }
}

function generateReport() {
  log('\nGenerating Design System Validation Report...', 'cyan');

  const reportPath = path.join(process.cwd(), 'test-results', 'design-system-report');

  if (fs.existsSync(reportPath)) {
    log(`Report available at: ${reportPath}/index.html`, 'green');
    log('Open the report in your browser to view detailed results', 'blue');
  } else {
    log('No report found. Run tests first to generate a report.', 'yellow');
  }
}

function installDependencies() {
  log('\nInstalling Playwright dependencies...', 'cyan');
  return runCommand('npx playwright install', 'Playwright installation');
}

function updateBaselines() {
  log('\nUpdating visual regression baselines...', 'cyan');
  return runCommand(
    'npx playwright test --config=playwright.design-system.config.ts --update-snapshots',
    'Baseline update'
  );
}

// Main execution logic
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    log('Design System Validation Tool', 'bright');
    log('===============================\n', 'bright');
    log('Available commands:', 'blue');
    log('  npm run ds:validate [scenario]    - Run validation tests', 'cyan');
    log('  npm run ds:component <url> <name> - Validate new component', 'cyan');
    log('  npm run ds:page <url> <name>      - Validate new page', 'cyan');
    log('  npm run ds:report                 - Generate validation report', 'cyan');
    log('  npm run ds:install                - Install dependencies', 'cyan');
    log('  npm run ds:update-baselines       - Update visual baselines', 'cyan');
    log('\nValidation scenarios:', 'blue');
    Object.keys(scenarios).forEach(key => {
      log(`  ${key.padEnd(15)} - ${scenarios[key].description}`, 'cyan');
    });
    return;
  }

  switch (command) {
    case 'validate':
      const scenario = args[1] || 'full';
      if (scenarios[scenario]) {
        runCommand(scenarios[scenario].command, scenarios[scenario].description);
      } else {
        log(`Unknown scenario: ${scenario}`, 'red');
        log(`Available scenarios: ${Object.keys(scenarios).join(', ')}`, 'yellow');
      }
      break;

    case 'component':
      const componentUrl = args[1];
      const componentName = args[2];
      if (!componentUrl || !componentName) {
        log('Usage: npm run ds:component <url> <name>', 'red');
        return;
      }
      validateNewComponent(componentUrl, componentName);
      break;

    case 'page':
      const pageUrl = args[1];
      const pageName = args[2];
      if (!pageUrl || !pageName) {
        log('Usage: npm run ds:page <url> <name>', 'red');
        return;
      }
      validateNewPage(pageUrl, pageName);
      break;

    case 'report':
      generateReport();
      break;

    case 'install':
      installDependencies();
      break;

    case 'update-baselines':
      updateBaselines();
      break;

    default:
      log(`Unknown command: ${command}`, 'red');
      log('Run without arguments to see available commands', 'yellow');
  }
}

// Git hooks integration
function setupGitHooks() {
  const preCommitHook = `#!/bin/sh
# Design System Pre-commit Hook
# Validates design system compliance before commits

echo "Running design system validation..."

# Run quick validation on staged files
npm run ds:validate components

if [ $? -ne 0 ]; then
  echo "❌ Design system validation failed. Please fix issues before committing."
  exit 1
fi

echo "✅ Design system validation passed!"
`;

  const hookPath = path.join(process.cwd(), '.git', 'hooks', 'pre-commit');

  try {
    fs.writeFileSync(hookPath, preCommitHook, { mode: 0o755 });
    log('✓ Git pre-commit hook installed', 'green');
  } catch (error) {
    log('⚠ Could not install git hook (optional)', 'yellow');
  }
}

// VS Code integration
function generateVSCodeTasks() {
  const vscodeDir = path.join(process.cwd(), '.vscode');
  const tasksFile = path.join(vscodeDir, 'tasks.json');

  const tasks = {
    version: '2.0.0',
    tasks: [
      {
        label: 'Design System: Full Validation',
        type: 'shell',
        command: 'node scripts/design-system-validation.js validate full',
        group: 'test',
        presentation: {
          echo: true,
          reveal: 'always',
          focus: false,
          panel: 'shared',
        },
        problemMatcher: [],
      },
      {
        label: 'Design System: Component Validation',
        type: 'shell',
        command: 'node scripts/design-system-validation.js validate components',
        group: 'test',
        presentation: {
          echo: true,
          reveal: 'always',
          focus: false,
          panel: 'shared',
        },
        problemMatcher: [],
      },
      {
        label: 'Design System: Accessibility Check',
        type: 'shell',
        command: 'node scripts/design-system-validation.js validate accessibility',
        group: 'test',
        presentation: {
          echo: true,
          reveal: 'always',
          focus: false,
          panel: 'shared',
        },
        problemMatcher: [],
      },
    ],
  };

  try {
    if (!fs.existsSync(vscodeDir)) {
      fs.mkdirSync(vscodeDir);
    }

    fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2));
    log('✓ VS Code tasks configured', 'green');
  } catch (error) {
    log('⚠ Could not configure VS Code tasks (optional)', 'yellow');
  }
}

// Setup command for initial configuration
if (process.argv.includes('--setup')) {
  log('Setting up design system validation...', 'bright');
  installDependencies();
  setupGitHooks();
  generateVSCodeTasks();
  log('\n✅ Design system validation setup complete!', 'green');
  log('\nNext steps:', 'blue');
  log('1. Run: npm run ds:validate full', 'cyan');
  log('2. Open test report: test-results/design-system-report/index.html', 'cyan');
  log('3. Configure CI/CD with these tests', 'cyan');
} else {
  main();
}

module.exports = {
  validateNewComponent,
  validateNewPage,
  generateReport,
  scenarios,
};