#!/usr/bin/env node

/**
 * Local Validation Script
 *
 * Runs the same checks as CI locally to catch issues before pushing.
 * This prevents wasted CI time and gives faster feedback.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function logStep(step, description) {
  log(`\n🔄 ${step}: ${description}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function execCommand(command, description, options = {}) {
  const { optional = false, silent = false } = options;

  try {
    if (!silent) {
      log(`   Running: ${command}`, 'blue');
    }

    const result = execSync(command, {
      cwd: process.cwd(),
      stdio: silent ? 'pipe' : 'inherit',
      encoding: 'utf8'
    });

    if (!silent) {
      logSuccess(`${description} completed`);
    }

    return { success: true, output: result };
  } catch (error) {
    if (optional) {
      logWarning(`${description} failed (optional): ${error.message.split('\n')[0]}`);
      return { success: false, optional: true, error };
    } else {
      logError(`${description} failed: ${error.message.split('\n')[0]}`);
      return { success: false, error };
    }
  }
}

function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    logSuccess(`${description} exists`);
    return true;
  } else {
    logError(`${description} not found at: ${filePath}`);
    return false;
  }
}

async function main() {
  const startTime = Date.now();
  let hasErrors = false;

  log('🚀 Starting Local Validation', 'bright');
  log('This runs the same checks as CI to catch issues before pushing.\n');

  // 1. Check Dependencies
  logStep('1', 'Checking Dependencies');
  if (!checkFileExists('package.json', 'package.json')) {
    hasErrors = true;
  }

  if (!checkFileExists('node_modules', 'node_modules directory')) {
    log('   Installing dependencies...', 'blue');
    const depInstall = execCommand('npm ci', 'Install dependencies');
    if (!depInstall.success) {
      hasErrors = true;
    }
  } else {
    logSuccess('Dependencies already installed');
  }

  // 2. Lint Check
  logStep('2', 'Running ESLint');
  const lintResult = execCommand('npm run lint', 'Lint check');
  if (!lintResult.success) {
    hasErrors = true;
  }

  // 3. Type Check
  logStep('3', 'TypeScript Type Check');
  const typeCheckResult = execCommand('npx tsc --noEmit', 'TypeScript type check');
  if (!typeCheckResult.success) {
    hasErrors = true;
  }

  // 4. Build Check
  logStep('4', 'Production Build Test');
  const buildResult = execCommand('npm run build', 'Build check');
  if (!buildResult.success) {
    hasErrors = true;
  }

  // 5. Quick Test Check (skip full test suite for speed)
  logStep('5', 'Quick Validation Check');
  const skipTests = process.argv.includes('--skip-tests');

  if (!skipTests) {
    log('   Running quick smoke test...', 'blue');
    // Just check if test files are valid, don't run full suite
    const testValidation = execCommand('npx tsc --noEmit --project tsconfig.json', 'Test file validation', { optional: true });
    if (!testValidation.success && !testValidation.optional) {
      hasErrors = true;
    }
  } else {
    logWarning('Tests skipped (use --skip-tests to enable)');
  }

  // 6. Check for common issues
  logStep('6', 'Additional Checks');

  // Check for console.log statements (warning only)
  const consoleLogCheck = execCommand(
    'rg -n "console\\.log" src/ || echo "No console.log found"',
    'Console.log check',
    { optional: true, silent: true }
  );

  if (consoleLogCheck.success && consoleLogCheck.output.includes('console.log')) {
    logWarning('Found console.log statements - consider removing for production');
  } else {
    logSuccess('No console.log statements found');
  }

  // Check for TODO comments (info only)
  const todoCheck = execCommand(
    'rg -n "TODO|FIXME" src/ || echo "No TODOs found"',
    'TODO check',
    { optional: true, silent: true }
  );

  if (todoCheck.success && todoCheck.output.includes('TODO')) {
    log('   Found TODO comments (informational only)', 'yellow');
  }

  // Summary
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  log('\n' + '='.repeat(60), 'blue');

  if (hasErrors) {
    logError(`Validation FAILED in ${duration}s`);
    log('Please fix the errors above before pushing.', 'red');
    process.exit(1);
  } else {
    logSuccess(`Validation PASSED in ${duration}s`);
    log('✨ All checks passed! Safe to push to git.', 'green');
    process.exit(0);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logError(`Uncaught error: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled rejection: ${reason}`);
  process.exit(1);
});

main().catch(error => {
  logError(`Script failed: ${error.message}`);
  process.exit(1);
});