#!/usr/bin/env npx ts-node

/**
 * PM Agent Validation Script
 *
 * Comprehensive validation of PM Agent capabilities including:
 * - Spec generation for multiple complexity levels
 * - Output format validation
 * - Story point estimation verification
 * - Integration method testing
 *
 * @example
 * ```bash
 * npx ts-node scripts/agents/validate-pm-agent.ts
 * npx ts-node scripts/agents/validate-pm-agent.ts --verbose
 * npx ts-node scripts/agents/validate-pm-agent.ts --output report.md
 * ```
 *
 * @module scripts/agents/validate-pm-agent
 */

import * as fs from 'fs';
import * as path from 'path';
import { PMAgent, type SpecOutput } from '../../lib/agents/pm';

// ============================================================================
// Types
// ============================================================================

interface ValidationResult {
  name: string;
  passed: boolean;
  details: string;
  duration?: number;
  error?: string;
}

interface TestCase {
  name: string;
  description: string;
  complexity: 'simple' | 'medium' | 'complex';
  expectedPointRange: [number, number];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface ValidationReport {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  duration: number;
  results: ValidationResult[];
  generatedSpecs: Array<{
    testCase: string;
    specId: string;
    points: number;
    filesCreated: number;
    riskLevel: string;
  }>;
}

// ============================================================================
// Console Styling
// ============================================================================

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function log(message: string, color: keyof typeof colors = 'reset'): void {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(title: string): void {
  console.log('');
  log('═'.repeat(60), 'cyan');
  log(` ${title}`, 'cyan');
  log('═'.repeat(60), 'cyan');
  console.log('');
}

function logResult(result: ValidationResult): void {
  const icon = result.passed ? '✓' : '✗';
  const color = result.passed ? 'green' : 'red';
  const duration = result.duration ? ` (${result.duration}ms)` : '';
  log(`${icon} ${result.name}${duration}`, color);
  if (!result.passed && result.error) {
    log(`  Error: ${result.error}`, 'dim');
  }
}

// ============================================================================
// Test Cases
// ============================================================================

const TEST_CASES: TestCase[] = [
  {
    name: 'Simple Feature',
    description: 'Add SMS notifications for order status updates',
    complexity: 'simple',
    expectedPointRange: [5, 21],
    priority: 'low',
  },
  {
    name: 'Medium Feature',
    description:
      'Add customer analytics dashboard with usage charts, export functionality, and date range filtering',
    complexity: 'medium',
    expectedPointRange: [13, 55],
    priority: 'medium',
  },
  {
    name: 'Complex Feature',
    description:
      'Implement real-time chat support system with AI assistant integration, ticket management, agent dashboard, chat history, and multi-channel support (web, mobile, WhatsApp)',
    complexity: 'complex',
    expectedPointRange: [34, 150],
    priority: 'high',
  },
];

// ============================================================================
// Validation Functions
// ============================================================================

async function validateSpecGeneration(
  agent: PMAgent,
  testCase: TestCase
): Promise<{ result: ValidationResult; spec?: SpecOutput }> {
  const startTime = Date.now();

  try {
    const spec = await agent.generateSpec({
      description: testCase.description,
      priority: testCase.priority,
    });

    const duration = Date.now() - startTime;

    // Validate required fields
    const validations: string[] = [];

    if (!spec.specId) validations.push('Missing specId');
    if (!spec.specContent) validations.push('Missing specContent');
    if (!spec.tasksContent) validations.push('Missing tasksContent');
    if (!spec.readmeContent) validations.push('Missing readmeContent');
    if (spec.estimatedPoints <= 0) validations.push('Invalid estimatedPoints');

    // Validate point range
    const [minPoints, maxPoints] = testCase.expectedPointRange;
    if (spec.estimatedPoints < minPoints || spec.estimatedPoints > maxPoints) {
      validations.push(
        `Points ${spec.estimatedPoints} outside expected range [${minPoints}-${maxPoints}]`
      );
    }

    // Validate spec content structure
    if (!spec.specContent.includes('Overview')) {
      validations.push('Spec missing Overview section');
    }
    if (!spec.specContent.includes('User Stor')) {
      validations.push('Spec missing User Stories section');
    }

    // Validate tasks content structure
    if (!spec.tasksContent.includes('Task Group')) {
      validations.push('Tasks missing Task Group section');
    }

    const passed = validations.length === 0;

    return {
      result: {
        name: `${testCase.name} Generation`,
        passed,
        details: passed
          ? `Generated ${spec.estimatedPoints} points, ${spec.affectedFiles.length} affected files`
          : validations.join('; '),
        duration,
        error: passed ? undefined : validations.join('; '),
      },
      spec,
    };
  } catch (error) {
    return {
      result: {
        name: `${testCase.name} Generation`,
        passed: false,
        details: 'Generation failed',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

function validateSpecFormat(spec: SpecOutput, testCase: TestCase): ValidationResult {
  const validations: string[] = [];

  // Validate specId format (YYYYMMDD-feature-name)
  if (!/^\d{8}-[\w-]+$/.test(spec.specId)) {
    validations.push(`Invalid specId format: ${spec.specId}`);
  }

  // Validate content sections
  const requiredSections = ['Overview', 'User Stor', 'Acceptance Criteria'];
  requiredSections.forEach((section) => {
    if (!spec.specContent.includes(section)) {
      validations.push(`Missing section: ${section}`);
    }
  });

  // Validate tasks sections
  if (!spec.tasksContent.includes('Story Points')) {
    validations.push('Tasks missing Story Points');
  }

  // Validate metadata
  if (!spec.metadata.generatedAt) {
    validations.push('Missing generation timestamp');
  }
  if (spec.metadata.generationTime <= 0) {
    validations.push('Invalid generation time');
  }

  // Validate impact analysis
  if (!spec.impact.riskLevel) {
    validations.push('Missing risk level');
  }
  if (!['low', 'medium', 'high'].includes(spec.impact.riskLevel)) {
    validations.push(`Invalid risk level: ${spec.impact.riskLevel}`);
  }

  return {
    name: `${testCase.name} Format Validation`,
    passed: validations.length === 0,
    details: validations.length === 0 ? 'All format checks passed' : validations.join('; '),
    error: validations.length > 0 ? validations.join('; ') : undefined,
  };
}

function validateStoryPoints(spec: SpecOutput, testCase: TestCase): ValidationResult {
  const validations: string[] = [];

  // Check Fibonacci scale
  const validFibonacci = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];

  // Validate total is reasonable
  if (spec.estimatedPoints <= 0) {
    validations.push('Total points must be positive');
  }

  // Check range based on complexity
  const [min, max] = testCase.expectedPointRange;
  if (spec.estimatedPoints < min) {
    validations.push(`Points ${spec.estimatedPoints} below minimum ${min} for ${testCase.complexity}`);
  }
  if (spec.estimatedPoints > max) {
    validations.push(`Points ${spec.estimatedPoints} above maximum ${max} for ${testCase.complexity}`);
  }

  return {
    name: `${testCase.name} Story Point Validation`,
    passed: validations.length === 0,
    details:
      validations.length === 0
        ? `${spec.estimatedPoints} points (expected ${min}-${max})`
        : validations.join('; '),
    error: validations.length > 0 ? validations.join('; ') : undefined,
  };
}

async function validateQuickAnalysis(agent: PMAgent): Promise<ValidationResult> {
  const startTime = Date.now();

  try {
    const result = await agent.quickAnalysis('Add simple test feature');

    const validations: string[] = [];

    if (!result.codebase) validations.push('Missing codebase analysis');
    if (!result.impact) validations.push('Missing impact analysis');
    if (result.estimatedPoints <= 0) validations.push('Invalid estimated points');

    if (!result.codebase.techStack.framework) {
      validations.push('Missing framework detection');
    }

    return {
      name: 'Quick Analysis',
      passed: validations.length === 0,
      details: validations.length === 0 ? 'Quick analysis working correctly' : validations.join('; '),
      duration: Date.now() - startTime,
      error: validations.length > 0 ? validations.join('; ') : undefined,
    };
  } catch (error) {
    return {
      name: 'Quick Analysis',
      passed: false,
      details: 'Quick analysis failed',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function validateAgainstExistingSpecs(spec: SpecOutput): ValidationResult {
  const validations: string[] = [];

  // Check if existing specs directory exists
  const existingSpecsDir = path.join(process.cwd(), 'agent-os/specs');

  if (fs.existsSync(existingSpecsDir)) {
    const existingSpecs = fs.readdirSync(existingSpecsDir).filter((f) => {
      const fullPath = path.join(existingSpecsDir, f);
      return fs.statSync(fullPath).isDirectory() && !f.startsWith('test-');
    });

    if (existingSpecs.length > 0) {
      // Compare format with first existing spec
      const refSpec = existingSpecs[0];
      const refSpecPath = path.join(existingSpecsDir, refSpec, 'SPEC.md');

      if (fs.existsSync(refSpecPath)) {
        const refContent = fs.readFileSync(refSpecPath, 'utf-8');

        // Check for similar sections
        const refSections = ['Overview', 'User Stor', 'Technical'];
        const missingSections = refSections.filter(
          (s) => refContent.includes(s) && !spec.specContent.includes(s)
        );

        if (missingSections.length > 0) {
          validations.push(`Missing sections found in ${refSpec}: ${missingSections.join(', ')}`);
        }
      }
    }
  }

  return {
    name: 'Format Comparison with Existing Specs',
    passed: validations.length === 0,
    details: validations.length === 0 ? 'Format matches existing specs' : validations.join('; '),
    error: validations.length > 0 ? validations.join('; ') : undefined,
  };
}

// ============================================================================
// Report Generation
// ============================================================================

function generateMarkdownReport(report: ValidationReport): string {
  const lines: string[] = [];

  lines.push('# PM Agent Validation Report');
  lines.push('');
  lines.push(`**Generated**: ${report.timestamp}`);
  lines.push(`**Duration**: ${report.duration}ms`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total Tests | ${report.totalTests} |`);
  lines.push(`| Passed | ${report.passed} |`);
  lines.push(`| Failed | ${report.failed} |`);
  lines.push(`| Pass Rate | ${((report.passed / report.totalTests) * 100).toFixed(1)}% |`);
  lines.push('');

  // Generated Specs
  if (report.generatedSpecs.length > 0) {
    lines.push('## Generated Specs');
    lines.push('');
    lines.push('| Test Case | Spec ID | Points | Files | Risk |');
    lines.push('|-----------|---------|--------|-------|------|');
    report.generatedSpecs.forEach((spec) => {
      lines.push(
        `| ${spec.testCase} | ${spec.specId} | ${spec.points} | ${spec.filesCreated} | ${spec.riskLevel} |`
      );
    });
    lines.push('');
  }

  // Detailed Results
  lines.push('## Detailed Results');
  lines.push('');

  report.results.forEach((result) => {
    const icon = result.passed ? '✅' : '❌';
    const duration = result.duration ? ` (${result.duration}ms)` : '';
    lines.push(`### ${icon} ${result.name}${duration}`);
    lines.push('');
    lines.push(`**Status**: ${result.passed ? 'PASSED' : 'FAILED'}`);
    lines.push('');
    lines.push(`**Details**: ${result.details}`);
    if (result.error) {
      lines.push('');
      lines.push(`**Error**: ${result.error}`);
    }
    lines.push('');
  });

  // Footer
  lines.push('---');
  lines.push('');
  lines.push('*Generated by PM Agent Validation Script*');

  return lines.join('\n');
}

// ============================================================================
// Main Execution
// ============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');
  const outputIndex = args.indexOf('--output');
  const outputFile = outputIndex >= 0 ? args[outputIndex + 1] : null;

  logHeader('PM Agent Validation');

  const startTime = Date.now();
  const results: ValidationResult[] = [];
  const generatedSpecs: ValidationReport['generatedSpecs'] = [];

  // Initialize agent
  log('Initializing PM Agent...', 'dim');
  const agent = PMAgent.forAPI();
  await agent.start();

  try {
    // Run spec generation tests
    logHeader('Spec Generation Tests');

    for (const testCase of TEST_CASES) {
      log(`\nTesting: ${testCase.name} (${testCase.complexity})`, 'blue');
      log(`Description: ${testCase.description.substring(0, 60)}...`, 'dim');

      const { result: genResult, spec } = await validateSpecGeneration(agent, testCase);
      results.push(genResult);
      logResult(genResult);

      if (spec) {
        // Format validation
        const formatResult = validateSpecFormat(spec, testCase);
        results.push(formatResult);
        logResult(formatResult);

        // Story point validation
        const pointResult = validateStoryPoints(spec, testCase);
        results.push(pointResult);
        logResult(pointResult);

        // Compare with existing specs
        const compareResult = validateAgainstExistingSpecs(spec);
        results.push(compareResult);
        logResult(compareResult);

        generatedSpecs.push({
          testCase: testCase.name,
          specId: spec.specId,
          points: spec.estimatedPoints,
          filesCreated: spec.affectedFiles.length,
          riskLevel: spec.impact.riskLevel,
        });
      }
    }

    // Quick analysis test
    logHeader('Quick Analysis Test');
    const quickResult = await validateQuickAnalysis(agent);
    results.push(quickResult);
    logResult(quickResult);

    // Factory method tests
    logHeader('Factory Method Tests');

    const factoryTests = [
      { name: 'PMAgent.create()', fn: () => PMAgent.create() },
      { name: 'PMAgent.forDevelopment()', fn: () => PMAgent.forDevelopment() },
      { name: 'PMAgent.forAPI()', fn: () => PMAgent.forAPI() },
      {
        name: 'PMAgent.withConfig()',
        fn: () => PMAgent.withConfig({ verbose: true }),
      },
    ];

    for (const test of factoryTests) {
      try {
        const instance = test.fn();
        const passed = instance instanceof PMAgent;
        results.push({
          name: test.name,
          passed,
          details: passed ? 'Created successfully' : 'Failed to create instance',
        });
        logResult(results[results.length - 1]);
      } catch (error) {
        results.push({
          name: test.name,
          passed: false,
          details: 'Factory method failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        logResult(results[results.length - 1]);
      }
    }
  } finally {
    await agent.stop();
  }

  // Generate report
  const report: ValidationReport = {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passed: results.filter((r) => r.passed).length,
    failed: results.filter((r) => !r.passed).length,
    duration: Date.now() - startTime,
    results,
    generatedSpecs,
  };

  // Print summary
  logHeader('Validation Summary');

  log(`Total Tests: ${report.totalTests}`, 'white');
  log(`Passed: ${report.passed}`, 'green');
  log(`Failed: ${report.failed}`, report.failed > 0 ? 'red' : 'green');
  log(`Duration: ${report.duration}ms`, 'dim');
  log(`Pass Rate: ${((report.passed / report.totalTests) * 100).toFixed(1)}%`, 'cyan');

  // Save report if output specified
  if (outputFile) {
    const markdown = generateMarkdownReport(report);
    fs.writeFileSync(outputFile, markdown, 'utf-8');
    log(`\nReport saved to: ${outputFile}`, 'green');
  }

  // Exit with appropriate code
  const exitCode = report.failed > 0 ? 1 : 0;

  if (report.failed > 0) {
    log('\n⚠️  Some validations failed!', 'yellow');
  } else {
    log('\n✅ All validations passed!', 'green');
  }

  process.exit(exitCode);
}

main().catch((error) => {
  log(`\nFatal error: ${error.message}`, 'red');
  process.exit(1);
});
