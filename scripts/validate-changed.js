#!/usr/bin/env node

/**
 * Smart Validation Script - Only validates changed files
 *
 * This script only runs checks on files that have been modified,
 * making it much faster for incremental development.
 */

import { execSync } from 'child_process';
import fs from 'fs';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
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

function getChangedFiles() {
  try {
    // Get staged files
    const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8', stdio: 'pipe' })
      .trim().split('\n').filter(f => f);

    // Get unstaged files
    const unstagedFiles = execSync('git diff --name-only', { encoding: 'utf8', stdio: 'pipe' })
      .trim().split('\n').filter(f => f);

    // Get untracked files
    const untrackedFiles = execSync('git ls-files --others --exclude-standard', { encoding: 'utf8', stdio: 'pipe' })
      .trim().split('\n').filter(f => f);

    // Combine all changed files
    const allChangedFiles = [...new Set([...stagedFiles, ...unstagedFiles, ...untrackedFiles])];

    return allChangedFiles.filter(file =>
      file &&
      fs.existsSync(file) &&
      (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx'))
    );
  } catch (error) {
    log('   Could not get changed files, falling back to full validation', 'yellow');
    return null;
  }
}

async function main() {
  const startTime = Date.now();
  let hasErrors = false;

  log('⚡ Starting Smart Validation (Changed Files Only)', 'bright');

  // Get changed files
  const changedFiles = getChangedFiles();

  if (!changedFiles || changedFiles.length === 0) {
    log('📄 No TypeScript/JavaScript files changed', 'green');
    log('✨ Validation passed - no files to check!', 'green');
    return;
  }

  log(`\n📁 Found ${changedFiles.length} changed files:`, 'cyan');
  changedFiles.forEach(file => log(`   • ${file}`, 'blue'));

  // 1. Lint only changed files
  logStep('1', 'Linting Changed Files');
  if (changedFiles.length > 0) {
    const lintCommand = `npx eslint ${changedFiles.join(' ')}`;
    const lintResult = execCommand(lintCommand, 'Lint changed files');
    if (!lintResult.success) {
      hasErrors = true;
    }
  }

  // 2. Type check (always run full because of dependencies)
  logStep('2', 'TypeScript Type Check');
  const typeCheckResult = execCommand('npx tsc --noEmit', 'TypeScript type check');
  if (!typeCheckResult.success) {
    hasErrors = true;
  }

  // 3. Build check (only if core files changed)
  const coreFilesChanged = changedFiles.some(file =>
    file.includes('src/') ||
    file.includes('package.json') ||
    file.includes('tsconfig.json') ||
    file.includes('vite.config')
  );

  if (coreFilesChanged) {
    logStep('3', 'Build Check (Core Files Changed)');
    const buildResult = execCommand('npm run build', 'Build check');
    if (!buildResult.success) {
      hasErrors = true;
    }
  } else {
    logStep('3', 'Build Check');
    logSuccess('Skipped - no core files changed');
  }

  // 4. Quick checks for common issues
  logStep('4', 'Quick Code Quality Checks');

  // Check for console.log in changed files
  const changedFilesWithConsole = changedFiles.filter(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      return content.includes('console.log');
    } catch {
      return false;
    }
  });

  if (changedFilesWithConsole.length > 0) {
    logWarning(`Console.log found in: ${changedFilesWithConsole.join(', ')}`);
  } else {
    logSuccess('No console.log statements in changed files');
  }

  // Summary
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  log('\n' + '='.repeat(60), 'blue');

  if (hasErrors) {
    logError(`Smart Validation FAILED in ${duration}s`);
    log('Please fix the errors above before committing.', 'red');
    process.exit(1);
  } else {
    logSuccess(`Smart Validation PASSED in ${duration}s`);
    log(`✨ ${changedFiles.length} files validated! Safe to commit.`, 'green');
    process.exit(0);
  }
}

// Handle errors
process.on('uncaughtException', (error) => {
  logError(`Uncaught error: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logError(`Unhandled rejection: ${reason}`);
  process.exit(1);
});

main().catch(error => {
  logError(`Script failed: ${error.message}`);
  process.exit(1);
});